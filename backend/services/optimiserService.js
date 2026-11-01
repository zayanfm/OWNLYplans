const householdStore = require('../models/householdStore');
const { buildGoals, spareCash } = require('./goalModel');
const { requiredMonthly, addMonthsIso, money } = require('../utils/finance');

const PROTECTION_PREMIUMS = { essential: 28, enhanced: 52 };

// Each plan is a priority order plus how hard it pushes its lead goal. The BTO fund always comes
// first because key collection cannot move; the existing emergency floor already covers several
// months, so its top-up can flex. Retirement goals absorb whatever is left, so money freed by a
// finished goal flows on to them automatically.
const PLAN_DEFINITIONS = [
  {
    id: 'balanced',
    name: 'Balanced',
    tagline: 'Every goal on time, retirement steps up as earlier goals finish',
    order: ['housing', 'education', 'custom', 'emergency'],
    emergencyStretchMonths: 0,
    multipliers: {}
  },
  {
    id: 'home_first',
    name: 'Home first',
    tagline: 'BTO fund finishes early with a cushion for renovation',
    order: ['housing', 'emergency', 'education', 'custom'],
    emergencyStretchMonths: 6,
    multipliers: { housing: 1.15 }
  },
  {
    id: 'education_first',
    name: 'Education first',
    tagline: 'Front-loads education savings while time in the market is longest',
    order: ['housing', 'education', 'custom', 'emergency'],
    emergencyStretchMonths: 6,
    multipliers: { education: 1.5 }
  }
];

const isSink = (goal) => goal.category === 'RETIREMENT';

class OptimiserService {
  /**
   * Interdependent Goal Optimiser (#5). Allocates the investable surplus across goals by
   * priority and deadline, simulating month by month so that money released by a completed
   * goal moves on to the next. Returns one recommended plan and two alternatives; it never
   * selects investments.
   */
  prepare(household, options = {}) {
    const now = options.now || new Date();
    const tier = options.protection?.tier === 'enhanced' ? 'enhanced' : 'essential';
    const premium = options.protection?.enabled === false ? 0 : PROTECTION_PREMIUMS[tier];
    const monthlySurplus = Number(household.financials.monthlySurplus || 0);
    const investable = Math.max(0, monthlySurplus - premium);

    // Only goals the family has confirmed are planned; the rest are reported as needing a decision.
    const allGoals = buildGoals(household, { predictionScenario: options.predictionScenario, includeKeys: options.includeKeys, now });
    const goals = allGoals.filter((goal) => goal.planned);
    const needsDecision = allGoals.filter((goal) => !goal.planned && goal.inputStatus !== 'OFF')
      .map((goal) => ({ key: goal.key, name: goal.name, status: goal.inputStatus }));

    // Spare cash completes as much of the emergency gap as it can, today.
    const emergency = goals.find((goal) => goal.key === 'emergency');
    const lumpSumAmount = emergency ? Math.min(spareCash(household), emergency.shortfall) : 0;
    if (emergency && lumpSumAmount > 0) {
      emergency.currentAmount += lumpSumAmount;
      emergency.shortfall -= lumpSumAmount;
    }
    return { now, premium, monthlySurplus, investable, goals, needsDecision, lumpSumAmount };
  }

  optimise(household, options = {}) {
    const { now, premium, monthlySurplus, investable, goals, needsDecision, lumpSumAmount } = this.prepare(household, options);
    const plans = PLAN_DEFINITIONS.map((definition) => this.simulate(definition, goals, investable, now));
    const recommended = plans.find((plan) => plan.allOnTrack) || plans[0];
    plans.forEach((plan) => { plan.recommended = plan.id === recommended.id; });
    plans.forEach((plan) => { plan.tradeOffs = this.describeTradeOffs(plan, recommended); });

    return {
      monthlySurplus,
      protectionPremium: premium,
      investable,
      lumpSum: lumpSumAmount > 0
        ? { amount: lumpSumAmount, toGoal: 'emergency', reason: `Spare OCBC cash above the emergency fund and a month of working cash tops up the buffer today.` }
        : null,
      recommendedPlanId: recommended.id,
      needsDecision,
      plans
    };
  }

  simulate(definition, sourceGoals, investable, now) {
    // Alternatives may take longer over the emergency top-up than the family's chosen window;
    // every other deadline is the family's own and is never moved.
    const goals = sourceGoals.map((goal) => {
      const stretch = definition.emergencyStretchMonths || 0;
      return goal.key === 'emergency' && stretch
        ? { ...goal, monthsRemaining: goal.monthsRemaining + stretch, deadline: addMonthsIso(goal.monthsRemaining + stretch, now) }
        : { ...goal };
    });
    const ordered = definition.goalOrder
      ? definition.goalOrder.map((key) => goals.find((goal) => goal.key === key)).filter(Boolean)
      : definition.order.flatMap((routeKey) => goals.filter((goal) => goal.routeKey === routeKey));
    const sinks = goals.filter(isSink);
    const horizon = Math.max(...goals.map((goal) => goal.monthsRemaining), 1);

    // Fixed monthly target per prioritised goal, set once at the start of the plan.
    const desired = {};
    ordered.forEach((goal) => {
      const override = definition.overrides?.[goal.key];
      const multiplier = definition.multipliers?.[goal.routeKey] || 1;
      desired[goal.key] = override !== undefined
        ? override
        : Math.ceil(requiredMonthly(goal.currentAmount, goal.targetAmount, goal.monthsRemaining, goal.annualRate) * multiplier);
    });

    const state = Object.fromEntries(goals.map((goal) => [goal.key, {
      balance: goal.currentAmount, firstMonthly: 0, completedAt: goal.currentAmount >= goal.targetAmount ? 0 : null, atDeadline: null
    }]));
    const stepUps = [];
    let unallocatedFirstMonth = 0;

    for (let month = 0; month < horizon; month += 1) {
      let available = investable;
      const allocation = {};

      ordered.forEach((goal) => {
        const open = state[goal.key].completedAt === null;
        const amount = open ? Math.min(available, desired[goal.key]) : 0;
        allocation[goal.key] = amount;
        available -= amount;
      });

      const openSinks = sinks.filter((goal) => state[goal.key].completedAt === null);
      const sinkWeights = openSinks.map((goal) => Math.max(1, requiredMonthly(goal.currentAmount, goal.targetAmount, goal.monthsRemaining, goal.annualRate)));
      const weightTotal = sinkWeights.reduce((sum, weight) => sum + weight, 0);
      openSinks.forEach((goal, index) => {
        allocation[goal.key] = Math.floor(available * sinkWeights[index] / weightTotal);
      });
      // Give any rounding remainder to the first open sink so no dollar is left idle.
      if (openSinks.length) {
        allocation[openSinks[0].key] += available - openSinks.reduce((sum, goal) => sum + allocation[goal.key], 0);
      }
      if (month === 0) {
        unallocatedFirstMonth = available - openSinks.reduce((sum, goal) => sum + allocation[goal.key], 0);
      }

      goals.forEach((goal) => {
        const goalState = state[goal.key];
        const monthly = allocation[goal.key] || 0;
        if (month === 0) goalState.firstMonthly = monthly;
        goalState.balance = goalState.balance * (1 + goal.annualRate / 12) + monthly;
        if (goalState.completedAt === null && goalState.balance >= goal.targetAmount) {
          goalState.completedAt = month + 1;
          if (!isSink(goal) && desired[goal.key] > 0) {
            stepUps.push({
              month: addMonthsIso(month + 1, now),
              fromGoal: goal.key,
              amount: Math.min(desired[goal.key], investable),
              text: `${goal.name} complete: ${money(Math.min(desired[goal.key], investable))}/month moves to retirement`
            });
          }
        }
        if (month + 1 === goal.monthsRemaining) goalState.atDeadline = Math.round(goalState.balance);
      });
    }

    const goalResults = goals.map((goal) => {
      const goalState = state[goal.key];
      const onTrack = goalState.completedAt !== null && goalState.completedAt <= Math.max(goal.monthsRemaining, 1);
      return {
        key: goal.key,
        routeKey: goal.routeKey,
        group: goal.group,
        groupLabel: goal.groupLabel,
        childName: goal.childName || null,
        name: goal.name,
        targetAmount: goal.targetAmount,
        startingAmount: goal.currentAmount,
        deadline: goal.deadline,
        requiredMonthly: goal.requiredMonthly,
        monthlyNow: goalState.firstMonthly,
        completesBy: goalState.completedAt === null ? null : addMonthsIso(goalState.completedAt, now),
        projectedAtDeadline: goalState.atDeadline ?? Math.round(goalState.balance),
        status: onTrack ? 'ON_TRACK' : 'AT_RISK'
      };
    });

    const routeTotals = goalResults.reduce((acc, goal) => {
      acc[goal.routeKey] = (acc[goal.routeKey] || 0) + goal.monthlyNow;
      return acc;
    }, { emergency: 0, housing: 0, education: 0, custom: 0, wealth: 0 });

    return {
      id: definition.id,
      name: definition.name,
      tagline: definition.tagline,
      routes: routeTotals,
      unallocated: unallocatedFirstMonth,
      goals: goalResults,
      stepUps: stepUps.sort((a, b) => a.month.localeCompare(b.month)),
      allOnTrack: goalResults.every((goal) => goal.status === 'ON_TRACK'),
      atRisk: goalResults.filter((goal) => goal.status === 'AT_RISK').map((goal) => goal.key)
    };
  }

  describeTradeOffs(plan, recommended) {
    const find = (target, key) => target.goals.find((goal) => goal.key === key);
    const notes = [];
    plan.goals.forEach((goal) => {
      const base = find(recommended, goal.key);
      if (goal.status === 'AT_RISK') {
        notes.push(`${goal.name} misses its ${goal.deadline} deadline.`);
      } else if (plan.id !== recommended.id && base && goal.completesBy && base.completesBy && goal.completesBy !== base.completesBy && goal.routeKey !== 'wealth') {
        notes.push(`${goal.name} completes ${goal.completesBy < base.completesBy ? 'earlier' : 'later'} (${goal.completesBy} vs ${base.completesBy}).`);
      }
    });
    if (plan.id !== recommended.id) {
      const wealthNow = plan.routes.wealth - recommended.routes.wealth;
      if (Math.abs(wealthNow) >= 10) notes.push(`Retirement starts with ${money(Math.abs(wealthNow))}/month ${wealthNow > 0 ? 'more' : 'less'}.`);
    } else if (plan.stepUps.length) {
      notes.push(`Retirement steps up as earlier goals finish: ${plan.stepUps.map((step) => step.month).join(', ')}.`);
    }
    return notes;
  }

  /**
   * The family's own plan: their priority order and, optionally, their own monthly amounts for
   * any non-retirement goal. Retirement still absorbs the rest, so every dollar stays allocated.
   * The engine reports which goals that leaves late; it never overrides the family's choice.
   */
  customPlan(household, { order = [], monthlyOverrides = {} } = {}, options = {}) {
    const { now, investable, goals, lumpSumAmount } = this.prepare(household, options);
    const prioritisable = goals.filter((goal) => !isSink(goal)).map((goal) => goal.key);
    const unknown = (order || []).filter((key) => !prioritisable.includes(key));
    if (unknown.length) throw this.error(400, `Unknown or unplanned goals in order: ${unknown.join(', ')}`);
    const goalOrder = [...new Set(order || []), ...prioritisable.filter((key) => !(order || []).includes(key))];

    const overrides = {};
    Object.entries(monthlyOverrides || {}).forEach(([key, value]) => {
      const amount = Number(value);
      if (!prioritisable.includes(key)) throw this.error(400, `Monthly amounts can be set for dated goals only; ${key} is not one`);
      if (!Number.isFinite(amount) || amount < 0) throw this.error(400, 'Monthly amounts must be zero or more');
      overrides[key] = Math.round(amount);
    });
    const overrideTotal = Object.values(overrides).reduce((sum, value) => sum + value, 0);
    if (overrideTotal > investable) {
      throw this.error(400, `Monthly amounts add up to ${money(overrideTotal)}, more than the ${money(investable)} available`);
    }

    const recommended = this.optimise(household, options);
    const plan = this.simulate({
      id: 'custom',
      name: 'Our plan',
      tagline: 'Your own priorities and amounts',
      goalOrder,
      overrides,
      multipliers: {}
    }, goals, investable, now);
    const recommendedPlan = recommended.plans.find((item) => item.id === recommended.recommendedPlanId);
    plan.recommended = false;
    plan.tradeOffs = this.describeTradeOffs(plan, recommendedPlan);
    plan.definition = { order: goalOrder, monthlyOverrides: overrides };
    return { investable, lumpSum: lumpSumAmount, plan, recommendedPlanId: recommended.recommendedPlanId };
  }

  // Any plan by id, including the family's saved custom plan.
  findPlan(household, planId, options = {}) {
    if (planId === 'custom') {
      const definition = householdStore.getCustomPlan(household.id);
      if (!definition) throw this.error(404, 'No custom plan has been made yet');
      return this.customPlan(household, definition, options).plan;
    }
    const optimised = this.optimise(household, options);
    return optimised.plans.find((plan) => plan.id === planId) || null;
  }

  error(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  optimiseById(householdId = null, options = {}) {
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) {
      throw new Error('Household not found');
    }
    return this.optimise(household, options);
  }
}

module.exports = new OptimiserService();

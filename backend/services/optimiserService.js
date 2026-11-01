const householdStore = require('../models/householdStore');
const { buildGoals, spareCash } = require('./goalModel');
const contributionService = require('./contributionService');
const { isShared } = require('./contributionService');
const { requiredMonthly, addMonthsIso, money } = require('../utils/finance');

const PROTECTION_PREMIUMS = { essential: 28, enhanced: 52 };

// Each plan is a priority order for the family pot plus how hard it pushes its lead goal. Home
// goals usually come first because key collection cannot move; the existing emergency floor already
// covers several months, so its top-up can flex. Personal goals are funded from each person's
// own money, in deadline order. Money nobody chose to put in, or freed by a finished goal,
// stays free for the family to decide on.
const PLAN_DEFINITIONS = [
  {
    id: 'balanced',
    name: 'Balanced',
    tagline: 'Every shared goal on its own date',
    order: ['housing', 'education', 'custom', 'emergency'],
    emergencyStretchMonths: 0,
    multipliers: {}
  },
  {
    id: 'home_first',
    name: 'Home first',
    tagline: 'Home goals finish early with a cushion for renovation',
    requires: 'housing',
    order: ['housing', 'emergency', 'education', 'custom'],
    emergencyStretchMonths: 6,
    multipliers: { housing: 1.15 }
  },
  {
    id: 'education_first',
    name: 'Education first',
    tagline: 'Education funded first and front-loaded while time in the market is longest',
    requires: 'education',
    order: ['education', 'housing', 'custom', 'emergency'],
    emergencyStretchMonths: 6,
    multipliers: { education: 1.5 }
  }
];

class OptimiserService {
  /**
   * Interdependent Goal Optimiser (#5). Each pot (the family pot and each person's own money)
   * funds its goals by priority and deadline, simulated month by month. Returns one recommended
   * plan and two alternatives for the family pot; it never selects investments and never
   * allocates money the family did not choose to put in.
   */
  prepare(household, options = {}) {
    const now = options.now || new Date();
    const tier = options.protection?.tier === 'enhanced' ? 'enhanced' : 'essential';
    const premium = options.protection?.enabled === false ? 0 : PROTECTION_PREMIUMS[tier];
    const monthlySurplus = Number(household.financials.monthlySurplus || 0);

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

    const contributions = contributionService.summarise(household, goals, { premium, extraShared: options.extraShared || 0 });
    const pots = [
      { id: 'household', label: 'Family pot', available: contributions.familyPot.available },
      ...contributions.people.map((person) => ({
        id: person.member, label: `${String(person.name).split(' ')[0]}'s own goals`, available: person.toPersonal
      }))
    ];
    const investable = pots.reduce((sum, pot) => sum + pot.available, 0);
    return { now, premium, monthlySurplus, investable, goals, needsDecision, lumpSumAmount, contributions, pots };
  }

  optimise(household, options = {}) {
    const { now, premium, monthlySurplus, investable, goals, needsDecision, lumpSumAmount, contributions, pots } = this.prepare(household, options);
    // A plan that puts a kind of goal first is only offered when the family has such a goal.
    const sharedRoutes = new Set(goals.filter((goal) => isShared(goal.owner)).map((goal) => goal.routeKey));
    const plans = PLAN_DEFINITIONS
      .filter((definition) => !definition.requires || sharedRoutes.has(definition.requires))
      .map((definition) => this.simulate(definition, goals, pots, now));
    const recommended = plans.find((plan) => plan.allOnTrack) || plans[0];
    plans.forEach((plan) => { plan.recommended = plan.id === recommended.id; });
    plans.forEach((plan) => { plan.tradeOffs = this.describeTradeOffs(plan, recommended); });

    return {
      monthlySurplus,
      protectionPremium: premium,
      investable,
      contributions,
      lumpSum: lumpSumAmount > 0
        ? { amount: lumpSumAmount, toGoal: 'emergency', reason: `Spare OCBC cash above the emergency fund and a month of working cash tops up the buffer today.` }
        : null,
      recommendedPlanId: recommended.id,
      needsDecision,
      plans
    };
  }

  // Runs one pot month by month: goals in order each take what they need (or the family's own
  // amount) until the pot runs out. What is left, or freed when a goal completes, stays free.
  runPot(pot, ordered, desired, now) {
    const horizon = Math.max(...ordered.map((goal) => goal.monthsRemaining), 1);
    const state = Object.fromEntries(ordered.map((goal) => [goal.key, {
      balance: goal.currentAmount, firstMonthly: 0, completedAt: goal.currentAmount >= goal.targetAmount ? 0 : null, atDeadline: null
    }]));
    const freed = [];
    let freeFirstMonth = pot.available;

    for (let month = 0; month < horizon; month += 1) {
      let available = pot.available;
      ordered.forEach((goal) => {
        const goalState = state[goal.key];
        const amount = goalState.completedAt === null ? Math.min(available, desired[goal.key]) : 0;
        available -= amount;
        if (month === 0) goalState.firstMonthly = amount;
        goalState.balance = goalState.balance * (1 + goal.annualRate / 12) + amount;
        if (goalState.completedAt === null && goalState.balance >= goal.targetAmount) {
          goalState.completedAt = month + 1;
          if (goalState.firstMonthly > 0 && month + 1 < horizon) {
            freed.push({
              month: addMonthsIso(month + 1, now),
              fromGoal: goal.key,
              pot: pot.id,
              amount: goalState.firstMonthly,
              text: `${goal.name} complete: ${money(goalState.firstMonthly)}/month frees up${pot.id === 'household' ? ' in the family pot' : ''}. You decide where it goes`
            });
          }
        }
        if (month + 1 === goal.monthsRemaining) goalState.atDeadline = Math.round(goalState.balance);
      });
      if (month === 0) freeFirstMonth = available;
    }
    return { state, freed, free: freeFirstMonth };
  }

  simulate(definition, sourceGoals, pots, now) {
    // Alternatives may take longer over the emergency top-up than the family's chosen window;
    // every other deadline is the family's own and is never moved.
    const goals = sourceGoals.map((goal) => {
      const stretch = definition.emergencyStretchMonths || 0;
      return goal.key === 'emergency' && stretch
        ? { ...goal, monthsRemaining: goal.monthsRemaining + stretch, deadline: addMonthsIso(goal.monthsRemaining + stretch, now) }
        : { ...goal };
    });
    const sharedGoals = goals.filter((goal) => isShared(goal.owner));
    const sharedOrder = definition.goalOrder
      ? definition.goalOrder.map((key) => sharedGoals.find((goal) => goal.key === key)).filter(Boolean)
      : definition.order.flatMap((routeKey) => sharedGoals.filter((goal) => goal.routeKey === routeKey));
    // Shared goals not covered by the order (e.g. added after a custom order was saved) go last.
    sharedGoals.filter((goal) => !sharedOrder.includes(goal)).forEach((goal) => sharedOrder.push(goal));

    const desired = {};
    goals.forEach((goal) => {
      const override = definition.overrides?.[goal.key];
      const multiplier = isShared(goal.owner) ? (definition.multipliers?.[goal.routeKey] || 1) : 1;
      desired[goal.key] = override !== undefined
        ? override
        : Math.ceil(requiredMonthly(goal.currentAmount, goal.targetAmount, goal.monthsRemaining, goal.annualRate) * multiplier);
    });

    const runs = pots.map((pot) => {
      const ordered = pot.id === 'household'
        ? sharedOrder
        : goals.filter((goal) => goal.owner === pot.id).sort((a, b) => a.deadline.localeCompare(b.deadline));
      return { pot, ...this.runPot(pot, ordered, desired, now) };
    });
    const stateOf = (key) => runs.map((run) => run.state[key]).find(Boolean);

    const goalResults = goals.map((goal) => {
      const goalState = stateOf(goal.key) || { firstMonthly: 0, completedAt: null, balance: goal.currentAmount, atDeadline: null };
      const onTrack = goalState.completedAt !== null && goalState.completedAt <= Math.max(goal.monthsRemaining, 1);
      return {
        key: goal.key,
        routeKey: goal.routeKey,
        group: goal.group,
        groupLabel: goal.groupLabel,
        childName: goal.childName || null,
        owner: goal.owner,
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
      // The order the family pot funds shared goals in, so every plan can be shown ranked.
      priorityOrder: sharedOrder.map((goal) => goal.key),
      pots: runs.map((run) => ({ id: run.pot.id, label: run.pot.label, available: run.pot.available, free: run.free })),
      keptFree: runs.reduce((sum, run) => sum + run.free, 0),
      unallocated: runs.reduce((sum, run) => sum + run.free, 0),
      goals: goalResults,
      stepUps: runs.flatMap((run) => run.freed).sort((a, b) => a.month.localeCompare(b.month)),
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
      const freeChange = plan.keptFree - recommended.keptFree;
      if (Math.abs(freeChange) >= 10) notes.push(`Leaves ${money(Math.abs(freeChange))}/month ${freeChange > 0 ? 'more' : 'less'} free.`);
    } else if (plan.stepUps.length) {
      notes.push(`Money frees up as goals finish (${plan.stepUps.map((step) => step.month).join(', ')}); you decide where it goes.`);
    }
    return notes;
  }

  /**
   * The family's own plan: their priority order for shared goals and, optionally, their own
   * monthly amounts for any shared goal. Whatever they do not assign stays free. The engine
   * reports which goals that leaves late; it never overrides the family's choice.
   */
  customPlan(household, { order = [], monthlyOverrides = {} } = {}, options = {}) {
    const { now, goals, lumpSumAmount, pots } = this.prepare(household, options);
    const familyPot = pots.find((pot) => pot.id === 'household').available;
    const prioritisable = goals.filter((goal) => isShared(goal.owner)).map((goal) => goal.key);
    const unknown = (order || []).filter((key) => !prioritisable.includes(key));
    if (unknown.length) throw this.error(400, `Unknown or unplanned goals in order: ${unknown.join(', ')}`);
    const goalOrder = [...new Set(order || []), ...prioritisable.filter((key) => !(order || []).includes(key))];

    const overrides = {};
    Object.entries(monthlyOverrides || {}).forEach(([key, value]) => {
      const amount = Number(value);
      if (!prioritisable.includes(key)) throw this.error(400, `Monthly amounts here are for shared goals; ${key} is not one`);
      if (!Number.isFinite(amount) || amount < 0) throw this.error(400, 'Monthly amounts must be zero or more');
      overrides[key] = Math.round(amount);
    });
    const overrideTotal = Object.values(overrides).reduce((sum, value) => sum + value, 0);
    if (overrideTotal > familyPot) {
      throw this.error(400, `Monthly amounts add up to ${money(overrideTotal)}, more than the ${money(familyPot)} in the family pot`);
    }

    const recommended = this.optimise(household, options);
    const plan = this.simulate({
      id: 'custom',
      name: 'Our plan',
      tagline: 'Your own priorities and amounts',
      goalOrder,
      overrides,
      multipliers: {}
    }, goals, pots, now);
    const recommendedPlan = recommended.plans.find((item) => item.id === recommended.recommendedPlanId);
    plan.recommended = false;
    plan.tradeOffs = this.describeTradeOffs(plan, recommendedPlan);
    plan.definition = { order: goalOrder, monthlyOverrides: overrides };
    return { investable: familyPot, lumpSum: lumpSumAmount, plan, recommendedPlanId: recommended.recommendedPlanId };
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

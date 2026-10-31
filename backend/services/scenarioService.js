const householdStore = require('../models/householdStore');
const optimiserService = require('./optimiserService');
const { addMonthsIso, money } = require('../utils/finance');

const NEW_CHILD_MONTHLY_COST = 900;
const LEVER_LIMITS = { incomeChangePct: [-50, 50], schoolFeesMonthly: [0, 3000], extraSavingsMonthly: [0, 2000] };

const clamp = (value, [min, max]) => Math.min(max, Math.max(min, Number(value) || 0));

class ScenarioService {
  /**
   * AI What-if Scenario Simulator (#6). Applies preset levers to a copy of the household and
   * reruns the optimiser, so the impact on every goal is calculated, not generated.
   */
  simulate(householdId = null, rawLevers = {}, options = {}) {
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) {
      throw new Error('Household not found');
    }

    const levers = {
      extraChild: Boolean(rawLevers.extraChild),
      incomeChangePct: clamp(rawLevers.incomeChangePct, LEVER_LIMITS.incomeChangePct),
      schoolFeesMonthly: Math.round(clamp(rawLevers.schoolFeesMonthly, LEVER_LIMITS.schoolFeesMonthly)),
      extraSavingsMonthly: Math.round(clamp(rawLevers.extraSavingsMonthly, LEVER_LIMITS.extraSavingsMonthly))
    };

    const modified = this.applyLevers(household, levers, options.now);
    const before = optimiserService.optimise(household, options);
    // A hypothetical new child's education goal is included so its impact shows.
    const newChildKeys = levers.extraChild ? [`education_${modified.dependents.filter((item) => item.relation === 'Child').length}`] : [];
    const after = optimiserService.optimise(modified, { ...options, includeKeys: newChildKeys });
    const planId = options.planId || before.recommendedPlanId;
    const beforePlan = before.plans.find((plan) => plan.id === planId) || before.plans[0];
    const afterPlan = after.plans.find((plan) => plan.id === planId) || after.plans[0];

    const goals = afterPlan.goals.map((goal) => {
      const previous = beforePlan.goals.find((item) => item.key === goal.key);
      return {
        key: goal.key,
        name: goal.name,
        isNew: !previous,
        before: previous ? { monthlyNow: previous.monthlyNow, completesBy: previous.completesBy, status: previous.status, targetAmount: previous.targetAmount } : null,
        after: { monthlyNow: goal.monthlyNow, completesBy: goal.completesBy, status: goal.status, targetAmount: goal.targetAmount }
      };
    });

    const surplusChange = modified.financials.monthlySurplus - household.financials.monthlySurplus;
    // Monthly amount that would put the deadline-bound goals back on track (retirement absorbs the rest).
    const monthlyGapToClose = afterPlan.goals
      .filter((goal) => goal.routeKey !== 'wealth' && goal.status === 'AT_RISK')
      .reduce((sum, goal) => sum + Math.max(0, goal.requiredMonthly - goal.monthlyNow), 0);
    const newlyAtRisk = goals.filter((goal) => goal.after.status === 'AT_RISK' && goal.before?.status !== 'AT_RISK');
    const summary = [
      surplusChange !== 0
        ? `Monthly surplus ${surplusChange > 0 ? 'rises' : 'falls'} by ${money(Math.abs(surplusChange))} to ${money(modified.financials.monthlySurplus)}.`
        : 'Monthly surplus is unchanged.',
      newlyAtRisk.length
        ? `${newlyAtRisk.map((goal) => goal.name).join(', ')} would miss ${newlyAtRisk.length > 1 ? 'their deadlines' : 'its deadline'}.`
        : 'Every goal still meets its deadline.',
      monthlyGapToClose > 0
        ? `About ${money(monthlyGapToClose)}/month more would put the dated goals back on track.`
        : null,
      after.recommendedPlanId !== before.recommendedPlanId
        ? `The ${after.plans.find((plan) => plan.id === after.recommendedPlanId).name} plan would now fit better.`
        : null
    ].filter(Boolean);

    const result = {
      levers,
      planId,
      surplusBefore: household.financials.monthlySurplus,
      surplusAfter: modified.financials.monthlySurplus,
      monthlyGapToClose,
      goals,
      summary,
      recommendedPlanIdAfter: after.recommendedPlanId,
      calculationSource: 'DETERMINISTIC_RULE_ENGINE'
    };
    householdStore.recordScenario(household.id, { levers, summary });
    return result;
  }

  applyLevers(household, levers, now = new Date()) {
    const copy = JSON.parse(JSON.stringify(household));
    const { financials } = copy;
    const commitments = financials.commitments || [];
    const addCommitment = (item) => {
      commitments.push(item);
      financials.householdMonthlyExpenses += item.monthlyAmount;
      financials.monthlySurplus -= item.monthlyAmount;
    };

    if (levers.extraChild) {
      copy.dependents.push({
        name: 'Baby (expected)', relation: 'Child', birthDate: `${addMonthsIso(9, now)}-01`, citizenship: 'Singapore Citizen',
        cda: { balance: 0, governmentMatched: 0 }
      });
      addCommitment({ id: 'new_child', label: 'New baby costs', category: 'CHILDCARE', monthlyAmount: NEW_CHILD_MONTHLY_COST, essential: true });
    }
    if (levers.schoolFeesMonthly > 0) {
      addCommitment({ id: 'school_fees', label: 'Higher school fees', category: 'CHILDCARE', monthlyAmount: levers.schoolFeesMonthly, essential: true });
    }
    if (levers.incomeChangePct !== 0) {
      const factor = levers.incomeChangePct / 100;
      const takeHomeChange = Math.round(financials.householdTakeHome * factor);
      financials.householdTakeHome += takeHomeChange;
      financials.householdMonthlyIncome = Math.round(financials.householdMonthlyIncome * (1 + factor));
      financials.monthlySurplus += takeHomeChange;
    }
    if (levers.extraSavingsMonthly > 0) {
      // Extra savings come out of flexible spending, never essential commitments.
      const flexible = commitments.filter((item) => !item.essential && item.category === 'LIFESTYLE');
      const available = flexible.reduce((sum, item) => sum + item.monthlyAmount, 0);
      const saved = Math.min(levers.extraSavingsMonthly, available);
      let remaining = saved;
      flexible.forEach((item) => {
        const cut = Math.min(item.monthlyAmount, remaining);
        item.monthlyAmount -= cut;
        remaining -= cut;
      });
      financials.householdMonthlyExpenses -= saved;
      financials.monthlySurplus += saved;
    }
    financials.commitments = commitments;
    return copy;
  }

  /**
   * Collaborative Family Decision-Making (#7). Proposes a plan to the partner. In the sandbox
   * the partner's reply is simulated after a short delay, mirroring the family invite.
   */
  propose(householdId = null, { planId, note } = {}) {
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household?.partner) {
      throw new Error('A linked partner is required to propose a plan');
    }
    const optimised = optimiserService.optimise(household);
    const plan = optimised.plans.find((item) => item.id === planId);
    if (!plan) {
      throw new Error('Unknown plan');
    }
    return householdStore.createProposal(household.id, {
      planId: plan.id,
      planName: plan.name,
      routes: plan.routes,
      note: note ? String(note).slice(0, 200) : null,
      proposedBy: household.primaryUser.name,
      reviewer: household.partner.name,
      partnerResponse: this.partnerResponse(household, plan)
    });
  }

  // Simulated partner reply: agree when every goal is on track and the plan does not
  // shrink retirement savings by more than S$40/month against the balanced plan.
  partnerResponse(household, plan) {
    const partnerFirst = household.partner.name.split(' ')[0];
    const balanced = optimiserService.optimise(household).plans.find((item) => item.id === 'balanced');
    const retirementCut = balanced.routes.wealth - plan.routes.wealth;
    if (plan.allOnTrack && retirementCut <= 40) {
      return { decision: 'AGREED', message: `${partnerFirst}: Looks good to me. Let's go with ${plan.name}.` };
    }
    const atRisk = plan.goals.filter((goal) => goal.status === 'AT_RISK').map((goal) => goal.name);
    return {
      decision: 'SUGGESTED_CHANGE',
      message: atRisk.length
        ? `${partnerFirst}: Can we adjust so ${atRisk.join(' and ')} stays on track?`
        : `${partnerFirst}: Happy with the goals, but this starts our retirement ${money(retirementCut)}/month lower. Can we use Balanced instead?`,
      suggestedPlanId: 'balanced'
    };
  }
}

module.exports = new ScenarioService();

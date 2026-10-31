const { buildGoals } = require('../services/goalModel');
const optimiserService = require('../services/optimiserService');
const { money } = require('../utils/finance');

const ICONS = { EMERGENCY: 'shield', HOUSING: 'home', EDUCATION: 'graduation-cap', RETIREMENT: 'trending-up' };

class GoalsAgent {
  /**
   * Family Goal & Dependency Overview: every family goal with its own deadline, shortfall,
   * the monthly amount it needs, and the goals it depends on.
   */
  async analyze(household, options = {}) {
    const optimised = optimiserService.optimise(household, options);
    const recommended = optimised.plans.find((plan) => plan.id === optimised.recommendedPlanId);
    const outcome = (key) => recommended.goals.find((goal) => goal.key === key) || {};
    const goals = buildGoals(household, options).map((goal) => ({
      inputStatus: goal.inputStatus,
      planned: goal.planned,
      source: goal.source,
      input: goal.input,
      id: `goal_${goal.key}`,
      key: goal.key,
      routeKey: goal.routeKey,
      name: goal.name,
      category: goal.category,
      priority: goal.priority,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      shortfall: goal.shortfall,
      deadline: goal.deadline,
      monthsRemaining: goal.monthsRemaining,
      requiredMonthlyAllocation: goal.requiredMonthly,
      annualRate: goal.annualRate,
      dependsOn: goal.dependsOn,
      basis: goal.basis,
      icon: ICONS[goal.category],
      suggestedMonthlyAllocation: outcome(goal.key).monthlyNow ?? 0,
      projectedCompletion: outcome(goal.key).completesBy ?? null,
      status: !goal.planned ? goal.inputStatus : goal.shortfall === 0 ? 'REACHED' : outcome(goal.key).status || 'AT_RISK'
    }));

    const planned = goals.filter((goal) => goal.planned);
    const totalRequired = planned.reduce((sum, goal) => sum + goal.requiredMonthlyAllocation, 0);
    const surplus = Number(household.financials.monthlySurplus || 0);
    const home = goals.find((goal) => goal.category === 'HOUSING');

    return {
      agentId: 'goals_agent', agentName: 'Multi-Generational Goals Agent', status: 'ANALYZED', confidence: 0.9,
      totalGoalsCount: goals.length,
      totalRequiredMonthly: totalRequired,
      monthlySurplus: surplus,
      fundingGap: Math.max(0, totalRequired - surplus),
      recommendedPlanId: optimised.recommendedPlanId,
      lumpSum: optimised.lumpSum,
      needsDecision: optimised.needsDecision,
      goals,
      findings: [
        totalRequired > surplus
          ? `Funding every goal at once would need ${money(totalRequired)}/month, ${money(totalRequired - surplus)} more than the ${money(surplus)} surplus. ${planned.every((goal) => goal.status !== 'AT_RISK') ? 'Sequencing them, with retirement stepping up as earlier goals finish, keeps every deadline.' : 'Even sequenced, some deadlines are at risk.'}`
          : `All goals can be funded on time from the ${money(surplus)} monthly surplus.`,
        home ? `${home.name}: ${money(home.shortfall)} still needed by ${home.deadline}.` : 'No home goal is set.',
        ...(optimised.needsDecision.length ? [`${optimised.needsDecision.length} goal(s) need your decision before they are planned.`] : []),
        'Projected returns are assumptions, not guarantees.'
      ]
    };
  }
}

module.exports = new GoalsAgent();

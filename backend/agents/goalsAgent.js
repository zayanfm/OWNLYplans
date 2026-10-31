const { buildGoals } = require('../services/goalModel');
const { money } = require('../utils/finance');

const ICONS = { EMERGENCY: 'shield', HOUSING: 'home', EDUCATION: 'graduation-cap', RETIREMENT: 'trending-up' };

class GoalsAgent {
  /**
   * Family Goal & Dependency Overview: every family goal with its own deadline, shortfall,
   * the monthly amount it needs, and the goals it depends on.
   */
  async analyze(household, options = {}) {
    const goals = buildGoals(household, options).map((goal) => ({
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
      status: goal.shortfall === 0 ? 'REACHED' : 'NEEDS_FUNDING'
    }));

    const totalRequired = goals.reduce((sum, goal) => sum + goal.requiredMonthlyAllocation, 0);
    const surplus = Number(household.financials.monthlySurplus || 0);
    const home = goals.find((goal) => goal.category === 'HOUSING');

    return {
      agentId: 'goals_agent', agentName: 'Multi-Generational Goals Agent', status: 'ANALYZED', confidence: 0.9,
      totalGoalsCount: goals.length,
      totalRequiredMonthly: totalRequired,
      monthlySurplus: surplus,
      fundingGap: Math.max(0, totalRequired - surplus),
      goals,
      findings: [
        totalRequired > surplus
          ? `Funding every goal on time needs ${money(totalRequired)}/month, ${money(totalRequired - surplus)} more than the ${money(surplus)} surplus, so goals compete.`
          : `All goals can be funded on time from the ${money(surplus)} monthly surplus.`,
        home ? `${home.name}: ${money(home.shortfall)} still needed by ${home.deadline}.` : 'No home goal is set.',
        'Projected returns are assumptions, not guarantees.'
      ]
    };
  }
}

module.exports = new GoalsAgent();

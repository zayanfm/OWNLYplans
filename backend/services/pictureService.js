const householdStore = require('../models/householdStore');
const cashflowService = require('./cashflowService');
const goalsAgent = require('../agents/goalsAgent');
const grantsAgent = require('../agents/grantsAgent');

const GRANT_GOAL_CATEGORY = { housing: 'HOUSING', education: 'EDUCATION' };

class PictureService {
  /**
   * "Our Family Picture": cash flow (#2), goals with deadlines and dependencies (#3), and
   * government support shown inside the goal it funds (#4).
   */
  async getPicture(householdId = null) {
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) {
      throw new Error('Household not found');
    }

    const [goalsRes, grantsRes] = await Promise.all([goalsAgent.analyze(household), grantsAgent.analyze(household)]);
    const cashflow = cashflowService.analyze(household);
    const relevantSupport = grantsRes.grants.filter((grant) => grant.status !== 'NOT_ELIGIBLE');

    const goals = goalsRes.goals.map((goal) => ({
      ...goal,
      support: relevantSupport.filter((grant) => GRANT_GOAL_CATEGORY[grant.goalKey] === goal.category)
    }));

    return {
      success: true,
      householdId: household.id,
      cashflow,
      goals,
      fundingGap: goalsRes.fundingGap,
      totalRequiredMonthly: goalsRes.totalRequiredMonthly,
      support: {
        totalGrantValue: grantsRes.totalGrantValue,
        restrictedValue: grantsRes.restrictedValue,
        flexibleValue: grantsRes.flexibleValue,
        upcomingDates: grantsRes.upcomingDates,
        notEligible: grantsRes.grants.filter((grant) => grant.status === 'NOT_ELIGIBLE'),
        disclaimer: grantsRes.disclaimer
      },
      findings: goalsRes.findings
    };
  }
}

module.exports = new PictureService();

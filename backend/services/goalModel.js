const goalInputService = require('./goalInputService');
const { GOAL_CATEGORIES } = require('./goalInputService');
const { plannableAccounts } = require('./workspaceService');
const { requiredMonthly, monthsUntil, addMonthsIso, money } = require('../utils/finance');

const SCENARIO_RATES = { conservative: 0.025, balanced: 0.045, growth: 0.065 };
const CASH_RATE = 0.015;
const SHORT_HORIZON_MONTHS = 60;

const essentialMonthly = (financials) => {
  const commitments = financials.commitments || [];
  return commitments.length
    ? commitments.filter((item) => item.essential).reduce((sum, item) => sum + item.monthlyAmount, 0)
    : Number(financials.householdMonthlyExpenses || 0);
};

/**
 * Builds the household's family goals from what the family has decided (goalInputService).
 * Every goal is returned with its input status; only CONFIRMED goals (plus any keys passed in
 * options.includeKeys, used by what-ifs) are marked `planned` and fed to the optimiser.
 */
const buildGoals = (household, options = {}) => {
  const { financials, dependents = [], primaryUser, partner, accounts = {} } = household;
  const scenarioRate = SCENARIO_RATES[options.predictionScenario] || SCENARIO_RATES.balanced;
  const now = options.now || new Date();
  const includeKeys = options.includeKeys || [];
  const investments = accounts.investments || [];
  const adults = { primary: primaryUser, partner };

  const goals = goalInputService.getInputs(household, { includeKeys }).map((input) => {
    const base = {
      key: input.key,
      // 'household' goals are funded from the family pot; 'primary'/'partner' from that person's own money.
      owner: input.owner || 'household',
      inputStatus: input.status,
      planned: input.status === 'CONFIRMED' || (includeKeys.includes(input.key) && input.status !== 'OFF'),
      source: input.source,
      input
    };

    if (input.type === 'EMERGENCY') {
      const essentials = essentialMonthly(financials);
      return {
        ...base, name: 'Emergency buffer', category: 'EMERGENCY', group: 'EMERGENCY', groupLabel: 'Emergency', routeKey: 'emergency', priority: 1,
        targetAmount: essentials * input.months,
        currentAmount: Number(financials.emergencyFund || 0),
        deadline: addMonthsIso(input.withinMonths, now),
        annualRate: CASH_RATE, dependsOn: [],
        basis: `${input.months} months of essential spending (${money(essentials)}/month), built within ${input.withinMonths} months`
      };
    }

    if (input.type === 'EDUCATION') {
      const child = dependents.filter((item) => item.relation === 'Child')[input.childIndex] || {};
      const firstName = String(input.childName || 'Child').split(' ')[0];
      const undecided = input.path === 'UNDECIDED';
      return {
        ...base, name: `${firstName}'s education`, category: 'EDUCATION', group: 'EDUCATION', groupLabel: 'Education', routeKey: 'education', priority: 3,
        targetAmount: undecided ? 0 : input.annualCost * input.years,
        currentAmount: Number(child.cda?.balance || 0),
        deadline: undecided ? addMonthsIso(12, now) : `${input.startYear}-08`,
        annualRate: scenarioRate, dependsOn: [],
        childName: input.childName,
        basis: undecided
          ? 'Path not decided yet'
          : `${input.path === 'POLYTECHNIC' ? 'Polytechnic' : 'University'} from ${input.startYear}: ${input.years} years at ${money(input.annualCost)} a year (today's prices); starts from the CDA balance`
      };
    }

    if (input.type === 'RETIREMENT') {
      const adult = adults[input.owner] || {};
      const firstName = String(adult.name || 'Adult').split(' ')[0];
      const owned = investments.filter((item) => (item.owner || 'primary') === input.owner)
        .reduce((sum, item) => sum + Number(item.value || 0), 0);
      const months = Math.max(12, (input.retireAge - Number(adult.age || 30)) * 12);
      return {
        ...base, name: `${firstName}'s retirement`, category: 'RETIREMENT', group: 'RETIREMENT', groupLabel: 'Retirement', routeKey: 'wealth', priority: 4,
        targetAmount: input.amount,
        currentAmount: owned,
        deadline: addMonthsIso(months, now),
        annualRate: scenarioRate, dependsOn: [],
        owner: input.owner,
        basis: `Savings on top of CPF LIFE by age ${input.retireAge}`
      };
    }

    // CUSTOM: the family's own goal in the category they chose; short horizons stay in cash.
    const months = monthsUntil(input.dueDate, now);
    const category = GOAL_CATEGORIES[input.category] || GOAL_CATEGORIES.OTHER;
    const isHousing = category.routeKey === 'housing';
    return {
      ...base, name: input.name,
      category: isHousing ? 'HOUSING' : category.routeKey === 'education' ? 'EDUCATION' : 'CUSTOM',
      group: GOAL_CATEGORIES[input.category] ? input.category : 'OTHER',
      groupLabel: category.label,
      routeKey: category.routeKey,
      priority: isHousing ? 2 : 3,
      targetAmount: input.amount,
      currentAmount: Number(input.saved || 0),
      deadline: input.dueDate,
      annualRate: months < SHORT_HORIZON_MONTHS ? CASH_RATE : scenarioRate,
      dependsOn: isHousing ? ['emergency'] : [],
      basis: `${category.label} goal, due ${input.dueDate}`
    };
  });

  // Retirement savings step up once the family's home goals are funded.
  const homeKeys = goals.filter((goal) => goal.routeKey === 'housing' && goal.planned).map((goal) => goal.key);
  goals.filter((goal) => goal.category === 'RETIREMENT').forEach((goal) => { goal.dependsOn = homeKeys; });

  return goals.map((goal) => {
    const monthsRemaining = monthsUntil(goal.deadline, now);
    return {
      ...goal,
      monthsRemaining,
      shortfall: Math.max(0, goal.targetAmount - goal.currentAmount),
      requiredMonthly: requiredMonthly(goal.currentAmount, goal.targetAmount, monthsRemaining, goal.annualRate)
    };
  });
};

// Shared cash above the emergency fund and one month of commitments (working cash for bills),
// which can be used as a one-off lump sum. Accounts kept private are never counted.
const spareCash = (household) => {
  const liquid = plannableAccounts(household).reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const workingCash = Number(household.financials.householdMonthlyExpenses || 0);
  return Math.max(0, liquid - Number(household.financials.emergencyFund || 0) - workingCash);
};

module.exports = { buildGoals, spareCash, essentialMonthly, SCENARIO_RATES };

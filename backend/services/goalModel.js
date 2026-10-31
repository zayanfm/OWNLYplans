const { requiredMonthly, monthsUntil, addMonthsIso, money } = require('../utils/finance');

const SCENARIO_RATES = { conservative: 0.025, balanced: 0.045, growth: 0.065 };
const CASH_RATE = 0.015;

const essentialMonthly = (financials) => {
  const commitments = financials.commitments || [];
  return commitments.length
    ? commitments.filter((item) => item.essential).reduce((sum, item) => sum + item.monthlyAmount, 0)
    : Number(financials.householdMonthlyExpenses || 0);
};

const addYearsToMonth = (isoDate, years) => {
  const [year, month] = String(isoDate).split('-').map(Number);
  return `${year + years}-${String(month || 1).padStart(2, '0')}`;
};

/**
 * Builds the household's family goals with real deadlines, shortfalls and dependencies.
 * This is the single source of goal requirements for the goals agent, the optimiser and scenarios.
 */
const buildGoals = (household, options = {}) => {
  const { financials, housing = {}, dependents = [], primaryUser, partner, accounts = {} } = household;
  const settings = household.goalSettings || {};
  const scenarioRate = SCENARIO_RATES[options.predictionScenario] || SCENARIO_RATES.balanced;
  const now = options.now || new Date();
  const goals = [];

  // 1. Emergency buffer: months of essential spending, kept in cash.
  const emergencySettings = settings.emergency || { targetMonthsOfEssentials: 6, deadlineMonths: 12 };
  const emergencyTarget = essentialMonthly(financials) * emergencySettings.targetMonthsOfEssentials;
  const emergencyCurrent = Number(financials.emergencyFund || 0);
  goals.push({
    key: 'emergency',
    name: 'Emergency buffer',
    category: 'EMERGENCY',
    routeKey: 'emergency',
    priority: 1,
    targetAmount: emergencyTarget,
    currentAmount: emergencyCurrent,
    deadline: addMonthsIso(emergencySettings.deadlineMonths, now),
    annualRate: CASH_RATE,
    dependsOn: [],
    basis: `${emergencySettings.targetMonthsOfEssentials} months of essential spending (${money(essentialMonthly(financials))}/month)`
  });

  // 2. Home: BTO purchase fund by key collection, or a 12-month mortgage reserve.
  const isPendingBto = String(housing.type || '').includes('BTO') && Number(housing.mortgageOutstanding || 0) === 0;
  goals.push({
    key: 'housing',
    name: isPendingBto ? 'BTO home purchase fund' : 'Home loan safety reserve',
    category: 'HOUSING',
    routeKey: 'housing',
    priority: 2,
    targetAmount: isPendingBto ? Number(housing.downpaymentRequired || 0) : Number(housing.monthlyLoanInstalment || 0) * 12,
    currentAmount: isPendingBto ? Number(housing.downpaymentAccumulated || 0) : 0,
    deadline: isPendingBto && housing.keyCollectionDate ? housing.keyCollectionDate : addMonthsIso(24, now),
    annualRate: CASH_RATE,
    dependsOn: ['emergency'],
    basis: isPendingBto
      ? `Downpayment due at key collection (${housing.keyCollectionDate})`
      : '12 months of mortgage instalments'
  });

  // 3. Education: one goal per child, due when the child reaches the target age.
  const educationSettings = settings.education || { targetAmountPerChild: 30000, targetAge: 18 };
  dependents.filter((child) => child.relation === 'Child').forEach((child, index) => {
    const firstName = String(child.name || `Child ${index + 1}`).split(' ')[0];
    goals.push({
      key: dependents.length > 1 ? `education_${index + 1}` : 'education',
      name: `${firstName}'s education`,
      category: 'EDUCATION',
      routeKey: 'education',
      priority: 3,
      targetAmount: educationSettings.targetAmountPerChild,
      currentAmount: Number(child.cda?.balance || 0),
      deadline: child.birthDate ? addYearsToMonth(child.birthDate, educationSettings.targetAge) : addMonthsIso(180, now),
      annualRate: scenarioRate,
      dependsOn: [],
      childName: child.name,
      basis: `University and living costs by age ${educationSettings.targetAge}; starts from the CDA balance, which moves to Edusave/PSEA for education use`
    });
  });

  // 4. Retirement: one goal per adult, as a top-up beyond CPF LIFE payouts.
  const retirementSettings = settings.retirement || { targetAge: 65, targetAmountPerAdult: 120000 };
  const investments = accounts.investments || [];
  [['primary', primaryUser], ['partner', partner]].forEach(([owner, adult]) => {
    if (!adult) return;
    const firstName = String(adult.name).split(' ')[0];
    const owned = investments.filter((item) => (item.owner || 'primary') === owner)
      .reduce((sum, item) => sum + Number(item.value || 0), 0);
    goals.push({
      key: `retirement_${owner}`,
      name: `${firstName}'s retirement`,
      category: 'RETIREMENT',
      routeKey: 'wealth',
      priority: 4,
      targetAmount: retirementSettings.targetAmountPerAdult,
      currentAmount: owned,
      deadline: addMonthsIso(Math.max(12, (retirementSettings.targetAge - Number(adult.age || 30)) * 12), now),
      annualRate: scenarioRate,
      dependsOn: ['housing'],
      owner,
      basis: retirementSettings.note || `Savings by age ${retirementSettings.targetAge}`
    });
  });

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

// Cash above the emergency fund and one month of commitments (working cash for bills),
// which can be used as a one-off lump sum.
const spareCash = (household) => {
  const liquid = (household.accounts?.ocbc || []).reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const workingCash = Number(household.financials.householdMonthlyExpenses || 0);
  return Math.max(0, liquid - Number(household.financials.emergencyFund || 0) - workingCash);
};

module.exports = { buildGoals, spareCash, essentialMonthly, SCENARIO_RATES };

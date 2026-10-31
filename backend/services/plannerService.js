const householdStore = require('../models/householdStore');

class PlannerService {
  /**
   * Generates a dynamic financial plan & surplus routing proposal for a household.
   */
  generatePlan(householdId = null, config = {}) {
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) {
      throw new Error('Household not found');
    }

    const { financials, housing, dependents } = household;
    const isPendingBto = String(housing?.type || '').includes('BTO') && Number(housing?.mortgageOutstanding || 0) === 0;
    const monthlySurplus = financials.monthlySurplus || 1340;
    const timeline = String(config.timeline || '5'); // '5' or '10' years
    const mode = config.mode || '24H_WINDOW'; // 'NOTIFY_AND_WAIT', '24H_WINDOW', 'FULL_AUTO'

    const allowedPriorities = ['housing', 'education', 'wealth'];
    const priorities = Array.isArray(config.priorities)
      ? config.priorities.filter((item) => allowedPriorities.includes(item))
      : allowedPriorities;
    allowedPriorities.forEach((item) => {
      if (!priorities.includes(item)) priorities.push(item);
    });

    const scenarioRates = { conservative: 0.025, balanced: 0.045, growth: 0.065 };
    const predictionScenario = scenarioRates[config.predictionScenario]
      ? config.predictionScenario
      : 'balanced';
    const annualReturnRate = scenarioRates[predictionScenario];
    const inflationRate = 0.025;

    const protectionEnabled = config.protection?.enabled !== false;
    const protectionTier = config.protection?.tier === 'enhanced' ? 'enhanced' : 'essential';
    const protection = protectionEnabled
      ? {
          enabled: true,
          tier: protectionTier,
          monthlyPremium: protectionTier === 'enhanced' ? 52 : 28,
          coverageAmount: protectionTier === 'enhanced' ? 300000 : 160000,
          protectionGapClosed: protectionTier === 'enhanced' ? 160000 : 160000
        }
      : { enabled: false, tier: protectionTier, monthlyPremium: 0, coverageAmount: 0, protectionGapClosed: 0 };

    const investableSurplus = Math.max(0, monthlySurplus - protection.monthlyPremium);

    // Calculate routing allocations
    const requestedSplits = {
      housing: config.split?.housing !== undefined ? Number(config.split.housing) : 0.50,
      education: config.split?.education !== undefined ? Number(config.split.education) : 0.30,
      wealth: config.split?.wealth !== undefined ? Number(config.split.wealth) : 0.20
    };
    const splitTotal = Object.values(requestedSplits).reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
    const housingSplit = Math.max(0, requestedSplits.housing) / splitTotal;
    const educationSplit = Math.max(0, requestedSplits.education) / splitTotal;
    const wealthSplit = Math.max(0, requestedSplits.wealth) / splitTotal;
    const months = timeline === '10' ? 120 : 60;
    const project = (monthlyAmount) => {
      const monthlyRate = annualReturnRate / 12;
      if (!monthlyRate) return Math.round(monthlyAmount * months);
      return Math.round(monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate));
    };

    const routes = [
      {
        id: 'r1',
        key: 'housing',
        name: isPendingBto ? 'BTO Home Purchase Fund' : 'Home Loan Safety Reserve',
        targetProduct: 'OCBC 360 Savings Goal',
        monthlyAmount: Number((investableSurplus * housingSplit).toFixed(0)),
        percentage: Math.round(housingSplit * 100),
        status: 'ACTIVE_ROUTING',
        purpose: isPendingBto ? 'Build the remaining BTO downpayment by the selected goal horizon' : 'Build 12 months of mortgage payments without using the emergency fund',
        projectedAtEnd: project(investableSurplus * housingSplit)
      },
      {
        id: 'r2',
        key: 'education',
        name: `${dependents.length || 1}-Child Education Fund`,
        targetProduct: 'OCBC Savings Goal + RoboInvest',
        monthlyAmount: Number((investableSurplus * educationSplit).toFixed(0)),
        percentage: Math.round(educationSplit * 100),
        status: 'ACTIVE_ROUTING',
        purpose: 'Build education funding by the selected goal horizon',
        projectedAtEnd: project(investableSurplus * educationSplit)
      },
      {
        id: 'r3',
        key: 'wealth',
        name: 'Retirement & Liquid Wealth',
        targetProduct: 'OCBC RoboInvest + CPF',
        monthlyAmount: Number((investableSurplus * wealthSplit).toFixed(0)),
        percentage: Math.round(wealthSplit * 100),
        status: 'ACTIVE_ROUTING',
        purpose: 'Grow retirement-ready assets while retaining liquidity',
        projectedAtEnd: project(investableSurplus * wealthSplit)
      }
    ];

    // Multi-year milestones
    const targetYear = new Date().getFullYear() + Number(timeline);
    const milestones = [
      { year: 'Now', icon: 'shield', title: 'Protect the Base', detail: `Keep the S$${financials.emergencyFund.toLocaleString()} emergency floor separate and review the protection gap.` },
      { year: String(targetYear), icon: 'home', title: isPendingBto ? 'BTO Home Purchase Fund' : 'Home Loan Safety Reserve', detail: isPendingBto ? `Build the remaining home-purchase amount with S$${routes.find(route => route.key === 'housing').monthlyAmount}/month.` : `Target 12 months of mortgage payments with S$${routes.find(route => route.key === 'housing').monthlyAmount}/month.` },
      { year: String(targetYear), icon: 'graduation-cap', title: 'Children’s Education Goal', detail: `Build the education fund with S$${routes.find(route => route.key === 'education').monthlyAmount}/month.` },
      { year: String(targetYear), icon: 'trending-up', title: 'Retirement & Liquid Wealth', detail: `Grow linked investments and CPF with S$${routes.find(route => route.key === 'wealth').monthlyAmount}/month.` }
    ];

    // Governance & Safety Guardrails
    const guardrails = {
      drawdownCap: 'S$2,500 / single transaction',
      minimumEmergencyFloor: `S$${financials.emergencyFund.toLocaleString()} (preserves ${(financials.emergencyFund / Math.max(1, financials.householdMonthlyExpenses)).toFixed(1)} months of expenses)`,
      coolingOffPeriod: mode === 'FULL_AUTO' ? '12 Hours' : mode === '24H_WINDOW' ? '24 Hours' : 'Manual confirmation on every sweep',
      mfaRequirement: 'OCBC OneToken biometric authentication on execution'
    };

    return {
      householdId: household.id,
      monthlySurplus,
      investableSurplus,
      timelineYears: Number(timeline),
      autonomyMode: mode,
      predictionScenario,
      priorities,
      routes: priorities.map((key) => routes.find((route) => route.key === key)),
      protection,
      assumptions: { annualReturnRate, inflationRate },
      milestones,
      guardrails,
      summary: {
        totalMonthlyRouted: investableSurplus,
        totalMonthlyCommitted: investableSurplus + protection.monthlyPremium,
        projected5YearAccumulation: Number((investableSurplus * 60 * (1 + annualReturnRate)).toFixed(0)),
        projected10YearAccumulation: Number((investableSurplus * 120 * (1 + annualReturnRate * 2)).toFixed(0)),
        projectedAtHorizon: routes.reduce((sum, route) => sum + route.projectedAtEnd, 0),
        annualYieldLift: '+S$456 / year'
      }
    };
  }

  approvePlan(householdId = null, planPayload = {}) {
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) {
      throw new Error('Household not found');
    }

    const approvedPlan = householdStore.approveSurplusPlan(household.id, planPayload);
    return {
      success: true,
      message: 'Progressive financial plan approved and surplus routes activated',
      plan: approvedPlan
    };
  }

  executeRoute(householdId = null, routeId, amount) {
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) {
      throw new Error('Household not found');
    }

    householdStore.recordAudit(household.id, 'EXECUTE_ROUTE', { routeId, amount });
    return {
      success: true,
      executionId: `exec-${Date.now()}`,
      routeId,
      amount,
      status: 'SETTLED',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new PlannerService();

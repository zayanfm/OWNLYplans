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
        name: 'BTO Downpayment Pot',
        targetProduct: 'OCBC 360 High Yield Vault',
        monthlyAmount: Number((investableSurplus * housingSplit).toFixed(0)),
        percentage: Math.round(housingSplit * 100),
        status: 'ACTIVE_ROUTING',
        purpose: 'Key collection downpayment accumulation',
        projectedAtEnd: project(investableSurplus * housingSplit)
      },
      {
        id: 'r2',
        key: 'education',
        name: 'Child CDA & Education',
        targetProduct: 'OCBC Child Development Account + RoboInvest',
        monthlyAmount: Number((investableSurplus * educationSplit).toFixed(0)),
        percentage: Math.round(educationSplit * 100),
        status: 'ACTIVE_ROUTING',
        purpose: 'Government co-matched child development fund',
        projectedAtEnd: project(investableSurplus * educationSplit)
      },
      {
        id: 'r3',
        key: 'wealth',
        name: 'High-Yield Liquid Sweep',
        targetProduct: 'LionGlobal SGD Money Market Fund',
        monthlyAmount: Number((investableSurplus * wealthSplit).toFixed(0)),
        percentage: Math.round(wealthSplit * 100),
        status: 'ACTIVE_ROUTING',
        purpose: '3.85% p.a. cash sweep with instant liquidity',
        projectedAtEnd: project(investableSurplus * wealthSplit)
      }
    ];

    // Multi-year milestones
    const milestones = timeline === '5' ? [
      { year: '2026', icon: 'shield', title: 'Safety Net & Cash Optimization', detail: `Sweep idle funds to LionGlobal MMF (+3.85% p.a.); secure Great Eastern protection.` },
      { year: '2027', icon: 'home', title: 'BTO 4-Room Key Collection', detail: `Accumulate S$96,000 downpayment via CPF OA + monthly S$${routes[0].monthlyAmount} surplus.` },
      { year: '2029', icon: 'baby', title: 'Child Development Co-Matching', detail: `Maximize S$4,000 MSF dollar-for-dollar matching in OCBC CDA.` },
      { year: '2031', icon: 'trending-up', title: 'Accelerated Wealth Accumulation', detail: `Redirect BTO surplus into OCBC RoboInvest Global Growth Portfolio.` }
    ] : [
      { year: '2026', icon: 'shield', title: 'Safety Net Established', detail: 'Emergency buffer locked at 6 months; protection gap fully closed.' },
      { year: '2027', icon: 'home', title: 'BTO Key Collection', detail: 'Move into Tengah 4-Room flat with zero out-of-pocket cash deficit.' },
      { year: '2031', icon: 'graduation-cap', title: 'Primary Education Milestone', detail: 'Primary school fund established with S$35,000 co-saved.' },
      { year: '2036', icon: 'lock', title: 'CPF Full Retirement Sum (FRS) Track', detail: 'Household CPF Special Accounts cross compound threshold.' }
    ];

    // Governance & Safety Guardrails
    const guardrails = {
      drawdownCap: 'S$2,500 / single transaction',
      minimumEmergencyFloor: `S$${financials.emergencyFund.toLocaleString()} (Preserves 4.5 months buffer)`,
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

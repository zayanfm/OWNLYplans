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
    const timeline = config.timeline || '5'; // '5' or '10' years
    const mode = config.mode || '24H_WINDOW'; // 'NOTIFY_AND_WAIT', '24H_WINDOW', 'FULL_AUTO'

    // Calculate routing allocations
    const housingSplit = config.split?.housing !== undefined ? config.split.housing : 0.50;
    const educationSplit = config.split?.education !== undefined ? config.split.education : 0.30;
    const wealthSplit = config.split?.wealth !== undefined ? config.split.wealth : 0.20;

    const routes = [
      {
        id: 'r1',
        name: 'BTO Downpayment Pot',
        targetProduct: 'OCBC 360 High Yield Vault',
        monthlyAmount: Number((monthlySurplus * housingSplit).toFixed(0)),
        percentage: Math.round(housingSplit * 100),
        status: 'ACTIVE_ROUTING',
        purpose: 'Key collection downpayment accumulation',
        projectedAtEnd: Number((monthlySurplus * housingSplit * (timeline === '5' ? 60 : 120)).toFixed(0))
      },
      {
        id: 'r2',
        name: 'Child CDA & Education',
        targetProduct: 'OCBC Child Development Account + RoboInvest',
        monthlyAmount: Number((monthlySurplus * educationSplit).toFixed(0)),
        percentage: Math.round(educationSplit * 100),
        status: 'ACTIVE_ROUTING',
        purpose: 'Government co-matched child development fund',
        projectedAtEnd: Number((monthlySurplus * educationSplit * (timeline === '5' ? 60 : 120) * 1.04).toFixed(0))
      },
      {
        id: 'r3',
        name: 'High-Yield Liquid Sweep',
        targetProduct: 'LionGlobal SGD Money Market Fund',
        monthlyAmount: Number((monthlySurplus * wealthSplit).toFixed(0)),
        percentage: Math.round(wealthSplit * 100),
        status: 'ACTIVE_ROUTING',
        purpose: '3.85% p.a. cash sweep with instant liquidity',
        projectedAtEnd: Number((monthlySurplus * wealthSplit * (timeline === '5' ? 60 : 120) * 1.0385).toFixed(0))
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
      timelineYears: Number(timeline),
      autonomyMode: mode,
      routes,
      milestones,
      guardrails,
      summary: {
        totalMonthlyRouted: monthlySurplus,
        projected5YearAccumulation: Number((monthlySurplus * 60 * 1.035).toFixed(0)),
        projected10YearAccumulation: Number((monthlySurplus * 120 * 1.045).toFixed(0)),
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

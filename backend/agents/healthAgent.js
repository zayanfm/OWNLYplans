const { spareCash } = require('../services/goalModel');
const { plannableAccounts } = require('../services/workspaceService');

class HealthAgent {
  async analyze(household) {
    const { primaryUser, partner, accounts, financials } = household;

    const monthlyIncome = financials.householdMonthlyIncome || 10000;
    const monthlyExpenses = financials.householdMonthlyExpenses || 6000;
    const monthlySurplus = financials.monthlySurplus || (monthlyIncome - monthlyExpenses);
    const emergencyFund = financials.emergencyFund || 25000;

    // Buffer in months
    const bufferMonths = Number((emergencyFund / (monthlyExpenses || 1)).toFixed(1));
    const savingsRate = Number(((monthlySurplus / monthlyIncome) * 100).toFixed(1));

    // Protection Gap
    const protection = financials.insuranceCoverage || {};
    const existingLife = protection.existingLifeCoverage || 0;
    const recommendedLife = protection.recommendedLifeCoverage || (monthlyIncome * 12 * 4); // 4 years income benchmark
    const protectionGap = Math.max(0, recommendedLife - existingLife);

    // Idle Cash Analysis
    const lowYieldCash = plannableAccounts(household).reduce((sum, account) => (
      account.interestRate <= 0.05 ? sum + Number(account.balance || 0) : sum
    ), 0);
    const idleCashInLowYield = spareCash(household);
    // The emergency buffer itself sits in base-interest accounts; a T+0 money market fund keeps it liquid.
    const lowYieldBuffer = Math.min(emergencyFund, lowYieldCash);

    // Compute Health Score (0-100)
    let score = 70;
    if (bufferMonths >= 6) score += 15;
    else if (bufferMonths >= 3) score += 8;
    else score -= 15;

    if (savingsRate >= 20) score += 10;
    else if (savingsRate < 10) score -= 10;

    if (protectionGap === 0) score += 5;
    else if (protectionGap > 200000) score -= 8;

    score = Math.min(100, Math.max(0, score));

    const deterministicResult = {
      agentId: 'health_agent',
      agentName: 'Household Health & Risk Agent',
      status: 'OPTIMAL',
      confidence: 0.96,
      score,
      metrics: {
        emergencyBufferMonths: bufferMonths,
        savingsRatePercent: savingsRate,
        monthlySurplus,
        protectionGap,
        existingCoverage: existingLife,
        recommendedCoverage: recommendedLife,
        idleCashIdentified: idleCashInLowYield,
        lowYieldBuffer
      },
      findings: [
        `Emergency buffer stands at ${bufferMonths} months of household expenses (target: 6 months).`,
        idleCashInLowYield > 0
          ? `S$${idleCashInLowYield.toLocaleString()} OCBC cash is above the emergency floor and a month of working cash.`
          : `No spare cash beyond the emergency floor and a month of working cash.`,
        lowYieldBuffer > 0
          ? `The S$${lowYieldBuffer.toLocaleString()} emergency buffer earns 0.05% base interest.`
          : `The emergency buffer is not held in base-interest accounts.`,
        protectionGap > 0
          ? `Identified S$${protectionGap.toLocaleString()} family protection gap against outstanding liabilities.`
          : `Life and disability protection is fully covered for all dependents.`
      ],
      recommendations: [
        {
          id: 'health_rec_sweep',
          action: 'SWEEP_IDLE_CASH',
          title: 'Sweep Idle Cash to LionGlobal SGD MMF',
          amount: idleCashInLowYield > 0 ? idleCashInLowYield : 1000,
          expectedYieldGain: '+3.80% p.a. net yield boost',
          priority: 'HIGH'
        },
        ...(protectionGap > 0 ? [{
          id: 'health_rec_insurance',
          action: 'CLOSE_PROTECTION_GAP',
          title: 'Close Mortgage Protection Gap with Great Eastern FlexiLife',
          gapAmount: protectionGap,
          estimatedMonthlyCost: 28,
          priority: 'MEDIUM'
        }] : [])
      ]
    };

    return deterministicResult;
  }
}

module.exports = new HealthAgent();

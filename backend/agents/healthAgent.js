const geminiService = require('../services/geminiService');

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
    const idleCashInLowYield = accounts.ocbc.reduce((sum, a) => {
      if (a.interestRate <= 0.05 && a.balance > 5000) {
        return sum + (a.balance - 5000); // Amount above base operational reserve
      }
      return sum;
    }, 0) + accounts.otherBanks.reduce((sum, a) => sum + (a.balance || 0), 0);

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
        idleCashIdentified: idleCashInLowYield
      },
      findings: [
        `Emergency buffer stands at ${bufferMonths} months of household expenses (target: 6 months).`,
        idleCashInLowYield > 0
          ? `S$${idleCashInLowYield.toLocaleString()} idle cash is earning 0.05% base interest across secondary accounts.`
          : `Cash balances are efficiently deployed across high-yield vaults.`,
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

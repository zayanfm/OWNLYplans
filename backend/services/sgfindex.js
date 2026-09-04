const householdStore = require('../models/householdStore');

class SGFinDexService {
  /**
   * Aggregates financial accounts across OCBC, DBS, UOB, CPF, and investments via SGFinDex.
   */
  aggregate(householdId = null) {
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) {
      throw new Error('Household not found');
    }

    const { primaryUser, partner, accounts, financials } = household;

    // Calculate liquid cash across banks
    const ocbcCash = accounts.ocbc.reduce((sum, a) => sum + (a.balance || 0), 0);
    const otherBankCash = accounts.otherBanks.reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalLiquidCash = ocbcCash + otherBankCash;

    // Calculate total investments
    const totalInvestments = accounts.investments.reduce((sum, inv) => sum + (inv.value || 0), 0);

    // Calculate CPF totals
    const primaryCpfTotal = (primaryUser.cpf.oa || 0) + (primaryUser.cpf.sa || 0) + (primaryUser.cpf.ma || 0);
    const partnerCpfTotal = partner ? ((partner.cpf.oa || 0) + (partner.cpf.sa || 0) + (partner.cpf.ma || 0)) : 0;
    const householdCpfTotal = primaryCpfTotal + partnerCpfTotal;

    // Calculate net worth
    const totalAssets = totalLiquidCash + totalInvestments + householdCpfTotal;
    const totalLiabilities = financials.totalLiabilities || 0;
    const netWorth = totalAssets - totalLiabilities;

    return {
      success: true,
      timestamp: new Date().toISOString(),
      sgfindexConsent: {
        status: 'ACTIVE',
        financialInstitutions: ['OCBC Bank', 'DBS Bank', 'UOB Bank', 'Central Provident Fund (CPF)', 'Inland Revenue Authority of Singapore (IRAS)'],
        lastSynced: new Date().toISOString()
      },
      summary: {
        totalLiquidCash,
        totalInvestments,
        householdCpfTotal,
        totalAssets,
        totalLiabilities,
        netWorth,
        monthlyHouseholdIncome: financials.householdMonthlyIncome,
        monthlyHouseholdTakeHome: financials.householdTakeHome,
        monthlyHouseholdExpenses: financials.householdMonthlyExpenses,
        monthlySurplus: financials.monthlySurplus,
        emergencyFund: financials.emergencyFund,
        emergencyBufferMonths: Number((financials.emergencyFund / (financials.householdMonthlyExpenses || 1)).toFixed(1))
      },
      bankAccounts: {
        ocbc: accounts.ocbc,
        otherBanks: accounts.otherBanks
      },
      cpf: {
        primaryUser: {
          name: primaryUser.name,
          nric: primaryUser.nric,
          oa: primaryUser.cpf.oa,
          sa: primaryUser.cpf.sa,
          ma: primaryUser.cpf.ma,
          total: primaryCpfTotal
        },
        partner: partner ? {
          name: partner.name,
          nric: partner.nric,
          oa: partner.cpf.oa,
          sa: partner.cpf.sa,
          ma: partner.cpf.ma,
          total: partnerCpfTotal
        } : null,
        householdTotal: householdCpfTotal
      },
      investments: accounts.investments,
      insuranceCoverage: financials.insuranceCoverage
    };
  }
}

module.exports = new SGFinDexService();

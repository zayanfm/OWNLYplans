const { essentialMonthly } = require('./goalModel');

const CATEGORY_LABELS = {
  HOUSING: 'Housing',
  CHILDCARE: 'Childcare',
  LIVING: 'Everyday living',
  INSURANCE: 'Insurance',
  FAMILY: 'Family support',
  SAVINGS: 'Existing savings plans',
  LIFESTYLE: 'Lifestyle'
};

class CashflowService {
  /**
   * Household Cash Flow & Commitment Analysis: take-home income minus itemised commitments.
   * Only what is left after commitments is treated as available for planning; account
   * balances are never treated as spendable income.
   */
  analyze(household) {
    const { primaryUser, partner, financials } = household;
    const income = [
      { owner: 'primary', name: primaryUser.name, monthlyTakeHome: Number(primaryUser.monthlyTakeHome || 0) },
      ...(partner && !partner.left ? [{ owner: 'partner', name: partner.name, monthlyTakeHome: Number(partner.monthlyTakeHome || 0) }] : [])
    ];
    const totalTakeHome = Number(financials.householdTakeHome || income.reduce((sum, item) => sum + item.monthlyTakeHome, 0));

    const commitments = financials.commitments && financials.commitments.length
      ? financials.commitments
      : [{ id: 'expenses', label: 'Household expenses', category: 'LIVING', monthlyAmount: Number(financials.householdMonthlyExpenses || 0), essential: true }];
    const totalCommitments = commitments.reduce((sum, item) => sum + item.monthlyAmount, 0);

    const groups = Object.values(commitments.reduce((acc, item) => {
      const key = item.category;
      acc[key] = acc[key] || { category: key, label: CATEGORY_LABELS[key] || key, monthlyAmount: 0, items: [] };
      acc[key].monthlyAmount += item.monthlyAmount;
      acc[key].items.push(item);
      return acc;
    }, {})).sort((a, b) => b.monthlyAmount - a.monthlyAmount);

    const essential = essentialMonthly(financials);
    return {
      income,
      totalTakeHome,
      commitments,
      groups,
      totalCommitments,
      essentialMonthly: essential,
      flexibleMonthly: totalCommitments - essential,
      freeToPlan: totalTakeHome - totalCommitments,
      method: 'Take-home pay from MyInfo, commitments from categorised OCBC transactions over 90 days'
    };
  }
}

module.exports = new CashflowService();

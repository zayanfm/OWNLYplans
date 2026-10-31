const householdStore = require('../models/householdStore');

const sum = (items, field) => items.reduce((total, item) => total + Number(item[field] || 0), 0);
const cpfTotal = (cpf = {}) => Number(cpf.oa || 0) + Number(cpf.sa || 0) + Number(cpf.ma || 0);

class WorkspaceService {
  /**
   * Builds the Family Financial Workspace from Singpass MyInfo and the household's OCBC accounts.
   * The partner's accounts only appear once they have approved the family invite, and each
   * account keeps its owner's sharing choice: FULL shows details, TOTAL_ONLY contributes to
   * totals without details, PRIVATE is excluded.
   */
  getWorkspace(householdId = null) {
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) {
      throw new Error('Household not found');
    }

    const { primaryUser, partner, accounts, financials } = household;
    const invite = householdStore.getFamilyInviteStatus(household.id);
    const partnerInvite = invite.members.find((member) => member.relation === 'Spouse');
    const partnerConsent = !partner
      ? 'NONE'
      : partner.linked && partnerInvite?.status === 'APPROVED'
        ? 'APPROVED'
        : partnerInvite ? 'PENDING' : 'NOT_INVITED';
    const partnerVisible = partnerConsent === 'APPROVED';

    const workspaceAccounts = accounts.ocbc.map((account) => {
      const owner = account.owner || 'primary';
      const sharing = account.sharing || 'FULL';
      const awaitingConsent = owner === 'partner' && !partnerVisible;
      const countsTowardTotals = !awaitingConsent && sharing !== 'PRIVATE';
      const showsDetails = countsTowardTotals && sharing === 'FULL';
      return {
        owner,
        sharing,
        status: awaitingConsent ? 'AWAITING_CONSENT' : 'CONNECTED',
        countsTowardTotals,
        type: showsDetails ? account.type : `${partner?.name?.split(' ')[0] || 'Partner'}'s OCBC account`,
        number: showsDetails ? account.number : null,
        holder: account.holder,
        role: showsDetails ? account.role : null,
        balance: countsTowardTotals ? account.balance : null,
        interestRate: showsDetails ? account.interestRate : null
      };
    });

    const countedAccounts = workspaceAccounts.filter((account) => account.countsTowardTotals);
    const investments = (accounts.investments || []).filter((item) => item.owner !== 'partner' || partnerVisible);
    const manualAssets = household.manualAssets || [];

    const totalLiquidCash = sum(countedAccounts, 'balance');
    const totalInvestments = sum(investments, 'value');
    const totalManualAssets = sum(manualAssets, 'balance');
    const primaryCpf = cpfTotal(primaryUser.cpf);
    const partnerCpf = partner && partnerVisible ? cpfTotal(partner.cpf) : 0;
    const householdCpfTotal = primaryCpf + partnerCpf;
    const totalAssets = totalLiquidCash + totalInvestments + totalManualAssets + householdCpfTotal;
    const totalLiabilities = financials.totalLiabilities || 0;

    return {
      success: true,
      timestamp: new Date().toISOString(),
      lastSynced: new Date().toISOString(),
      sources: ['Singpass MyInfo', 'OCBC accounts'],
      partnerConsent,
      summary: {
        totalLiquidCash,
        totalInvestments,
        totalManualAssets,
        householdCpfTotal,
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
        monthlyHouseholdIncome: financials.householdMonthlyIncome,
        monthlyHouseholdTakeHome: financials.householdTakeHome,
        monthlyHouseholdExpenses: financials.householdMonthlyExpenses,
        monthlySurplus: financials.monthlySurplus,
        emergencyFund: financials.emergencyFund,
        emergencyBufferMonths: Number((financials.emergencyFund / (financials.householdMonthlyExpenses || 1)).toFixed(1))
      },
      accounts: workspaceAccounts,
      investments,
      manualAssets,
      cpf: {
        primaryUser: { name: primaryUser.name, ...primaryUser.cpf, total: primaryCpf },
        partner: partner && partnerVisible ? { name: partner.name, ...partner.cpf, total: partnerCpf } : null,
        householdTotal: householdCpfTotal
      },
      insuranceCoverage: financials.insuranceCoverage
    };
  }

  setAccountSharing(householdId = null, accountNumber, sharing) {
    if (!['FULL', 'TOTAL_ONLY', 'PRIVATE'].includes(sharing)) {
      throw new Error('Sharing must be FULL, TOTAL_ONLY or PRIVATE');
    }
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    const account = household?.accounts.ocbc.find((item) => item.number === accountNumber);
    if (!account) {
      throw new Error('Account not found');
    }
    // Joint accounts are visible to both holders by definition.
    if (account.owner === 'joint') {
      throw new Error('Joint accounts are always shared with both holders');
    }
    account.sharing = sharing;
    householdStore.recordAudit(household.id, 'SET_ACCOUNT_SHARING', { accountNumber, sharing });
    return account;
  }

  addManualAsset(householdId = null, asset = {}) {
    const label = String(asset.label || '').trim();
    const balance = Number(asset.balance);
    if (!label || !Number.isFinite(balance) || balance < 0) {
      throw new Error('A label and a non-negative balance are required');
    }
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) {
      throw new Error('Household not found');
    }
    return householdStore.addManualAsset(household.id, {
      label: label.slice(0, 60),
      owner: asset.owner === 'partner' ? 'partner' : 'primary',
      balance: Math.round(balance)
    });
  }
}

module.exports = new WorkspaceService();

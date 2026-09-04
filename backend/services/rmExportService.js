const householdStore = require('../models/householdStore');
const orchestratorAgent = require('../agents/orchestratorAgent');

class RMExportService {
  /**
   * Generates a Relationship Manager (RM) briefing packet with granular privacy consent filtering.
   */
  async generateBriefing(householdId = null, consentOptions = {}) {
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) {
      throw new Error('Household not found');
    }

    const {
      shareJointOnly = false,
      maskNric = true,
      includeHealthMetrics = true,
      includeMilestones = true,
      includeProtectionGaps = true,
      shareGovernmentGrants = true
    } = consentOptions;

    const analysis = await orchestratorAgent.runFullAnalysis(household);

    // Format primary & partner user profiles with privacy masking
    const primaryName = household.primaryUser.name;
    const partnerName = household.partner ? household.partner.name : null;
    const maskedNric = maskNric ? household.primaryUser.nric : household.primaryUser.nric.replace(/\*/g, '8');

    // Filter accounts based on consent
    let visibleAccounts = [];
    if (shareJointOnly) {
      visibleAccounts = household.accounts.ocbc.filter(a => a.role?.toLowerCase().includes('joint') || a.role?.toLowerCase().includes('salary'));
    } else {
      visibleAccounts = [
        ...household.accounts.ocbc,
        ...household.accounts.otherBanks.map(b => ({ ...b, bank: b.bank, note: 'SGFinDex Consolidated' }))
      ];
    }

    const advisorBriefing = {
      exportId: `RM-BRIEF-${Date.now().toString(36).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      bankBranch: 'OCBC Tampines Central Branch',
      rmAdvisorRole: 'Premier Wealth & Family Advisory',
      householdSummary: {
        householdName: `${primaryName} & ${partnerName || 'Family'}`,
        nricMasked: maskedNric,
        segment: household.segment,
        dependentsCount: household.dependents ? household.dependents.length : 0,
        housingMilestone: household.housing.type
      },
      privacyConsentFlags: {
        shareJointOnly,
        maskNric,
        includeHealthMetrics,
        includeMilestones,
        includeProtectionGaps,
        shareGovernmentGrants
      },
      financialSnapshot: {
        householdMonthlyIncome: household.financials.householdMonthlyIncome,
        monthlySurplus: household.financials.monthlySurplus,
        emergencyBuffer: `${analysis.agents.health.metrics.emergencyBufferMonths} months`,
        healthScore: analysis.overallHealthScore,
        liquidAccounts: visibleAccounts
      },
      keyDiscussionTopicsForRM: [
        includeProtectionGaps && analysis.agents.health.metrics.protectionGap > 0 ? {
          topic: 'Protection Gap Review',
          priority: 'HIGH',
          context: `Household has an identified S$${analysis.agents.health.metrics.protectionGap.toLocaleString()} life/mortgage protection deficit.`,
          solutionProposal: 'Great Eastern GREAT FlexiLife Term or SupremeHealth rider'
        } : null,
        includeMilestones ? {
          topic: 'BTO Key Collection Liquidity Strategy',
          priority: 'MEDIUM',
          context: `Target milestone in ${household.housing.keyCollectionDate || '2027'} requiring S$16,000 cash accumulation.`,
          solutionProposal: 'Review high-yield sweep progress and CPF OA usage ratio'
        } : null,
        shareGovernmentGrants ? {
          topic: 'Government Co-Matching & CDA Maximization',
          priority: 'LOW',
          context: `Discovered S$${analysis.totalGrantsAvailable.toLocaleString()} in eligible grants.`,
          solutionProposal: 'Ensure OCBC CDA account is operational to capture full $4,000 match'
        } : null
      ].filter(Boolean),
      recommendedNextSteps: [
        '1. Review household insurance coverage with licensed Great Eastern specialist.',
        '2. Confirm CPF Ordinary Account vs Cash split for BTO flat final balance payment.',
        '3. Authorize automated monthly surplus routing into LionGlobal SGD MMF.'
      ]
    };

    householdStore.recordAudit(household.id, 'EXPORT_RM_BRIEF', { exportId: advisorBriefing.exportId, shareJointOnly });
    return advisorBriefing;
  }
}

module.exports = new RMExportService();

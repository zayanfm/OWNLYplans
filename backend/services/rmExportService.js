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
      shareGovernmentGrants = true,
      includeScenarios = true
    } = consentOptions;

    const analysis = await orchestratorAgent.runFullAnalysis(household);
    const proposal = householdStore.getProposal(household.id);

    // Format primary & partner user profiles with privacy masking
    const primaryName = household.primaryUser.name;
    const partnerName = household.partner ? household.partner.name : null;
    const maskedNric = maskNric ? household.primaryUser.nric : household.primaryUser.nric.replace(/\*/g, '8');

    // Filter accounts based on consent; each owner's sharing choice still applies to the RM.
    const sharedAccounts = household.accounts.ocbc
      .filter(a => a.sharing !== 'PRIVATE')
      .map(a => (a.sharing === 'TOTAL_ONLY'
        ? { type: 'OCBC account (details private)', holder: a.holder, balance: a.balance }
        : a));
    let visibleAccounts = [];
    if (shareJointOnly) {
      visibleAccounts = sharedAccounts.filter(a => a.owner === 'joint' || a.role?.toLowerCase().includes('salary'));
    } else {
      visibleAccounts = [
        ...sharedAccounts,
        ...(household.manualAssets || []).map(asset => ({ type: asset.label, holder: asset.owner, balance: asset.balance, note: 'Self-declared, held outside OCBC' }))
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
          topic: String(household.housing.type).includes('BTO') ? 'BTO Purchase Readiness' : 'Home Loan Resilience',
          priority: 'MEDIUM',
          context: String(household.housing.type).includes('BTO')
            ? `S$${Number(household.housing.downpaymentAccumulated || 0).toLocaleString()} of the S$${Number(household.housing.downpaymentRequired || 0).toLocaleString()} home-purchase target is accumulated.`
            : `Current monthly instalment is S$${Number(household.housing.monthlyLoanInstalment || 0).toLocaleString()}; the plan targets a 12-month payment reserve outside the emergency fund.`,
          solutionProposal: String(household.housing.type).includes('BTO')
            ? 'Review CPF OA and cash split, purchase costs and key-collection liquidity'
            : 'Review reserve progress, repricing options and CPF OA versus cash servicing'
        } : null,
        shareGovernmentGrants ? {
          topic: 'Government Support Eligibility Review',
          priority: 'LOW',
          context: analysis.totalGrantsAvailable > 0
            ? `About S$${analysis.totalGrantsAvailable.toLocaleString()} in support is estimated as available or upcoming from published scheme rules.`
            : 'No benefit value is included because household-level citizenship and current scheme criteria require verification.',
          solutionProposal: 'Confirm eligibility against current agency records before including support in projections'
        } : null
      ].filter(Boolean),
      recommendedNextSteps: [
        '1. Review household insurance coverage with licensed Great Eastern specialist.',
        String(household.housing.type).includes('BTO')
          ? '2. Confirm the CPF OA and cash split for the BTO purchase milestone.'
          : '2. Review the mortgage-payment reserve, repricing options and CPF OA versus cash servicing.',
        '3. Authorize automated monthly surplus routing into LionGlobal SGD MMF.'
      ],
      // Structured planning context so the family does not have to re-explain it (#12).
      familyGoals: includeMilestones
        ? analysis.agents.goals.goals.map(goal => ({
          goal: goal.name,
          target: goal.targetAmount,
          saved: goal.currentAmount,
          shortfall: goal.shortfall,
          deadline: goal.deadline,
          monthlyInPlan: goal.suggestedMonthlyAllocation,
          status: goal.status
        }))
        : [],
      scenariosExplored: includeScenarios
        ? householdStore.getScenarios(household.id).map(item => ({ exploredAt: item.exploredAt, levers: item.levers, outcome: item.summary }))
        : [],
      planDecision: proposal
        ? {
          plan: proposal.finalPlanId || proposal.planId,
          status: proposal.status,
          partnerResponse: proposal.response?.message || null
        }
        : null,
      decisionsForAdviser: [
        includeProtectionGaps && analysis.agents.health.metrics.protectionGap > 0
          ? `Choose protection cover for the S$${analysis.agents.health.metrics.protectionGap.toLocaleString()} gap (licensed adviser required).`
          : null,
        includeMilestones && String(household.housing.type).includes('BTO')
          ? 'Decide the CPF OA versus cash split for the BTO downpayment and loan.'
          : null,
        'Confirm suitability before long-horizon goal savings are invested.'
      ].filter(Boolean)
    };

    householdStore.recordAudit(household.id, 'EXPORT_RM_BRIEF', { exportId: advisorBriefing.exportId, shareJointOnly });
    return advisorBriefing;
  }
}

module.exports = new RMExportService();

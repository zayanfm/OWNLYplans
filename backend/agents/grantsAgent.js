class GrantsAgent {
  async analyze(household) {
    const citizenship = String(household.primaryUser?.citizenship || '').toLowerCase();
    const isSingaporeCitizen = citizenship.includes('singapore');
    const grants = [];

    grants.push({
      id: 'government_support_review', name: 'Government Support Eligibility Review', category: 'FAMILY',
      amount: 0, status: 'VERIFY_ELIGIBILITY', agency: 'LifeSG / relevant agencies',
      reason: isSingaporeCitizen
        ? 'Alex and Lila are Singapore Citizens, but scheme eligibility still depends on current income, property, child and application criteria.'
        : `The MockPass profile records citizenship as ${household.primaryUser.citizenship || 'unavailable'}; household-level eligibility needs verification.`,
      action: 'Verify the household against current agency criteria before counting any benefit'
    });

    return {
      agentId: 'grants_agent', agentName: 'Grants & Government Benefits Agent',
      status: 'VERIFICATION_REQUIRED', confidence: 0.99,
      totalGrantValue: 0, unclaimedCount: 0, grants,
      findings: [
        'No government benefit has been counted as confirmed from the currently consented data.',
        isSingaporeCitizen
          ? 'Scheme eligibility still requires household-level checks against current agency criteria.'
          : 'Citizen-only schemes are excluded until the citizenship of the applicant, children and home co-owner is verified.',
        'OWNLYplan will present potential support as a review action, never as guaranteed money.'
      ]
    };
  }
}

module.exports = new GrantsAgent();

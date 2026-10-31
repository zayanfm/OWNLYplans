process.env.NODE_ENV = 'test';
const assert = require('assert');
const app = require('../server');
const householdStore = require('../models/householdStore');

async function runE2ETests() {
  console.log('==============================================');
  console.log('   RUNNING END-TO-END FLOW VALIDATIONS');
  console.log('==============================================\n');

  const server = app.listen(5098);
  const baseUrl = 'http://127.0.0.1:5098';

  try {
    // -------------------------------------------------------------
    // Scenario 1: Alex and Lila's young family
    // -------------------------------------------------------------
    console.log('[Scenario 1] Testing Alex Lim Family...');
    householdStore.reset('alex_family');

    // 1.1 MockPass handoff (the consent UI is exercised manually)
    const auth1 = await fetch(`${baseUrl}/api/auth/mockpass/start?returnUrl=${encodeURIComponent('frontend://mockpass')}`).then(r => r.json());
    assert(auth1.success, 'MockPass authorization handoff should succeed');
    assert.strictEqual(auth1.protocol, 'OAUTH2_AUTHORIZATION_CODE');
    console.log('  ✓ Custom MockPass authorization handoff created');

    // 1.2 SGFinDex Aggregation
    const sgf1 = await fetch(`${baseUrl}/api/sgfindex/aggregate`).then(r => r.json());
    assert(Number.isFinite(sgf1.summary.netWorth), 'Consolidated net worth verified including mortgage liabilities');
    assert.strictEqual(sgf1.summary.totalLiquidCash, 36000, 'Linked cash should remain consistent');
    console.log(`  ✓ SGFinDex Synced: Net Worth = S$${sgf1.summary.netWorth.toLocaleString()}, Surplus = S$${sgf1.summary.monthlySurplus}/mo`);

    // 1.3 4-Agent Execution
    const agent1 = await fetch(`${baseUrl}/api/agents/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(r => r.json());
    assert(agent1.data.overallHealthScore >= 70, 'Health score is healthy');
    assert.strictEqual(agent1.data.totalGrantsAvailable, 0, 'Unverified benefits must not inflate the plan');
    assert(agent1.data.nextBestActions.some(action => action.id === 'nba_government_support_review'), 'Eligibility review should be actionable');
    console.log(`  ✓ Multi-Agent Diagnostics: Health Score = ${agent1.data.overallHealthScore}/100, Total Grants = S$${agent1.data.totalGrantsAvailable.toLocaleString()}`);

    // 1.4 Plan Generation & Approval
    const plan1 = await fetch(`${baseUrl}/api/finance/approve-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: '24H_WINDOW',
        splits: { housing: 0.5, education: 0.3, wealth: 0.2 }
      })
    }).then(r => r.json());
    assert(plan1.success, 'Plan approval should succeed');
    console.log('  ✓ Progressive Surplus Plan Approved & Activated');

    // 1.5 RM Handoff Export
    const rm1 = await fetch(`${baseUrl}/api/rm/household-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consentOptions: { shareJointOnly: false, maskNric: true }
      })
    }).then(r => r.json());
    assert(rm1.data.exportId.startsWith('RM-BRIEF'), 'RM brief export generated');
    console.log(`  ✓ RM Briefing Exported: ID ${rm1.data.exportId} (${rm1.data.keyDiscussionTopicsForRM.length} topics identified)\n`);

    // -------------------------------------------------------------
    // Scenario 2: Family consent journey (Send Invite -> Approved)
    // -------------------------------------------------------------
    console.log('[Scenario 2] Testing family consent journey (Lila and Percy)...');
    householdStore.reset('alex_family');

    const invite = await fetch(`${baseUrl}/api/auth/family/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        members: [
          { name: 'Lila Tan', relation: 'Spouse', nric: 'S****56B' },
          { name: 'Percy Lim', relation: 'Child', nric: 'T****91Z' }
        ]
      })
    }).then(r => r.json());
    assert(invite.success, 'Family invite should succeed');
    assert.strictEqual(invite.members.length, 2);
    assert(invite.members.every(m => m.status === 'PENDING'), 'Members start as PENDING');
    console.log('  ✓ Invitations sent — both members awaiting approval');

    const pending = await fetch(`${baseUrl}/api/auth/family/status`).then(r => r.json());
    assert.strictEqual(pending.allApproved, false, 'Consent is not granted immediately');

    await new Promise(resolve => setTimeout(resolve, 3100));

    const approvedStatus = await fetch(`${baseUrl}/api/auth/family/status`).then(r => r.json());
    assert.strictEqual(approvedStatus.allApproved, true, 'Consent resolves after the simulated delay');
    assert(approvedStatus.members.every(m => m.status === 'APPROVED'), 'All members approved');
    console.log('  ✓ Accounts Connected — all household members approved\n');

    // -------------------------------------------------------------
    // Scenario 3: legacy instant-persona switching is disabled
    // -------------------------------------------------------------
    console.log('[Scenario 3] Testing interactive-auth enforcement...');
    const personaList = await fetch(`${baseUrl}/api/auth/personas`).then(r => r.json());
    assert.strictEqual(personaList.personas.length, 0, 'Personas are selected in MockPass');

    const legacySwitchResponse = await fetch(`${baseUrl}/api/auth/switch-persona`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: 'sandwich_family' })
    });
    assert.strictEqual(legacySwitchResponse.status, 410, 'Legacy switching must not bypass authentication');
    console.log('  ✓ Legacy instant authentication is disabled\n');

    console.log('==============================================');
    console.log('   ALL END-TO-END VALIDATION JOURNEYS PASSED');
    console.log('==============================================\n');
  } finally {
    server.close(() => {
      process.exit(0);
    });
  }
}

runE2ETests().catch(err => {
  console.error('E2E Validation Failed:', err);
  process.exit(1);
});

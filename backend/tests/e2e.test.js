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
    // Scenario 1: Dual Income Young Family (Alex & Mary Tan)
    // -------------------------------------------------------------
    console.log('[Scenario 1] Testing Alex & Mary Tan (Young BTO Family)...');
    householdStore.reset('alex_mary_bto');

    // 1.1 MockPass Login
    const auth1 = await fetch(`${baseUrl}/api/auth/mockpass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: 'alex_mary_bto' })
    }).then(r => r.json());
    assert(auth1.success, 'MockPass Auth should succeed');
    assert.strictEqual(auth1.user.name, 'Alex Tan');
    assert.strictEqual(auth1.partner.name, 'Mary Lim');
    console.log('  ✓ MockPass Singpass OIDC Authenticated: Alex Tan & Mary Lim');

    // 1.2 SGFinDex Aggregation
    const sgf1 = await fetch(`${baseUrl}/api/sgfindex/aggregate`).then(r => r.json());
    assert(sgf1.summary.netWorth > 200000, 'Consolidated net worth verified');
    console.log(`  ✓ SGFinDex Synced: Net Worth = S$${sgf1.summary.netWorth.toLocaleString()}, Surplus = S$${sgf1.summary.monthlySurplus}/mo`);

    // 1.3 4-Agent Execution
    const agent1 = await fetch(`${baseUrl}/api/agents/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(r => r.json());
    assert(agent1.data.overallHealthScore >= 70, 'Health score is healthy');
    assert(agent1.data.totalGrantsAvailable >= 45000, 'Grants discovered for BTO & Child');
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
    // Scenario 2: Sandwiched Generation Family (David & Grace Tan)
    // -------------------------------------------------------------
    console.log('[Scenario 2] Testing Sandwiched Generation Persona (David & Grace)...');
    householdStore.reset('sandwich_family');

    const auth2 = await fetch(`${baseUrl}/api/auth/switch-persona`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: 'sandwich_family' })
    }).then(r => r.json());
    assert.strictEqual(auth2.user.name, 'David Tan');
    console.log('  ✓ Switched to Persona: David Tan & Grace Wong');

    const agent2 = await fetch(`${baseUrl}/api/agents/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(r => r.json());
    assert(agent2.data.agents.health.metrics.protectionGap >= 300000, 'Higher protection gap for sandwiched family');
    console.log(`  ✓ Sandwiched Family Health & Senior Grants Analyzed (Protection Gap: S$${agent2.data.agents.health.metrics.protectionGap.toLocaleString()})\n`);

    // -------------------------------------------------------------
    // Scenario 3: Single Emerging Affluent Professional (Chloe Teo)
    // -------------------------------------------------------------
    console.log('[Scenario 3] Testing Emerging Affluent Single (Chloe Teo)...');
    householdStore.reset('single_achiever');

    const auth3 = await fetch(`${baseUrl}/api/auth/switch-persona`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: 'single_achiever' })
    }).then(r => r.json());
    assert.strictEqual(auth3.user.name, 'Chloe Teo');
    assert.strictEqual(auth3.partner, null);
    console.log('  ✓ Single Achiever Profile Verified (Solo Goal Tracking)');

    const agent3 = await fetch(`${baseUrl}/api/agents/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(r => r.json());
    assert(agent3.data.nextBestActions.length > 0);
    console.log(`  ✓ Single Achiever Wealth Compounding Roadmap Created\n`);

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

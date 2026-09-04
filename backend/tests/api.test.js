process.env.NODE_ENV = 'test';
const assert = require('assert');
const app = require('../server');

async function testApi() {
  console.log('--- RUNNING API INTEGRATION TESTS ---');

  const server = app.listen(5099);

  try {
    const baseUrl = 'http://127.0.0.1:5099';

    // 1. Health
    const healthRes = await fetch(`${baseUrl}/api/health`).then(r => r.json());
    assert.strictEqual(healthRes.status, 'UP');
    console.log('✓ Health Endpoint OK');

    // 2. Official MockPass authorization handoff
    const authRes = await fetch(`${baseUrl}/api/auth/mockpass/start?returnUrl=${encodeURIComponent('frontend://mockpass')}`).then(r => r.json());
    assert(authRes.success, 'Auth handoff should succeed');
    assert.strictEqual(authRes.provider, '@opengovsg/mockpass');
    assert(authRes.authorizationUrl.includes('/myinfo/v3/authorise'), 'MyInfo v3 authorization URL expected');
    console.log('✓ MockPass MyInfo v3 Handoff OK');

    // 3. SGFinDex Aggregation
    const sgfRes = await fetch(`${baseUrl}/api/sgfindex/aggregate`).then(r => r.json());
    assert(sgfRes.success, 'SGFinDex should succeed');
    assert(Number.isFinite(sgfRes.summary.netWorth), 'Net worth should be calculated including the mortgage');
    assert.strictEqual(sgfRes.summary.totalLiquidCash, 36000, 'Linked cash should match the Freya fixture');
    console.log('✓ SGFinDex Aggregation OK');

    // 4. Multi-Agent Analysis
    const agentRes = await fetch(`${baseUrl}/api/agents/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).then(r => r.json());
    assert(agentRes.success, 'Agent analyze should succeed');
    assert(agentRes.data.nextBestActions.length > 0, 'NBAs present');
    assert(['GEMINI_2_5_FLASH', 'DETERMINISTIC_FALLBACK'].includes(agentRes.data.intelligenceSource), 'AI source should be disclosed');
    assert.strictEqual(agentRes.data.calculationSource, 'DETERMINISTIC_RULE_ENGINE', 'Financial calculations must remain deterministic');
    const agentStatusRes = await fetch(`${baseUrl}/api/agents/status`).then(r => r.json());
    assert.strictEqual(typeof agentStatusRes.gemini.configured, 'boolean', 'Gemini configuration status should be exposed');
    console.log('✓ Agents Analyze OK');

    // 5. Finance Overview & Plan
    const finRes = await fetch(`${baseUrl}/api/finance/overview`).then(r => r.json());
    assert(finRes.metrics.monthlySurplus === 1340, 'Surplus should match');

    const tailoredPlanRes = await fetch(`${baseUrl}/api/finance/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeline: '10',
        split: { housing: 0.4, education: 0.2, wealth: 0.4 },
        priorities: ['wealth', 'housing', 'education'],
        protection: { enabled: true, tier: 'enhanced' },
        predictionScenario: 'growth',
        mode: 'FULL_AUTO'
      })
    }).then(r => r.json());
    assert(tailoredPlanRes.success, 'Tailored plan should generate');
    assert.strictEqual(tailoredPlanRes.plan.routes[0].key, 'wealth', 'Priority order should be preserved');
    assert.strictEqual(tailoredPlanRes.plan.protection.monthlyPremium, 52, 'Protection choice should affect commitments');
    assert.strictEqual(tailoredPlanRes.plan.predictionScenario, 'growth', 'Prediction scenario should be preserved');
    assert.strictEqual(tailoredPlanRes.plan.timelineYears, 10, 'Timeline should be preserved');
    assert.strictEqual(tailoredPlanRes.plan.summary.totalMonthlyCommitted, 1340, 'Routes and protection should fit the available surplus');
    console.log('✓ Editable Plan Configuration OK');
    console.log('✓ Finance Overview OK');

    // 6. Persona selection belongs to the official MockPass login page
    const personaRes = await fetch(`${baseUrl}/api/auth/personas`).then(r => r.json());
    assert.strictEqual(personaRes.personas.length, 0);
    assert.strictEqual(personaRes.source, '@opengovsg/mockpass login page');
    console.log('✓ MockPass Owns Persona Selection');

    // 7. Family invite & consent status
    const inviteRes = await fetch(`${baseUrl}/api/auth/family/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members: [{ name: 'Lim Junhao', relation: 'Child', nric: 'T****09G' }] })
    }).then(r => r.json());
    assert(inviteRes.success, 'Family invite should succeed');
    assert.strictEqual(inviteRes.members[0].status, 'PENDING');
    console.log('✓ Family Invite OK');

    const pendingRes = await fetch(`${baseUrl}/api/auth/family/status`).then(r => r.json());
    assert.strictEqual(pendingRes.allApproved, false, 'Consent should still be pending');

    await new Promise(resolve => setTimeout(resolve, 3100));

    const approvedRes = await fetch(`${baseUrl}/api/auth/family/status`).then(r => r.json());
    assert.strictEqual(approvedRes.allApproved, true, 'Consent resolves after the delay');
    console.log('✓ Family Consent Status OK');

    const emptyInvite = await fetch(`${baseUrl}/api/auth/family/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members: [] })
    });
    assert.strictEqual(emptyInvite.status, 400, 'Empty invite should be rejected');
    console.log('✓ Family Invite Validation OK');

    // 8. RM Household Summary Export
    const rmRes = await fetch(`${baseUrl}/api/rm/household-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentOptions: { shareJointOnly: false } })
    }).then(r => r.json());
    assert(rmRes.success, 'RM summary should succeed');
    assert(rmRes.data.exportId.startsWith('RM-BRIEF'), 'Briefing ID generated');
    console.log('✓ RM Brief Export OK');

    console.log('--- ALL API INTEGRATION TESTS PASSED ---\n');
  } finally {
    server.close(() => {
      process.exit(0);
    });
  }
}

testApi().catch(err => {
  console.error('API Test Failed:', err);
  process.exit(1);
});

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

    // 2. MockPass Auth
    const authRes = await fetch(`${baseUrl}/api/auth/mockpass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: 'alex_mary_bto' })
    }).then(r => r.json());
    assert(authRes.success, 'Auth should succeed');
    assert.strictEqual(authRes.user.name, 'Alex Tan');
    console.log('✓ MockPass Auth OK');

    // 3. SGFinDex Aggregation
    const sgfRes = await fetch(`${baseUrl}/api/sgfindex/aggregate`).then(r => r.json());
    assert(sgfRes.success, 'SGFinDex should succeed');
    assert(sgfRes.summary.netWorth > 0, 'Net worth calculated');
    console.log('✓ SGFinDex Aggregation OK');

    // 4. Multi-Agent Analysis
    const agentRes = await fetch(`${baseUrl}/api/agents/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).then(r => r.json());
    assert(agentRes.success, 'Agent analyze should succeed');
    assert(agentRes.data.nextBestActions.length > 0, 'NBAs present');
    console.log('✓ Agents Analyze OK');

    // 5. Finance Overview & Plan
    const finRes = await fetch(`${baseUrl}/api/finance/overview`).then(r => r.json());
    assert(finRes.metrics.monthlySurplus === 1340, 'Surplus should match');
    console.log('✓ Finance Overview OK');

    // 6. Single family persona
    const personaRes = await fetch(`${baseUrl}/api/auth/personas`).then(r => r.json());
    assert.strictEqual(personaRes.personas.length, 1, 'Only the family persona ships');
    assert.strictEqual(personaRes.personas[0].id, 'alex_mary_bto');
    console.log('✓ Single Family Persona OK');

    // 7. Family invite & consent status
    const inviteRes = await fetch(`${baseUrl}/api/auth/family/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members: [{ name: 'Mary Lim', relation: 'Spouse', nric: 'S****456B' }] })
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

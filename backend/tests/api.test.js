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
    assert.strictEqual(authRes.provider, 'OWNLYplans MockPass Sandbox');
    assert(authRes.authorizationUrl.includes('/api/auth/mockpass/authorize'), 'Sandbox authorization URL expected');
    console.log('✓ Custom MockPass authorization handoff OK');

    // 3. Family Financial Workspace (MyInfo + OCBC accounts)
    const wsRes = await fetch(`${baseUrl}/api/household/workspace`).then(r => r.json());
    assert(wsRes.success, 'Workspace should succeed');
    assert.deepStrictEqual(wsRes.sources, ['Singpass MyInfo', 'OCBC accounts']);
    assert.strictEqual(wsRes.partnerConsent, 'NOT_INVITED', 'Partner accounts wait for consent');
    assert.strictEqual(wsRes.summary.totalLiquidCash, 27650, 'Only Alex and joint OCBC cash before Lila consents');
    assert(wsRes.accounts.filter(a => a.owner === 'partner').every(a => a.balance === null), 'Partner balances hidden before consent');
    const manualRes = await fetch(`${baseUrl}/api/household/manual-assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.strictEqual(manualRes.status, 404, 'Savings outside OCBC are not collected');
    const jointSharing = await fetch(`${baseUrl}/api/household/sharing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountNumber: '512-773104-003', sharing: 'PRIVATE' })
    });
    assert.strictEqual(jointSharing.status, 400, 'Joint accounts cannot be made private by one holder');
    console.log('✓ Family Workspace OK');

    // 3b. Our Family Picture
    const pictureRes = await fetch(`${baseUrl}/api/household/picture`).then(r => r.json());
    assert(pictureRes.success, 'Picture should succeed');
    assert.strictEqual(pictureRes.cashflow.freeToPlan, 1340);
    const educationGoal = pictureRes.goals.find(g => g.key === 'education');
    assert(educationGoal.support.some(s => s.id === 'cda_matching_percy'), 'CDA support appears inside the education goal');
    assert(pictureRes.support.notEligible.some(s => s.id === 'ehg_housing_grant'), 'Ineligible schemes are explained');
    console.log('✓ Family Picture OK');

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

    const optimisedPlanRes = await fetch(`${baseUrl}/api/finance/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'home_first' })
    }).then(r => r.json());
    assert.strictEqual(optimisedPlanRes.plan.optimiserPlanId, 'home_first', 'Without a split, the chosen optimiser plan drives routing');
    const optimisedTotal = optimisedPlanRes.plan.routes.reduce((sum, route) => sum + route.monthlyAmount, 0) + optimisedPlanRes.plan.emergencyReserve.monthlyAmount;
    assert.strictEqual(optimisedTotal, optimisedPlanRes.plan.investableSurplus, 'Routes plus the emergency top-up use the investable surplus');
    console.log('✓ Optimiser-Driven Plan OK');

    // 5b. Decision engine endpoints
    const plansRes = await fetch(`${baseUrl}/api/scenarios/plans`).then(r => r.json());
    assert.strictEqual(plansRes.recommendedPlanId, 'balanced');
    const simulateRes = await fetch(`${baseUrl}/api/scenarios/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levers: { incomeChangePct: -10 } })
    }).then(r => r.json());
    assert(simulateRes.success && simulateRes.surplusAfter < simulateRes.surplusBefore, 'Income cut lowers the surplus');
    console.log('✓ Plans & What-if Endpoints OK');

    // 5c. Grow: readiness, advisory trigger, scripted check-in
    const growRes = await fetch(`${baseUrl}/api/grow/overview`).then(r => r.json());
    assert(growRes.readiness.ready, 'Floor, short-term goal and risk profile checks pass');
    assert(growRes.readiness.suggestions.every(s => s.goalKey !== 'housing' && s.goalKey !== 'emergency'), 'Only long-horizon goals are invested');
    assert(growRes.readiness.handoff, 'Execution hands off to OCBC');
    assert(growRes.advisory.recommended, 'BTO + child + protection gap triggers the advisory card');
    const reviewRes = await fetch(`${baseUrl}/api/grow/reviews/simulate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.json());
    assert.strictEqual(reviewRes.review.surplusAfter, reviewRes.review.surplusBefore - 200, 'Check-in applies the detected S$200 increase');
    assert.deepStrictEqual(reviewRes.review.suggestions.map(s => s.id), ['accept', 'revise', 'reject']);
    const badDecision = await fetch(`${baseUrl}/api/grow/reviews/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewId: reviewRes.review.id, decision: 'maybe' }) });
    assert.strictEqual(badDecision.status, 400, 'Unknown review decisions are rejected');
    console.log('✓ Grow Overview & Check-in OK');

    // 6. Persona selection belongs to the sandbox login page
    const personaRes = await fetch(`${baseUrl}/api/auth/personas`).then(r => r.json());
    assert.strictEqual(personaRes.personas.length, 0);
    assert.strictEqual(personaRes.source, 'OWNLYplans MockPass Sandbox login page');
    console.log('✓ MockPass Owns Persona Selection');

    // 7. Family invite & consent status
    const inviteRes = await fetch(`${baseUrl}/api/auth/family/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members: [{ name: 'Percy Lim', relation: 'Child', nric: 'T****91Z' }] })
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
    assert(rmRes.data.familyGoals.length >= 4, 'Briefing carries the family goals');
    assert(rmRes.data.scenariosExplored.length > 0, 'Briefing carries the what-ifs the family explored');
    assert(rmRes.data.decisionsForAdviser.length > 0, 'Briefing lists decisions needing professional review');
    const privateRes = await fetch(`${baseUrl}/api/rm/household-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentOptions: { includeScenarios: false, includeMilestones: false } })
    }).then(r => r.json());
    assert.strictEqual(privateRes.data.scenariosExplored.length, 0, 'Scenarios respect consent');
    assert.strictEqual(privateRes.data.familyGoals.length, 0, 'Goals respect consent');
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

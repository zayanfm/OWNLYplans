process.env.NODE_ENV = 'test';
const assert = require('assert');
const app = require('../server');
const { confirmSuggestedGoals } = require('./helpers');

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
    assert.strictEqual(wsRes.summary.totalLiquidCash, 9200, 'Only the joint account counts until Alex chooses to share');
    const share360 = await fetch(`${baseUrl}/api/household/sharing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountNumber: '512-882910-001', sharing: 'FULL' }) }).then(r => r.json());
    assert.strictEqual(share360.sharing, 'FULL');
    const wsShared = await fetch(`${baseUrl}/api/household/workspace`).then(r => r.json());
    assert.strictEqual(wsShared.summary.totalLiquidCash, 27650, 'Alex opted in his 360 account');
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

    // Goals are suggestions until confirmed; only the owner can confirm a personal goal.
    const goalsList = await fetch(`${baseUrl}/api/household/goals`).then(r => r.json());
    assert(goalsList.goals.every(g => g.source), 'Every goal shows where its suggestion came from');
    const partnerPut = await fetch(`${baseUrl}/api/household/goals/retirement_partner`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.strictEqual(partnerPut.status, 403, 'Alex cannot confirm the partner retirement goal');
    const badPut = await fetch(`${baseUrl}/api/household/goals/education`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startYear: 2001 }) });
    assert.strictEqual(badPut.status, 400, 'Past start years are rejected');
    for (const goal of goalsList.goals.filter(g => g.owner !== 'partner')) {
      const put = await fetch(`${baseUrl}/api/household/goals/${goal.key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.json());
      assert(put.goal.confirmed, `${goal.key} confirmed`);
    }
    const customRes = await fetch(`${baseUrl}/api/household/goals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Renovation', amount: 25000, dueDate: '2029-01' }) }).then(r => r.json());
    assert(customRes.goal.key.startsWith('custom_'), 'Custom goal added');
    const deleted = await fetch(`${baseUrl}/api/household/goals/${customRes.goal.key}`, { method: 'DELETE' }).then(r => r.json());
    assert(deleted.removed, 'Custom goal removed');
    confirmSuggestedGoals('alex_family');
    console.log('✓ Goal Confirmation OK');

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
        predictionScenario: 'growth'
      })
    }).then(r => r.json());
    assert(tailoredPlanRes.success, 'Tailored plan should generate');
    assert.strictEqual(tailoredPlanRes.plan.routes[0].key, 'wealth', 'Priority order should be preserved');
    assert.strictEqual(tailoredPlanRes.plan.protection.monthlyPremium, 52, 'Protection choice should affect commitments');
    assert.strictEqual(tailoredPlanRes.plan.predictionScenario, 'growth', 'Prediction scenario should be preserved');
    assert.strictEqual(tailoredPlanRes.plan.timelineYears, 10, 'Timeline should be preserved');
    assert.strictEqual(tailoredPlanRes.plan.summary.totalMonthlyCommitted, 1340, 'Routes and protection should fit the available surplus');
    const autoMode = await fetch(`${baseUrl}/api/finance/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'FULL_AUTO' }) });
    assert.strictEqual(autoMode.status, 400, 'Automatic execution is not offered');
    const unconfirmed = await fetch(`${baseUrl}/api/finance/execute-route`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ routeId: 'r1', amount: 500, fromAccount: '512-441920-002', confirmedBy: 'primary' }) });
    assert.strictEqual(unconfirmed.status, 400, 'Alex cannot move money out of Lila\u2019s account');
    const confirmed = await fetch(`${baseUrl}/api/finance/execute-route`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ routeId: 'r1', amount: 500, fromAccount: '512-773104-003', confirmedBy: 'primary' }) }).then(r => r.json());
    assert(confirmed.success, 'Either holder can confirm a joint-account transfer');
    const unagreed = await fetch(`${baseUrl}/api/finance/approve-plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: { optimiserPlanId: 'balanced' } }) });
    assert.strictEqual(unagreed.status, 409, 'A household plan needs both adults to agree');
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
    const ownPlanRes = await fetch(`${baseUrl}/api/scenarios/plans/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: ['education', 'emergency'], monthlyOverrides: { education: 300 } })
    }).then(r => r.json());
    assert.strictEqual(ownPlanRes.plan.id, 'custom');
    const tooMuch = await fetch(`${baseUrl}/api/scenarios/plans/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyOverrides: { emergency: 50000 } })
    });
    assert.strictEqual(tooMuch.status, 400, 'Amounts above the investable surplus are rejected');
    const customPlanRes = await fetch(`${baseUrl}/api/finance/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: 'custom' }) }).then(r => r.json());
    assert.strictEqual(customPlanRes.plan.optimiserPlanId, 'custom', 'A saved custom plan can be activated');
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

    // 9. Anyone can leave
    const partnerLeaves = await fetch(`${baseUrl}/api/household/leave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member: 'partner' }) }).then(r => r.json());
    assert(partnerLeaves.success && partnerLeaves.reviewNote, 'Partner leaves with a review note for Alex');
    const leaveAgain = await fetch(`${baseUrl}/api/household/leave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member: 'partner' }) });
    assert.strictEqual(leaveAgain.status, 409);
    const primaryLeaves = await fetch(`${baseUrl}/api/household/leave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member: 'primary' }) }).then(r => r.json());
    assert(primaryLeaves.deleted, 'Leaving as the primary user deletes the household data');
    const fresh = await fetch(`${baseUrl}/api/household/goals`).then(r => r.json());
    assert(fresh.goals.every(g => g.status !== 'CONFIRMED'), 'No decisions survive deletion');
    console.log('✓ Leave Household OK');

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

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

    // 1.2 Family Financial Workspace
    const ws1 = await fetch(`${baseUrl}/api/household/workspace`).then(r => r.json());
    assert(Number.isFinite(ws1.summary.netWorth), 'Household net worth calculated from MyInfo and OCBC');
    assert.strictEqual(ws1.summary.totalLiquidCash, 27650, 'Alex and joint OCBC cash before Lila consents');
    console.log(`  ✓ Workspace Built: Net Worth = S$${ws1.summary.netWorth.toLocaleString()}, Surplus = S$${ws1.summary.monthlySurplus}/mo`);

    // 1.3 4-Agent Execution
    const agent1 = await fetch(`${baseUrl}/api/agents/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(r => r.json());
    assert(agent1.data.overallHealthScore >= 70, 'Health score is healthy');
    assert.strictEqual(agent1.data.totalGrantsAvailable, 2800, 'Estimated support from published scheme rules');
    assert(agent1.data.nextBestActions.some(action => action.id === 'nba_grant_cda_matching_percy'), 'CDA matching should be actionable');
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
    // Scenario 2b: Decide together (optimise -> what-if -> propose -> partner reply -> agree)
    // -------------------------------------------------------------
    console.log('[Scenario 2b] Testing the decide-together journey...');
    const options = await fetch(`${baseUrl}/api/scenarios/plans`).then(r => r.json());
    assert.strictEqual(options.plans.length, 3);
    const whatIf = await fetch(`${baseUrl}/api/scenarios/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levers: { extraChild: true } })
    }).then(r => r.json());
    assert(whatIf.goals.some(g => g.isNew), 'What-if shows the new child goal');
    console.log(`  ✓ Optimiser offered ${options.plans.length} plans; what-if surplus ${whatIf.surplusBefore} -> ${whatIf.surplusAfter}`);

    const proposed = await fetch(`${baseUrl}/api/scenarios/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'education_first' })
    }).then(r => r.json());
    assert.strictEqual(proposed.proposal.status, 'PENDING');
    assert.strictEqual(proposed.proposal.partnerResponse, undefined, 'The prepared reply is not leaked early');
    const tooEarly = await fetch(`${baseUrl}/api/scenarios/proposals/resolve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.strictEqual(tooEarly.status, 409, 'Cannot finalise before the partner replies');

    await new Promise(resolve => setTimeout(resolve, 3100));

    const replied = await fetch(`${baseUrl}/api/scenarios/proposals/latest`).then(r => r.json());
    assert.strictEqual(replied.proposal.status, 'SUGGESTED_CHANGE', 'Lila pushes back on a plan that starts retirement lower');
    assert.strictEqual(replied.proposal.response.suggestedPlanId, 'balanced');
    const agreed = await fetch(`${baseUrl}/api/scenarios/proposals/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'balanced' })
    }).then(r => r.json());
    assert.strictEqual(agreed.proposal.status, 'AGREED');
    assert.strictEqual(agreed.proposal.finalPlanId, 'balanced');
    console.log(`  ✓ Lila replied "${replied.proposal.response.message}" and they agreed on ${agreed.proposal.finalPlanId}`);

    // Grow: approve the agreed plan, get a check-in, then hand off to the RM with full context.
    const agreedPlan = await fetch(`${baseUrl}/api/finance/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: agreed.proposal.finalPlanId })
    }).then(r => r.json());
    const approval = await fetch(`${baseUrl}/api/finance/approve-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: agreedPlan.plan })
    }).then(r => r.json());
    assert.strictEqual(approval.plan.optimiserPlanId, 'balanced', 'The agreed plan is the active plan');

    const checkIn = await fetch(`${baseUrl}/api/grow/reviews/simulate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.json());
    await fetch(`${baseUrl}/api/grow/reviews/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId: checkIn.review.id, decision: 'accept' })
    });

    const handoff = await fetch(`${baseUrl}/api/rm/household-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentOptions: {} })
    }).then(r => r.json());
    assert.strictEqual(handoff.data.planDecision.plan, 'balanced', 'RM sees the agreed plan');
    assert(handoff.data.planDecision.partnerResponse.startsWith('Lila'), 'RM sees the partner discussion');
    assert(handoff.data.scenariosExplored.length >= 2, 'RM sees the what-if and the check-in');
    const audit = await fetch(`${baseUrl}/api/finance/audit`).then(r => r.json());
    const actions = audit.logs.map(log => log.action);
    ['PLAN_PROPOSED', 'PLAN_AGREED', 'PLAN_APPROVED', 'REVIEW_RAISED', 'REVIEW_DECISION', 'EXPORT_RM_BRIEF'].forEach(action => {
      assert(actions.includes(action), `Audit trail records ${action}`);
    });
    console.log(`  ✓ Plan approved, check-in accepted, RM briefing ${handoff.data.exportId} carries ${handoff.data.scenariosExplored.length} scenarios\n`);

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

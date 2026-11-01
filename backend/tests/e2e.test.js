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
    assert.strictEqual(ws1.summary.totalLiquidCash, 9200, 'Only the joint account counts until someone shares');
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
      body: JSON.stringify({ plan: { optimiserPlanId: 'balanced' } })
    });
    assert.strictEqual(plan1.status, 409, 'Alex alone cannot activate the household plan');
    console.log('  ✓ Plan activation waits for both adults');

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
    await fetch(`${baseUrl}/api/household/sharing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountNumber: '512-882910-001', sharing: 'FULL' }) });
    const ws2 = await fetch(`${baseUrl}/api/household/workspace`).then(r => r.json());
    assert.strictEqual(ws2.partnerConsent, 'APPROVED');
    assert.strictEqual(ws2.summary.totalLiquidCash, 32200, 'Alex shared his account; Lila shared her Frank account only');
    assert(ws2.accounts.some(a => a.owner === 'partner' && a.sharing === 'PRIVATE' && a.balance === null), 'Lila\'s savings stay private');
    console.log('  ✓ Accounts Connected — all household members approved\n');

    // -------------------------------------------------------------
    // Scenario 2b: Decide together (optimise -> what-if -> propose -> partner reply -> agree)
    // -------------------------------------------------------------
    console.log('[Scenario 2b] Testing the decide-together journey...');
    const goalList = await fetch(`${baseUrl}/api/household/goals`).then(r => r.json());
    assert.strictEqual(goalList.goals.find(g => g.key === 'retirement_partner').status, 'CONFIRMED', 'Lila confirmed her own goal when she accepted');
    for (const goal of goalList.goals.filter(g => g.status === 'NEEDS_DECISION')) {
      await fetch(`${baseUrl}/api/household/goals/${goal.key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    }
    // The family adds their BTO purchase as a Housing goal; the app shows housing support with it.
    const bto = (await fetch(`${baseUrl}/api/household/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'BTO home purchase', category: 'HOUSING', amount: 96000, saved: 80000, dueDate: '2028-09' })
    }).then(r => r.json())).goal;
    const btoInPicture = (await fetch(`${baseUrl}/api/household/picture`).then(r => r.json())).goals.find(g => g.key === bto.key);
    assert(btoInPicture.support.some(s => s.id === 'climate_vouchers'), 'Climate Friendly Households Programme shows under the housing goal');
    const workshop = (await fetch(`${baseUrl}/api/household/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Coding workshop', category: 'EDUCATION', amount: 2000, dueDate: '2027-06' })
    }).then(r => r.json())).goal;
    const pictureGoals = (await fetch(`${baseUrl}/api/household/picture`).then(r => r.json())).goals;
    assert.strictEqual(pictureGoals.find(g => g.key === workshop.key).support.length, 0, 'Percy CDA support does not appear under an unrelated education goal');
    assert(pictureGoals.find(g => g.key === 'education').support.some(s => s.id === 'cda_matching_percy'), 'It stays with the education goal for Percy');
    assert.strictEqual(pictureGoals.find(g => g.key === workshop.key).group, 'EDUCATION');
    await fetch(`${baseUrl}/api/household/goals/${workshop.key}`, { method: 'DELETE' });
    const unplanned = (await fetch(`${baseUrl}/api/scenarios/plans`).then(r => r.json())).needsDecision;
    assert.strictEqual(unplanned.length, 0, 'Every goal is decided before planning');
    console.log('  ✓ Family confirmed every goal; Lila confirmed her own');
    const options = await fetch(`${baseUrl}/api/scenarios/plans`).then(r => r.json());
    assert.strictEqual(options.plans.length, 3);
    const whatIf = await fetch(`${baseUrl}/api/scenarios/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levers: { extraChild: true } })
    }).then(r => r.json());
    assert(whatIf.goals.some(g => g.isNew), 'What-if shows the new child goal');
    console.log(`  ✓ Optimiser offered ${options.plans.length} plans; what-if surplus ${whatIf.surplusBefore} -> ${whatIf.surplusAfter}`);

    // The family tries its own order first; Lila pushes back because it makes the BTO fund late.
    const ownPlan = await fetch(`${baseUrl}/api/scenarios/plans/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: ['education', 'emergency', bto.key], monthlyOverrides: { education: 500 } })
    }).then(r => r.json());
    assert(ownPlan.plan.atRisk.includes(bto.key), 'Own plan leaves the BTO fund late');
    await fetch(`${baseUrl}/api/scenarios/proposals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: 'custom' }) });
    await new Promise(resolve => setTimeout(resolve, 3100));
    const pushback = await fetch(`${baseUrl}/api/scenarios/proposals/latest`).then(r => r.json());
    assert.strictEqual(pushback.proposal.status, 'SUGGESTED_CHANGE', 'Lila asks to keep the BTO fund on track');
    assert(pushback.proposal.response.message.includes('BTO home purchase'), 'Lila names the goal at risk');
    console.log(`  ✓ Own plan proposed; Lila replied "${pushback.proposal.response.message}"`);

    const proposed = await fetch(`${baseUrl}/api/scenarios/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'balanced' })
    }).then(r => r.json());
    assert.strictEqual(proposed.proposal.status, 'PENDING');
    assert.strictEqual(proposed.proposal.partnerResponse, undefined, 'The prepared reply is not leaked early');
    const tooEarly = await fetch(`${baseUrl}/api/scenarios/proposals/resolve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.strictEqual(tooEarly.status, 409, 'Cannot finalise before the partner replies');

    await new Promise(resolve => setTimeout(resolve, 3100));

    const replied = await fetch(`${baseUrl}/api/scenarios/proposals/latest`).then(r => r.json());
    assert.strictEqual(replied.proposal.status, 'AGREED', 'Lila agrees to a plan that keeps every goal on track');
    const afterAgreement = await fetch(`${baseUrl}/api/household/contributions`).then(r => r.json());
    const lilaShare = afterAgreement.people.find(p => p.member === 'partner');
    assert.strictEqual(lilaShare.status, 'CONFIRMED', 'Agreeing to the plan confirms her own share');
    assert.strictEqual(lilaShare.confirmedBy, 'partner', 'Confirmed by Lila, not Alex');
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

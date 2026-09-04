const assert = require('assert');
const healthAgent = require('../agents/healthAgent');
const goalsAgent = require('../agents/goalsAgent');
const grantsAgent = require('../agents/grantsAgent');
const orchestratorAgent = require('../agents/orchestratorAgent');
const householdStore = require('../models/householdStore');

async function runTests() {
  console.log('--- RUNNING AGENTS UNIT TESTS ---');

  const btoHousehold = householdStore.getHousehold('alex_mary_bto');
  assert(btoHousehold, 'BTO household should exist in store');

  // 1. Health Agent
  const healthRes = await healthAgent.analyze(btoHousehold);
  console.log('✓ HealthAgent Score:', healthRes.score);
  assert(healthRes.score > 60, 'Health score should be positive and above 60');
  assert(healthRes.metrics.emergencyBufferMonths > 0, 'Buffer months should be calculated');
  assert(healthRes.metrics.protectionGap === 160000, 'Alex & Mary protection gap should be 160k');

  // 2. Goals Agent
  const goalsRes = await goalsAgent.analyze(btoHousehold);
  console.log('✓ GoalsAgent Count:', goalsRes.goals.length);
  assert(goalsRes.goals.length >= 3, 'Should have at least 3 multi-generational goals');
  const btoGoal = goalsRes.goals.find(g => g.id === 'goal_bto_downpayment');
  assert(btoGoal, 'BTO downpayment goal should exist');
  assert(btoGoal.onTrack === true, 'BTO goal should be on track');

  // 3. Grants Agent
  const grantsRes = await grantsAgent.analyze(btoHousehold);
  console.log('✓ GrantsAgent Total Value:', grantsRes.totalGrantValue);
  assert(grantsRes.totalGrantValue >= 45000, 'Should discover significant housing & CDA grants');
  const cdaGrant = grantsRes.grants.find(g => g.id === 'baby_bonus_cda');
  assert(cdaGrant, 'Baby bonus CDA grant should be discovered for child');

  // 4. Orchestrator Synthesis
  const orchRes = await orchestratorAgent.runFullAnalysis(btoHousehold);
  console.log('✓ Orchestrator NBAs:', orchRes.nextBestActions.length);
  assert(orchRes.nextBestActions.length >= 4, 'Should synthesize at least 4 NBAs');

  // 5. Explainable Chat
  const chatYield = await orchestratorAgent.handleChat(btoHousehold, [], 'Why sweep to LionGlobal MMF?');
  assert(chatYield.reply.includes('3.85%'), 'Chat should explain 3.85% yield');
  console.log('✓ Chat reasoning verified');

  console.log('--- ALL AGENT UNIT TESTS PASSED ---\n');
}

runTests().catch(err => {
  console.error('Agent Tests Failed:', err);
  process.exit(1);
});

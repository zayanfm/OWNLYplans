const assert = require('assert');
const healthAgent = require('../agents/healthAgent');
const goalsAgent = require('../agents/goalsAgent');
const grantsAgent = require('../agents/grantsAgent');
const orchestratorAgent = require('../agents/orchestratorAgent');
const householdStore = require('../models/householdStore');

async function runTests() {
  console.log('--- RUNNING AGENTS UNIT TESTS ---');

  const freyaHousehold = householdStore.getHousehold('freya_family');
  assert(freyaHousehold, 'Freya household should exist in store');

  // 1. Health Agent
  const healthRes = await healthAgent.analyze(freyaHousehold);
  console.log('✓ HealthAgent Score:', healthRes.score);
  assert(healthRes.score > 60, 'Health score should be positive and above 60');
  assert(healthRes.metrics.emergencyBufferMonths > 0, 'Buffer months should be calculated');
  assert(healthRes.metrics.protectionGap === 160000, 'Freya protection gap should be 160k');

  // 2. Goals Agent
  const goalsRes = await goalsAgent.analyze(freyaHousehold);
  console.log('✓ GoalsAgent Count:', goalsRes.goals.length);
  assert(goalsRes.goals.length >= 3, 'Should have at least 3 multi-generational goals');
  const homeGoal = goalsRes.goals.find(g => g.id === 'goal_home_reserve');
  assert(homeGoal, 'Home-loan reserve goal should exist');
  const tenYearGoals = await goalsAgent.analyze(freyaHousehold, { timelineYears: 10 });
  assert(tenYearGoals.goals[1].requiredMonthlyAllocation < goalsRes.goals[1].requiredMonthlyAllocation, 'Longer horizons should lower required monthly education funding');

  // 3. Grants Agent
  const grantsRes = await grantsAgent.analyze(freyaHousehold);
  console.log('✓ GrantsAgent Total Value:', grantsRes.totalGrantValue);
  assert.strictEqual(grantsRes.totalGrantValue, 0, 'Unverified citizen-only benefits must not be counted');
  assert(grantsRes.grants.some(g => g.status === 'VERIFY_ELIGIBILITY'), 'Support eligibility review should be recommended');

  // 4. Orchestrator Synthesis
  const orchRes = await orchestratorAgent.runFullAnalysis(freyaHousehold);
  console.log('✓ Orchestrator NBAs:', orchRes.nextBestActions.length);
  assert(orchRes.nextBestActions.length >= 4, 'Should synthesize at least 4 NBAs');

  // 5. Explainable Chat
  const chatYield = await orchestratorAgent.handleChat(freyaHousehold, [], 'Why sweep idle cash?');
  assert(chatYield.reply.includes('emergency floor'), 'Chat should explain the protected emergency floor');
  console.log('✓ Chat reasoning verified');

  console.log('--- ALL AGENT UNIT TESTS PASSED ---\n');
}

runTests().catch(err => {
  console.error('Agent Tests Failed:', err);
  process.exit(1);
});

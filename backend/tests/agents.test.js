process.env.NODE_ENV = 'test';
const assert = require('assert');
const healthAgent = require('../agents/healthAgent');
const goalsAgent = require('../agents/goalsAgent');
const grantsAgent = require('../agents/grantsAgent');
const orchestratorAgent = require('../agents/orchestratorAgent');
const householdStore = require('../models/householdStore');
const cashflowService = require('../services/cashflowService');

async function runTests() {
  console.log('--- RUNNING AGENTS UNIT TESTS ---');

  const alexHousehold = householdStore.getHousehold('alex_family');
  assert(alexHousehold, 'Alex household should exist in store');

  // 1. Health Agent
  const healthRes = await healthAgent.analyze(alexHousehold);
  console.log('✓ HealthAgent Score:', healthRes.score);
  assert(healthRes.score > 60, 'Health score should be positive and above 60');
  assert(healthRes.metrics.emergencyBufferMonths > 0, 'Buffer months should be calculated');
  assert(healthRes.metrics.protectionGap === 160000, 'Alex household protection gap should be 160k');

  // 2. Goals Agent
  const goalsRes = await goalsAgent.analyze(alexHousehold);
  console.log('✓ GoalsAgent Count:', goalsRes.goals.length);
  assert.deepStrictEqual(goalsRes.goals.map(g => g.key), ['emergency', 'housing', 'education', 'retirement_primary', 'retirement_partner']);
  const homeGoal = goalsRes.goals.find(g => g.key === 'housing');
  assert.strictEqual(homeGoal.deadline, '2028-09', 'BTO goal is due at key collection');
  assert.deepStrictEqual(homeGoal.dependsOn, ['emergency'], 'Home savings depend on the emergency buffer');
  assert.strictEqual(goalsRes.goals.find(g => g.key === 'education').deadline, '2041-04', 'Education is due when Percy turns 18');
  assert.strictEqual(goalsRes.goals.find(g => g.key === 'emergency').targetAmount, 35400, 'Six months of essential spending');
  assert(goalsRes.fundingGap > 0, 'Goals compete for the surplus');
  const growthGoals = await goalsAgent.analyze(alexHousehold, { predictionScenario: 'growth' });
  assert(growthGoals.goals[2].requiredMonthlyAllocation < goalsRes.goals[2].requiredMonthlyAllocation, 'Higher assumed returns lower required education funding');

  // 2b. Cash flow
  const cashflow = cashflowService.analyze(alexHousehold);
  assert.strictEqual(cashflow.totalCommitments, 6900, 'Itemised commitments match household expenses');
  assert.strictEqual(cashflow.freeToPlan, 1340, 'Free-to-plan equals the monthly surplus');
  assert.strictEqual(cashflow.essentialMonthly, 5900);
  console.log('✓ Cashflow Free To Plan:', cashflow.freeToPlan);

  // 3. Grants Agent
  const grantsRes = await grantsAgent.analyze(alexHousehold);
  console.log('✓ GrantsAgent Total Value:', grantsRes.totalGrantValue);
  assert.strictEqual(grantsRes.grants.find(g => g.id === 'ehg_housing_grant').status, 'NOT_ELIGIBLE', 'S$10,300 household income is above the EHG ceiling');
  const matching = grantsRes.grants.find(g => g.id === 'cda_matching_percy');
  assert.strictEqual(matching.amount, 2500, 'Remaining CDA matching = S$4,000 cap - S$1,500 matched');
  assert.strictEqual(matching.fundType, 'RESTRICTED_CDA', 'CDA money is restricted');
  assert.strictEqual(grantsRes.grants.find(g => g.id === 'cash_gift_percy').restricted, false, 'Cash Gift is flexible');
  assert.strictEqual(grantsRes.totalGrantValue, 2800, 'CDA matching plus upcoming climate vouchers');
  assert(grantsRes.upcomingDates.some(d => d.date === '2035-12'), 'CDA closing date is tracked');

  // 4. Orchestrator Synthesis
  const orchRes = await orchestratorAgent.runFullAnalysis(alexHousehold);
  console.log('✓ Orchestrator NBAs:', orchRes.nextBestActions.length);
  assert(orchRes.nextBestActions.length >= 4, 'Should synthesize at least 4 NBAs');

  // 5. Explainable Chat
  const chatYield = await orchestratorAgent.handleChat(alexHousehold, [], 'Why sweep idle cash?');
  assert(chatYield.reply.includes('emergency floor'), 'Chat should explain the protected emergency floor');
  console.log('✓ Chat reasoning verified');

  console.log('--- ALL AGENT UNIT TESTS PASSED ---\n');
}

runTests().catch(err => {
  console.error('Agent Tests Failed:', err);
  process.exit(1);
});

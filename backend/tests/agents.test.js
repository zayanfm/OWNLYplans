process.env.NODE_ENV = 'test';
const assert = require('assert');
const healthAgent = require('../agents/healthAgent');
const goalsAgent = require('../agents/goalsAgent');
const grantsAgent = require('../agents/grantsAgent');
const orchestratorAgent = require('../agents/orchestratorAgent');
const householdStore = require('../models/householdStore');
const cashflowService = require('../services/cashflowService');
const optimiserService = require('../services/optimiserService');
const contributionService = require('../services/contributionService');
const scenarioService = require('../services/scenarioService');
const goalInputService = require('../services/goalInputService');
const { confirmSuggestedGoals, shareAndConsent, addBtoGoal } = require('./helpers');
const workspaceService = require('../services/workspaceService');

async function runTests() {
  console.log('--- RUNNING AGENTS UNIT TESTS ---');

  const alexHousehold = householdStore.getHousehold('alex_family');
  assert(alexHousehold, 'Alex household should exist in store');

  // 0. Nobody's private data is shared by default
  const before = workspaceService.getWorkspace('alex_family');
  assert(before.accounts.filter(a => a.owner !== 'joint').every(a => a.sharing === 'PRIVATE'), 'Personal accounts start private');
  assert.strictEqual(before.summary.totalLiquidCash, 9200, 'Only the joint account counts until someone shares');
  assert.strictEqual(goalInputService.getInputs(alexHousehold).find(g => g.key === 'retirement_partner').status, 'AWAITING_PARTNER', 'Lila confirms her own goal');
  shareAndConsent('alex_family');
  const after = workspaceService.getWorkspace('alex_family');
  assert.strictEqual(after.summary.totalLiquidCash, 32200, 'Alex shared his 360 account and Lila shared her Frank account');
  const lilaSavings = after.accounts.find(a => a.owner === 'partner' && a.sharing === 'PRIVATE');
  assert(lilaSavings && lilaSavings.balance === null && lilaSavings.number === null, 'Lila keeps her savings account private');
  console.log('✓ Private by default; only chosen accounts are shared');

  // 1. Health Agent
  const healthRes = await healthAgent.analyze(alexHousehold);
  console.log('✓ HealthAgent Score:', healthRes.score);
  assert(healthRes.score > 60, 'Health score should be positive and above 60');
  assert(healthRes.metrics.emergencyBufferMonths > 0, 'Buffer months should be calculated');
  assert(healthRes.metrics.protectionGap === 160000, 'Alex household protection gap should be 160k');

  // 2. Goals Agent: nothing is planned until the family confirms it
  const unconfirmed = await goalsAgent.analyze(alexHousehold);
  assert.deepStrictEqual(unconfirmed.goals.map(g => g.key), ['emergency', 'education', 'retirement_primary', 'retirement_partner'], 'No home goal is assumed');
  assert(unconfirmed.goals.filter(g => g.input.owner !== 'partner').every(g => !g.planned), 'Suggestions are not planned until confirmed');
  assert.strictEqual(unconfirmed.goals.find(g => g.key === 'retirement_partner').input.confirmedBy, 'partner', 'Lila confirmed her own goal when she accepted');
  assert.throws(() => goalInputService.update('alex_family', 'retirement_partner', { amount: 300000 }), /Only Lila/, 'Alex cannot set the partner goal');
  assert.throws(() => goalInputService.update('alex_family', 'education', { startYear: 2020 }), /future year/);
  assert.throws(() => goalInputService.update('alex_family', 'emergency', { months: 30 }), /between 3 and 12/);
  assert.deepStrictEqual(optimiserService.optimise(alexHousehold).plans[0].goals.map(g => g.key), ['retirement_partner'], 'The optimiser plans only confirmed goals');

  confirmSuggestedGoals('alex_family');
  const bto = addBtoGoal('alex_family');
  assert.throws(() => goalInputService.addCustom('alex_family', { name: 'X', category: 'BOAT', amount: 5000, dueDate: '2030-01' }), /category must be one of/);
  assert.throws(() => goalInputService.addCustom('alex_family', { name: 'X', category: 'OTHER', amount: 5000, saved: 9000, dueDate: '2030-01' }), /saved must be between/);
  const goalsRes = await goalsAgent.analyze(alexHousehold);
  console.log('✓ GoalsAgent Count:', goalsRes.goals.length);
  const homeGoal = goalsRes.goals.find(g => g.key === bto.key);
  assert.strictEqual(homeGoal.category, 'HOUSING', 'The family filed their BTO under Housing');
  assert.strictEqual(homeGoal.currentAmount, 80000, 'Money already set aside counts');
  assert.deepStrictEqual(goalsRes.goals.find(g => g.key === 'retirement_primary').dependsOn, [bto.key], 'Retirement steps up after the home goal');
  assert.deepStrictEqual(homeGoal.dependsOn, ['emergency'], 'Home savings depend on the emergency buffer');
  const educationGoal = goalsRes.goals.find(g => g.key === 'education');
  assert.strictEqual(educationGoal.deadline, '2042-08', 'Suggested university start at 19, which the family confirmed');
  assert.strictEqual(educationGoal.targetAmount, 44000, '4 years at the suggested S$11,000');
  assert.strictEqual(goalsRes.goals.find(g => g.key === 'emergency').targetAmount, 35400, 'Six months of essential spending');
  assert(goalsRes.fundingGap > 0, 'Goals compete for the surplus');
  assert(goalsRes.goals.filter(g => g.owner === 'household').every(g => g.status === 'ON_TRACK'), 'Shared goals are on track with the suggested contributions');
  assert.strictEqual(goalsRes.goals.find(g => g.key === 'retirement_primary').owner, 'primary', 'Retirement is personal');
  const growthGoals = await goalsAgent.analyze(alexHousehold, { predictionScenario: 'growth' });
  const educationRequired = (result) => result.goals.find(g => g.key === 'education').requiredMonthlyAllocation;
  assert(educationRequired(growthGoals) < educationRequired(goalsRes), 'Higher assumed returns lower required education funding');

  // 2a. The family's own choices drive the plan
  goalInputService.update('alex_family', 'education', { path: 'POLYTECHNIC', startYear: 2040 });
  const polyGoal = (await goalsAgent.analyze(alexHousehold)).goals.find(g => g.key === 'education');
  assert.strictEqual(polyGoal.deadline, '2040-08');
  assert.strictEqual(polyGoal.targetAmount, 9300, 'Polytechnic: 3 years at the suggested S$3,100');
  const custom = goalInputService.addCustom('alex_family', { name: 'Family car', amount: 30000, dueDate: '2030-06' });
  assert((await goalsAgent.analyze(alexHousehold)).goals.some(g => g.key === custom.key && g.planned), 'Custom goals are planned');
  goalInputService.remove('alex_family', custom.key);
  goalInputService.remove('alex_family', 'emergency');
  assert(!optimiserService.optimise(alexHousehold).plans[0].goals.some(g => g.key === 'emergency'), 'Switched-off goals are not planned');
  goalInputService.update('alex_family', 'emergency', { enabled: true });
  goalInputService.update('alex_family', 'education', { path: 'UNIVERSITY' });
  assert.strictEqual(optimiserService.optimise(alexHousehold).needsDecision.length, 0);
  console.log('✓ Goal Inputs: confirm, edit, switch off, custom, categories');

  // 2b. Cash flow
  const cashflow = cashflowService.analyze(alexHousehold);
  assert.strictEqual(cashflow.totalCommitments, 6900, 'Itemised commitments match household expenses');
  assert.strictEqual(cashflow.freeToPlan, 1340, 'Free-to-plan equals the monthly surplus');
  assert.strictEqual(cashflow.essentialMonthly, 5900);
  assert.strictEqual(cashflow.groups.find(g => g.category === 'HOUSING').benchmark.amount, 2122, 'Housing compared with the SingStat 2023 average');
  assert.strictEqual(cashflow.groups.find(g => g.category === 'FAMILY').benchmark, null, 'No benchmark without a like-for-like category');
  console.log('✓ Cashflow Free To Plan:', cashflow.freeToPlan);

  // 2c. Goal optimiser
  const optimised = optimiserService.optimise(alexHousehold);
  assert.strictEqual(optimised.plans.length, 3, 'One recommended plan and two alternatives');
  assert.strictEqual(optimised.plans.filter(p => p.recommended).length, 1);
  assert.strictEqual(optimised.recommendedPlanId, 'balanced');
  assert.strictEqual(optimised.lumpSum, null, 'Shared cash does not exceed the emergency fund plus a month of bills; private savings are never counted');
  optimised.plans.forEach(plan => {
    const routed = Object.values(plan.routes).reduce((sum, value) => sum + value, 0);
    assert.strictEqual(routed + plan.keptFree, optimised.investable, `${plan.id} accounts for every dollar put in: allocated or kept free`);
    assert.strictEqual(plan.goals.find(g => g.key === bto.key).status, 'ON_TRACK', 'BTO deadline is never traded away');
  });
  const homeFirst = optimised.plans.find(p => p.id === 'home_first');
  const balancedPlan = optimised.plans.find(p => p.id === 'balanced');
  assert(homeFirst.routes.housing > balancedPlan.routes.housing, 'Home first pushes the BTO fund harder');
  assert(balancedPlan.stepUps.some(s => s.fromGoal === bto.key), 'BTO money moves on once the fund completes');
  console.log('✓ Optimiser Plans:', optimised.plans.map(p => p.id).join(', '));

  // 2c-i. Who puts in what
  const people = optimised.contributions.people;
  const alex = people.find(p => p.member === 'primary');
  const lila = people.find(p => p.member === 'partner');
  assert.strictEqual(alex.sharedBills + lila.sharedBills, 6600, 'Shared bills are split between them');
  assert(Math.abs(alex.billShare - 4400 / 8240) < 0.001, 'Bills are split in proportion to take-home pay');
  assert.strictEqual(alex.personalBills, 300, 'Alex pays his own RoboInvest plan himself');
  assert.strictEqual(alex.leftover + lila.leftover, 1340, 'What each has left adds up to the household surplus');
  const retirementGoals = balancedPlan.goals.filter(g => g.routeKey === 'wealth');
  assert.strictEqual(retirementGoals.find(g => g.owner === 'primary').monthlyNow, alex.toPersonal, 'Alex funds his own retirement from his own money');
  assert.strictEqual(retirementGoals.find(g => g.owner === 'partner').monthlyNow, lila.toPersonal, 'Lila funds hers from hers');
  assert.throws(() => contributionService.setContribution(alexHousehold, 'partner', { toShared: 100, toPersonal: 0 }), /Only Lila/, 'Alex cannot set the partner share');
  assert.throws(() => contributionService.setContribution(alexHousehold, 'primary', { toShared: 5000, toPersonal: 0 }), /more than the/);
  contributionService.setContribution(alexHousehold, 'primary', { toShared: alex.toShared, toPersonal: 0 });
  assert.strictEqual(optimiserService.optimise(alexHousehold).contributions.people.find(p => p.member === 'primary').keptFree, alex.toPersonal, 'Money not chosen stays free');
  contributionService.setContribution(alexHousehold, 'partner', { toShared: 300, toPersonal: lila.toPersonal }, 'partner');
  const lilaLess = optimiserService.optimise(alexHousehold);
  assert(lilaLess.plans.find(p => p.id === 'balanced').atRisk.length > 0, 'When Lila puts in less, the priority order decides which shared goal waits');
  householdStore.contributions = {};
  console.log('✓ Contributions: bills by income, own goals from own money, the rest kept free');

  // 2c-ii. The family's own order and amounts
  const ours = optimiserService.customPlan(alexHousehold, { order: ['education', 'emergency', bto.key], monthlyOverrides: { education: 500 } }).plan;
  assert.strictEqual(Object.values(ours.routes).reduce((sum, value) => sum + value, 0) + ours.keptFree, optimised.investable, 'Every dollar put in is allocated or kept free');
  assert.strictEqual(ours.goals.find(g => g.key === 'education').monthlyNow, 500, 'The family amount is used as-is');
  assert.strictEqual(ours.goals.find(g => g.key === bto.key).status, 'AT_RISK', 'The engine flags what the choice makes late');
  assert(ours.tradeOffs.some(t => t.includes('misses its 2028-09 deadline')), 'The consequence is explained, not blocked');
  assert.throws(() => optimiserService.customPlan(alexHousehold, { monthlyOverrides: { [bto.key]: 99999 } }), /more than the/);
  assert.throws(() => optimiserService.customPlan(alexHousehold, { order: ['retirement_primary'] }), /Unknown or unplanned/);
  const sameAmounts = [bto.key, 'education', 'emergency'].map(first => optimiserService.customPlan(alexHousehold, { order: [first] }).plan.routes);
  assert(sameAmounts.every(routes => JSON.stringify(routes) === JSON.stringify(sameAmounts[0])), 'When every goal fits, order does not change the amounts');
  const homeFirstTight = optimiserService.customPlan(alexHousehold, { order: ['emergency', bto.key, 'education'], monthlyOverrides: { emergency: 900 } }).plan;
  const educationFirstTight = optimiserService.customPlan(alexHousehold, { order: ['emergency', 'education', bto.key], monthlyOverrides: { emergency: 900 } }).plan;
  assert.strictEqual(homeFirstTight.routes.education, 0, 'When money is short, the lower priority waits');
  assert(educationFirstTight.routes.education > 0 && educationFirstTight.routes.housing < homeFirstTight.routes.housing, 'Moving a goal up funds it first');
  assert.deepStrictEqual(educationFirstTight.definition.order, ['emergency', 'education', bto.key], 'The chosen order is returned so it can be restored');
  console.log('✓ Custom Plan: family order and amounts, consequences flagged');

  // 2d. What-if scenarios
  const schoolFees = scenarioService.simulate('alex_family', { schoolFeesMonthly: 300 });
  assert.strictEqual(schoolFees.surplusAfter, 1040);
  assert.strictEqual(schoolFees.goals.find(g => g.key === bto.key).after.status, 'ON_TRACK', 'BTO keeps priority');
  assert.strictEqual(schoolFees.goals.find(g => g.key === 'emergency').after.status, 'AT_RISK', 'The buffer top-up absorbs the squeeze');
  const newChild = scenarioService.simulate('alex_family', { extraChild: true });
  assert(newChild.goals.some(g => g.key === 'education_2' && g.isNew), 'A second child adds an education goal');
  assert(newChild.goals.find(g => g.key === 'education').before, 'Percy keeps a comparable education goal');
  assert(newChild.monthlyGapToClose > 0, 'The gap to close is quantified');
  const saveMore = scenarioService.simulate('alex_family', { extraSavingsMonthly: 5000 });
  assert.strictEqual(saveMore.levers.extraSavingsMonthly, 2000, 'Levers are clamped');
  assert.strictEqual(saveMore.surplusAfter, 2040, 'Extra savings come only from flexible lifestyle spending');
  assert.strictEqual(alexHousehold.financials.monthlySurplus, 1340, 'Scenarios never mutate the real household');
  console.log('✓ What-if Scenarios OK');

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
  assert(orchRes.nextBestActions.some(n => n.id === 'nba_advisory_review'), 'Complexity triggers the advisory NBA');

  // 4b. The AI cannot be wrong silently
  const numberCheck = require('../services/numberCheck');
  const geminiService = require('../services/geminiService');
  assert(numberCheck.verify('Your surplus is S$1,340 a month and the buffer is 4.1 months.', { surplus: 1340, buffer: 4.1 }).passed);
  assert(numberCheck.verify('About S$16k is still needed.', { shortfall: 16000 }).passed, 'Rounded figures are accepted');
  assert.deepStrictEqual(numberCheck.verify('You could save S$9,999 more at 7%.', { surplus: 1340 }).mismatches, ['S$9,999', '7%']);
  const realNarrative = geminiService.generateJsonWithMeta;
  const realChat = geminiService.generateChatResponse;
  geminiService.generateJsonWithMeta = async () => ({ source: 'GEMINI_2_5_FLASH', data: { executiveSummary: 'You can retire with S$3,000,000 by 2040.', familyPriorities: [], watchouts: [] } });
  const invented = await orchestratorAgent.runFullAnalysis(alexHousehold);
  assert.strictEqual(invented.verification.outcome, 'AI_TEXT_REPLACED', 'Invented figures are caught');
  assert.deepStrictEqual(invented.verification.mismatches, ['S$3,000,000']);
  assert(!invented.executiveSummary.includes('3,000,000'), 'The invented figure is never shown');
  assert.strictEqual(invented.intelligenceSource, 'DETERMINISTIC_FALLBACK');
  geminiService.generateJsonWithMeta = async () => ({ source: 'GEMINI_2_5_FLASH', data: { executiveSummary: 'Your S$1,340 monthly surplus covers the plan.', familyPriorities: [], watchouts: [] } });
  const faithful = await orchestratorAgent.runFullAnalysis(alexHousehold);
  assert.strictEqual(faithful.verification.outcome, 'AI_TEXT_VERIFIED', 'Faithful AI text is kept');
  geminiService.generateChatResponse = async () => 'Move S$50,000 into equities today.';
  const chatGuarded = await orchestratorAgent.handleChat(alexHousehold, [], 'What should we do?');
  assert.strictEqual(chatGuarded.verification.outcome, 'AI_TEXT_REPLACED');
  assert(!chatGuarded.reply.includes('50,000'), 'Unverified chat figures are replaced');
  geminiService.generateJsonWithMeta = realNarrative;
  geminiService.generateChatResponse = realChat;
  console.log('✓ Number check: invented AI figures are replaced');

  // 5. Explainable Chat
  const chatYield = await orchestratorAgent.handleChat(alexHousehold, [], 'Why sweep idle cash?');
  assert(chatYield.reply.includes('emergency floor'), 'Chat should explain the protected emergency floor');
  console.log('✓ Chat reasoning verified');

  // 6. Anyone can leave
  const leaving = householdStore.partnerLeaves('alex_family');
  assert(leaving.partner.left, 'Lila has left');
  assert.strictEqual(leaving.financials.monthlySurplus, 4400 - 6900, 'Her income stops being used; shared commitments need review');
  assert(!workspaceService.getWorkspace('alex_family').accounts.some(a => a.owner === 'partner'), 'Her accounts are gone from the workspace');
  assert(!goalInputService.getInputs(alexHousehold).some(g => g.key === 'retirement_partner'), 'Her personal goal is gone');
  assert.strictEqual(workspaceService.getWorkspace('alex_family').partnerConsent, 'LEFT');
  householdStore.reset('alex_family');
  console.log('✓ Leaving removes the partner\'s data from planning');

  console.log('--- ALL AGENT UNIT TESTS PASSED ---\n');
}

runTests().catch(err => {
  console.error('Agent Tests Failed:', err);
  process.exit(1);
});

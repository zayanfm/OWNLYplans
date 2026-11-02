const express = require('express');
const router = express.Router();
const householdStore = require('../models/householdStore');
const optimiserService = require('../services/optimiserService');
const scenarioService = require('../services/scenarioService');
const planAgreementService = require('../services/planAgreementService');

// In the sandbox, { as: 'partner' } stands in for the partner acting in their own app.
const actorOf = (body = {}) => (body.as === 'partner' ? 'partner' : 'primary');
const sendError = (res, error) => res.status(error.status || 400).json({ success: false, error: error.message });

/**
 * GET /api/scenarios/plan
 * The one family plan, with who has approved it.
 */
router.get('/plan', (req, res) => {
  try {
    res.json({ success: true, ...planAgreementService.current(req.query.householdId) });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * POST /api/scenarios/plan/edit  { order, monthlyOverrides, as? }
 * Changes the plan. The person changing it approves it; the other adult approves again.
 */
router.post('/plan/edit', (req, res) => {
  try {
    const { householdId, order, monthlyOverrides, as } = req.body || {};
    res.json({ success: true, ...planAgreementService.edit(householdId, { order, monthlyOverrides }, actorOf({ as })) });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * POST /api/scenarios/plan/reset  { as? }
 * Back to the recommended plan.
 */
router.post('/plan/reset', (req, res) => {
  try {
    const { householdId, as } = req.body || {};
    res.json({ success: true, ...planAgreementService.reset(householdId, actorOf({ as })) });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * POST /api/scenarios/plan/approve  { as? }
 * Approves the plan as it stands. Once every adult approves, it is agreed.
 */
router.post('/plan/approve', (req, res) => {
  try {
    const { householdId, as } = req.body || {};
    res.json({ success: true, ...planAgreementService.approve(householdId, actorOf({ as })) });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * GET /api/scenarios/plans
 * One recommended allocation plan and two alternatives from the goal optimiser.
 */
router.get('/plans', (req, res) => {
  try {
    const { householdId, predictionScenario } = req.query;
    res.json({ success: true, ...optimiserService.optimiseById(householdId, { predictionScenario }) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scenarios/plans/custom
 * The family's own plan: { order: [goalKey...], monthlyOverrides: { goalKey: amount } }.
 * Saved so it can be proposed to the partner and activated like any other plan.
 */
router.post('/plans/custom', (req, res) => {
  try {
    const { householdId, order, monthlyOverrides } = req.body || {};
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    const result = optimiserService.customPlan(household, { order, monthlyOverrides });
    householdStore.saveCustomPlan(household.id, result.plan.definition);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scenarios/simulate
 * What-if levers: extraChild, incomeChangePct, schoolFeesMonthly, extraSavingsMonthly.
 */
router.post('/simulate', (req, res) => {
  try {
    const { householdId, levers, planId } = req.body || {};
    res.json({ success: true, ...scenarioService.simulate(householdId, levers, { planId }) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scenarios/proposals
 * Proposes a plan to the partner for agreement.
 */
router.post('/proposals', (req, res) => {
  try {
    const { householdId, planId, note } = req.body || {};
    res.json({ success: true, proposal: scenarioService.propose(householdId, { planId, note }) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/scenarios/proposals/latest
 * Latest proposal; the partner's reply appears after the simulated review delay.
 */
router.get('/proposals/latest', (req, res) => {
  const { householdId } = req.query;
  res.json({ success: true, proposal: householdStore.getProposal(householdId) });
});

/**
 * POST /api/scenarios/proposals/resolve
 * Records the final agreed plan after the partner has replied.
 */
router.post('/proposals/resolve', (req, res) => {
  const { householdId, planId } = req.body || {};
  const proposal = householdStore.resolveProposal(householdId, planId);
  if (!proposal) {
    return res.status(409).json({ success: false, error: 'No answered proposal to resolve' });
  }
  res.json({ success: true, proposal });
});

module.exports = router;

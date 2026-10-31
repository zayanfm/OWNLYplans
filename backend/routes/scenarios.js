const express = require('express');
const router = express.Router();
const householdStore = require('../models/householdStore');
const optimiserService = require('../services/optimiserService');
const scenarioService = require('../services/scenarioService');

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

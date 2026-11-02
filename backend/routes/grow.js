const express = require('express');
const router = express.Router();
const growService = require('../services/growService');
const alertService = require('../services/alertService');

/**
 * GET /api/grow/alerts
 * Big changes that move when a goal is reached, each with a proposed new date.
 */
router.get('/alerts', (req, res) => {
  try {
    res.json({ success: true, alerts: alertService.list(req.query.householdId) });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/grow/alerts/:id  { decision: 'accept' | 'dismiss', as? }
 * Accepting applies the change and the new date; a shared goal then needs the other adult's approval.
 */
router.post('/alerts/:id', (req, res) => {
  try {
    const { householdId, decision, as, expectedDeadline } = req.body || {};
    res.json({ success: true, ...alertService.respond(householdId, req.params.id, decision, as === 'partner' ? 'partner' : 'primary', expectedDeadline) });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/grow/overview
 * Investment readiness with suggested long-horizon contributions, plus the advisory trigger.
 */
router.get('/overview', async (req, res) => {
  try {
    const { householdId } = req.query;
    res.json(await growService.getOverview(householdId));
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/grow/reviews/simulate
 * Scripted "three months later" check-in that re-tests the plan against a detected change.
 */
router.post('/reviews/simulate', (req, res) => {
  try {
    const { householdId } = req.body || {};
    res.json({ success: true, review: growService.simulateReview(householdId) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/grow/reviews/respond
 * Records the family's accept / revise / reject decision on a check-in.
 */
router.post('/reviews/respond', (req, res) => {
  try {
    const { householdId, reviewId, decision } = req.body || {};
    res.json({ success: true, ...growService.respondToReview(householdId, reviewId, decision) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;

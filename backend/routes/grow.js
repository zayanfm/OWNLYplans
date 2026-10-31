const express = require('express');
const router = express.Router();
const growService = require('../services/growService');

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

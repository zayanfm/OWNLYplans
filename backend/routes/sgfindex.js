const express = require('express');
const router = express.Router();
const sgfindexService = require('../services/sgfindex');

/**
 * GET /api/sgfindex/aggregate
 * SGFinDex multi-bank, CPF and investment aggregation endpoint.
 */
router.get('/aggregate', (req, res) => {
  try {
    const { householdId } = req.query;
    const aggregated = sgfindexService.aggregate(householdId);
    res.json(aggregated);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

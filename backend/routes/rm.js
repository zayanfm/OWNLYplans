const express = require('express');
const router = express.Router();
const rmExportService = require('../services/rmExportService');

/**
 * POST /api/rm/household-summary
 * Generates an exportable Relationship Manager briefing packet.
 */
router.post('/household-summary', async (req, res) => {
  try {
    const { householdId, consentOptions } = req.body || {};
    const brief = await rmExportService.generateBriefing(householdId, consentOptions);
    res.json({
      success: true,
      data: brief
    });
  } catch (error) {
    console.error('RM Brief Generation Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

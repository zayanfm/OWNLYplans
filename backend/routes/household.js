const express = require('express');
const router = express.Router();
const workspaceService = require('../services/workspaceService');
const pictureService = require('../services/pictureService');

/**
 * GET /api/household/workspace
 * Family Financial Workspace built from Singpass MyInfo and consented OCBC accounts.
 */
router.get('/workspace', (req, res) => {
  try {
    const { householdId } = req.query;
    res.json(workspaceService.getWorkspace(householdId));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/household/picture
 * Cash flow, family goals with dependencies, and the government support attached to each goal.
 */
router.get('/picture', async (req, res) => {
  try {
    const { householdId } = req.query;
    res.json(await pictureService.getPicture(householdId));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/household/manual-assets
 * Records a self-declared asset held outside OCBC. It counts toward net worth only.
 */
router.post('/manual-assets', (req, res) => {
  try {
    const { householdId, asset } = req.body || {};
    const saved = workspaceService.addManualAsset(householdId, asset);
    res.json({ success: true, asset: saved });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/household/sharing
 * Lets an account owner choose FULL, TOTAL_ONLY or PRIVATE sharing with the household.
 */
router.post('/sharing', (req, res) => {
  try {
    const { householdId, accountNumber, sharing } = req.body || {};
    const account = workspaceService.setAccountSharing(householdId, accountNumber, sharing);
    res.json({ success: true, accountNumber: account.number, sharing: account.sharing });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;

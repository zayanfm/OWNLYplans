const express = require('express');
const router = express.Router();
const workspaceService = require('../services/workspaceService');
const pictureService = require('../services/pictureService');
const goalInputService = require('../services/goalInputService');
const householdStore = require('../models/householdStore');

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

const sendError = (res, error) => res.status(error.status || 400).json({ success: false, error: error.message });

/**
 * GET /api/household/goals
 * Every goal with the family's inputs, the suggestion it started from, its source and status.
 */
router.get('/goals', (req, res) => {
  try {
    const household = goalInputService.household(req.query.householdId);
    res.json({ success: true, goals: goalInputService.getInputs(household) });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * PUT /api/household/goals/:key
 * Confirms a goal, optionally with edited values. Only the owner can confirm a personal goal.
 */
router.put('/goals/:key', (req, res) => {
  try {
    const { householdId, ...patch } = req.body || {};
    res.json({ success: true, goal: goalInputService.update(householdId, req.params.key, patch) });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * POST /api/household/goals
 * Adds the family's own goal: name, amount, dueDate (YYYY-MM). Its priority is set with the
 * other goals when the family builds the plan.
 */
router.post('/goals', (req, res) => {
  try {
    const { householdId, ...goal } = req.body || {};
    res.json({ success: true, goal: goalInputService.addCustom(householdId, goal) });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * DELETE /api/household/goals/:key
 * Deletes a custom goal, or switches off a suggested goal so it is no longer planned.
 */
router.delete('/goals/:key', (req, res) => {
  try {
    res.json({ success: true, ...goalInputService.remove(req.query.householdId, req.params.key) });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * POST /api/household/leave
 * Anyone can leave. member 'partner': the partner leaves the household (their data stops being
 * used). member 'primary': you leave and your OWNLYplan household data is deleted.
 */
router.post('/leave', (req, res) => {
  try {
    const { householdId, member } = req.body || {};
    const household = goalInputService.household(householdId);
    if (member === 'primary') {
      householdStore.reset(household.id);
      return res.json({ success: true, member, deleted: true });
    }
    if (member !== 'partner') {
      return res.status(400).json({ success: false, error: 'member must be primary or partner' });
    }
    const updated = householdStore.partnerLeaves(household.id);
    if (!updated) {
      return res.status(409).json({ success: false, error: 'There is no partner in this household' });
    }
    res.json({ success: true, member, reviewNote: updated.reviewNote, monthlySurplus: updated.financials.monthlySurplus });
  } catch (error) {
    sendError(res, error);
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

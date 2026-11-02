const express = require('express');
const router = express.Router();
const workspaceService = require('../services/workspaceService');
const pictureService = require('../services/pictureService');
const goalInputService = require('../services/goalInputService');
const householdStore = require('../models/householdStore');
const contributionService = require('../services/contributionService');
const optimiserService = require('../services/optimiserService');

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

// In the sandbox, { as: 'partner' } stands in for the partner acting in their own app.
const actorOf = (source = {}) => (source.as === 'partner' ? 'partner' : 'primary');

/**
 * GET /api/household/goals
 * The goals the family has added (with who approved each), the suggested goals the assistant can
 * still offer, and who has said they are done.
 */
router.get('/goals', (req, res) => {
  try {
    const household = goalInputService.household(req.query.householdId);
    res.json({
      success: true,
      goals: goalInputService.getInputs(household),
      available: goalInputService.available(household),
      ...goalInputService.doneStatus(household)
    });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * POST /api/household/goals/propose  { type, childIndex?, ...values, as? }
 * Adds a goal agreed with the assistant. The person adding it approves it; the other adult then
 * approves or edits it.
 */
router.post('/goals/propose', (req, res) => {
  try {
    const { householdId, as, ...goal } = req.body || {};
    res.json({ success: true, goal: goalInputService.propose(householdId, goal, actorOf({ as })) });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * POST /api/household/goals/done  { as? }
 * Says "I'm done adding goals". Allowed once every goal is approved.
 */
router.post('/goals/done', (req, res) => {
  try {
    const { householdId, as } = req.body || {};
    res.json({ success: true, ...goalInputService.markDone(householdId, actorOf({ as })) });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * POST /api/household/goals/:key/approve  { as? }
 * Approves a goal as it stands.
 */
router.post('/goals/:key/approve', (req, res) => {
  try {
    const { householdId, as } = req.body || {};
    res.json({ success: true, goal: goalInputService.approve(householdId, req.params.key, actorOf({ as })) });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * PUT /api/household/goals/:key
 * Saves a goal, optionally with edited values, and approves it. Editing clears the other
 * adult's approval. Only the owner can change a personal goal.
 */
router.put('/goals/:key', (req, res) => {
  try {
    const { householdId, as, ...patch } = req.body || {};
    res.json({ success: true, goal: goalInputService.update(householdId, req.params.key, patch, actorOf({ as })) });
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
    const { householdId, as, ...goal } = req.body || {};
    res.json({ success: true, goal: goalInputService.addCustom(householdId, goal, actorOf({ as })) });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * DELETE /api/household/goals/:key
 * Takes a goal off the list.
 */
router.delete('/goals/:key', (req, res) => {
  try {
    res.json({ success: true, ...goalInputService.remove(req.query.householdId, req.params.key, actorOf(req.query)) });
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
 * GET /api/household/contributions
 * Who puts in what: shared bills split by income, what each person has left, and how much of it
 * goes to the family pot, to their own goals, and stays free.
 */
router.get('/contributions', (req, res) => {
  try {
    const household = goalInputService.household(req.query.householdId);
    res.json({ success: true, ...optimiserService.optimise(household).contributions });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * PUT /api/household/contributions/:member  { toShared, toPersonal }
 * Only that person can set their own amounts. In the sandbox, { as: 'partner' } stands in for the
 * partner setting theirs in their own app.
 */
router.put('/contributions/:member', (req, res) => {
  try {
    const { householdId, toShared, toPersonal, as } = req.body || {};
    const household = goalInputService.household(householdId);
    const actor = as === 'partner' ? 'partner' : 'primary';
    res.json({ success: true, contribution: contributionService.setContribution(household, req.params.member, { toShared, toPersonal }, actor) });
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

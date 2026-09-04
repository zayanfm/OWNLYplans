const express = require('express');
const router = express.Router();
const mockpassService = require('../services/mockpass');

/**
 * POST /api/auth/mockpass
 * MockPass Singpass login endpoint. Always resolves the single family persona.
 */
router.post('/mockpass', (req, res) => {
  try {
    const result = mockpassService.authenticate();
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/personas
 * List available Singapore MockPass personas.
 */
router.get('/personas', (req, res) => {
  try {
    const personas = mockpassService.getAvailablePersonas();
    res.json({ success: true, personas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/switch-persona
 * Retained for backwards compatibility. Always resolves the single family persona.
 */
router.post('/switch-persona', (req, res) => {
  try {
    const result = mockpassService.switchPersona();
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/partner/link
 * Link partner profile.
 */
router.post('/partner/link', (req, res) => {
  try {
    const partnerData = req.body;
    const result = mockpassService.linkPartner(partnerData);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/family/invite
 * Request consent from household members (spouse / children).
 */
router.post('/family/invite', (req, res) => {
  try {
    const { members } = req.body || {};
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ success: false, error: 'members array is required' });
    }
    const result = mockpassService.inviteFamily(members);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/family/status
 * Poll household member consent status. Auto-approves after the simulated delay.
 */
router.get('/family/status', (req, res) => {
  try {
    const result = mockpassService.getFamilyStatus();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

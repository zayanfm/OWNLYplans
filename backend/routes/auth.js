const express = require('express');
const router = express.Router();
const mockpassService = require('../services/mockpass');

/**
 * POST /api/auth/mockpass
 * MockPass Singpass login endpoint. Accepts optional personaId.
 */
router.post('/mockpass', (req, res) => {
  try {
    const { personaId } = req.body || {};
    const result = mockpassService.authenticate(personaId);
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
 * Switch active persona.
 */
router.post('/switch-persona', (req, res) => {
  try {
    const { personaId } = req.body;
    if (!personaId) {
      return res.status(400).json({ success: false, error: 'personaId is required' });
    }
    const result = mockpassService.switchPersona(personaId);
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

module.exports = router;

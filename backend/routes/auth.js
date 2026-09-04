const express = require('express');
const router = express.Router();
const mockpassService = require('../services/mockpass');

router.get('/mockpass/start', (req, res) => {
  try {
    if (!req.query.returnUrl) {
      return res.status(400).json({ success: false, error: 'returnUrl is required' });
    }
    const requestOrigin = process.env.APP_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      ...mockpassService.beginAuthorization({ returnUrl: req.query.returnUrl, requestOrigin })
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/mockpass/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const returnUrl = mockpassService.getReturnUrl(state);
  if (!returnUrl) {
    return res.status(400).send('MockPass login session is invalid or expired. Return to OWNLYplan and try again.');
  }

  const appRedirect = new URL(returnUrl);
  try {
    if (error) throw new Error(req.query['error-description'] || error);
    if (!code) throw new Error('MockPass did not return an authorization code');
    const completed = await mockpassService.completeAuthorization({ code, state });
    appRedirect.searchParams.set('session', completed.sessionId);
  } catch (callbackError) {
    appRedirect.searchParams.set('error', callbackError.message);
  }
  return res.redirect(appRedirect.toString());
});

router.get('/mockpass/session/:sessionId', (req, res) => {
  try {
    res.json(mockpassService.consumeSession(req.params.sessionId));
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/mockpass', (_req, res) => {
  res.status(410).json({
    success: false,
    error: 'Interactive MockPass authentication is required. Start at /api/auth/mockpass/start.'
  });
});

/**
 * GET /api/auth/personas
 * List available Singapore MockPass personas.
 */
router.get('/personas', (req, res) => {
  res.json({ success: true, personas: [], source: '@opengovsg/mockpass login page' });
});

/**
 * POST /api/auth/switch-persona
 * Retained for backwards compatibility. Always resolves the single family persona.
 */
router.post('/switch-persona', (req, res) => {
  res.status(410).json({ success: false, error: 'Select a persona through the MockPass login page.' });
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

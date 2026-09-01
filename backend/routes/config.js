// backend/routes/config.js
const express = require('express');
const router = express.Router();

const appConfig = {
  appName: 'OCBC Digital — OWNLYplans',
  theme: {
    primaryColor: '#D81E05',
    backgroundColor: '#F5F4F0',
    cardBackground: '#FFFFFF',
  },
  featuresEnabled: {
    dynamicIsland: true,
    aiPlanner: true,
    sgfindexSimulation: true,
  },
};

// GET /api/config
router.get('/config', (req, res) => {
  try {
    res.status(200).json(appConfig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve application configuration.' });
  }
});

module.exports = router;
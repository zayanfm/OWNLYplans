// backend/routes/finance.js
const express = require('express');
const router = express.Router();

// Mock database models matching the legacy data block
const financeData = {
  user: { first: 'Mary', partner: 'Zayan', segment: '25–44 Dual Income' },
  metrics: {
    monthlySurplus: 1340,
    mmfYield: '3.85%',
    btoCurrent: 'S$40,800',
    btoTarget: 'S$60,000',
    btoPct: 68,
    protectionGap: 'S$160K',
    portfolioReturn: '+3.2%',
  },
  accounts: [
    { id: 'frank', name: 'OCBC FRANK Account', mask: '••• ••• •', balance: 'S$ •,•••.••', type: 'Accounts' },
    { id: 'three60', name: 'OCBC 360 Account', mask: '•••• 4892', balance: 'S$24,180.33', type: 'Accounts' },
    { id: 'mmf', name: 'LionGlobal SGD MMF', mask: 'Auto-surplus', balance: 'S$8,500.00', type: 'Accounts' },
  ],
  routes: [
    { to: 'LionGlobal SGD MMF', amt: 'S$1,000', yield: '3.85% p.a.', icon: '💰' },
    { to: 'BTO Goal Pot', amt: 'S$200', yield: 'Dec 2027 target', icon: '🏠' },
    { to: 'FRANK Auto-pay', amt: 'S$1,240', yield: 'Clears balance', icon: '💳' },
  ],
};

// GET /api/finance/overview
router.get('/overview', (req, res) => {
  try {
    res.status(200).json(financeData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch financial details.' });
  }
});

module.exports = router;
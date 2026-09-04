const express = require('express');
const router = express.Router();
const householdStore = require('../models/householdStore');
const plannerService = require('../services/plannerService');

/**
 * GET /api/finance/overview
 * Returns consolidated household finance metrics, accounts, active surplus routes, and milestones.
 */
router.get('/overview', (req, res) => {
  try {
    const { householdId } = req.query;
    const household = householdId ? householdStore.getHousehold(householdId) : householdStore.getHousehold();
    if (!household) {
      return res.status(404).json({ success: false, error: 'Household not found' });
    }

    const plan = plannerService.generatePlan(household.id);

    const financeData = {
      user: {
        name: household.name,
        segment: household.segment,
        primary: household.primaryUser.name,
        partner: household.partner ? household.partner.name : null
      },
      metrics: {
        monthlyTakeHome: household.financials.householdTakeHome,
        monthlyExpenses: household.financials.householdMonthlyExpenses,
        monthlySurplus: household.financials.monthlySurplus,
        emergencyFund: household.financials.emergencyFund,
        totalNetWorth: (household.accounts.ocbc.reduce((s, a) => s + a.balance, 0) +
          household.accounts.otherBanks.reduce((s, a) => s + a.balance, 0) +
          household.accounts.investments.reduce((s, a) => s + a.value, 0) +
          household.primaryUser.cpf.oa + household.primaryUser.cpf.sa + household.primaryUser.cpf.ma +
          (household.partner ? (household.partner.cpf.oa + household.partner.cpf.sa + household.partner.cpf.ma) : 0))
      },
      accounts: {
        ocbc: household.accounts.ocbc,
        otherBanks: household.accounts.otherBanks,
        investments: household.accounts.investments
      },
      routes: plan.routes,
      milestones: plan.milestones,
      guardrails: plan.guardrails,
      activePlan: household.activePlan || null
    };

    res.json(financeData);
  } catch (error) {
    console.error('Finance Overview Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/finance/plan
 * Generates dynamic surplus allocation proposal given timeline and splits.
 */
router.post('/plan', (req, res) => {
  try {
    const { householdId, timeline, split, mode } = req.body || {};
    const plan = plannerService.generatePlan(householdId, { timeline, split, mode });
    res.json({ success: true, plan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/finance/approve-plan
 * Activates progressive surplus allocation plan.
 */
router.post('/approve-plan', (req, res) => {
  try {
    const { householdId, plan } = req.body || {};
    const approved = plannerService.approvePlan(householdId, plan);
    res.json(approved);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/finance/execute-route
 * Executes surplus sweep for a specified route.
 */
router.post('/execute-route', (req, res) => {
  try {
    const { householdId, routeId, amount } = req.body || {};
    const result = plannerService.executeRoute(householdId, routeId, amount);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/finance/audit
 * Returns household audit trail.
 */
router.get('/audit', (req, res) => {
  try {
    const { householdId } = req.query;
    const logs = householdStore.getAuditLog(householdId);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

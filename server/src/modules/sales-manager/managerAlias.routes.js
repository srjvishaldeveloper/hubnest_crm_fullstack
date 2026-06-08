const express = require('express');
const router = express.Router();
const managerCtrl = require('./salesManager.controller');
const svc = require('./salesManager.service');
const { authenticate } = require('../../middleware/auth');
const { authorizeSalesManager } = require('../../middleware/rbac');
const { query } = require('../../config/database');
const { sendSuccess, sendError } = require('../../utils/helpers');

router.use(authenticate);
router.use((req, res, next) => {
  if (req.user.role_name !== 'Sales Manager') {
    return res.status(403).json({ success: false, message: 'Access denied. Sales Manager role required.' });
  }
  next();
});

router.get('/dashboard', managerCtrl.getDashboard);

router.get('/leads', async (req, res) => {
  try {
    const managerId = req.user.id;
    const tenantId = req.user.tenant_id;
    const { status, priority, search, assignedTo, page, limit } = req.query;

    // Retrieve team member IDs
    const teamResult = await query(
      `SELECT user_id FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
       WHERE t.tenant_id = $1 AND t.manager_id = $2`,
      [tenantId, managerId]
    );
    const memberIds = teamResult.rows.map(r => r.user_id);
    
    // We add the manager id to the allowed list
    memberIds.push(managerId);

    // Call service to list leads
    const data = await svc.listTeamLeads(tenantId, { status, priority, search, assignedTo, page: +page || 1, limit: +limit || 1000 });
    
    // Filter leads to team members only
    data.leads = data.leads.filter(lead => memberIds.includes(lead.assigned_to));
    data.total = data.leads.length;

    return sendSuccess(res, data, 'Leads retrieved');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.post('/team/add-exec', managerCtrl.addExecutive);
router.patch('/leads/:id/assign', managerCtrl.assignLead);
router.get('/reports/team', managerCtrl.getReports);
router.get('/team', managerCtrl.getTeam);

module.exports = router;

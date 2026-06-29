const express = require('express');
const router = express.Router();
const ctrl = require('./sales.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { scopeGuard } = require('../../middleware/scopeGuard');

router.use(authenticate);
router.use((req, res, next) => {
  if (req.user.role_name !== 'Sales Executive') {
    return res.status(403).json({ success: false, message: 'Access denied. Sales Executive role required.' });
  }
  next();
});
router.use(scopeGuard);

// LEADS
router.get('/leads',              authorize('leads', 'read'),   ctrl.listLeads);
router.get('/leads/:id',          authorize('leads', 'read'),   ctrl.getLead);
router.post('/leads',             authorize('leads', 'create'), ctrl.createLead);
router.patch('/leads/:id',        authorize('leads', 'update'), ctrl.updateLead);
router.delete('/leads/:id',       authorize('leads', 'delete'), ctrl.deleteLead);
router.get('/leads/:id/activity', authorize('leads', 'read'),   ctrl.getLeadActivity);

// TASKS
router.get('/tasks',              authorize('tasks', 'read'),   ctrl.listTasks);
router.post('/tasks',             authorize('tasks', 'create'), ctrl.createTask);
router.get('/tasks/today',        authorize('tasks', 'read'),   ctrl.getTodayTasks);
router.get('/tasks/:id',          authorize('tasks', 'read'),   ctrl.getTask);
router.patch('/tasks/:id',        authorize('tasks', 'update'), ctrl.updateTask);
router.delete('/tasks/:id',       authorize('tasks', 'delete'), ctrl.deleteTask);

// ACTIVITIES
router.get('/activities',         authorize('activities', 'read'),   ctrl.listActivities);
router.post('/activities',        authorize('activities', 'create'), ctrl.logActivity);
router.get('/activities/summary', authorize('activities', 'read'),   ctrl.getActivitiesSummary);

// PROFILE & PERFORMANCE
router.get('/profile',            ctrl.getProfile);
router.patch('/profile',          ctrl.updateProfile);
router.get('/performance',        ctrl.getPerformance);
router.patch('/performance',      ctrl.updatePerformance);
router.get('/dashboard',          ctrl.getDashboard);
router.get('/achievements',       ctrl.getAchievements);
router.get('/login-history',      ctrl.getLoginHistory);
router.post('/change-password',   ctrl.changePassword);

module.exports = router;

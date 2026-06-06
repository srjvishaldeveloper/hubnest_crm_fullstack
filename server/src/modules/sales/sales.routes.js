const express = require('express');
const router = express.Router();
const ctrl = require('./sales.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { scopeGuard } = require('../../middleware/scopeGuard');

router.use(authenticate);
router.use(scopeGuard);

// LEADS
router.get('/leads',              authorize('leads', 'read'),   ctrl.listLeads);
router.get('/leads/:id',          authorize('leads', 'read'),   ctrl.getLead);
router.post('/leads',             authorize('leads', 'create'), ctrl.createLead);
router.patch('/leads/:id',        authorize('leads', 'update'), ctrl.updateLead);
router.get('/leads/:id/activity', authorize('leads', 'read'),   ctrl.getLeadActivity);

// TASKS
router.get('/tasks',              authorize('tasks', 'read'),   ctrl.listTasks);
router.post('/tasks',             authorize('tasks', 'create'), ctrl.createTask);
router.patch('/tasks/:id',        authorize('tasks', 'update'), ctrl.updateTask);
router.delete('/tasks/:id',       authorize('tasks', 'delete'), ctrl.deleteTask);
router.get('/tasks/today',        authorize('tasks', 'read'),   ctrl.getTodayTasks);

// ACTIVITIES
router.get('/activities',         authorize('activities', 'read'),   ctrl.listActivities);
router.post('/activities',        authorize('activities', 'create'), ctrl.logActivity);
router.get('/activities/summary', authorize('activities', 'read'),   ctrl.getActivitiesSummary);

// PROFILE & PERFORMANCE
router.get('/profile',            ctrl.getProfile);
router.patch('/profile',          ctrl.updateProfile);
router.get('/performance',        ctrl.getPerformance);
router.get('/dashboard',          ctrl.getDashboard);

module.exports = router;

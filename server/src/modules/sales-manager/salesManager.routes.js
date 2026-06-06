const express = require('express');
const router = express.Router();
const ctrl = require('./salesManager.controller');
const { authenticate } = require('../../middleware/auth');
const { authorizeSalesManager } = require('../../middleware/rbac');

// All routes require authentication and Sales Manager role
router.use(authenticate);
router.use(authorizeSalesManager);

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Team
router.get('/team',                ctrl.getTeam);
router.get('/team/:id',            ctrl.getMemberDetail);
router.post('/team/add-executive', ctrl.addExecutive);
router.patch('/team/:id/target',   ctrl.updateMemberTarget);

// Leads
router.get('/leads',               ctrl.listLeads);
router.get('/leads/:id',           ctrl.getLead);
router.post('/leads',              ctrl.createLead);
router.patch('/leads/:id',         ctrl.updateLead);
router.patch('/leads/:id/assign',  ctrl.assignLead);
router.post('/leads/bulk-assign',  ctrl.bulkAssignLeads);

// Tasks
router.get('/tasks',               ctrl.listTasks);
router.post('/tasks',              ctrl.createTask);
router.patch('/tasks/:id',         ctrl.updateTask);
router.delete('/tasks/:id',        ctrl.deleteTask);

// Reports
router.get('/reports',             ctrl.getReports);

// Profile & Targets
router.get('/profile',             ctrl.getProfile);
router.patch('/profile',           ctrl.updateProfile);
router.get('/targets',             ctrl.getTargets);
router.patch('/targets',           ctrl.updateTargets);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('./salesManager.controller');
const { authenticate } = require('../../middleware/auth');
const { authorizeSalesManager } = require('../../middleware/rbac');

// All routes require authentication and Sales Manager role
router.use(authenticate);
router.use(authorizeSalesManager);

// Dashboard & Pipeline
router.get('/dashboard', ctrl.getDashboard);
router.get('/pipeline',  ctrl.getPipeline);

// Team
router.get('/team',                ctrl.getTeam);
router.get('/team/:id',            ctrl.getMemberDetail);
router.post('/team/add-executive', ctrl.addExecutive);
router.patch('/team/:id/target',   ctrl.updateMemberTarget);
router.delete('/team/:id',         ctrl.removeTeamMember);
router.patch('/team/:id/status',   ctrl.updateMemberStatus);
router.post('/team/broadcast',     ctrl.broadcastMessage);
router.post('/team/approve',       ctrl.approveRequest);

// Leads
router.get('/leads',               ctrl.listLeads);
router.get('/leads/:id',           ctrl.getLead);
router.post('/leads',              ctrl.createLead);
router.patch('/leads/:id',         ctrl.updateLead);
router.delete('/leads/:id',        ctrl.deleteLead);
router.patch('/leads/:id/assign',  ctrl.assignLead);
router.patch('/leads/:id/escalate',ctrl.escalateLead);
router.post('/leads/bulk-assign',  ctrl.bulkAssignLeads);
router.post('/leads/bulk-delete',  ctrl.bulkDeleteLeads);

// Tasks
router.get('/tasks',               ctrl.listTasks);
router.post('/tasks',              ctrl.createTask);
router.patch('/tasks/:id',         ctrl.updateTask);
router.delete('/tasks/:id',        ctrl.deleteTask);

// Reports
router.get('/reports',             ctrl.getReports);

// Profile & Targets & Security
router.get('/profile',             ctrl.getProfile);
router.patch('/profile',           ctrl.updateProfile);
router.get('/targets',             ctrl.getTargets);
router.patch('/targets',           ctrl.updateTargets);
router.patch('/profile/password',  ctrl.updatePassword);
router.patch('/profile/settings',  ctrl.updateSettings);
router.post('/profile/document',   ctrl.uploadDocument);
router.get('/profile/sessions',    ctrl.getSessions);
router.post('/profile/picture',    ctrl.updateProfilePicture);
router.post('/profile/cover',      ctrl.updateCoverPicture);

// Activities
router.get('/activities',          ctrl.listActivities);
router.post('/activities',         ctrl.createActivity);

module.exports = router;

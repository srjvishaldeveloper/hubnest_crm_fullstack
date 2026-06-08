const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { forwardReport, forwardExport } = require('../../utils/pythonBridge');
const { sendError } = require('../../utils/helpers');

// Proxy reports and charts
router.get('/reports/*', authenticate, async (req, res) => {
  try {
    const subPath = req.params[0]; 
    
    const queryParams = {
      ...req.query,
      tenant_id: req.user.tenant_id,
      user_id: req.user.id,
      role: req.user.role_name
    };

    let pythonPath;
    if (subPath.startsWith('charts/')) {
      pythonPath = `/api/${subPath}`;
    } else {
      pythonPath = `/api/reports/${subPath}`;
    }

    const result = await forwardReport(pythonPath, queryParams);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.detail || error.message || 'Error communicating with Reports service';
    return sendError(res, message, status);
  }
});

// Proxy file exports (PDF / Excel / CSV)
router.get('/export/*', authenticate, async (req, res) => {
  try {
    const subPath = req.params[0]; 
    const queryParams = {
      ...req.query,
      tenant_id: req.user.tenant_id,
      user_id: req.user.id,
      role: req.user.role_name
    };

    const pythonPath = `/api/export/${subPath}`;
    const pyResponse = await forwardExport(pythonPath, queryParams);
    
    res.setHeader('Content-Type', pyResponse.headers['content-type']);
    res.setHeader('Content-Disposition', pyResponse.headers['content-disposition']);
    
    pyResponse.data.pipe(res);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.detail || error.message || 'Error executing file export';
    return sendError(res, message, status);
  }
});

module.exports = router;

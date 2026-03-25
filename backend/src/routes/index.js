/**
 * 路由总入口 - 简化版
 */

const express = require('express');
const router = express.Router();

const leadsRoutes = require('./leads');

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 简单认证（演示用）
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'demo' && password === 'demo123') {
    res.json({ 
      success: true, 
      token: 'demo_token_' + Date.now(),
      user: { id: 1, username: 'demo', role: 'admin' }
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// 需要认证的路由
const authMiddleware = require('../middleware/auth');

router.use('/leads', leadsRoutes);

// 其他路由占位符
router.use('/dashboard', (req, res) => res.json({ stats: { totalLeads: 100, newToday: 10 } }));
router.use('/emails', (req, res) => res.json({ emails: [] }));
router.use('/campaigns', (req, res) => res.json({ campaigns: [] }));
router.use('/crm', (req, res) => res.json({ customers: [] }));
router.use('/stats', (req, res) => res.json({ stats: {} }));
router.use('/settings', (req, res) => res.json({ settings: {} }));

module.exports = router;

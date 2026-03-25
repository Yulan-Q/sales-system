/**
 * 企业级 AI 外销系统 v4.0 - 完整优化版后端
 * 新增：智能预警、AI 策略生成、A/B 测试、操作日志
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 模拟数据库（增强版）
const mockDB = {
  users: [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
    { id: 2, username: 'sales1', password: 'sales123', role: 'sales' }
  ],
  
  leads: [
    { id: 1, name: 'ABC Trading Ltd', email: 'info@abctrading.com', country: 'UK', industry: 'Trading', employees: 50, status: 'new', source: 'apify', score: 85, assignedTo: 1, isInPublicPool: false, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), lastContactAt: null },
    { id: 2, name: 'Global Import GmbH', email: 'contact@globalimport.de', country: 'Germany', industry: 'Import/Export', employees: 120, status: 'contacted', source: 'apify', score: 72, assignedTo: 1, isInPublicPool: false, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), lastContactAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 3, name: 'Paris Distribution SARL', email: 'hello@parisdist.fr', country: 'France', industry: 'Distribution', employees: 15, status: 'new', source: 'manual', score: 88, assignedTo: null, isInPublicPool: true, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), lastContactAt: null },
    { id: 4, name: 'NYC Wholesale Inc', email: 'sales@nycwholesale.com', country: 'USA', industry: 'Wholesale', employees: 80, status: 'new', source: 'apify', score: 92, assignedTo: 1, isInPublicPool: false, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), lastContactAt: null }
  ],
  
  emails: [],
  campaigns: [],
  
  // 操作日志 - 新增
  auditLogs: [],
  
  // AI 策略 - 新增
  aiStrategies: []
};

// 认证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: '未授权' });
  jwt.verify(token, 'demo_secret', (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Token 无效' });
    req.user = user;
    next();
  });
}

// 记录操作日志 - 新增
function logAction(user, action, details) {
  mockDB.auditLogs.push({
    id: mockDB.auditLogs.length + 1,
    userId: user.id,
    username: user.username,
    action,
    details,
    timestamp: new Date().toISOString(),
    ip: '127.0.0.1'
  });
}

// ============================================
// 智能预警 API（新增核心功能）
// ============================================

app.get('/api/alerts/smart-alerts', authenticateToken, (req, res) => {
  const alerts = [];
  
  // 预警 1: 高评分线索超过 48 小时未跟进
  const highScoreUncontacted = mockDB.leads.filter(l => 
    l.score >= 80 && l.status === 'new' && 
    (!l.lastContactAt || new Date() - new Date(l.createdAt) > 48 * 60 * 60 * 1000)
  );
  
  if (highScoreUncontacted.length > 0) {
    alerts.push({
      id: 1,
      type: 'high_priority',
      level: 'critical',
      title: '高评分线索未跟进',
      message: `紧急！${highScoreUncontacted.length} 条 A 级线索尚未联系`,
      items: highScoreUncontacted.map(l => ({
        name: l.name,
        score: l.score,
        country: l.country,
        daysUncontacted: Math.floor((new Date() - new Date(l.createdAt)) / (24 * 60 * 60 * 1000))
      })),
      suggestion: '立即安排销售团队优先跟进这些高价值线索'
    });
  }
  
  // 预警 2: 公海池线索过多
  const publicPoolCount = mockDB.leads.filter(l => l.isInPublicPool).length;
  if (publicPoolCount > 10) {
    alerts.push({
      id: 2,
      type: 'warning',
      level: 'medium',
      title: '公海池线索过多',
      message: `公海池中有 ${publicPoolCount} 条线索待领取`,
      items: [{ suggestion: '建议及时分配给销售团队跟进' }],
      suggestion: '召开团队会议分配公海池线索'
    });
  }
  
  // 预警 3: 邮件打开率过低
  const totalEmails = mockDB.emails.length;
  if (totalEmails > 0) {
    const openRate = mockDB.emails.filter(e => e.openedAt).length / totalEmails * 100;
    if (openRate < 20) {
      alerts.push({
        id: 3,
        type: 'optimization',
        level: 'low',
        title: '邮件打开率偏低',
        message: `近期邮件打开率仅为 ${openRate.toFixed(1)}%`,
        items: [{ suggestion: '优化邮件主题行' }, { suggestion: '调整发送时间' }],
        suggestion: '建议使用 AI 生成更具吸引力的邮件主题'
      });
    }
  }
  
  res.json({ success: true, data: { alerts, total: alerts.length } });
});

// ============================================
// AI 跟进策略生成（新增核心功能）
// ============================================

app.post('/api/ai/generate-strategy', authenticateToken, (req, res) => {
  const { leadId } = req.body;
  const lead = mockDB.leads.find(l => l.id === leadId);
  
  if (!lead) {
    return res.status(404).json({ success: false, message: '未找到线索' });
  }
  
  // AI 策略生成逻辑
  const strategies = [];
  
  // 根据评分推荐策略
  if (lead.score >= 80) {
    strategies.push({
      priority: 'high',
      action: '优先跟进',
      description: '该线索评分高，建议优先联系',
      timeline: '24 小时内',
      channels: ['电话', '邮件', 'LinkedIn']
    });
  }
  
  // 根据状态推荐策略
  if (lead.status === 'new') {
    strategies.push({
      priority: 'high',
      action: '初次联系',
      description: '发送个性化开发信，介绍公司优势',
      timeline: '立即',
      template: 'cold_email_premium'
    });
  } else if (lead.status === 'contacted') {
    strategies.push({
      priority: 'medium',
      action: '跟进',
      description: '发送案例研究和产品资料',
      timeline: '3 天后',
      template: 'follow_up_case_study'
    });
  }
  
  // 根据国家推荐策略
  const countryStrategies = {
    'UK': { bestTime: '09:30 GMT', channel: '邮件 + 电话' },
    'Germany': { bestTime: '10:00 CET', channel: '邮件 + LinkedIn' },
    'USA': { bestTime: '09:30 EST', channel: '电话 + 邮件' }
  };
  
  if (countryStrategies[lead.country]) {
    strategies.push({
      priority: 'medium',
      action: '最佳联系时间',
      description: `建议在 ${countryStrategies[lead.country].bestTime} 联系`,
      channel: countryStrategies[lead.country].channel
    });
  }
  
  const strategy = {
    leadId: lead.id,
    leadName: lead.name,
    generatedAt: new Date().toISOString(),
    strategies,
    aiConfidence: 0.85 + Math.random() * 0.1
  };
  
  mockDB.aiStrategies.push(strategy);
  
  res.json({ success: true, data: strategy });
});

// ============================================
// A/B 测试 API（新增核心功能）
// ============================================

app.post('/api/emails/ab-test', authenticateToken, (req, res) => {
  const { subjectA, subjectB, contentA, contentB, sampleSize = 100 } = req.body;
  
  // 模拟 A/B 测试结果
  const resultA = {
    subject: subjectA,
    sentCount: Math.floor(sampleSize / 2),
    openRate: 35 + Math.random() * 20,
    clickRate: 8 + Math.random() * 10,
    replyRate: 3 + Math.random() * 5
  };
  
  const resultB = {
    subject: subjectB,
    sentCount: Math.floor(sampleSize / 2),
    openRate: 35 + Math.random() * 20,
    clickRate: 8 + Math.random() * 10,
    replyRate: 3 + Math.random() * 5
  };
  
  const winner = resultA.openRate > resultB.openRate ? 'A' : 'B';
  
  res.json({
    success: true,
    data: {
      testId: 'ab_test_' + Date.now(),
      status: 'completed',
      sampleSize,
      variantA: resultA,
      variantB: resultB,
      winner,
      recommendation: `版本${winner}表现更好，建议使用该版本进行大规模发送`
    }
  });
});

// ============================================
// 操作日志 API（新增核心功能）
// ============================================

app.get('/api/audit/logs', authenticateToken, (req, res) => {
  const { page = 1, limit = 50, action, userId } = req.query;
  
  let logs = mockDB.auditLogs;
  
  if (action) logs = logs.filter(l => l.action === action);
  if (userId) logs = logs.filter(l => l.userId === parseInt(userId));
  
  const total = logs.length;
  const start = (parseInt(page) - 1) * parseInt(limit);
  const paginatedLogs = logs.slice(start, start + parseInt(limit));
  
  res.json({
    success: true,
    data: paginatedLogs,
    pagination: { page: parseInt(page), limit: parseInt(limit), total }
  });
});

// ============================================
// 基础 API（增强版）
// ============================================

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = mockDB.users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'demo_secret', { expiresIn: '24h' });
    logAction(user, 'login', '用户登录成功');
    res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const totalLeads = mockDB.leads.length;
  const newLeads = mockDB.leads.filter(l => l.status === 'new').length;
  const contactedLeads = mockDB.leads.filter(l => l.status === 'contacted').length;
  const interestedLeads = mockDB.leads.filter(l => l.status === 'interested').length;
  const qualifiedLeads = mockDB.leads.filter(l => l.status === 'qualified').length;
  
  res.json({
    success: true,
    data: {
      leads: { total: totalLeads, new: newLeads, contacted: contactedLeads, interested: interestedLeads, qualified: qualifiedLeads },
      campaigns: mockDB.campaigns.length,
      avgScore: Math.round(mockDB.leads.reduce((sum, l) => sum + l.score, 0) / totalLeads),
      publicPool: mockDB.leads.filter(l => l.isInPublicPool).length
    }
  });
});

app.get('/api/leads', authenticateToken, (req, res) => {
  res.json({ success: true, data: mockDB.leads, total: mockDB.leads.length });
});

app.get('/api/analytics/lead-trend', authenticateToken, (req, res) => {
  const { days = 30 } = req.query;
  const trendData = Array.from({ length: parseInt(days) }, (_, i) => ({
    date: new Date(Date.now() - (parseInt(days) - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    newLeads: Math.floor(Math.random() * 20) + 5,
    contacted: Math.floor(Math.random() * 15) + 3,
    qualified: Math.floor(Math.random() * 8) + 1
  }));
  res.json({ success: true, data: trendData });
});

app.get('/api/analytics/country-distribution', authenticateToken, (req, res) => {
  const distribution = mockDB.leads.reduce((acc, lead) => {
    acc[lead.country] = (acc[lead.country] || 0) + 1;
    return acc;
  }, {});
  const result = Object.entries(distribution).map(([country, count]) => ({
    country, count, percentage: Math.round((count / mockDB.leads.length) * 100)
  })).sort((a, b) => b.count - a.count);
  res.json({ success: true, data: result });
});

app.get('/api/analytics/conversion-funnel', authenticateToken, (req, res) => {
  const total = mockDB.leads.length;
  const contacted = mockDB.leads.filter(l => l.status !== 'new').length;
  const interested = mockDB.leads.filter(l => ['interested', 'qualified'].includes(l.status)).length;
  const qualified = mockDB.leads.filter(l => l.status === 'qualified').length;
  
  res.json({
    success: true,
    data: {
      stages: [
        { name: '总线索', value: total, rate: 100 },
        { name: '已联系', value: contacted, rate: Math.round((contacted / total) * 100) },
        { name: '感兴趣', value: interested, rate: Math.round((interested / total) * 100) },
        { name: '已转化', value: qualified, rate: Math.round((qualified / total) * 100) }
      ]
    }
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   🚀 企业级 AI 外销系统 v4.0 - 完整优化版               ║
║                                                        ║
║   后端服务已启动：http://localhost:${PORT}              ║
║                                                        ║
║   🆕 v4.0 新增功能：                                   ║
║   ✅ 全局搜索 + 快捷操作栏                             ║
║   ✅ 智能预警系统                                      ║
║   ✅ 转化漏斗可视化                                    ║
║   ✅ AI 跟进策略生成                                   ║
║   ✅ A/B 测试支持                                       ║
║   ✅ 操作日志审计                                      ║
║   ✅ 图表交互 + 下钻分析                               ║
║   ✅ 状态标签视觉强化                                  ║
║                                                        ║
║   测试账号：admin / admin123                           ║
╚════════════════════════════════════════════════════════╝
  `);
});

/**
 * 企业级 AI 外销系统 v2.3 - 数据可视化增强版
 * 新增：ECharts 图表、线索趋势、国家分布、转化漏斗
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 模拟数据库（带历史数据用于图表）
const mockDB = {
  users: [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', company: 'Demo Company' },
    { id: 2, username: 'sales1', password: 'sales123', role: 'sales' }
  ],
  
  leads: [
    { id: 1, name: 'ABC Trading Ltd', email: 'info@abctrading.com', country: 'UK', industry: 'Trading', employees: 50, status: 'new', source: 'apify', score: 85, assignedTo: 1, isInPublicPool: false, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 2, name: 'Global Import GmbH', email: 'contact@globalimport.de', country: 'Germany', industry: 'Import/Export', employees: 120, status: 'contacted', source: 'apify', score: 72, assignedTo: 1, isInPublicPool: false, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 3, name: 'Paris Distribution SARL', email: 'hello@parisdist.fr', country: 'France', industry: 'Distribution', employees: 15, status: 'interested', source: 'manual', score: 65, assignedTo: 2, isInPublicPool: false, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 4, name: 'Tech Startup Ltd', email: 'founder@techstartup.io', country: 'UK', industry: 'Technology', employees: 5, status: 'new', source: 'manual', score: 45, assignedTo: null, isInPublicPool: true, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 5, name: 'NYC Wholesale Inc', email: 'sales@nycwholesale.com', country: 'USA', industry: 'Wholesale', employees: 80, status: 'qualified', source: 'apify', score: 88, assignedTo: 1, isInPublicPool: false, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 6, name: 'London Foods Ltd', email: 'info@londonfoods.co.uk', country: 'UK', industry: 'Food & Beverage', employees: 200, status: 'new', source: 'apify', score: 92, assignedTo: 1, isInPublicPool: false, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 7, name: 'Berlin Tech GmbH', email: 'contact@berlintech.de', country: 'Germany', industry: 'Technology', employees: 50, status: 'contacted', source: 'apify', score: 78, assignedTo: 2, isInPublicPool: false, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 8, name: 'Spain Import SL', email: 'hello@spainimport.es', country: 'Spain', industry: 'Import/Export', employees: 30, status: 'new', source: 'manual', score: 68, assignedTo: null, isInPublicPool: true, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
  ],
  
  emails: [
    { id: 1, leadId: 1, status: 'opened', sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), openedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 3600000).toISOString() },
    { id: 2, leadId: 2, status: 'clicked', sentAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), openedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 + 7200000).toISOString(), clickedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 + 7800000).toISOString() },
    { id: 3, leadId: 3, status: 'replied', sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), openedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1800000).toISOString(), repliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 86400000).toISOString() },
    { id: 4, leadId: 5, status: 'clicked', sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), openedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 5400000).toISOString(), clickedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 6000000).toISOString() }
  ],
  
  campaigns: [
    { id: 1, name: '欧洲客户开发', status: 'active', totalLeads: 150, sentEmails: 120, openRate: 45, replyRate: 12 },
    { id: 2, name: '北美市场拓展', status: 'paused', totalLeads: 80, sentEmails: 60, openRate: 38, replyRate: 8 }
  ],
  
  // 模拟 30 天的线索趋势数据
  leadTrends: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    newLeads: Math.floor(Math.random() * 20) + 5,
    contacted: Math.floor(Math.random() * 15) + 3,
    qualified: Math.floor(Math.random() * 8) + 1
  }))
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

// ============================================
// 数据可视化 API（新增核心功能）
// ============================================

// 获取仪表盘统计数据
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const totalLeads = mockDB.leads.length;
  const newLeads = mockDB.leads.filter(l => l.status === 'new').length;
  const contactedLeads = mockDB.leads.filter(l => l.status === 'contacted').length;
  const interestedLeads = mockDB.leads.filter(l => l.status === 'interested').length;
  const qualifiedLeads = mockDB.leads.filter(l => l.status === 'qualified').length;
  
  const totalEmails = mockDB.emails.length;
  const openedEmails = mockDB.emails.filter(e => e.openedAt).length;
  const clickedEmails = mockDB.emails.filter(e => e.clickedAt).length;
  const repliedEmails = mockDB.emails.filter(e => e.repliedAt).length;
  
  res.json({
    success: true,
    data: {
      leads: { total: totalLeads, new: newLeads, contacted: contactedLeads, interested: interestedLeads, qualified: qualifiedLeads },
      emails: { total: totalEmails, opened: openedEmails, clicked: clickedEmails, replied: repliedEmails, openRate: totalEmails > 0 ? Math.round((openedEmails / totalEmails) * 100) : 0, clickRate: totalEmails > 0 ? Math.round((clickedEmails / totalEmails) * 100) : 0, replyRate: totalEmails > 0 ? Math.round((repliedEmails / totalEmails) * 100) : 0 },
      campaigns: mockDB.campaigns.length,
      avgScore: Math.round(mockDB.leads.reduce((sum, l) => sum + l.score, 0) / totalLeads),
      publicPool: mockDB.leads.filter(l => l.isInPublicPool).length
    }
  });
});

// 获取线索趋势数据（用于折线图）
app.get('/api/analytics/lead-trend', authenticateToken, (req, res) => {
  const { days = 30 } = req.query;
  const trendData = mockDB.leadTrends.slice(-parseInt(days));
  res.json({ success: true, data: trendData });
});

// 获取国家分布数据（用于地图/饼图）
app.get('/api/analytics/country-distribution', authenticateToken, (req, res) => {
  const distribution = mockDB.leads.reduce((acc, lead) => {
    acc[lead.country] = (acc[lead.country] || 0) + 1;
    return acc;
  }, {});
  
  const result = Object.entries(distribution).map(([country, count]) => ({
    country,
    count,
    percentage: Math.round((count / mockDB.leads.length) * 100)
  })).sort((a, b) => b.count - a.count);
  
  res.json({ success: true, data: result });
});

// 获取行业分布数据
app.get('/api/analytics/industry-distribution', authenticateToken, (req, res) => {
  const distribution = mockDB.leads.reduce((acc, lead) => {
    acc[lead.industry] = (acc[lead.industry] || 0) + 1;
    return acc;
  }, {});
  
  const result = Object.entries(distribution).map(([industry, count]) => ({
    industry,
    count,
    percentage: Math.round((count / mockDB.leads.length) * 100)
  })).sort((a, b) => b.count - a.count);
  
  res.json({ success: true, data: result });
});

// 获取转化漏斗数据
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

// 获取邮件效果统计
app.get('/api/analytics/email-performance', authenticateToken, (req, res) => {
  const emails = mockDB.emails;
  const total = emails.length;
  const byStatus = emails.reduce((acc, email) => {
    acc[email.status] = (acc[email.status] || 0) + 1;
    return acc;
  }, {});
  
  res.json({
    success: true,
    data: {
      total,
      byStatus,
      avgTimeToOpen: emails.filter(e => e.openedAt).length > 0 ? 3600000 : 0, // 模拟数据
      avgTimeToReply: emails.filter(e => e.repliedAt).length > 0 ? 86400000 : 0
    }
  });
});

// 获取评分分布数据
app.get('/api/analytics/score-distribution', authenticateToken, (req, res) => {
  const distribution = {
    A: mockDB.leads.filter(l => l.score >= 80).length,
    B: mockDB.leads.filter(l => l.score >= 60 && l.score < 80).length,
    C: mockDB.leads.filter(l => l.score >= 40 && l.score < 60).length,
    D: mockDB.leads.filter(l => l.score < 40).length
  };
  
  res.json({ success: true, data: distribution });
});

// ============================================
// 基础 API
// ============================================

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = mockDB.users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'demo_secret', { expiresIn: '24h' });
    res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

app.get('/api/leads', authenticateToken, (req, res) => {
  res.json({ success: true, data: mockDB.leads, total: mockDB.leads.length });
});

app.get('/api/campaigns', authenticateToken, (req, res) => res.json({ success: true, data: mockDB.campaigns }));

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   🚀 企业级 AI 外销系统 v2.3 - 数据可视化版             ║
║                                                        ║
║   后端服务已启动：http://localhost:${PORT}              ║
║                                                        ║
║   🆕 数据分析 API:                                     ║
║   ✅ /api/analytics/lead-trend        线索趋势         ║
║   ✅ /api/analytics/country-distribution 国家分布      ║
║   ✅ /api/analytics/industry-distribution 行业分布     ║
║   ✅ /api/analytics/conversion-funnel 转化漏斗         ║
║   ✅ /api/analytics/email-performance 邮件效果         ║
║   ✅ /api/analytics/score-distribution 评分分布        ║
║                                                        ║
║   测试账号：admin / admin123                           ║
╚════════════════════════════════════════════════════════╝
  `);
});

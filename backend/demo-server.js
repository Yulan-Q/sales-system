/**
 * 简化版后端入口 - 演示用
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟数据库
const mockDB = {
  leads: [
    { id: 1, name: 'ABC Trading Ltd', email: 'info@abctrading.com', phone: '+44 20 1234 5678', country: 'UK', status: 'new', source: 'google_maps' },
    { id: 2, name: 'Global Import GmbH', email: 'contact@globalimport.de', phone: '+49 30 1234 5678', country: 'Germany', status: 'contacted', source: 'google_maps' },
    { id: 3, name: 'Paris Distribution SARL', email: 'hello@parisdist.fr', phone: '+33 1 23 45 67 89', country: 'France', status: 'interested', source: 'google_search' },
    { id: 4, name: 'NYC Wholesale Inc', email: 'sales@nycwholesale.com', phone: '+1 212 555 1234', country: 'USA', status: 'new', source: 'google_maps' },
    { id: 5, name: 'Tokyo Trade Co Ltd', email: 'info@tokyotrade.jp', phone: '+81 3 1234 5678', country: 'Japan', status: 'qualified', source: 'google_maps' },
  ],
  campaigns: [
    { id: 1, name: '欧洲客户开发', status: 'active', totalLeads: 150, sentEmails: 120, openRate: 45, replyRate: 12 },
    { id: 2, name: '北美市场拓展', status: 'paused', totalLeads: 80, sentEmails: 60, openRate: 38, replyRate: 8 },
  ],
  emails: [
    { id: 1, leadId: 1, subject: '合作机会 - 优质供应商', status: 'opened', sentAt: '2026-03-24 10:30', openedAt: '2026-03-24 11:15' },
    { id: 2, leadId: 2, subject: '产品介绍 & 报价', status: 'replied', sentAt: '2026-03-23 14:20', repliedAt: '2026-03-24 09:00' },
    { id: 3, leadId: 3, subject: '建立业务联系', status: 'opened', sentAt: '2026-03-24 16:45', openedAt: '2026-03-24 17:30' },
  ]
};

// API 路由

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0-demo'
  });
});

// 登录
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'demo' && password === 'demo123') {
    res.json({ 
      success: true, 
      token: 'demo_token_' + Date.now(),
      user: { 
        id: 1, 
        username: 'demo', 
        email: 'demo@example.com',
        company: 'Demo Company',
        role: 'admin' 
      }
    });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

// 获取线索列表
app.get('/api/leads', (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  let leads = mockDB.leads;
  
  if (status) {
    leads = leads.filter(l => l.status === status);
  }
  
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  
  res.json({
    success: true,
    data: leads.slice(start, end),
    total: leads.length,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

// 获取单个线索
app.get('/api/leads/:id', (req, res) => {
  const lead = mockDB.leads.find(l => l.id === parseInt(req.params.id));
  if (lead) {
    res.json({ success: true, data: lead });
  } else {
    res.status(404).json({ success: false, message: 'Lead not found' });
  }
});

// 创建线索
app.post('/api/leads', (req, res) => {
  const newLead = {
    id: mockDB.leads.length + 1,
    ...req.body,
    status: 'new',
    source: 'manual',
    createdAt: new Date().toISOString()
  };
  mockDB.leads.push(newLead);
  res.json({ success: true, data: newLead });
});

// 更新线索
app.put('/api/leads/:id', (req, res) => {
  const leadIndex = mockDB.leads.findIndex(l => l.id === parseInt(req.params.id));
  if (leadIndex !== -1) {
    mockDB.leads[leadIndex] = { ...mockDB.leads[leadIndex], ...req.body };
    res.json({ success: true, data: mockDB.leads[leadIndex] });
  } else {
    res.status(404).json({ success: false, message: 'Lead not found' });
  }
});

// 获取营销活动
app.get('/api/campaigns', (req, res) => {
  res.json({ success: true, data: mockDB.campaigns });
});

// 获取邮件列表
app.get('/api/emails', (req, res) => {
  res.json({ success: true, data: mockDB.emails });
});

// 获取仪表盘统计
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalLeads: mockDB.leads.length,
      newLeads: mockDB.leads.filter(l => l.status === 'new').length,
      totalCampaigns: mockDB.campaigns.length,
      activeCampaigns: mockDB.campaigns.filter(c => c.status === 'active').length,
      totalEmails: mockDB.emails.length,
      avgOpenRate: 42,
      avgReplyRate: 10
    }
  });
});

// 模拟 Apify 搜索
app.post('/api/leads/search', async (req, res) => {
  const { keywords, countries, limit = 10 } = req.body;
  
  // 模拟延迟
  setTimeout(() => {
    res.json({
      success: true,
      message: '搜索任务已启动',
      runId: 'run_' + Date.now(),
      estimatedTime: '2-5 分钟',
      keywords,
      countries,
      limit
    });
  }, 500);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   🚀 企业级 AI 外销系统 - 演示版                        ║
║                                                        ║
║   后端服务已启动：http://localhost:${PORT}              ║
║   API 文档：http://localhost:${PORT}/api/health         ║
║                                                        ║
║   测试账号：demo / demo123                             ║
║                                                        ║
║   可用端点：                                           ║
║   - GET  /api/health          健康检查                 ║
║   - POST /api/auth/login      登录                     ║
║   - GET  /api/leads           获取线索列表             ║
║   - GET  /api/dashboard/stats 获取统计数据             ║
║   - GET  /api/campaigns       获取营销活动             ║
║   - GET  /api/emails          获取邮件列表             ║
╚════════════════════════════════════════════════════════╝
  `);
});

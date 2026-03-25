/**
 * 企业级 AI 外销系统 v2.2 - 高级筛选 + 批量操作
 * 新增：多条件筛选、自定义排序、批量分配、批量发送邮件
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 中间件
// ============================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// 模拟数据库（增强版）
// ============================================

const mockDB = {
  users: [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', company: 'Demo Company' },
    { id: 2, username: 'sales1', password: 'sales123', role: 'sales', company: 'Demo Company' },
    { id: 3, username: 'sales2', password: 'sales123', role: 'sales', company: 'Demo Company' }
  ],
  
  leads: [
    { 
      id: 1, name: 'ABC Trading Ltd', email: 'info@abctrading.com', phone: '+44 20 1234 5678', 
      country: 'UK', industry: 'Trading', employees: 50, website: 'https://abctrading.com',
      status: 'new', source: 'apify', score: 85, assignedTo: 1, isInPublicPool: false,
      autoRecycleAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      tags: ['import', 'wholesale'], lastContactAt: null, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    { 
      id: 2, name: 'Global Import GmbH', email: 'contact@globalimport.de', phone: '+49 30 1234 5678', 
      country: 'Germany', industry: 'Import/Export', employees: 120, website: 'https://globalimport.de',
      status: 'contacted', source: 'apify', score: 72, assignedTo: 1, isInPublicPool: false,
      tags: ['distributor'], lastContactAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    { 
      id: 3, name: 'Paris Distribution SARL', email: 'hello@parisdist.fr', 
      country: 'France', industry: 'Distribution', employees: 15,
      status: 'interested', source: 'manual', score: 65, assignedTo: 2, isInPublicPool: false,
      tags: ['retail'], lastContactAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    { 
      id: 4, name: 'Tech Startup Ltd', email: 'founder@techstartup.io', 
      country: 'UK', industry: 'Technology', employees: 5,
      status: 'new', source: 'manual', score: 45, assignedTo: null, isInPublicPool: true,
      tags: ['startup', 'tech'], lastContactAt: null,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    { 
      id: 5, name: 'NYC Wholesale Inc', email: 'sales@nycwholesale.com', 
      country: 'USA', industry: 'Wholesale', employees: 80,
      status: 'qualified', source: 'apify', score: 88, assignedTo: 1, isInPublicPool: false,
      tags: ['wholesale', 'import'], lastContactAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  
  campaigns: [
    { id: 1, name: '欧洲客户开发', status: 'active', totalLeads: 150, sentEmails: 120, openRate: 45, replyRate: 12 }
  ],
  
  emails: [
    { id: 1, leadId: 1, campaignId: 1, subject: '合作机会', status: 'opened', sentAt: '2026-03-24 10:30', openedAt: '2026-03-24 11:15' }
  ],
  
  aiGenerations: [],
  emailEvents: []
};

// ============================================
// 服务层
// ============================================

class AIService {
  async generateEmail(lead, templateType = 'cold_email') {
    const templates = {
      cold_email: `尊敬的负责人，\n\n您好！我们是专注于帮助 ${lead.industry || '行业'} 企业提升销售效率的...\n\n祝商祺！`,
      follow_up: `尊敬的 ${lead.name} 团队，\n\n感谢您之前的回复，关于...\n\n祝好！`,
      proposal: `尊敬的客户，\n\n根据我们的沟通，现提供以下方案...\n\n期待您的回复！`
    };
    
    return {
      subject: `合作机会 - 助力 ${lead.name} 提升效率`,
      body: templates[templateType] || templates.cold_email,
      aiGenerated: true,
      modelUsed: 'qwen-plus'
    };
  }
  
  calculateLeadScore(lead) {
    let score = 0, breakdown = {};
    const domain = lead.email.split('@')[1];
    if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com'].includes(domain)) { score += 20; breakdown.domain = 20; } else breakdown.domain = 0;
    if (lead.employees >= 100) { score += 30; breakdown.company = 30; }
    else if (lead.employees >= 50) { score += 20; breakdown.company = 20; }
    else if (lead.employees >= 10) { score += 10; breakdown.company = 10; }
    else breakdown.company = 0;
    if (lead.industry && ['trading', 'import', 'export', 'wholesale'].some(i => lead.industry.toLowerCase().includes(i))) { score += 25; breakdown.industry = 25; } else breakdown.industry = 10;
    if (['UK', 'Germany', 'France', 'USA'].includes(lead.country)) { score += 15; breakdown.location = 15; } else breakdown.location = 5;
    if (lead.website) { score += 10; breakdown.online = 10; } else breakdown.online = 0;
    return { score: Math.min(score, 100), breakdown, level: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D' };
  }
}

const aiService = new AIService();

// ============================================
// 认证中间件
// ============================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: '未授权' });
  jwt.verify(token, process.env.JWT_SECRET || 'demo_secret', (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Token 无效' });
    req.user = user;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    next();
  };
}

// ============================================
// API 路由
// ============================================

// 健康检查
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 登录
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = mockDB.users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'demo_secret', { expiresIn: '24h' });
    res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role, company: user.company } });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

// ============================================
// 高级筛选 API（新增核心功能）
// ============================================

app.get('/api/leads', authenticateToken, (req, res) => {
  const {
    status, country, source, industry,
    minScore, maxScore,
    assignedTo, publicPool,
    sortBy = 'score', order = 'desc',
    page = 1, limit = 20,
    search, tags,
    dateFrom, dateTo
  } = req.query;
  
  let leads = [...mockDB.leads];
  
  // 文本搜索（公司名/邮箱）
  if (search) {
    const searchLower = search.toLowerCase();
    leads = leads.filter(l => 
      l.name.toLowerCase().includes(searchLower) ||
      l.email.toLowerCase().includes(searchLower)
    );
  }
  
  // 基础筛选
  if (status) leads = leads.filter(l => l.status === status);
  if (country) leads = leads.filter(l => l.country === country);
  if (source) leads = leads.filter(l => l.source === source);
  if (industry) leads = leads.filter(l => l.industry === industry);
  
  // 评分范围筛选
  if (minScore) leads = leads.filter(l => l.score >= parseInt(minScore));
  if (maxScore) leads = leads.filter(l => l.score <= parseInt(maxScore));
  
  // 分配筛选
  if (assignedTo === 'unassigned') leads = leads.filter(l => !l.assignedTo);
  else if (assignedTo) leads = leads.filter(l => l.assignedTo === parseInt(assignedTo));
  
  // 公海池筛选
  if (publicPool === 'true') leads = leads.filter(l => l.isInPublicPool);
  
  // 标签筛选
  if (tags) {
    const tagArray = tags.split(',');
    leads = leads.filter(l => tagArray.some(tag => l.tags && l.tags.includes(tag)));
  }
  
  // 日期范围筛选
  if (dateFrom) leads = leads.filter(l => new Date(l.createdAt) >= new Date(dateFrom));
  if (dateTo) leads = leads.filter(l => new Date(l.createdAt) <= new Date(dateTo));
  
  // 排序
  leads.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (sortBy === 'createdAt' || sortBy === 'lastContactAt') {
      aVal = new Date(aVal || 0).getTime();
      bVal = new Date(bVal || 0).getTime();
    }
    return order === 'desc' ? bVal - aVal : aVal - bVal;
  });
  
  // 分页
  const total = leads.length;
  const start = (parseInt(page) - 1) * parseInt(limit);
  const end = start + parseInt(limit);
  const paginatedLeads = leads.slice(start, end);
  
  res.json({
    success: true,
    data: paginatedLeads,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
  });
});

// 获取筛选选项（用于下拉框）
app.get('/api/leads/filters', authenticateToken, (req, res) => {
  const countries = [...new Set(mockDB.leads.map(l => l.country))];
  const industries = [...new Set(mockDB.leads.map(l => l.industry))];
  const sources = [...new Set(mockDB.leads.map(l => l.source))];
  const statuses = [...new Set(mockDB.leads.map(l => l.status))];
  const allTags = [...new Set(mockDB.leads.flatMap(l => l.tags || []))];
  
  res.json({
    success: true,
    data: { countries, industries, sources, statuses, tags: allTags }
  });
});

// ============================================
// 批量操作 API（新增核心功能）
// ============================================

// 批量分配销售
app.post('/api/leads/bulk/assign', authenticateToken, requireRole('admin'), (req, res) => {
  const { leadIds, assignedTo } = req.body;
  
  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ success: false, message: '请选择线索' });
  }
  
  const updated = mockDB.leads.filter(l => leadIds.includes(l.id)).map(l => {
    l.assignedTo = assignedTo;
    l.isInPublicPool = false;
    l.autoRecycleAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    return l;
  });
  
  res.json({ success: true, message: `已分配 ${updated.length} 条线索`, data: { count: updated.length } });
});

// 批量发送邮件
app.post('/api/leads/bulk/send-email', authenticateToken, requireRole('admin', 'sales'), async (req, res) => {
  const { leadIds, templateType = 'cold_email' } = req.body;
  
  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ success: false, message: '请选择线索' });
  }
  
  const results = [];
  for (const leadId of leadIds) {
    const lead = mockDB.leads.find(l => l.id === leadId);
    if (lead) {
      const email = await aiService.generateEmail(lead, templateType);
      mockDB.emails.push({
        id: mockDB.emails.length + 1,
        leadId: lead.id,
        subject: email.subject,
        body: email.body,
        status: 'sent',
        sentAt: new Date().toISOString(),
        aiGenerated: true
      });
      results.push({ leadId, success: true });
    }
  }
  
  res.json({ success: true, message: `已发送 ${results.length} 封邮件`, data: { count: results.length, results } });
});

// 批量标记状态
app.post('/api/leads/bulk/update-status', authenticateToken, requireRole('admin', 'sales'), (req, res) => {
  const { leadIds, status } = req.body;
  
  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ success: false, message: '请选择线索' });
  }
  
  const updated = mockDB.leads.filter(l => leadIds.includes(l.id)).map(l => {
    l.status = status;
    l.lastContactAt = new Date().toISOString();
    return l;
  });
  
  res.json({ success: true, message: `已更新 ${updated.length} 条线索状态`, data: { count: updated.length } });
});

// 批量添加到公海池
app.post('/api/leads/bulk/recycle', authenticateToken, requireRole('admin'), (req, res) => {
  const { leadIds } = req.body;
  
  const updated = mockDB.leads.filter(l => leadIds.includes(l.id)).map(l => {
    l.isInPublicPool = true;
    l.assignedTo = null;
    return l;
  });
  
  res.json({ success: true, message: `已回收 ${updated.length} 条线索到公海池`, data: { count: updated.length } });
});

// ============================================
// 其他 API
// ============================================

app.get('/api/leads/:id', authenticateToken, (req, res) => {
  const lead = mockDB.leads.find(l => l.id === parseInt(req.params.id));
  if (lead) res.json({ success: true, data: lead });
  else res.status(404).json({ success: false, message: '未找到' });
});

app.post('/api/leads/:id/generate-email', authenticateToken, async (req, res) => {
  try {
    const lead = mockDB.leads.find(l => l.id === parseInt(req.params.id));
    if (!lead) return res.status(404).json({ success: false, message: '未找到线索' });
    const { templateType = 'cold_email' } = req.body;
    const email = await aiService.generateEmail(lead, templateType);
    res.json({ success: true, data: { ...email, leadName: lead.name, leadEmail: lead.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI 生成失败' });
  }
});

app.post('/api/leads/:id/rescore', authenticateToken, (req, res) => {
  const lead = mockDB.leads.find(l => l.id === parseInt(req.params.id));
  if (!lead) return res.status(404).json({ success: false, message: '未找到线索' });
  const scoring = aiService.calculateLeadScore(lead);
  lead.score = scoring.score;
  res.json({ success: true, data: scoring });
});

app.post('/api/public-pool/claim', authenticateToken, requireRole('admin', 'sales'), (req, res) => {
  const { leadId } = req.body;
  const lead = mockDB.leads.find(l => l.id === leadId);
  if (!lead || !lead.isInPublicPool) return res.status(400).json({ success: false, message: '线索不可领取' });
  lead.isInPublicPool = false;
  lead.assignedTo = req.user.id;
  res.json({ success: true, message: '领取成功', data: lead });
});

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const totalEmails = mockDB.emails.length;
  const openedEmails = mockDB.emails.filter(e => ['opened', 'clicked', 'replied'].includes(e.status)).length;
  res.json({
    success: true,
    data: {
      totalLeads: mockDB.leads.length,
      newLeads: mockDB.leads.filter(l => l.status === 'new').length,
      highScoreLeads: mockDB.leads.filter(l => l.score >= 80).length,
      publicPoolLeads: mockDB.leads.filter(l => l.isInPublicPool).length,
      totalCampaigns: mockDB.campaigns.length,
      aiGeneratedEmails: mockDB.aiGenerations.length,
      avgScore: Math.round(mockDB.leads.reduce((sum, l) => sum + l.score, 0) / mockDB.leads.length),
      totalEmails, openedEmails, openRate: totalEmails > 0 ? Math.round((openedEmails / totalEmails) * 100) : 0
    }
  });
});

app.get('/api/campaigns', authenticateToken, (req, res) => res.json({ success: true, data: mockDB.campaigns }));
app.get('/api/emails', authenticateToken, (req, res) => res.json({ success: true, data: mockDB.emails }));

// ============================================
// 启动服务器
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   🚀 企业级 AI 外销系统 v2.2 - 高级筛选 + 批量操作      ║
║                                                        ║
║   后端服务已启动：http://localhost:${PORT}              ║
║                                                        ║
║   🆕 新增功能：                                        ║
║   ✅ 高级筛选（多条件组合）                            ║
║   ✅ 自定义排序                                        ║
║   ✅ 分页                                              ║
║   ✅ 批量分配销售                                      ║
║   ✅ 批量发送邮件                                      ║
║   ✅ 批量标记状态                                      ║
║   ✅ 批量回收到公海池                                  ║
║                                                        ║
║   测试账号：admin / admin123                           ║
╚════════════════════════════════════════════════════════╝
  `);
});

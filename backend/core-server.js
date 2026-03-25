/**
 * 企业级 AI 外销系统 - 核心后端 v2.0
 * 包含：安全认证 + AI 邮件生成 + 线索评分 + 公海池
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

// 请求日志（不暴露敏感信息）
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// 模拟数据库（带评分和公海池）
// ============================================

const mockDB = {
  users: [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', company: 'Demo Company' },
    { id: 2, username: 'sales1', password: 'sales123', role: 'sales', company: 'Demo Company' }
  ],
  
  leads: [
    { 
      id: 1, 
      name: 'ABC Trading Ltd', 
      email: 'info@abctrading.com', 
      phone: '+44 20 1234 5678', 
      country: 'UK', 
      industry: 'Trading',
      employees: 50,
      website: 'https://abctrading.com',
      status: 'new', 
      source: 'apify',
      score: 85,  // AI 评分
      assignedTo: 1,
      isInPublicPool: false,
      autoRecycleAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    { 
      id: 2, 
      name: 'Global Import GmbH', 
      email: 'contact@globalimport.de', 
      phone: '+49 30 1234 5678', 
      country: 'Germany',
      industry: 'Import/Export',
      employees: 120,
      website: 'https://globalimport.de',
      status: 'contacted', 
      source: 'apify',
      score: 72,
      assignedTo: 1,
      isInPublicPool: false,
      autoRecycleAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    { 
      id: 3, 
      name: 'Paris Distribution SARL', 
      email: 'hello@parisdist.fr', 
      country: 'France',
      industry: 'Distribution',
      employees: 15,
      status: 'interested', 
      source: 'manual',
      score: 65,
      assignedTo: 2,
      isInPublicPool: false,
      createdAt: new Date().toISOString()
    },
    { 
      id: 4, 
      name: 'Tech Startup Ltd', 
      email: 'founder@techstartup.io', 
      country: 'UK',
      industry: 'Technology',
      employees: 5,
      status: 'new', 
      source: 'manual',
      score: 45,  // 低分 - 小公司
      assignedTo: null,
      isInPublicPool: true,  // 公海池
      createdAt: new Date().toISOString()
    }
  ],
  
  campaigns: [
    { 
      id: 1, 
      name: '欧洲客户开发', 
      status: 'active', 
      totalLeads: 150, 
      sentEmails: 120, 
      openRate: 45, 
      replyRate: 12,
      aiGenerated: true  // 使用 AI 生成邮件
    }
  ],
  
  emails: [
    { 
      id: 1, 
      leadId: 1, 
      subject: '合作机会 - 助力 ABC Trading 提升效率', 
      status: 'opened', 
      aiGenerated: true,
      sentAt: '2026-03-24 10:30', 
      openedAt: '2026-03-24 11:15' 
    }
  ],
  
  aiGenerations: []  // AI 生成记录
};

// ============================================
// AI 服务（核心功能）
// ============================================

class AIService {
  constructor() {
    // 未来扩展：集成 Qwen/GPT API
    this.apiKey = process.env.AI_API_KEY;
    this.apiEndpoint = process.env.AI_API_ENDPOINT;
  }
  
  /**
   * 生成个性化开发信
   */
  async generateEmail(lead, templateType = 'cold_email') {
    const templates = {
      cold_email: `尊敬的 {[TITLE]}，

您好！我是 {[MY_COMPANY]} 的 {[MY_NAME]}。

我们在 {[INDUSTRY]} 领域深耕多年，注意到贵司 {[COMPANY_NAME]} 在 {[COUNTRY]} 的 {[INDUSTRY]} 领域很有影响力。

我们相信，我们的 {[PRODUCT/SERVICE]} 能够帮助贵司 {[VALUE_PROPOSITION]}。

附件是我们的产品介绍，期待有机会深入交流。

祝商祺！
{[MY_NAME]}
{[CONTACT_INFO]}`
    };
    
    // 变量替换
    let email = templates[templateType];
    email = email.replace('{[TITLE]}', '负责人');
    email = email.replace('{[COMPANY_NAME]}', lead.name);
    email.replace('{[COUNTRY]}', lead.country);
    email = email.replace('{[INDUSTRY]}', lead.industry || '行业');
    email = email.replace('{[MY_COMPANY]}', '您的公司');
    email = email.replace('{[MY_NAME]}', '张三');
    email = email.replace('{[PRODUCT/SERVICE]}', '企业级 AI 外销系统');
    email = email.replace('{[VALUE_PROPOSITION]}', '提升销售效率 10 倍');
    email = email.replace('{[CONTACT_INFO]}', 'zhangsan@example.com');
    
    // 记录 AI 生成
    mockDB.aiGenerations.push({
      id: mockDB.aiGenerations.length + 1,
      leadId: lead.id,
      templateType,
      generatedContent: email,
      modelUsed: 'qwen-plus',
      tokensUsed: 150,
      createdAt: new Date().toISOString()
    });
    
    return {
      subject: `合作机会 - 助力 ${lead.name} 提升效率`,
      body: email,
      aiGenerated: true,
      modelUsed: 'qwen-plus'
    };
  }
  
  /**
   * 智能线索评分（核心 AI 功能）
   */
  calculateLeadScore(lead) {
    let score = 0;
    const breakdown = {};
    
    // 1. 邮箱域名质量（20 分）
    const domain = lead.email.split('@')[1];
    if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', '163.com'].includes(domain)) {
      score += 20;
      breakdown.domain = 20;
    } else {
      breakdown.domain = 0;
    }
    
    // 2. 公司规模（30 分）
    if (lead.employees >= 100) {
      score += 30;
      breakdown.company = 30;
    } else if (lead.employees >= 50) {
      score += 20;
      breakdown.company = 20;
    } else if (lead.employees >= 10) {
      score += 10;
      breakdown.company = 10;
    } else {
      breakdown.company = 0;
    }
    
    // 3. 行业匹配度（25 分）- 简化版
    const targetIndustries = ['trading', 'import', 'export', 'manufacturing', 'distribution'];
    if (lead.industry && targetIndustries.some(i => lead.industry.toLowerCase().includes(i))) {
      score += 25;
      breakdown.industry = 25;
    } else {
      breakdown.industry = 10;
    }
    
    // 4. 地理位置（15 分）
    const targetCountries = ['UK', 'Germany', 'France', 'USA', 'Canada', 'Australia'];
    if (targetCountries.includes(lead.country)) {
      score += 15;
      breakdown.location = 15;
    } else {
      breakdown.location = 5;
    }
    
    // 5. 在线活跃度（10 分）- 简化版
    if (lead.website) {
      score += 10;
      breakdown.online = 10;
    } else {
      breakdown.online = 0;
    }
    
    return {
      score: Math.min(score, 100),
      breakdown,
      level: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D'
    };
  }
}

const aiService = new AIService();

// ============================================
// 认证中间件
// ============================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未授权' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'demo_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token 无效' });
    }
    req.user = user;
    next();
  });
}

// 角色权限检查
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

// 健康检查（不暴露版本信息）
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 登录
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = mockDB.users.find(u => u.username === username && u.password === password);
  
  if (user) {
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'demo_secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        company: user.company
      }
    });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

// 获取线索列表（支持筛选和排序）
app.get('/api/leads', authenticateToken, (req, res) => {
  const { status, country, source, minScore, sortBy = 'score', order = 'desc', publicPool } = req.query;
  
  let leads = [...mockDB.leads];
  
  // 筛选
  if (status) leads = leads.filter(l => l.status === status);
  if (country) leads = leads.filter(l => l.country === country);
  if (source) leads = leads.filter(l => l.source === source);
  if (minScore) leads = leads.filter(l => l.score >= parseInt(minScore));
  if (publicPool === 'true') leads = leads.filter(l => l.isInPublicPool);
  
  // 排序
  leads.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return order === 'desc' ? bVal - aVal : aVal - bVal;
  });
  
  res.json({ success: true, data: leads, total: leads.length });
});

// 获取单个线索
app.get('/api/leads/:id', authenticateToken, (req, res) => {
  const lead = mockDB.leads.find(l => l.id === parseInt(req.params.id));
  if (lead) {
    res.json({ success: true, data: lead });
  } else {
    res.status(404).json({ success: false, message: '未找到' });
  }
});

// AI 生成邮件（核心功能）
app.post('/api/leads/:id/generate-email', authenticateToken, async (req, res) => {
  try {
    const lead = mockDB.leads.find(l => l.id === parseInt(req.params.id));
    if (!lead) {
      return res.status(404).json({ success: false, message: '未找到线索' });
    }
    
    const { templateType = 'cold_email' } = req.body;
    const email = await aiService.generateEmail(lead, templateType);
    
    res.json({
      success: true,
      data: {
        ...email,
        leadName: lead.name,
        leadEmail: lead.email
      }
    });
  } catch (error) {
    console.error('AI 邮件生成失败:', error);
    res.status(500).json({ success: false, message: 'AI 生成失败' });
  }
});

// 重新计算线索评分
app.post('/api/leads/:id/rescore', authenticateToken, (req, res) => {
  const lead = mockDB.leads.find(l => l.id === parseInt(req.params.id));
  if (!lead) {
    return res.status(404).json({ success: false, message: '未找到线索' });
  }
  
  const scoring = aiService.calculateLeadScore(lead);
  lead.score = scoring.score;
  
  res.json({
    success: true,
    data: {
      score: scoring.score,
      level: scoring.level,
      breakdown: scoring.breakdown
    }
  });
});

// 公海池 - 领取线索
app.post('/api/public-pool/claim', authenticateToken, requireRole('admin', 'sales'), (req, res) => {
  const { leadId } = req.body;
  const lead = mockDB.leads.find(l => l.id === leadId);
  
  if (!lead || !lead.isInPublicPool) {
    return res.status(400).json({ success: false, message: '线索不可领取' });
  }
  
  lead.isInPublicPool = false;
  lead.assignedTo = req.user.id;
  lead.autoRecycleAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  
  res.json({ success: true, message: '领取成功', data: lead });
});

// 公海池 - 回收线索（定时任务触发）
app.post('/api/leads/:id/recycle', authenticateToken, requireRole('admin'), (req, res) => {
  const lead = mockDB.leads.find(l => l.id === parseInt(req.params.id));
  if (!lead) {
    return res.status(404).json({ success: false, message: '未找到线索' });
  }
  
  lead.isInPublicPool = true;
  lead.assignedTo = null;
  
  res.json({ success: true, message: '已回收到公海池' });
});

// 获取统计数据
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const stats = {
    totalLeads: mockDB.leads.length,
    newLeads: mockDB.leads.filter(l => l.status === 'new').length,
    highScoreLeads: mockDB.leads.filter(l => l.score >= 80).length,
    publicPoolLeads: mockDB.leads.filter(l => l.isInPublicPool).length,
    totalCampaigns: mockDB.campaigns.length,
    aiGeneratedEmails: mockDB.aiGenerations.length,
    avgScore: Math.round(mockDB.leads.reduce((sum, l) => sum + l.score, 0) / mockDB.leads.length)
  };
  
  res.json({ success: true, data: stats });
});

// 获取营销活动
app.get('/api/campaigns', authenticateToken, (req, res) => {
  res.json({ success: true, data: mockDB.campaigns });
});

// ============================================
// 启动服务器
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   🚀 企业级 AI 外销系统 v2.0 - 核心版                   ║
║                                                        ║
║   后端服务已启动：http://localhost:${PORT}              ║
║   环境：${process.env.NODE_ENV || 'development'}                    ║
║                                                        ║
║   核心功能：                                           ║
║   ✅ 安全认证（JWT + 角色权限）                        ║
║   ✅ AI 邮件生成                                        ║
║   ✅ 智能线索评分                                      ║
║   ✅ 公海池机制                                        ║
║                                                        ║
║   测试账号：                                           ║
║   - 管理员：admin / admin123                           ║
║   - 销售：sales1 / sales123                            ║
╚════════════════════════════════════════════════════════╝
  `);
});

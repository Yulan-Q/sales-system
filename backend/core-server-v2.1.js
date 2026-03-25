/**
 * 企业级 AI 外销系统 v2.1 - 邮件追踪增强版
 * 新增：邮件追踪（打开/点击）+ 邮件历史时间线
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

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// 模拟数据库（增强版 - 带邮件追踪）
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
      score: 85,
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
      score: 45,
      assignedTo: null,
      isInPublicPool: true,
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
      aiGenerated: true
    }
  ],
  
  emails: [
    { 
      id: 1, 
      leadId: 1, 
      campaignId: 1,
      subject: '合作机会 - 助力 ABC Trading 提升效率', 
      body: '尊敬的负责人...\n\n...',
      status: 'opened', 
      aiGenerated: true,
      sentAt: '2026-03-24 10:30',
      openedAt: '2026-03-24 11:15',
      clickedAt: null,
      repliedAt: null,
      
      // 邮件追踪
      trackingId: 'trk_abc123',
      trackingPixel: 'https://track.example.com/pixel/trk_abc123.png',
      links: [
        { url: 'https://example.com/product', clicks: 3, lastClickedAt: '2026-03-24 11:20' },
        { url: 'https://example.com/pricing', clicks: 1, lastClickedAt: '2026-03-24 11:25' }
      ],
      
      // 设备信息
      openedDevices: [
        { type: 'desktop', os: 'Windows', browser: 'Chrome', firstOpenedAt: '2026-03-24 11:15', openCount: 3 },
        { type: 'mobile', os: 'iOS', browser: 'Safari', firstOpenedAt: '2026-03-24 14:30', openCount: 1 }
      ],
      
      sentBy: 1
    },
    { 
      id: 2, 
      leadId: 2, 
      campaignId: 1,
      subject: '产品介绍 & 报价', 
      body: '尊敬的 Global Import 团队...\n\n...',
      status: 'replied', 
      aiGenerated: true,
      sentAt: '2026-03-23 14:20',
      openedAt: '2026-03-23 15:00',
      clickedAt: '2026-03-23 15:05',
      repliedAt: '2026-03-24 09:00',
      
      trackingId: 'trk_def456',
      trackingPixel: 'https://track.example.com/pixel/trk_def456.png',
      links: [
        { url: 'https://example.com/product', clicks: 5, lastClickedAt: '2026-03-23 15:10' }
      ],
      
      openedDevices: [
        { type: 'desktop', os: 'Windows', browser: 'Outlook', firstOpenedAt: '2026-03-23 15:00', openCount: 2 }
      ],
      
      sentBy: 1
    },
    { 
      id: 3, 
      leadId: 3, 
      campaignId: 1,
      subject: '建立业务联系', 
      body: '尊敬的 Paris Distribution...\n\n...',
      status: 'opened', 
      aiGenerated: true,
      sentAt: '2026-03-24 16:45',
      openedAt: '2026-03-24 17:30',
      
      trackingId: 'trk_ghi789',
      trackingPixel: 'https://track.example.com/pixel/trk_ghi789.png',
      links: [],
      
      openedDevices: [
        { type: 'mobile', os: 'Android', browser: 'Gmail', firstOpenedAt: '2026-03-24 17:30', openCount: 1 }
      ],
      
      sentBy: 1
    }
  ],
  
  aiGenerations: [],
  
  // 邮件追踪事件日志
  emailEvents: [
    { id: 1, emailId: 1, eventType: 'sent', timestamp: '2026-03-24 10:30', data: {} },
    { id: 2, emailId: 1, eventType: 'opened', timestamp: '2026-03-24 11:15', data: { device: 'desktop', os: 'Windows' } },
    { id: 3, emailId: 1, eventType: 'opened', timestamp: '2026-03-24 14:30', data: { device: 'mobile', os: 'iOS' } },
    { id: 4, emailId: 2, eventType: 'sent', timestamp: '2026-03-23 14:20', data: {} },
    { id: 5, emailId: 2, eventType: 'opened', timestamp: '2026-03-23 15:00', data: { device: 'desktop' } },
    { id: 6, emailId: 2, eventType: 'clicked', timestamp: '2026-03-23 15:05', data: { url: 'https://example.com/product' } },
    { id: 7, emailId: 2, eventType: 'replied', timestamp: '2026-03-24 09:00', data: {} }
  ]
};

// ============================================
// AI 服务
// ============================================

class AIService {
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
    
    let email = templates[templateType];
    email = email.replace('{[TITLE]}', '负责人');
    email = email.replace('{[COMPANY_NAME]}', lead.name);
    email = email.replace('{[COUNTRY]}', lead.country);
    email = email.replace('{[INDUSTRY]}', lead.industry || '行业');
    email = email.replace('{[MY_COMPANY]}', '您的公司');
    email = email.replace('{[MY_NAME]}', '张三');
    email = email.replace('{[PRODUCT/SERVICE]}', '企业级 AI 外销系统');
    email = email.replace('{[VALUE_PROPOSITION]}', '提升销售效率 10 倍');
    email = email.replace('{[CONTACT_INFO]}', 'zhangsan@example.com');
    
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
  
  calculateLeadScore(lead) {
    let score = 0;
    const breakdown = {};
    
    const domain = lead.email.split('@')[1];
    if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', '163.com'].includes(domain)) {
      score += 20;
      breakdown.domain = 20;
    } else {
      breakdown.domain = 0;
    }
    
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
    
    const targetIndustries = ['trading', 'import', 'export', 'manufacturing', 'distribution'];
    if (lead.industry && targetIndustries.some(i => lead.industry.toLowerCase().includes(i))) {
      score += 25;
      breakdown.industry = 25;
    } else {
      breakdown.industry = 10;
    }
    
    const targetCountries = ['UK', 'Germany', 'France', 'USA', 'Canada', 'Australia'];
    if (targetCountries.includes(lead.country)) {
      score += 15;
      breakdown.location = 15;
    } else {
      breakdown.location = 5;
    }
    
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
// 邮件追踪服务（新增核心功能）
// ============================================

class EmailTrackingService {
  /**
   * 生成追踪 ID
   */
  generateTrackingId() {
    return 'trk_' + crypto.randomBytes(16).toString('hex');
  }
  
  /**
   * 记录邮件打开事件
   */
  trackOpen(emailId, userAgent) {
    const email = mockDB.emails.find(e => e.id === emailId);
    if (!email) return false;
    
    // 更新邮件状态
    if (email.status === 'sent') {
      email.status = 'opened';
    }
    email.openedAt = new Date().toISOString();
    
    // 解析 User-Agent
    const deviceInfo = this.parseUserAgent(userAgent);
    
    // 记录设备
    const existingDevice = email.openedDevices.find(d => d.type === deviceInfo.type);
    if (existingDevice) {
      existingDevice.openCount++;
    } else {
      email.openedDevices.push({
        type: deviceInfo.type,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        firstOpenedAt: new Date().toISOString(),
        openCount: 1
      });
    }
    
    // 记录事件
    mockDB.emailEvents.push({
      id: mockDB.emailEvents.length + 1,
      emailId,
      eventType: 'opened',
      timestamp: new Date().toISOString(),
      data: deviceInfo
    });
    
    return true;
  }
  
  /**
   * 记录链接点击事件
   */
  trackClick(emailId, url, userAgent) {
    const email = mockDB.emails.find(e => e.id === emailId);
    if (!email) return false;
    
    if (email.status === 'sent' || email.status === 'opened') {
      email.status = 'clicked';
    }
    email.clickedAt = new Date().toISOString();
    
    // 更新链接点击统计
    const link = email.links.find(l => l.url === url);
    if (link) {
      link.clicks++;
      link.lastClickedAt = new Date().toISOString();
    } else {
      email.links.push({
        url,
        clicks: 1,
        lastClickedAt: new Date().toISOString()
      });
    }
    
    // 记录事件
    mockDB.emailEvents.push({
      id: mockDB.emailEvents.length + 1,
      emailId,
      eventType: 'clicked',
      timestamp: new Date().toISOString(),
      data: { url }
    });
    
    return true;
  }
  
  /**
   * 解析 User-Agent
   */
  parseUserAgent(userAgent) {
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const isWindows = /windows/i.test(userAgent);
    const isMac = /macintosh/i.test(userAgent);
    const isChrome = /chrome/i.test(userAgent);
    const isSafari = /safari/i.test(userAgent);
    const isFirefox = /firefox/i.test(userAgent);
    const isOutlook = /outlook/i.test(userAgent);
    
    return {
      type: isMobile ? 'mobile' : 'desktop',
      os: isWindows ? 'Windows' : isMac ? 'macOS' : isMobile ? 'Mobile' : 'Unknown',
      browser: isOutlook ? 'Outlook' : isChrome ? 'Chrome' : isSafari ? 'Safari' : isFirefox ? 'Firefox' : 'Unknown'
    };
  }
  
  /**
   * 获取邮件历史时间线
   */
  getEmailTimeline(emailId) {
    const events = mockDB.emailEvents.filter(e => e.emailId === emailId);
    return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
  
  /**
   * 获取线索的邮件历史
   */
  getLeadEmailHistory(leadId) {
    const emails = mockDB.emails.filter(e => e.leadId === leadId);
    return emails.map(email => ({
      ...email,
      timeline: this.getEmailTimeline(email.id)
    }));
  }
}

const emailTrackingService = new EmailTrackingService();

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

// 获取线索列表
app.get('/api/leads', authenticateToken, (req, res) => {
  const { status, country, source, minScore, sortBy = 'score', order = 'desc', publicPool } = req.query;
  
  let leads = [...mockDB.leads];
  
  if (status) leads = leads.filter(l => l.status === status);
  if (country) leads = leads.filter(l => l.country === country);
  if (source) leads = leads.filter(l => l.source === source);
  if (minScore) leads = leads.filter(l => l.score >= parseInt(minScore));
  if (publicPool === 'true') leads = leads.filter(l => l.isInPublicPool);
  
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

// AI 生成邮件
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

// ============================================
// 邮件追踪 API（新增）
// ============================================

// 追踪像素（1x1 透明图）
app.get('/api/track/open/:trackingId', (req, res) => {
  const { trackingId } = req.params;
  const email = mockDB.emails.find(e => e.trackingId === trackingId);
  
  if (email) {
    const userAgent = req.headers['user-agent'] || '';
    emailTrackingService.trackOpen(email.id, userAgent);
    console.log(`📧 邮件打开追踪：${email.subject} by ${userAgent}`);
  }
  
  // 返回 1x1 透明 PNG
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
});

// 链接点击追踪
app.get('/api/track/click/:trackingId', (req, res) => {
  const { trackingId } = req.params;
  const { url } = req.query;
  
  const email = mockDB.emails.find(e => e.trackingId === trackingId);
  
  if (email && url) {
    const userAgent = req.headers['user-agent'] || '';
    emailTrackingService.trackClick(email.id, url, userAgent);
    console.log(`🖱️ 链接点击追踪：${url} from ${email.subject}`);
  }
  
  // 重定向到目标 URL
  if (url) {
    res.redirect(url);
  } else {
    res.status(400).json({ success: false, message: 'Missing URL' });
  }
});

// 获取邮件历史时间线
app.get('/api/emails/:id/timeline', authenticateToken, (req, res) => {
  const email = mockDB.emails.find(e => e.id === parseInt(req.params.id));
  if (!email) {
    return res.status(404).json({ success: false, message: '未找到邮件' });
  }
  
  const timeline = emailTrackingService.getEmailTimeline(email.id);
  res.json({ success: true, data: { email, timeline } });
});

// 获取线索的邮件历史
app.get('/api/leads/:id/email-history', authenticateToken, (req, res) => {
  const lead = mockDB.leads.find(l => l.id === parseInt(req.params.id));
  if (!lead) {
    return res.status(404).json({ success: false, message: '未找到线索' });
  }
  
  const history = emailTrackingService.getLeadEmailHistory(lead.id);
  res.json({ success: true, data: history });
});

// 获取统计数据
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const totalEmails = mockDB.emails.length;
  const openedEmails = mockDB.emails.filter(e => e.status === 'opened' || e.status === 'clicked' || e.status === 'replied').length;
  const clickedEmails = mockDB.emails.filter(e => e.status === 'clicked' || e.status === 'replied').length;
  const repliedEmails = mockDB.emails.filter(e => e.status === 'replied').length;
  
  const stats = {
    totalLeads: mockDB.leads.length,
    newLeads: mockDB.leads.filter(l => l.status === 'new').length,
    highScoreLeads: mockDB.leads.filter(l => l.score >= 80).length,
    publicPoolLeads: mockDB.leads.filter(l => l.isInPublicPool).length,
    totalCampaigns: mockDB.campaigns.length,
    aiGeneratedEmails: mockDB.aiGenerations.length,
    avgScore: Math.round(mockDB.leads.reduce((sum, l) => sum + l.score, 0) / mockDB.leads.length),
    
    // 邮件追踪统计
    totalEmails,
    openedEmails,
    clickedEmails,
    repliedEmails,
    openRate: totalEmails > 0 ? Math.round((openedEmails / totalEmails) * 100) : 0,
    clickRate: totalEmails > 0 ? Math.round((clickedEmails / totalEmails) * 100) : 0,
    replyRate: totalEmails > 0 ? Math.round((repliedEmails / totalEmails) * 100) : 0
  };
  
  res.json({ success: true, data: stats });
});

// 获取营销活动
app.get('/api/campaigns', authenticateToken, (req, res) => {
  res.json({ success: true, data: mockDB.campaigns });
});

// 获取邮件列表
app.get('/api/emails', authenticateToken, (req, res) => {
  res.json({ success: true, data: mockDB.emails });
});

// ============================================
// 启动服务器
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   🚀 企业级 AI 外销系统 v2.1 - 邮件追踪版               ║
║                                                        ║
║   后端服务已启动：http://localhost:${PORT}              ║
║   环境：${process.env.NODE_ENV || 'development'}                    ║
║                                                        ║
║   核心功能：                                           ║
║   ✅ 安全认证（JWT + 角色权限）                        ║
║   ✅ AI 邮件生成                                        ║
║   ✅ 智能线索评分                                      ║
║   ✅ 公海池机制                                        ║
║   🆕 邮件追踪（打开/点击）                             ║
║   🆕 邮件历史时间线                                    ║
║                                                        ║
║   邮件追踪端点：                                       ║
║   GET /api/track/open/:trackingId (1x1 像素)            ║
║   GET /api/track/click/:trackingId?url=xxx (重定向)     ║
║                                                        ║
║   测试账号：                                           ║
║   - 管理员：admin / admin123                           ║
║   - 销售：sales1 / sales123                            ║
╚════════════════════════════════════════════════════════╝
  `);
});

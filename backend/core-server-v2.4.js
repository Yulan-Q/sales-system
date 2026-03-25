/**
 * 企业级 AI 外销系统 v2.4 - 详情页面 + 时区智能发送
 * 新增：线索详情抽屉、时区计算、最佳发送时间
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

// 时区映射表
const countryTimezones = {
  'UK': 'Europe/London',
  'Germany': 'Europe/Berlin',
  'France': 'Europe/Paris',
  'USA': 'America/New_York',
  'Canada': 'America/Toronto',
  'Australia': 'Australia/Sydney',
  'Japan': 'Asia/Tokyo',
  'China': 'Asia/Shanghai',
  'Spain': 'Europe/Madrid',
  'Italy': 'Europe/Rome'
};

// 模拟数据库
const mockDB = {
  users: [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
    { id: 2, username: 'sales1', password: 'sales123', role: 'sales' }
  ],
  
  leads: [
    { 
      id: 1, name: 'ABC Trading Ltd', email: 'info@abctrading.com', phone: '+44 20 1234 5678', 
      country: 'UK', industry: 'Trading', employees: 50, website: 'https://abctrading.com',
      status: 'new', source: 'apify', score: 85, assignedTo: 1, isInPublicPool: false,
      address: '123 Business Street, London, UK',
      description: '英国领先的贸易公司，专注于进口电子产品',
      tags: ['import', 'wholesale', 'electronics'],
      lastContactAt: null,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      contacts: [
        { name: 'John Smith', title: 'Procurement Manager', email: 'j.smith@abctrading.com', phone: '+44 20 1234 5679' }
      ],
      notes: [
        { id: 1, content: '客户对电子产品感兴趣', createdBy: 'admin', createdAt: new Date().toISOString() }
      ]
    }
  ],
  
  emails: [],
  campaigns: []
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
// 时区智能发送 API（新增核心功能）
// ============================================

// 获取线索的本地时间
app.get('/api/leads/:id/localtime', authenticateToken, (req, res) => {
  const lead = mockDB.leads.find(l => l.id === parseInt(req.params.id));
  if (!lead) return res.status(404).json({ success: false, message: '未找到线索' });
  
  const timezone = countryTimezones[lead.country] || 'UTC';
  const localTime = moment().tz(timezone);
  
  res.json({
    success: true,
    data: {
      country: lead.country,
      timezone,
      localTime: localTime.format('YYYY-MM-DD HH:mm:ss'),
      localDate: localTime.format('YYYY-MM-DD'),
      dayOfWeek: localTime.format('dddd'),
      hour: localTime.hour()
    }
  });
});

// 获取最佳发送时间
app.get('/api/leads/:id/best-send-time', authenticateToken, (req, res) => {
  const lead = mockDB.leads.find(l => l.id === parseInt(req.params.id));
  if (!lead) return res.status(404).json({ success: false, message: '未找到线索' });
  
  const timezone = countryTimezones[lead.country] || 'UTC';
  const now = moment().tz(timezone);
  
  // 最佳发送时间规则
  const bestHour = 9.5; // 上午 9:30
  const avoidDays = ['Sunday', 'Saturday']; // 避免周末
  
  let sendTime = now.clone().hour(bestHour).minute(0).second(0);
  
  // 如果是周末，顺延到周一
  if (avoidDays.includes(sendTime.format('dddd'))) {
    sendTime.add(1, 'day').day(1); // 下周一
  }
  
  // 如果已经过了今天的最佳时间，且不是周末，则明天发送
  if (now.isAfter(sendTime) && !avoidDays.includes(now.format('dddd'))) {
    sendTime.add(1, 'day');
    if (avoidDays.includes(sendTime.format('dddd'))) {
      sendTime.day(1); // 如果是周末，顺延到周一
    }
  }
  
  res.json({
    success: true,
    data: {
      timezone,
      currentTime: now.format('YYYY-MM-DD HH:mm:ss'),
      bestSendTime: sendTime.format('YYYY-MM-DD HH:mm:ss'),
      bestSendHour: `${bestHour === 9.5 ? '09:30' : bestHour}:00`,
      dayOfWeek: sendTime.format('dddd'),
      reasons: [
        '上午 9:30 是最佳打开时间',
        '避免周末发送',
        `客户所在时区：${timezone}`
      ]
    }
  });
});

// 获取所有国家的时区列表
app.get('/api/timezones', authenticateToken, (req, res) => {
  const timezones = Object.entries(countryTimezones).map(([country, tz]) => ({
    country,
    timezone: tz,
    currentTime: moment().tz(tz).format('YYYY-MM-DD HH:mm:ss'),
    dayOfWeek: moment().tz(tz).format('dddd')
  }));
  
  res.json({ success: true, data: timezones });
});

// ============================================
// 智能回复建议 API（新增核心功能）
// ============================================

// 分析邮件情感并生成回复建议
app.post('/api/emails/:id/analyze-reply', authenticateToken, (req, res) => {
  const { replyText } = req.body;
  
  if (!replyText) {
    return res.status(400).json({ success: false, message: '请提供回复内容' });
  }
  
  // 简单的情感分析（实际应该用 AI）
  const positiveKeywords = ['interested', 'great', 'good', 'yes', 'sure', 'like', 'love', 'thank', 'appreciate', 'helpful'];
  const negativeKeywords = ['not interested', 'no', 'busy', 'expensive', 'stop', 'unsubscribe', 'spam'];
  const inquiryKeywords = ['price', 'cost', 'how much', 'quote', 'pricing', 'discount', 'sample', 'demo'];
  
  const textLower = replyText.toLowerCase();
  
  let sentiment = 'neutral';
  let sentimentScore = 50;
  
  // 计算情感得分
  positiveKeywords.forEach(word => {
    if (textLower.includes(word)) sentimentScore += 10;
  });
  
  negativeKeywords.forEach(word => {
    if (textLower.includes(word)) sentimentScore -= 15;
  });
  
  if (sentimentScore >= 70) sentiment = 'positive';
  else if (sentimentScore <= 30) sentiment = 'negative';
  
  // 检测是否询价
  const isInquiry = inquiryKeywords.some(word => textLower.includes(word));
  
  // 生成回复建议
  const replySuggestions = {
    positive_inquiry: {
      type: '积极 + 询价',
      priority: 'high',
      suggestions: [
        '尽快发送详细报价单',
        '提供产品目录和价格表',
        '安排产品演示或样品',
        '询问具体需求和数量'
      ],
      template: `尊敬的客户，\n\n非常感谢您的兴趣！关于您询问的价格，我们提供以下方案：\n\n[详细报价]\n\n如果您需要样品或演示，请告诉我。\n\n期待您的回复！`
    },
    positive_demo: {
      type: '积极 + 要求演示',
      priority: 'high',
      suggestions: [
        '立即安排演示会议',
        '发送日历邀请',
        '准备演示材料',
        '确认参会人员'
      ],
      template: `太好了！我们很乐意为您安排产品演示。\n\n以下是可用的时间段：\n1. [时间 1]\n2. [时间 2]\n3. [时间 3]\n\n请告诉我哪个时间方便您。\n\n期待与您会面！`
    },
    positive_general: {
      type: '积极',
      priority: 'medium',
      suggestions: [
        '发送更多产品信息',
        '邀请参加网络研讨会',
        '分享客户案例',
        '提供限时优惠'
      ],
      template: `感谢您的积极回复！\n\n附件是我们的详细产品介绍和客户案例。\n\n如果您有任何问题，随时联系我。\n\n祝商祺！`
    },
    negative_not_now: {
      type: '消极 + 暂时不需要',
      priority: 'low',
      suggestions: [
        '保持友好关系',
        '标记为 3 个月后跟进',
        '发送有价值的内容',
        '不要频繁打扰'
      ],
      template: `完全理解！感谢您抽出时间回复。\n\n如果未来有需要，随时联系我。\n\n祝您业务兴隆！\n\n我会保持联系，分享一些行业洞察，希望对您有帮助。`
    },
    negative_spam: {
      type: '负面 + 投诉',
      priority: 'critical',
      suggestions: [
        '立即道歉',
        '从邮件列表移除',
        '检查邮件来源',
        '避免再次发送'
      ],
      template: `非常抱歉给您带来困扰！\n\n我们已将您从邮件列表中移除，不会再发送类似邮件。\n\n如有任何问题，请回复此邮件。\n\n再次道歉！`
    },
    neutral: {
      type: '中性',
      priority: 'medium',
      suggestions: [
        '提供更多价值信息',
        '询问具体需求',
        '分享成功案例',
        '邀请参加活动'
      ],
      template: `感谢您的回复！\n\n我们专注于帮助 [行业] 企业提升效率。不知道您目前是否面临 [具体挑战]？\n\n我们可以帮助您 [具体价值]。\n\n期待进一步交流！`
    }
  };
  
  // 选择回复模板
  let suggestionType = 'neutral';
  if (sentiment === 'positive' && isInquiry) suggestionType = 'positive_inquiry';
  else if (sentiment === 'positive' && textLower.includes('demo')) suggestionType = 'positive_demo';
  else if (sentiment === 'positive') suggestionType = 'positive_general';
  else if (sentiment === 'negative' && textLower.includes('stop')) suggestionType = 'negative_spam';
  else if (sentiment === 'negative') suggestionType = 'negative_not_now';
  
  res.json({
    success: true,
    data: {
      sentiment,
      sentimentScore,
      isInquiry,
      suggestionType,
      ...replySuggestions[suggestionType],
      originalText: replyText
    }
  });
});

// ============================================
// 线索详情 API
// ============================================

app.get('/api/leads/:id', authenticateToken, (req, res) => {
  const lead = mockDB.leads.find(l => l.id === parseInt(req.params.id));
  if (!lead) return res.status(404).json({ success: false, message: '未找到线索' });
  
  // 获取时区信息
  const timezone = countryTimezones[lead.country] || 'UTC';
  const localTime = moment().tz(timezone);
  
  res.json({
    success: true,
    data: {
      ...lead,
      localTime: localTime.format('YYYY-MM-DD HH:mm:ss'),
      timezone
    }
  });
});

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

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   🚀 企业级 AI 外销系统 v2.4 - 详情 + 时区智能发送      ║
║                                                        ║
║   后端服务已启动：http://localhost:${PORT}              ║
║                                                        ║
║   🆕 新增功能：                                        ║
║   ✅ 线索详情页面                                      ║
║   ✅ 时区智能发送                                      ║
║   ✅ 智能回复建议                                      ║
║                                                        ║
║   测试账号：admin / admin123                           ║
╚════════════════════════════════════════════════════════╝
  `);
});

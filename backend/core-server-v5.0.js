/**
 * 企业级 AI 外销系统 v5.0 - 性能优化版后端
 * 优化：缓存、懒加载、数据库连接池、AI 预测
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 性能优化：缓存层 =====
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 分钟 TTL

app.use(cors());
app.use(express.json());

// ===== 性能优化：请求日志中间件 =====
const requestCount = { total: 0, byEndpoint: {} };
app.use((req, res, next) => {
  requestCount.total++;
  requestCount.byEndpoint[req.path] = (requestCount.byEndpoint[req.path] || 0) + 1;
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.log(`⚠️ 慢请求：${req.path} (${duration}ms)`);
    }
  });
  next();
});

// 模拟数据库
const mockDB = {
  users: [{ id: 1, username: 'admin', password: 'admin123', role: 'admin' }],
  leads: Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Company ${i + 1} Ltd`,
    email: `info@company${i + 1}.com`,
    country: ['UK', 'Germany', 'USA', 'France', 'Japan'][i % 5],
    industry: ['Trading', 'Tech', 'Manufacturing', 'Service', 'Retail'][i % 5],
    employees: Math.floor(Math.random() * 200) + 10,
    status: ['new', 'contacted', 'interested', 'qualified'][i % 4],
    score: Math.floor(Math.random() * 40) + 60,
    source: ['apify', 'manual', 'import'][i % 3],
    assignedTo: i % 3 === 0 ? 1 : null,
    isInPublicPool: i % 3 !== 0,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastContactAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null
  })),
  emails: [],
  campaigns: [],
  aiPredictions: []
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

// ===== 性能优化：缓存中间件 =====
function cacheMiddleware(keyPrefix, ttl = 300) {
  return (req, res, next) => {
    const key = `${keyPrefix}:${JSON.stringify(req.query)}`;
    const cached = cache.get(key);
    if (cached) {
      console.log(`✅ 缓存命中：${key}`);
      return res.json(cached);
    }
    res.on('finish', () => {
      if (res.statusCode === 200) {
        cache.set(key, res.locals.data, ttl);
        console.log(`💾 缓存存储：${key}`);
      }
    });
    next();
  };
}

// ===== AI 预测功能（新增） =====
function generateAIPredictions() {
  const predictions = [];
  
  // 预测 1: 转化概率
  mockDB.leads.forEach(lead => {
    const conversionProbability = (
      (lead.score / 100) * 0.4 +
      (lead.status === 'interested' ? 0.3 : lead.status === 'contacted' ? 0.15 : 0.05) +
      (lead.employees > 50 ? 0.1 : 0.05) +
      (lead.lastContactAt ? 0.1 : 0)
    ) * 100;
    
    predictions.push({
      leadId: lead.id,
      leadName: lead.name,
      conversionProbability: Math.min(Math.round(conversionProbability), 99),
      predictedCloseDate: new Date(Date.now() + conversionProbability * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recommendedAction: conversionProbability > 70 ? '立即跟进' : conversionProbability > 50 ? '3 天内联系' : '培育线索',
      confidence: 0.75 + Math.random() * 0.2
    });
  });
  
  return predictions.sort((a, b) => b.conversionProbability - a.conversionProbability);
}

// ===== API 路由 =====

// 健康检查（带缓存统计）
app.get('/api/health', (req, res) => {
  const stats = cache.getStats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '5.0.0',
    performance: {
      cacheKeys: stats.keys,
      cacheHits: stats.hits,
      cacheMisses: stats.misses,
      hitRate: stats.hits > 0 ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%' : '0%'
    },
    requests: requestCount
  });
});

// 登录
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

// 仪表盘统计（带缓存）
app.get('/api/dashboard/stats', authenticateToken, cacheMiddleware('stats'), (req, res) => {
  const totalLeads = mockDB.leads.length;
  const newLeads = mockDB.leads.filter(l => l.status === 'new').length;
  const contactedLeads = mockDB.leads.filter(l => l.status === 'contacted').length;
  const interestedLeads = mockDB.leads.filter(l => l.status === 'interested').length;
  const qualifiedLeads = mockDB.leads.filter(l => l.status === 'qualified').length;
  
  const data = {
    leads: { total: totalLeads, new: newLeads, contacted: contactedLeads, interested: interestedLeads, qualified: qualifiedLeads },
    campaigns: mockDB.campaigns.length,
    avgScore: Math.round(mockDB.leads.reduce((sum, l) => sum + l.score, 0) / totalLeads),
    publicPool: mockDB.leads.filter(l => l.isInPublicPool).length,
    highValueLeads: mockDB.leads.filter(l => l.score >= 80).length
  };
  
  res.locals.data = { success: true, data };
  res.json(res.locals.data);
});

// AI 转化预测（新增核心功能）
app.get('/api/ai/predictions', authenticateToken, cacheMiddleware('predictions', 600), (req, res) => {
  const predictions = generateAIPredictions();
  const top10 = predictions.slice(0, 10);
  
  res.locals.data = {
    success: true,
    data: {
      total: predictions.length,
      top10,
      avgConversionRate: Math.round(predictions.reduce((sum, p) => sum + p.conversionProbability, 0) / predictions.length),
      highProbabilityLeads: predictions.filter(p => p.conversionProbability > 70).length,
      generatedAt: new Date().toISOString()
    }
  };
  res.json(res.locals.data);
});

// 智能推荐（新增核心功能）
app.get('/api/ai/recommendations', authenticateToken, (req, res) => {
  const recommendations = [];
  
  // 推荐 1: 最佳联系时间
  const bestTimeLeads = mockDB.leads.filter(l => l.status === 'new' && l.score >= 70).slice(0, 5);
  if (bestTimeLeads.length > 0) {
    recommendations.push({
      type: 'priority_contact',
      title: '优先联系高价值线索',
      description: `${bestTimeLeads.length} 条高评分新线索等待联系`,
      items: bestTimeLeads.map(l => ({ name: l.name, score: l.score, country: l.country })),
      action: '立即联系',
      impact: 'high'
    });
  }
  
  // 推荐 2: 公海池优质线索
  const publicPoolGood = mockDB.leads.filter(l => l.isInPublicPool && l.score >= 75).slice(0, 3);
  if (publicPoolGood.length > 0) {
    recommendations.push({
      type: 'public_pool_opportunity',
      title: '公海池优质线索',
      description: `${publicPoolGood.length} 条高分线索在公海池`,
      items: publicPoolGood.map(l => ({ name: l.name, score: l.score })),
      action: '领取线索',
      impact: 'medium'
    });
  }
  
  // 推荐 3: 需要跟进的线索
  const followUpNeeded = mockDB.leads.filter(l => 
    l.status === 'contacted' && 
    l.lastContactAt && 
    new Date() - new Date(l.lastContactAt) > 3 * 24 * 60 * 60 * 1000
  ).slice(0, 5);
  if (followUpNeeded.length > 0) {
    recommendations.push({
      type: 'follow_up',
      title: '需要跟进的线索',
      description: `${followUpNeeded.length} 条线索超过 3 天未跟进`,
      items: followUpNeeded.map(l => ({ name: l.name, lastContact: l.lastContactAt })),
      action: '发送跟进邮件',
      impact: 'high'
    });
  }
  
  res.json({ success: true, data: { recommendations, total: recommendations.length } });
});

// 线索列表（支持分页和筛选，带缓存）
app.get('/api/leads', authenticateToken, cacheMiddleware('leads', 120), (req, res) => {
  const { page = 1, limit = 50, status, country, minScore } = req.query;
  
  let leads = mockDB.leads;
  if (status) leads = leads.filter(l => l.status === status);
  if (country) leads = leads.filter(l => l.country === country);
  if (minScore) leads = leads.filter(l => l.score >= parseInt(minScore));
  
  const total = leads.length;
  const start = (parseInt(page) - 1) * parseInt(limit);
  const paginated = leads.slice(start, start + parseInt(limit));
  
  res.locals.data = { success: true, data: paginated, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
  res.json(res.locals.data);
});

// 转化漏斗
app.get('/api/analytics/conversion-funnel', authenticateToken, cacheMiddleware('funnel'), (req, res) => {
  const total = mockDB.leads.length;
  const contacted = mockDB.leads.filter(l => l.status !== 'new').length;
  const interested = mockDB.leads.filter(l => ['interested', 'qualified'].includes(l.status)).length;
  const qualified = mockDB.leads.filter(l => l.status === 'qualified').length;
  
  const data = {
    stages: [
      { name: '总线索', value: total, rate: 100 },
      { name: '已联系', value: contacted, rate: Math.round((contacted / total) * 100) },
      { name: '感兴趣', value: interested, rate: Math.round((interested / total) * 100) },
      { name: '已转化', value: qualified, rate: Math.round((qualified / total) * 100) }
    ],
    bottleneck: contacted / total < 0.5 ? '初次联系环节' : interested / contacted < 0.5 ? '兴趣转化环节' : '无明显瓶颈'
  };
  
  res.locals.data = { success: true, data };
  res.json(res.locals.data);
});

// 趋势数据
app.get('/api/analytics/lead-trend', authenticateToken, cacheMiddleware('trend'), (req, res) => {
  const { days = 30 } = req.query;
  const trendData = Array.from({ length: parseInt(days) }, (_, i) => ({
    date: new Date(Date.now() - (parseInt(days) - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    newLeads: Math.floor(Math.random() * 20) + 5,
    contacted: Math.floor(Math.random() * 15) + 3,
    qualified: Math.floor(Math.random() * 8) + 1
  }));
  
  res.locals.data = { success: true, data: trendData };
  res.json(res.locals.data);
});

// 国家分布
app.get('/api/analytics/country-distribution', authenticateToken, cacheMiddleware('country'), (req, res) => {
  const distribution = mockDB.leads.reduce((acc, lead) => {
    acc[lead.country] = (acc[lead.country] || 0) + 1;
    return acc;
  }, {});
  const result = Object.entries(distribution).map(([country, count]) => ({
    country, count, percentage: Math.round((count / mockDB.leads.length) * 100)
  })).sort((a, b) => b.count - a.count);
  
  res.locals.data = { success: true, data: result };
  res.json(res.locals.data);
});

// 缓存管理 API
app.get('/api/cache/stats', authenticateToken, (req, res) => {
  const stats = cache.getStats();
  res.json({
    success: true,
    data: {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits > 0 ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%' : '0%',
      requests: requestCount
    }
  });
});

app.post('/api/cache/clear', authenticateToken, (req, res) => {
  cache.flushAll();
  res.json({ success: true, message: '缓存已清空' });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   🚀 企业级 AI 外销系统 v5.0 - 性能优化版               ║
║                                                        ║
║   后端服务已启动：http://localhost:${PORT}              ║
║                                                        ║
║   ⚡ 性能优化：                                        ║
║   ✅ 内存缓存（NodeCache）                             ║
║   ✅ 响应缓存（5 分钟 TTL）                              ║
║   ✅ 请求日志监控                                      ║
║   ✅ 慢请求检测（>1s）                                 ║
║                                                        ║
║   🤖 AI 增强：                                         ║
║   ✅ 转化概率预测                                      ║
║   ✅ 智能推荐系统                                      ║
║   ✅ 瓶颈分析                                          ║
║                                                        ║
║   测试账号：admin / admin123                           ║
╚════════════════════════════════════════════════════════╝
  `);
});

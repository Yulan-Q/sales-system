# 企业级 AI 外销系统

🚀 基于 AI 的跨境销售自动化系统 - 线索挖掘、智能评分、邮件生成、邮件追踪、CRM 管理

## ✨ 核心功能

### v2.1 当前版本功能

- 🔒 **安全认证** - JWT Token + 角色权限管理
- 🤖 **AI 邮件生成** - 根据线索信息自动生成个性化开发信
- 🎯 **智能线索评分** - 100 分制 A/B/C/D 分级，优先跟进高价值客户
- 🌊 **公海池机制** - 48 小时未跟进自动回收，防止资源浪费
- 📧 **邮件追踪** - 实时追踪邮件打开/点击，记录设备信息
- 📊 **数据统计** - 打开率/点击率/回复率实时统计
- 📋 **邮件历史时间线** - 完整记录客户互动历史

### 即将实现功能

- 🔍 高级筛选与排序
- 📱 批量操作（分配/发送邮件/标记状态）
- 📈 数据可视化图表（ECharts）
- 🎭 详情抽屉页面
- 🌍 时区智能发送
- 🤖 智能回复建议
- 🔗 LinkedIn 集成
- 🔐 GDPR 合规

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/ai-sales-system.git
cd ai-sales-system
```

### 2. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端（可选，已有静态 HTML 可直接使用）
cd ../frontend
npm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑 .env 文件，填入真实配置
# - JWT_SECRET
# - APIFY_TOKEN (线索挖掘)
# - BREVO_API_KEY (邮件发送)
```

### 4. 启动服务

```bash
# 后端服务（端口 3000）
cd backend
node core-server-v2.1.js

# 前端服务（端口 8080，可选）
cd ../frontend
python3 -m http.server 8080
```

### 5. 访问系统

- 前端：http://localhost:8080/v2.1-tracking.html
- 后端 API: http://localhost:3000/api/health

**测试账号**:
- 管理员：`admin` / `admin123`
- 销售：`sales1` / `sales123`

## 📁 项目结构

```
ai-sales-system/
├── backend/
│   ├── core-server-v2.1.js    # 核心后端（v2.1 邮件追踪版）
│   ├── core-server.js          # 核心后端（v2.0）
│   ├── demo-server.js          # 演示后端（v1.0）
│   ├── .env                    # 环境变量（不上传）
│   ├── .env.example            # 环境变量模板
│   └── package.json            # 依赖配置
├── frontend/
│   ├── v2.1-tracking.html      # 前端（v2.1 邮件追踪）
│   ├── v2-demo.html            # 前端（v2.0 核心版）
│   └── demo.html               # 前端（v1.0 演示版）
├── docs/
│   ├── README.md               # 项目说明
│   ├── 产品升级计划 v2.0.md     # 产品规划
│   ├── 扩展架构设计.md          # 技术架构
│   ├── 开发日志.md              # 开发记录
│   ├── 实施报告-Day1.md        # Day 1 实施报告
│   └── 迭代 2-邮件追踪完成.md    # 迭代记录
└── .gitignore                  # Git 忽略文件
```

## 🔌 API 文档

### 认证相关

```bash
# 登录
POST /api/auth/login
Body: { "username": "admin", "password": "admin123" }
Response: { "token": "xxx", "user": {...} }
```

### 线索管理

```bash
# 获取线索列表（支持筛选/排序）
GET /api/leads?status=new&sortBy=score&order=desc

# 获取单个线索
GET /api/leads/:id

# AI 生成邮件
POST /api/leads/:id/generate-email
Body: { "templateType": "cold_email" }

# 重新计算线索评分
POST /api/leads/:id/rescore

# 获取线索邮件历史
GET /api/leads/:id/email-history
```

### 邮件追踪

```bash
# 追踪像素（1x1 透明图）
GET /api/track/open/:trackingId

# 链接点击追踪
GET /api/track/click/:trackingId?url=https://example.com

# 获取邮件时间线
GET /api/emails/:id/timeline
```

### 公海池

```bash
# 领取公海线索
POST /api/public-pool/claim
Body: { "leadId": 4 }
```

### 数据统计

```bash
# 获取仪表盘统计
GET /api/dashboard/stats
```

## 🎯 核心功能演示

### 1. AI 邮件生成

```javascript
// 根据线索信息自动生成个性化邮件
POST /api/leads/1/generate-email

Response:
{
  "subject": "合作机会 - 助力 ABC Trading Ltd 提升效率",
  "body": "尊敬的负责人，\n\n您好！...",
  "aiGenerated": true
}
```

### 2. 智能线索评分

```javascript
// 100 分制评分维度：
// - 邮箱域名：20 分（公司域名 vs 免费邮箱）
// - 公司规模：30 分（员工数）
// - 行业匹配：25 分（目标行业）
// - 地理位置：15 分（目标国家）
// - 在线活跃：10 分（是否有网站）

POST /api/leads/1/rescore

Response:
{
  "score": 90,
  "level": "A",
  "breakdown": {
    "domain": 20,
    "company": 20,
    "industry": 25,
    "location": 15,
    "online": 10
  }
}
```

### 3. 邮件追踪

```javascript
// 邮件打开追踪
GET /api/track/open/trk_abc123
// 返回 1x1 透明 PNG，同时记录：
// - 打开时间
// - 设备类型（桌面/移动）
// - 操作系统
// - 浏览器

// 邮件点击追踪
GET /api/track/click/trk_abc123?url=https://example.com
// 302 重定向到目标 URL，同时记录点击事件
```

## 🛠️ 技术栈

**后端**:
- Node.js 18+
- Express 4.x
- JWT 认证
- better-sqlite3（开发）/ PostgreSQL（生产）

**前端**:
- 原生 HTML/CSS/JavaScript
- 无需构建工具，开箱即用

**邮件服务**:
- Brevo（SMTP/API）
- 追踪像素技术
- 链接重定向

**线索挖掘**:
- Apify（Google Maps/搜索）

## 📊 开发进度

| 版本 | 功能 | 状态 | 完成时间 |
|------|------|------|----------|
| v1.0 | 演示版 | ✅ 完成 | 2026-03-25 13:40 |
| v2.0-core | 安全+AI+ 评分 + 公海池 | ✅ 完成 | 2026-03-25 15:20 |
| v2.1-tracking | 邮件追踪 | ✅ 完成 | 2026-03-25 15:35 |
| v2.2-filter | 高级筛选 + 批量操作 | ⏳ 进行中 | - |
| v2.3-charts | 数据可视化 | ⏳ 计划 | - |

**总体进度**: 7/35 功能完成（20%）  
**核心功能**: 6/12 完成（50%）

## 🚧 待开发功能

### Phase 2: 增强功能（Day 2-3）
- [ ] 高级筛选与排序
- [ ] 批量操作
- [ ] 数据可视化图表
- [ ] 详情抽屉

### Phase 3: AI 增强（Day 4-5）
- [ ] 智能回复建议
- [ ] 时区智能发送
- [ ] 邮件模板优化

### Phase 4: 企业功能（Week 2-3）
- [ ] GDPR 合规
- [ ] LinkedIn 集成
- [ ] WhatsApp 集成
- [ ] 决策人挖掘

## 📝 开发日志

详见 [docs/开发日志.md](docs/开发日志.md)

## 🤝 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 License

MIT License

## 📞 联系方式

- 项目地址：https://github.com/YOUR_USERNAME/ai-sales-system
- 问题反馈：https://github.com/YOUR_USERNAME/ai-sales-system/issues

## 🙏 致谢

感谢以下开源项目：
- [Apify](https://apify.com/) - 线索挖掘
- [Brevo](https://www.brevo.com/) - 邮件发送
- [Express](https://expressjs.com/) - Web 框架
- [Vue.js](https://vuejs.org/) - 前端框架（可选）

---

**干就完了！** 💪🔥

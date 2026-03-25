# 🚀 企业级 AI 外销系统 v6.0

> 基于 React + Node.js 的现代化 B2B 跨境销售自动化 SaaS 系统

[![Version](https://img.shields.io/badge/version-6.0.0-blue.svg)](https://github.com/Yulan-Q/sales-system)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.0-blue.svg)](https://ant.design/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

---

## 📋 目录

- [核心功能](#-核心功能)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [功能演示](#-功能演示)
- [部署指南](#-部署指南)
- [开发计划](#-开发计划)

---

## ✨ 核心功能

### 🎯 线索管理
- ✅ **完整 CRUD** - 创建、查看、编辑、删除线索
- ✅ **智能搜索** - 公司名、邮箱、国家多字段搜索
- ✅ **高级筛选** - 状态、国家、评分多维度筛选
- ✅ **批量操作** - 批量分配、批量发邮件、批量标记
- ✅ **数据导出** - 支持 Excel/CSV 导出

### 📊 数据仪表盘
- ✅ **实时统计** - 总线索、新线索、转化率实时展示
- ✅ **转化漏斗** - 可视化销售漏斗，瓶颈分析
- ✅ **国家分布** - 线索地理分布饼图
- ✅ **评分分布** - 线索质量评分柱状图
- ✅ **智能预警** - 高价值线索、公海池预警

### 🤖 AI 功能
- ✅ **邮件生成** - AI 自动生成个性化开发信
- ✅ **线索评分** - 100 分制智能评分（5 维度）
- ✅ **智能推荐** - 优先联系高价值线索
- ✅ **A/B 测试** - 邮件模板效果对比
- ⏳ **情绪分析** - 客户回复情感分析（开发中）

### 🔒 安全与权限
- ✅ **JWT 认证** - Access Token + Refresh Token
- ✅ **角色权限** - 管理员/销售经理/普通销售
- ✅ **操作日志** - 完整审计日志
- ✅ **数据隔离** - 多租户架构准备

---

## 🛠️ 技术栈

### 前端
- **React 18** - 现代化 UI 框架
- **Ant Design 5** - 企业级组件库
- **React Router 6** - 路由管理
- **Zustand** - 轻量级状态管理
- **Axios** - HTTP 客户端
- **ECharts** - 数据可视化
- **Day.js** - 日期处理
- **Vite** - 快速构建工具

### 后端
- **Node.js 18+** - 运行时环境
- **Express 4** - Web 框架
- **JWT** - 身份认证
- **NodeCache** - 内存缓存
- **SQLite** - 开发数据库
- **PostgreSQL** - 生产数据库（推荐）

### 部署
- **Docker** - 容器化部署
- **Nginx** - 反向代理
- **GitHub Actions** - CI/CD
- **Railway/Supabase** - 云端部署

---

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0
- npm >= 9.0
- Git

### 1. 克隆项目

```bash
git clone https://github.com/Yulan-Q/sales-system.git
cd sales-system
```

### 2. 安装依赖

```bash
# 前端
cd frontend-react
npm install

# 后端
cd ../backend
npm install
```

### 3. 启动服务

```bash
# 终端 1：启动后端（端口 3000）
cd backend
node core-server-v5.0.js

# 终端 2：启动前端（端口 3001）
cd frontend-react
npm run dev
```

### 4. 访问系统

浏览器打开：**http://localhost:3001**

**测试账号**:
- 管理员：`admin` / `admin123`
- 销售：`sales1` / `sales123`

---

## 📁 项目结构

```
sales-system/
├── backend/                    # 后端服务
│   ├── core-server-v5.0.js    # 性能优化版后端
│   ├── config/                # 配置文件
│   ├── controllers/           # 控制器
│   ├── services/              # 业务服务
│   ├── models/                # 数据模型
│   ├── middleware/            # 中间件
│   ├── routes/                # 路由
│   └── utils/                 # 工具函数
│
├── frontend-react/             # React 前端
│   ├── src/
│   │   ├── components/        # 可复用组件
│   │   │   ├── Sidebar.jsx
│   │   │   └── Header.jsx
│   │   ├── pages/             # 页面组件
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Leads.jsx
│   │   │   ├── Campaigns.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Login.jsx
│   │   ├── store/             # 状态管理
│   │   │   ├── authStore.js
│   │   │   └── leadStore.js
│   │   ├── utils/             # 工具函数
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── docker/                     # Docker 配置
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
│
├── docker-compose.yml          # Docker 编排
├── DATABASE_GUIDE.md          # 数据库配置指南
└── README.md                   # 本文档
```

---

## 📸 功能演示

### 登录页面
- 精美渐变背景
- 表单验证
- 错误提示

### 仪表盘
- 4 个核心指标卡片
- 转化漏斗可视化
- 智能预警面板
- 国家/评分分布图表

### 线索管理
- 数据表格（可排序/筛选/分页）
- 搜索功能（多字段）
- 新建/编辑模态框
- 批量操作工具栏
- 删除确认对话框

---

## 🗄️ 数据库配置

### 开发环境（SQLite）

无需配置，自动创建 `sales.db` 文件。

### 生产环境（PostgreSQL）

参考 [`DATABASE_GUIDE.md`](./DATABASE_GUIDE.md)

**推荐云端数据库**:
1. **Supabase** - 免费 500MB，自带 API
2. **Railway** - 免费$5/月额度
3. **Neon** - 免费 500MB，Serverless

---

## 🚢 部署指南

### Docker 部署（推荐）

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问：**http://localhost:8080**

### 手动部署

#### 前端构建

```bash
cd frontend-react
npm run build
# 输出到 dist/ 目录
```

#### 后端部署

```bash
cd backend
NODE_ENV=production node core-server-v5.0.js
```

#### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend-react/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 API 文档

### 认证相关

```bash
POST /api/auth/login
Body: { "username": "admin", "password": "admin123" }
Response: { "token": "xxx", "user": {...} }
```

### 线索管理

```bash
# 获取线索列表
GET /api/leads?page=1&limit=20&status=new

# 创建线索
POST /api/leads
Body: { "name": "ABC Ltd", "email": "info@abc.com", ... }

# 更新线索
PUT /api/leads/:id
Body: { "status": "contacted", ... }

# 删除线索
DELETE /api/leads/:id

# 批量操作
POST /api/leads/bulk/update
Body: { "ids": [1,2,3], "data": {...} }
```

### 数据分析

```bash
# 仪表盘统计
GET /api/dashboard/stats

# 转化漏斗
GET /api/analytics/conversion-funnel

# 线索趋势
GET /api/analytics/lead-trend?days=30

# 国家分布
GET /api/analytics/country-distribution
```

---

## 🗺️ 开发计划

### v6.0（当前版本）✅
- [x] React 前端框架
- [x] 线索 CRUD 功能
- [x] 搜索/筛选/排序
- [x] 数据可视化
- [x] 响应式设计

### v6.1（下周）
- [ ] 营销活动管理
- [ ] 邮件发送功能
- [ ] 邮件追踪（打开/点击）
- [ ] SQLite 数据库集成

### v6.2（下月）
- [ ] AI 邮件 A/B 测试
- [ ] 智能推荐系统
- [ ] 情绪分析
- [ ] 多语言支持

### v7.0（未来）
- [ ] 多租户架构
- [ ] CRM 集成（Salesforce/HubSpot）
- [ ] LinkedIn 集成
- [ ] 移动端 App

---

## 🤝 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 License

MIT License

---

## 📞 联系方式

- **项目地址**: https://github.com/Yulan-Q/sales-system
- **问题反馈**: https://github.com/Yulan-Q/sales-system/issues
- **在线演示**: https://sales-system-demo.vercel.app

---

## 🙏 致谢

感谢以下开源项目：
- [React](https://reactjs.org/)
- [Ant Design](https://ant.design/)
- [ECharts](https://echarts.apache.org/)
- [Express](https://expressjs.com/)

---

**干就完了！** 💪🔥

**Made with ❤️ by Yulan-Q**

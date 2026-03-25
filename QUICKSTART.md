# 快速启动指南

---

## 🚀 5 分钟快速开始

### 前置要求

- Node.js 18+ 
- npm 或 pnpm
- Git

---

### Step 1: 克隆项目

```bash
cd ~/openclaw/workspace
git clone <your-repo-url> cross-border-sales-agent
cd cross-border-sales-agent
```

---

### Step 2: 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install

# 返回项目根目录
cd ..
```

---

### Step 3: 配置环境变量

**方式 1: 交互式配置（推荐⭐）**

```bash
# 运行配置向导
node scripts/setup.js
```

会有 5 个简单问题，回答完自动生成配置文件！

**方式 2: 手动配置**

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
vim .env
```

**必填配置**:

```bash
# API Keys（必须填写）
APIFY_TOKEN=your_apify_token_here
# 获取：https://console.apify.com/account#/integrations

BREVO_API_KEY=your_brevo_api_key_here
# 获取：https://app.brevo.com/settings/keys/api

JWT_SECRET=change_this_to_a_random_secret_key
```

---

### Step 4: 初始化数据库

```bash
# 创建数据库目录
mkdir -p database

# 数据库会在首次启动时自动初始化
```

---

### Step 5: 启动开发服务器

```bash
# 方式 1: 同时启动前后端（推荐）
npm run dev

# 方式 2: 分别启动
# 后端
cd backend && npm run dev

# 前端（新终端）
cd frontend && npm run dev
```

**启动成功后访问**:
- 前端：http://localhost:5173
- 后端 API: http://localhost:3000/api/v1
- API 文档：http://localhost:3000/api/v1/health

---

### Step 6: 创建测试账号

```bash
# 进入 backend 目录
cd backend

# 创建初始数据脚本
cat > scripts/create-test-user.js << 'EOF'
const Database = require('../src/config/database')

async function createTestUser() {
  await Database.initDatabase()
  const db = Database.getDatabase()
  
  // 创建测试公司
  const company = db.prepare(`
    INSERT INTO companies (name, api_key)
    VALUES (?, ?)
  `).run('Demo Company', 'demo_api_key_123456')
  
  // 创建测试用户（密码：123456）
  const bcrypt = require('bcryptjs')
  const passwordHash = bcrypt.hashSync('123456', 10)
  
  const user = db.prepare(`
    INSERT INTO users (company_id, email, password_hash, name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(company.lastInsertRowid, 'admin@demo.com', passwordHash, 'Admin User', 'admin')
  
  console.log('✅ Test user created:')
  console.log('   Email: admin@demo.com')
  console.log('   Password: 123456')
}

createTestUser().catch(console.error)
EOF

# 运行脚本
node scripts/create-test-user.js
```

---

### Step 7: 登录系统

1. 访问 http://localhost:5173
2. 使用测试账号登录:
   - 邮箱：`admin@demo.com`
   - 密码：`123456`

---

## 📋 功能测试

### 测试 1: 线索挖掘

1. 进入「线索管理」页面
2. 点击「搜索线索」按钮
3. 输入关键词：`LED light`
4. 选择国家：`United States`
5. 点击开始搜索
6. 等待 10-30 秒，查看搜索结果

---

### 测试 2: 邮件生成

1. 在线索列表点击任意线索
2. 进入线索详情页
3. 点击「生成开发信」
4. 填写公司信息
5. 查看 AI 生成的邮件内容

---

### 测试 3: 邮件发送（需配置 Brevo）

1. 确保 `.env` 中配置了 `BREVO_API_KEY`
2. 在邮件生成页面点击「发送」
3. 查看发送状态
4. 检查收件箱

---

## 🛠️ 常见问题

### Q1: 后端启动失败

**错误**: `Error: Cannot find module 'better-sqlite3'`

**解决**:
```bash
cd backend
npm rebuild better-sqlite3
```

---

### Q2: 前端无法连接后端

**错误**: `Network Error`

**检查**:
1. 后端是否启动（http://localhost:3000/health）
2. 前端代理配置（`frontend/vite.config.js`）
3. CORS 配置（`backend/src/index.js`）

---

### Q3: Apify 搜索失败

**错误**: `Apify search failed: Authentication failed`

**解决**:
1. 检查 `APIFY_TOKEN` 是否正确
2. 访问 https://console.apify.com/account#/integrations 重新生成 Token
3. 重启后端服务

---

### Q4: Brevo 邮件发送失败

**错误**: `Brevo API error: Unauthorized`

**解决**:
1. 检查 `BREVO_API_KEY` 是否正确
2. 访问 https://app.brevo.com/settings/keys/api 重新生成 Key
3. 验证发件人域名（Brevo 要求）

---

## 📦 生产部署

### Docker 部署（推荐）

```bash
# 构建镜像
docker build -t cross-border-sales .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -p 5173:80 \
  -e APIFY_TOKEN=your_token \
  -e BREVO_API_KEY=your_key \
  -v ./database:/app/database \
  --name sales-agent \
  cross-border-sales
```

---

### 源码部署

```bash
# 构建前端
cd frontend
npm run build

# 配置 Nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 🔧 开发指南

### 后端开发

```bash
cd backend
npm run dev  # 热重载
```

**目录结构**:
- `src/routes/` - API 路由
- `src/controllers/` - 业务逻辑
- `src/services/` - 外部服务调用
- `src/models/` - 数据模型

---

### 前端开发

```bash
cd frontend
npm run dev  # 热重载
```

**目录结构**:
- `src/views/` - 页面组件
- `src/components/` - 通用组件
- `src/api/` - API 调用
- `src/stores/` - 状态管理

---

## 📞 技术支持

- 项目文档：`/docs/` 目录
- API 文档：`/API.md`
- 数据库结构：`/database-schema.sql`

---

**祝开发顺利！** 🚀

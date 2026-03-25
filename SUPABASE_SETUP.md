# 🗄️ Supabase 数据库配置指南

## 🎯 为什么选择 Supabase

| 维度 | Supabase | Railway | 自建 PostgreSQL |
|------|----------|---------|----------------|
| **成本** | 免费 5GB | $5/月起 | $10+/月 |
| **AI 功能** | 内置 pgvector | 需自建 | 需自建 |
| **实时功能** | 内置 WebSocket | 需自建 | 需自建 |
| **备份** | 自动每日备份 | 需配置 | 需自建 |
| **迁移工具** | ✅ 提供 | ❌ | ❌ |

---

## 📝 快速开始

### 1. 创建 Supabase 项目

1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 填写项目信息：
   - **Name**: sales-system
   - **Database Password**: 强密码（保存好！）
   - **Region**: 选择最近的（推荐 Asia South）

### 2. 获取连接信息

项目创建后，在 **Settings → Database** 找到：

```
Host: db.xxxxxxxxxxxxx.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [你的密码]
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
# Supabase 配置
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:[密码]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

# JWT 配置
JWT_SECRET=your_super_secret_jwt_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 应用配置
NODE_ENV=production
PORT=3000
```

---

## 📋 数据库迁移脚本

### 1. 创建表结构

在 Supabase **SQL Editor** 中执行：

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(20) DEFAULT 'sales' CHECK (role IN ('admin', 'sales_manager', 'sales')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 线索表
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  country VARCHAR(100),
  industry VARCHAR(100),
  employees INTEGER,
  website VARCHAR(255),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'qualified', 'invalid')),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  source VARCHAR(50) DEFAULT 'manual',
  assigned_to UUID REFERENCES users(id),
  is_public_pool BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE
);

-- 邮件表
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id UUID,
  subject VARCHAR(500),
  body TEXT,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'clicked', 'replied', 'bounced')),
  tracking_id VARCHAR(100) UNIQUE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 邮件事件表（用于追踪）
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('sent', 'opened', 'clicked', 'replied', 'bounced')),
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 营销活动表
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  total_leads INTEGER DEFAULT 0,
  sent_emails INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  reply_rate DECIMAL(5,2) DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 操作日志表
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 刷新 Token 表（用于 JWT 双 Token）
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. 创建索引（性能优化）

```sql
-- 线索表索引
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score_status ON leads(score DESC, status) WHERE status = 'new';
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_country ON leads(country);

-- 邮件表索引
CREATE INDEX idx_emails_lead_id ON emails(lead_id);
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_sent_at ON emails(sent_at DESC);

-- 邮件事件表索引（关键！邮件追踪是写密集型）
CREATE INDEX idx_email_events_email_id ON email_events(email_id);
CREATE INDEX idx_email_events_tracking_id ON email_events(tracking_id);
CREATE INDEX idx_email_events_created_at ON email_events(created_at DESC);
CREATE INDEX idx_email_events_type ON email_events(event_type);

-- 用户表索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- 刷新 Token 索引
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### 3. 插入测试数据

```sql
-- 插入测试用户（密码是 admin123 和 sales123 的哈希）
INSERT INTO users (username, password, email, role) VALUES
('admin', '$2b$10$YourHashedPasswordHere', 'admin@example.com', 'admin'),
('sales1', '$2b$10$YourHashedPasswordHere', 'sales1@example.com', 'sales');

-- 插入测试线索
INSERT INTO leads (name, email, country, industry, employees, status, score, source) VALUES
('ABC Trading Ltd', 'info@abctrading.com', 'UK', 'Trading', 50, 'new', 85, 'apify'),
('Global Import GmbH', 'contact@globalimport.de', 'Germany', 'Import/Export', 120, 'contacted', 72, 'apify'),
('Paris Distribution SARL', 'hello@parisdist.fr', 'France', 'Distribution', 15, 'interested', 65, 'manual'),
('NYC Wholesale Inc', 'sales@nycwholesale.com', 'USA', 'Wholesale', 80, 'qualified', 88, 'apify');
```

### 4. 创建 Row Level Security (RLS) 策略

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的数据（管理员除外）
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 线索：销售只能查看分配给自己的或公海池的
CREATE POLICY "Sales can view assigned leads" ON leads
  FOR SELECT USING (
    assigned_to = auth.uid() OR 
    is_public_pool = TRUE OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 邮件：查看关联线索的权限
CREATE POLICY "Users can view related emails" ON emails
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = emails.lead_id 
      AND (leads.assigned_to = auth.uid() OR leads.is_public_pool = TRUE)
    ) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## 🔌 Node.js 连接配置

### 1. 安装依赖

```bash
npm install @supabase/supabase-node postgres
```

### 2. 数据库连接池

```javascript
// backend/config/database.js
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase 需要 SSL
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

// 测试连接
pool.on('connect', () => {
  console.log('✅ 数据库连接成功')
})

pool.on('error', (err) => {
  console.error('❌ 数据库错误:', err)
})

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
}
```

### 3. Supabase 客户端

```javascript
// backend/config/supabase.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

module.exports = { supabase }
```

---

## 📊 性能优化

### 1. 连接池配置

在 Supabase Dashboard → **Database → Connection Pooling**：

- **Max clients**: 10-20（支撑 1000 并发）
- **Pool mode**: Transaction

### 2. 查询优化

```javascript
// ✅ 好的做法：使用参数化查询
const result = await pool.query(
  'SELECT * FROM leads WHERE status = $1 AND score >= $2',
  ['new', 80]
)

// ❌ 避免：字符串拼接
const result = await pool.query(
  `SELECT * FROM leads WHERE status = '${status}'` // SQL 注入风险！
)
```

### 3. 事务支持

```javascript
// 批量操作需要事务
const client = await pool.connect()
try {
  await client.query('BEGIN')
  
  // 多个操作
  await client.query('UPDATE leads SET status = $1 WHERE id = $2', ['contacted', id1])
  await client.query('UPDATE leads SET status = $1 WHERE id = $2', ['contacted', id2])
  
  await client.query('COMMIT')
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  client.release()
}
```

---

## 🔄 从 SQLite 迁移到 PostgreSQL

### 1. 导出 SQLite 数据

```bash
sqlite3 sales.db ".dump" > backup.sql
```

### 2. 转换 SQL 语法

SQLite → PostgreSQL 差异：
- `AUTOINCREMENT` → `GENERATED ALWAYS AS IDENTITY`
- `DATETIME` → `TIMESTAMP WITH TIME ZONE`
- `BOOLEAN` → `BOOLEAN`（相同）
- `TEXT` → `TEXT`（相同）

### 3. 导入 PostgreSQL

```bash
psql -h db.xxx.supabase.co -U postgres -d postgres < backup_converted.sql
```

---

## 📈 监控与备份

### 1. 监控仪表板

Supabase 自带监控：
- **Database → Metrics** - CPU/内存/连接数
- **Logs** - 查询日志
- **API** - API 调用统计

### 2. 自动备份

- Supabase 自动每日备份
- 保留 7 天
- 可手动创建快照

### 3. 设置告警

在 Supabase **Settings → Notifications** 设置：
- 磁盘使用 > 80%
- CPU 使用 > 90%
- 连接数 > 90%

---

## 🎯 下一步

1. **立即创建 Supabase 项目**（5 分钟）
2. **执行迁移脚本**（10 分钟）
3. **配置环境变量**（5 分钟）
4. **测试连接**（5 分钟）
5. **迁移现有数据**（可选）

---

**干就完了！** 💪🔥

**Supabase 地址**: https://supabase.com

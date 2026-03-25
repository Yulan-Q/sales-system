# 🗄️ 数据库配置指南

## 方案选择

### 开发环境：SQLite（简单快捷）
- ✅ 无需安装数据库服务
- ✅ 单文件存储
- ✅ 适合小型项目/开发测试

### 生产环境：PostgreSQL（推荐）
- ✅ 高性能
- ✅ 支持并发
- ✅ 完整的事务支持
- ✅ 数据备份恢复

---

## SQLite 配置（开发）

### 1. 安装依赖

```bash
cd backend
npm install better-sqlite3
```

### 2. 数据库初始化脚本

```javascript
// backend/database/init.js
const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, 'sales.db'))

// 创建线索表
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    industry TEXT,
    employees INTEGER,
    status TEXT DEFAULT 'new',
    score INTEGER DEFAULT 0,
    source TEXT,
    assigned_to INTEGER,
    is_public_pool BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_contact_at DATETIME
  )
`)

// 创建用户表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'sales',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// 创建邮件表
db.exec(`
  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,
    campaign_id INTEGER,
    subject TEXT,
    body TEXT,
    status TEXT,
    sent_at DATETIME,
    opened_at DATETIME,
    clicked_at DATETIME,
    replied_at DATETIME,
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  )
`)

// 创建操作日志表
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`)

// 插入测试数据
const stmt = db.prepare('INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)')
stmt.run('admin', 'admin123', 'admin')
stmt.run('sales1', 'sales123', 'sales')

console.log('✅ 数据库初始化完成')
module.exports = db

```

### 3. 后端数据库连接

```javascript
// backend/config/database.js
const db = require('../database/init')

module.exports = {
  getLeads: (filters = {}) => {
    let sql = 'SELECT * FROM leads WHERE 1=1'
    const params = []
    
    if (filters.status) {
      sql += ' AND status = ?'
      params.push(filters.status)
    }
    if (filters.country) {
      sql += ' AND country = ?'
      params.push(filters.country)
    }
    if (filters.minScore) {
      sql += ' AND score >= ?'
      params.push(filters.minScore)
    }
    
    return db.prepare(sql).all(...params)
  },
  
  createLead: (data) => {
    const stmt = db.prepare(`
      INSERT INTO leads (name, email, phone, country, industry, employees, status, score, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      data.name, data.email, data.phone, data.country,
      data.industry, data.employees, data.status, data.score, data.description
    )
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid)
  },
  
  updateLead: (id, data) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    const values = Object.values(data)
    const stmt = db.prepare(`UPDATE leads SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    stmt.run(...values, id)
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(id)
  },
  
  deleteLead: (id) => {
    return db.prepare('DELETE FROM leads WHERE id = ?').run(id)
  }
}

```

---

## PostgreSQL 配置（生产）

### 1. 安装 PostgreSQL

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql
```

### 2. 创建数据库

```bash
sudo -u postgres psql
CREATE DATABASE sales_db;
CREATE USER sales_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sales_db TO sales_user;
\q
```

### 3. 环境变量

```bash
# .env
DATABASE_URL=postgresql://sales_user:your_password@localhost:5432/sales_db
```

### 4. 安装依赖

```bash
npm install pg pg-hstore sequelize
```

### 5. Sequelize 模型

```javascript
// backend/models/Lead.js
const { Sequelize, DataTypes } = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL)

const Lead = sequelize.define('Lead', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
  phone: DataTypes.STRING,
  country: DataTypes.STRING,
  industry: DataTypes.STRING,
  employees: DataTypes.INTEGER,
  status: { type: DataTypes.STRING, defaultValue: 'new' },
  score: { type: DataTypes.INTEGER, defaultValue: 0 },
  source: DataTypes.STRING,
  description: DataTypes.TEXT,
  lastContactAt: DataTypes.DATE
}, {
  timestamps: true,
  tableName: 'leads'
})

module.exports = { Lead, sequelize }

```

---

## 云端数据库推荐

### 1. Railway（推荐，免费额度）
- 网址：https://railway.app
- 免费：$5/月额度
- 支持：PostgreSQL, MySQL, MongoDB

### 2. Supabase（免费 PostgreSQL）
- 网址：https://supabase.com
- 免费：500MB 数据库
- 特色：自带 API 和实时订阅

### 3. Neon（Serverless PostgreSQL）
- 网址：https://neon.tech
- 免费：500MB 存储
- 特色：自动扩缩容

### 4. MongoDB Atlas（NoSQL 选项）
- 网址：https://mongodb.com/cloud/atlas
- 免费：512MB 存储
- 特色：文档数据库，灵活 schema

---

## 数据库备份策略

### SQLite 备份
```bash
# 备份
cp sales.db sales_backup_$(date +%Y%m%d).db

# 恢复
cp sales_backup_20260325.db sales.db
```

### PostgreSQL 备份
```bash
# 备份
pg_dump -U sales_user sales_db > backup_$(date +%Y%m%d).sql

# 恢复
psql -U sales_user sales_db < backup_20260325.sql
```

### 自动备份脚本
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -U sales_user sales_db > $BACKUP_DIR/sales_$DATE.sql
find $BACKUP_DIR -name "sales_*.sql" -mtime +7 -delete

echo "备份完成：sales_$DATE.sql"
```

### Cron 定时备份
```bash
# 每天凌晨 2 点备份
0 2 * * * /path/to/backup.sh
```

---

## 推荐方案

**开发阶段**: SQLite（简单快速）
**测试阶段**: Railway PostgreSQL（免费）
**生产阶段**: Supabase/Neon（稳定可靠）

---

**干就完了！** 💪🔥

# 🐳 Docker 部署指南

> **一键部署，生产就绪** - 5 分钟完成企业级部署

---

## 📋 前置要求

| 要求 | 版本 | 说明 |
|------|------|------|
| **Docker** | 20.10+ | [安装指南](https://docs.docker.com/get-docker/) |
| **Docker Compose** | 2.0+ | 通常随 Docker 安装 |
| **内存** | 2GB+ | 推荐 4GB |
| **磁盘** | 10GB+ | 根据数据量调整 |
| **系统** | Linux/Mac/Windows | 支持所有主流系统 |

---

## 🚀 快速部署（5 分钟）

### Step 1: 下载项目

```bash
# 克隆项目
git clone <your-repo-url> cross-border-sales-agent
cd cross-border-sales-agent
```

---

### Step 2: 配置环境变量

```bash
# 复制配置模板
cp .env.production.example .env.production

# 编辑配置文件
vim .env.production
```

**必须配置以下 3 项**:

```bash
# 1. Apify Token（线索挖掘）
APIFY_TOKEN=apify_api_xxxxxxxxxxxxx

# 2. Brevo API Key（邮件发送）
BREVO_API_KEY=xkey-xxxxxxxxxxxxxxxxxxxx

# 3. JWT Secret（安全认证）
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# 生成方法：openssl rand -hex 32
```

**可选配置**:

```bash
# 公司信息
COMPANY_NAME=Your Company
TARGET_PRODUCTS=LED Lights, Electronics
TARGET_COUNTRIES=United States, United Kingdom

# 域名（启用 HTTPS 时）
DOMAIN_NAME=your-domain.com
SSL_ENABLED=true

# 数据库（默认 SQLite，可选 PostgreSQL）
# DB_USER=sales_user
# DB_PASSWORD=secure_password
```

---

### Step 3: 一键部署

**Linux/Mac**:

```bash
# 赋予执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

**Windows**:

```bash
# 双击运行
deploy.bat

# 或在 PowerShell 中
.\deploy.bat
```

---

### Step 4: 验证部署

```bash
# 检查服务状态
docker-compose ps

# 应该看到:
# NAME                          STATUS
# cross-border-sales-app        Up (healthy)
# cross-border-sales-nginx      Up (healthy)
```

**访问系统**:

- 🌐 前端：http://localhost
- 🔌 API: http://localhost/api/v1/health
- 📊 仪表盘：http://localhost/dashboard

**默认账号**:
- 邮箱：`admin@demo.com`
- 密码：`123456`

---

## 🔧 高级部署选项

### 选项 1: 使用 PostgreSQL（生产推荐）

```bash
# 使用 PostgreSQL profile 启动
docker-compose --profile postgres up -d

# 验证数据库
docker-compose exec postgres psql -U sales_user -d cross_border_sales -c "\dt"
```

---

### 选项 2: 启用 HTTPS

**Step 1: 获取 SSL 证书**

```bash
# 使用 Let's Encrypt（免费）
certbot certonly --standalone -d your-domain.com

# 或使用自有证书
# 将证书文件放入 nginx/ssl/ 目录:
# - fullchain.pem
# - privkey.pem
```

**Step 2: 启用 HTTPS 配置**

编辑 `.env.production`:

```bash
SSL_ENABLED=true
DOMAIN_NAME=your-domain.com
```

编辑 `nginx/nginx.conf`，取消 HTTPS server 块的注释。

**Step 3: 重启服务**

```bash
docker-compose restart nginx
```

---

### 选项 3: 自动更新

```bash
# 启用 Watchtower（自动更新）
docker-compose --profile auto-update up -d

# Watchtower 会每天检查一次更新并自动重启
```

---

## 📦 常用命令

### 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重启单个服务
docker-compose restart app

# 查看服务状态
docker-compose ps
```

---

### 日志查看

```bash
# 查看所有日志
docker-compose logs -f

# 查看应用日志
docker-compose logs -f app

# 查看 Nginx 日志
docker-compose logs -f nginx

# 查看最近 100 行
docker-compose logs --tail=100 app
```

---

### 数据管理

```bash
# 进入应用容器
docker-compose exec app sh

# 进入数据库（SQLite）
docker-compose exec app sqlite3 /app/database/prod.sqlite

# 进入数据库（PostgreSQL）
docker-compose --profile postgres exec postgres psql -U sales_user

# 备份数据库
docker-compose exec app tar -czf /app/uploads/backup-$(date +%Y%m%d).tar.gz /app/database

# 恢复数据库
docker-compose exec app tar -xzf /app/uploads/backup-20260324.tar.gz -C /
```

---

### 更新升级

```bash
# 方式 1: 使用部署脚本
./deploy.sh --update

# 方式 2: 手动更新
git pull
docker-compose build --no-cache
docker-compose up -d

# 方式 3: 自动更新（需启用 profile）
docker-compose --profile auto-update up -d
```

---

## 🔐 安全加固

### 1. 修改默认密码

```bash
# 进入容器
docker-compose exec app sh

# 运行密码修改脚本
node scripts/change-password.js admin@demo.com
```

---

### 2. 配置防火墙

```bash
# 只开放必要端口
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 3000/tcp   # 内部端口，不开放
```

---

### 3. 启用 Fail2Ban

```bash
# 安装 Fail2Ban
apt-get install fail2ban

# 配置 Nginx 防护
cat > /etc/fail2ban/jail.local << EOF
[nginx-http-auth]
enabled = true
port    = http,https
filter  = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600
EOF
```

---

## 📊 监控与告警

### 1. 健康检查

```bash
# 手动检查
curl http://localhost/health

# 预期响应
{"status":"ok","timestamp":"2026-03-24T12:00:00.000Z"}
```

---

### 2. 资源监控

```bash
# 查看资源使用
docker stats cross-border-sales-app

# 或使用监控工具
docker-compose -f docker-compose.monitoring.yml up -d
```

---

### 3. 日志告警

```bash
# 创建日志监控脚本
cat > scripts/monitor-logs.sh << 'EOF'
#!/bin/bash
LOG_FILE="logs/app.log"

# 检查错误日志
if grep -q "ERROR" $LOG_FILE; then
    echo "发现错误日志！"
    # 发送邮件/钉钉/企业微信告警
fi
EOF

chmod +x scripts/monitor-logs.sh

# 添加到 crontab
crontab -e
# 每 5 分钟检查一次
*/5 * * * * /path/to/scripts/monitor-logs.sh
```

---

## 🐛 故障排查

### 问题 1: 服务无法启动

```bash
# 查看日志
docker-compose logs app

# 常见原因:
# 1. 端口被占用
# 解决：修改 docker-compose.yml 中的端口映射

# 2. 环境变量错误
# 解决：检查 .env.production 配置

# 3. 数据库初始化失败
# 解决：删除 volume 重新启动
docker-compose down -v
docker-compose up -d
```

---

### 问题 2: Nginx 无法访问

```bash
# 检查 Nginx 配置
docker-compose exec nginx nginx -t

# 查看 Nginx 日志
docker-compose logs nginx

# 重启 Nginx
docker-compose restart nginx
```

---

### 问题 3: 数据库连接失败

**SQLite**:

```bash
# 检查数据库文件
docker-compose exec app ls -la /app/database/

# 修复权限
docker-compose exec app chmod 644 /app/database/*.sqlite
```

**PostgreSQL**:

```bash
# 检查数据库状态
docker-compose --profile postgres exec postgres pg_isready

# 查看连接
docker-compose --profile postgres exec postgres psql -U sales_user -c "\conninfo"
```

---

### 问题 4: 邮件发送失败

```bash
# 检查 Brevo 配置
docker-compose exec app env | grep BREVO

# 测试 API 连接
docker-compose exec app node -e "
const Brevo = require('@getbrevo/brevo');
const api = new Brevo.ApiClient();
api.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
console.log('Brevo API 连接成功');
"
```

---

## 📈 性能优化

### 1. 启用 Redis 缓存

```yaml
# docker-compose.yml 添加:
redis:
  image: redis:alpine
  restart: always
  volumes:
    - redis-data:/data
```

---

### 2. 数据库优化

```sql
-- PostgreSQL 优化
VACUUM ANALYZE;

-- 添加索引
CREATE INDEX CONCURRENTLY idx_leads_email ON leads(email);
CREATE INDEX CONCURRENTLY idx_emails_status ON emails(status);
```

---

### 3. Nginx 优化

```nginx
# 启用缓存
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m;

location / {
    proxy_cache app_cache;
    proxy_cache_valid 200 10m;
}
```

---

## 🎯 生产部署检查清单

部署前确认:

- [ ] `.env.production` 已配置所有必要变量
- [ ] `JWT_SECRET` 已更换为随机值
- [ ] 默认管理员密码已修改
- [ ] 防火墙已配置
- [ ] SSL 证书已安装（如需 HTTPS）
- [ ] 数据库备份策略已设置
- [ ] 日志监控已配置
- [ ] 健康检查已通过

---

## 📞 技术支持

- 📧 邮箱：support@yourcompany.com
- 💬 文档：https://docs.yourcompany.com
- 🐛 问题：https://github.com/your-repo/issues

---

**部署完成，开始使用吧！** 🚀

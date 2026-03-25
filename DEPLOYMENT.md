# 🚀 部署指南

## 📋 部署方案对比

| 平台 | 成本 | 优势 | 适用阶段 |
|------|------|------|----------|
| **Render** | 免费 | 零配置 Docker 部署，自动 HTTPS | MVP 验证（现在） |
| **Railway** | $5+/月 | 更好的日志/监控，简单 | 付费用户增长期 |
| **VPS** | $10+/月 | 完全控制，可自定义 | 企业级（6 个月后） |
| **AWS/GCP** | 按需 | 完整生态，高可用 | 大规模（1 年后） |

---

## 🎯 推荐方案：Render（免费起步）

### 为什么选择 Render

- ✅ **免费额度** - 每月 750 小时（足够开发测试）
- ✅ **零配置** - 连接 GitHub 自动部署
- ✅ **自动 HTTPS** - 免费 SSL 证书
- ✅ **Docker 支持** - 直接用 Dockerfile
- ✅ **数据库** - 内置 PostgreSQL（免费 1GB）

---

## 📝 部署步骤

### 方案 A：Render 一键部署

#### 1. 准备 Render 账号

1. 访问 https://render.com
2. 使用 GitHub 账号登录
3. 创建新 Workspace

#### 2. 创建 Web Service

1. 点击 **New +** → **Web Service**
2. 连接 GitHub 仓库：`Yulan-Q/sales-system`
3. 配置：
   - **Name**: sales-system
   - **Region**: Singapore（最近）
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Dockerfile**: `docker/Dockerfile.backend`

#### 3. 配置环境变量

在 Render Dashboard → **Environment** 添加：

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...（Supabase 连接字符串）
JWT_SECRET=your_super_secret_jwt_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### 4. 部署

点击 **Create Web Service**

Render 会自动：
- 构建 Docker 镜像
- 部署服务
- 分配域名：`sales-system.onrender.com`

#### 5. 部署前端

重复上述步骤，Root Directory 改为 `frontend-react`

---

### 方案 B：Railway 部署

#### 1. 创建 Railway 项目

1. 访问 https://railway.app
2. 使用 GitHub 账号登录
3. 点击 **New Project** → **Deploy from GitHub repo**

#### 2. 配置服务

Railway 会自动识别 `docker-compose.yml` 并部署：
- Frontend（Nginx）
- Backend（Node.js）
- Database（PostgreSQL）

#### 3. 配置环境变量

在 Railway Dashboard → **Variables** 添加环境变量（同上）

---

### 方案 C：Docker 手动部署（VPS）

#### 1. 准备服务器

推荐 VPS：
- **DigitalOcean** - $6/月（1GB RAM）
- **Linode** - $5/月（1GB RAM）
- **Vultr** - $6/月（1GB RAM）

#### 2. 安装 Docker

```bash
# SSH 到服务器
ssh root@your-server-ip

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

#### 3. 部署应用

```bash
# 克隆项目
git clone https://github.com/Yulan-Q/sales-system.git
cd sales-system

# 创建环境变量文件
cp .env.example .env
nano .env  # 编辑配置

# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 4. 配置 Nginx（可选）

如果不用 Docker 的 Nginx，手动配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔒 安全配置

### 1. 防火墙配置

```bash
# UFW（Ubuntu）
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 2. SSL 证书（Let's Encrypt）

```bash
# 安装 Certbot
apt-get update
apt-get install certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

### 3. 数据库安全

```bash
# 只允许内网访问
ufw deny 5432/tcp

# 或使用 SSH 隧道
ssh -L 5432:localhost:5432 user@your-server
```

---

## 📊 监控与日志

### 1. 应用监控

**Render/Railway** 自带监控：
- CPU/内存使用
- 请求量统计
- 错误日志

**VPS 自建监控**：
```bash
# 安装 Prometheus + Grafana
docker run -d -p 9090:9090 prom/prometheus
docker run -d -p 3000:3000 grafana/grafana
```

### 2. 日志管理

```bash
# 查看 Docker 日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 日志轮转（防止磁盘满）
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### 3. 错误追踪

推荐集成：
- **Sentry** - 错误追踪（免费 5000 错误/月）
- **LogRocket** - 会话回放
- **New Relic** - 全栈监控

---

## 🔄 CI/CD 流程

### GitHub Actions 配置

1. **自动测试**
   - 每次 Push 运行测试
   - 失败阻止合并

2. **自动部署**
   - Main 分支 Push 自动部署
   - Pull Request 创建预览环境

3. **手动触发**
   - 生产环境手动确认部署

### 配置 Secrets

在 GitHub → Settings → Secrets and variables → Actions 添加：

```
RENDER_SERVICE_ID=xxx
RENDER_API_KEY=xxx
RAILWAY_TOKEN=xxx
SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## 📈 性能优化

### 1. 数据库连接池

```javascript
// backend/config/database.js
const { Pool } = require('pg')

const pool = new Pool({
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})
```

### 2. 静态资源 CDN

前端构建后上传到 CDN：
- **Cloudflare** - 免费
- **AWS CloudFront** - 按量付费
- **Vercel** - 免费部署前端

### 3. 缓存策略

```nginx
# Nginx 缓存配置
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 🎯 部署检查清单

### 部署前

- [ ] 所有测试通过
- [ ] 环境变量配置完成
- [ ] 数据库迁移脚本准备
- [ ] SSL 证书申请
- [ ] 域名 DNS 配置

### 部署后

- [ ] 健康检查通过
- [ ] API 端点可访问
- [ ] 前端页面正常加载
- [ ] 数据库连接正常
- [ ] 日志正常输出
- [ ] 监控告警配置

### 运维

- [ ] 每日备份确认
- [ ] 磁盘空间监控
- [ ] CPU/内存监控
- [ ] 错误日志审查
- [ ] 性能指标分析

---

## 🆘 故障排查

### 常见问题

**1. 数据库连接失败**
```bash
# 检查连接字符串
echo $DATABASE_URL

# 测试连接
psql $DATABASE_URL -c "SELECT 1"
```

**2. 端口被占用**
```bash
# 查看占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

**3. Docker 容器启动失败**
```bash
# 查看容器日志
docker logs sales-backend

# 进入容器调试
docker exec -it sales-backend sh
```

**4. 内存不足**
```bash
# 查看内存使用
free -h

# 增加 Swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

---

## 📞 支持

- **Render 文档**: https://render.com/docs
- **Railway 文档**: https://docs.railway.app
- **Docker 文档**: https://docs.docker.com
- **Supabase 文档**: https://supabase.com/docs

---

**干就完了！** 💪🔥

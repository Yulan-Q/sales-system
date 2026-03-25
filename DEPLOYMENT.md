# 🚀 企业级 AI 外销系统 - 快速部署指南

## 方式一：Docker 一键部署（推荐）

### 1. 克隆项目

```bash
git clone https://github.com/Yulan-Q/sales-system.git
cd sales-system
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，修改密码和 API Keys
```

### 3. 启动服务

```bash
docker-compose up -d
```

### 4. 访问系统

- **前端**: http://localhost:8080
- **后端 API**: http://localhost:3000
- **数据库管理**: http://localhost:5050

**测试账号**: `admin` / `admin123`

---

## 方式二：本地开发部署

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端（可选，已有 HTML 可直接使用）
cd ../frontend
npm install
```

### 2. 启动服务

```bash
# 终端 1: 启动后端
cd backend
node core-server-v2.4.js

# 终端 2: 启动前端
cd frontend
python3 -m http.server 8080
```

### 3. 访问系统

- **前端**: http://localhost:8080/v2.3-dashboard.html
- **后端 API**: http://localhost:3000

---

## 功能演示页面

| 页面 | 地址 | 功能 |
|------|------|------|
| **数据可视化** | /v2.3-dashboard.html | 6 个图表 + 统计 |
| **高级筛选** | /v2.2-advanced.html | 筛选 + 批量操作 |
| **邮件追踪** | /v2.1-tracking.html | 打开/点击追踪 |
| **线索详情** | /lead-detail.html?id=1 | 完整客户信息 |

---

## Docker 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 删除所有数据（谨慎使用）
docker-compose down -v
```

---

## 数据库备份

```bash
# 备份
docker-compose exec postgres pg_dump -U sales_user sales_db > backup.sql

# 恢复
cat backup.sql | docker-compose exec -T postgres psql -U sales_user sales_db
```

---

## 生产环境配置

### 1. 修改 .env

```bash
JWT_SECRET=生成一个强随机密钥
POSTGRES_PASSWORD=强密码
PGADMIN_PASSWORD=强密码
```

### 2. 配置 HTTPS

使用 Nginx + Let's Encrypt：

```bash
# 安装 certbot
apt-get install certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your-domain.com
```

### 3. 配置域名

编辑 `docker/nginx.conf`，添加：

```nginx
server_name your-domain.com;
```

---

## 故障排查

### 后端无法启动

```bash
# 查看日志
docker-compose logs backend

# 检查端口占用
netstat -tlnp | grep 3000
```

### 前端无法访问

```bash
# 检查 nginx 状态
docker-compose ps nginx

# 查看 nginx 日志
docker-compose logs nginx
```

### 数据库连接失败

```bash
# 测试数据库连接
docker-compose exec postgres psql -U sales_user -d sales_db -c "SELECT 1"
```

---

## 性能优化

### 1. 增加内存限制

编辑 `docker-compose.yml`：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### 2. 启用 Redis 缓存

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## 监控

### 健康检查

```bash
curl http://localhost:3000/api/health
```

### 查看资源使用

```bash
docker stats
```

---

## 安全建议

1. ✅ 修改默认密码
2. ✅ 使用 HTTPS
3. ✅ 配置防火墙
4. ✅ 定期备份数据
5. ✅ 更新 Docker 镜像
6. ✅ 限制数据库访问

---

**干就完了！** 💪🔥

**GitHub**: https://github.com/Yulan-Q/sales-system

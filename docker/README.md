# 🚀 Docker 部署指南

## 快速部署（推荐）

### 1. 克隆项目

```bash
git clone https://github.com/Yulan-Q/sales-system.git
cd sales-system
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入真实配置
```

### 3. 一键启动

```bash
docker-compose up -d
```

### 4. 访问系统

- 前端：http://localhost:8080
- 后端 API: http://localhost:3000
- 数据库：localhost:5432

**测试账号**: `admin` / `admin123`

---

## 目录结构

```
sales-system/
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
├── backend/
├── frontend/
└── README.md
```

---

## 服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| nginx | 8080 | 反向代理 + 静态文件 |
| backend | 3000 | Node.js API 服务 |
| postgres | 5432 | PostgreSQL 数据库 |
| pgadmin | 5050 | 数据库管理界面 |

---

## 环境变量

编辑 `.env` 文件：

```bash
# 后端配置
NODE_ENV=production
PORT=3000
JWT_SECRET=your_super_secret_jwt_key
DATABASE_URL=postgresql://user:password@postgres:5432/sales_db

# API Keys
APIFY_TOKEN=your_apify_token
BREVO_API_KEY=your_brevo_key

# 数据库配置
POSTGRES_USER=sales_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=sales_db
```

---

## Docker 命令

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 进入后端容器
docker-compose exec backend bash

# 进入数据库容器
docker-compose exec postgres psql -U sales_user -d sales_db
```

---

## 数据持久化

数据存储在 Docker volumes：

- `postgres_data` - PostgreSQL 数据
- `backend_logs` - 后端日志

删除容器不会丢失数据，除非执行：
```bash
docker-compose down -v  # 删除 volumes
```

---

## 生产环境部署

### 1. 配置域名

编辑 `docker/nginx.conf`：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://frontend:80;
    }
    
    location /api {
        proxy_pass http://backend:3000;
    }
}
```

### 2. SSL 证书

使用 Let's Encrypt：
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. 备份数据

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U sales_user sales_db > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U sales_user sales_db < backup.sql
```

---

## 故障排查

### 后端启动失败

```bash
# 查看日志
docker-compose logs backend

# 检查配置
docker-compose exec backend cat .env

# 重启服务
docker-compose restart backend
```

### 前端无法访问

```bash
# 检查 nginx 配置
docker-compose exec nginx nginx -t

# 查看 nginx 日志
docker-compose logs nginx
```

### 数据库连接失败

```bash
# 检查数据库是否运行
docker-compose ps postgres

# 测试连接
docker-compose exec postgres psql -U sales_user -d sales_db -c "SELECT 1"
```

---

## 性能优化

### 1. 增加副本数

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
```

### 2. 配置缓存

使用 Redis：
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### 3. 负载均衡

使用 Nginx 反向代理：
```nginx
upstream backend_servers {
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}
```

---

## 监控

### 1. 健康检查

```bash
curl http://localhost:3000/api/health
```

### 2. 日志收集

使用 ELK Stack：
```yaml
services:
  elasticsearch:
    image: elasticsearch:8.7.0
  logstash:
    image: logstash:8.7.0
  kibana:
    image: kibana:8.7.0
```

---

## 安全建议

1. **修改默认密码**
2. **使用 HTTPS**
3. **配置防火墙**
4. **定期更新镜像**
5. **限制容器权限**
6. **启用日志审计**

---

**干就完了！** 💪🔥

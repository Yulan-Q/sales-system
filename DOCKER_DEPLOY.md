# 🐳 Docker 部署指南

## 📋 前提条件

确保已安装：
- ✅ Docker
- ✅ Docker Compose

**检查安装**:
```bash
docker --version
docker-compose --version
```

---

## 🚀 快速部署

### 1. 进入项目目录

```bash
cd /home/admin/openclaw/workspace/delivery/企业级\ AI\ 外销系统
```

### 2. 启动所有服务

```bash
docker-compose up -d
```

### 3. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend
```

### 4. 访问应用

**前端**: http://localhost  
**后端 API**: http://localhost:3000/api/health

**测试账号**: `admin` / `admin123`

---

## 🔧 常用命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 重新构建并启动
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 进入后端容器
docker-compose exec backend sh

# 进入前端容器
docker-compose exec frontend sh

# 查看资源使用
docker stats
```

---

## 📊 服务说明

| 服务 | 容器名 | 端口 | 说明 |
|------|--------|------|------|
| **前端** | sales-frontend | 80 | Nginx + React 应用 |
| **后端** | sales-backend | 3000 | Node.js API 服务 |

---

## 🔐 环境变量配置

创建 `.env` 文件（可选）：

```bash
# JWT 配置
JWT_SECRET=your_super_secret_jwt_key_2026
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 应用配置
NODE_ENV=production
PORT=3000
```

---

## 🐛 故障排查

### 1. 容器启动失败

```bash
# 查看详细日志
docker-compose logs backend

# 检查配置
docker-compose config

# 重新构建
docker-compose build --no-cache
```

### 2. 端口被占用

```bash
# 查看占用端口的进程
lsof -i :80
lsof -i :3000

# 停止占用端口的服务
sudo systemctl stop nginx  # 如果 Nginx 占用 80
```

### 3. 进入容器调试

```bash
# 进入后端容器
docker-compose exec backend sh

# 检查应用
ls -la
cat package.json
```

### 4. 清理所有数据

```bash
# 停止并删除所有容器、网络、卷
docker-compose down -v

# 重新构建
docker-compose up -d --build
```

---

## 📈 性能优化

### 1. 限制资源使用

编辑 `docker-compose.yml`：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### 2. 日志轮转

编辑 `/etc/docker/daemon.json`：

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### 3. 使用生产镜像

```bash
# 多阶段构建，镜像体积从 1GB 降到 200MB
docker-compose build --no-cache
```

---

## 🎯 生产部署

### 1. 使用 Docker Swarm

```bash
# 初始化 Swarm
docker swarm init

# 部署服务
docker stack deploy -c docker-compose.yml sales-system
```

### 2. 使用 Kubernetes

```bash
# 转换为 K8s 配置
kompose convert

# 部署到 K8s
kubectl apply -f .
```

### 3. 部署到云平台

- **AWS ECS** - 弹性容器服务
- **Google Cloud Run** - 无服务器容器
- **Azure Container Instances** - 简单容器部署
- **DigitalOcean App Platform** - 一键部署

---

## 📝 注意事项

1. **数据安全**: 生产环境使用外部数据库（PostgreSQL/MySQL）
2. **备份**: 定期备份数据卷
3. **监控**: 集成 Prometheus + Grafana
4. **日志**: 使用 ELK Stack 集中管理
5. **更新**: 使用 CI/CD 自动部署

---

## 🆘 常见问题

**Q: 镜像构建太慢？**  
A: 使用国内镜像源，编辑 `/etc/docker/daemon.json`：
```json
{
  "registry-mirrors": [
    "https://registry.docker-cn.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
```

**Q: 容器无法访问外网？**  
A: 检查 Docker 网络配置：
```bash
docker network inspect sales-network
```

**Q: 如何更新代码？**  
A: 
```bash
git pull
docker-compose up -d --build
```

---

## 🎉 完成！

现在你的应用已经容器化，可以在任何有 Docker 的地方运行！

**访问**: http://localhost

**干就完了！** 💪🔥

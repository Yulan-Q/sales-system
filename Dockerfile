# 多阶段构建 - 生产镜像

# ============================================
# 阶段 1: 构建前端
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制 package.json
COPY frontend/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制前端代码
COPY frontend/ ./

# 构建前端
RUN npm run build

# ============================================
# 阶段 2: 后端 + 前端静态文件
# ============================================
FROM node:20-alpine

WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache python3 make g++

# 复制后端 package.json
COPY backend/package*.json ./

# 安装后端依赖
RUN npm ci --only=production && npm cache clean --force

# 复制后端代码
COPY backend/src/ ./backend/src/

# 复制数据库 schema
COPY database-schema.sql ./

# 复制脚本
COPY scripts/ ./scripts/

# 从构建阶段复制前端构建产物
COPY --from=frontend-builder /app/frontend/dist ./public

# 创建数据目录
RUN mkdir -p /app/database /app/logs /app/uploads

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/database/prod.sqlite
ENV LOG_FILE=/app/logs/app.log

# 启动应用
CMD ["node", "backend/src/index.js"]

#!/bin/bash

echo "🚀 企业级 AI 外销系统 - 一键启动脚本"
echo "======================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

echo "✅ Node.js 版本：$(node -v)"

# 停止旧服务
echo "⏹️  停止旧服务..."
pkill -f "node core-server" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "http.server" 2>/dev/null
sleep 2

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend-react
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
fi
cd ..

# 启动后端
echo "🚀 启动后端服务..."
cd backend
nohup node core-server-v5.0.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "✅ 后端已启动 (PID: $BACKEND_PID)"

# 启动前端
echo "🚀 启动前端服务..."
cd frontend-react
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "✅ 前端已启动 (PID: $FRONTEND_PID)"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "======================================"
echo "📊 服务状态"
echo "======================================"

if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ 后端 API: http://localhost:3000"
else
    echo "❌ 后端 API 启动失败"
fi

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ 前端应用：http://localhost:3001"
else
    echo "❌ 前端应用启动失败"
fi

echo ""
echo "======================================"
echo "🎯 访问地址"
echo "======================================"
echo "📱 前端：http://localhost:3001"
echo "🔌 后端：http://localhost:3000/api/health"
echo ""
echo "📝 测试账号："
echo "   用户名：admin"
echo "   密码：admin123"
echo ""
echo "======================================"
echo "📝 日志文件"
echo "======================================"
echo "后端日志：logs/backend.log"
echo "前端日志：logs/frontend.log"
echo ""
echo "🛑 停止服务：pkill -f 'node core-server' && pkill -f vite"
echo "======================================"
echo ""
echo "✨ 部署完成！请在浏览器访问 http://localhost:3001"
echo ""

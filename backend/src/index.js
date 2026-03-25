/**
 * Cross-Border Sales Agent - 后端入口文件
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { initDatabase } = require('./config/database');
const routes = require('./routes');
const { logger } = require('./utils/logger');
const { startEmailScheduler } = require('./services/brevoService');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

const PORT = process.env.PORT || 3000;

// ============================================
// 中间件
// ============================================

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// JSON 解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ============================================
// WebSocket 连接管理
// ============================================

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  logger.info('WebSocket client connected');

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('close', () => {
    clients.delete(ws);
    logger.info('WebSocket client disconnected');
  });
});

// 心跳检测
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, process.env.WS_HEARTBEAT_INTERVAL || 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// 全局广播函数
global.broadcastToClients = (data) => {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// ============================================
// 路由
// ============================================

app.use('/api/v1', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// 错误处理
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Internal server error'
    }
  });
});

// ============================================
// 启动服务器
// ============================================

async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();
    logger.info('Database initialized');

    // 启动邮件调度器
    await startEmailScheduler();
    logger.info('Email scheduler started');

    // 启动服务器
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API: http://localhost:${PORT}/api/v1`);
      logger.info(`WebSocket: ws://localhost:${PORT}/ws`);
      logger.info(`Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();

module.exports = { app, server, wss };

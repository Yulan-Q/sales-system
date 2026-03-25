/**
 * 认证中间件
 */

const jwt = require('jsonwebtoken');
const Database = require('../config/database');

const db = new Database();

function authMiddleware(req, res, next) {
  try {
    // 从 Header 获取 token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header required'
        }
      });
    }

    const token = authHeader.split(' ')[1];

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查询用户
    const user = db.prepare(`
      SELECT u.id, u.email, u.name, u.role, u.company_id, c.name as company_name
      FROM users u
      JOIN companies c ON u.company_id = c.id
      WHERE u.id = ?
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found'
        }
      });
    }

    // 附加用户信息到 request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company_id: user.company_id,
      company_name: user.company_name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token expired'
        }
      });
    }

    next(error);
  }
}

module.exports = authMiddleware;

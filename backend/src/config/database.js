/**
 * 数据库配置
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');

let db = null;

/**
 * 初始化数据库
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    try {
      const dbPath = process.env.DATABASE_PATH || './database/dev.sqlite';
      
      // 确保目录存在
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      db = new Database(dbPath);
      
      // 启用外键
      db.pragma('foreign_keys = ON');
      
      // 读取并执行 schema
      const schemaPath = path.join(__dirname, '../../database-schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema);
        logger.info('Database schema loaded');
      }

      resolve(db);
    } catch (error) {
      logger.error('Database initialization failed:', error);
      reject(error);
    }
  });
}

/**
 * 获取数据库实例
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

module.exports = {
  initDatabase,
  getDatabase,
  __esModule: true,
  default: getDatabase
};

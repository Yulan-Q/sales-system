#!/usr/bin/env node

/**
 * 交互式配置向导
 * 运行：node scripts/setup.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const questions = [
  {
    key: 'APIFY_TOKEN',
    question: '请输入 Apify Token（https://console.apify.com/account#/integrations）',
    validate: (val) => val.length > 10,
    hint: '格式类似：apify_api_...'
  },
  {
    key: 'BREVO_API_KEY',
    question: '请输入 Brevo API Key（https://app.brevo.com/settings/keys/api）',
    validate: (val) => val.length > 10,
    hint: '格式类似：xkey-...'
  },
  {
    key: 'COMPANY_NAME',
    question: '您的公司名称',
    validate: (val) => val.length > 0,
    default: 'My Company'
  },
  {
    key: 'TARGET_PRODUCTS',
    question: '主营产品（逗号分隔）',
    validate: (val) => val.length > 0,
    default: 'LED Lights, Electronics'
  },
  {
    key: 'TARGET_COUNTRIES',
    question: '目标市场（逗号分隔）',
    validate: (val) => val.length > 0,
    default: 'United States, United Kingdom, Germany'
  }
];

const config = {};

console.log('\n🚀 Cross-Border Sales Agent - 配置向导\n');
console.log('这将帮助您快速配置系统，大约需要 2 分钟\n');

function askQuestion(index) {
  if (index >= questions.length) {
    // 生成 JWT Secret
    config.JWT_SECRET = crypto.randomBytes(32).toString('hex');
    config.PORT = '3000';
    config.NODE_ENV = 'development';
    config.DATABASE_PATH = './database/dev.sqlite';
    
    // 写入 .env 文件
    const envContent = Object.entries(config)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const envPath = path.join(__dirname, '..', '.env');
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ 配置完成！\n');
    console.log('📁 配置文件已保存到：.env\n');
    console.log('🎯 接下来请执行以下步骤：\n');
    console.log('   1. 安装依赖：npm install');
    console.log('   2. 启动服务：npm run dev');
    console.log('   3. 访问系统：http://localhost:5173\n');
    
    // 创建初始数据库
    createInitialData();
    
    rl.close();
    return;
  }
  
  const q = questions[index];
  
  rl.question(`${q.question}${q.default ? ` [${q.default}]` : ''}: `, (answer) => {
    const value = answer.trim() || q.default || '';
    
    if (q.validate && !q.validate(value)) {
      console.log(`❌ 输入无效，${q.hint || '请重新输入'}\n`);
      return askQuestion(index);
    }
    
    config[q.key] = value;
    console.log(`✅ ${q.key} 已配置\n`);
    askQuestion(index + 1);
  });
}

function createInitialData() {
  // 创建演示数据脚本
  const scriptPath = path.join(__dirname, 'create-demo-data.js');
  const script = `
const Database = require('../backend/src/config/database');
const bcrypt = require('bcryptjs');

async function createDemoData() {
  await Database.initDatabase();
  const db = Database.getDatabase();
  
  // 创建演示公司
  const company = db.prepare(\`
    INSERT INTO companies (name, api_key, products, target_countries)
    VALUES (?, ?, ?, ?)
  \`).run(
    '${config.COMPANY_NAME}',
    'demo_' + Date.now(),
    JSON.stringify(['${config.TARGET_PRODUCTS.replace(/,\s*/g, "','")}']),
    JSON.stringify(['${config.TARGET_COUNTRIES.replace(/,\s*/g, "','")}'])
  );
  
  // 创建管理员账号
  const passwordHash = bcrypt.hashSync('123456', 10);
  db.prepare(\`
    INSERT INTO users (company_id, email, password_hash, name, role)
    VALUES (?, 'admin@demo.com', ?, '管理员', 'admin')
  \`).run(company.lastInsertRowid, passwordHash);
  
  console.log('\\n✅ 演示数据已创建：');
  console.log('   登录邮箱：admin@demo.com');
  console.log('   登录密码：123456\\n');
}

createDemoData().catch(console.error);
`;
  
  fs.writeFileSync(scriptPath, script);
  console.log('📝 创建演示数据脚本...');
  
  // 执行脚本
  const { execSync } = require('child_process');
  try {
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️ 演示数据创建失败，可稍后手动创建');
  }
}

askQuestion(0);

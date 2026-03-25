# Cross-Border Sales Agent v1.0 - 配置文件

---

## 📋 Agent 概述

**名称**: Cross-Border Sales Agent  
**版本**: 1.0  
**用途**: 自动挖掘跨境贸易潜在客户并发送个性化开发信  
**目标行业**: 外贸公司/工厂/跨境 SOHO  

---

## 🔧 技术配置

### 依赖技能

```json
{
  "lead_generation": "apify-lead-generation",
  "email_automation": "brevo-automation", 
  "content_writing": "content-research-writer",
  "mcp_builder": "mcp-builder",
  "connect_apps": "connect-apps",
  "agent_orchestration": "agent-orchestrator"
}
```

### API 配置

#### 1. Apify (线索挖掘)

```bash
# 获取 Token: https://console.apify.com/account#/integrations
APIFY_TOKEN=your_token_here
```

**推荐 Actor**:
- `compass/crawler-google-places` - Google Maps 商家搜索
- `apify/google-search-scraper` - Google 搜索结果
- `apify/facebook-page-contact-information` - Facebook 企业联系信息
- `vdrmota/contact-info-scraper` - 从网站提取联系信息

#### 2. Brevo (邮件发送)

```bash
# 获取 API Key: https://app.brevo.com/settings/keys/api
BREVO_API_KEY=your_api_key_here
```

**免费额度**: 每天 300 封邮件  
**付费计划**: $25/月起，5000 封/月

#### 3. Composio (应用连接)

```bash
# 获取 API Key: https://platform.composio.dev
COMPOSIO_API_KEY=your_api_key_here
```

---

## 🤖 Agent 工作流

### 工作流 1: 线索挖掘

```
输入: 产品关键词 + 目标市场
       ↓
[Apify Google Maps Scraper]
       ↓
提取：公司名/网站/电话/地址
       ↓
[Contact Info Scraper]
       ↓
提取：邮箱/联系人/职位
       ↓
[数据验证]
       ↓
输出：CSV/JSON 格式线索列表
```

**配置参数**:
```json
{
  "keywords": ["LED light", "LED lighting"],
  "target_countries": ["United States", "United Kingdom", "Germany"],
  "min_results": 100,
  "max_results": 500,
  "output_format": "csv",
  "include_fields": ["company_name", "website", "email", "phone", "contact_person", "address"]
}
```

---

### 工作流 2: 开发信生成

```
输入: 客户线索 (公司名/网站/联系人)
       ↓
[分析客户网站]
       ↓
提取：主营产品/公司规模/目标市场
       ↓
[匹配我方产品]
       ↓
生成：个性化开场白 + 价值主张
       ↓
[AI 撰写邮件]
       ↓
输出：个性化开发信 (多版本 A/B 测试)
```

**配置参数**:
```json
{
  "my_company": {
    "name": "Your Company Name",
    "products": ["LED Strip Lights", "LED Panel Lights", "LED Bulbs"],
    "advantages": ["10 years experience", "CE/RoHS certified", "Free samples"],
    "moq": "100 pieces",
    "lead_time": "7-15 days"
  },
  "email_type": "initial_contact",
  "tone": "professional_friendly",
  "language": "english",
  "generate_versions": 3
}
```

**邮件模板结构**:
```markdown
Subject: [个性化主题，包含客户公司名或产品]

Dear [联系人姓名],

[开场白 - 提到客户公司或产品]

[我们是谁 - 1 句话]

[我们能提供什么价值 - 2-3 个要点]

[行动号召 - 询问需求/提供样品/安排通话]

Best regards,
[你的名字]
[公司名]
[联系方式]
```

---

### 工作流 3: 邮件发送 + 追踪

```
输入: 开发信 + 客户邮箱列表
       ↓
[Brevo 邮件发送]
       ↓
记录：发送时间/邮件 ID
       ↓
[追踪打开/点击]
       ↓
分类：已打开/已点击/已回复/无反应
       ↓
[更新 CRM 状态]
       ↓
输出：发送报告 + 高意向客户列表
```

**配置参数**:
```json
{
  "daily_limit": 300,
  "send_time": "09:00-17:00",
  "timezone": "target_country_timezone",
  "track_opens": true,
  "track_clicks": true,
  "follow_up_sequence": [
    {"day": 3, "template": "follow_up_1"},
    {"day": 7, "template": "follow_up_2"},
    {"day": 14, "template": "follow_up_3"}
  ]
}
```

---

### 工作流 4: 客户管理

```
输入: 客户互动数据
       ↓
[更新 CRM 记录]
       ↓
状态流转：
  新增线索 → 已联系 → 已回复 → 报价中 → 样品 → 成交
       ↓
[生成销售报告]
       ↓
输出：销售漏斗 + 业绩统计
```

**CRM 字段**:
```json
{
  "company_name": "",
  "website": "",
  "contact_person": "",
  "email": "",
  "phone": "",
  "country": "",
  "source": "",
  "status": "new|contacted|replied|quoting|sample|closed|lost",
  "emails_sent": 0,
  "emails_opened": 0,
  "emails_clicked": 0,
  "last_contact_date": "",
  "next_follow_up": "",
  "notes": "",
  "created_at": "",
  "updated_at": ""
}
```

---

## 📁 目录结构

```
cross-border-agent/
├── config/
│   ├── agent-config.json        # Agent 主配置
│   ├── apify-config.json        # Apify 配置
│   ├── brevo-config.json        # Brevo 配置
│   └── crm-fields.json          # CRM 字段定义
├── workflows/
│   ├── 01-lead-generation.js    # 线索挖掘工作流
│   ├── 02-email-generation.js   # 开发信生成工作流
│   ├── 03-email-sending.js      # 邮件发送工作流
│   └── 04-crm-update.js         # CRM 更新工作流
├── templates/
│   ├── email-initial.md         # 初次联系模板
│   ├── email-followup-1.md      # 第 1 次跟进
│   ├── email-followup-2.md      # 第 2 次跟进
│   ├── email-followup-3.md      # 第 3 次跟进
│   ├── email-quotation.md       # 报价邀请
│   └── email-sample.md          # 样品邀请
├── scripts/
│   ├── setup.sh                 # 初始化脚本
│   ├── run-lead-search.js       # 执行线索搜索
│   ├── run-email-campaign.js    # 执行邮件活动
│   └── export-data.js           # 导出数据
└── docs/
    ├── setup-guide.md           # 部署指南
    ├── user-manual.md           # 用户手册
    └── api-reference.md         # API 文档
```

---

## 🚀 部署步骤

### Step 1: 环境准备

```bash
# 创建项目目录
mkdir -p ~/cross-border-agent
cd ~/cross-border-agent

# 创建配置文件目录
mkdir -p config workflows templates scripts docs
```

### Step 2: 获取 API Key

```bash
# Apify
# 访问：https://console.apify.com/account#/integrations
# 复制 API Token

# Brevo
# 访问：https://app.brevo.com/settings/keys/api
# 创建新 API Key

# 保存到.env 文件
cat > .env << EOF
APIFY_TOKEN=your_apify_token
BREVO_API_KEY=your_brevo_key
COMPOSIO_API_KEY=your_composio_key
EOF
```

### Step 3: 安装依赖

```bash
# 安装 Node.js (如未安装)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MCP CLI
npm install -g @apify/mcpc

# 安装 Composio CLI
pip install composio-core
# 或
npm install -g composio-cli
```

### Step 4: 配置工作流

将上方工作流配置保存到对应文件：
- `workflows/01-lead-generation.js`
- `workflows/02-email-generation.js`
- `workflows/03-email-sending.js`
- `workflows/04-crm-update.js`

### Step 5: 测试运行

```bash
# 测试线索挖掘
node scripts/run-lead-search.js --keyword "LED light" --country "United States" --limit 10

# 测试邮件发送
node scripts/run-email-campaign.js --campaign test --limit 5
```

### Step 6: 交付客户

```bash
# 为客户创建独立配置
cp -r ~/cross-border-agent ~/clients/client-abc

# 修改客户专属配置
vi ~/clients/client-abc/config/agent-config.json

# 客户培训
# 1. 演示系统功能
# 2. 指导首次使用
# 3. 提供使用文档
```

---

## 📊 监控指标

### 日常监控

| 指标 | 目标值 | 告警阈值 |
|------|--------|----------|
| 线索挖掘数量 | 500+/天 | <100/天 |
| 邮件发送成功 | >95% | <90% |
| 邮件打开率 | >30% | <15% |
| 邮件回复率 | >5% | <2% |
| 系统运行时间 | >99% | <95% |

### 周报指标

| 指标 | 计算方式 | 目标 |
|------|----------|------|
| 新增线索数 | 周新增线索总量 | 2500+ |
| 有效线索数 | 有邮箱电话的线索 | >80% |
| 发送邮件数 | 周发送总量 | 1500+ |
| 客户回复数 | 收到回复的邮件 | 75+ |
| 高意向客户 | 打开 + 点击 + 回复 | 30+ |

---

## 🔒 安全配置

### 数据加密

```json
{
  "encryption": {
    "algorithm": "AES-256-GCM",
    "key_rotation": "monthly",
    "backup_encryption": true
  }
}
```

### 访问控制

```json
{
  "access_control": {
    "admin_users": ["owner@company.com"],
    "sales_users": ["sales1@company.com", "sales2@company.com"],
    "permissions": {
      "admin": ["all"],
      "sales": ["view_leads", "send_emails", "update_crm"]
    }
  }
}
```

### 日志审计

```json
{
  "audit_log": {
    "enabled": true,
    "retention_days": 90,
    "log_events": [
      "user_login",
      "lead_export",
      "email_send",
      "crm_update",
      "config_change"
    ]
  }
}
```

---

## 📞 技术支持

### 问题排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 线索数量为 0 | API Key 无效/关键词太窄 | 检查 API Key/换关键词 |
| 邮件发送失败 | Brevo 余额不足/域名未验证 | 充值/验证域名 |
| 邮件进垃圾箱 | 发送频率太高/内容问题 | 降低频率/优化内容 |
| CRM 不更新 | 工作流配置错误 | 检查工作流日志 |

### 联系方式

- 技术支持邮箱：support@yourcompany.com
- 技术支持微信：your_wechat
- 响应时间：工作日 2 小时内

---

**版本**: 1.0  
**更新日期**: 2026-03-24  
**下次更新**: 根据客户反馈迭代

-- PostgreSQL 初始化脚本
-- 当使用 PostgreSQL profile 时自动执行

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建公司表
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    apify_token VARCHAR(255),
    brevo_api_key VARCHAR(255),
    products JSONB,
    target_countries JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'sales',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, email)
);

-- 创建线索表
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    company_name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    industry VARCHAR(100),
    contact_name VARCHAR(100),
    contact_title VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    facebook_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    instagram_url VARCHAR(255),
    source VARCHAR(50),
    source_url TEXT,
    apify_run_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'new',
    priority VARCHAR(10) DEFAULT 'normal',
    tags JSONB,
    assigned_to INTEGER REFERENCES users(id),
    last_contact_date TIMESTAMP,
    next_follow_up DATE,
    notes TEXT,
    custom_fields JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_leads_company ON leads(company_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_country ON leads(country);
CREATE INDEX idx_leads_created ON leads(created_at);

-- 创建邮件表
CREATE TABLE IF NOT EXISTS emails (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    template_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft',
    brevo_message_id VARCHAR(100),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_count INTEGER DEFAULT 0,
    first_opened_at TIMESTAMP,
    last_opened_at TIMESTAMP,
    clicked_count INTEGER DEFAULT 0,
    first_clicked_at TIMESTAMP,
    last_clicked_at TIMESTAMP,
    replied_at TIMESTAMP,
    tracked_links JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emails_lead ON emails(lead_id);
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_sent ON emails(sent_at);

-- 创建邮件模板表
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_templates_type ON email_templates(type);

-- 创建营销活动表
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id INTEGER REFERENCES email_templates(id),
    target_segment JSONB,
    scheduled_at TIMESTAMP,
    daily_limit INTEGER DEFAULT 300,
    timezone VARCHAR(50) DEFAULT 'UTC',
    status VARCHAR(20) DEFAULT 'draft',
    total_leads INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled ON campaigns(scheduled_at);

-- 创建活动 - 线索关联表
CREATE TABLE IF NOT EXISTS campaign_leads (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    status VARCHAR(20) DEFAULT 'pending',
    email_id INTEGER REFERENCES emails(id),
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, lead_id)
);

-- 创建系统配置表
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, setting_key)
);

-- 创建操作日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- 创建数据统计表
CREATE TABLE IF NOT EXISTS stats_daily (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    date DATE NOT NULL,
    new_leads INTEGER DEFAULT 0,
    contacted_leads INTEGER DEFAULT 0,
    replied_leads INTEGER DEFAULT 0,
    closed_leads INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, date)
);

CREATE INDEX idx_stats_daily_date ON stats_daily(date);

-- 插入系统邮件模板
INSERT INTO email_templates (company_id, name, type, subject, body, variables, is_system) VALUES
(1, '初次联系', 'initial', 'Partnership Opportunity with {{company_name}}', 
'Dear {{contact_name}},

I noticed that {{company_name}} specializes in {{customer_product}}, and I''m impressed by your {{customer_highlight}}.

We are {{my_company_name}}, a professional manufacturer of {{my_product}} with {{my_experience}} years of experience.

Would you be interested in seeing our latest catalog?

Best regards,
{{my_name}}', 
'["company_name", "contact_name", "customer_product", "my_company_name", "my_name"]', TRUE);

-- 创建演示公司（仅开发环境）
-- INSERT INTO companies (name, api_key, products, target_countries) 
-- VALUES ('Demo Company', 'demo_key_123', '["Product A", "Product B"]', '["United States"]');

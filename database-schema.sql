-- Cross-Border Sales Agent 数据库表结构
-- 支持：SQLite / PostgreSQL

-- ============================================
-- 1. 公司配置表（多租户支持）
-- ============================================
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,  -- 用于 API 认证
    apify_token VARCHAR(255),
    brevo_api_key VARCHAR(255),
    products TEXT,  -- JSON 数组，主营产品
    target_countries TEXT,  -- JSON 数组，目标市场
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 用户表
-- ============================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'sales',  -- admin, sales, viewer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- ============================================
-- 3. 线索表
-- ============================================
CREATE TABLE leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    
    -- 公司信息
    company_name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    industry VARCHAR(100),
    
    -- 联系信息
    contact_name VARCHAR(100),
    contact_title VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    
    -- 社交媒体
    facebook_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    instagram_url VARCHAR(255),
    
    -- 线索来源
    source VARCHAR(50),  -- google_maps, google_search, facebook, instagram
    source_url TEXT,
    apify_run_id VARCHAR(100),
    
    -- 线索状态
    status VARCHAR(20) DEFAULT 'new',  -- new, contacted, replied, quoting, sample, closed, lost
    priority VARCHAR(10) DEFAULT 'normal',  -- low, normal, high, urgent
    tags TEXT,  -- JSON 数组
    
    -- 跟进信息
    assigned_to INTEGER,  -- 负责的销售 ID
    last_contact_date TIMESTAMP,
    next_follow_up DATE,
    
    -- 元数据
    notes TEXT,
    custom_fields TEXT,  -- JSON，自定义字段
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    
    -- 索引优化
    INDEX idx_company_status (company_id, status),
    INDEX idx_email (email),
    INDEX idx_country (country),
    INDEX idx_created (created_at)
);

-- ============================================
-- 4. 邮件表
-- ============================================
CREATE TABLE emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    lead_id INTEGER NOT NULL,
    
    -- 邮件内容
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    template_name VARCHAR(100),  -- 使用的模板名
    
    -- 发送信息
    status VARCHAR(20) DEFAULT 'draft',  -- draft, sent, delivered, opened, clicked, replied, bounced
    brevo_message_id VARCHAR(100),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    
    -- 追踪数据
    opened_count INTEGER DEFAULT 0,
    first_opened_at TIMESTAMP,
    last_opened_at TIMESTAMP,
    clicked_count INTEGER DEFAULT 0,
    first_clicked_at TIMESTAMP,
    last_clicked_at TIMESTAMP,
    replied_at TIMESTAMP,
    
    -- 链接追踪
    tracked_links TEXT,  -- JSON 数组，{url, clicks, last_clicked}
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    
    INDEX idx_lead (lead_id),
    INDEX idx_status (status),
    INDEX idx_sent (sent_at)
);

-- ============================================
-- 5. 邮件模板表
-- ============================================
CREATE TABLE email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),  -- initial, follow_up_1, follow_up_2, quotation, sample, etc.
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    
    -- 变量定义（用于 AI 生成）
    variables TEXT,  -- JSON 数组，["company_name", "contact_name", "product"]
    
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,  -- 系统模板不可删除
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id),
    
    INDEX idx_type (type)
);

-- ============================================
-- 6. 营销活动表
-- ============================================
CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- 活动配置
    template_id INTEGER,
    target_segment TEXT,  -- JSON，目标客户筛选条件
    
    -- 发送配置
    scheduled_at TIMESTAMP,
    daily_limit INTEGER DEFAULT 300,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- 活动状态
    status VARCHAR(20) DEFAULT 'draft',  -- draft, scheduled, running, paused, completed, cancelled
    
    -- 统计数据
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (template_id) REFERENCES email_templates(id),
    
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_at)
);

-- ============================================
-- 7. 活动 - 线索关联表
-- ============================================
CREATE TABLE campaign_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    lead_id INTEGER NOT NULL,
    
    status VARCHAR(20) DEFAULT 'pending',  -- pending, sent, skipped, failed
    email_id INTEGER,
    sent_at TIMESTAMP,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (email_id) REFERENCES emails(id),
    
    UNIQUE(campaign_id, lead_id)
);

-- ============================================
-- 8. 系统配置表
-- ============================================
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,  -- JSON 或字符串
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id),
    
    UNIQUE(company_id, setting_key)
);

-- ============================================
-- 9. 操作日志表
-- ============================================
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    user_id INTEGER,
    
    action VARCHAR(100) NOT NULL,  -- lead_created, email_sent, campaign_started, etc.
    resource_type VARCHAR(50),  -- lead, email, campaign, user
    resource_id INTEGER,
    
    old_value TEXT,  -- JSON，修改前的值
    new_value TEXT,  -- JSON，修改后的值
    
    ip_address VARCHAR(50),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    INDEX idx_created (created_at),
    INDEX idx_action (action)
);

-- ============================================
-- 10. 数据统计表（预聚合，加速查询）
-- ============================================
CREATE TABLE stats_daily (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    
    date DATE NOT NULL,
    
    -- 线索统计
    new_leads INTEGER DEFAULT 0,
    contacted_leads INTEGER DEFAULT 0,
    replied_leads INTEGER DEFAULT 0,
    closed_leads INTEGER DEFAULT 0,
    
    -- 邮件统计
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id),
    
    UNIQUE(company_id, date),
    INDEX idx_date (date)
);

-- ============================================
-- 初始数据
-- ============================================

-- 系统邮件模板（所有公司可用）
INSERT INTO email_templates (company_id, name, type, subject, body, variables, is_system) VALUES
(1, '初次联系', 'initial', 
 'Partnership Opportunity with {{company_name}}',
 'Dear {{contact_name}},

I noticed that {{company_name}} specializes in {{customer_product}}, and I''m impressed by your {{customer_highlight}}.

We are {{my_company_name}}, a professional manufacturer of {{my_product}} with {{my_experience}} years of experience. Our main advantages include:

• {{my_advantage_1}}
• {{my_advantage_2}}
• {{my_advantage_3}}

We''ve been helping companies like yours {{my_value_proposition}}.

Would you be interested in seeing our latest catalog? I''d be happy to send you some free samples for evaluation.

Looking forward to your reply.

Best regards,
{{my_name}}
{{my_position}}
{{my_company_name}}
{{my_website}}
{{my_whatsapp}}',
 '["company_name", "contact_name", "customer_product", "customer_highlight", "my_company_name", "my_product", "my_experience", "my_advantage_1", "my_advantage_2", "my_advantage_3", "my_value_proposition", "my_name", "my_position", "my_website", "my_whatsapp"]',
 TRUE),

(1, '第一次跟进', 'follow_up_1',
 'Re: Partnership Opportunity',
 'Dear {{contact_name}},

I hope this email finds you well.

I''m writing to follow up on my previous email regarding {{my_product}} partnership opportunity.

I understand you''re busy, but I believe our products could bring significant value to {{company_name}}:

• Competitive pricing: {{my_price_advantage}}
• Fast delivery: {{my_delivery_time}}
• Quality assurance: {{my_certification}}

Would you have 10 minutes for a quick call this week to discuss further?

Best regards,
{{my_name}}',
 '["contact_name", "my_product", "company_name", "my_price_advantage", "my_delivery_time", "my_certification", "my_name"]',
 TRUE),

(1, '第二次跟进', 'follow_up_2',
 'Quick question about {{company_name}}',
 'Hi {{contact_name}},

Just wanted to quickly check if you received my previous emails.

We''re currently offering {{special_offer}} for new partners this month.

If you''re interested, I can send you:
✓ Free samples
✓ Detailed quotation
✓ Product catalog

Just let me know what works best for you.

Best regards,
{{my_name}}',
 '["contact_name", "special_offer", "my_name"]',
 TRUE),

(1, '报价邀请', 'quotation',
 'Quotation for {{product_name}}',
 'Dear {{contact_name}},

Thank you for your interest in our products.

As requested, please find attached our quotation for {{product_name}}.

Key details:
• Product: {{product_name}}
• MOQ: {{moq}}
• Unit Price: {{unit_price}}
• Lead Time: {{lead_time}}
• Payment Terms: {{payment_terms}}

This quotation is valid for {{validity_days}} days.

If you have any questions or need samples, please don''t hesitate to contact me.

Best regards,
{{my_name}}',
 '["contact_name", "product_name", "moq", "unit_price", "lead_time", "payment_terms", "validity_days", "my_name"]',
 TRUE),

(1, '样品邀请', 'sample',
 'Free Samples for {{company_name}}',
 'Dear {{contact_name}},

Great news! We''d like to send you some free samples of our {{product_name}} for evaluation.

To arrange the shipment, could you please provide:

1. Delivery address
2. Contact person
3. Phone number

We''ll cover the sample cost, and you just need to pay for the shipping.

Looking forward to your reply.

Best regards,
{{my_name}}',
 '["contact_name", "product_name", "my_name"]',
 TRUE);

-- ============================================
-- 视图：销售漏斗统计
-- ============================================
CREATE VIEW sales_funnel AS
SELECT 
    company_id,
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY company_id), 2) as percentage
FROM leads
GROUP BY company_id, status;

-- ============================================
-- 视图：邮件效果统计
-- ============================================
CREATE VIEW email_stats AS
SELECT 
    e.company_id,
    COUNT(*) as total_sent,
    SUM(CASE WHEN e.status IN ('delivered', 'opened', 'clicked', 'replied') THEN 1 ELSE 0 END) as delivered,
    SUM(CASE WHEN e.opened_count > 0 THEN 1 ELSE 0 END) as opened,
    SUM(CASE WHEN e.clicked_count > 0 THEN 1 ELSE 0 END) as clicked,
    SUM(CASE WHEN e.replied_at IS NOT NULL THEN 1 ELSE 0 END) as replied,
    ROUND(AVG(e.opened_count), 2) as avg_opens,
    ROUND(AVG(e.clicked_count), 2) as avg_clicks
FROM emails e
WHERE e.status != 'draft'
GROUP BY e.company_id;

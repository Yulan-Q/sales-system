# API 接口文档

**Base URL**: `http://localhost:3000/api/v1`

**认证方式**: Header 中携带 `X-API-Key: your_api_key`

---

## 🔐 认证相关

### 1. 登录
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "password123"
}

# Response 200
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "email": "user@company.com",
      "name": "John Doe",
      "role": "admin"
    }
  }
}
```

### 2. 获取当前用户
```http
GET /auth/me
Authorization: Bearer {token}

# Response 200
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@company.com",
    "name": "John Doe",
    "role": "admin",
    "company": {
      "id": 1,
      "name": "ABC Trading"
    }
  }
}
```

---

## 📊 仪表盘

### 1. 获取仪表盘数据
```http
GET /dashboard
Authorization: Bearer {token}

# Query Parameters
?period=7d  # 7d, 30d, 90d, 1y

# Response 200
{
  "success": true,
  "data": {
    "leads": {
      "total": 1250,
      "new": 150,
      "contacted": 800,
      "replied": 200,
      "closed": 100
    },
    "emails": {
      "total_sent": 3500,
      "delivered": 3400,
      "opened": 1200,
      "clicked": 400,
      "replied": 150,
      "open_rate": 35.3,
      "click_rate": 11.8,
      "reply_rate": 4.4
    },
    "chart": {
      "leads_daily": [
        {"date": "2026-03-18", "count": 45},
        {"date": "2026-03-19", "count": 52},
        ...
      ],
      "emails_daily": [
        {"date": "2026-03-18", "sent": 120, "opened": 45, "clicked": 15},
        ...
      ]
    }
  }
}
```

---

## 🎯 线索管理

### 1. 搜索线索（Apify）
```http
POST /leads/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "keywords": ["LED light", "LED lighting"],
  "countries": ["United States", "United Kingdom"],
  "sources": ["google_maps", "google_search"],
  "limit": 100
}

# Response 202 (异步任务)
{
  "success": true,
  "data": {
    "job_id": "apify_run_123",
    "status": "running",
    "estimated_time": 30
  }
}

# WebSocket 推送进度
{
  "type": "lead_search_progress",
  "data": {
    "job_id": "apify_run_123",
    "progress": 45,
    "found": 67
  }
}

# 完成后推送
{
  "type": "lead_search_completed",
  "data": {
    "job_id": "apify_run_123",
    "total": 87,
    "imported": 87
  }
}
```

### 2. 获取线索列表
```http
GET /leads
Authorization: Bearer {token}

# Query Parameters
?page=1&limit=50
&status=new  # new, contacted, replied, quoting, sample, closed, lost
&country=United States
&assigned_to=1
&sort=-created_at  # - 降序，正序不加
&search=company_name

# Response 200
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": 1,
        "company_name": "ABC Corp",
        "website": "https://abccorp.com",
        "contact_name": "John Smith",
        "contact_title": "Purchasing Manager",
        "email": "john@abccorp.com",
        "phone": "+1-234-567-8900",
        "country": "United States",
        "city": "New York",
        "status": "new",
        "priority": "normal",
        "assigned_to": 1,
        "created_at": "2026-03-24T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 1250,
      "page": 1,
      "limit": 50,
      "total_pages": 25
    }
  }
}
```

### 3. 获取线索详情
```http
GET /leads/:id
Authorization: Bearer {token}

# Response 200
{
  "success": true,
  "data": {
    "id": 1,
    "company_name": "ABC Corp",
    "website": "https://abccorp.com",
    "contact_name": "John Smith",
    "contact_title": "Purchasing Manager",
    "email": "john@abccorp.com",
    "phone": "+1-234-567-8900",
    "address": "123 Main St, New York, NY 10001",
    "country": "United States",
    "city": "New York",
    "facebook_url": "https://facebook.com/abccorp",
    "linkedin_url": "https://linkedin.com/company/abccorp",
    "status": "new",
    "priority": "normal",
    "assigned_to": 1,
    "tags": ["importer", "wholesaler"],
    "notes": "Potential high-value customer",
    "email_history": [
      {
        "id": 1,
        "subject": "Partnership Opportunity",
        "status": "opened",
        "sent_at": "2026-03-24T11:00:00Z",
        "opened_count": 2
      }
    ],
    "created_at": "2026-03-24T10:30:00Z",
    "updated_at": "2026-03-24T11:00:00Z"
  }
}
```

### 4. 更新线索
```http
PUT /leads/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "contacted",
  "priority": "high",
  "assigned_to": 2,
  "notes": "Customer showed interest, follow up next week",
  "next_follow_up": "2026-03-31"
}

# Response 200
{
  "success": true,
  "data": {
    "id": 1,
    "status": "contacted",
    "updated_at": "2026-03-24T12:00:00Z"
  }
}
```

### 5. 导出线索
```http
POST /leads/export
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "csv",  # csv, excel, json
  "filters": {
    "status": ["new", "contacted"],
    "country": ["United States"],
    "created_after": "2026-03-01"
  },
  "fields": ["company_name", "website", "email", "contact_name", "phone"]
}

# Response 200 (返回下载链接)
{
  "success": true,
  "data": {
    "download_url": "/downloads/leads_20260324_123456.csv",
    "expires_at": "2026-03-25T12:00:00Z",
    "count": 150
  }
}
```

---

## 📧 邮件管理

### 1. 生成开发信（AI）
```http
POST /emails/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "lead_id": 1,
  "template_type": "initial",  # initial, follow_up_1, follow_up_2, quotation, sample
  "custom_data": {
    "my_company_name": "Your Company",
    "my_product": "LED Lights",
    "my_experience": 10,
    "my_advantage_1": "Competitive pricing",
    "my_advantage_2": "Fast delivery (7-15 days)",
    "my_advantage_3": "CE, RoHS, FCC certified"
  }
}

# Response 200
{
  "success": true,
  "data": {
    "subject": "Partnership Opportunity with ABC Corp",
    "body": "Dear John Smith,\n\nI noticed that ABC Corp specializes in...",
    "variables_used": ["company_name", "contact_name", ...],
    "versions": [
      {
        "version": "A",
        "subject": "...",
        "body": "..."
      },
      {
        "version": "B",
        "subject": "...",
        "body": "..."
      }
    ]
  }
}
```

### 2. 发送邮件
```http
POST /emails/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "lead_id": 1,
  "subject": "Partnership Opportunity",
  "body": "Dear John Smith,...",
  "template_name": "initial",
  "track_opens": true,
  "track_clicks": true
}

# Response 202
{
  "success": true,
  "data": {
    "email_id": 1,
    "status": "sent",
    "brevo_message_id": "msg_123456",
    "sent_at": "2026-03-24T12:00:00Z"
  }
}
```

### 3. 获取邮件列表
```http
GET /emails
Authorization: Bearer {token}

# Query Parameters
?page=1&limit=50
&lead_id=1
&status=sent  # draft, sent, delivered, opened, clicked, replied
&date_from=2026-03-01
&date_to=2026-03-31

# Response 200
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": 1,
        "lead_id": 1,
        "lead_name": "ABC Corp",
        "subject": "Partnership Opportunity",
        "status": "opened",
        "sent_at": "2026-03-24T12:00:00Z",
        "opened_count": 3,
        "clicked_count": 1,
        "template_name": "initial"
      }
    ],
    "pagination": {
      "total": 350,
      "page": 1,
      "limit": 50
    }
  }
}
```

### 4. 获取邮件详情（含追踪）
```http
GET /emails/:id
Authorization: Bearer {token}

# Response 200
{
  "success": true,
  "data": {
    "id": 1,
    "lead_id": 1,
    "subject": "Partnership Opportunity",
    "body": "...",
    "status": "opened",
    "sent_at": "2026-03-24T12:00:00Z",
    "delivered_at": "2026-03-24T12:01:00Z",
    "opened_count": 3,
    "first_opened_at": "2026-03-24T14:30:00Z",
    "last_opened_at": "2026-03-24T16:45:00Z",
    "clicked_count": 1,
    "first_clicked_at": "2026-03-24T14:32:00Z",
    "tracking_events": [
      {
        "type": "delivered",
        "timestamp": "2026-03-24T12:01:00Z"
      },
      {
        "type": "opened",
        "timestamp": "2026-03-24T14:30:00Z",
        "ip": "1.2.3.4",
        "location": "New York, US"
      },
      {
        "type": "clicked",
        "timestamp": "2026-03-24T14:32:00Z",
        "url": "https://yourcompany.com/catalog"
      }
    ]
  }
}
```

---

## 📢 营销活动

### 1. 创建营销活动
```http
POST /campaigns
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "March LED Promotion",
  "description": "Send promotional emails to US customers",
  "template_id": 1,
  "target_segment": {
    "country": ["United States"],
    "status": ["new", "contacted"],
    "industry": ["Lighting"]
  },
  "scheduled_at": "2026-03-25T09:00:00Z",
  "daily_limit": 300,
  "timezone": "America/New_York"
}

# Response 201
{
  "success": true,
  "data": {
    "id": 1,
    "name": "March LED Promotion",
    "status": "draft",
    "estimated_leads": 450,
    "estimated_days": 2,
    "created_at": "2026-03-24T12:00:00Z"
  }
}
```

### 2. 启动营销活动
```http
POST /campaigns/:id/start
Authorization: Bearer {token}

# Response 200
{
  "success": true,
  "data": {
    "id": 1,
    "status": "running",
    "started_at": "2026-03-24T12:00:00Z"
  }
}
```

### 3. 暂停营销活动
```http
POST /campaigns/:id/pause
Authorization: Bearer {token}

# Response 200
{
  "success": true,
  "data": {
    "id": 1,
    "status": "paused",
    "paused_at": "2026-03-24T15:00:00Z"
  }
}
```

### 4. 获取营销活动列表
```http
GET /campaigns
Authorization: Bearer {token}

# Query Parameters
?status=running  # draft, scheduled, running, paused, completed
&page=1&limit=20

# Response 200
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": 1,
        "name": "March LED Promotion",
        "status": "running",
        "total_leads": 450,
        "emails_sent": 150,
        "emails_opened": 52,
        "emails_clicked": 18,
        "emails_replied": 7,
        "progress": 33.3,
        "started_at": "2026-03-24T09:00:00Z"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20
    }
  }
}
```

### 5. 获取营销活动详情
```http
GET /campaigns/:id
Authorization: Bearer {token}

# Response 200
{
  "success": true,
  "data": {
    "id": 1,
    "name": "March LED Promotion",
    "description": "...",
    "status": "running",
    "template": {
      "id": 1,
      "name": "初次联系"
    },
    "target_segment": {...},
    "scheduled_at": "2026-03-25T09:00:00Z",
    "daily_limit": 300,
    "statistics": {
      "total_leads": 450,
      "emails_sent": 150,
      "emails_delivered": 148,
      "emails_opened": 52,
      "emails_clicked": 18,
      "emails_replied": 7,
      "emails_bounced": 2,
      "open_rate": 35.1,
      "click_rate": 12.2,
      "reply_rate": 4.7
    },
    "daily_progress": [
      {"date": "2026-03-24", "sent": 150, "opened": 52, "clicked": 18, "replied": 7}
    ],
    "started_at": "2026-03-24T09:00:00Z"
  }
}
```

---

## 🏢 CRM 客户管理

### 1. 获取销售漏斗
```http
GET /crm/funnel
Authorization: Bearer {token}

# Response 200
{
  "success": true,
  "data": {
    "funnel": [
      {"status": "new", "count": 500, "percentage": 40.0},
      {"status": "contacted", "count": 400, "percentage": 32.0},
      {"status": "replied", "count": 200, "percentage": 16.0},
      {"status": "quoting", "count": 80, "percentage": 6.4},
      {"status": "sample", "count": 50, "percentage": 4.0},
      {"status": "closed", "count": 20, "percentage": 1.6}
    ],
    "total": 1250
  }
}
```

### 2. 获取客户列表
```http
GET /crm/customers
Authorization: Bearer {token}

# Query Parameters
?page=1&limit=50
&status=closed  # 只看成交客户
&min_value=10000
&sort=-total_value

# Response 200
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": 1,
        "company_name": "ABC Corp",
        "contact_name": "John Smith",
        "email": "john@abccorp.com",
        "country": "United States",
        "status": "closed",
        "total_orders": 5,
        "total_value": 125000,
        "last_order_date": "2026-03-15",
        "assigned_to": 1
      }
    ],
    "pagination": {...}
  }
}
```

### 3. 获取客户详情（完整历史）
```http
GET /crm/customers/:id
Authorization: Bearer {token}

# Response 200
{
  "success": true,
  "data": {
    "id": 1,
    "company_name": "ABC Corp",
    "contact_name": "John Smith",
    "email": "john@abccorp.com",
    "phone": "+1-234-567-8900",
    "country": "United States",
    "status": "closed",
    "assigned_to": 1,
    
    "statistics": {
      "total_emails_sent": 25,
      "total_emails_opened": 18,
      "total_orders": 5,
      "total_value": 125000,
      "avg_order_value": 25000,
      "first_contact_date": "2026-01-15",
      "first_order_date": "2026-02-01",
      "last_order_date": "2026-03-15"
    },
    
    "timeline": [
      {
        "type": "lead_created",
        "date": "2026-01-15T10:00:00Z",
        "description": "Lead created from Google Maps search"
      },
      {
        "type": "email_sent",
        "date": "2026-01-15T11:00:00Z",
        "description": "Initial email sent"
      },
      {
        "type": "email_opened",
        "date": "2026-01-15T14:30:00Z",
        "description": "Customer opened email"
      },
      {
        "type": "email_replied",
        "date": "2026-01-16T09:00:00Z",
        "description": "Customer replied, interested in products"
      },
      {
        "type": "status_changed",
        "date": "2026-01-16T09:05:00Z",
        "description": "Status changed from new to replied"
      },
      {
        "type": "order_created",
        "date": "2026-02-01T10:00:00Z",
        "description": "First order: $25,000"
      }
    ],
    
    "notes": [
      {
        "id": 1,
        "content": "Customer prefers email communication",
        "created_by": 1,
        "created_at": "2026-01-16T10:00:00Z"
      }
    ]
  }
}
```

### 4. 添加跟进记录
```http
POST /crm/customers/:id/notes
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Customer said they will place next order in April",
  "reminder_date": "2026-04-01"
}

# Response 201
{
  "success": true,
  "data": {
    "id": 2,
    "content": "Customer said they will place next order in April",
    "created_by": 1,
    "created_at": "2026-03-24T15:00:00Z"
  }
}
```

---

## 📈 数据统计

### 1. 获取业绩统计
```http
GET /stats/performance
Authorization: Bearer {token}

# Query Parameters
?period=30d  # 7d, 30d, 90d, 1y
&group_by=user  # user, day, week, month

# Response 200
{
  "success": true,
  "data": {
    "by_user": [
      {
        "user_id": 1,
        "user_name": "John Doe",
        "leads_contacted": 150,
        "emails_sent": 500,
        "replies": 45,
        "orders": 8,
        "total_value": 180000
      }
    ],
    "summary": {
      "total_leads": 1250,
      "total_emails": 3500,
      "total_replies": 150,
      "total_orders": 35,
      "total_value": 850000
    }
  }
}
```

### 2. 获取邮件效果统计
```http
GET /stats/email
Authorization: Bearer {token}

# Query Parameters
?period=30d
&group_by=day

# Response 200
{
  "success": true,
  "data": {
    "summary": {
      "total_sent": 3500,
      "delivered": 3400,
      "opened": 1200,
      "clicked": 400,
      "replied": 150,
      "bounced": 100,
      "open_rate": 35.3,
      "click_rate": 11.8,
      "reply_rate": 4.4,
      "bounce_rate": 2.9
    },
    "daily": [
      {
        "date": "2026-03-01",
        "sent": 120,
        "opened": 45,
        "clicked": 15,
        "replied": 5
      }
    ]
  }
}
```

---

## ⚙️ 系统设置

### 1. 获取公司配置
```http
GET /settings
Authorization: Bearer {token}

# Response 200
{
  "success": true,
  "data": {
    "company": {
      "name": "ABC Trading",
      "products": ["LED Strip Lights", "LED Panel Lights"],
      "target_countries": ["United States", "United Kingdom"],
      "moq": "100 pieces",
      "lead_time": "7-15 days",
      "certifications": ["CE", "RoHS", "FCC"]
    },
    "email_signature": {
      "name": "John Doe",
      "position": "Sales Manager",
      "company": "ABC Trading",
      "website": "https://abctrading.com",
      "whatsapp": "+86-123-4567-8900"
    },
    "sending_config": {
      "daily_limit": 300,
      "send_time_start": "09:00",
      "send_time_end": "17:00",
      "timezone": "America/New_York"
    }
  }
}
```

### 2. 更新公司配置
```http
PUT /settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "company": {
    "name": "ABC Trading Co., Ltd.",
    "products": ["LED Strip Lights", "LED Panel Lights", "LED Bulbs"],
    "target_countries": ["United States", "United Kingdom", "Germany"]
  },
  "email_signature": {
    "name": "John Doe",
    "position": "Sales Director"
  }
}

# Response 200
{
  "success": true,
  "data": {
    "updated_at": "2026-03-24T15:00:00Z"
  }
}
```

---

## 🔌 Webhook 回调（Brevo）

### 1. 邮件状态回调
```http
POST /webhooks/brevo
Content-Type: application/json

{
  "event": "open",
  "time": 1711267200,
  "email": "john@abccorp.com",
  "message_id": "msg_123456",
  "ip": "1.2.3.4",
  "geo": "US",
  "user_agent": "Mozilla/5.0..."
}

# Response 200
{
  "success": true
}
```

---

## ❌ 错误响应

### 通用错误格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {"field": "email", "message": "Must be a valid email address"}
    ]
  }
}
```

### 常见错误码
| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| VALIDATION_ERROR | 400 | 参数验证失败 |
| UNAUTHORIZED | 401 | 未认证 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| RATE_LIMITED | 429 | 请求过于频繁 |
| API_ERROR | 500 | 第三方 API 错误 |
| DATABASE_ERROR | 500 | 数据库错误 |

---

## 📝 开发建议

### 1. 前端 API 客户端封装
```javascript
// frontend/src/api/index.js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：添加 token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // 跳转登录
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data?.error || error)
  }
)

export default api
```

### 2. WebSocket 连接
```javascript
// 连接 WebSocket
const ws = new WebSocket('ws://localhost:3000/ws')

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  switch (data.type) {
    case 'lead_search_progress':
      // 更新进度条
      break
    case 'lead_search_completed':
      // 刷新线索列表
      break
    case 'email_opened':
      // 显示通知
      break
  }
}
```

---

**版本**: 1.0  
**更新日期**: 2026-03-24

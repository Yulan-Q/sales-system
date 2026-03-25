import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          router.push('/login')
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('资源不存在')
          break
        case 429:
          ElMessage.warning('请求过于频繁，请稍后再试')
          break
        default:
          ElMessage.error(data?.error?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

// API 方法封装
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
}

export const dashboardAPI = {
  getDashboard: (period = '7d') => api.get(`/dashboard?period=${period}`)
}

export const leadsAPI = {
  search: (data) => api.post('/leads/search', data),
  getSearchProgress: (runId) => api.get(`/leads/search/${runId}`),
  getList: (params) => api.get('/leads', { params }),
  getById: (id) => api.get(`/leads/${id}`),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  import: (data) => api.post('/leads/import', data),
  export: (data) => api.post('/leads/export', data),
  addNote: (id, data) => api.post(`/leads/${id}/notes`, data)
}

export const emailsAPI = {
  generate: (data) => api.post('/emails/generate', data),
  send: (data) => api.post('/emails/send', data),
  getList: (params) => api.get('/emails', { params }),
  getById: (id) => api.get(`/emails/${id}`)
}

export const campaignsAPI = {
  create: (data) => api.post('/campaigns', data),
  start: (id) => api.post(`/campaigns/${id}/start`),
  pause: (id) => api.post(`/campaigns/${id}/pause`),
  getList: (params) => api.get('/campaigns', { params }),
  getById: (id) => api.get(`/campaigns/${id}`)
}

export const crmAPI = {
  getFunnel: () => api.get('/crm/funnel'),
  getCustomers: (params) => api.get('/crm/customers', { params }),
  getCustomerById: (id) => api.get(`/crm/customers/${id}`),
  addNote: (id, data) => api.post(`/crm/customers/${id}/notes`, data)
}

export const statsAPI = {
  getPerformance: (params) => api.get('/stats/performance', { params }),
  getEmail: (params) => api.get('/stats/email', { params })
}

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
}

export default api

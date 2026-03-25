<template>
  <div class="dashboard">
    <!-- 欢迎横幅 -->
    <el-card class="welcome-banner" shadow="never">
      <div class="welcome-content">
        <div class="welcome-text">
          <h2>👋 欢迎回来，{{ userName }}！</h2>
          <p>今天也是收获满满的一天，已有 <strong>{{ stats.leads.new }}</strong> 条新线索等待处理</p>
        </div>
        <div class="welcome-actions">
          <el-button type="primary" @click="showSearchDialog = true">
            <el-icon><Search /></el-icon>
            搜索线索
          </el-button>
          <el-button type="success" @click="showCampaignDialog = true">
            <el-icon><Promotion /></el-icon>
            创建活动
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card stat-card--blue">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.leads.total }}</div>
              <div class="stat-label">总线索数</div>
              <div class="stat-trend trend--up">
                <el-icon><Top /></el-icon>
                <span>+12% 较上周</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card stat-card--green">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Message /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.emails.total_sent }}</div>
              <div class="stat-label">已发送邮件</div>
              <div class="stat-trend trend--up">
                <el-icon><Top /></el-icon>
                <span>+8% 较上周</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card stat-card--orange">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><View /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.emails.open_rate }}%</div>
              <div class="stat-label">邮件打开率</div>
              <div class="stat-trend trend--up">
                <el-icon><Top /></el-icon>
                <span>+3% 较上周</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card stat-card--red">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><SuccessFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.leads.closed }}</div>
              <div class="stat-label">成交客户</div>
              <div class="stat-trend trend--up">
                <el-icon><Top /></el-icon>
                <span>+25% 较上周</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">📈 线索趋势</span>
              <el-radio-group v-model="period" size="small">
                <el-radio-button label="7d">7 天</el-radio-button>
                <el-radio-button label="30d">30 天</el-radio-button>
                <el-radio-button label="90d">90 天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="leadsChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">📊 邮件效果</span>
            </div>
          </template>
          <div ref="emailChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 销售漏斗 + 最近活动 -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card class="funnel-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">🎯 销售漏斗</span>
              <el-link type="primary" :underline="false" @click="viewFullFunnel">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-link>
            </div>
          </template>
          <div class="funnel-content">
            <div
              v-for="(item, index) in funnelData"
              :key="item.status"
              class="funnel-item"
              :style="{ width: item.percentage + '%' }"
            >
              <div class="funnel-bar" :class="`funnel-${index}`">
                <span class="funnel-label">{{ item.status_label }}</span>
                <span class="funnel-value">{{ item.count }} ({{ item.percentage }}%)</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card class="activity-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">🔔 最近活动</span>
              <el-link type="primary" :underline="false">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-link>
            </div>
          </template>
          <el-timeline class="activity-timeline">
            <el-timeline-item
              v-for="activity in activities"
              :key="activity.id"
              :timestamp="activity.time"
              placement="top"
              :color="activity.color"
            >
              <el-card shadow="hover" class="activity-item">
                <div class="activity-icon" :style="{ background: activity.color }">
                  <el-icon :size="20"><component :is="activity.icon" /></el-icon>
                </div>
                <div class="activity-content">
                  <p class="activity-text">{{ activity.content }}</p>
                  <span class="activity-meta">{{ activity.meta }}</span>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <!-- 线索搜索对话框 -->
    <el-dialog
      v-model="showSearchDialog"
      title="🔍 搜索潜在客户"
      width="600px"
      destroy-on-close
    >
      <el-form :model="searchForm" label-width="100px">
        <el-form-item label="产品关键词">
          <el-input
            v-model="searchForm.keywords"
            placeholder="如：LED light, electronics"
            :rows="2"
            type="textarea"
          />
        </el-form-item>
        <el-form-item label="目标国家">
          <el-select
            v-model="searchForm.countries"
            multiple
            placeholder="选择国家"
            style="width: 100%"
          >
            <el-option label="美国" value="United States" />
            <el-option label="英国" value="United Kingdom" />
            <el-option label="德国" value="Germany" />
            <el-option label="法国" value="France" />
            <el-option label="加拿大" value="Canada" />
          </el-select>
        </el-form-item>
        <el-form-item label="线索数量">
          <el-slider v-model="searchForm.limit" :min="50" :max="500" :step="50" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSearchDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          开始搜索
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { dashboardAPI, crmAPI, leadsAPI } from '@/api'
import * as echarts from 'echarts'

const userName = computed(() => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user).name : '管理员'
})

const period = ref('7d')
const showSearchDialog = ref(false)
const showCampaignDialog = ref(false)

const searchForm = reactive({
  keywords: '',
  countries: [],
  limit: 100
})

const stats = reactive({
  leads: { total: 0, new: 0, contacted: 0, replied: 0, closed: 0 },
  emails: { total_sent: 0, opened: 0, clicked: 0, replied: 0, open_rate: 0 }
})

const funnelData = ref([])
const activities = ref([
  {
    id: 1,
    content: '新客户 ABC Corp 下单 $25,000',
    time: '2026-03-24 15:30',
    meta: '销售成交',
    color: '#67C23A',
    icon: 'SuccessFilled'
  },
  {
    id: 2,
    content: '邮件活动 "March Promotion" 已发送 150 封',
    time: '2026-03-24 14:00',
    meta: '营销活动',
    color: '#409EFF',
    icon: 'Promotion'
  },
  {
    id: 3,
    content: '新增线索 87 条 from Google Maps',
    time: '2026-03-24 10:30',
    meta: '线索挖掘',
    color: '#E6A23C',
    icon: 'Search'
  },
  {
    id: 4,
    content: 'XYZ Company 打开了您的开发信',
    time: '2026-03-24 09:15',
    meta: '邮件追踪',
    color: '#F56C6C',
    icon: 'View'
  }
])

const leadsChartRef = ref(null)
const emailChartRef = ref(null)
let leadsChart = null
let emailChart = null

const loadDashboard = async () => {
  try {
    const res = await dashboardAPI.getDashboard(period.value)
    const data = res.data
    
    stats.leads = data.leads
    stats.emails = data.emails
    
    renderLeadsChart(data.chart.leads_daily)
    renderEmailChart(data.chart.emails_daily)
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  }
}

const loadFunnel = async () => {
  try {
    const res = await crmAPI.getFunnel()
    funnelData.value = res.data.funnel.map(item => ({
      ...item,
      status_label: getStatusLabel(item.status)
    }))
  } catch (error) {
    console.error('Failed to load funnel:', error)
  }
}

const getStatusLabel = (status) => {
  const labels = {
    new: '🆕 新线索',
    contacted: '📧 已联系',
    replied: '💬 已回复',
    quoting: '📋 报价中',
    sample: '📦 样品',
    closed: '✅ 成交',
    lost: '❌ 丢失'
  }
  return labels[status] || status
}

const renderLeadsChart = (data) => {
  if (!leadsChartRef.value) return
  if (leadsChart) leadsChart.dispose()
  
  leadsChart = echarts.init(leadsChartRef.value)
  
  leadsChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date),
      axisLine: { lineStyle: { color: '#dcdfe6' } }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f2f6fc' } }
    },
    series: [{
      name: '新增线索',
      type: 'line',
      smooth: true,
      data: data.map(item => item.count),
      itemStyle: { color: '#409EFF' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.01)' }
        ])
      }
    }]
  })
}

const renderEmailChart = (data) => {
  if (!emailChartRef.value) return
  if (emailChart) emailChart.dispose()
  
  emailChart = echarts.init(emailChartRef.value)
  
  emailChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    legend: { data: ['已发送', '已打开', '已点击'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date),
      axisLine: { lineStyle: { color: '#dcdfe6' } }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f2f6fc' } }
    },
    series: [
      {
        name: '已发送',
        type: 'bar',
        data: data.map(item => item.sent),
        itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '已打开',
        type: 'bar',
        data: data.map(item => item.opened),
        itemStyle: { color: '#E6A23C', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '已点击',
        type: 'bar',
        data: data.map(item => item.clicked),
        itemStyle: { color: '#F56C6C', borderRadius: [4, 4, 0, 0] }
      }
    ]
  })
}

const handleSearch = () => {
  console.log('Search:', searchForm)
  // TODO: 调用 API
  showSearchDialog.value = false
}

const viewFullFunnel = () => {
  // TODO: 跳转到 CRM 页面
}

watch(period, () => loadDashboard())

onMounted(() => {
  loadDashboard()
  loadFunnel()
  
  window.addEventListener('resize', () => {
    leadsChart?.resize()
    emailChart?.resize()
  })
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

/* 欢迎横幅 */
.welcome-banner {
  margin-bottom: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.welcome-banner :deep(.el-card__body) {
  padding: 0;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  color: #fff;
}

.welcome-text h2 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
}

.welcome-text p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.welcome-text strong {
  font-size: 18px;
}

.welcome-actions {
  display: flex;
  gap: 12px;
}

.welcome-actions .el-button {
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.stat-card--blue { border-top: 4px solid #409EFF; }
.stat-card--green { border-top: 4px solid #67C23A; }
.stat-card--orange { border-top: 4px solid #E6A23C; }
.stat-card--red { border-top: 4px solid #F56C6C; }

.stat-content {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-card--blue .stat-icon { background: linear-gradient(135deg, #409EFF, #66b1ff); }
.stat-card--green .stat-icon { background: linear-gradient(135deg, #67C23A, #85ce61); }
.stat-card--orange .stat-icon { background: linear-gradient(135deg, #E6A23C, #ebb563); }
.stat-card--red .stat-icon { background: linear-gradient(135deg, #F56C6C, #f89898); }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 6px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-top: 8px;
  color: #67C23A;
}

/* 图表卡片 */
.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  height: 320px;
  width: 100%;
}

/* 销售漏斗 */
.funnel-card {
  border-radius: 12px;
}

.funnel-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 0;
}

.funnel-item {
  transition: all 0.3s;
}

.funnel-item:hover {
  transform: translateX(5px);
}

.funnel-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  color: #fff;
  font-weight: 500;
}

.funnel-0 { background: linear-gradient(135deg, #409EFF, #66b1ff); }
.funnel-1 { background: linear-gradient(135deg, #67C23A, #85ce61); }
.funnel-2 { background: linear-gradient(135deg, #E6A23C, #ebb563); }
.funnel-3 { background: linear-gradient(135deg, #F56C6C, #f89898); }
.funnel-4 { background: linear-gradient(135deg, #909399, #a6a9ad); }
.funnel-5 { background: linear-gradient(135deg, #13ce66, #42d392); }

.funnel-label {
  font-size: 14px;
}

.funnel-value {
  font-size: 13px;
  opacity: 0.9;
}

/* 活动timeline */
.activity-card {
  border-radius: 12px;
}

.activity-timeline {
  padding: 10px 0;
}

.activity-item {
  border-radius: 10px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.activity-item:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transform: translateX(5px);
}

.activity-item :deep(.el-card__body) {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin: 0 0 6px;
  font-size: 14px;
  color: #303133;
}

.activity-meta {
  font-size: 12px;
  color: #909399;
}

/* 响应式 */
@media (max-width: 768px) {
  .welcome-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .welcome-actions {
    width: 100%;
    justify-content: center;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
  }
}
</style>

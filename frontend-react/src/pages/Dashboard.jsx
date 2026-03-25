import React, { useEffect } from 'react'
import { Row, Col, Card, Statistic } from 'antd'
import { TeamOutlined, MailOutlined, DollarOutlined, RiseOutlined } from '@ant-design/icons'
import { useLeadStore } from '../store/leadStore'
import ReactECharts from 'echarts-for-react'

const Dashboard = () => {
  const { leads, fetchLeads } = useLeadStore()

  useEffect(() => {
    fetchLeads()
  }, [])

  // 统计数据
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length) : 0
  }

  // 国家分布图表
  const countryOption = {
    title: { text: '国家分布', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: {c}条 ({d}%)' },
    series: [{
      type: 'pie',
      radius: '60%',
      data: Object.entries(leads.reduce((acc, l) => {
        acc[l.country] = (acc[l.country] || 0) + 1
        return acc
      }, {})).map(([country, count]) => ({ value: count, name: country })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } }
    }]
  }

  // 评分分布图表
  const scoreOption = {
    title: { text: '评分分布', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['A 级 (80+)', 'B 级 (60-79)', 'C 级 (40-59)', 'D 级 (<40)'] },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: [
        leads.filter(l => l.score >= 80).length,
        leads.filter(l => l.score >= 60 && l.score < 80).length,
        leads.filter(l => l.score >= 40 && l.score < 60).length,
        leads.filter(l => l.score < 40).length
      ],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ])
      }
    }]
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24, color: '#333' }}>📊 数据仪表盘</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总线索数"
              value={stats.total}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="新线索"
              value={stats.new}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已转化"
              value={stats.qualified}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均评分"
              value={stats.avgScore}
              suffix="分"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={countryOption} style={{ height: 400 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={scoreOption} style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

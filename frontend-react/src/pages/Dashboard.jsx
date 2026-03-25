import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Progress, Table, Tag, Space, Typography, Button } from 'antd'
import {
  TeamOutlined,
  RiseOutlined,
  DollarOutlined,
  MailOutlined,
  StarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useLeadStore } from '../store/leadStore'
import ReactECharts from 'echarts-for-react'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

const Dashboard = () => {
  const navigate = useNavigate()
  const { leads, loading, fetchLeads } = useLeadStore()
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    interested: 0,
    qualified: 0,
    avgScore: 0,
    publicPool: 0,
    highValue: 0
  })

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    if (leads.length > 0) {
      setStats({
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        interested: leads.filter(l => l.status === 'interested').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        avgScore: Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length),
        publicPool: leads.filter(l => l.isInPublicPool).length,
        highValue: leads.filter(l => l.score >= 80).length
      })
    }
  }, [leads])

  // 转化漏斗数据
  const funnelData = [
    { name: '总线索', value: stats.total, rate: 100 },
    { name: '已联系', value: stats.contacted + stats.interested + stats.qualified, rate: stats.total > 0 ? Math.round((stats.contacted + stats.interested + stats.qualified) / stats.total * 100) : 0 },
    { name: '感兴趣', value: stats.interested + stats.qualified, rate: stats.total > 0 ? Math.round((stats.interested + stats.qualified) / stats.total * 100) : 0 },
    { name: '已转化', value: stats.qualified, rate: stats.total > 0 ? Math.round(stats.qualified / stats.total * 100) : 0 }
  ]

  // 国家分布图表
  const countryOption = {
    title: { text: '线索国家分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c}条 ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false, position: 'center' },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold' }
      },
      data: Object.entries(leads.reduce((acc, l) => {
        acc[l.country] = (acc[l.country] || 0) + 1
        return acc
      }, {})).map(([country, count]) => ({ value: count, name: country }))
    }]
  }

  // 评分分布图表
  const scoreOption = {
    title: { text: '线索评分分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['A 级 (80+)', 'B 级 (60-79)', 'C 级 (40-59)', 'D 级 (<40)'],
      axisTick: { alignWithLabel: true }
    },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      barWidth: '60%',
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

  // 高价值线索表格
  const highValueColumns = [
    { title: '公司名称', dataIndex: 'name', key: 'name', render: text => <Text strong>{text}</Text> },
    { title: '国家', dataIndex: 'country', key: 'country' },
    { title: '评分', dataIndex: 'score', key: 'score', render: score => <Tag color="red"><StarOutlined /> {score}分</Tag> },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => navigate('/leads')}>
          联系
        </Button>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>📊 数据仪表盘</Title>
        <Text type="secondary">实时掌握销售线索动态，数据驱动决策</Text>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="总线索数"
              value={stats.total}
              prefix={<TeamOutlined style={{ color: '#667eea' }} />}
              valueStyle={{ color: '#667eea' }}
            />
            <Progress
              percent={100}
              strokeColor="#667eea"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="新线索"
              value={stats.new}
              prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={stats.total > 0 ? (stats.new / stats.total * 100) : 0}
              strokeColor="#52c41a"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="已转化"
              value={stats.qualified}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Progress
              percent={stats.total > 0 ? (stats.qualified / stats.total * 100) : 0}
              strokeColor="#722ed1"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="平均评分"
              value={stats.avgScore}
              suffix="分"
              prefix={<StarOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <Progress
              percent={stats.avgScore}
              strokeColor="#fa8c16"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 转化漏斗和预警 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="📊 转化漏斗" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '20px 0' }}>
              {funnelData.map((stage, index) => (
                <div key={stage.name} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text strong>{stage.name}</Text>
                    <Space>
                      <Text>{stage.value}条</Text>
                      <Tag color="blue">{stage.rate}%</Tag>
                    </Space>
                  </div>
                  <Progress
                    percent={stage.rate}
                    strokeColor={{
                      '0%': '#667eea',
                      '100%': '#764ba2'
                    }}
                    format={() => ''}
                  />
                </div>
              ))}
            </div>
            
            {/* 瓶颈分析 */}
            {funnelData.length > 1 && (
              <div style={{
                padding: 16,
                background: funnelData[1].rate < 50 ? '#fff7e6' : '#f6ffed',
                borderRadius: 8,
                marginTop: 16
              }}>
                <Space>
                  {funnelData[1].rate < 50 ? <WarningOutlined style={{ color: '#fa8c16' }} /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  <Text>
                    {funnelData[1].rate < 50
                      ? `⚠️ 初次联系转化率仅${funnelData[1].rate}%，建议优化联系话术`
                      : '✅ 转化流程健康，继续保持'}
                  </Text>
                </Space>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="⚠️ 待办事项" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.publicPool > 0 && (
                <div style={{
                  padding: 12,
                  background: '#fff7e6',
                  borderRadius: 8,
                  border: '1px solid #ffd591'
                }}>
                  <Space>
                    <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                    <div>
                      <Text strong>公海池线索</Text>
                      <div><Text type="secondary">{stats.publicPool} 条待领取</Text></div>
                    </div>
                  </Space>
                </div>
              )}
              
              {stats.highValue > 0 && (
                <div style={{
                  padding: 12,
                  background: '#fff1f0',
                  borderRadius: 8,
                  border: '1px solid #ffa39e'
                }}>
                  <Space>
                    <StarOutlined style={{ color: '#f5222d' }} />
                    <div>
                      <Text strong>高价值线索</Text>
                      <div><Text type="secondary">{stats.highValue} 条 A 级线索待联系</Text></div>
                    </div>
                  </Space>
                </div>
              )}

              {stats.new > 0 && (
                <div style={{
                  padding: 12,
                  background: '#e6f7ff',
                  borderRadius: 8,
                  border: '1px solid #91d5ff'
                }}>
                  <Space>
                    <RiseOutlined style={{ color: '#1890ff' }} />
                    <div>
                      <Text strong>新线索</Text>
                      <div><Text type="secondary">{stats.new} 条新线索待分配</Text></div>
                    </div>
                  </Space>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表和高价值线索 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="🌍 国家分布" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <ReactECharts option={countryOption} style={{ height: 300 }} />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="⭐ 评分分布" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <ReactECharts option={scoreOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 高价值线索表格 */}
      {leads.filter(l => l.score >= 80).length > 0 && (
        <Card
          title="🔥 高价值线索（A 级）"
          bordered={false}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: 24 }}
          extra={<Button type="link" onClick={() => navigate('/leads')}>查看全部</Button>}
        >
          <Table
            columns={highValueColumns}
            dataSource={leads.filter(l => l.score >= 80).slice(0, 5)}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}
    </div>
  )
}

export default Dashboard

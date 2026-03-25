import React, { useState } from 'react'
import { Table, Tag, Space, Button, Input, Select, Modal, Form, message, Typography, Empty, Tooltip } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  BuildingOutlined,
  StarOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useLeadStore } from '../store/leadStore'
import dayjs from 'dayjs'

const { Title } = Typography
const { TextArea } = Input

const Leads = () => {
  const { leads, loading, fetchLeads, createLead, updateLead, deleteLead, bulkUpdate } = useLeadStore()
  const [messageApi, messageContextHolder] = message.useMessage()
  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [filters, setFilters] = useState({
    status: undefined,
    country: undefined,
    minScore: undefined
  })
  const [form] = Form.useForm()

  // 获取唯一值用于筛选
  const countries = [...new Set(leads.map(l => l.country))]
  const statuses = [
    { value: 'new', label: '新线索', color: 'green' },
    { value: 'contacted', label: '已联系', color: 'blue' },
    { value: 'interested', label: '感兴趣', color: 'orange' },
    { value: 'qualified', label: '已转化', color: 'purple' }
  ]

  // 处理搜索
  const handleSearch = () => {
    fetchLeads({ search: searchText, ...filters })
  }

  // 重置筛选
  const handleReset = () => {
    setSearchText('')
    setFilters({})
    form.resetFields()
    fetchLeads()
  }

  // 打开编辑模态框
  const handleEdit = (record) => {
    setEditingLead(record)
    form.setFieldsValue(record)
    setIsModalOpen(true)
  }

  // 打开新建模态框
  const handleCreate = () => {
    setEditingLead(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  // 删除确认
  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除"${record.name}"吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteLead(record.id)
          messageApi.success('删除成功')
        } catch (error) {
          messageApi.error('删除失败')
        }
      }
    })
  }

  // 保存（新建/编辑）
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editingLead) {
        await updateLead(editingLead.id, values)
        messageApi.success('更新成功')
      } else {
        await createLead(values)
        messageApi.success('创建成功')
      }
      setIsModalOpen(false)
      setEditingLead(null)
      form.resetFields()
      fetchLeads()
    } catch (error) {
      console.error(error)
    }
  }

  // 批量操作
  const handleBulkAction = async (action) => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning('请先选择线索')
      return
    }

    Modal.confirm({
      title: `批量${action}`,
      content: `确定要对选中的 ${selectedRowKeys.length} 条线索执行${action}操作吗？`,
      onOk: async () => {
        try {
          await bulkUpdate(selectedRowKeys, { action })
          messageApi.success(`批量${action}成功`)
          setSelectedRowKeys([])
          fetchLeads()
        } catch (error) {
          messageApi.error('操作失败')
        }
      }
    })
  }

  // 表格列定义
  const columns = [
    {
      title: '公司名称',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong style={{ color: '#667eea' }}>{text}</strong>
          <span style={{ fontSize: 12, color: '#999' }}>{record.industry || '未分类'}</span>
        </Space>
      )
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Tooltip title="发送邮件">
            <a href={`mailto:${record.email}`}><MailOutlined /> {record.email}</a>
          </Tooltip>
          {record.phone && (
            <Tooltip title="拨打电话">
              <span style={{ color: '#666', fontSize: 12 }}><PhoneOutlined /> {record.phone}</span>
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: '地区',
      key: 'location',
      width: 120,
      filters: countries.map(c => ({ text: c, value: c })),
      onFilter: (value, record) => record.country === value,
      render: (_, record) => (
        <Space>
          <GlobalOutlined /> {record.country}
        </Space>
      )
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      sorter: (a, b) => a.score - b.score,
      render: (score) => {
        let color = 'default'
        if (score >= 80) color = 'red'
        else if (score >= 60) color = 'blue'
        else if (score >= 40) color = 'green'
        
        return (
          <Tag color={color} style={{ fontWeight: 'bold' }}>
            <StarOutlined /> {score}分
          </Tag>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: statuses.map(s => ({ text: s.label, value: s.value })),
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const config = statuses.find(s => s.value === status) || { color: 'default', label: status }
        return <Tag color={config.color}>{config.label}</Tag>
      }
    },
    {
      title: '员工数',
      dataIndex: 'employees',
      key: 'employees',
      width: 80,
      sorter: (a, b) => a.employees - b.employees,
      render: (num) => num ? `${num}人` : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="查看">
            <Button type="link" icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="发邮件">
            <Button type="link" icon={<MailOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      )
    }
  ]

  // 批量操作工具栏
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE
    ]
  }

  return (
    <>
      {messageContextHolder}
      
      {/* 顶部操作栏 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>🎯 线索管理</Title>
          
          <Input
            placeholder="🔍 搜索公司名、邮箱、国家..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
          
          <Select
            placeholder="状态筛选"
            style={{ width: 120 }}
            allowClear
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            options={statuses.map(s => ({ value: s.value, label: s.label }))}
          />
          
          <Select
            placeholder="国家筛选"
            style={{ width: 120 }}
            allowClear
            value={filters.country}
            onChange={(value) => setFilters({ ...filters, country: value })}
            options={countries.map(c => ({ value: c, label: c }))}
          />
          
          <Space style={{ marginLeft: 'auto' }}>
            <Button icon={<FilterOutlined />} onClick={handleSearch}>
              筛选
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建线索
            </Button>
          </Space>
        </div>

        {/* 批量操作栏 */}
        {selectedRowKeys.length > 0 && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: '#e6f7ff',
            border: '1px solid #91d5ff',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}>
            <span style={{ fontWeight: 600, color: '#1890ff' }}>
              已选择 {selectedRowKeys.length} 条线索
            </span>
            <Space>
              <Button size="small" onClick={() => handleBulkAction('分配')}>
                批量分配
              </Button>
              <Button size="small" onClick={() => handleBulkAction('发邮件')}>
                批量发邮件
              </Button>
              <Button size="small" onClick={() => handleBulkAction('标记状态')}>
                标记状态
              </Button>
              <Button size="small" danger onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            </Space>
          </div>
        )}
      </div>

      {/* 数据表格 */}
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={leads}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical">
                  <span>暂无线索数据</span>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    新建第一条线索
                  </Button>
                </Space>
              }
            />
          )
        }}
      />

      {/* 新建/编辑模态框 */}
      <Modal
        title={editingLead ? '✏️ 编辑线索' : '➕ 新建线索'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingLead(null)
          form.resetFields()
        }}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'new',
            source: 'manual',
            score: 0
          }}
        >
          <Form.Item name="name" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input prefix={<BuildingOutlined />} placeholder="例如：ABC Trading Ltd" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
              <Input prefix={<MailOutlined />} placeholder="info@company.com" />
            </Form.Item>

            <Form.Item name="phone" label="电话">
              <Input prefix={<PhoneOutlined />} placeholder="+1 234 567 8900" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="country" label="国家" rules={[{ required: true, message: '请选择国家' }]}>
              <Select placeholder="选择国家">
                <Select.Option value="UK">🇬🇧 英国</Select.Option>
                <Select.Option value="Germany">🇩🇪 德国</Select.Option>
                <Select.Option value="USA">🇺🇸 美国</Select.Option>
                <Select.Option value="France">🇫🇷 法国</Select.Option>
                <Select.Option value="Japan">🇯🇵 日本</Select.Option>
                <Select.Option value="Australia">🇦🇺 澳大利亚</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="industry" label="行业">
              <Select placeholder="选择行业">
                <Select.Option value="Trading">贸易</Select.Option>
                <Select.Option value="Tech">科技</Select.Option>
                <Select.Option value="Manufacturing">制造</Select.Option>
                <Select.Option value="Service">服务</Select.Option>
                <Select.Option value="Retail">零售</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Form.Item name="employees" label="员工数">
              <Input type="number" placeholder="50" />
            </Form.Item>

            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select>
                {statuses.map(s => (
                  <Select.Option key={s.value} value={s.value}>{s.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="score" label="评分">
              <Input type="number" min="0" max="100" placeholder="0-100" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="描述">
            <TextArea rows={4} placeholder="详细描述公司信息、需求等..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default Leads

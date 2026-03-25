import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useLeadStore } from '../store/leadStore'
import ReactECharts from 'echarts-for-react'

const { TextArea } = Input

const Leads = () => {
  const { leads, loading, fetchLeads, createLead, updateLead, deleteLead } = useLeadStore()
  const [messageApi, messageContextHolder] = message.useMessage()
  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchLeads()
  }, [])

  // 搜索功能
  const handleSearch = () => {
    const filtered = leads.filter(lead =>
      lead.name.toLowerCase().includes(searchText.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchText.toLowerCase()) ||
      lead.country.toLowerCase().includes(searchText.toLowerCase())
    )
    return filtered
  }

  // 编辑功能
  const handleEdit = (record) => {
    setEditingLead(record)
    form.setFieldsValue(record)
    setIsModalOpen(true)
  }

  // 删除功能
  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条线索吗？',
      onOk: async () => {
        await deleteLead(id)
        messageApi.success('删除成功')
      }
    })
  }

  // 保存（新增/编辑）
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

  const columns = [
    {
      title: '公司名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email) => <a href={`mailto:${email}`}>{email}</a>
    },
    {
      title: '国家',
      dataIndex: 'country',
      key: 'country',
      filters: [...new Set(leads.map(l => l.country))].map(c => ({ text: c, value: c })),
      onFilter: (value, record) => record.country === value
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      sorter: (a, b) => a.score - b.score,
      render: (score) => (
        <Tag color={score >= 80 ? 'red' : score >= 60 ? 'blue' : score >= 40 ? 'green' : 'default'}>
          {score}分
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: '新线索', value: 'new' },
        { text: '已联系', value: 'contacted' },
        { text: '感兴趣', value: 'interested' },
        { text: '已转化', value: 'qualified' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const config = {
          new: { color: 'green', text: '🆕 新线索' },
          contacted: { color: 'blue', text: '📞 已联系' },
          interested: { color: 'orange', text: '💰 感兴趣' },
          qualified: { color: 'purple', text: '✅ 已转化' }
        }
        const { color, text } = config[status] || { color: 'default', text: status }
        return <Tag color={color}>{text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      )
    }
  ]

  return (
    <>
      {messageContextHolder}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder="🔍 搜索公司名、邮箱、国家..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingLead(null); form.resetFields(); setIsModalOpen(true) }}>
          新建线索
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={handleSearch()}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: total => `共 ${total} 条` }}
      />

      <Modal
        title={editingLead ? '编辑线索' : '新建线索'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => { setIsModalOpen(false); setEditingLead(null); form.resetFields() }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="公司名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="country" label="国家" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="UK">英国</Select.Option>
              <Select.Option value="Germany">德国</Select.Option>
              <Select.Option value="USA">美国</Select.Option>
              <Select.Option value="France">法国</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="industry" label="行业">
            <Select>
              <Select.Option value="Trading">贸易</Select.Option>
              <Select.Option value="Tech">科技</Select.Option>
              <Select.Option value="Manufacturing">制造</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="employees" label="员工数">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="new">新线索</Select.Option>
              <Select.Option value="contacted">已联系</Select.Option>
              <Select.Option value="interested">感兴趣</Select.Option>
              <Select.Option value="qualified">已转化</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default Leads

import React from 'react'
import { Menu } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  MailOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Link, useLocation } from 'react-router-dom'

const Sidebar = ({ collapsed }) => {
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">仪表盘</Link>,
    },
    {
      key: '/leads',
      icon: <TeamOutlined />,
      label: <Link to="/leads">线索管理</Link>,
    },
    {
      key: '/campaigns',
      icon: <MailOutlined />,
      label: <Link to="/campaigns">营销活动</Link>,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">系统设置</Link>,
    },
  ]

  return (
    <div style={{
      background: '#fff',
      height: '100vh',
      position: 'sticky',
      top: 0,
      left: 0,
      zIndex: 1000,
      boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #f0f0f0'
      }}>
        {!collapsed && <h2 style={{ color: '#667eea', margin: 0 }}>🚀 AI 外销</h2>}
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
      />
    </div>
  )
}

export default Sidebar

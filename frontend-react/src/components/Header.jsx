import React from 'react'
import { Layout, Button, Avatar, Dropdown, Space } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, LogoutOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

const { Header: AntHeader } = Layout

const Header = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  return (
    <AntHeader style={{
      background: '#fff',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 999
    }}>
      <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={onToggle} />
      
      <Space size="large">
        <Button type="text" icon={<BellOutlined />} />
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar style={{ backgroundColor: '#667eea' }}>{user?.username?.[0]?.toUpperCase()}</Avatar>
            <span style={{ color: '#666' }}>{user?.username}</span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}

export default Header

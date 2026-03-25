import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout, message } from 'antd'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Campaigns from './pages/Campaigns'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { useAuthStore } from './store/authStore'
import { useLeadStore } from './store/leadStore'

const { Content } = Layout

// 受保护的路由
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} />
      <Layout>
        <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', borderRadius: 8 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const { fetchLeads } = useLeadStore()
  const [messageApi, messageContextHolder] = message.useMessage()

  useEffect(() => {
    checkAuth()
    if (isAuthenticated) {
      fetchLeads()
    }
  }, [isAuthenticated])

  return (
    <BrowserRouter>
      {messageContextHolder}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/leads" element={
          <ProtectedRoute>
            <AppLayout>
              <Leads />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/campaigns" element={
          <ProtectedRoute>
            <AppLayout>
              <Campaigns />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App

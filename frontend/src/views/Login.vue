<template>
  <div class="login-container">
    <!-- 背景动画 -->
    <div class="bg-animation">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <div class="logo-wrapper">
            <div class="logo-icon">
              <el-icon size="40"><Global /></el-icon>
            </div>
          </div>
          <h2 class="title">Cross-Border Sales Agent</h2>
          <p class="subtitle">企业级 AI 销售自动化系统</p>
          <div class="features">
            <el-tag size="small" type="success" effect="plain">🎯 智能获客</el-tag>
            <el-tag size="small" type="primary" effect="plain">📧 自动邮件</el-tag>
            <el-tag size="small" type="warning" effect="plain">📊 数据追踪</el-tag>
          </div>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        size="large"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="请输入邮箱"
            prefix-icon="Message"
            clearable
          >
            <template #prepend>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          >
            <template #prepend>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="rememberMe" style="margin-right: 20px">记住我</el-checkbox>
          <el-link type="primary" :underline="false">忘记密码？</el-link>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-btn"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <el-divider>或</el-divider>

      <div class="demo-account">
        <p class="demo-title">🎯 演示账号</p>
        <div class="demo-credentials" @click="fillDemo">
          <el-tag size="large" effect="plain">admin@demo.com</el-tag>
          <span class="demo-hint">点击自动填充</span>
        </div>
      </div>

      <div class="login-footer">
        <p>© 2026 Cross-Border Sales Agent. All rights reserved.</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authAPI } from '@/api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const rememberMe = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ]
}

const fillDemo = () => {
  loginForm.email = 'admin@demo.com'
  loginForm.password = '123456'
  ElMessage.success('已填充演示账号')
}

const handleLogin = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true

    try {
      const res = await authAPI.login(loginForm)
      
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      if (rememberMe.value) {
        localStorage.setItem('rememberedEmail', loginForm.email)
      }
      
      ElMessage.success('登录成功')
      router.push('/')
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      loading.value = false
    }
  })
}

// 加载记住的邮箱
if (localStorage.getItem('rememberedEmail')) {
  loginForm.email = localStorage.getItem('rememberedEmail')
  rememberMe.value = true
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* 背景动画 */
.bg-animation {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  right: -50px;
  animation-delay: 5s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: 10%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-30px) rotate(180deg);
  }
}

.login-card {
  width: 480px;
  z-index: 1;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  padding: 10px 0;
}

.logo-wrapper {
  display: inline-block;
  margin-bottom: 20px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin: 0 auto;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.subtitle {
  margin: 0 0 20px;
  color: #909399;
  font-size: 14px;
}

.features {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 12px 15px;
}

:deep(.el-input__inner) {
  font-size: 15px;
}

.login-btn {
  width: 100%;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  height: 46px;
  transition: all 0.3s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

.demo-account {
  text-align: center;
  padding: 10px 0;
}

.demo-title {
  margin: 0 0 10px;
  font-size: 14px;
  color: #606266;
}

.demo-credentials {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 15px;
  border-radius: 8px;
  background: #f5f7fa;
  transition: all 0.3s;
}

.demo-credentials:hover {
  background: #ecf5ff;
}

.demo-hint {
  font-size: 12px;
  color: #909399;
}

.login-footer {
  text-align: center;
  padding: 15px 0 5px;
  color: #c0c4cc;
  font-size: 12px;
}
</style>

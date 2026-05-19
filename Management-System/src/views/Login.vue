<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="bg-orb orb-3"></div>
      <div class="bg-grid"></div>
    </div>
    
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-header">
          <div class="brand-icon">
            <el-icon :size="32"><Grid /></el-icon>
          </div>
          <h1>智能柜管理</h1>
          <p class="subtitle">Smart Cabinet Admin</p>
        </div>
        
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="管理员账号"
              size="large"
              prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              size="large"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="login-btn"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="login-tips">
          <el-icon :size="14"><InfoFilled /></el-icon>
          <p>管理员账号：11位相同数字手机号 + 昵称包含"lk"</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入管理员账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  try {
    const res = await login(form)
    userStore.setToken(res.data.token)
    userStore.setUserInfo(res.data.userInfo)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

// 背景装饰
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  
  &.orb-1 {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(0, 122, 255, 0.35), transparent 70%);
    top: -15%;
    right: -10%;
  }
  
  &.orb-2 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(52, 199, 89, 0.3), transparent 70%);
    bottom: -10%;
    left: -10%;
  }
  
  &.orb-3 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255, 149, 0, 0.25), transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
}

.login-wrapper {
  position: relative;
  z-index: 1;
}

.login-card {
  width: 380px;
  padding: 40px 36px;
  @include glass-heavy;
  border-radius: var(--radius-2xl);
  box-shadow: var(--glass-shadow-heavy);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
  
  .brand-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    background: var(--primary);
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3);
  }
  
  h1 {
    font-size: 26px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin-bottom: 6px;
  }
  
  .subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 400;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 16px;
  }
  
  :deep(.el-input__wrapper) {
    padding: 14px 16px;
    border-radius: var(--radius-md);
  }
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: var(--radius-md);
  margin-top: 8px;
}

.login-tips {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 28px;
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: var(--radius-md);
  
  .el-icon {
    color: var(--text-tertiary);
  }
  
  p {
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.5;
  }
}
</style>

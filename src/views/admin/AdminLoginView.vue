<template>
  <div class="admin-login-container">
    <div class="login-wrapper">
      <div class="login-header">
        <h1 class="login-title">论文格式检查系统</h1>
        <p class="login-subtitle">管理员登录</p>
      </div>
      <el-card class="login-card" shadow="hover">
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入管理员账号"
              size="large"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入管理员密码"
              size="large"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
  
          <el-form-item class="login-actions">
            <el-button
              type="primary"
              class="login-button"
              size="large"
              block
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
          <div class="login-footer">
            <el-link type="primary" @click="navigateToForgotPassword" style="font-size: 14px;">
              忘记密码？
            </el-link>
          </div>
        </el-form>
      </el-card>
      <div class="login-copyright">
        <p>&copy; {{ new Date().getFullYear() }} 论文格式检查系统. 保留所有权利.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, View, RefreshRight } from '@element-plus/icons-vue'
import { adminLogin } from '../../api/admin'
import tokenManager from '../../utils/tokenManager'

const router = useRouter()
const route = useRoute()
const loginFormRef = ref()
const loading = ref(false)
const showCaptcha = ref(false)
const captchaImage = ref('')

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  captcha: ''
})

// 表单验证规则
const loginRules = reactive({
  username: [
    { required: true, message: '请输入管理员账号', trigger: 'blur' },
    { min: 4, max: 20, message: '账号长度在 4 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入管理员密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],

})

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
    loading.value = true

    // 调用管理员登录API
    const response = await adminLogin(loginForm.username, loginForm.password)

    // 登录成功后返回的用户信息包含role字段
    const userData = response
    userData.role = 'admin' // 确保角色为admin

    // 使用tokenManager存储token和用户信息
    if (userData.access_token) {
      tokenManager.setTokens(
        userData.access_token,
        userData.refresh_token,
        userData.token_type || 'Bearer',
        userData.expires_in || 3600
      )
      localStorage.setItem('token', userData.access_token)
    }
    localStorage.setItem('user', JSON.stringify(userData))

    ElMessage.success('登录成功')

    // 跳转到管理员后台首页
    const redirect = route.query.redirect || '/admin'
    router.push(redirect)
  } catch (error) {

    ElMessage.error(error.response?.data?.message || '登录失败，请检查账号和密码')
    // 登录失败显示验证码
    showCaptcha.value = true
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}


// 跳转到忘记密码页面
const navigateToForgotPassword = () => {
  router.push('/admin/forgot-password')
}

// 组件挂载时初始化
onMounted(() => {
  // 可以根据需求决定是否默认显示验证码
  // refreshCaptcha()
})
</script>

<style scoped>
.admin-login-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-wrapper {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
  color: white;
}

.login-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.login-subtitle {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.9;
}

.login-card {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-form {
  padding: 32px;
}

.login-actions {
  margin-top: 24px;
}

.login-button {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.login-footer {
  text-align: center;
  margin-top: 16px;
}

.captcha-image-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.captcha-image {
  width: 120px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
  object-fit: cover;
}

.captcha-refresh {
  cursor: pointer;
  color: #606266;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.captcha-refresh:hover {
  color: #409eff;
}

.login-copyright {
  margin-top: 32px;
  color: white;
  font-size: 14px;
  opacity: 0.8;
}

/* 响应式设计 */
@media (max-width: 576px) {
  .login-title {
    font-size: 2rem;
  }

  .login-subtitle {
    font-size: 1rem;
  }

  .login-form {
    padding: 24px;
  }

  .login-button {
    height: 44px;
    font-size: 14px;
  }
}
</style>
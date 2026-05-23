<template>
  <div class="forgot-password-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>
    
    <div class="forgot-password-box">
      <!-- 标题 -->
      <div class="forgot-header">
        <div class="forgot-logo">
          <el-icon size="64" color="var(--el-color-primary)"><Lock /></el-icon>
        </div>
        <h2 class="forgot-title">忘记密码</h2>
        <p class="forgot-subtitle">{{ stepDescription }}</p>
      </div>
      
      <!-- 步骤指示器 -->
      <div class="step-indicator">
        <div class="step" :class="{ active: currentStep >= 1, done: currentStep > 1 }">
          <span class="step-num">1</span>
          <span class="step-text">验证邮箱</span>
        </div>
        <div class="step-line" :class="{ active: currentStep > 1 }"></div>
        <div class="step" :class="{ active: currentStep >= 2, done: currentStep > 2 }">
          <span class="step-num">2</span>
          <span class="step-text">输入验证码</span>
        </div>
        <div class="step-line" :class="{ active: currentStep > 2 }"></div>
        <div class="step" :class="{ active: currentStep >= 3 }">
          <span class="step-num">3</span>
          <span class="step-text">重置密码</span>
        </div>
      </div>
      
      <!-- Step 1: 输入邮箱 -->
      <div v-if="currentStep === 1" class="step-content">
        <el-form :model="emailForm" :rules="emailRules" ref="emailFormRef" label-position="top">
          <el-form-item label="邮箱地址" prop="email">
            <el-input 
              v-model="emailForm.email" 
              placeholder="请输入注册时使用的邮箱"
              prefix-icon="Message"
              size="large"
              clearable
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              :loading="loading" 
              @click="sendVerificationCode"
              size="large"
              class="submit-btn"
            >
              发送验证码
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- Step 2: 输入验证码 -->
      <div v-if="currentStep === 2" class="step-content">
        <el-form :model="codeForm" :rules="codeRules" ref="codeFormRef" label-position="top">
          <el-form-item label="验证码" prop="code">
            <div class="code-input-group">
              <el-input 
                v-model="codeForm.code" 
                placeholder="请输入6位验证码"
                prefix-icon="Key"
                size="large"
                maxlength="6"
              />
              <el-button 
                type="primary" 
                :disabled="countdown > 0"
                @click="resendCode"
                size="large"
              >
                {{ countdown > 0 ? `${countdown}s后重发` : '重新发送' }}
              </el-button>
            </div>
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              :loading="loading" 
              @click="verifyCode"
              size="large"
              class="submit-btn"
            >
              验证
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- Step 3: 重置密码 -->
      <div v-if="currentStep === 3" class="step-content">
        <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-position="top">
          <el-form-item label="新密码" prop="password">
            <el-input 
              v-model="passwordForm.password" 
              type="password" 
              placeholder="请输入新密码（至少6位）"
              prefix-icon="Lock"
              show-password
              size="large"
            />
          </el-form-item>
          
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input 
              v-model="passwordForm.confirmPassword" 
              type="password" 
              placeholder="请再次输入新密码"
              prefix-icon="Lock"
              show-password
              size="large"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              :loading="loading" 
              @click="resetPassword"
              size="large"
              class="submit-btn"
            >
              重置密码
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- Step 4: 完成 -->
      <div v-if="currentStep === 4" class="step-content success-content">
        <el-icon class="success-icon"><CircleCheck /></el-icon>
        <h3>密码重置成功！</h3>
        <p>您的密码已成功重置，请使用新密码登录</p>
        <el-button type="primary" size="large" @click="goToLogin">
          立即登录
        </el-button>
      </div>
      
      <!-- 返回登录链接 -->
      <div class="back-link" v-if="currentStep < 4">
        <el-link type="primary" :underline="false" @click="goToLogin">
          <el-icon><ArrowLeft /></el-icon>
          返回登录
        </el-link>
      </div>
      
      <!-- 页脚信息 -->
      <div class="forgot-footer">
        <p>© 2024 论文格式检查系统 | 保护您的隐私安全</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, Message, Key, CircleCheck, ArrowLeft } from '@element-plus/icons-vue'
import { sendResetCode, verifyResetCode, resetPasswordByCode } from '../api/auth'

const router = useRouter()

// 当前步骤
const currentStep = ref(1)
const loading = ref(false)
const countdown = ref(0)
let countdownTimer = null

// 表单引用
const emailFormRef = ref()
const codeFormRef = ref()
const passwordFormRef = ref()

// 表单数据
const emailForm = reactive({
  email: ''
})

const codeForm = reactive({
  code: ''
})

const passwordForm = reactive({
  password: '',
  confirmPassword: ''
})

// 重置token（后端返回）
const resetToken = ref('')

// 步骤描述
const stepDescription = computed(() => {
  const descriptions = {
    1: '请输入您注册时使用的邮箱地址',
    2: '我们已向您的邮箱发送了验证码',
    3: '请设置您的新密码',
    4: '密码重置成功'
  }
  return descriptions[currentStep.value]
})

// 表单验证规则
const emailRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}

const codeRules = {
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ]
}

const passwordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 发送验证码
const sendVerificationCode = async () => {
  if (!emailFormRef.value) return

  try {
    await emailFormRef.value.validate()
    loading.value = true

    const result = await sendResetCode(emailForm.email)
    if (result?.reset_code) {
      codeForm.code = result.reset_code
      ElMessage.success(`Reset code: ${result.reset_code}`)
    } else {
      ElMessage.success('Reset code sent')
    }
    currentStep.value = 2
    startCountdown()
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    loading.value = false
  }
}

// 重新发送验证码
const resendCode = async () => {
  if (countdown.value > 0) return

  try {
    loading.value = true
    const result = await sendResetCode(emailForm.email)
    if (result?.reset_code) {
      codeForm.code = result.reset_code
      ElMessage.success(`Reset code: ${result.reset_code}`)
    } else {
      ElMessage.success('Reset code resent')
    }
    startCountdown()
  } catch (error) {
    ElMessage.error('Send failed, please try again')
  } finally {
    loading.value = false
  }
}

// 验证验证码
const verifyCode = async () => {
  if (!codeFormRef.value) return
  
  try {
    await codeFormRef.value.validate()
    loading.value = true
    
    const result = await verifyResetCode(emailForm.email, codeForm.code)
    resetToken.value = result.reset_token
    
    ElMessage.success('验证成功')
    currentStep.value = 3
  } catch (error) {
    ElMessage.error(error.message || '验证码错误')
  } finally {
    loading.value = false
  }
}

// 重置密码
const resetPassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    loading.value = true
    
    await resetPasswordByCode(resetToken.value, passwordForm.password)
    
    ElMessage.success('密码重置成功')
    currentStep.value = 4
  } catch (error) {
    ElMessage.error(error.message || '重置密码失败')
  } finally {
    loading.value = false
  }
}

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
    }
  }, 1000)
}

// 返回登录页
const goToLogin = () => {
  router.push('/login')
}

// 清理定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.forgot-password-container {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
}

.circle-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.circle-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.forgot-password-box {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 480px;
  padding: 40px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.forgot-header {
  margin-bottom: 30px;
}

.forgot-logo {
  margin-bottom: 15px;
  color: var(--el-color-primary);
}

.forgot-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.forgot-subtitle {
  font-size: 0.95rem;
  color: #7f8c8d;
  margin: 0;
}

.step-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #999;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.step.active .step-num {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.step.done .step-num {
  background: #10b981;
  color: white;
}

.step-text {
  font-size: 12px;
  color: #999;
}

.step.active .step-text,
.step.done .step-text {
  color: #333;
}

.step-line {
  width: 60px;
  height: 2px;
  background: #e0e0e0;
  margin: 0 10px 20px;
  transition: background 0.3s ease;
}

.step-line.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.step-content {
  text-align: left;
  margin-bottom: 20px;
}

.code-input-group {
  display: flex;
  gap: 12px;
}

.code-input-group .el-input {
  flex: 1;
}

.submit-btn {
  width: 100%;
  font-size: 16px;
}

.success-content {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  font-size: 64px;
  color: #10b981;
  margin-bottom: 20px;
}

.success-content h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 10px;
}

.success-content p {
  color: #666;
  margin-bottom: 24px;
}

.back-link {
  margin-top: 20px;
}

.back-link .el-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.forgot-footer {
  margin-top: 30px;
  text-align: center;
}

.forgot-footer p {
  font-size: 0.8rem;
  color: #999;
  margin: 0;
}

@media (max-width: 768px) {
  .forgot-password-box {
    padding: 24px;
    margin: 10px;
  }
  
  .step-text {
    display: none;
  }
  
  .step-line {
    width: 40px;
    margin-bottom: 0;
  }
}
</style>

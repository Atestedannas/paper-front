<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>
    
    <div class="login-box">
      <!-- 登录标题 -->
      <div class="login-header">
        <div class="login-logo">
          <el-icon size="64" color="var(--el-color-primary)"><Document /></el-icon>
        </div>
        <h2 class="login-title">论文格式检查系统</h2>
        <p class="login-subtitle">专业、高效、安全的论文格式检查服务</p>
      </div>
      
      <!-- 登录方式切换 -->
      <div class="login-tabs segmented">
        <button class="seg-btn" :class="{ active: activeTab === 'account' }" @click="activeTab = 'account'">账号密码</button>
        <button class="seg-btn" :class="{ active: activeTab === 'qr' }" @click="activeTab = 'qr'">扫码登录</button>
      </div>
      
      <!-- 账号密码登录表单 -->
      <div class="switch-wrap">
        <div v-if="activeTab === 'account'" class="login-form">
          <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-position="top">
            <el-form-item label="邮箱" prop="email">
              <el-input 
                v-model="loginForm.email" 
                placeholder="请输入邮箱地址"
                prefix-icon="Message"
                clearable
                size="large"
              />
            </el-form-item>
            
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                prefix-icon="Lock"
                size="large"
              >
                <template #suffix>
                  <el-icon class="eye-toggle" @click="showPassword = !showPassword"><View /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            
            <el-form-item>
              <div class="login-form-actions">
                <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
                <el-link type="primary" :underline="false" @click="goToForgotPassword">忘记密码？</el-link>
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                :loading="loading" 
                @click="handleLogin" 
                block
                size="large"
                class="login-btn"
              >
                登录
              </el-button>
            </el-form-item>
            
          </el-form>
        </div>
        
        <div v-if="activeTab === 'qr'" class="qr-content">
          <!-- 平台切换 -->
          <div class="qr-provider-tabs">
            <button
              class="provider-btn"
              :class="{ active: qrProvider === 'wechat' }"
              @click="qrProvider = 'wechat'"
            >
              <el-icon><ChatLineRound /></el-icon> 微信
            </button>
            <button
              class="provider-btn"
              :class="{ active: qrProvider === 'alipay' }"
              @click="qrProvider = 'alipay'"
            >
              <el-icon><CircleCheck /></el-icon> 支付宝
            </button>
          </div>

          <!-- 二维码区域 -->
          <div class="qr-box">
            <!-- 加载中 -->
            <div v-if="qrLoading" class="qr-state">
              <el-icon size="36" class="spin-icon"><Loading /></el-icon>
              <span>正在获取二维码...</span>
            </div>

            <!-- 错误/过期 -->
            <div v-else-if="qrError" class="qr-state qr-state--error">
              <p class="qr-err-msg">{{ qrError }}</p>
              <el-button size="small" @click="loadQrCode(qrProvider)">
                <el-icon><Refresh /></el-icon>&nbsp;刷新
              </el-button>
            </div>

            <!-- 正常显示 QR -->
            <div v-else-if="qrImageUrl" class="qr-image-wrap">
              <img
                :src="qrImageUrl"
                :alt="qrProvider === 'wechat' ? '微信扫码登录' : '支付宝扫码登录'"
                class="qr-img"
                draggable="false"
              />
              <div class="qr-brand" :class="qrProvider">
                <el-icon size="22"><ChatLineRound v-if="qrProvider === 'wechat'" /><CircleCheck v-else /></el-icon>
              </div>
            </div>

            <!-- 空白占位 -->
            <div v-else class="qr-state">
              <span>正在初始化...</span>
            </div>
          </div>

          <p class="qr-tip">
            {{ qrProvider === 'wechat' ? '请用微信扫一扫登录' : '请用支付宝扫一扫登录' }}
          </p>
          <p class="qr-tip qr-tip--sub">有效期 {{ QR_EXPIRE_MINUTES }} 分钟，过期请刷新</p>

          <!-- 直接跳转按钮（移动端备用） -->
          <el-button
            v-if="qrAuthUrl"
            type="primary"
            plain
            size="small"
            class="open-btn"
            @click="openAuthPage"
          >
            在浏览器中打开授权页
          </el-button>
        </div>
      </div>
      
      <!-- 页脚信息 -->
      <div class="login-footer">
        <p>© 2024 论文格式检查系统 | 保护您的隐私安全</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, Document, Message, ChatLineRound, CircleCheck, Loading, View, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import { getWeChatLoginUrl, createAlipayQrSession, getAlipayQrSessionStatus } from '../api/auth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loginFormRef = ref()
const loading = ref(false)
const activeTab = ref('account')
const showPassword = ref(false)

// QR 状态
const qrProvider = ref('wechat')   // 当前显示哪个平台的二维码
const qrLoading = ref(false)
const qrError = ref('')
const qrImageUrl = ref('')         // 渲染用的二维码图片 URL
const qrAuthUrl = ref('')          // 供直接跳转
const qrSessionId = ref('')
const QR_EXPIRE_MINUTES = 5
const WECHAT_OAUTH_STATE_KEY = 'oauth_state_wechat'
const ALIPAY_QR_POLL_MS = 2000
let qrTimer = null
let qrPollTimer = null

const loginForm = reactive({ email: '', password: '', remember: false })
const loginRules = reactive({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

// 账号密码登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
    loading.value = true
    await userStore.login(loginForm.email, loginForm.password)
    if (loginForm.remember) {
      localStorage.setItem('remembered_email', loginForm.email)
    } else {
      localStorage.removeItem('remembered_email')
    }
    ElMessage.success('登录成功')
    const redirect = router.currentRoute.value.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    ElMessage.error(error?.message || '登录失败，请重试')
  } finally {
    loading.value = false
  }
}

// 生成二维码图片 URL（使用公共 QR 图片 API）
const makeQRImageUrl = (text) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&data=${encodeURIComponent(text)}`

const saveAuthData = (data) => {
  userStore.setAuthSession(data)
}

const clearQrPolling = () => {
  if (qrPollTimer) {
    clearTimeout(qrPollTimer)
    qrPollTimer = null
  }
}

const scheduleAlipayQrPoll = () => {
  clearQrPolling()
  qrPollTimer = setTimeout(pollAlipayQrStatus, ALIPAY_QR_POLL_MS)
}

const pollAlipayQrStatus = async () => {
  if (!qrSessionId.value || qrProvider.value !== 'alipay' || activeTab.value !== 'qr') return
  try {
    const result = await getAlipayQrSessionStatus(qrSessionId.value)
    if (result?.status === 'authorized') {
      saveAuthData(result)
      clearQrPolling()
      clearQrTimer()
      ElMessage.success('登录成功')
      const redirect = router.currentRoute.value.query.redirect || '/'
      await router.push(redirect)
      return
    }
    if (result?.status === 'failed') {
      qrError.value = result?.message || '支付宝授权失败，请刷新二维码重试'
      qrImageUrl.value = ''
      clearQrPolling()
      return
    }
    if (result?.status === 'expired') {
      qrError.value = '二维码已过期，请刷新'
      qrImageUrl.value = ''
      clearQrPolling()
      return
    }
    scheduleAlipayQrPoll()
  } catch (error) {
    qrError.value = '登录状态检查失败，请刷新二维码重试'
    qrImageUrl.value = ''
    clearQrPolling()
  }
}

// 加载指定平台的二维码
const loadQrCode = async (provider) => {
  qrLoading.value = true
  qrError.value = ''
  qrImageUrl.value = ''
  qrAuthUrl.value = ''
  qrSessionId.value = ''
  clearQrTimer()
  clearQrPolling()

  try {
    let result
    if (provider === 'wechat') {
      result = await getWeChatLoginUrl()
    } else {
      result = await createAlipayQrSession()
    }
    const authUrl = result?.auth_url
    const state = result?.state
    const sessionId = result?.session_id
    if (!authUrl) {
      qrError.value = provider === 'wechat'
        ? '微信登录暂未配置，请联系管理员'
        : '支付宝登录暂未配置，请联系管理员'
      return
    }
    if (provider === 'wechat' && state) {
      sessionStorage.setItem(WECHAT_OAUTH_STATE_KEY, state)
    } else if (provider === 'wechat') {
      sessionStorage.removeItem(WECHAT_OAUTH_STATE_KEY)
    }
    if (provider === 'alipay') {
      qrSessionId.value = sessionId || ''
    }
    qrAuthUrl.value = authUrl
    // 保存跳转后的 redirect 目标
    const redirect = router.currentRoute.value.query.redirect || '/'
    sessionStorage.setItem('oauth_redirect', redirect)
    // 生成 QR 图片
    qrImageUrl.value = makeQRImageUrl(authUrl)
    // 5 分钟后过期，提示刷新
    qrTimer = setTimeout(() => {
      qrError.value = '二维码已过期，请刷新'
      qrImageUrl.value = ''
      clearQrPolling()
    }, QR_EXPIRE_MINUTES * 60 * 1000)
    if (provider === 'alipay') {
      if (qrSessionId.value) {
        scheduleAlipayQrPoll()
      } else {
        qrError.value = ''
      }
    }
  } catch (err) {
    const errMsg = err?.response?.data?.msg || err?.response?.data?.message || err?.message || '获取二维码失败，请重试'
    qrError.value = errMsg
  } finally {
    qrLoading.value = false
  }
}

const clearQrTimer = () => { if (qrTimer) { clearTimeout(qrTimer); qrTimer = null } }

// 直接跳转（备用按钮，移动端更友好）
const openAuthPage = () => {
  if (qrAuthUrl.value) window.open(qrAuthUrl.value, '_blank')
}

// 切换平台时重新加载
watch(qrProvider, (p) => {
  if (activeTab.value === 'qr') loadQrCode(p)
})

// 切到扫码 tab 时自动加载微信 QR
watch(activeTab, (tab) => {
  if (tab === 'qr') loadQrCode(qrProvider.value)
})

const goToForgotPassword = () => router.push('/forgot-password')

onMounted(() => {
  const remembered = localStorage.getItem('remembered_email')
  if (remembered) { loginForm.email = remembered; loginForm.remember = true }

  const provider = route.query.provider === 'alipay' ? 'alipay' : 'wechat'
  if (route.query.tab === 'qr' || route.query.oauth_error) {
    qrProvider.value = provider
    activeTab.value = 'qr'
  }
  if (route.query.oauth_error) {
    ElMessage.warning(String(route.query.oauth_error))
    const { oauth_error, tab, provider: _provider, ...restQuery } = route.query
    router.replace({ path: '/login', query: { ...restQuery, tab: 'qr', provider } })
  }
})
onUnmounted(() => {
  clearQrTimer()
  clearQrPolling()
})
</script>

<style scoped>
/* 全屏背景 - 确保覆盖整个视口高度 */
.login-container {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: linear-gradient(to top, #a8edea 0%, #fed6e3 100%);
  padding: var(--spacing-lg);
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

/* 背景装饰 */
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
  animation-delay: 0s;
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

/* 登录框 */
.login-box {
  background-image: linear-gradient(-225deg, #E3FDF5 50%, #FFE6FA 50%);
  border-radius: 16px;
  box-shadow: 0 9px 50px rgba(20, 20, 20, 0.15);
  width: 100%;
  max-width: 450px;
  padding: 32px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
  position: relative;
  z-index: 1;
  min-height: 640px;
}

/* 登录头部 */
.login-header {
  margin-bottom: 30px;
}

/* 登录图标 */
.login-logo {
  margin-bottom: 15px;
  color: var(--el-color-primary);
}

/* 登录标题 */
.login-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 登录副标题 */
.login-subtitle {
  font-size: 0.95rem;
  color: #7f8c8d;
  margin: 0;
  font-weight: 400;
}

/* 登录方式切换标签 */
.login-tabs.segmented {
  display: inline-flex;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 24px;
}
.seg-btn {
  padding: 10px 18px;
  font-size: 14px;
  min-width: 120px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #475569;
}
.seg-btn.active {
  background: #111827;
  color: #fff;
}

/* 登录表单 */
.switch-wrap {
  min-height: 420px;
  overflow: hidden;
}

.login-form {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 16px;
}

.login-form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.register-link { display: none; }
.eye-toggle {
  cursor: pointer;
}

/* QR 区域整体 */
.qr-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 8px;
  gap: 12px;
}

/* 平台切换 */
.qr-provider-tabs {
  display: inline-flex;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 999px;
  overflow: hidden;
  gap: 0;
}
.provider-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  font-size: 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #555;
  transition: all 0.2s;
}
.provider-btn.active {
  background: #111827;
  color: #fff;
}

/* 二维码框 */
.qr-box {
  width: 212px;
  height: 212px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  overflow: hidden;
  position: relative;
}

/* 状态占位 */
.qr-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #888;
  font-size: 14px;
  padding: 16px;
  text-align: center;
}
.qr-state--error { color: var(--el-color-danger, #f56c6c); }
.qr-err-msg { margin: 0; font-size: 13px; }

/* QR 图片 */
.qr-image-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.qr-img {
  width: 200px;
  height: 200px;
  display: block;
}
/* 品牌角标 */
.qr-brand {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.qr-brand.wechat { background: #07C160; color: #fff; }
.qr-brand.alipay { background: #1677FF; color: #fff; }

/* 提示文字 */
.qr-tip {
  font-size: 14px;
  color: #666;
  margin: 0;
  text-align: center;
}
.qr-tip--sub { font-size: 12px; color: #aaa; }

/* 在浏览器打开按钮 */
.open-btn { margin-top: 4px; }

/* 旋转动画 */
.spin-icon { animation: qr-spin 1.2s linear infinite; }
@keyframes qr-spin { to { transform: rotate(360deg); } }

/* 页脚信息 */
.login-footer {
  text-align: center;
}

.login-footer p {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-box {
    padding: 24px;
    min-height: 560px;
  }
  .qr-code {
    width: 180px;
    height: 180px;
  }
  .third-party-options {
    gap: var(--spacing-lg);
  }
  .switch-wrap { min-height: 380px; }
}
</style>

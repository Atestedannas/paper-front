<template>
  <div class="oauth-callback">
    <div class="callback-card">
      <el-icon class="spin-icon" size="48" color="var(--el-color-primary)">
        <Loading />
      </el-icon>
      <p class="status-text">{{ statusText }}</p>
      <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>
      <el-button v-if="errorMsg" type="primary" @click="goToLogin">返回登录</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { handleWeChatCallback, handleAlipayCallback } from '@/api/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const statusText = ref('正在处理登录...')
const errorMsg = ref('')
const WECHAT_OAUTH_STATE_KEY = 'oauth_state_wechat'
const OAUTH_RETRY_DELAY = 1200

const getRetryProvider = () => route.params.provider === 'alipay' ? 'alipay' : 'wechat'

const goToLogin = () => {
  const provider = getRetryProvider()
  router.replace({ path: '/login', query: { tab: 'qr', provider } })
}

const retryQrLogin = (message, redirectTarget = sessionStorage.getItem('oauth_redirect') || '/') => {
  const provider = getRetryProvider()
  errorMsg.value = message
  statusText.value = '登录失败，正在重新获取二维码...'
  setTimeout(() => {
    router.replace({
      path: '/login',
      query: {
        tab: 'qr',
        provider,
        redirect: redirectTarget,
        oauth_error: message
      }
    })
  }, OAUTH_RETRY_DELAY)
}

const saveAuthData = (data) => {
  userStore.setAuthSession(data)
}

onMounted(async () => {
  const provider = route.params.provider   // 'wechat' | 'alipay'
  const { code, auth_code, state, error, error_description } = route.query

  // 授权被拒绝
  if (error) {
    retryQrLogin(error_description || `授权失败：${error}`)
    return
  }

  const redirect = sessionStorage.getItem('oauth_redirect') || '/'
  sessionStorage.removeItem('oauth_redirect')

  try {
    let data
    if (provider === 'wechat') {
      if (!code) { retryQrLogin('缺少微信授权码，请重新扫码', redirect); return }
      statusText.value = '正在验证微信身份...'
      const savedState = sessionStorage.getItem(WECHAT_OAUTH_STATE_KEY)
      if (state && savedState && state !== savedState) {
        retryQrLogin('微信登录状态已失效，请重新扫码', redirect)
        return
      }
      data = await handleWeChatCallback(code, state || savedState)
      sessionStorage.removeItem(WECHAT_OAUTH_STATE_KEY)
    } else if (provider === 'alipay') {
      const authCode = auth_code || code
      if (!authCode) { retryQrLogin('缺少支付宝授权码，请重新扫码', redirect); return }
      statusText.value = '正在验证支付宝身份...'
      data = await handleAlipayCallback(authCode)
    } else {
      retryQrLogin(`未知的登录平台：${provider}`, redirect)
      return
    }

    saveAuthData(data)
    statusText.value = '登录成功，正在跳转...'
    ElMessage.success('登录成功')
    await router.replace(redirect)
  } catch (err) {
    console.error('OAuth callback error:', err)
    retryQrLogin(err?.message || '登录失败，请重新扫码', redirect)
  }
})
</script>

<style scoped>
.oauth-callback {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to top, #a8edea, #fed6e3);
}
.callback-card {
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-width: 280px;
}
.spin-icon { animation: spin 1.2s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.status-text { font-size: 16px; color: #333; margin: 0; }
.error-text { font-size: 14px; color: var(--el-color-danger); margin: 0; max-width: 280px; }
</style>


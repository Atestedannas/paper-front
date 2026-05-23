<template>
  <el-dialog
    v-model="showPaymentDialog"
    title="支付确认"
    width="440px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="true"
    align-center
    append-to-body
    class="payment-dialog"
  >
    <template #default>
      <Loading v-if="false" />
    <div class="payment-content">
      <h3 class="payment-title">论文格式修正服务</h3>
      <p class="payment-desc">支付后即可查看格式修改前后的差异对比并下载修正后的文件</p>
      
      <div class="payment-amount">
        <span class="amount-label">支付金额:</span>
        <span class="amount-value">¥{{ amount }}</span>
      </div>

      <el-radio-group v-model="payChannel" class="pay-channel" @change="onPayChannelChange">
        <el-radio-button label="wechat">微信扫码</el-radio-button>
        <el-radio-button label="alipay">支付宝扫码</el-radio-button>
      </el-radio-group>

      <!-- 微信 -->
      <div v-show="payChannel === 'wechat'" class="qrcode-container">
        <div class="wechat-pay-header">
          <div class="wechat-badge">
            <div class="method-icon wechat-icon-sm"></div>
            <span>微信扫码支付</span>
          </div>
        </div>
        <div class="qrcode-placeholder">
          <div class="qrcode-demo" v-if="wechatLoading">
            <div class="qrcode-box">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <p>正在生成二维码...</p>
            </div>
          </div>
          <div v-else-if="wechatQrCodeUrl" class="qrcode-wrapper">
            <img :src="wechatQrCodeUrl" alt="微信支付二维码" class="qrcode-image" />
          </div>
          <div v-else class="qrcode-box">
            <p style="color:#909399;font-size:13px">二维码加载失败，请重试</p>
          </div>
        </div>
        <p class="qrcode-tip">请使用微信扫一扫完成支付</p>
      </div>

      <!-- 支付宝 -->
      <div v-show="payChannel === 'alipay'" class="qrcode-container">
        <div class="alipay-pay-header">
          <div class="alipay-badge">
            <span class="alipay-dot"></span>
            <span>支付宝支付</span>
          </div>
        </div>
        <div class="qrcode-placeholder">
          <div class="qrcode-demo" v-if="alipayLoading">
            <div class="qrcode-box">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <p>正在生成支付链接...</p>
            </div>
          </div>
          <!-- precreate / wap 模式：二维码 -->
          <div v-else-if="(alipayPayType === 'precreate' || alipayPayType === 'wap') && alipayQrCodeUrl" class="qrcode-wrapper">
            <img :src="alipayQrCodeUrl" alt="支付宝支付二维码" class="qrcode-image" />
          </div>
          <!-- page 模式：跳转按钮 -->
          <div v-else-if="alipayPayType === 'page' && alipayPayUrl" class="alipay-page-pay">
            <el-button type="primary" size="large" class="alipay-open-btn" @click="openAlipayPage">
              前往支付宝付款
            </el-button>
            <p class="alipay-page-tip">点击按钮将在新窗口打开支付宝收银台</p>
          </div>
          <div v-else class="qrcode-box">
            <p style="color:#909399;font-size:13px">支付链接生成失败，请重试</p>
          </div>
        </div>
        <p v-if="alipayPayType === 'precreate' || alipayPayType === 'wap'" class="qrcode-tip">请使用支付宝或手机浏览器扫码完成支付</p>
        <p v-else-if="alipayPayType === 'page'" class="qrcode-tip">完成付款后页面将自动更新状态</p>
      </div>
    </div>
    
    </template>
    
    <template #footer>
      <div class="payment-footer">
        <el-button @click="cancelPayment">取消支付</el-button>
        <el-button
          v-if="pollingTimedOut && !isPaid"
          type="warning"
          @click="manualCheckPayment"
        >
          我已支付，手动查询
        </el-button>
        <el-button
          type="primary"
          @click="confirmPayment"
          :disabled="!isPaid"
        >
          {{ isPaid ? '支付成功，查看结果' : '等待支付中...' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { createPayment, getOrderStatus } from '../api/order'

// 定义 props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  amount: {
    type: Number,
    default: 9.9
  },
  orderId: {
    type: String,
    default: ''
  }
})

// 定义 emits
const emit = defineEmits(['update:modelValue', 'payment-success', 'payment-cancel', 'payment-error'])

// 响应式数据
const showPaymentDialog = ref(props.modelValue)
const payChannel = ref('wechat')
const selectedMethod = ref('')
const isPaid = ref(false)
const paymentTimer = ref(null)
const isCompletingPayment = ref(false)
// 分别存储微信和支付宝的二维码
const wechatQrCodeUrl = ref('')
const alipayQrCodeUrl = ref('')
const alipayPayUrl = ref('')
const alipayPayType = ref('')
// 分别存储微信和支付宝的加载状态
const wechatLoading = ref(false)
const alipayLoading = ref(false)

// 监听 props 变化：弹窗打开时自动加载微信二维码
watch(() => props.modelValue, (newVal) => {
  showPaymentDialog.value = newVal
  if (newVal) {
    isCompletingPayment.value = false
    resetPayment()
    payChannel.value = 'wechat'
    loadWechatQr()
  }
})

// 支付成功后自动触发，2秒后关闭弹窗并开始上传
watch(isPaid, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      if (showPaymentDialog.value) {
        isCompletingPayment.value = true
        emit('payment-success')
        showPaymentDialog.value = false
      }
    }, 2000)
  }
})

// 监听对话框状态变化
watch(showPaymentDialog, (newVal, oldVal) => {
  if (!newVal) {
    if (oldVal && !isCompletingPayment.value) {
      if (isPaid.value) {
        isCompletingPayment.value = true
        emit('payment-success')
      } else {
        emit('payment-cancel')
      }
    }
    resetPayment()
  }
  emit('update:modelValue', newVal)
})

const onPayChannelChange = () => {
  if (payChannel.value === 'wechat') loadWechatQr()
  else loadAlipayQr()
}

const loadWechatQr = async () => {
  if (selectedMethod.value === 'wechat' && wechatQrCodeUrl.value) {
    startPaymentPolling()
    return
  }

  if (paymentTimer.value) {
    clearInterval(paymentTimer.value)
    paymentTimer.value = null
  }

  selectedMethod.value = 'wechat'
  isPaid.value = false

  try {
    wechatLoading.value = true
    const paymentResponse = await createPayment(props.orderId, 'wechat')
    const qrCodeUrl = paymentResponse?.payment_params?.qr_code_url
    if (!qrCodeUrl) throw new Error('微信二维码链接为空')
    wechatQrCodeUrl.value = qrCodeUrl
    wechatLoading.value = false
    startPaymentPolling()
  } catch (error) {
    wechatLoading.value = false
    ElMessage.error('获取微信二维码失败，请重试')
    emit('payment-error', error)
    console.error(error)
  }
}

const loadAlipayQr = async () => {
  if (selectedMethod.value === 'alipay' && (alipayQrCodeUrl.value || alipayPayUrl.value)) {
    startPaymentPolling()
    return
  }

  if (paymentTimer.value) {
    clearInterval(paymentTimer.value)
    paymentTimer.value = null
  }

  selectedMethod.value = 'alipay'
  isPaid.value = false

  try {
    alipayLoading.value = true
    const paymentResponse = await createPayment(props.orderId, 'alipay')
    const params = paymentResponse?.payment_params
    const type = params?.payment_type || 'precreate'
    alipayPayType.value = type

    if (type === 'precreate' || type === 'wap') {
      const qrCodeUrl = params?.qr_code_url
      if (!qrCodeUrl) throw new Error('支付宝二维码链接为空')
      alipayQrCodeUrl.value = qrCodeUrl
    } else if (type === 'page') {
      const payUrl = params?.payment_url
      if (!payUrl) throw new Error('支付宝支付链接为空')
      alipayPayUrl.value = payUrl
    }

    alipayLoading.value = false
    startPaymentPolling()
  } catch (error) {
    alipayLoading.value = false
    ElMessage.error('获取支付宝支付链接失败，请重试')
    emit('payment-error', error)
    console.error(error)
  }
}

const openAlipayPage = () => {
  if (alipayPayUrl.value) {
    window.open(alipayPayUrl.value, '_blank')
  }
}

  const pollingTimedOut = ref(false)

  const manualCheckPayment = async () => {
    try {
      const orderResult = await getOrderStatus(props.orderId)
      if (orderResult && orderResult.payment_status === 'paid') {
        isPaid.value = true
        pollingTimedOut.value = false
        ElMessage.success('支付成功！')
        return
      }
      ElMessage.info('暂未检测到支付结果，请稍后再试')
    } catch {
      ElMessage.error('查询失败，请稍后再试')
    }
  }

  const startPaymentPolling = () => {
    if (paymentTimer.value) {
      clearInterval(paymentTimer.value)
    }
    pollingTimedOut.value = false

    let attempts = 0
    const maxAttempts = 150 // 150次 × 2秒 = 5分钟
    let consecutiveErrors = 0
    const maxConsecutiveErrors = 5

    paymentTimer.value = setInterval(async () => {
      attempts++

      try {
        const orderResult = await getOrderStatus(props.orderId)
        if (orderResult && orderResult.payment_status === 'paid') {
          isPaid.value = true
          clearInterval(paymentTimer.value)
          pollingTimedOut.value = false
          ElMessage.success('支付成功！')
          return
        }
        consecutiveErrors = 0
      } catch (error) {
        consecutiveErrors++
        if (consecutiveErrors >= maxConsecutiveErrors) {
          clearInterval(paymentTimer.value)
          pollingTimedOut.value = true
          return
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(paymentTimer.value)
        pollingTimedOut.value = true
      }
    }, 2000)
  }

// 确认支付
const confirmPayment = () => {
  if (!isPaid.value) {
    ElMessage.info(`请使用${payChannel.value === 'alipay' ? '支付宝' : '微信'}完成扫码支付`)
    return
  }
  
  // 支付成功，触发事件
  isCompletingPayment.value = true
  emit('payment-success')
  showPaymentDialog.value = false
}

// 取消支付
const cancelPayment = () => {
  showPaymentDialog.value = false
}

// 重置支付状态
const resetPayment = () => {
  payChannel.value = 'wechat'
  selectedMethod.value = ''
  isPaid.value = false
  
  // 清除轮询定时器
  if (paymentTimer.value) {
    clearInterval(paymentTimer.value)
    paymentTimer.value = null
  }
  
  // 释放微信 Blob URL，避免内存泄漏
  if (wechatQrCodeUrl.value && wechatQrCodeUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(wechatQrCodeUrl.value)
  }
  // 释放支付宝 Blob URL，避免内存泄漏
  if (alipayQrCodeUrl.value && alipayQrCodeUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(alipayQrCodeUrl.value)
  }
  
  wechatQrCodeUrl.value = ''
  alipayQrCodeUrl.value = ''
  wechatLoading.value = false
  alipayLoading.value = false
}
</script>

<style scoped>
:deep(.payment-dialog) {
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  margin: 0 !important;
}

:deep(.payment-dialog .el-dialog__body) {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding: 10px 20px;
}

.payment-content {
  text-align: center;
  padding: 10px 0;
}

.payment-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.payment-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.4;
}

.payment-amount {
  margin-bottom: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.amount-label {
  font-size: 14px;
  color: #909399;
  margin-right: 10px;
}

.amount-value {
  font-size: 24px;
  font-weight: 700;
  color: #f56c6c;
}

.wechat-pay-header {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.wechat-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: #f0faf4;
  border: 1.5px solid #07c160;
  border-radius: 20px;
  color: #07c160;
  font-size: 15px;
  font-weight: 500;
}

.method-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-bottom: 8px;
}

.method-icon-sm {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
}

.wechat-icon {
  background: #07c160;
}

.wechat-icon-sm {
  background: #07c160;
}

.qrcode-wrapper {
  display: flex;
  justify-content: center;
}

.qrcode-container {
  margin: 10px 0;
}

.qrcode-container h4 {
  margin-bottom: 15px;
  color: #303133;
}

.qrcode-placeholder {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.qrcode-demo {
  text-align: center;
}

.qrcode-box {
  width: 180px;
  height: 180px;
  margin: 0 auto 10px;
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #909399;
}

.loading-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 10px;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.qrcode-image {
  width: 180px;
  height: 180px;
  margin: 0 auto 10px;
  border-radius: 8px;
}

.qrcode-tip {
  font-size: 12px;
  color: #909399;
}

.payment-footer {
  display: flex;
  justify-content: space-between;
}

.pay-channel {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  width: 100%;
}

.alipay-pay-header {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.alipay-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: #e8f4ff;
  border: 1.5px solid #1677ff;
  border-radius: 20px;
  color: #1677ff;
  font-size: 15px;
  font-weight: 500;
}

.alipay-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1677ff;
}

.alipay-page-pay {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
}

.alipay-open-btn {
  width: 200px;
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
  background: #1677ff;
  border-color: #1677ff;
}

.alipay-page-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}

</style>

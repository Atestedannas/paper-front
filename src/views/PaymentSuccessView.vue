<template>
  <div class="payment-success-page">
    <div class="result-card">
      <div v-if="checking" class="checking-state">
        <el-icon class="loading-icon" :size="48"><Loading /></el-icon>
        <h2>正在确认支付结果...</h2>
        <p>请稍候，系统正在查询您的支付状态</p>
      </div>

      <div v-else-if="paid" class="success-state">
        <el-icon class="success-icon" :size="64"><CircleCheckFilled /></el-icon>
        <h2>支付成功</h2>
        <p>您的订单已支付完成，现在可以上传论文进行格式检查</p>
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="goUpload">
            立即上传论文
          </el-button>
          <el-button size="large" @click="goHistory">
            查看订单记录
          </el-button>
        </div>
      </div>

      <div v-else class="fail-state">
        <el-icon class="warning-icon" :size="64"><WarningFilled /></el-icon>
        <h2>支付状态未确认</h2>
        <p>{{ errorMsg || '暂未查询到支付结果，如已完成支付请稍后刷新页面' }}</p>
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="recheck">
            重新查询
          </el-button>
          <el-button size="large" @click="goHistory">
            查看订单记录
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading, CircleCheckFilled, WarningFilled } from '@element-plus/icons-vue'
import { getOrders } from '../api/order'

const route = useRoute()
const router = useRouter()
const checking = ref(true)
const paid = ref(false)
const errorMsg = ref('')

const checkPaymentStatus = async () => {
  checking.value = true
  try {
    const resp = await getOrders({ page: 1, page_size: 5 })
    const orders = resp?.orders || (Array.isArray(resp) ? resp : [])
    const paidOrder = orders.find(o => o.payment_status === 'paid')
    paid.value = !!paidOrder
    if (!paidOrder) {
      errorMsg.value = '暂未查到已支付的订单，支付宝回调可能有延迟，请稍后再试'
    }
  } catch {
    errorMsg.value = '查询失败，请稍后重试'
  } finally {
    checking.value = false
  }
}

const recheck = () => checkPaymentStatus()
const goUpload = () => router.push('/upload')
const goHistory = () => router.push('/history')

onMounted(() => {
  checkPaymentStatus()
})
</script>

<style scoped>
.payment-success-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.result-card {
  max-width: 500px;
  width: 100%;
  text-align: center;
  padding: 60px 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.result-card h2 {
  margin: 20px 0 10px;
  font-size: 24px;
  color: #1e293b;
}

.result-card p {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 30px;
}

.loading-icon {
  color: #409eff;
  animation: spin 1s linear infinite;
}

.success-icon {
  color: #67c23a;
}

.warning-icon {
  color: #e6a23c;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

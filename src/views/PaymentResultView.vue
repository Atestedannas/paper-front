<template>
  <div class="payment-result-view">
    <div class="result-container">
      <div class="result-header">
        <h1>支付结果</h1>
      </div>

      <div class="result-content">
        <div class="result-status" :class="result.status">
          <div class="status-icon">
            <el-icon v-if="result.status === 'success'">
              <CircleCheck />
            </el-icon>
            <el-icon v-else>
              <CircleClose />
            </el-icon>
          </div>
          <h2 class="status-title">{{ result.title }}</h2>
          <p class="status-message">{{ result.message }}</p>
        </div>

        <div class="result-details" v-if="result.orderInfo">
          <h3>订单详情</h3>
          <el-card shadow="hover" class="order-card">
            <div class="order-info">
              <div class="info-item">
                <span class="label">订单编号：</span>
                <span class="value">{{ result.orderInfo.orderId }}</span>
              </div>
              <div class="info-item">
                <span class="label">商品名称：</span>
                <span class="value">{{ result.orderInfo.paperTitle }}</span>
              </div>
              <div class="info-item">
                <span class="label">支付金额：</span>
                <span class="value amount">¥{{ result.orderInfo.amount }}</span>
              </div>
              <div class="info-item">
                <span class="label">支付方式：</span>
                <el-tag :type="result.orderInfo.payMethod === 'alipay' ? 'primary' : 'success'">
                  {{ result.orderInfo.payMethod === 'alipay' ? '支付宝' : '微信支付' }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="label">支付时间：</span>
                <span class="value">{{ formatDate(result.orderInfo.payTime) }}</span>
              </div>
            </div>
          </el-card>
        </div>

        <div class="result-actions">
          <el-button 
            type="primary" 
            size="large" 
            @click="handleContinue"
          >
            {{ result.status === 'success' ? '立即下载论文' : '返回首页' }}
          </el-button>
          <el-button 
            size="large" 
            @click="backToOrderHistory"
          >
            查看订单历史
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 解析路由参数
const orderId = ref(route.query.orderId || '')
const status = ref(route.query.status || 'success')
const paperId = ref(route.query.paperId || '')

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 计算属性：支付结果
const result = computed(() => {
  const successResult = {
    status: 'success',
    title: '支付成功',
    message: '您的论文下载支付已完成，现在可以下载修正后的论文文件了',
    orderInfo: {
      orderId: orderId.value,
      paperTitle: '论文标题示例',
      amount: 9.99,
      payMethod: 'alipay',
      payTime: new Date().toISOString()
    }
  }

  const failResult = {
    status: 'fail',
    title: '支付失败',
    message: '很抱歉，支付过程中出现了问题，请稍后重试或选择其他支付方式',
    orderInfo: orderId.value ? {
      orderId: orderId.value,
      paperTitle: '论文标题示例',
      amount: 9.99,
      payMethod: 'alipay',
      payTime: null
    } : null
  }

  return status.value === 'success' ? successResult : failResult
})

// 处理继续操作
const handleContinue = () => {
  if (status.value === 'success') {
    // 跳转到下载页面
    if (paperId.value) {
      router.push({ 
        name: 'export-result', 
        params: { paperId: paperId.value } 
      })
    } else {
      router.push('/history')
    }
  } else {
    // 返回首页
    router.push('/')
  }
}

// 返回订单历史
const backToOrderHistory = () => {
  router.push('/history')
}

onMounted(() => {
  // 可以在这里调用API获取订单详情

})
</script>

<style scoped>
.payment-result-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 40px 20px;
}

.result-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.result-header {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 30px;
  text-align: center;
}

.result-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.result-content {
  padding: 40px;
}

.result-status {
  text-align: center;
  margin-bottom: 30px;
  padding: 30px 0;
}

.result-status.success {
  color: #67c23a;
}

.result-status.fail {
  color: #f56c6c;
}

.status-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.status-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 10px;
}

.status-message {
  font-size: 16px;
  color: #606266;
}

.result-details {
  margin-bottom: 30px;
}

.result-details h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #303133;
}

.order-card {
  margin-bottom: 20px;
}

.order-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  color: #606266;
  font-weight: 500;
  margin-right: 10px;
  min-width: 100px;
}

.info-item .value {
  color: #303133;
  font-weight: 600;
}

.info-item .amount {
  color: #f56c6c;
  font-size: 18px;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

@media (max-width: 768px) {
  .result-container {
    margin: 0 10px;
  }
  
  .result-header h1 {
    font-size: 24px;
  }
  
  .result-content {
    padding: 20px;
  }
  
  .status-icon {
    font-size: 60px;
  }
  
  .status-title {
    font-size: 20px;
  }
  
  .order-info {
    grid-template-columns: 1fr;
  }
  
  .result-actions {
    flex-direction: column;
  }
}
</style>
<template>
  <div class="order-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
    </div>
    
    <div class="order-content">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1>我的订单</h1>
        <p class="page-description">查看和管理您的所有订单</p>
      </div>
      
      <!-- 加载状态 -->
      <div class="loading-state" v-if="loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      
      <!-- 订单列表 -->
      <div class="order-list" v-else-if="orders.length > 0">
        <el-card 
          v-for="order in orders" 
          :key="order.id" 
          class="order-card"
          shadow="hover"
        >
          <div class="order-header">
            <div class="order-number">
              <el-icon><Document /></el-icon>
              <span>订单号: {{ order.orderNumber }}</span>
            </div>
            <el-tag :type="getStatusType(order.orderStatus)" size="large">
              {{ getStatusText(order.orderStatus) }}
            </el-tag>
          </div>
          
          <div class="order-body">
            <div class="order-info">
              <div class="info-item">
                <span class="info-label">会员套餐</span>
                <span class="info-value">{{ order.memberLevel?.levelName || '未知' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">订单金额</span>
                <span class="info-value price">¥{{ order.totalAmount }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatDate(order.createdAt) }}</span>
              </div>
            </div>
            
            <div class="order-actions">
              <el-button 
                v-if="order.orderStatus === 'pending'" 
                type="primary"
                size="large"
                :loading="payingId === order.id"
                @click="payOrder(order.id)"
              >
                <el-icon><Wallet /></el-icon>
                {{ payingId === order.id ? '处理中...' : '立即支付' }}
              </el-button>
              <el-button 
                v-if="order.orderStatus === 'pending'" 
                type="danger"
                size="large"
                plain
                :loading="cancelingId === order.id"
                @click="cancelOrder(order.id)"
              >
                {{ cancelingId === order.id ? '处理中...' : '取消订单' }}
              </el-button>
              <el-button 
                v-if="order.orderStatus === 'paid'" 
                type="success"
                size="large"
                plain
                disabled
              >
                <el-icon><CircleCheck /></el-icon>
                已完成
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 空状态 -->
      <div class="empty-state" v-else-if="!error">
        <el-empty description="暂无订单记录">
          <el-button type="primary" size="large" @click="router.push('/member')">
            <el-icon><ShoppingCart /></el-icon>
            去开通会员
          </el-button>
        </el-empty>
      </div>
      
      <!-- 错误状态 -->
      <div class="error-state" v-if="error">
        <el-alert :title="error" type="error" show-icon />
        <el-button type="primary" @click="loadOrders" style="margin-top: 16px;">重试</el-button>
      </div>
      
      <!-- 分页 -->
      <div class="pagination" v-if="!loading && !error && total > pageSize">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          background
          @current-change="loadOrders"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Document, Wallet, CircleCheck, ShoppingCart } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const orders = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(true)
const payingId = ref(null)
const cancelingId = ref(null)
const error = ref('')

const loadOrders = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await request({
      url: '/order',
      method: 'GET',
      params: {
        page: page.value,
        page_size: pageSize.value
      }
    })
    orders.value = response.data?.orders || []
    total.value = response.data?.total || 0
    
    // 如果API调用失败，设置错误信息
    if (!orders.value.length && page.value === 1) {
      error.value = '暂无订单数据，请稍后重试'
    }
   } catch (err) {

     error.value = '加载订单失败：' + (err.response?.data?.message || err.message)
     orders.value = []
     total.value = 0
   } finally {
    loading.value = false
  }
}

const payOrder = async (orderId) => {
  payingId.value = orderId
  try {
    // 这里应该调用支付API或跳转到支付页面
    ElMessage.info('支付功能正在对接中，敬请期待')
  } catch (err) {

    ElMessage.error('支付操作失败')
  } finally {
    payingId.value = null
  }
}

const cancelOrder = async (orderId) => {
  try {
    await ElMessageBox.confirm('确定要取消此订单吗？', '确认取消', {
      confirmButtonText: '确定',
      cancelButtonText: '再想想',
      type: 'warning'
    })
    
    cancelingId.value = orderId
    await request({
      url: `/order/${orderId}/cancel`,
      method: 'PUT'
    })
    
    // 更新本地状态
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.orderStatus = 'canceled'
    }
    
    ElMessage.success('订单已取消')
  } catch (err) {
    if (err !== 'cancel') {

      ElMessage.error('取消订单失败')
    }
  } finally {
    cancelingId.value = null
  }
}

const getStatusType = (status) => {
  const statusMap = {
    'pending': 'warning',
    'paid': 'success',
    'canceled': 'info',
    'refunded': 'danger',
    'expired': 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待支付',
    'paid': '已支付',
    'canceled': '已取消',
    'refunded': '已退款',
    'expired': '已过期'
  }
  return statusMap[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.order-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
}

.order-content {
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
}

.page-description {
  font-size: 1.1rem;
  color: #666;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: #666;
  font-size: 1.1rem;
}

.loading-state .el-icon {
  font-size: 24px;
  color: #667eea;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.order-number {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  color: #333;
  font-weight: 500;
}

.order-number .el-icon {
  color: #667eea;
}

.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.order-info {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.85rem;
  color: #999;
}

.info-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.info-value.price {
  color: #667eea;
  font-size: 1.25rem;
}

.order-actions {
  display: flex;
  gap: 12px;
}

.order-actions .el-button {
  min-width: 120px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.error-state {
  text-align: center;
  padding: 40px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

:deep(.el-pagination) {
  --el-pagination-button-bg-color: white;
  --el-pagination-hover-color: #667eea;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 2rem;
  }
  
  .order-body {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .order-info {
    width: 100%;
    justify-content: space-between;
  }
  
  .order-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .order-actions .el-button {
    width: 100%;
  }
}
</style>

<template>
  <div class="history-view">
    <div class="glass-container">
      <div class="page-header">
        <h1 class="page-title">历史记录</h1>
        <p class="page-subtitle">查看论文检查与订单流转，支持筛选与快捷操作</p>
        <div class="header-tags">
          <span class="glass-tag primary">论文</span>
          <span class="glass-tag success">订单</span>
          <span class="glass-tag warning">快捷操作</span>
        </div>
      </div>
      <div class="history-tabs">
        <el-segmented v-model="activeTab" :options="segmentedOptions" class="segmented" />
      </div>

      <transition name="fade-up" mode="out-in">
        <div v-if="activeTab === 'papers'" key="papers">
          <div class="toolbar">
            <el-input v-model="paperQuery" placeholder="搜索论文标题..." class="glass-input" clearable />
            <div class="toolbar-actions">
              <span class="glass-tag info">共 {{ papers.length }} 条</span>
            </div>
          </div>

          <el-skeleton v-if="loading" :rows="3" animated class="skeleton-card" />

          <div v-if="!loading && papers.length > 0" class="card-grid">
            <div v-for="p in filteredPapers" :key="p.id" class="glass-card history-card">
              <div class="card-head">
                <h3 class="card-title">{{ p.title || '未命名论文' }}</h3>
                <span class="glass-tag" :class="p.fileType === 'docx' ? 'primary' : 'info'">{{ p.fileType?.toUpperCase() || 'DOCX' }}</span>
              </div>
              <div class="card-meta">
                <span>上传: {{ formatDate(p.uploadTime) || '—' }}</span>
                <span>
                  状态:
                  <el-tag size="small" :type="p.status === 'checked' ? 'success' : 'info'">{{ p.status || 'pending' }}</el-tag>
                </span>
                <span>问题数: {{ p.checkResult ? p.checkResult.totalIssues : 0 }}</span>
              </div>
              <div class="card-actions">
                <el-button class="glass-btn" @click="downloadOriginal(p.id)">下载原文件</el-button>
                <el-button class="glass-btn primary" @click="viewResult(p.id)">查看结果</el-button>
                <el-button class="glass-btn danger" @click="deletePaperHandler(p.id)">删除</el-button>
              </div>
            </div>
          </div>

          <div v-if="!loading && papers.length === 0" class="empty-wrap glass-panel">
            <el-empty description="暂无论文历史记录" />
            <el-button class="glass-btn primary" @click="$router.push('/upload')">上传第一篇论文</el-button>
          </div>
        </div>

        <div v-else key="orders">
          <div class="toolbar">
            <el-input v-model="orderQuery" placeholder="搜索订单编号或论文标题..." class="glass-input" clearable />
            <div class="toolbar-actions">
              <span class="glass-tag info">共 {{ orders.length }} 条</span>
            </div>
          </div>

          <el-skeleton v-if="ordersLoading" :rows="3" animated class="skeleton-card" />

          <div v-if="!ordersLoading && orders.length > 0" class="card-grid">
            <div v-for="o in filteredOrders" :key="o.id" class="glass-card history-card">
              <div class="card-head">
                <h3 class="card-title">订单 {{ o.order_no || o.orderId || o.id }}</h3>
                <span class="glass-tag success">¥{{ o.total_amount || o.amount || 0 }}</span>
              </div>
              <div class="card-meta">
                <span>
                  支付:
                  <el-tag size="small" :type="(o.payment_method || o.payMethod) === 'alipay' ? 'primary' : 'success'">{{ (o.payment_method || o.payMethod) === 'alipay' ? '支付宝' : '微信支付' }}</el-tag>
                </span>
                <span>
                  状态:
                  <el-tag size="small" :type="getOrderStatusType(o.payment_status || o.status)">{{ getOrderStatusText(o.payment_status || o.status) }}</el-tag>
                </span>
                <span>创建: {{ formatDate(o.created_at || o.createdAt) || '—' }}</span>
              </div>
              <div class="card-actions">
                <el-button
                  v-if="(o.payment_status || o.status) === 'paid'"
                  class="glass-btn primary"
                  @click="resumeUpload(o)"
                >
                  继续上传论文
                </el-button>
                <el-button
                  class="glass-btn danger"
                  :disabled="(o.payment_status || o.status) !== 'pending'"
                  @click="cancelOrder(o.id)"
                >
                  取消订单
                </el-button>
              </div>
            </div>
          </div>

          <div v-if="!ordersLoading && orders.length === 0" class="empty-wrap glass-panel">
            <el-empty description="暂无订单历史记录" />
            <el-button class="glass-btn primary" @click="$router.push('/')">返回首页</el-button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getPapers, deletePaper as deletePaperApi, getPaperFile } from '../api/paper'
import { getOrders as getOrdersApi, cancelOrder as cancelOrderApi } from '../api/order'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref('papers')
const segmentedOptions = [
  { label: '论文历史', value: 'papers' },
  { label: '订单历史', value: 'orders' }
]
const papers = ref([])
const loading = ref(false)
const orders = ref([])
const ordersLoading = ref(false)
const paperQuery = ref('')
const orderQuery = ref('')

const loadPapers = async () => {
  loading.value = true
  try {
    const response = await getPapers()
    papers.value = Array.isArray(response) ? response : (response?.list || [])
  } catch (error) {
    ElMessage.error('加载历史记录失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const loadOrders = async () => {
  ordersLoading.value = true
  try {
    const response = await getOrdersApi()
    orders.value = Array.isArray(response) ? response : (response?.orders || [])
  } catch (error) {
    ElMessage.error('加载订单历史失败：' + error.message)
  } finally {
    ordersLoading.value = false
  }
}

const viewResult = (paperId) => {
  router.push({ name: 'format-check', params: { paperId } })
}

const downloadOriginal = async (paperId) => {
  try {
    const blob = await getPaperFile(paperId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paper_${paperId}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    ElMessage.error('下载失败：' + (error.message || '未知错误'))
  }
}

const deletePaperHandler = async (paperId) => {
  try {
    await deletePaperApi(paperId)
    papers.value = papers.value.filter(paper => paper.id !== paperId)
    ElMessage.success('论文已删除')
  } catch (error) {
    ElMessage.error('删除失败：' + error.message)
  }
}

const getOrderStatusType = (status) => {
  const statusMap = {
    'paid': 'success',
    'pending': 'warning',
    'waiting': 'warning',
    'cancelled': 'danger',
    'failed': 'danger',
    'refunded': 'info'
  }
  return statusMap[status] || 'info'
}

const getOrderStatusText = (status) => {
  const statusMap = {
    'paid': '已支付',
    'pending': '待支付',
    'waiting': '待支付',
    'cancelled': '已取消',
    'failed': '支付失败',
    'refunded': '已退款'
  }
  return statusMap[status] || '未知'
}

const resumeUpload = (order) => {
  ElMessage.success('订单已支付，前往上传论文...')
  router.push('/upload')
}

const cancelOrder = async (orderId) => {
  try {
    await cancelOrderApi(orderId)
    ElMessage.success('订单已取消')
    loadOrders()
  } catch (error) {
    ElMessage.error('取消订单失败：' + error.message)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}

const filteredPapers = computed(() => {
  const q = paperQuery.value.trim().toLowerCase()
  if (!q) return papers.value
  return papers.value.filter(p => (p.title || '').toLowerCase().includes(q))
})

const filteredOrders = computed(() => {
  const q = orderQuery.value.trim().toLowerCase()
  if (!q) return orders.value
  return orders.value.filter(o => (o.orderId || '').toString().toLowerCase().includes(q) || (o.paperTitle || '').toLowerCase().includes(q))
})

onMounted(() => {
  loadPapers()
  loadOrders()
})
</script>

<style scoped>
.history-view {
  background: transparent;
}

.glass-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px 80px;
  position: relative;
  z-index: 10;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.header-tags {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 8px;
}

.history-tabs {
  display: flex;
  justify-content: center;
  margin: 12px 0 20px;
}

.segmented :deep(.el-segmented) {
  background: rgba(255,255,255,0.5);
  border-radius: 999px;
  padding: 6px;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.history-card {
  padding: 20px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.card-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.glass-btn.danger {
  background: rgba(255, 255, 255, 0.6);
  color: #ef4444;
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.empty-wrap {
  margin-top: 20px;
  padding: 20px;
  text-align: center;
}

.skeleton-card {
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .card-meta {
    grid-template-columns: 1fr;
  }
}
</style>

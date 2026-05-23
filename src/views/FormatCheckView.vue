<template>
  <div class="format-check-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">格式检查结果</h1>
        <p class="page-description">查看论文格式检查结果，对比原始版本与修正版本</p>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 论文信息卡片 -->
      <div class="paper-info-card">
        <el-card shadow="hover">
          <div class="paper-info-content">
            <div class="paper-title-section">
              <h3>{{ paperInfo?.title || '论文标题' }}</h3>
              <el-tag :type="getStatusType(paperInfo?.status)" size="small">
                {{ getStatusText(paperInfo?.status) }}
              </el-tag>
            </div>
            <div class="paper-meta">
              <div class="meta-item">
                <el-icon><document /></el-icon>
                <span>文件类型：{{ paperInfo?.fileType || '未知' }}</span>
              </div>
              <div class="meta-item">
                <el-icon><clock /></el-icon>
                <span>上传时间：{{ formatDate(paperInfo?.uploadTime) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><files /></el-icon>
                <span>文件大小：{{ formatFileSize(paperInfo?.fileSize) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 检查结果区域 -->
      <div class="check-result-section">
        <el-tabs v-model="activeTab" type="card" class="result-tabs">
          <!-- 格式检查标签页 -->
          <el-tab-pane label="格式检查" name="check">
            <div class="tab-content">
              <FormatChecker 
                :paper-id="paperId" 
                :paper-title="paperInfo?.title || '未命名论文'"
                :paper-type="paperInfo?.fileType || '未知类型'"
              />
            </div>
          </el-tab-pane>

          <!-- 格式对比标签页 -->
          <el-tab-pane label="格式对比" name="compare">
            <div class="tab-content">
              <FormatCompare 
                :paper-id="paperId" 
                :paper-title="paperInfo?.title || '未命名论文'"
                :paper-type="paperInfo?.fileType || '未知类型'"
              />
            </div>
          </el-tab-pane>

          <!-- JSON数据对比标签页 -->
          <el-tab-pane label="JSON数据对比" name="json-diff">
            <div class="tab-content">
              <div class="json-diff-section">
                <div class="section-header">
                  <h3>格式差异数据对比</h3>
                  <p class="section-desc">高亮显示检测到的格式差异数据 (JSON格式)</p>
                </div>
                <JsonDiffViewer :differences="checkResult?.differences || []" />
              </div>
            </div>
          </el-tab-pane>

          <!-- 检查报告标签页 -->
          <el-tab-pane label="检查报告" name="report">
            <div class="tab-content">
              <div class="report-section">
                <h3>详细检查报告</h3>
                <el-card shadow="hover">
                  <div class="report-content">
                    <div class="report-summary">
                      <h4>检查概览</h4>
                      <div class="summary-stats">
                        <div class="stat-item">
                          <span class="stat-label">总问题数</span>
                          <span class="stat-value">{{ checkResult?.totalIssues || (checkResult?.differences?.length || 0) }}</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-label">严重问题</span>
                          <span class="stat-value danger">{{ checkResult?.severityCount?.high || 0 }}</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-label">中等问题</span>
                          <span class="stat-value warning">{{ checkResult?.severityCount?.medium || 0 }}</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-label">轻微问题</span>
                          <span class="stat-value info">{{ checkResult?.severityCount?.low || 0 }}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="report-actions">
                      <el-button type="primary" @click="exportReport">
                        <el-icon><download /></el-icon>
                        导出PDF报告
                      </el-button>
                      <el-button @click="exportReportHtml">
                        <el-icon><document /></el-icon>
                        导出HTML报告
                      </el-button>
                      <el-button type="primary" @click="handleExportCorrectedPaper">
                        <el-icon><document /></el-icon>
                        导出修正论文
                      </el-button>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 底部操作栏 -->
      <div ref="bottomActionsRef" class="bottom-actions">
        <el-button type="primary" size="large" @click="backToUpload">
          <el-icon><upload /></el-icon>
          上传新论文
        </el-button>
        <el-button size="large" @click="backToHome">
          <el-icon><house /></el-icon>
          返回首页
        </el-button>
      </div>
    </div>

    <!-- 悬浮快捷按钮 -->
    <transition name="fab-fade">
      <div v-show="showFab" class="fab-container">
        <el-tooltip content="上传新论文" placement="left">
          <el-button
            class="fab-button"
            type="primary"
            circle
            size="large"
            @click="scrollToActions"
          >
            <el-icon :size="22"><download /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="回到顶部" placement="left">
          <el-button
            class="fab-button fab-secondary"
            circle
            size="large"
            @click="scrollToTop"
          >
            <el-icon :size="20"><top /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </transition>

    <!-- 支付弹窗 -->
    <PaymentModal
      v-model="paymentModalVisible"
      :paper-id="paperId"
      :paper-title="paperInfo?.title || '未命名论文'"
      :amount="paymentAmount"
      :payment-description="paymentDescription"
      @payment-success="handlePaymentSuccess"
      @payment-cancel="paymentModalVisible = false"
      @payment-error="handlePaymentError"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPaperById, exportCheckReport, exportCheckReportHtml, exportCorrectedPaper, getCheckResult, getFormatComparison } from '../api/paper'
import { checkPaperPaymentStatus } from '../api/auth'
import FormatChecker from '../components/FormatChecker.vue'
import FormatCompare from '../components/FormatCompare.vue'
import JsonDiffViewer from '../components/JsonDiffViewer.vue'
import PaymentModal from '../components/PaymentModal.vue'
import { 
  Document, Clock, Files, Download, Upload, House, Top
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 论文信息
const paperId = ref(route.params.paperId)
const paperInfo = ref(null)
const activeTab = ref('check')
const checkResult = ref(null)
const score = ref(0)
const passRate = ref(0)

// 悬浮按钮
const bottomActionsRef = ref(null)
const showFab = ref(false)

const handleScroll = () => {
  showFab.value = window.scrollY > 300
}

const scrollToActions = () => {
  bottomActionsRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 支付弹窗相关
const paymentModalVisible = ref(false)
const paymentAmount = ref(9.99) // 论文下载费用
const paymentDescription = ref('支付成功后可下载修正后的论文文件，支持DOCX和PDF格式')

// 解析 JSONB 字符串（后端 string 类型的 jsonb 字段）
const parseJsonField = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'object') return val
  try { return JSON.parse(val) } catch { return [] }
}

// 加载论文信息
const loadPaperInfo = async () => {
  try {
    // 拦截器已解包：getPaperById 直接返回 Paper 对象
    const paper = await getPaperById(paperId.value)
    if (paper) {
      paperInfo.value = {
        ...paper,
        title:      paper.title      || paper.file_name || '未命名论文',
        uploadTime: paper.created_at,
        fileSize:   paper.file_size,
        fileType:   (paper.file_type || paper.file_name?.split('.').pop() || 'UNKNOWN').toUpperCase()
      }
    }

    // 获取检查结果列表（后端返回数组或单对象）
    const resultRaw = await getCheckResult(paperId.value)
    const resultList = Array.isArray(resultRaw) ? resultRaw : (resultRaw ? [resultRaw] : [])
    const latestResult = resultList[0] || null

    if (latestResult) {
      // 解析 JSONB 字符串字段
      const differences = parseJsonField(latestResult.differences)

      checkResult.value = {
        ...latestResult,
        differences,
        totalIssues:   latestResult.total_issues   ?? differences.length,
        severityCount: {
          high:   latestResult.error_count   ?? 0,
          medium: latestResult.warning_count ?? 0,
          low:    latestResult.info_count    ?? 0
        }
      }

      // 如有对比接口则再补充差异详情
      try {
        const compareRaw = await getFormatComparison(paperId.value, latestResult.id)
        if (compareRaw) {
          const extraDiffs = parseJsonField(compareRaw.differences ?? compareRaw)
          if (extraDiffs.length > 0) {
            checkResult.value.differences = extraDiffs
            checkResult.value.totalIssues = extraDiffs.length
            const counts = { high: 0, medium: 0, low: 0 }
            extraDiffs.forEach(d => {
              if (d.severity === 'error')        counts.high++
              else if (d.severity === 'warning') counts.medium++
              else                               counts.low++
            })
            checkResult.value.severityCount = counts
          }
        }
      } catch {
        // 对比接口可选，失败不影响主流程
      }
    }

  } catch (error) {
    ElMessage.error('加载论文信息失败：' + (error.message || '未知错误'))
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    uploaded: 'info',
    checking: 'warning',
    checked: 'success',
    error: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    uploaded: '已上传',
    checking: '检查中',
    checked: '已检查',
    error: '检查失败'
  }
  return statusMap[status] || '未知'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '未知'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// 导出检查报告
const exportReport = async () => {
  try {
    const response = await exportCheckReport(paperId.value, { type: 'report', format: 'txt' })
    const url = window.URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `格式检查报告_${paperInfo.value?.title || '未命名'}.txt`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('检查报告导出成功')
  } catch (error) {
    ElMessage.error('导出失败：' + error.message)
  }
}

const exportReportHtml = async () => {
  try {
    const response = await exportCheckReportHtml(paperId.value, { type: 'report' })
    const url = window.URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `格式检查报告_${paperInfo.value?.title || '未命名'}.html`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('HTML 报告导出成功')
  } catch (error) {
    ElMessage.error('导出失败：' + error.message)
  }
}

// 导出修正后的论文
const handleExportCorrectedPaper = async () => {
  try {
    // 先检查是否需要付费 - 使用 check_and_fix 服务类型（格式检查+修正的总费用）
    const paymentCheck = await checkPaperPaymentStatus({
      service_type: 'check_and_fix',
      paper_id: paperId.value
    });
    
    if (paymentCheck && paymentCheck.code === 200 && paymentCheck.data) {
      // 从支付配置中获取总费用 (format_check + format_fix)
      const price = paymentCheck.data.price || 0;
      
      if (price > 0) {
        // 需要付费，更新支付金额并显示支付对话框
        paymentAmount.value = price;
        paymentModalVisible.value = true
        return
      }
    }
    
    // 如果已支付或无需支付，直接导出
    await performExport()
  } catch (error) {

    // 检查失败时，尝试直接导出，让后端处理付费检查
    await performExport()
  }
}

// 执行导出操作
const performExport = async () => {
  try {
    ElMessage.info('正在准备导出...')
    // 直接调用导出API
    const response = await exportCorrectedPaper(paperId.value)
    const blob = new Blob([response.data], { type: response.headers['content-type'] })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 构建文件名：修改后 + 原文件名 + 日期
    const originalTitle = paperInfo.value?.title || '未命名论文';
    const ext = response.headers['content-type']?.includes('pdf') ? 'pdf' : 'docx';
    
    // 获取当前日期时间，格式 YYYYMMDDHHmmss
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dateStr = `${year}${month}${day}${hours}${minutes}${seconds}`;
    
    link.download = `修改后_${originalTitle}_${dateStr}.${ext}`;
    
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('修正论文导出成功')
  } catch (error) {

    // 处理后端返回的付费相关错误
    if (error.response) {
      const { status, data } = error.response
      // 检查是否为402错误或包含付费提示的消息
      if (status === 402 || (data && (data.error?.includes('付费') || data.error?.includes('支付') || data.message?.includes('付费') || data.message?.includes('支付')))) {
        // 更新支付金额并显示支付对话框
        paymentAmount.value = data.price || 9.99
        paymentModalVisible.value = true
        return
      }
    }
    ElMessage.error('导出失败：' + (error.message || '网络错误'))
  }
}

// 支付成功回调
const handlePaymentSuccess = async (result) => {
  ElMessage.success('支付成功，正在准备下载...')
  // 支付成功后再次调用导出方法
  await handleExportCorrectedPaper()
}

// 支付失败回调
const handlePaymentError = (error) => {
  ElMessage.error('支付失败，请重试')

}

// 处理子组件触发的支付请求
const handleShowPayment = (paymentInfo) => {
  paymentAmount.value = paymentInfo.amount
  paymentDescription.value = paymentInfo.description
  paymentModalVisible.value = true
}

// 返回上传页面
const backToUpload = () => {
  router.push({ name: 'upload' })
}

// 返回首页
const backToHome = () => {
  router.push({ name: 'home' })
}

// 组件挂载时加载数据
onMounted(async () => {
  window.addEventListener('scroll', handleScroll)
  await loadPaperInfo()

  if (typeof route.query.tab === 'string' && route.query.tab) {
    activeTab.value = route.query.tab
  }
  
  // 检查是否需要自动下载
  if (route.query.auto_download === 'true') {
    // 切换到 JSON 对比 tab
    activeTab.value = 'json-diff'
    // 自动触发下载
    setTimeout(() => {
      handleExportCorrectedPaper()
    }, 1000)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.format-check-view {
  min-height: calc(100vh - 120px);
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.page-header {
  background: white;
  padding: 60px 0 40px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}

.page-title {
  font-size: 48px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  font-size: 18px;
  color: #6b7280;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.paper-info-card {
  margin-bottom: 30px;
}

.paper-info-content {
  padding: 20px;
}

.paper-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.paper-title-section h3 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.paper-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.meta-item .el-icon {
  color: #3b82f6;
}

.check-result-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.result-tabs {
  border-radius: 12px;
}

.tab-content {
  padding: 30px;
  min-height: 400px;
}

.report-section h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
}

.report-content {
  padding: 20px;
}

.report-summary {
  margin-bottom: 30px;
}

.report-summary h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 15px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
}

.stat-value.danger {
  color: #ef4444;
}

.stat-value.warning {
  color: #f59e0b;
}

.stat-value.info {
  color: #10b981;
}

.report-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.bottom-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* 悬浮快捷按钮 */
.fab-container {
  position: fixed;
  right: 32px;
  bottom: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 999;
}

.fab-button {
  width: 50px !important;
  height: 50px !important;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
  transition: transform 0.2s, box-shadow 0.2s;
}

.fab-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.5);
}

.fab-secondary {
  background: white !important;
  border: 1px solid #e5e7eb !important;
  color: #6b7280 !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.fab-secondary:hover {
  color: #3b82f6 !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.25);
}

.fab-fade-enter-active,
.fab-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fab-fade-enter-from,
.fab-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 36px;
  }
  
  .page-description {
    font-size: 16px;
  }
  
  .paper-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .paper-meta {
    grid-template-columns: 1fr;
  }
  
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .bottom-actions {
    flex-direction: column;
    gap: 15px;
  }
  
  .report-actions {
    flex-direction: column;
  }
  
  .fab-container {
    right: 16px;
    bottom: 24px;
  }
  
  .fab-button {
    width: 44px !important;
    height: 44px !important;
  }
}
</style>

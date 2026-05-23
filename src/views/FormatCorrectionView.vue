<template>
  <div class="format-correction-view">
    <div class="page-header">
      <h1>格式修正</h1>
      <p class="page-description">查看并处理论文格式修正建议</p>
    </div>
    
    <div class="correction-content">
      <!-- 论文信息卡片 -->
      <el-card class="paper-card" shadow="hover">
        <div class="paper-info">
          <div class="paper-title">
            <h3>{{ paperInfo.title || '论文标题' }}</h3>
            <el-tag :type="getStatusType(paperInfo.status)">
              {{ getStatusText(paperInfo.status) }}
            </el-tag>
          </div>
          <div class="paper-meta">
            <div class="meta-item">
              <span class="label">文件类型：</span>
              <span class="value">{{ paperInfo.fileType || '未知' }}</span>
            </div>
            <div class="meta-item">
              <span class="label">上传时间：</span>
              <span class="value">{{ formatDate(paperInfo.uploadTime) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">文件大小：</span>
              <span class="value">{{ formatFileSize(paperInfo.fileSize) }}</span>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 修正建议区域 -->
      <div class="correction-section">
        <h3>修正建议</h3>
        <div class="correction-stats">
          <div class="stat-item">
            <span class="stat-label">总建议数：</span>
            <span class="stat-value">{{ corrections.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">待处理：</span>
            <span class="stat-value pending">{{ pendingCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已接受：</span>
            <span class="stat-value applied">{{ appliedCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已拒绝：</span>
            <span class="stat-value rejected">{{ rejectedCount }}</span>
          </div>
        </div>
        
        <!-- 修正建议列表 -->
        <div class="correction-list">
          <div 
            v-for="correction in corrections" 
            :key="correction.id" 
            class="correction-item"
            :class="{ 
              'applied': correction.status === 'applied', 
              'rejected': correction.status === 'rejected' 
            }"
          >
            <div class="correction-header">
              <div class="correction-type">
                <el-tag :type="getCorrectionType(correction.type)">
                  {{ getCorrectionTypeText(correction.type) }}
                </el-tag>
              </div>
              <div class="correction-location">
                {{ correction.location }}
              </div>
              <div class="correction-status">
                <el-tag 
                  :type="correction.status === 'applied' ? 'success' : correction.status === 'rejected' ? 'danger' : 'info'"
                  size="small"
                >
                  {{ getStatusText(correction.status) }}
                </el-tag>
              </div>
            </div>
            
            <div class="correction-content">
              <div class="correction-description">
                <strong>问题描述：</strong>{{ correction.description }}
              </div>
              <div class="correction-suggestion">
                <strong>修正建议：</strong>{{ correction.suggestion }}
              </div>
            </div>
            
            <div class="correction-actions" v-if="correction.status === 'pending'">
              <el-button 
                type="success" 
                size="small" 
                @click="applyCorrection(correction.id)"
              >
                接受建议
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="rejectCorrection(correction.id)"
              >
                拒绝建议
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                @click="viewDetails(correction.id)"
              >
                查看详情
              </el-button>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div class="empty-state" v-if="corrections.length === 0">
          <el-empty description="暂无修正建议" />
        </div>
      </div>
      
      <!-- 底部操作栏 -->
      <div class="action-bar">
        <el-button type="primary" size="large" @click="applyAllCorrections">
          应用所有建议
        </el-button>
        <el-button size="large" @click="backToCompare">
          返回格式对比
        </el-button>
        <el-button size="large" @click="exportResult">
          导出修正结果
        </el-button>
        <el-button
          type="warning"
          size="large"
          @click="$router.push(`/papers/${paperId}/review`)"
        >
          查看差异详情 / 人工审核
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getPaperById,
  getCheckResult,
  getFormatComparison,
  applyAllCorrections as applyAllCorrectionsApi
} from '../api/paper'

const route = useRoute()
const router = useRouter()
const paperId = ref(route.params.paperId)
const latestCheckResultId = ref('')

// 论文信息
const paperInfo = ref({
  title: '',
  fileType: '',
  uploadTime: '',
  fileSize: 0,
  status: ''
})

// 修正建议数据
const corrections = ref([])

// 计算属性
const pendingCount = computed(() => {
  return corrections.value.filter(c => c.status === 'pending').length
})

const appliedCount = computed(() => {
  return corrections.value.filter(c => c.status === 'applied').length
})

const rejectedCount = computed(() => {
  return corrections.value.filter(c => c.status === 'rejected').length
})

// 方法
const getStatusType = (status) => {
  const statusMap = {
    'uploaded': 'info',
    'processing': 'warning',
    'checking': 'warning',
    'checked': 'success',
    'corrected': 'success',
    'failed': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    'uploaded': '已上传',
    'processing': '处理中',
    'checking': '检查中',
    'checked': '已检查',
    'corrected': '已修正',
    'failed': '处理失败',
    'pending': '待处理',
    'applied': '已接受',
    'rejected': '已拒绝'
  }
  return statusMap[status] || '未知'
}

const getCorrectionType = (type) => {
  const typeMap = {
    'title': 'primary',
    'paragraph': 'success',
    'citation': 'warning',
    'toc': 'info',
    'page': 'danger'
  }
  return typeMap[type] || 'info'
}

const getCorrectionTypeText = (type) => {
  const typeMap = {
    'title': '标题格式',
    'paragraph': '段落格式',
    'citation': '引用格式',
    'toc': '目录格式',
    'page': '页面格式'
  }
  return typeMap[type] || '其他'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const applyCorrection = (correctionId) => {
  const correction = corrections.value.find(c => c.id === correctionId)
  if (correction) {
    correction.status = 'applied'
    ElMessage.success('修正建议已接受（本地标记）')
  }
}

const rejectCorrection = (correctionId) => {
  const correction = corrections.value.find(c => c.id === correctionId)
  if (correction) {
    correction.status = 'rejected'
    ElMessage.info('修正建议已拒绝（本地标记）')
  }
}

const applyAllCorrections = async () => {
  if (!latestCheckResultId.value) {
    ElMessage.warning('未找到可用的检查结果，无法应用修正')
    return
  }

  try {
    await applyAllCorrectionsApi(paperId.value, {
      paper_id: paperId.value,
      check_result_id: latestCheckResultId.value,
      fix_all: true,
      issue_ids: corrections.value.filter(c => c.status === 'pending').map(c => String(c.id))
    })
    corrections.value.forEach(correction => {
      if (correction.status === 'pending') {
        correction.status = 'applied'
      }
    })
    ElMessage.success('已提交全部修正请求')
  } catch (error) {
    ElMessage.error('应用修正失败：' + (error.message || '请稍后重试'))
  }
}

const viewDetails = (correctionId) => {
  // 跳转到详细对比页面
  router.push({ 
    name: 'format-check',
    params: { paperId: paperId.value },
    query: { tab: 'compare' }
  })
}

const backToCompare = () => {
  router.push({ 
    name: 'format-check',
    params: { paperId: paperId.value },
    query: { tab: 'compare' }
  })
}

const exportResult = () => {
  router.push({ 
    name: 'export-result', 
    params: { paperId: paperId.value } 
  })
}

const normalizeCheckResult = (result) => {
  if (Array.isArray(result)) {
    return result.length > 0 ? result[0] : null
  }
  return result || null
}

const mapDifferencesToCorrections = (differences = [], fallbackCorrections = []) => {
  if (Array.isArray(fallbackCorrections) && fallbackCorrections.length > 0) {
    return fallbackCorrections.map((item, index) => ({
      id: item.id || `${index + 1}`,
      type: item.type || 'paragraph',
      description: item.description || '格式差异',
      location: item.location_desc || item.location || '未知位置',
      status: item.is_applied ? 'applied' : 'pending',
      suggestion: item.suggestion || '请按模板规范修正'
    }))
  }

  return (differences || []).map((diff, index) => ({
    id: diff.id || `${index + 1}`,
    type: diff.type || 'paragraph',
    description: diff.description || '格式差异',
    location: diff.location?.page ? `第${diff.location.page}页` : '未知位置',
    status: 'pending',
    suggestion: diff.suggestion || diff.expected_value || '请按模板规范修正'
  }))
}

const loadPaperAndCorrections = async () => {
  if (!paperId.value) return

  try {
    const paperRes = await getPaperById(paperId.value)
    if (paperRes) {
      paperInfo.value = {
        title: paperRes.title || paperRes.file_name || '未命名论文',
        fileType: paperRes.filename?.split('.').pop()?.toUpperCase() || paperRes.file_type || '未知',
        uploadTime: paperRes.created_at || paperRes.upload_time || '',
        fileSize: paperRes.file_size || 0,
        status: paperRes.status || ''
      }
    }

    const checkResultRes = await getCheckResult(paperId.value)
    const latest = normalizeCheckResult(checkResultRes)
    if (!latest || !latest.id) {
      corrections.value = []
      return
    }

    latestCheckResultId.value = latest.id
    const comparisonRes = await getFormatComparison(paperId.value, latest.id)
    const differences = comparisonRes?.differences || []
    const comparisonCorrections = comparisonRes?.corrections || []
    corrections.value = mapDifferencesToCorrections(differences, comparisonCorrections)
  } catch (error) {
    ElMessage.error('加载修正数据失败：' + (error.message || '请稍后重试'))
    corrections.value = []
  }
}

onMounted(async () => {
  await loadPaperAndCorrections()
})

watch(
  () => route.params.paperId,
  async (nextPaperId) => {
    paperId.value = nextPaperId
    latestCheckResultId.value = ''
    corrections.value = []
    await loadPaperAndCorrections()
  }
)

</script>

<style scoped>
.format-correction-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 36px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.page-description {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
}

.paper-card {
  margin-bottom: 40px;
}

.paper-info {
  padding: 20px;
}

.paper-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.paper-title h3 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.paper-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-item .label {
  color: #6b7280;
  font-weight: 500;
  margin-right: 8px;
}

.meta-item .value {
  color: #374151;
  font-weight: 600;
}

.correction-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
}

.correction-section h3 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
}

.correction-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.stat-value.pending {
  color: #f59e0b;
}

.stat-value.applied {
  color: #10b981;
}

.stat-value.rejected {
  color: #ef4444;
}

.correction-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.correction-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.correction-item.applied {
  border-color: #10b981;
  background-color: #ecfdf5;
}

.correction-item.rejected {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.correction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.correction-type {
  flex: 1;
}

.correction-location {
  flex: 2;
  color: #6b7280;
  font-size: 14px;
}

.correction-status {
  flex: 1;
  text-align: right;
}

.correction-content {
  margin-bottom: 16px;
}

.correction-description,
.correction-suggestion {
  margin-bottom: 8px;
  line-height: 1.6;
}

.correction-description strong,
.correction-suggestion strong {
  color: #374151;
  margin-right: 8px;
}

.correction-actions {
  display: flex;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.action-bar {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 30px 0;
  border-top: 1px solid #e5e7eb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .format-correction-view {
    padding: 20px 16px;
  }
  
  .page-header h1 {
    font-size: 28px;
  }
  
  .paper-meta {
    grid-template-columns: 1fr;
  }
  
  .correction-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .correction-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .correction-actions {
    flex-direction: column;
  }
  
  .action-bar {
    flex-direction: column;
  }
}
</style>
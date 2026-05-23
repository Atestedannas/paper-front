<template>
  <div class="export-result-view">
    <div class="page-header">
      <h1>结果导出</h1>
      <p class="page-description">导出论文格式检查结果和修正后的文档</p>
    </div>
    
    <div class="export-content">
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
              <span class="label">检查时间：</span>
              <span class="value">{{ formatDate(paperInfo.checkTime) }}</span>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 导出选项 -->
      <div class="export-options">
        <h3>导出选项</h3>
        
        <div class="option-group">
          <h4>文档导出</h4>
          <div class="option-cards">
            <el-card
              class="option-card"
              shadow="hover"
              @click="executeExport('corrected')"
            >
              <div class="card-content">
                <div class="card-icon">📄</div>
                <div class="card-text">
                  <h5>修正后的论文文档</h5>
                  <p>导出已应用所有修正建议的最终版本</p>
                </div>
                <div class="card-arrow">→</div>
              </div>
            </el-card>
            
            <el-card 
              class="option-card" 
              shadow="hover" 
              @click="exportOriginalDocument"
            >
              <div class="card-content">
                <div class="card-icon">📋</div>
                <div class="card-text">
                  <h5>原始论文文档</h5>
                  <p>导出上传时的原始版本</p>
                </div>
                <div class="card-arrow">→</div>
              </div>
            </el-card>
          </div>
        </div>
        
        <div class="option-group">
          <h4>报告导出</h4>
          <div class="option-cards">
            <el-card
              class="option-card"
              shadow="hover"
              @click="executeExport('report')"
            >
              <div class="card-content">
                <div class="card-icon">📊</div>
                <div class="card-text">
                  <h5>格式检查报告</h5>
                  <p>导出详细的格式检查结果报告</p>
                </div>
                <div class="card-arrow">→</div>
              </div>
            </el-card>
            
            <el-card
              class="option-card"
              shadow="hover"
              @click="executeExport('correction-report')"
            >
              <div class="card-content">
                <div class="card-icon">✅</div>
                <div class="card-text">
                  <h5>修正建议报告</h5>
                  <p>导出所有修正建议的详细报告</p>
                </div>
                <div class="card-arrow">→</div>
              </div>
            </el-card>
          </div>
        </div>
        
        <div class="option-group">
          <h4>批量导出</h4>
          <div class="option-cards">
            <el-card
              class="option-card"
              shadow="hover"
              @click="executeExport('all')"
            >
              <div class="card-content">
                <div class="card-icon">📦</div>
                <div class="card-text">
                  <h5>完整导出包</h5>
                  <p>导出所有文档和报告的完整包</p>
                </div>
                <div class="card-arrow">→</div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
      
      <!-- 导出设置 -->
      <div class="export-settings">
        <h3>导出设置</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">文件格式：</label>
            <el-select v-model="exportFormat" placeholder="选择导出格式">
              <el-option label="DOCX (Microsoft Word)" value="docx" />
              <el-option label="PDF (Adobe PDF)" value="pdf" />
              <el-option label="TXT (纯文本)" value="txt" />
              <el-option label="HTML (网页格式)" value="html" />
            </el-select>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">包含内容：</label>
            <el-checkbox-group v-model="includedContent">
              <el-checkbox label="检查摘要">检查摘要</el-checkbox>
              <el-checkbox label="详细问题列表">详细问题列表</el-checkbox>
              <el-checkbox label="修正建议">修正建议</el-checkbox>
              <el-checkbox label="修正前后对比">修正前后对比</el-checkbox>
            </el-checkbox-group>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">文件名：</label>
            <el-input 
              v-model="fileName" 
              placeholder="输入导出文件名"
              :suffix-icon="Document"
            />
          </div>
        </div>
      </div>
      
      <!-- 导出进度 -->
      <div class="export-progress" v-if="exporting">
        <h3>导出进度</h3>
        <div class="progress-content">
          <el-progress 
            :percentage="progressPercentage" 
            :status="progressStatus"
            :stroke-width="8"
          />
          <div class="progress-text">
            <span>{{ progressText }}</span>
            <span v-if="estimatedTime">预计剩余时间：{{ estimatedTime }}</span>
          </div>
        </div>
      </div>
      
      <!-- 底部操作栏 -->
      <div class="action-bar">
        <el-button type="primary" size="large" @click="executeExport('all')" :loading="exporting">
          导出完整包
        </el-button>
        <el-button size="large" @click="backToCorrection">
          返回修正页面
        </el-button>
        <el-button size="large" @click="backToHome">
          返回首页
        </el-button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import {
  getPaperById,
  getCheckResult,
  getFormatComparison,
  getPaperFile,
  exportCorrectedPaper,
  exportCheckReport,
  exportCheckReportHtml
} from '../api/paper'

const route = useRoute()
const router = useRouter()
const paperId = ref(route.params.paperId)
const latestCheckResultId = ref('')
const comparisonData = ref({ differences: [], corrections: [] })

// 论文信息
const paperInfo = ref({
  title: '',
  fileType: '',
  uploadTime: '',
  checkTime: '',
  status: ''
})

// 导出设置
const exportFormat = ref('docx')
const includedContent = ref(['检查摘要', '详细问题列表', '修正建议'])
const fileName = ref('论文格式检查报告')

// 导出状态
const exporting = ref(false)
const progressPercentage = ref(0)
const progressStatus = ref('')
const progressText = ref('')
const estimatedTime = ref('')

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
    'failed': '处理失败'
  }
  return statusMap[status] || '未知'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const normalizeCheckResult = (result) => {
  if (Array.isArray(result)) {
    return result.length > 0 ? result[0] : null
  }
  return result || null
}

const parseFileExt = (contentType = '', fallback = 'docx') => {
  const type = String(contentType).toLowerCase()
  if (type.includes('pdf')) return 'pdf'
  if (type.includes('word') || type.includes('officedocument')) return 'docx'
  return fallback
}

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

const exportReportFile = async (type) => {
  const baseName = fileName.value || '论文格式报告'
  const format = exportFormat.value
  const reportType = type === 'correction-report' ? 'correction-report' : 'report'
  const hasCheckResult = Boolean(latestCheckResultId.value)
  if (!hasCheckResult) {
    throw new Error('缺少检查结果，无法导出报告')
  }

  if (format === 'html') {
    const response = await exportCheckReportHtml(paperId.value, {
      check_result_id: latestCheckResultId.value,
      type: reportType
    })
    downloadBlob(response.data, `${baseName}.html`)
    return
  }

  if (format === 'txt' || format === 'docx' || format === 'pdf' || format === 'json') {
    if (format === 'docx' || format === 'pdf') {
      ElMessage.info('当前报告导出暂不支持该格式，已回退为 TXT')
    }

    const targetFormat = format === 'json' ? 'json' : 'txt'
    const response = await exportCheckReport(paperId.value, {
      check_result_id: latestCheckResultId.value,
      type: reportType,
      format: targetFormat
    })
    const ext = targetFormat === 'json' ? 'json' : 'txt'
    downloadBlob(response.data, `${baseName}.${ext}`)
    return
  }

  throw new Error('暂不支持该导出格式')
}

const exportCorrectedDocumentFile = async () => {
  const response = await exportCorrectedPaper(paperId.value)
  const contentType = response?.headers?.['content-type'] || ''
  const ext = parseFileExt(contentType, 'docx')
  downloadBlob(response.data, `修正后_${paperInfo.value.title || paperId.value}.${ext}`)
}

const exportOriginalDocumentFile = async () => {
  const response = await getPaperFile(paperId.value)
  const contentType = response?.headers?.['content-type'] || ''
  const ext = parseFileExt(contentType, 'docx')
  downloadBlob(response.data, `原始论文_${paperInfo.value.title || paperId.value}.${ext}`)
}

const executeExport = async (type) => {
  exporting.value = true
  progressPercentage.value = 20
  progressStatus.value = ''
  progressText.value = '准备导出数据...'

  try {
    if (type === 'corrected') {
      await exportCorrectedDocumentFile()
      ElMessage.success('修正后论文导出成功')
    } else if (type === 'original') {
      await exportOriginalDocumentFile()
      ElMessage.success('原始论文导出成功')
    } else if (type === 'report' || type === 'correction-report') {
      await exportReportFile(type)
      ElMessage.success('报告导出成功')
    } else if (type === 'all') {
      await exportCorrectedDocumentFile()
      await exportOriginalDocumentFile()
      await exportReportFile('report')
      await exportReportFile('correction-report')
      ElMessage.success('完整导出已完成')
    } else {
      ElMessage.warning('暂不支持该导出类型')
    }
    progressPercentage.value = 100
    progressStatus.value = 'success'
    progressText.value = '导出完成'
  } catch (error) {
    progressStatus.value = 'exception'
    progressText.value = '导出失败'
    ElMessage.error('导出失败：' + (error.message || '请稍后重试'))
  } finally {
    setTimeout(() => {
      exporting.value = false
      progressPercentage.value = 0
      progressStatus.value = ''
      progressText.value = ''
    }, 600)
  }
}

const exportOriginalDocument = () => {
  executeExport('original')
}

const backToCorrection = () => {
  router.push({ 
    name: 'format-correction', 
    params: { paperId: paperId.value } 
  })
}

const backToHome = () => {
  router.push('/')
}

const loadExportData = async () => {
  if (!paperId.value) return
  try {
    const paperRes = await getPaperById(paperId.value)
    if (paperRes) {
      paperInfo.value = {
        title: paperRes.title || paperRes.file_name || '未命名论文',
        fileType: paperRes.filename?.split('.').pop()?.toUpperCase() || paperRes.file_type || '未知',
        uploadTime: paperRes.created_at || paperRes.upload_time || '',
        checkTime: paperRes.updated_at || '',
        status: paperRes.status || ''
      }
      fileName.value = `${paperInfo.value.title || '论文'}_格式报告`
    }

    const checkResultRes = await getCheckResult(paperId.value)
    const latest = normalizeCheckResult(checkResultRes)
    if (latest?.id) {
      latestCheckResultId.value = latest.id
      const comparison = await getFormatComparison(paperId.value, latest.id)
      comparisonData.value = {
        differences: comparison?.differences || [],
        corrections: comparison?.corrections || []
      }
      paperInfo.value.checkTime = latest.created_at || paperInfo.value.checkTime
    }
  } catch (error) {
    ElMessage.error('加载导出数据失败：' + (error.message || '请稍后重试'))
  }
}

onMounted(async () => {
  await loadExportData()
})
</script>

<style scoped>
.export-result-view {
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

.export-options {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
}

.export-options h3 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
}

.option-group {
  margin-bottom: 32px;
}

.option-group h4 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}

.option-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.option-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.card-icon {
  font-size: 32px;
  margin-right: 16px;
}

.card-text {
  flex: 1;
}

.card-text h5 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.card-text p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.card-arrow {
  font-size: 20px;
  color: #9ca3af;
}

.export-settings {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
}

.export-settings h3 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-label {
  font-weight: 600;
  color: #374151;
}

.export-progress {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
}

.export-progress h3 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
}

.progress-content {
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  color: #6b7280;
  font-size: 14px;
}

.action-bar {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 30px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .export-result-view {
    padding: 20px 16px;
  }
  
  .page-header h1 {
    font-size: 28px;
  }
  
  .option-cards {
    grid-template-columns: 1fr;
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .action-bar {
    flex-direction: column;
  }
}
</style>
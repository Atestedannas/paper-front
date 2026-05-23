<template>
  <div class="format-compare-container">
    <div class="compare-header">
      <h2>格式对比</h2>
      <div class="paper-info">
        <span class="paper-title">{{ paperTitle }}</span>
        <span class="paper-type">{{ paperType }}</span>
      </div>
    </div>
    
    <div class="compare-content">
      <!-- 对比控制栏 -->
        <div class="compare-controls">
          <div class="view-controls">
            <span class="control-label">视图模式：</span>
            <el-radio-group v-model="viewMode" size="small">
              <el-radio label="side-by-side">并排显示</el-radio>
              <el-radio label="single-page">单页显示</el-radio>
            </el-radio-group>
          </div>
          <div class="zoom-controls">
            <span class="control-label">缩放比例：</span>
            <el-select v-model="zoomLevel" size="small" @change="handleZoomChange">
              <el-option label="50%" value="0.5" />
              <el-option label="75%" value="0.75" />
              <el-option label="100%" value="1" />
              <el-option label="125%" value="1.25" />
              <el-option label="150%" value="1.5" />
              <el-option label="200%" value="2" />
            </el-select>
          </div>
          <div class="sync-controls">
            <el-switch v-model="syncScroll" active-text="同步滚动" />
            <el-switch v-model="showDiffHighlight" active-text="差异高亮" />
          </div>
          <div class="action-controls">
            <el-button type="primary" size="small" @click="applyAllCorrectionsHandler">
              应用所有修正
            </el-button>
            <el-button size="small" @click="exportCorrected">
              导出修正后的论文
            </el-button>
            <el-button size="small" @click="downloadOriginal">
              下载原始论文
            </el-button>
          </div>
        </div>
      
      <!-- 对比预览区 -->
      <div class="compare-preview" :class="viewMode">
        <!-- 原始版本 -->
        <div class="preview-panel">
          <div class="panel-header">
            <h3>原始版本</h3>
          </div>
          <div class="paper-preview" ref="originalPreviewRef"></div>
        </div>
        
        <!-- 修正版本 -->
        <div class="preview-panel">
          <div class="panel-header">
            <h3>修正版本</h3>
          </div>
          <div class="paper-preview" ref="correctedPreviewRef"></div>
        </div>
      </div>
      
      <!-- 修正建议列表 -->
      <div class="correction-list">
        <div class="list-header">
          <h3>修正建议</h3>
          <div class="list-stats">
            <span class="stat-item">
              待处理：<span class="pending-count">{{ pendingCorrectionsCount }}</span>
            </span>
            <span class="stat-item">
              已应用：<span class="applied-count">{{ appliedCorrectionsCount }}</span>
            </span>
            <span class="stat-item">
              已拒绝：<span class="rejected-count">{{ rejectedCorrectionsCount }}</span>
            </span>
          </div>
        </div>
        
        <el-table :data="corrections" style="width: 100%" stripe @row-click="focusCorrection">
          <el-table-column prop="type" label="类型" width="120">
            <template #default="scope">
              {{ getCorrectionTypeText(scope.row.type) }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="300" />
          <el-table-column prop="location" label="位置" width="150" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'applied' ? 'success' : scope.row.status === 'rejected' ? 'danger' : 'info'">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button
                size="small"
                type="primary"
                @click="applyCorrection(scope.row.id)"
                :disabled="scope.row.status === 'applied'"
              >
                接受
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="rejectCorrection(scope.row.id)"
                :disabled="scope.row.status === 'rejected'"
              >
                拒绝
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 空状态 -->
        <div class="empty-state" v-if="corrections.length === 0">
          <el-empty description="没有修正建议" />
        </div>
      </div>
      
      <!-- 底部操作栏 -->
      <div class="bottom-actions">
        <el-button type="primary" size="large" @click="saveCorrections">
          保存修正结果
        </el-button>
        <el-button size="large" @click="backToCheck">
          返回检查报告
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 
  getPaperPreview, 
  getCorrectedPreview, 
  applyAllCorrections as applyAllCorrectionsApi, 
  applySingleCorrection, 
  rejectSingleCorrection, 
  exportCorrectedPaper,
  getPaperFile,
  getCorrectedFile,
  getCorrections,
  getPaperById,
  getCheckResult,
  getFormatComparison
} from '../api/paper'
import { ElMessage, ElLoading } from 'element-plus'

const route = useRoute()
const props = defineProps({
  paperId: {
    type: String,
    default: ''
  },
  paperTitle: {
    type: String,
    default: '未命名论文'
  },
  paperType: {
    type: String,
    default: '未知类型'
  }
})

// 使用props或路由参数
const paperId = computed(() => props.paperId || route.params.id || route.params.paperId)
const paperTitle = computed(() => props.paperTitle)
const paperType = computed(() => props.paperType)

// 对比配置
const viewMode = ref('side-by-side')
const zoomLevel = ref(1)
const originalPreviewRef = ref(null)
const correctedPreviewRef = ref(null)
const isLoading = ref(false)
const previewError = ref('')
const syncScroll = ref(true)
const showDiffHighlight = ref(true)

// 修正建议
const corrections = ref([])

// 加载对比数据
const loadComparisonData = async () => {
  if (!paperId.value) return
  
  try {
    // 1. 获取检查结果ID
    const checkResultRes = await getCheckResult(paperId.value)
    if (!checkResultRes.data || !checkResultRes.data.id) {
      console.warn('未找到检查结果')
      return
    }
    
    const checkResultId = checkResultRes.data.id
    
    // 2. 获取对比数据
    const comparisonRes = await getFormatComparison(paperId.value, checkResultId)
    if (comparisonRes.data) {
      const report = comparisonRes.data
      
      // 映射后端数据到前端格式
      if (report.corrections && report.corrections.length > 0) {
        corrections.value = report.corrections.map(c => ({
          id: c.id,
          type: c.type,
          description: c.description,
          location: c.location_desc || '未知位置', // 需要后端支持或前端解析
          status: c.is_auto_applicable ? 'pending' : 'applied', // 简化逻辑
          suggestion: JSON.stringify(c.corrected_content) // 简化展示
        }))
      } else if (report.differences && report.differences.length > 0) {
         // 如果没有corrections，尝试从differences构建
         corrections.value = report.differences.map(d => ({
           id: d.id,
           type: d.type,
           description: d.description,
           location: `第${d.location.page}页`,
           status: 'pending',
           suggestion: '建议修改'
         }))
      }
    }
  } catch (error) {
    console.error('获取对比数据失败:', error)
    ElMessage.error('获取对比数据失败')
  }
}

// 统计数据
const pendingCorrectionsCount = computed(() => {
  return corrections.value.filter(c => c.status === 'pending').length
})

const appliedCorrectionsCount = computed(() => {
  return corrections.value.filter(c => c.status === 'applied').length
})

const rejectedCorrectionsCount = computed(() => {
  return corrections.value.filter(c => c.status === 'rejected').length
})

// 预览论文
const previewPaper = async () => {
  isLoading.value = true
  previewError.value = ''
  
  try {
    // 尝试从后端API获取文件
    const isPDF = paperType.value.toLowerCase().includes('pdf')
    
    // 并行加载两个预览
    const [originalResult, correctedResult] = await Promise.allSettled([
      loadPreview(originalPreviewRef.value, 'original', isPDF),
      loadPreview(correctedPreviewRef.value, 'corrected', isPDF)
    ])
    
    // 检查是否有错误
    if (originalResult.status === 'rejected' && correctedResult.status === 'rejected') {
      // 两个都失败，使用模拟数据

      if (isPDF) {
        await previewPDFMock(originalPreviewRef.value, '原始版本')
        await previewPDFMock(correctedPreviewRef.value, '修正版本')
      } else {
        await previewDOCXMock(originalPreviewRef.value, '原始版本')
        await previewDOCXMock(correctedPreviewRef.value, '修正版本')
      }
    }
  } catch (error) {

    previewError.value = '加载预览失败'
    // 回退到模拟预览
    await fallbackToMockPreview()
  } finally {
    isLoading.value = false
  }
}

// 加载单个预览
const loadPreview = async (container, type, isPDF) => {
  if (!container) return
  
  try {
    // 根据类型获取文件
    const response = type === 'original' 
      ? await getPaperFile(paperId.value)
      : await getCorrectedFile(paperId.value)
    
    if (response && response.data) {
      const blob = response.data
      
      if (isPDF) {
        await renderPDF(container, blob)
      } else {
        await renderDOCX(container, blob)
      }
    } else {
      throw new Error('未获取到文件数据')
    }
  } catch (error) {

    throw error
  }
}

// 渲染PDF
const renderPDF = async (container, blob) => {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    
    // 设置Worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    
    const arrayBuffer = await blob.arrayBuffer()
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const numPages = pdfDoc.numPages
    
    container.innerHTML = ''
    const pdfContainer = document.createElement('div')
    pdfContainer.className = 'pdf-pages-container'
    
    for (let i = 1; i <= Math.min(numPages, 10); i++) { // 最多预览10页
      const page = await pdfDoc.getPage(i)
      const viewport = page.getViewport({ scale: zoomLevel.value })
      
      const pageWrapper = document.createElement('div')
      pageWrapper.className = 'pdf-page-wrapper'
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
      pageWrapper.appendChild(canvas)
      
      // 添加页码标识
      const pageNum = document.createElement('div')
      pageNum.className = 'pdf-page-number'
      pageNum.textContent = `第 ${i} 页 / 共 ${numPages} 页`
      pageWrapper.appendChild(pageNum)
      
      pdfContainer.appendChild(pageWrapper)
    }
    
    container.appendChild(pdfContainer)
  } catch (error) {

    throw error
  }
}

// 渲染DOCX
const renderDOCX = async (container, blob) => {
  try {
    const docxPreview = await import('docx-preview')
    
    container.innerHTML = ''
    const docxContainer = document.createElement('div')
    docxContainer.className = 'docx-container'
    container.appendChild(docxContainer)
    
    await docxPreview.renderAsync(blob, docxContainer, null, {
      className: 'docx-preview-content',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: true
    })
  } catch (error) {

    throw error
  }
}

// 回退到模拟预览
const fallbackToMockPreview = async () => {
  const isPDF = paperType.value.toLowerCase().includes('pdf')
  if (isPDF) {
    await previewPDFMock(originalPreviewRef.value, '原始版本')
    await previewPDFMock(correctedPreviewRef.value, '修正版本')
  } else {
    await previewDOCXMock(originalPreviewRef.value, '原始版本')
    await previewDOCXMock(correctedPreviewRef.value, '修正版本')
  }
}

// 模拟PDF预览
const previewPDFMock = async (container, title) => {
  container.innerHTML = ''
  
  const mockContent = document.createElement('div')
  mockContent.className = 'mock-pdf-content'
  mockContent.innerHTML = `
    <div class="mock-page">
      <div class="mock-page-header">${title} - 第1页</div>
      <div class="mock-page-content">
        <h1 class="mock-title">论文标题示例</h1>
        <p class="mock-paragraph">这是一段示例文本，用于模拟PDF文件的预览效果。</p>
        <p class="mock-paragraph">这是第二段示例文本，用于展示段落格式。</p>
      </div>
      <div class="mock-page-footer">页码：1</div>
    </div>
    <div class="mock-page">
      <div class="mock-page-header">${title} - 第2页</div>
      <div class="mock-page-content">
        <h2 class="mock-subtitle">2. 研究方法</h2>
        <p class="mock-paragraph">这是研究方法部分的示例文本。</p>
        <p class="mock-paragraph">这是第二段研究方法文本。</p>
      </div>
      <div class="mock-page-footer">页码：2</div>
    </div>
  `
  
  container.appendChild(mockContent)
}

// 模拟DOCX预览
const previewDOCXMock = async (container, title) => {
  container.innerHTML = ''
  
  const mockContent = document.createElement('div')
  mockContent.className = 'mock-docx-content'
  mockContent.innerHTML = `
    <div class="mock-docx-header">${title}</div>
    <h1 class="mock-docx-title">论文标题示例</h1>
    <h2 class="mock-docx-subtitle">1. 引言</h2>
    <p class="mock-docx-paragraph">这是引言部分的示例文本，用于模拟DOCX文件的预览效果。</p>
    <p class="mock-docx-paragraph">这是第二段引言文本，用于展示段落格式。</p>
    <h2 class="mock-docx-subtitle">2. 研究方法</h2>
    <p class="mock-docx-paragraph">这是研究方法部分的示例文本。</p>
    <p class="mock-docx-paragraph">这是第二段研究方法文本。</p>
    <h2 class="mock-docx-subtitle">3. 研究结果</h2>
    <p class="mock-docx-paragraph">这是研究结果部分的示例文本。</p>
    <p class="mock-docx-paragraph">这是第二段研究结果文本。</p>
  `
  
  container.appendChild(mockContent)
}

// PDF预览
const previewPDF = async (url, container) => {
  const { getDocument } = await import('pdfjs-dist')
  
  // 直接使用CDN的worker
  getDocument().GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js'
  
  const pdfDoc = await getDocument(url).promise
  const numPages = pdfDoc.numPages
  
  container.innerHTML = ''
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i)
    const viewport = page.getViewport({ scale: zoomLevel.value })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise
    
    container.appendChild(canvas)
  }
}

// DOCX预览
const previewDOCX = async (url, container) => {
  const { renderAsync } = await import('docx-preview')
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  
  container.innerHTML = ''
  await renderAsync(arrayBuffer, container, { scale: zoomLevel.value })
}

// 处理缩放变化
const handleZoomChange = () => {
  // 重新预览论文以应用新的缩放级别
  previewPaper()
}

const attachSyncScroll = () => {
  const a = originalPreviewRef.value
  const b = correctedPreviewRef.value
  if (!a || !b) return
  let locking = false
  const sync = (from, to) => {
    if (!syncScroll.value) return
    if (locking) return
    locking = true
    const ratio = from.scrollTop / (from.scrollHeight - from.clientHeight || 1)
    to.scrollTop = ratio * (to.scrollHeight - to.clientHeight)
    locking = false
  }
  a.onscroll = () => sync(a, b)
  b.onscroll = () => sync(b, a)
}

const clearDiffMarks = (container) => {
  if (!container) return
  container.querySelectorAll('.diff-mark').forEach(el => el.remove())
}

const addDiffMark = (container, targetEl) => {
  if (!container || !targetEl) return
  const rect = targetEl.getBoundingClientRect()
  const parentRect = container.getBoundingClientRect()
  const mark = document.createElement('div')
  mark.className = 'diff-mark'
  mark.style.top = `${rect.top - parentRect.top + container.scrollTop - 8}px`
  mark.style.left = `${rect.left - parentRect.left - 8}px`
  mark.style.width = `${rect.width + 16}px`
  mark.style.height = `${rect.height + 16}px`
  container.appendChild(mark)
}

const findTargetByType = (container, type) => {
  if (!container) return null
  const map = {
    title: '.mock-docx-title, h1',
    paragraph: '.mock-docx-paragraph, p',
    citation: '.mock-docx-paragraph',
    toc: '.mock-docx-subtitle, h2',
    page: '.pdf-page-wrapper'
  }
  const selector = map[type] || 'p'
  return container.querySelector(selector)
}

const focusCorrection = (row) => {
  const o = originalPreviewRef.value
  const c = correctedPreviewRef.value
  clearDiffMarks(o)
  clearDiffMarks(c)
  const oTarget = findTargetByType(o, row.type)
  const cTarget = findTargetByType(c, row.type)
  if (oTarget) {
    o.scrollTo({ top: oTarget.offsetTop - 40, behavior: 'smooth' })
    if (showDiffHighlight.value) addDiffMark(o, oTarget)
  }
  if (cTarget) {
    c.scrollTo({ top: cTarget.offsetTop - 40, behavior: 'smooth' })
    if (showDiffHighlight.value) addDiffMark(c, cTarget)
  }
}

// 应用所有修正
const applyAllCorrectionsHandler = async () => {
  try {
    await applyAllCorrectionsApi(paperId.value)
    // 更新所有修正状态
    corrections.value.forEach(correction => {
      if (correction.status === 'pending') {
        correction.status = 'applied'
      }
    })
    ElMessage.success('所有修正已应用')
    // 重新加载修正后的预览
    await loadPreview(correctedPreviewRef.value, 'corrected', paperType.value.toLowerCase().includes('pdf'))
  } catch (error) {
    ElMessage.error('应用修正失败：' + error.message)
  }
}

// 应用单个修正
const applyCorrection = async (correctionId) => {
  try {
    await applySingleCorrection(paperId.value, correctionId)
    const correction = corrections.value.find(c => c.id === correctionId)
    if (correction) {
      correction.status = 'applied'
    }
    ElMessage.success('修正已应用')
  } catch (error) {
    ElMessage.error('应用修正失败：' + error.message)
  }
}

// 拒绝单个修正
const rejectCorrection = async (correctionId) => {
  try {
    await rejectSingleCorrection(paperId.value, correctionId)
    const correction = corrections.value.find(c => c.id === correctionId)
    if (correction) {
      correction.status = 'rejected'
    }
    ElMessage.success('修正已拒绝')
  } catch (error) {
    ElMessage.error('拒绝修正失败：' + error.message)
  }
}

// 导出修正后的论文
const exportCorrected = async () => {
  try {
    const response = await exportCorrectedPaper(paperId.value)
    
    if (response && response.data) {
      const blob = new Blob([response.data], { 
        type: response.headers?.['content-type'] || 'application/octet-stream' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // 根据文件类型设置扩展名
      const ext = paperType.value.toLowerCase().includes('pdf') ? 'pdf' : 'docx'
      link.download = `修正后的论文_${paperId.value}.${ext}`
      link.click()
      window.URL.revokeObjectURL(url)
      
      ElMessage.success('论文导出成功')
    } else {
      ElMessage.warning('暂无可导出的文件')
    }
  } catch (error) {
    ElMessage.error('论文导出失败：' + (error.message || '请稍后重试'))
  }
}

// 保存修正结果
const saveCorrections = () => {
  ElMessage.success('修正结果已保存')
}

const downloadOriginal = async () => {
  try {
    const response = await getPaperFile(paperId.value)
    if (response && response.data) {
      const blob = new Blob([response.data], { type: response.headers?.['content-type'] || 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const ext = paperType.value.toLowerCase().includes('pdf') ? 'pdf' : 'docx'
      link.download = `原始论文_${paperId.value}.${ext}`
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success('原始论文下载成功')
    } else {
      ElMessage.warning('暂无可下载的原始文件')
    }
  } catch (error) {
    ElMessage.error('下载失败：' + (error.message || '请稍后重试'))
  }
}

// 返回检查报告
const backToCheck = () => {
  window.history.back()
}

// 获取修正类型文本
const getCorrectionTypeText = (type) => {
  const typeMap = {
    title: '标题格式',
    paragraph: '段落格式',
    citation: '引用格式',
    toc: '目录格式',
    page: '页码格式',
    figure: '图表格式',
    reference: '参考文献格式'
  }
  return typeMap[type] || type
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    applied: '已应用',
    rejected: '已拒绝'
  }
  return statusMap[status] || status
}

onMounted(() => {
  previewPaper()
  loadComparisonData()
  setTimeout(() => attachSyncScroll(), 200)
})

watch(() => paperId.value, () => {
  previewPaper()
  loadComparisonData()
  setTimeout(() => attachSyncScroll(), 200)
})

watch(() => viewMode.value, () => {
  // 视图模式变化时，重新渲染以适应新布局
  setTimeout(() => {
    previewPaper()
    setTimeout(() => attachSyncScroll(), 200)
  }, 100)
})
</script>

<style scoped>
.format-compare-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  background-color: transparent;
  border-radius: var(--border-radius-lg);
  box-shadow: none;
}

.compare-header {
  margin-bottom: var(--spacing-xl);
}

.compare-header h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
  font-size: 1.75rem;
}

.paper-info {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.paper-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-family-heading);
}

.paper-type {
  font-size: 0.9rem;
  color: var(--primary-color);
  background-color: var(--primary-light);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-weight: 500;
}

.compare-content {
  background-color: var(--bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  border: none;
}

.compare-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  flex-wrap: wrap;
  gap: var(--spacing-xl);
  border: 1px solid var(--border-color);
}

.view-controls,
.zoom-controls,
.action-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.control-label {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 600;
  font-family: var(--font-family-heading);
}

.compare-preview {
  display: flex;
  gap: var(--spacing-lg);
  height: 500px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background-color: var(--bg-primary);
}

.compare-preview.single-page {
  flex-direction: column;
}

.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
  overflow: hidden;
  background-color: var(--bg-primary);
}

.compare-preview.single-page .preview-panel {
  border-right: none;
  border-bottom: 1px solid var(--border-color);
}

.compare-preview.single-page .preview-panel:last-child {
  border-bottom: none;
}

.panel-header {
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
  font-family: var(--font-family-heading);
}

.paper-preview {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xl);
  background-color: var(--bg-primary);
  position: relative;
}

/* 模拟PDF样式 */
.mock-pdf-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  align-items: center;
}

.mock-page {
  width: 80%;
  min-height: 400px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-xl);
  background-color: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.mock-page:hover {
  box-shadow: var(--shadow-md);
}

.mock-page-header,
.mock-page-footer {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.85rem;
  margin: var(--spacing-sm) 0;
}

.mock-page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.mock-title {
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  color: var(--brand-color);
  font-family: var(--font-family-heading);
}

.mock-subtitle {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-family-heading);
}

.mock-paragraph {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
  font-family: var(--font-family-body);
}

/* 模拟DOCX样式 */
.mock-docx-content {
  width: 100%;
  background-color: var(--bg-primary);
  padding: var(--spacing-xl);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.mock-docx-content:hover {
  box-shadow: var(--shadow-md);
}

.mock-docx-header {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-xl);
}

.mock-docx-title {
  font-size: 1.75rem;
  font-weight: 600;
  text-align: center;
  color: var(--brand-color);
  margin-bottom: var(--spacing-xl);
  font-family: var(--font-family-heading);
}

.mock-docx-subtitle {
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: var(--spacing-xl) 0 var(--spacing-lg) 0;
  font-family: var(--font-family-heading);
}

.mock-docx-paragraph {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
  text-indent: 2em;
  font-family: var(--font-family-body);
}

.correction-list {
  margin-top: 0;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.list-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  font-family: var(--font-family-heading);
}

.list-stats {
  display: flex;
  gap: var(--spacing-xl);
  align-items: center;
  flex-wrap: wrap;
}

.stat-item {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.pending-count {
  color: var(--warning-color);
  font-weight: 700;
}

.applied-count {
  color: var(--success-color);
  font-weight: 700;
}

.rejected-count {
  color: var(--error-color);
  font-weight: 700;
}

/* 表格样式优化 */
:deep(.el-table) {
  border: none;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: none;
}

:deep(.el-table__header-wrapper) {
  background-color: var(--bg-secondary);
}

:deep(.el-table__header-wrapper th) {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  font-family: var(--font-family-heading);
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-table__body-wrapper tr) {
  transition: background-color 0.2s ease;
}

:deep(.el-table__body-wrapper tr:hover) {
  background-color: var(--bg-secondary);
}

:deep(.el-table__body-wrapper tr.el-table__row--striped) {
  background-color: var(--bg-primary);
}

:deep(.el-table__body-wrapper tr.el-table__row--striped:hover) {
  background-color: var(--bg-secondary);
}

/* 按钮样式优化 */
:deep(.el-button) {
  font-weight: 500;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-xs) var(--spacing-md);
  transition: all 0.2s ease;
}

:deep(.el-button--primary) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.el-button--primary:hover) {
  background-color: var(--primary-hover);
  border-color: var(--primary-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

:deep(.el-button--danger) {
  background-color: var(--error-color);
  border-color: var(--error-color);
}

:deep(.el-button--danger:hover) {
  background-color: #dc2626;
  border-color: #dc2626;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.bottom-actions {
  display: flex;
  gap: var(--spacing-lg);
  justify-content: center;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
}

.bottom-actions :deep(.el-button) {
  padding: var(--spacing-sm) var(--spacing-xl);
  font-size: 1rem;
  font-weight: 600;
}

.empty-state {
  padding: var(--spacing-xxxl) 0;
  text-align: center;
}

/* 滚动条样式 */
.paper-preview::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.paper-preview::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
}

.paper-preview::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: var(--border-radius-sm);
  transition: background-color 0.2s ease;
}

.paper-preview::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* 标签样式优化 */
:deep(.el-tag) {
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-weight: 500;
  font-size: 0.85rem;
}

/* 单选框和选择器样式优化 */
:deep(.el-radio__label),
:deep(.el-select) {
  font-family: var(--font-family-body);
  color: var(--text-primary);
}

:deep(.el-radio__input.is-checked .el-radio__inner) {
  border-color: var(--primary-color);
  background-color: var(--primary-color);
}

:deep(.el-radio__input.is-checked+.el-radio__label) {
  color: var(--primary-color);
  font-weight: 500;
}

:deep(.el-select__wrapper) {
  border-radius: var(--border-radius-sm);
  border-color: var(--border-color);
}

:deep(.el-select__wrapper:hover) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

:deep(.el-select__wrapper.is-focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

/* PDF预览样式 */
.pdf-pages-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.pdf-page-wrapper {
  position: relative;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.pdf-page-wrapper canvas {
  display: block;
  max-width: 100%;
  height: auto;
}

.pdf-page-number {
  text-align: center;
  padding: 8px;
  background: #f5f5f5;
  color: #666;
  font-size: 12px;
  border-top: 1px solid #e0e0e0;
}

/* DOCX预览样式 */
.docx-container {
  background: white;
  min-height: 400px;
  padding: 20px;
}

:deep(.diff-mark) {
  position: absolute;
  border: 2px solid rgba(59,130,246,0.8);
  box-shadow: 0 0 0 4px rgba(59,130,246,0.15);
  border-radius: 8px;
  pointer-events: none;
}

:deep(.docx-preview-content) {
  font-family: 'Times New Roman', serif;
  line-height: 1.6;
}

:deep(.docx-wrapper) {
  background: white;
  padding: 40px;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 加载状态样式 */
.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.preview-loading .el-icon {
  font-size: 48px;
  color: var(--primary-color);
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.preview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #f56c6c;
  text-align: center;
  padding: 20px;
}

.preview-error .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>

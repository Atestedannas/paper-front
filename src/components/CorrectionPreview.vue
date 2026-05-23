<template>
  <div class="correction-preview">
    <!-- 预览控制栏 -->
    <div class="preview-controls">
      <div class="control-left">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="original">原文</el-radio-button>
          <el-radio-button label="suggested">修正后</el-radio-button>
          <el-radio-button label="split">对比视图</el-radio-button>
        </el-radio-group>
        
        <el-select v-model="zoomLevel" size="small" style="width: 120px; margin-left: 12px">
          <el-option label="50%" value="0.5" />
          <el-option label="75%" value="0.75" />
          <el-option label="100%" value="1" />
          <el-option label="125%" value="1.25" />
          <el-option label="150%" value="1.5" />
        </el-select>
      </div>
      
      <div class="control-right">
        <el-button size="small" @click="zoomOut">
          <el-icon><ZoomOut /></el-icon>
          缩小
        </el-button>
        <el-button size="small" @click="zoomIn">
          <el-icon><ZoomIn /></el-icon>
          放大
        </el-button>
        <el-button size="small" @click="fitToWidth">
          <el-icon><FullScreen /></el-icon>
          适应宽度
        </el-button>
        <el-button size="small" @click="downloadPreview">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
      </div>
    </div>

    <!-- 预览内容区 -->
    <div class="preview-content" :class="viewMode">
      <!-- 原文预览 -->
      <div v-if="viewMode === 'original' || viewMode === 'split'" class="preview-panel original-preview">
        <div class="panel-header">
          <h4>原文预览</h4>
          <el-tag type="info" size="small">原始内容</el-tag>
        </div>
        <div class="paper-content" :style="{ transform: `scale(${zoomLevel})` }">
          <div class="paper-page" v-html="originalContent"></div>
        </div>
      </div>

      <!-- 修正后预览 -->
      <div v-if="viewMode === 'suggested' || viewMode === 'split'" class="preview-panel suggested-preview">
        <div class="panel-header">
          <h4>修正后预览</h4>
          <el-tag type="success" size="small">修正后内容</el-tag>
        </div>
        <div class="paper-content" :style="{ transform: `scale(${zoomLevel})` }">
          <div class="paper-page" v-html="suggestedContent"></div>
        </div>
      </div>

      <!-- 对比视图分隔线 -->
      <div v-if="viewMode === 'split'" class="split-divider">
        <div class="divider-line"></div>
        <div class="divider-handle">
          <el-icon><Switch /></el-icon>
        </div>
      </div>
    </div>

    <!-- 修正标记显示 -->
    <div class="correction-marks" v-if="activeCorrections.length > 0">
      <div class="marks-header">
        <h4>修正标记</h4>
        <el-button size="small" @click="toggleMarks">
          {{ showMarks ? '隐藏标记' : '显示标记' }}
        </el-button>
      </div>
      
      <div v-if="showMarks" class="marks-list">
        <div 
          v-for="correction in activeCorrections" 
          :key="correction.id"
          class="mark-item"
          :class="`severity-${correction.severity}`"
          @click="highlightCorrection(correction)"
        >
          <div class="mark-header">
            <span class="mark-type">{{ getTypeText(correction.type) }}</span>
            <span class="mark-severity" :class="`severity-${correction.severity}`">
              {{ getSeverityText(correction.severity) }}
            </span>
          </div>
          <div class="mark-description">{{ correction.description }}</div>
          <div class="mark-location">位置: {{ correction.location }}</div>
        </div>
      </div>
    </div>

    <!-- 页面导航 -->
    <div class="page-navigation">
      <el-button-group>
        <el-button size="small" @click="prevPage" :disabled="currentPage <= 1">
          <el-icon><ArrowLeft /></el-icon>
          上一页
        </el-button>
        <el-button size="small">
          第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
        </el-button>
        <el-button size="small" @click="nextPage" :disabled="currentPage >= totalPages">
          下一页
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </el-button-group>
      
      <el-input-number
        v-model="currentPage"
        :min="1"
        :max="totalPages"
        size="small"
        style="width: 100px; margin-left: 12px"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  ZoomOut, 
  ZoomIn, 
  FullScreen, 
  Download, 
  Switch, 
  ArrowLeft, 
  ArrowRight 
} from '@element-plus/icons-vue'

// 组件属性
const props = defineProps({
  paperId: {
    type: String,
    required: true
  },
  originalContent: {
    type: String,
    default: ''
  },
  suggestedContent: {
    type: String,
    default: ''
  },
  corrections: {
    type: Array,
    default: () => []
  },
  totalPages: {
    type: Number,
    default: 1
  }
})

// 组件事件
const emit = defineEmits(['page-change', 'correction-highlight'])

// 响应式数据
const viewMode = ref('split')
const zoomLevel = ref(1)
const currentPage = ref(1)
const showMarks = ref(true)

// 计算属性
const activeCorrections = computed(() => {
  return props.corrections.filter(correction => 
    correction.status === 'pending' || correction.status === 'applied'
  )
})

// 方法
const zoomIn = () => {
  if (zoomLevel.value < 2) {
    zoomLevel.value += 0.1
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.3) {
    zoomLevel.value -= 0.1
  }
}

const fitToWidth = () => {
  zoomLevel.value = 1
}

const downloadPreview = () => {
  ElMessage.info('下载功能开发中...')
}

const toggleMarks = () => {
  showMarks.value = !showMarks.value
}

const highlightCorrection = (correction) => {
  emit('correction-highlight', correction)
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    emit('page-change', currentPage.value)
  }
}

const nextPage = () => {
  if (currentPage.value < props.totalPages) {
    currentPage.value++
    emit('page-change', currentPage.value)
  }
}

const getTypeText = (type) => {
  const typeMap = {
    'format': '格式问题',
    'citation': '引用问题',
    'reference': '参考文献',
    'structure': '结构问题',
    'language': '语言问题'
  }
  return typeMap[type] || type
}

const getSeverityText = (severity) => {
  const severityMap = {
    'critical': '严重',
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return severityMap[severity] || severity
}

// 监听页面变化
watch(currentPage, (newPage) => {
  emit('page-change', newPage)
})

// 监听缩放级别变化
watch(zoomLevel, (newZoom) => {
  // 可以添加缩放相关的逻辑

})

onMounted(() => {
  // 组件挂载时的初始化逻辑

})
</script>

<style scoped>
.correction-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.preview-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.control-left,
.control-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.preview-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.preview-content.split {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
}

.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.panel-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.paper-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: var(--spacing-lg);
  overflow: auto;
  transform-origin: top center;
  transition: transform 0.2s ease;
}

.paper-page {
  background: white;
  box-shadow: var(--shadow-lg);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-xl);
  min-height: 297mm; /* A4 高度 */
  width: 210mm; /* A4 宽度 */
  max-width: 100%;
  font-family: 'Times New Roman', serif;
  font-size: 12pt;
  line-height: 1.5;
  color: #000;
}

.split-divider {
  position: relative;
  width: 4px;
  background-color: var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.divider-line {
  width: 1px;
  height: 100%;
  background-color: var(--border-color);
}

.divider-handle {
  position: absolute;
  width: 32px;
  height: 32px;
  background-color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  box-shadow: var(--shadow-md);
}

.correction-marks {
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
}

.marks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
}

.marks-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.marks-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 0 var(--spacing-md) var(--spacing-md);
}

.mark-item {
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mark-item:hover {
  background-color: var(--bg-tertiary);
  transform: translateX(2px);
}

.mark-item.severity-critical {
  border-left-color: var(--error-color);
}

.mark-item.severity-high {
  border-left-color: var(--warning-color);
}

.mark-item.severity-medium {
  border-left-color: var(--info-color);
}

.mark-item.severity-low {
  border-left-color: var(--success-color);
}

.mark-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.mark-type {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.mark-severity {
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
  font-weight: 500;
}

.mark-severity.severity-critical {
  background-color: var(--error-color);
  color: white;
}

.mark-severity.severity-high {
  background-color: var(--warning-color);
  color: white;
}

.mark-severity.severity-medium {
  background-color: var(--info-color);
  color: white;
}

.mark-severity.severity-low {
  background-color: var(--success-color);
  color: white;
}

.mark-description {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.4;
  margin-bottom: var(--spacing-xs);
}

.mark-location {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

.page-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  gap: var(--spacing-md);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preview-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-left,
  .control-right {
    justify-content: center;
  }
  
  .preview-content.split {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto 1fr;
  }
  
  .split-divider {
    width: 100%;
    height: 4px;
  }
  
  .divider-line {
    width: 100%;
    height: 1px;
  }
  
  .divider-handle {
    left: 50%;
    transform: translateX(-50%);
  }
  
  .page-navigation {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}

/* 滚动条样式 */
.marks-list::-webkit-scrollbar {
  width: 6px;
}

.marks-list::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.marks-list::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 3px;
}

.marks-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

.paper-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.paper-content::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.paper-content::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 4px;
}

.paper-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
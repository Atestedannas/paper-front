<template>
  <div class="correction-actions">
    <!-- 批量操作栏 -->
    <div class="batch-actions">
      <div class="actions-left">
        <el-checkbox 
          v-model="selectAll" 
          :indeterminate="isIndeterminate"
          @change="handleSelectAll"
        >
          全选
        </el-checkbox>
        
        <span class="selected-count" v-if="selectedCorrections.length > 0">
          已选择 {{ selectedCorrections.length }} 项
        </span>
      </div>
      
      <div class="actions-right">
        <el-button-group>
          <el-button 
            type="primary" 
            size="small"
            :disabled="selectedCorrections.length === 0"
            @click="batchApply"
          >
            <el-icon><Check /></el-icon>
            批量应用
          </el-button>
          <el-button 
            type="danger" 
            size="small"
            :disabled="selectedCorrections.length === 0"
            @click="batchReject"
          >
            <el-icon><Close /></el-icon>
            批量拒绝
          </el-button>
        </el-button-group>
        
        <el-dropdown @command="handleExportCommand" style="margin-left: 12px">
          <el-button type="default" size="small">
            <el-icon><Download /></el-icon>
            导出
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="report">导出修正报告</el-dropdown-item>
              <el-dropdown-item command="document">导出修正文档</el-dropdown-item>
              <el-dropdown-item command="summary">导出修正摘要</el-dropdown-item>
              <el-dropdown-item divided command="all">导出全部数据</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        
        <el-button 
          type="default" 
          size="small"
          style="margin-left: 12px"
          @click="refreshData"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 修正统计信息 -->
    <div class="correction-stats">
      <div class="stats-grid">
        <div class="stat-card" v-for="stat in stats" :key="stat.type">
          <div class="stat-icon" :class="stat.type">
            <el-icon :size="24">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
          <div class="stat-trend" :class="stat.trend" v-if="stat.trend">
            <el-icon :size="12">
              <TrendingUp v-if="stat.trend === 'up'" />
              <TrendingDown v-else-if="stat.trend === 'down'" />
            </el-icon>
            <span>{{ stat.trendValue }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 修正过滤器 -->
    <div class="correction-filters">
      <div class="filters-header">
        <h4>筛选条件</h4>
        <el-button 
          type="text" 
          size="small" 
          @click="resetFilters"
          :disabled="!hasActiveFilters"
        >
          重置筛选
        </el-button>
      </div>
      
      <div class="filters-content">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="6">
            <div class="filter-item">
              <label>修正类型</label>
              <el-select 
                v-model="filters.type" 
                placeholder="选择类型" 
                clearable
                size="small"
                style="width: 100%"
              >
                <el-option label="格式问题" value="format" />
                <el-option label="引用问题" value="citation" />
                <el-option label="参考文献" value="reference" />
                <el-option label="结构问题" value="structure" />
                <el-option label="语言问题" value="language" />
              </el-select>
            </div>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="6">
            <div class="filter-item">
              <label>严重程度</label>
              <el-select 
                v-model="filters.severity" 
                placeholder="选择严重程度" 
                clearable
                size="small"
                style="width: 100%"
              >
                <el-option label="严重" value="critical" />
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </div>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="6">
            <div class="filter-item">
              <label>修正状态</label>
              <el-select 
                v-model="filters.status" 
                placeholder="选择状态" 
                clearable
                size="small"
                style="width: 100%"
              >
                <el-option label="待处理" value="pending" />
                <el-option label="已应用" value="applied" />
                <el-option label="已拒绝" value="rejected" />
              </el-select>
            </div>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="6">
            <div class="filter-item">
              <label>时间范围</label>
              <el-date-picker
                v-model="filters.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="small"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </div>
          </el-col>
        </el-row>
        
        <div class="filter-actions">
          <el-button 
            type="primary" 
            size="small" 
            @click="applyFilters"
          >
            <el-icon><Search /></el-icon>
            应用筛选
          </el-button>
          
          <el-button 
            type="default" 
            size="small" 
            @click="clearFilters"
          >
            <el-icon><Delete /></el-icon>
            清除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 批量操作确认对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      :title="batchDialogTitle"
      width="400px"
      :before-close="handleCloseBatchDialog"
    >
      <div class="batch-dialog-content">
        <p>确定要{{ batchActionType === 'apply' ? '应用' : '拒绝' }}选中的 {{ selectedCorrections.length }} 项修正建议吗？</p>
        
        <div class="selected-items" v-if="selectedCorrections.length > 0">
          <h5>选中的修正项：</h5>
          <ul>
            <li 
              v-for="correction in selectedCorrections.slice(0, 5)" 
              :key="correction.id"
              class="selected-item"
            >
              {{ correction.description }}
            </li>
            <li v-if="selectedCorrections.length > 5" class="selected-item more">
              ... 还有 {{ selectedCorrections.length - 5 }} 项
            </li>
          </ul>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseBatchDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmBatchAction"
            :loading="batchLoading"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Check, 
  Close, 
  Download, 
  ArrowDown, 
  Refresh, 
  Search, 
  Delete,
  TrendingUp,
  TrendingDown
} from '@element-plus/icons-vue'

// 组件属性
const props = defineProps({
  paperId: {
    type: String,
    required: true
  },
  corrections: {
    type: Array,
    default: () => []
  },
  selectedCorrections: {
    type: Array,
    default: () => []
  }
})

// 组件事件
const emit = defineEmits([
  'select-all',
  'batch-apply',
  'batch-reject',
  'export-data',
  'refresh',
  'filter-change'
])

// 响应式数据
const selectAll = ref(false)
const isIndeterminate = ref(false)
const batchDialogVisible = ref(false)
const batchActionType = ref('')
const batchLoading = ref(false)

const filters = ref({
  type: '',
  severity: '',
  status: '',
  dateRange: []
})

// 计算属性
const stats = computed(() => {
  const total = props.corrections.length
  const pending = props.corrections.filter(c => c.status === 'pending').length
  const applied = props.corrections.filter(c => c.status === 'applied').length
  const rejected = props.corrections.filter(c => c.status === 'rejected').length
  
  return [
    {
      type: 'total',
      icon: 'Document',
      value: total,
      label: '总修正数',
      trend: 'up',
      trendValue: '+5'
    },
    {
      type: 'pending',
      icon: 'Clock',
      value: pending,
      label: '待处理',
      trend: pending > 0 ? 'warning' : '',
      trendValue: pending > 0 ? '需处理' : ''
    },
    {
      type: 'applied',
      icon: 'Check',
      value: applied,
      label: '已应用',
      trend: 'up',
      trendValue: '+2'
    },
    {
      type: 'rejected',
      icon: 'Close',
      value: rejected,
      label: '已拒绝',
      trend: 'down',
      trendValue: '-1'
    }
  ]
})

const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== ''
  )
})

const batchDialogTitle = computed(() => {
  return batchActionType.value === 'apply' ? '批量应用修正' : '批量拒绝修正'
})

// 方法
const handleSelectAll = (value) => {
  emit('select-all', value)
}

const batchApply = () => {
  if (props.selectedCorrections.length === 0) {
    ElMessage.warning('请先选择要应用的修正项')
    return
  }
  
  batchActionType.value = 'apply'
  batchDialogVisible.value = true
}

const batchReject = () => {
  if (props.selectedCorrections.length === 0) {
    ElMessage.warning('请先选择要拒绝的修正项')
    return
  }
  
  batchActionType.value = 'reject'
  batchDialogVisible.value = true
}

const handleExportCommand = (command) => {
  emit('export-data', {
    type: command,
    filters: filters.value,
    selected: props.selectedCorrections
  })
  
  ElMessage.info(`导出${getExportTypeText(command)}功能开发中...`)
}

const getExportTypeText = (type) => {
  const typeMap = {
    'report': '修正报告',
    'document': '修正文档',
    'summary': '修正摘要',
    'all': '全部数据'
  }
  return typeMap[type] || type
}

const refreshData = () => {
  emit('refresh')
  ElMessage.success('数据已刷新')
}

const applyFilters = () => {
  emit('filter-change', filters.value)
}

const clearFilters = () => {
  filters.value = {
    type: '',
    severity: '',
    status: '',
    dateRange: []
  }
  emit('filter-change', filters.value)
}

const resetFilters = () => {
  clearFilters()
}

const handleCloseBatchDialog = () => {
  batchDialogVisible.value = false
  batchActionType.value = ''
  batchLoading.value = false
}

const confirmBatchAction = async () => {
  try {
    batchLoading.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (batchActionType.value === 'apply') {
      emit('batch-apply', props.selectedCorrections)
      ElMessage.success(`成功应用 ${props.selectedCorrections.length} 项修正`)
    } else {
      emit('batch-reject', props.selectedCorrections)
      ElMessage.success(`成功拒绝 ${props.selectedCorrections.length} 项修正`)
    }
    
    handleCloseBatchDialog()
  } catch (error) {
    ElMessage.error('操作失败，请重试')
  } finally {
    batchLoading.value = false
  }
}

// 监听选择状态变化
watch(() => props.selectedCorrections.length, (newLength, oldLength) => {
  const totalLength = props.corrections.length
  
  if (newLength === 0) {
    selectAll.value = false
    isIndeterminate.value = false
  } else if (newLength === totalLength) {
    selectAll.value = true
    isIndeterminate.value = false
  } else {
    selectAll.value = false
    isIndeterminate.value = true
  }
})

onMounted(() => {
  // 组件挂载时的初始化逻辑

})
</script>

<style scoped>
.correction-actions {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-lg);
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.actions-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.selected-count {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.actions-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.correction-stats {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-md);
  color: white;
}

.stat-icon.total {
  background-color: var(--primary-color);
}

.stat-icon.pending {
  background-color: var(--warning-color);
}

.stat-icon.applied {
  background-color: var(--success-color);
}

.stat-icon.rejected {
  background-color: var(--error-color);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.8rem;
  font-weight: 500;
}

.stat-trend.up {
  color: var(--success-color);
}

.stat-trend.down {
  color: var(--error-color);
}

.stat-trend.warning {
  color: var(--warning-color);
}

.correction-filters {
  padding: var(--spacing-lg);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.filters-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.filters-content {
  margin-bottom: var(--spacing-lg);
}

.filter-item {
  margin-bottom: var(--spacing-md);
}

.filter-item label {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.filter-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-lg);
}

.batch-dialog-content {
  max-height: 400px;
  overflow-y: auto;
}

.selected-items {
  margin-top: var(--spacing-lg);
}

.selected-items h5 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--text-primary);
  font-weight: 600;
}

.selected-item {
  padding: var(--spacing-xs) 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  border-bottom: 1px solid var(--border-color);
}

.selected-item:last-child {
  border-bottom: none;
}

.selected-item.more {
  color: var(--text-tertiary);
  font-style: italic;
}

.dialog-footer {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .batch-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .actions-left,
  .actions-right {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-actions {
    justify-content: center;
  }
}
</style>
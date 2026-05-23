<template>
  <div class="correction-list">
    <!-- 修正列表头部 -->
    <div class="list-header">
      <h3>修正建议列表</h3>
      <div class="list-stats">
        <span class="stat-item">
          总计: <span class="total-count">{{ totalCount }}</span>
        </span>
        <span class="stat-item">
          待处理: <span class="pending-count">{{ pendingCount }}</span>
        </span>
        <span class="stat-item">
          已应用: <span class="applied-count">{{ appliedCount }}</span>
        </span>
        <span class="stat-item">
          已拒绝: <span class="rejected-count">{{ rejectedCount }}</span>
        </span>
      </div>
    </div>

    <!-- 修正列表内容 -->
    <div class="list-content">
      <el-table
        :data="filteredCorrections"
        v-loading="loading"
        empty-text="暂无修正建议"
        style="width: 100%"
        :row-class-name="getRowClassName"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="问题描述" min-width="200" />
        <el-table-column prop="location" label="位置" width="120">
          <template #default="{ row }">
            <span class="location-text">{{ row.location }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="严重程度" width="120">
          <template #default="{ row }">
            <el-tag :type="getSeverityTagType(row.severity)" size="small">
              {{ getSeverityText(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                v-if="row.status === 'pending'"
                type="primary"
                size="small"
                @click="applyCorrection(row)"
              >
                应用
              </el-button>
              <el-button
                v-if="row.status === 'pending'"
                type="danger"
                size="small"
                @click="rejectCorrection(row)"
              >
                拒绝
              </el-button>
              <el-button
                type="default"
                size="small"
                @click="viewDetails(row)"
              >
                详情
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页控件 -->
    <div class="pagination-container" v-if="totalCount > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 修正详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="修正详情"
      width="600px"
      :before-close="handleCloseDetail"
    >
      <div v-if="currentCorrection" class="correction-detail">
        <div class="detail-section">
          <h4>问题信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">问题类型:</span>
              <span class="value">{{ getTypeText(currentCorrection.type) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">严重程度:</span>
              <span class="value">{{ getSeverityText(currentCorrection.severity) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">位置:</span>
              <span class="value">{{ currentCorrection.location }}</span>
            </div>
            <div class="detail-item">
              <span class="label">状态:</span>
              <span class="value">{{ getStatusText(currentCorrection.status) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>问题描述</h4>
          <p class="description">{{ currentCorrection.description }}</p>
        </div>

        <div class="detail-section" v-if="currentCorrection.suggestion">
          <h4>修正建议</h4>
          <p class="suggestion">{{ currentCorrection.suggestion }}</p>
        </div>

        <div class="detail-section" v-if="currentCorrection.originalText">
          <h4>原文内容</h4>
          <div class="code-block">
            <pre>{{ currentCorrection.originalText }}</pre>
          </div>
        </div>

        <div class="detail-section" v-if="currentCorrection.suggestedText">
          <h4>建议修改</h4>
          <div class="code-block">
            <pre>{{ currentCorrection.suggestedText }}</pre>
          </div>
        </div>

        <div class="detail-section" v-if="currentCorrection.reason">
          <h4>修正原因</h4>
          <p class="reason">{{ currentCorrection.reason }}</p>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDetail">关闭</el-button>
          <el-button
            v-if="currentCorrection?.status === 'pending'"
            type="primary"
            @click="applyCorrection(currentCorrection)"
          >
            应用修正
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

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
  loading: {
    type: Boolean,
    default: false
  }
})

// 组件事件
const emit = defineEmits(['correction-applied', 'correction-rejected', 'refresh'])

// 响应式数据
const currentPage = ref(1)
const pageSize = ref(10)
const detailDialogVisible = ref(false)
const currentCorrection = ref(null)

// 计算属性
const totalCount = computed(() => props.corrections.length)
const pendingCount = computed(() => props.corrections.filter(c => c.status === 'pending').length)
const appliedCount = computed(() => props.corrections.filter(c => c.status === 'applied').length)
const rejectedCount = computed(() => props.corrections.filter(c => c.status === 'rejected').length)

const filteredCorrections = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.corrections.slice(start, end)
})

// 方法
const getTypeTagType = (type) => {
  const typeMap = {
    'format': 'primary',
    'citation': 'success',
    'reference': 'warning',
    'structure': 'info',
    'language': 'danger'
  }
  return typeMap[type] || 'default'
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

const getSeverityTagType = (severity) => {
  const severityMap = {
    'critical': 'danger',
    'high': 'warning',
    'medium': 'info',
    'low': 'success'
  }
  return severityMap[severity] || 'default'
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

const getStatusTagType = (status) => {
  const statusMap = {
    'pending': 'warning',
    'applied': 'success',
    'rejected': 'danger'
  }
  return statusMap[status] || 'default'
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待处理',
    'applied': '已应用',
    'rejected': '已拒绝'
  }
  return statusMap[status] || status
}

const getRowClassName = ({ row }) => {
  if (row.status === 'applied') return 'row-applied'
  if (row.status === 'rejected') return 'row-rejected'
  return ''
}

const applyCorrection = async (correction) => {
  try {
    await ElMessageBox.confirm(
      '确定要应用此修正建议吗？',
      '确认应用',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟API调用
    correction.status = 'applied'
    correction.appliedAt = new Date().toISOString()
    
    emit('correction-applied', correction)
    ElMessage.success('修正应用成功')
    
    if (detailDialogVisible.value) {
      detailDialogVisible.value = false
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('应用修正失败')
    }
  }
}

const rejectCorrection = async (correction) => {
  try {
    await ElMessageBox.confirm(
      '确定要拒绝此修正建议吗？',
      '确认拒绝',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟API调用
    correction.status = 'rejected'
    correction.rejectedAt = new Date().toISOString()
    
    emit('correction-rejected', correction)
    ElMessage.success('修正已拒绝')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('拒绝修正失败')
    }
  }
}

const viewDetails = (correction) => {
  currentCorrection.value = correction
  detailDialogVisible.value = true
}

const handleCloseDetail = () => {
  detailDialogVisible.value = false
  currentCorrection.value = null
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

onMounted(() => {
  // 组件挂载时的初始化逻辑

})
</script>

<style scoped>
.correction-list {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
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

.total-count {
  color: var(--text-primary);
  font-weight: 700;
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

.list-content {
  padding: var(--spacing-lg);
}

.location-text {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.pagination-container {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
}

/* 表格行样式 */
:deep(.row-applied) {
  background-color: rgba(34, 197, 94, 0.05) !important;
}

:deep(.row-rejected) {
  background-color: rgba(239, 68, 68, 0.05) !important;
}

/* 修正详情样式 */
.correction-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: var(--spacing-xl);
}

.detail-section h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1.1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color);
}

.detail-item .label {
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-item .value {
  color: var(--text-primary);
  font-weight: 600;
}

.description,
.suggestion,
.reason {
  line-height: 1.6;
  color: var(--text-primary);
  margin: 0;
  padding: var(--spacing-md);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}

.code-block {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  padding: var(--spacing-md);
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--text-primary);
  white-space: pre-wrap;
}

.dialog-footer {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .list-stats {
    gap: var(--spacing-md);
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
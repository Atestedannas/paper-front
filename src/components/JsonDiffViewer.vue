<template>
  <div class="json-diff-viewer">
    <div v-if="!differences || differences.length === 0" class="empty-state">
      <el-empty description="暂无格式差异数据" />
    </div>
    
    <div v-else class="diff-list">
      <el-collapse v-model="activeNames">
        <el-collapse-item 
          v-for="(diff, index) in differences" 
          :key="diff.id || index" 
          :name="index"
          class="diff-item"
        >
          <template #title>
            <div class="diff-header">
              <el-tag :type="getSeverityType(diff.severity)" size="small" class="severity-tag">
                {{ getSeverityText(diff.severity) }}
              </el-tag>
              <span class="diff-desc">{{ diff.description }}</span>
              <span class="diff-location" v-if="diff.location">
                (第 {{ diff.location.page }} 页 - {{ diff.location.section || '未知区域' }})
              </span>
            </div>
          </template>
          
          <div class="diff-content">
            <div class="diff-comparison">
              <div class="diff-panel current">
                <div class="panel-label">当前格式 (Current)</div>
                <pre class="json-code">{{ formatJson(diff.current) }}</pre>
              </div>
              <div class="diff-panel expected">
                <div class="panel-label">标准格式 (Expected)</div>
                <pre class="json-code">{{ formatJson(diff.expected) }}</pre>
              </div>
            </div>
            
            <div class="diff-meta" v-if="diff.category">
              <el-tag size="small" type="info">类别: {{ diff.category }}</el-tag>
              <el-tag size="small" type="info" v-if="diff.type">类型: {{ diff.type }}</el-tag>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  differences: {
    type: Array,
    default: () => []
  }
})

const activeNames = ref([])

// 默认展开前3个
watch(() => props.differences, (newVal) => {
  if (newVal && newVal.length > 0) {
    activeNames.value = newVal.slice(0, 3).map((_, index) => index)
  }
}, { immediate: true })

const getSeverityType = (severity) => {
  const map = {
    error: 'danger',
    warning: 'warning',
    info: 'info'
  }
  return map[severity] || 'info'
}

const getSeverityText = (severity) => {
  const map = {
    error: '错误',
    warning: '警告',
    info: '提示'
  }
  return map[severity] || severity
}

const formatJson = (obj) => {
  try {
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return String(obj)
  }
}
</script>

<style scoped>
.json-diff-viewer {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.diff-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.diff-desc {
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.diff-location {
  color: #909399;
  font-size: 13px;
  margin-right: 10px;
}

.diff-content {
  padding: 10px 0;
}

.diff-comparison {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.diff-panel {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.diff-panel.current {
  background-color: #fef0f0;
  border-color: #fde2e2;
}

.diff-panel.expected {
  background-color: #f0f9eb;
  border-color: #e1f3d8;
}

.panel-label {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid inherit;
}

.current .panel-label {
  background-color: #fde2e2;
  color: #f56c6c;
}

.expected .panel-label {
  background-color: #e1f3d8;
  color: #67c23a;
}

.json-code {
  margin: 0;
  padding: 12px;
  font-family: monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
  color: #606266;
}

.diff-meta {
  display: flex;
  gap: 10px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .diff-comparison {
    flex-direction: column;
  }
}
</style>

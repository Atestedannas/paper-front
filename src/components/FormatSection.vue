<template>
  <div class="format-section" :class="{ 'is-collapsed': collapsed }">
    <div class="section-header" @click="toggleCollapse">
      <div class="header-left">
        <el-icon class="collapse-icon">
          <ArrowUp v-if="!collapsed" />
          <ArrowDown v-else />
        </el-icon>
        <el-icon v-if="sectionIcon" class="section-icon">
          <component :is="sectionIcon" />
        </el-icon>
        <span class="section-title">{{ schema.label }}</span>
        <el-tag
          v-if="changeCount > 0"
          type="warning"
          size="small"
          effect="plain"
        >
          {{ changeCount }} 项修改
        </el-tag>
      </div>
      <div class="header-right">
        <el-tooltip
          v-if="schema.description"
          :content="schema.description"
          placement="left"
          :show-after="300"
        >
          <el-icon class="help-icon"><QuestionFilled /></el-icon>
        </el-tooltip>
        <el-dropdown
          v-if="showActions"
          trigger="click"
          @command="handleCommand"
        >
          <el-icon class="action-icon"><MoreFilled /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="reset">
                <el-icon><Refresh /></el-icon>
                重置为默认值
              </el-dropdown-item>
              <el-dropdown-item command="collapse">
                <el-icon>
                  <ArrowUp v-if="!collapsed" />
                  <ArrowDown v-else />
                </el-icon>
                {{ collapsed ? '展开' : '收起' }}
              </el-dropdown-item>
              <el-dropdown-item
                v-if="canDuplicate"
                command="duplicate"
                :disabled="isCollapsed"
              >
                <el-icon><CopyDocument /></el-icon>
                复制配置
              </el-dropdown-item>
              <el-dropdown-item
                v-if="canExport"
                command="export"
                :disabled="isCollapsed"
              >
                <el-icon><Download /></el-icon>
                导出配置
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-collapse-transition>
      <div v-show="!collapsed" class="section-content">
        <!-- 嵌套对象类型 -->
        <template v-if="schema.type === 'object' && schema.children">
          <div class="children-grid">
            <template v-for="child in schema.children" :key="child.key">
              <div
                v-if="isVisible(child)"
                class="child-field"
                :class="{ 'is-highlighted': highlightedFields.includes(getChildPath(child.key)) }"
              >
                <!-- 如果子字段也是 object 类型且有 children，递归调用 FormatSection -->
                <FormatSection
                  v-if="child.type === 'object' && child.children"
                  :model-value="getChildValue(child.key) || {}"
                  :schema="child"
                  :path="getChildPath(child.key)"
                  :disabled="disabled || child.disabled"
                  :show-actions="showActions"
                  :show-batch-actions="false"
                  :can-copy="canCopy"
                  :can-export="canExport"
                  @update:model-value="updateChild(child.key, $event)"
                  @change="onChildChange"
                  @validate="onChildValidate"
                  @reset="onChildReset"
                  @export="onExportSection"
                />
                <!-- 否则使用 FormatField -->
                <FormatField
                  v-else
                  :model-value="getChildValue(child.key)"
                  :schema="child"
                  :path="getChildPath(child.key)"
                  :disabled="disabled || child.disabled"
                  :show-actions="showActions"
                  :can-copy="canCopy"
                  @update:model-value="updateChild(child.key, $event)"
                  @change="onChildChange"
                  @validate="onChildValidate"
                  @reset="onChildReset"
                />
              </div>
            </template>
          </div>
        </template>

        <!-- 简单类型直接显示 -->
        <FormatField
          v-else
          :model-value="localValue"
          :schema="schema"
          :path="currentPath"
          :disabled="disabled"
          :show-actions="showActions"
          :can-copy="canCopy"
          @update:model-value="updateValue"
          @change="onChange"
          @validate="onValidate"
        />

        <!-- 批量操作栏 -->
        <div v-if="showBatchActions && !collapsed" class="batch-actions">
          <el-divider content-position="left">
            <span class="batch-title">批量操作</span>
          </el-divider>
          <div class="batch-buttons">
            <el-button
              size="small"
              type="primary"
              plain
              @click="applyToAll"
            >
              <el-icon><DocumentCopy /></el-icon>
              应用到同类型
            </el-button>
            <el-button
              size="small"
              plain
              @click="resetAll"
            >
              <el-icon><RefreshRight /></el-icon>
              重置全部
            </el-button>
            <el-button
              size="small"
              plain
              @click="compareWithDefault"
            >
              <el-icon><DataAnalysis /></el-icon>
              对比默认值
            </el-button>
          </div>
        </div>
      </div>
    </el-collapse-transition>

    <!-- 重置确认对话框 -->
    <el-dialog
      v-model="resetDialogVisible"
      title="确认重置"
      width="400px"
      center
    >
      <div class="reset-dialog-content">
        <el-icon><Warning /></el-icon>
        <span>确定要将 "{{ schema.label }}" 的所有配置重置为默认值吗？此操作不可撤销。</span>
      </div>
      <template #footer>
        <el-button @click="resetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReset">确定重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormatFieldSchema } from '@/types/formatRule'
import FormatField from './FormatField.vue'
import {
  QuestionFilled,
  MoreFilled,
  Refresh,
  CopyDocument,
  Download,
  ArrowUp,
  ArrowDown,
  Warning,
  DocumentCopy,
  RefreshRight,
  DataAnalysis
} from '@element-plus/icons-vue'

// 图标映射
const iconMap: Record<string, any> = {
  cover: 'Document',
  table_of_contents: 'List',
  title: 'Tickets',
  author: 'User',
  abstract: 'ChatLineRound',
  english_abstract: 'ChatLineRound',
  body: 'Document',
  headings: 'Tickets',
  keywords: 'CollectionTag',
  references: 'Document',
  acknowledgements: 'Bell',
  appendix: 'FolderOpened',
  page_setup: 'Setting',
}

const props = withDefaults(defineProps<{
  modelValue: Record<string, any>
  schema: FormatFieldSchema
  path?: string
  disabled?: boolean
  showActions?: boolean
  showBatchActions?: boolean
  canCopy?: boolean
  canDuplicate?: boolean
  canExport?: boolean
  highlightedFields?: string[]
}>(), {
  disabled: false,
  showActions: true,
  showBatchActions: true,
  canCopy: true,
  canDuplicate: false,
  canExport: false,
  highlightedFields: () => []
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'change', path: string, value: any): void
  (e: 'validate', path: string, errors: Record<string, string | null>): void
  (e: 'reset', path: string): void
  (e: 'batch-apply', path: string, value: any): void
  (e: 'export', path: string): void
}>()

// 响应式数据
const collapsed = ref(false)
const localValue = ref<Record<string, any>>(props.modelValue)
const validationErrors = ref<Record<string, string | null>>({})
const resetDialogVisible = ref(false)

// 计算属性
const currentPath = computed(() => props.path || props.schema.key)

const sectionIcon = computed(() => iconMap[props.schema.key])

const isCollapsed = computed(() => collapsed.value)

const changeCount = computed(() => {
  return Object.values(validationErrors.value).filter(e => e !== null).length
})

// 方法
const getChildPath = (childKey: string): string => {
  return props.path
    ? `${props.path}.${childKey}`
    : childKey
}

const getChildValue = (key: string): any => {
  return props.modelValue?.[key]
}

const isVisible = (schema: FormatFieldSchema): boolean => {
  if (schema.visible === undefined) {
    return true
  }
  if (typeof schema.visible === 'boolean') {
    return schema.visible
  }
  // 动态可见性（可以根据依赖字段的值决定）
  if (schema.dependsOn) {
    const parentValue = getNestedValue(props.modelValue, schema.dependsOn.field)
    return parentValue === schema.dependsOn.value
  }
  return true
}

const getNestedValue = (obj: any, path: string): any => {
  const keys = path.split('.')
  let current = obj
  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined
    }
    current = current[key]
  }
  return current
}

const updateChild = (key: string, value: any) => {
  const newValue = {
    ...props.modelValue,
    [key]: value
  }
  emit('update:modelValue', newValue)
}

const updateValue = (value: any) => {
  emit('update:modelValue', value)
}

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'reset':
      resetDialogVisible.value = true
      break
    case 'collapse':
      collapsed.value = !collapsed.value
      break
    case 'duplicate':
      handleDuplicate()
      break
    case 'export':
      emit('export', currentPath.value)
      break
  }
}

const handleDuplicate = () => {
  const dataStr = JSON.stringify(props.modelValue, null, 2)
  navigator.clipboard.writeText(dataStr)
    .then(() => {
      ElMessage.success('配置已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}

const confirmReset = () => {
  const defaultValue: Record<string, any> = {}
  props.schema.children?.forEach(child => {
    if (child.default !== undefined) {
      defaultValue[child.key] = child.default
    }
  })
  emit('update:modelValue', defaultValue)
  emit('reset', currentPath.value)
  ElMessage.success(`${props.schema.label}已重置为默认值`)
  resetDialogVisible.value = false
}

const onChildChange = (path: string, value: any) => {
  emit('change', path, value)
}

const onChildValidate = (path: string, error: string | null) => {
  validationErrors.value[path] = error
  emit('validate', currentPath.value, validationErrors.value)
}

const onChildReset = (path: string) => {
  emit('reset', path)
}

const onExportSection = (path: string) => {
  emit('export', path)
}

const onChange = (path: string, value: any) => {
  emit('change', path, value)
}

const onValidate = (path: string, error: string | null) => {
  validationErrors.value[path] = error
  emit('validate', currentPath.value, validationErrors.value)
}

// 批量操作
const applyToAll = () => {
  emit('batch-apply', currentPath.value, props.modelValue)
  ElMessage.success(`已将配置应用到所有同类型字段`)
}

const resetAll = () => {
  ElMessageBox.confirm(
    '确定要将此部分所有字段重置为默认值吗？',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const defaultValue: Record<string, any> = {}
    props.schema.children?.forEach(child => {
      if (child.default !== undefined) {
        defaultValue[child.key] = child.default
      }
    })
    emit('update:modelValue', defaultValue)
    ElMessage.success('已重置所有字段')
  }).catch(() => {})
}

const compareWithDefault = () => {
  ElMessage.info('对比功能开发中...')
}

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal || {}
}, { immediate: true, deep: true })
</script>

<style scoped>
.format-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  transition: all 0.2s;
}

.format-section:hover {
  border-color: #d1d5db;
}

.format-section.is-collapsed {
  border-color: #e5e7eb;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f9fafb;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.section-header:hover {
  background: #f3f4f6;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-icon {
  color: #6b7280;
  font-size: 16px;
  transition: transform 0.2s;
}

.section-icon {
  color: #3b82f6;
  font-size: 18px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-icon {
  color: #9ca3af;
  cursor: help;
  font-size: 14px;
}

.help-icon:hover {
  color: #6b7280;
}

.action-icon {
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-icon:hover {
  color: #3b82f6;
  background: #eff6ff;
}

.section-content {
  padding: 12px 16px;
  background: #fff;
}

.children-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.child-field {
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.child-field:hover {
  background: #f8fafc;
}

.child-field.is-highlighted {
  background: #fef3c7;
  border: 1px solid #fbbf24;
}

.batch-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.batch-title {
  font-size: 12px;
  color: #6b7280;
}

.batch-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.reset-dialog-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fef2f2;
  border-radius: 6px;
  color: #991b1b;
}

.reset-dialog-content .el-icon {
  font-size: 24px;
  color: #dc2626;
  flex-shrink: 0;
}
</style>

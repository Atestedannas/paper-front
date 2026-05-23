<template>
  <div class="format-field" :class="{ 'has-error': error, 'is-disabled': disabled }">
    <div class="field-header">
      <label v-if="schema.label" class="field-label">
        {{ schema.label }}
        <span v-if="schema.validation?.required" class="required-mark">*</span>
      </label>
      <el-tooltip
        v-if="schema.description"
        :content="schema.description"
        placement="top"
        :show-after="300"
      >
        <el-icon class="help-icon"><QuestionFilled /></el-icon>
      </el-tooltip>
    </div>

    <!-- 字体选择 -->
    <el-select
      v-if="schema.type === 'font_name'"
      v-model="localValue"
      :placeholder="`请选择${schema.label}`"
      :disabled="disabled"
      filterable
      allow-create
      default-first-option
      :clearable="!schema.validation?.required"
      class="field-input"
      @change="onChange"
      @clear="onClear"
    >
      <el-option-group
        v-for="group in fontOptionGroups"
        :key="group.label"
        :label="group.label"
      >
        <el-option
          v-for="opt in group.options"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        >
          <span class="option-label">{{ opt.label }}</span>
          <span v-if="opt.alias && opt.alias.length" class="option-alias">
            {{ opt.alias[0] }}
          </span>
        </el-option>
      </el-option-group>
    </el-select>

    <!-- 字号选择 -->
    <el-select
      v-else-if="schema.type === 'font_size'"
      v-model="localValue"
      :placeholder="`请选择${schema.label}`"
      :disabled="disabled"
      filterable
      allow-create
      default-first-option
      :clearable="!schema.validation?.required"
      class="field-input"
      @change="onChange"
      @clear="onClear"
    >
      <el-option
        v-for="opt in schema.options"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      >
        <span>{{ opt.label }}</span>
        <span v-if="opt.description" class="option-desc">
          {{ opt.description }}
        </span>
      </el-option>
    </el-select>

    <!-- 对齐方式 -->
    <el-select
      v-else-if="schema.type === 'alignment'"
      v-model="localValue"
      :placeholder="`请选择${schema.label}`"
      :disabled="disabled"
      :clearable="!schema.validation?.required"
      class="field-input"
      @change="onChange"
      @clear="onClear"
    >
      <el-option
        v-for="opt in schema.options"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>

    <!-- 行距 -->
    <el-select
      v-else-if="schema.type === 'line_space'"
      v-model="localValue"
      :placeholder="`请选择${schema.label}`"
      :disabled="disabled"
      filterable
      allow-create
      default-first-option
      :clearable="!schema.validation?.required"
      class="field-input"
      @change="onChange"
      @clear="onClear"
    >
      <el-option
        v-for="opt in schema.options"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      >
        <span>{{ opt.label.split(' (')[0] }}</span>
        <span v-if="opt.description" class="option-desc">
          {{ opt.description }}
        </span>
      </el-option>
    </el-select>

    <!-- 首行缩进 -->
    <el-select
      v-else-if="schema.type === 'first_line_indent'"
      v-model="localValue"
      :placeholder="`请选择${schema.label}`"
      :disabled="disabled"
      filterable
      allow-create
      default-first-option
      :clearable="!schema.validation?.required"
      class="field-input"
      @change="onChange"
      @clear="onClear"
    >
      <el-option
        v-for="opt in schema.options"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>

    <!-- 布尔值 -->
    <el-switch
      v-else-if="schema.type === 'boolean'"
      v-model="localValue"
      :disabled="disabled"
      active-text="是"
      inactive-text="否"
      @change="onChange"
    />

    <!-- 字符串输入 -->
    <el-input
      v-else-if="schema.type === 'string'"
      v-model="localValue"
      :placeholder="schema.placeholder || `请输入${schema.label}`"
      :disabled="disabled"
      :maxlength="schema.validation?.maxLength"
      :show-word-limit="!!schema.validation?.maxLength"
      @change="onChange"
    >
      <template v-if="schema.key.includes('separator')" #prefix>
        <el-icon><Connection /></el-icon>
      </template>
    </el-input>

    <!-- 数字输入 -->
    <el-input-number
      v-else-if="schema.type === 'number'"
      v-model="localValue"
      :placeholder="`请输入${schema.label}`"
      :disabled="disabled"
      :min="schema.validation?.min"
      :max="schema.validation?.max"
      :step="1"
      @change="onChange"
    />

    <!-- 页边距 -->
    <el-input
      v-else-if="schema.type === 'margin'"
      v-model="localValue"
      :placeholder="`如: 2.5cm`"
      :disabled="disabled"
      class="field-input"
      @change="onChange"
    >
      <template #append>cm</template>
    </el-input>

    <!-- 纸张大小 -->
    <el-select
      v-else-if="schema.type === 'paper_size'"
      v-model="localValue"
      :placeholder="`请选择${schema.label}`"
      :disabled="disabled"
      class="field-input"
      @change="onChange"
    >
      <el-option
        v-for="opt in schema.options"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>

    <!-- 页面方向 -->
    <el-radio-group
      v-else-if="schema.type === 'orientation'"
      v-model="localValue"
      :disabled="disabled"
      @change="onChange"
    >
      <el-radio-button value="portrait">纵向</el-radio-button>
      <el-radio-button value="landscape">横向</el-radio-button>
    </el-radio-group>

    <!-- 分隔符 -->
    <el-select
      v-else-if="schema.type === 'separator'"
      v-model="localValue"
      :placeholder="`请选择${schema.label}`"
      :disabled="disabled"
      class="field-input"
      @change="onChange"
    >
      <el-option
        v-for="opt in schema.options"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>

    <!-- 文本内容 -->
    <el-input
      v-else-if="schema.type === 'text'"
      v-model="localValue"
      :placeholder="`请输入${schema.label}`"
      :disabled="disabled"
      @change="onChange"
    />

    <!-- 对象类型 - 显示 JSON 编辑 -->
    <el-input
      v-else-if="schema.type === 'object'"
      type="textarea"
      :model-value="typeof localValue === 'object' ? JSON.stringify(localValue, null, 2) : ''"
      :placeholder="`请输入 JSON 格式的${schema.label}`"
      :disabled="disabled"
      :rows="5"
      @change="onObjectChange"
    />

    <!-- 未知类型 -->
    <el-input
      v-else
      v-model="localValue"
      :placeholder="`不支持的类型: ${schema.type}`"
      disabled
      class="field-input"
    />

    <!-- 错误提示 -->
    <transition name="slide-fade">
      <div v-if="error" class="field-error">
        <el-icon><Warning /></el-icon>
        {{ error }}
      </div>
    </transition>

    <!-- 操作按钮 -->
    <div v-if="showActions" class="field-actions">
      <el-button
        size="small"
        type="text"
        @click="resetToDefault"
      >
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
      <el-button
        v-if="canCopy"
        size="small"
        type="text"
        @click="copyValue"
      >
        <el-icon><CopyDocument /></el-icon>
        复制
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormatFieldSchema, FieldOption } from '@/types/formatRule'
import {
  chineseFonts,
  englishFonts,
  specialFonts
} from '@/constants/formatOptions'
import {
  QuestionFilled,
  CopyDocument,
  Refresh,
  Warning,
  Connection
} from '@element-plus/icons-vue'

// 字体选择分组
const fontOptionGroups = computed(() => [
  { label: '中文字体', options: chineseFonts },
  { label: '英文字体', options: englishFonts },
  { label: '特殊字体', options: specialFonts }
])

const props = defineProps<{
  modelValue: any
  schema: FormatFieldSchema
  path?: string
  disabled?: boolean
  showActions?: boolean
  canCopy?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'change', path: string, value: any): void
  (e: 'validate', path: string, error: string | null): void
  (e: 'reset', path: string): void
}>()

const localValue = ref<any>(props.modelValue)
const error = ref<string | null>(null)

// 计算属性
const currentPath = computed(() => props.path || props.schema.key)

// 方法
const validate = (value: any): boolean => {
  if (props.schema.validation) {
    const { required, pattern, patternMessage, min, max, minLength, maxLength } = props.schema.validation

    // 必填验证
    if (required && (value === undefined || value === null || value === '')) {
      error.value = `${props.schema.label}不能为空`
      return false
    }

    // 跳过空值验证（如果非必填）
    if (value === undefined || value === null || value === '') {
      if (!required) {
        error.value = null
        return true
      }
    }

    // 正则验证
    if (pattern && value !== undefined && value !== null) {
      const regex = new RegExp(pattern)
      if (!regex.test(String(value))) {
        error.value = patternMessage || `${props.schema.label}格式不正确`
        return false
      }
    }

    // 数值范围验证
    if (typeof value === 'number') {
      if (min !== undefined && value < min) {
        error.value = `${props.schema.label}不能小于${min}`
        return false
      }
      if (max !== undefined && value > max) {
        error.value = `${props.schema.label}不能大于${max}`
        return false
      }
    }

    // 字符串长度验证
    if (typeof value === 'string') {
      if (minLength !== undefined && value.length < minLength) {
        error.value = `${props.schema.label}长度不能小于${minLength}`
        return false
      }
      if (maxLength !== undefined && value.length > maxLength) {
        error.value = `${props.schema.label}长度不能大于${maxLength}`
        return false
      }
    }
  }

  error.value = null
  return true
}

const onChange = (value: any) => {
  validate(value)
  emit('update:modelValue', value)
  emit('change', currentPath.value, value)
  emit('validate', currentPath.value, error.value)
}

const onObjectChange = (value: string) => {
  try {
    const parsed = JSON.parse(value)
    validate(parsed)
    emit('update:modelValue', parsed)
    emit('change', currentPath.value, parsed)
    emit('validate', currentPath.value, error.value)
  } catch (e) {
    error.value = 'JSON 格式不正确'
    emit('validate', currentPath.value, error.value)
  }
}

const onClear = () => {
  emit('update:modelValue', undefined)
  emit('change', currentPath.value, undefined)
  emit('validate', currentPath.value, error.value)
}

const resetToDefault = () => {
  if (props.schema.default !== undefined) {
    localValue.value = props.schema.default
    onChange(props.schema.default)
    emit('reset', currentPath.value)
    ElMessage.success(`已将${props.schema.label}重置为默认值`)
  }
}

const copyValue = async () => {
  try {
    await navigator.clipboard.writeText(String(localValue.value))
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
  if (newVal !== undefined && newVal !== null) {
    validate(newVal)
  }
}, { immediate: true })

// 监听 schema 变化
watch(() => props.schema, () => {
  if (props.modelValue !== undefined && props.modelValue !== null) {
    validate(props.modelValue)
  }
}, { immediate: true })
</script>

<style scoped>
.format-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.format-field:hover {
  background-color: #f8fafc;
}

.format-field.has-error {
  background-color: #fef2f2;
}

.format-field.is-disabled {
  opacity: 0.6;
}

.field-header {
  display: flex;
  align-items: center;
  gap: 4px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 4px;
}

.required-mark {
  color: #ef4444;
  margin-left: 2px;
}

.help-icon {
  color: #9ca3af;
  cursor: help;
  font-size: 14px;
}

.help-icon:hover {
  color: #6b7280;
}

.field-input {
  width: 100%;
}

.field-error {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ef4444;
  margin-top: 2px;
}

.field-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.field-actions .el-button {
  padding: 4px 8px;
  font-size: 12px;
}

.option-label {
  font-weight: normal;
}

.option-alias {
  margin-left: 8px;
  color: #9ca3af;
  font-size: 12px;
}

.option-desc {
  margin-left: 8px;
  color: #9ca3af;
  font-size: 12px;
}

/* 过渡动画 */
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}
</style>

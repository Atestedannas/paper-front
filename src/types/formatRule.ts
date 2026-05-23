/**
 * 格式规则类型定义
 * 用于 PaperFormatView 组件的字段类型安全编辑
 */

// 字段类型枚举
export type FieldType =
  | 'font_name'
  | 'font_size'
  | 'alignment'
  | 'line_space'
  | 'paragraph_space'
  | 'first_line_indent'
  | 'boolean'
  | 'string'
  | 'number'
  | 'object'
  | 'array'
  | 'margin'
  | 'paper_size'
  | 'orientation'
  | 'separator'
  | 'text'

// 字段选项
export interface FieldOption {
  label: string
  value: string | number | boolean
  alias?: string[]
  description?: string
}

// 验证规则
export interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  patternMessage?: string
  enum?: (string | number | boolean)[]
}

// 字段定义
export interface FormatFieldSchema {
  key: string
  label: string
  type: FieldType
  options?: FieldOption[]
  validation?: ValidationRule
  children?: FormatFieldSchema[]
  description?: string
  default?: string | number | boolean
  placeholder?: string
  visible?: boolean
  dependsOn?: {
    field: string
    value: any
  }
}

// 格式规则 Schema 根配置
export interface FormatRuleConfig {
  version: string
  lastUpdated: string
  sections: FormatFieldSchema[]
}

// 段落间距配置
export interface ParagraphSpaceConfig {
  before: string
  after: string
}

// 页边距配置
export interface MarginConfig {
  top: string
  bottom: string
  left: string
  right: string
}

// 页眉配置
export interface HeaderConfig {
  distance: string
  font_name?: string
  font_size?: string
  underline?: boolean
  start_from_abstract?: boolean
  print_mode?: 'single_sided' | 'double_sided'
  left_page_content?: string
  right_page_content?: string
}

// 页脚配置
export interface FooterConfig {
  distance: string
  font_name?: string
  font_size?: string
}

// 页码配置
export interface PageNumberConfig {
  front_matter_format: 'roman' | 'arabic' | 'none'
  main_body_format: 'roman' | 'arabic' | 'none'
  front_matter_start: number
  main_body_start: number
  position: 'center' | 'left' | 'right'
}

// 页面设置配置
export interface PageSetupConfig {
  paper_size: string
  orientation: string
  margins: MarginConfig
  header?: HeaderConfig
  footer?: FooterConfig
  page_number?: PageNumberConfig
}

// 通用格式配置
export interface CommonFormatConfig {
  font_name: string
  font_size: string
  alignment?: string
  bold?: boolean
  line_space?: string
  paragraph_space?: ParagraphSpaceConfig
  first_line_indent?: string
}

// 标签格式配置（用于摘要、关键词等标签）
export interface LabelFormatConfig {
  font_name: string
  font_size: string
  bold: boolean
  text?: string
}

// 内容格式配置
export interface ContentFormatConfig extends CommonFormatConfig {
  separator?: string
  numbering?: string
}

// 参考文献配置
export interface ReferenceConfig {
  title: ContentFormatConfig
  content: ContentFormatConfig
}

// 标题层级配置
export interface HeadingLevelConfig {
  font_name: string
  font_size: string
  bold: boolean
  alignment: string
  line_space: string
  numbering?: string
}

// 完整格式要求
export interface FormatRequirements {
  cover?: CommonFormatConfig
  table_of_contents?: CommonFormatConfig
  title?: CommonFormatConfig
  author?: CommonFormatConfig
  abstract?: {
    label: LabelFormatConfig
    content: ContentFormatConfig
  }
  english_title?: CommonFormatConfig
  english_abstract?: {
    label: LabelFormatConfig
    content: ContentFormatConfig
  }
  body: CommonFormatConfig
  headings: {
    level1: HeadingLevelConfig
    level2: HeadingLevelConfig
    level3?: HeadingLevelConfig
    level4?: HeadingLevelConfig
  }
  keywords?: {
    label: LabelFormatConfig
    content: ContentFormatConfig
  }
  references?: ReferenceConfig
  acknowledgements?: CommonFormatConfig
  appendix?: CommonFormatConfig
  page_setup?: PageSetupConfig
}

// 字段变更事件
export interface FieldChangeEvent {
  path: string
  value: any
  oldValue: any
  timestamp: Date
}

// 验证错误
export interface ValidationError {
  path: string
  message: string
  value: any
}

// 字段路径工具类型
export type FieldPath = string

// 批量操作类型
export type BatchOperation = 'apply_to_all' | 'copy_to_clipboard' | 'reset_to_default'

// 批量操作配置
export interface BatchOperationConfig {
  operation: BatchOperation
  targetFields: string[]
  sourceField?: string
}

// 导入导出配置
export interface ImportExportConfig {
  format: 'json' | 'yaml' | 'csv'
  includeComments: boolean
  includeDescriptions: boolean
}

// 历史记录条目
export interface HistoryEntry {
  id: string
  timestamp: Date
  action: 'create' | 'update' | 'delete' | 'import'
  changes: FieldChangeEvent[]
  description: string
}

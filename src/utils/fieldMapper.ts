/**
 * 字段映射工具
 * 处理中英文键名映射、字段类型转换等
 */

import type { FormatRequirements, ValidationError } from '@/types/formatRule'

// 字段映射表
const fieldMapping: Record<string, {
  chinese: string
  type: string
  description: string
  children?: Record<string, { chinese: string; type: string }>
}> = {
  // 通用字段
  cover: {
    chinese: '封面',
    type: 'object',
    description: '论文封面格式',
  },
  table_of_contents: {
    chinese: '目录',
    type: 'object',
    description: '目录格式',
  },
  title: {
    chinese: '论文标题',
    type: 'object',
    description: '论文主标题格式',
  },
  author: {
    chinese: '作者信息',
    type: 'object',
    description: '作者姓名和学号格式',
  },
  abstract: {
    chinese: '摘要',
    type: 'object',
    description: '中文摘要格式',
    children: {
      label: { chinese: '摘要标签', type: 'object' },
      content: { chinese: '摘要内容', type: 'object' },
    },
  },
  english_title: {
    chinese: '英文标题',
    type: 'object',
    description: '英文标题格式',
  },
  english_abstract: {
    chinese: '英文摘要',
    type: 'object',
    description: '英文摘要格式',
    children: {
      label: { chinese: '英文摘要标签', type: 'object' },
      content: { chinese: '英文摘要内容', type: 'object' },
    },
  },
  body: {
    chinese: '正文',
    type: 'object',
    description: '论文正文格式',
  },
  headings: {
    chinese: '标题层级',
    type: 'object',
    description: '各级标题格式',
    children: {
      level1: { chinese: '一级标题', type: 'object' },
      level2: { chinese: '二级标题', type: 'object' },
      level3: { chinese: '三级标题', type: 'object' },
      level4: { chinese: '四级标题', type: 'object' },
      level5: { chinese: '五级标题', type: 'object' },
      level6: { chinese: '六级标题', type: 'object' },
    },
  },
  keywords: {
    chinese: '关键词',
    type: 'object',
    description: '中文关键词格式',
    children: {
      label: { chinese: '关键词标签', type: 'object' },
      content: { chinese: '关键词内容', type: 'object' },
    },
  },
  references: {
    chinese: '参考文献',
    type: 'object',
    description: '参考文献格式',
    children: {
      title: { chinese: '参考文献标题', type: 'object' },
      content: { chinese: '参考文献内容', type: 'object' },
    },
  },
  acknowledgements: {
    chinese: '致谢',
    type: 'object',
    description: '致谢部分格式',
  },
  appendix: {
    chinese: '附录',
    type: 'object',
    description: '附录格式',
    children: {
      title: { chinese: '附录标题', type: 'object' },
      content: { chinese: '附录内容', type: 'object' },
    },
  },
  page_setup: {
    chinese: '页面设置',
    type: 'object',
    description: '页面布局设置',
    children: {
      paper_size: { chinese: '纸张大小', type: 'string' },
      orientation: { chinese: '页面方向', type: 'string' },
      margins: { chinese: '页边距', type: 'object' },
      header: { chinese: '页眉', type: 'object' },
      footer: { chinese: '页脚', type: 'object' },
    },
  },

  // 通用字段属性
  font_name: {
    chinese: '字体名称',
    type: 'string',
    description: '字体类型',
  },
  font_size: {
    chinese: '字号',
    type: 'string',
    description: '字体大小',
  },
  alignment: {
    chinese: '对齐方式',
    type: 'string',
    description: '文本对齐方式',
  },
  line_space: {
    chinese: '行间距',
    type: 'string',
    description: '行与行之间的距离',
  },
  paragraph_space: {
    chinese: '段落间距',
    type: 'object',
    description: '段落之间的距离',
  },
  first_line_indent: {
    chinese: '首行缩进',
    type: 'string',
    description: '段落首行缩进距离',
  },
  bold: {
    chinese: '是否加粗',
    type: 'boolean',
    description: '文本是否加粗显示',
  },
  numbering: {
    chinese: '编号格式',
    type: 'string',
    description: '自动编号格式',
  },
  separator: {
    chinese: '分隔符',
    type: 'string',
    description: '多项内容分隔符',
  },
  text: {
    chinese: '文本内容',
    type: 'string',
    description: '固定文本内容',
  },

  // 页面设置属性
  top: {
    chinese: '上边距',
    type: 'string',
    description: '页面上边距',
  },
  bottom: {
    chinese: '下边距',
    type: 'string',
    description: '页面下边距',
  },
  left: {
    chinese: '左边距',
    type: 'string',
    description: '页面左边距',
  },
  right: {
    chinese: '右边距',
    type: 'string',
    description: '页面右边距',
  },
  before: {
    chinese: '段前间距',
    type: 'string',
    description: '段落与前文的距离',
  },
  after: {
    chinese: '段后间距',
    type: 'string',
    description: '段落与后文的距离',
  },
  distance: {
    chinese: '距离',
    type: 'string',
    description: '页眉/页脚距离',
  },
}

// 反向映射表（中文 -> 英文）
const reverseMapping: Record<string, string> = {}
Object.keys(fieldMapping).forEach(englishKey => {
  const item = fieldMapping[englishKey]
  reverseMapping[item.chinese] = englishKey
  if (item.children) {
    Object.keys(item.children).forEach(childKey => {
      reverseMapping[item.chinese + item.children[childKey].chinese] =
        `${englishKey}.${childKey}`
    })
  }
})

/**
 * 字段映射工具类
 */
export class FieldMapper {
  /**
   * 获取英文键名的中文描述
   */
  static getChinese(key: string): string {
    const keys = key.split('.')
    let result = fieldMapping[keys[0]]
    
    if (!result) {
      // 尝试直接匹配
      return fieldMapping[key]?.chinese || key
    }
    
    if (keys.length > 1 && result.children) {
      result = result.children[keys[1]] as typeof result
      if (result) {
        return result.chinese
      }
    }
    
    return result?.chinese || key
  }

  /**
   * 获取中文键名的英文描述
   */
  static getEnglish(chinese: string): string {
    return reverseMapping[chinese] || chinese
  }

  /**
   * 获取字段描述
   */
  static getDescription(key: string): string {
    const keys = key.split('.')
    let result = fieldMapping[keys[0]]
    
    if (!result) {
      return ''
    }
    
    if (keys.length > 1 && result.children) {
      const child = result.children[keys[1]]
      if (child) {
        return child.chinese
      }
    }
    
    return result.description || ''
  }

  /**
   * 获取字段类型
   */
  static getType(key: string): string {
    const keys = key.split('.')
    let result = fieldMapping[keys[0]]
    
    if (!result) {
      return 'unknown'
    }
    
    if (keys.length > 1 && result.children) {
      const child = result.children[keys[1]]
      if (child) {
        return child.type
      }
    }
    
    return result.type
  }

  /**
   * 检查键是否存在
   */
  static hasKey(key: string): boolean {
    const keys = key.split('.')
    let result = fieldMapping[keys[0]]
    
    if (!result) {
      return false
    }
    
    if (keys.length > 1 && result.children) {
      return keys[1] in result.children
    }
    
    return true
  }

  /**
   * 获取所有顶级键
   */
  static getTopLevelKeys(): string[] {
    return Object.keys(fieldMapping)
  }

  /**
   * 获取子键
   */
  static getChildKeys(parentKey: string): string[] {
    const parent = fieldMapping[parentKey]
    if (!parent || !parent.children) {
      return []
    }
    return Object.keys(parent.children)
  }

  /**
   * 标准化键名（确保使用英文键名）
   */
  static normalizeKey(key: string): string {
    // 如果已经是英文键名，直接返回
    if (fieldMapping[key]) {
      return key
    }
    
    // 尝试转换为英文
    const english = this.getEnglish(key)
    if (fieldMapping[english]) {
      return english
    }
    
    return key
  }

  /**
   * 扁平化嵌套对象（用于表单编辑）
   */
  static flatten(obj: Record<string, any>, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // 递归处理嵌套对象
        Object.assign(result, this.flatten(value, newKey))
      } else {
        result[newKey] = value
      }
    }
    
    return result
  }

  /**
   * 展开扁平对象（还原嵌套结构）
   */
  static unflatten(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const keys = key.split('.')
      let current = result
      
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]
        if (!(k in current)) {
          current[k] = {}
        }
        current = current[k]
      }
      
      current[keys[keys.length - 1]] = value
    }
    
    return result
  }

  /**
   * 验证字段值
   */
  static validate(key: string, value: any): ValidationError | null {
    const type = this.getType(key)
    
    switch (type) {
      case 'font_name':
        if (!value || typeof value !== 'string') {
          return { path: key, message: '字体名称不能为空', value }
        }
        break
      
      case 'font_size':
        if (!value || typeof value !== 'string') {
          return { path: key, message: '字号不能为空', value }
        }
        break
      
      case 'alignment':
        const validAlignments = ['left', 'center', 'right', 'justify']
        if (!validAlignments.includes(value)) {
          return { path: key, message: '对齐方式无效', value }
        }
        break
      
      case 'line_space':
        const validLineSpaces = [
          'single', '1', '1.25', '1.5', '2', 'double',
          'fixed_18_pt', 'fixed_20_pt', 'fixed_22_pt', 'fixed_24_pt',
          'min'
        ]
        if (!validLineSpaces.includes(value)) {
          return { path: key, message: '行距格式无效', value }
        }
        break
      
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { path: key, message: '必须为布尔值', value }
        }
        break
    }
    
    return null
  }

  /**
   * 验证整个格式配置
   */
  static validateAll(config: FormatRequirements): ValidationError[] {
    const errors: ValidationError[] = []
    const flattened = this.flatten(config)
    
    for (const [key, value] of Object.entries(flattened)) {
      if (value !== undefined && value !== null) {
        const error = this.validate(key, value)
        if (error) {
          errors.push(error)
        }
      }
    }
    
    return errors
  }

  /**
   * 清洗格式配置（修复常见错误）
   */
  static clean(config: FormatRequirements): FormatRequirements {
    const cleaned = JSON.parse(JSON.stringify(config)) as FormatRequirements
    
    // 修复单位拼写错误
    const fixUnit = (obj: any) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          // 修复 2.54c -> 2.54cm
          if (value === '2.54c' || value === '2.54') {
            obj[key] = '2.54cm'
          }
          // 修复以 c 结尾的单位
          if (/^\d+(\.\d+)?c$/.test(value)) {
            obj[key] = value + 'm'
          }
        } else if (typeof value === 'object' && value !== null) {
          fixUnit(value)
        }
      }
    }
    
    fixUnit(cleaned)
    
    return cleaned
  }

  /**
   * 深度比较两个配置
   */
  static deepCompare(a: FormatRequirements, b: FormatRequirements): Record<string, {
    oldValue: any
    newValue: any
  }> {
    const flattenedA = this.flatten(a)
    const flattenedB = this.flatten(b)
    const changes: Record<string, { oldValue: any; newValue: any }> = {}
    
    const allKeys = new Set([...Object.keys(flattenedA), ...Object.keys(flattenedB)])
    
    for (const key of allKeys) {
      if (JSON.stringify(flattenedA[key]) !== JSON.stringify(flattenedB[key])) {
        changes[key] = {
          oldValue: flattenedA[key],
          newValue: flattenedB[key]
        }
      }
    }
    
    return changes
  }

  /**
   * 获取路径的显示标签
   */
  static getDisplayLabel(path: string): string {
    const parts = path.split('.')
    const labels = parts.map(part => this.getChinese(part))
    return labels.join(' / ')
  }

  /**
   * 创建默认配置
   */
  static createDefault(): FormatRequirements {
    return {
      body: {
        font_name: '宋体',
        font_size: '小四',
        alignment: 'justify',
        line_space: 'fixed_20_pt',
        paragraph_space: {
          before: '0',
          after: '0'
        },
        first_line_indent: '2字符',
        bold: false
      },
      headings: {
        level1: {
          font_name: '黑体',
          font_size: '三号',
          alignment: 'center',
          line_space: 'fixed_20_pt',
          bold: false,
          numbering: '1'
        },
        level2: {
          font_name: '黑体',
          font_size: '小三',
          alignment: 'left',
          line_space: 'fixed_20_pt',
          bold: false,
          numbering: '1.1'
        },
        level3: {
          font_name: '黑体',
          font_size: '四号',
          alignment: 'left',
          line_space: 'fixed_20_pt',
          bold: false,
          numbering: '1.1.1'
        }
      },
      page_setup: {
        paper_size: 'A4',
        orientation: 'portrait',
        margins: {
          top: '2.5cm',
          bottom: '2.5cm',
          left: '2.5cm',
          right: '2.5cm'
        }
      }
    }
  }
}

// 导出便捷函数
export const getChinese = FieldMapper.getChinese.bind(FieldMapper)
export const getEnglish = FieldMapper.getEnglish.bind(FieldMapper)
export const normalizeKey = FieldMapper.normalizeKey.bind(FieldMapper)
export const flattenFields = FieldMapper.flatten.bind(FieldMapper)
export const unflattenFields = FieldMapper.unflatten.bind(FieldMapper)
export const validateField = FieldMapper.validate.bind(FieldMapper)
export const validateAllFields = FieldMapper.validateAll.bind(FieldMapper)
export const cleanFields = FieldMapper.clean.bind(FieldMapper)
export const compareFields = FieldMapper.deepCompare.bind(FieldMapper)
export const getDisplayLabel = FieldMapper.getDisplayLabel.bind(FieldMapper)
export const createDefaultConfig = FieldMapper.createDefault.bind(FieldMapper)

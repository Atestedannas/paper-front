/**
 * 格式选项常量定义
 * 包含字体、字号、对齐方式、行距等选项
 */

import type { FieldOption } from '@/types/formatRule'

// 中文字体
export const chineseFonts: FieldOption[] = [
  { label: '宋体', value: '宋体', alias: ['SimSun', 'simsun', 'Sim_Sun'], description: '中文正文常用字体' },
  { label: '黑体', value: '黑体', alias: ['SimHei', 'simhei', 'Sim_Hei'], description: '中文标题常用字体' },
  { label: '仿宋', value: '仿宋', alias: ['FangSong', 'fangsong', 'Fang_Song'], description: '仿宋体' },
  { label: '楷体', value: '楷体', alias: ['KaiTi', 'kaiti', 'Kai_Ti'], description: '楷体' },
  { label: '微软雅黑', value: '微软雅黑', alias: ['Microsoft YaHei', 'microsoftyahei'], description: '微软雅黑' },
  { label: '华文黑体', value: '华文黑体', alias: ['STHeiti', 'stheit i'], description: '华文黑体' },
  { label: '华文楷体', value: '华文楷体', alias: ['STKaiti', 'stkaiti'], description: '华文楷体' },
  { label: '华文宋体', value: '华文宋体', alias: ['STSong', 'stsong'], description: '华文宋体' },
  { label: '方正小标宋', value: '方正小标宋', alias: ['FZXiaoBiaoSong'], description: '方正小标宋' },
  { label: '方正书宋', value: '方正书宋', alias: ['FZShuSong'], description: '方正书宋' },
]

// 英文字体
export const englishFonts: FieldOption[] = [
  { label: 'Times New Roman', value: 'Times New Roman', alias: ['Times', 'timesnewroman'], description: '英文正文常用字体' },
  { label: 'Arial', value: 'Arial', alias: ['arial'], description: '无衬线字体' },
  { label: 'Calibri', value: 'Calibri', alias: ['calibri'], description: 'Office 默认字体' },
  { label: 'Helvetica', value: 'Helvetica', alias: ['helvetica'], description: '无衬线字体' },
  { label: 'Georgia', value: 'Georgia', alias: ['georgia'], description: '衬线字体' },
  { label: 'Verdana', value: 'Verdana', alias: ['verdana'], description: '无衬线字体' },
]

// 特殊字体（用于标签）
export const specialFonts: FieldOption[] = [
  { label: '仿宋', value: '仿宋', alias: ['FangSong'], description: '摘要/关键词标签' },
  { label: '宋体', value: '宋体', alias: ['SimSun'], description: '正文标签' },
  { label: '黑体', value: '黑体', alias: ['SimHei'], description: '标题标签' },
  { label: 'Times New Roman', value: 'Times New Roman', alias: ['Times'], description: '英文标签' },
]

// 中文字号
export const chineseFontSizes: FieldOption[] = [
  { label: '初号', value: '初号', description: '42pt', alias: ['42', '42pt'] },
  { label: '小初', value: '小初', description: '36pt', alias: ['36', '36pt'] },
  { label: '一号', value: '一号', description: '26pt', alias: ['26', '26pt'] },
  { label: '小一', value: '小一', description: '24pt', alias: ['24', '24pt'] },
  { label: '二号', value: '二号', description: '22pt', alias: ['22', '22pt'] },
  { label: '小二', value: '小二', description: '18pt', alias: ['18', '18pt'] },
  { label: '三号', value: '三号', description: '16pt', alias: ['16', '16pt'] },
  { label: '小三', value: '小三', description: '15pt', alias: ['15', '15pt'] },
  { label: '四号', value: '四号', description: '14pt', alias: ['14', '14pt'] },
  { label: '小四', value: '小四', description: '12pt', alias: ['12', '12pt'] },
  { label: '五号', value: '五号', description: '10.5pt', alias: ['10.5', '10.5pt'] },
  { label: '小五', value: '小五', description: '9pt', alias: ['9', '9pt'] },
  { label: '六号', value: '六号', description: '7.5pt', alias: ['7.5', '7.5pt'] },
  { label: '小六', value: '小六', description: '6.5pt', alias: ['6.5', '6.5pt'] },
  { label: '七号', value: '七号', description: '5.5pt', alias: ['5.5', '5.5pt'] },
  { label: '八号', value: '八号', description: '5pt', alias: ['5', '5pt'] },
]

// 正文常用字号
export const bodyFontSizes: FieldOption[] = [
  { label: '小四 (12pt)', value: '小四', description: '正文常用' },
  { label: '五号 (10.5pt)', value: '五号', description: '参考文献常用' },
  { label: '四号 (14pt)', value: '四号', description: '强调文本' },
]

// 标题常用字号
export const headingFontSizes: FieldOption[] = [
  { label: '三号 (16pt)', value: '三号', description: '一级标题' },
  { label: '小三 (15pt)', value: '小三', description: '二级标题' },
  { label: '四号 (14pt)', value: '四号', description: '三级标题' },
  { label: '小二 (18pt)', value: '小二', description: '一级标题（较大）' },
  { label: '小初 (36pt)', value: '小初', description: '论文题目' },
]

// 特殊用途字号
export const specialFontSizes: FieldOption[] = [
  { label: '五号 (10.5pt)', value: '五号', description: '摘要/关键词' },
  { label: '小五 (9pt)', value: '小五', description: '脚注/注释' },
  { label: '六号 (7.5pt)', value: '六号', description: '页眉页脚' },
]

// 对齐方式
export const alignments: FieldOption[] = [
  { label: '左对齐 (left)', value: 'left', description: '文本靠左对齐' },
  { label: '居中 (center)', value: 'center', description: '文本居中对齐' },
  { label: '右对齐 (right)', value: 'right', description: '文本靠右对齐' },
  { label: '两端对齐 (justify)', value: 'justify', description: '文本左右均匀对齐' },
]

// 居中对齐选项
export const centerAlignments: FieldOption[] = [
  { label: '居中 (center)', value: 'center', description: '居中对齐' },
]

// 左对齐选项
export const leftAlignments: FieldOption[] = [
  { label: '左对齐 (left)', value: 'left', description: '左对齐' },
]

// 两端对齐选项
export const justifyAlignments: FieldOption[] = [
  { label: '两端对齐 (justify)', value: 'justify', description: '两端对齐' },
]

// 行距选项
export const lineSpaces: FieldOption[] = [
  { label: '单倍行距 (single)', value: 'single', description: '行距 = 字体大小' },
  { label: '1.25倍行距 (1.25)', value: '1.25', description: '行距 = 1.25 × 字体大小' },
  { label: '1.5倍行距 (1.5)', value: '1.5', description: '行距 = 1.5 × 字体大小' },
  { label: '2倍行距 (2)', value: '2', description: '行距 = 2 × 字体大小' },
  { label: '固定值 18磅 (fixed_18_pt)', value: 'fixed_18_pt', description: '固定行距 18pt' },
  { label: '固定值 20磅 (fixed_20_pt)', value: 'fixed_20_pt', description: '固定行距 20pt' },
  { label: '固定值 22磅 (fixed_22_pt)', value: 'fixed_22_pt', description: '固定行距 22pt' },
  { label: '固定值 24磅 (fixed_24_pt)', value: 'fixed_24_pt', description: '固定行距 24pt' },
  { label: '最小值 (min)', value: 'min', description: '最小行距' },
  { label: '多倍行距 2.0 (2)', value: '2', description: '多倍行距 2.0' },
]

// 常用行距
export const commonLineSpaces: FieldOption[] = [
  { label: '1.5倍行距 (1.5)', value: '1.5', description: '论文正文常用' },
  { label: '固定值 20磅 (fixed_20_pt)', value: 'fixed_20_pt', description: '固定行距' },
  { label: '单倍行距 (single)', value: 'single', description: '参考文献常用' },
]

// 首行缩进选项
export const firstLineIndents: FieldOption[] = [
  { label: '0字符', value: '0字符', description: '无缩进' },
  { label: '2字符', value: '2字符', description: '标准缩进' },
  { label: '0.75cm', value: '0.75cm', description: '厘米单位' },
  { label: '1cm', value: '1cm', description: '厘米单位' },
  { label: '1.5cm', value: '1.5cm', description: '厘米单位' },
  { label: '0.5英寸', value: '0.5in', description: '英寸单位' },
  { label: '0pt', value: '0pt', description: '磅单位' },
  { label: '21pt', value: '21pt', description: '约1.5字符' },
]

// 段前/段后间距
export const paragraphSpaces: FieldOption[] = [
  { label: '0磅', value: '0', description: '无间距' },
  { label: '6磅', value: '6', description: '小间距' },
  { label: '8磅', value: '8', description: '标准间距' },
  { label: '10磅', value: '10', description: '中等间距' },
  { label: '12磅', value: '12', description: '较大间距' },
  { label: '0cm', value: '0cm', description: '厘米单位' },
  { label: '0.5cm', value: '0.5cm', description: '厘米单位' },
  { label: '1cm', value: '1cm', description: '厘米单位' },
]

// 页边距选项
export const marginOptions: FieldOption[] = [
  { label: '2.0cm', value: '2.0cm', description: '标准边距' },
  { label: '2.5cm', value: '2.5cm', description: '常用边距' },
  { label: '3.0cm', value: '3.0cm', description: '较大边距' },
  { label: '3.17cm (1.25英寸)', value: '3.17cm', description: '标准英制' },
  { label: '1.0英寸', value: '1in', description: '英寸单位' },
  { label: '1.25英寸', value: '1.25in', description: '英寸单位' },
  { label: '1.5英寸', value: '1.5in', description: '英寸单位' },
]

// 页面方向
export const orientations: FieldOption[] = [
  { label: '纵向 (portrait)', value: 'portrait', description: '垂直方向' },
  { label: '横向 (landscape)', value: 'landscape', description: '水平方向' },
]

// 纸张大小
export const paperSizes: FieldOption[] = [
  { label: 'A4 (210×297mm)', value: 'A4', description: '国际标准' },
  { label: 'A3 (297×420mm)', value: 'A3', description: '大尺寸' },
  { label: 'Letter (8.5×11英寸)', value: 'Letter', description: '美式信纸' },
  { label: 'Legal (8.5×14英寸)', value: 'Legal', description: '美式法律信纸' },
  { label: 'B5 (176×250mm)', value: 'B5', description: 'B系列' },
]

// 页眉/页脚距离
export const headerFooterDistances: FieldOption[] = [
  { label: '1.5cm', value: '1.5cm', description: '标准距离' },
  { label: '1.6cm', value: '1.6cm', description: '重庆工程学院标准' },
  { label: '1.75cm', value: '1.75cm', description: '常用距离' },
  { label: '2.0cm', value: '2.0cm', description: '较大距离' },
  { label: '2.1cm', value: '2.1cm', description: '重庆工程学院页脚标准' },
  { label: '0.5cm', value: '0.5cm', description: '较小距离' },
  { label: '0.7英寸', value: '0.7in', description: '英寸单位' },
]

// 打印模式
export const printModes: FieldOption[] = [
  { label: '单面打印', value: 'single_sided', description: '所有页面格式相同' },
  { label: '双面打印', value: 'double_sided', description: '左右页格式不同' },
]

// 页码格式
export const pageNumberFormats: FieldOption[] = [
  { label: '罗马数字 (I, II, III)', value: 'roman', description: '前置部分使用' },
  { label: '阿拉伯数字 (1, 2, 3)', value: 'arabic', description: '主体部分使用' },
  { label: '无页码', value: 'none', description: '不显示页码' },
]

// 页码位置
export const pageNumberPositions: FieldOption[] = [
  { label: '居中', value: 'center', description: '页码居中显示' },
  { label: '靠右', value: 'right', description: '页码靠右显示' },
  { label: '靠左', value: 'left', description: '页码靠左显示' },
]

// 关键词分隔符
export const keywordSeparators: FieldOption[] = [
  { label: '分号 (；)', value: '；', description: '中文分号' },
  { label: '逗号 (，)', value: '，', description: '中文逗号' },
  { label: '英文分号 (;)', value: ';', description: '英文分号' },
  { label: '英文逗号 (,)', value: ',', description: '英文逗号' },
]

// 参考文献编号格式
export const referenceNumberingFormats: FieldOption[] = [
  { label: '[1]', value: '[1]', description: '方括号数字' },
  { label: '1.', value: '1.', description: '数字+句点' },
  { label: '(1)', value: '(1)', description: '圆括号数字' },
  { label: '①', value: '①', description: '圆圈数字' },
  { label: '一、', value: '一、', description: '中文数字+顿号' },
]

// 标题编号格式
export const headingNumberingFormats: FieldOption[] = [
  { label: '1', value: '1', description: '纯数字' },
  { label: '1.1', value: '1.1', description: '数字+点' },
  { label: '1.1.1', value: '1.1.1', description: '三级编号' },
  { label: '第一章', value: '第一章', description: '中文章节' },
  { label: '第一节', value: '第一节', description: '中文节' },
]

// 默认格式配置
export const defaultFormatConfig = {
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
  title: {
    font_name: '黑体',
    font_size: '三号',
    alignment: 'center',
    line_space: 'single',
    bold: true
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
  abstract: {
    label: {
      font_name: '仿宋',
      font_size: '五号',
      bold: true,
      text: '摘要：'
    },
    content: {
      font_name: '宋体',
      font_size: '小四',
      alignment: 'justify',
      line_space: '1.5',
      first_line_indent: '2字符',
      bold: false
    }
  },
  keywords: {
    label: {
      font_name: '宋体',
      font_size: '五号',
      bold: true,
      text: '关键词：'
    },
    content: {
      font_name: '宋体',
      font_size: '五号',
      alignment: 'left',
      separator: '；',
      bold: false
    }
  },
  references: {
    title: {
      font_name: '黑体',
      font_size: '三号',
      alignment: 'center',
      bold: true
    },
    content: {
      font_name: '宋体',
      font_size: '五号',
      alignment: 'left',
      line_space: 'single',
      numbering: '[1]'
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
    },
    header: {
      distance: '1.5cm',
      font_name: '宋体',
      font_size: '五号',
      underline: false,
      start_from_abstract: false,
      print_mode: 'single_sided',
      left_page_content: '',
      right_page_content: ''
    },
    footer: {
      distance: '1.75cm',
      font_name: '宋体',
      font_size: '五号'
    },
    page_number: {
      front_matter_format: 'roman',
      main_body_format: 'arabic',
      front_matter_start: 1,
      main_body_start: 1,
      position: 'center'
    }
  }
}

// 常用学校类型推荐配置
export const schoolTypeRecommendations = {
  default: defaultFormatConfig,
  cqiec: {
    ...defaultFormatConfig,
    body: {
      ...defaultFormatConfig.body,
      font_size: '小四',
      line_space: '1.5',
      first_line_indent: '2字符'
    },
    headings: {
      ...defaultFormatConfig.headings,
      level1: {
        font_name: '黑体',
        font_size: '三号',
        alignment: 'center',
        line_space: 'fixed_20_pt',
        bold: true,
        numbering: '1'
      },
      level2: {
        font_name: '黑体',
        font_size: '小三',
        alignment: 'left',
        line_space: 'fixed_20_pt',
        bold: true,
        numbering: '1.1'
      },
      level3: {
        font_name: '黑体',
        font_size: '四号',
        alignment: 'left',
        line_space: 'fixed_20_pt',
        bold: true,
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
      },
      header: {
        distance: '1.6cm',
        font_name: '宋体',
        font_size: '五号',
        underline: true,
        start_from_abstract: true,
        print_mode: 'single_sided',
        left_page_content: '重庆工程学院本科生毕业设计（论文）',
        right_page_content: ''
      },
      footer: {
        distance: '2.1cm'
      }
    },
    page_number: {
      front_matter_format: 'roman',
      main_body_format: 'arabic',
      front_matter_start: 1,
      main_body_start: 1,
      position: 'center'
    }
  },
  engineering: {
    ...defaultFormatConfig,
    body: {
      ...defaultFormatConfig.body,
      line_space: '1.5'
    },
    headings: {
      ...defaultFormatConfig.headings,
      level1: {
        ...defaultFormatConfig.headings.level1,
        alignment: 'center'
      }
    }
  },
  science: {
    ...defaultFormatConfig,
    body: {
      ...defaultFormatConfig.body,
      line_space: 'fixed_20_pt',
      alignment: 'justify'
    }
  },
  liberal_arts: {
    ...defaultFormatConfig,
    body: {
      ...defaultFormatConfig.body,
      line_space: '1.5',
      alignment: 'justify'
    },
    references: {
      ...defaultFormatConfig.references,
      content: {
        ...defaultFormatConfig.references.content,
        alignment: 'justify'
      }
    }
  }
}

// 快捷操作
export const quickActions = [
  { label: '应用到全部正文', value: 'apply_to_body', icon: 'Document' },
  { label: '应用到全部标题', value: 'apply_to_headings', icon: 'Tickets' },
  { label: '重置为默认值', value: 'reset_to_default', icon: 'Refresh' },
  { label: '导出配置', value: 'export_config', icon: 'Download' },
  { label: '导入配置', value: 'import_config', icon: 'Upload' },
]

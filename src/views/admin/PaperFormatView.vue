<template>
  <div class="paper-format-view">
    <div class="page-header">
      <h2 class="page-title">高校格式管理</h2>
      <p class="page-description">管理高校论文格式模板，支持可视化编辑和智能解析</p>
    </div>

    <div class="content-container">
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchQuery"
              placeholder="搜索高校名称或ID"
              prefix-icon="Search"
              clearable
              @input="debouncedSearch"
            />
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="filterSubject"
              placeholder="学科类别"
              clearable
              @change="loadUniversities"
            >
              <el-option label="文科" value="文科" />
              <el-option label="理科" value="理科" />
              <el-option label="工科" value="工科" />
              <el-option label="综合" value="综合" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="loadUniversities">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </div>

      <div class="university-list">
        <el-table
          :data="universities"
          v-loading="loading"
          style="width: 100%"
          @row-click="handleRowClick"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="高校名称" min-width="150" />
          <el-table-column prop="document_type" label="论文类型" width="110">
            <template #default="{ row }">
              <el-tag v-if="row.document_type" type="primary" size="small">{{ row.document_type }}</el-tag>
              <span v-else class="cell-empty">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="subject" label="学科类别" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.subject" :type="getSubjectTagType(row.subject)" size="small">
                {{ row.subject }}
              </el-tag>
              <span v-else class="cell-empty">—</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260">
            <template #default="{ row }">
              <el-button
                size="small"
                @click.stop="openRenameDialog(row)"
              >
                修改名称
              </el-button>
              <el-button
                type="primary"
                size="small"
                @click.stop="openDetailDialog(row)"
              >
                编辑格式
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadUniversities"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>

    <el-dialog
      v-model="detailDialogVisible"
      :title="`格式编辑 - ${selectedUniversity?.name || ''}`"
      width="95%"
      top="2vh"
      class="format-dialog"
    >
      <div v-if="selectedUniversity" class="detail-content">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="格式编辑" name="editor">
            <div class="editor-container">
              <div class="preview-panel">
                <div class="panel-header">
                  <h4>模板预览</h4>
                  <div class="preview-actions">
                    <el-button-group>
                      <el-button
                        size="small"
                        :type="previewType === 'docx' ? 'primary' : 'default'"
                        @click="switchPreview('docx')"
                      >
                        DOCX
                      </el-button>
                      <el-button
                        size="small"
                        :type="previewType === 'pdf' ? 'primary' : 'default'"
                        @click="switchPreview('pdf')"
                      >
                        PDF
                      </el-button>
                    </el-button-group>
                    <el-button
                      size="small"
                      type="primary"
                      icon="Download"
                      @click="downloadTemplate"
                    >
                      下载
                    </el-button>
                  </div>
                </div>
                <div class="preview-content" v-loading="previewLoading">
                  <div
                    v-if="previewType === 'docx'"
                    ref="docxPreviewRef"
                    class="docx-preview-area"
                  />
                  <iframe
                    v-else-if="previewType === 'pdf'"
                    :src="pdfPreviewUrl"
                    class="pdf-preview-frame"
                  />
                  <el-empty v-else description="暂无预览文件" />
                </div>
              </div>

              <div class="editor-panel">
                <div class="panel-header">
                  <h4>格式配置</h4>
                  <div class="editor-actions">
                    <el-button
                      size="small"
                      type="warning"
                      plain
                      icon="Refresh"
                      @click="resetToDefault"
                    >
                      重置默认
                    </el-button>
                    <el-button
                      size="small"
                      type="primary"
                      icon="Check"
                      @click="saveFormat"
                    >
                      保存配置
                    </el-button>
                  </div>
                </div>
                <div class="editor-content">
                  <div v-if="validationErrors.length" class="validation-summary">
                    <el-alert
                      type="error"
                      :closable="false"
                      show-icon
                    >
                      <template #title>
                        发现 {{ validationErrors.length }} 个格式问题
                      </template>
                      <ul class="error-list">
                        <li v-for="error in validationErrors" :key="error.path">
                          {{ error.message }}
                        </li>
                      </ul>
                    </el-alert>
                  </div>

                  <div class="format-editor">
                    <FormatSection
                      v-for="section in formatSections"
                      :key="section.key"
                      :model-value="formatRequirements[section.key] || {}"
                      :schema="section"
                      :path="section.key"
                      :show-actions="true"
                      :show-batch-actions="true"
                      :can-copy="true"
                      :can-export="true"
                      @update:model-value="updateSection(section.key, $event)"
                      @change="onSectionChange"
                      @validate="onSectionValidate"
                      @batch-apply="onBatchApply"
                      @export="onExportSection"
                    />
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="JSON 编辑" name="json">
            <div class="json-editor-container">
              <div class="json-editor-header">
                <el-button
                  size="small"
                  type="primary"
                  icon="DocumentCopy"
                  @click="formatJSON"
                >
                  格式化
                </el-button>
                <el-button
                  size="small"
                  icon="Check"
                  @click="applyJSON"
                >
                  应用 JSON
                </el-button>
              </div>
              <el-input
                v-model="jsonContent"
                type="textarea"
                :rows="30"
                class="json-editor"
                placeholder="请输入 JSON 格式的配置内容"
              />
            </div>
          </el-tab-pane>

          <el-tab-pane label="智能解析" name="smart">
            <div class="smart-parse-container">
              <el-input
                v-model="smartInput"
                type="textarea"
                :rows="10"
                placeholder="请输入格式要求描述，如：正文宋体小四，1.5倍行距，两端对齐，首行缩进2字符"
              />
              <div class="smart-actions">
                <el-button
                  type="primary"
                  icon="Search"
                  :loading="smartParsing"
                  @click="parseSmartInput"
                >
                  智能解析
                </el-button>
                <el-button icon="DocumentCopy" @click="clearSmartInput">
                  清空
                </el-button>
              </div>
              <div v-if="parseResult" class="parse-result">
                <el-input
                  type="textarea"
                  :rows="15"
                  :model-value="JSON.stringify(parseResult, null, 2)"
                  readonly
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 修改高校名称对话框 -->
    <el-dialog v-model="renameDialogVisible" title="修改高校名称" width="480px" :close-on-click-modal="false">
      <el-form :model="renameForm" label-width="80px">
        <el-form-item label="当前名称">
          <el-input :model-value="renameForm.oldName" disabled />
        </el-form-item>
        <el-form-item label="新名称" required>
          <el-input v-model="renameForm.newName" placeholder="请输入新的高校名称" clearable />
        </el-form-item>
        <el-form-item label="缩写">
          <el-input v-model="renameForm.abbr" placeholder="如 CQWU（可选）" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="renameSaving" @click="submitRename">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { debounce } from 'lodash-es'
import { renderAsync } from 'docx-preview'
import request from '@/utils/request'
import FormatSection from '@/components/FormatSection.vue'
import {
  chineseFontSizes,
  headingFontSizes,
  bodyFontSizes,
  specialFontSizes,
  alignments,
  centerAlignments,
  leftAlignments,
  justifyAlignments,
  lineSpaces,
  commonLineSpaces,
  firstLineIndents,
  marginOptions,
  paperSizes,
  orientations,
  headerFooterDistances,
  printModes,
  pageNumberFormats,
  pageNumberPositions,
  chineseFonts,
  defaultFormatConfig,
  schoolTypeRecommendations
} from '@/constants/formatOptions'
import {
  FieldMapper,
  getDisplayLabel
} from '@/utils/fieldMapper'
import type {
  FormatFieldSchema,
  FormatRequirements,
  ValidationError
} from '@/types/formatRule'
import {
  Download,
  Check,
  Refresh,
  Search,
  DocumentCopy
} from '@element-plus/icons-vue'

const universities = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const filterSubject = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const detailDialogVisible = ref(false)
const selectedUniversity = ref<any>(null)
const activeTab = ref('editor')
const previewLoading = ref(false)
const previewType = ref('docx')
const pdfPreviewUrl = ref('')
const docxPreviewRef = ref<HTMLElement | null>(null)
const formatRequirements = ref<FormatRequirements>({} as FormatRequirements)
const validationErrors = ref<ValidationError[]>([])
const jsonContent = ref('')
const smartInput = ref('')
const smartParsing = ref(false)
const parseResult = ref<any>(null)

// 修改名称相关
const renameDialogVisible = ref(false)
const renameSaving = ref(false)
const renameForm = ref({ id: 0, oldName: '', newName: '', abbr: '' })

const formatSections: FormatFieldSchema[] = [
  {
    key: 'cover',
    label: '封面',
    type: 'object',
    description: '论文封面格式设置',
    children: [
      { key: 'font_name', label: '字体', type: 'font_name', options: chineseFontSizes, description: '封面正文字体' },
      { key: 'font_size', label: '字号', type: 'font_size', options: bodyFontSizes, description: '封面正文字号' },
      { key: 'alignment', label: '对齐方式', type: 'alignment', options: centerAlignments, description: '文本对齐方式' },
      { key: 'bold', label: '是否加粗', type: 'boolean', description: '是否使用粗体' },
    ]
  },
  {
    key: 'title',
    label: '论文标题',
    type: 'object',
    description: '论文主标题格式',
    children: [
      { key: 'font_name', label: '字体', type: 'font_name', options: chineseFontSizes, description: '标题字体' },
      { key: 'font_size', label: '字号', type: 'font_size', options: headingFontSizes, description: '标题字号' },
      { key: 'bold', label: '是否加粗', type: 'boolean', default: true, description: '是否使用粗体' },
      { key: 'alignment', label: '对齐方式', type: 'alignment', options: centerAlignments, description: '对齐方式' },
      { key: 'line_space', label: '行间距', type: 'line_space', options: commonLineSpaces, description: '行距设置' },
    ]
  },
  {
    key: 'author',
    label: '作者信息',
    type: 'object',
    description: '作者姓名和学号格式',
    children: [
      { key: 'font_name', label: '字体', type: 'font_name', options: chineseFontSizes, description: '作者信息字体' },
      { key: 'font_size', label: '字号', type: 'font_size', options: bodyFontSizes, description: '作者信息字号' },
      { key: 'alignment', label: '对齐方式', type: 'alignment', options: centerAlignments, description: '对齐方式' },
    ]
  },
  {
    key: 'abstract',
    label: '摘要',
    type: 'object',
    description: '中文摘要格式',
    children: [
      {
        key: 'label',
        label: '摘要标签',
        type: 'object',
        children: [
          { key: 'font_name', label: '字体', type: 'font_name', options: chineseFontSizes, description: '标签字体' },
          { key: 'font_size', label: '字号', type: 'font_size', options: chineseFontSizes, description: '标签字号' },
          { key: 'bold', label: '是否加粗', type: 'boolean', default: true, description: '是否加粗' },
          { key: 'text', label: '标签文本', type: 'text', default: '摘要：', description: '固定标签文本' },
        ]
      },
      {
        key: 'content',
        label: '摘要内容',
        type: 'object',
        children: [
          { key: 'font_name', label: '字体', type: 'font_name', options: chineseFontSizes, description: '内容字体' },
          { key: 'font_size', label: '字号', type: 'font_size', options: bodyFontSizes, description: '内容字号' },
          { key: 'alignment', label: '对齐方式', type: 'alignment', options: justifyAlignments, description: '对齐方式' },
          { key: 'line_space', label: '行间距', type: 'line_space', options: commonLineSpaces, description: '行距设置' },
          { key: 'first_line_indent', label: '首行缩进', type: 'first_line_indent', options: firstLineIndents, description: '首行缩进' },
        ]
      },
    ]
  },
  {
    key: 'body',
    label: '正文',
    type: 'object',
    description: '论文正文格式',
    children: [
      { key: 'font_name', label: '字体', type: 'font_name', options: chineseFontSizes, validation: { required: true }, description: '正文字体' },
      { key: 'font_size', label: '字号', type: 'font_size', options: bodyFontSizes, validation: { required: true }, description: '正文字号' },
      { key: 'alignment', label: '对齐方式', type: 'alignment', options: justifyAlignments, description: '对齐方式' },
      { key: 'line_space', label: '行间距', type: 'line_space', options: lineSpaces, description: '行距设置' },
      {
        key: 'paragraph_space',
        label: '段落间距',
        type: 'object',
        children: [
          { key: 'before', label: '段前', type: 'string', options: marginOptions, description: '段前间距' },
          { key: 'after', label: '段后', type: 'string', options: marginOptions, description: '段后间距' },
        ]
      },
      { key: 'first_line_indent', label: '首行缩进', type: 'first_line_indent', options: firstLineIndents, description: '首行缩进' },
    ]
  },
  {
    key: 'headings',
    label: '标题层级',
    type: 'object',
    description: '各级标题格式设置',
    children: [
      {
        key: 'level1',
        label: '一级标题',
        type: 'object',
        children: [
          { key: 'font_name', label: '字体', type: 'font_name', options: chineseFontSizes, description: '一级标题字体' },
          { key: 'font_size', label: '字号', type: 'font_size', options: headingFontSizes, description: '一级标题字号' },
          { key: 'bold', label: '是否加粗', type: 'boolean', description: '是否加粗' },
          { key: 'alignment', label: '对齐方式', type: 'alignment', options: centerAlignments, description: '对齐方式' },
          { key: 'line_space', label: '行间距', type: 'line_space', options: commonLineSpaces, description: '行距设置' },
          { key: 'numbering', label: '编号格式', type: 'string', description: '自动编号格式' },
        ]
      },
      {
        key: 'level2',
        label: '二级标题',
        type: 'object',
        children: [
          { key: 'font_name', label: '字体', type: 'font_name', options: chineseFontSizes, description: '二级标题字体' },
          { key: 'font_size', label: '字号', type: 'font_size', options: headingFontSizes, description: '二级标题字号' },
          { key: 'bold', label: '是否加粗', type: 'boolean', description: '是否加粗' },
          { key: 'alignment', label: '对齐方式', type: 'alignment', options: leftAlignments, description: '对齐方式' },
          { key: 'line_space', label: '行间距', type: 'line_space', options: commonLineSpaces, description: '行距设置' },
          { key: 'numbering', label: '编号格式', type: 'string', description: '自动编号格式' },
        ]
      },
      {
        key: 'level3',
        label: '三级标题',
        type: 'object',
        children: [
          { key: 'font_name', label: '字体', type: 'font_name', options: chineseFontSizes, description: '三级标题字体' },
          { key: 'font_size', label: '字号', type: 'font_size', options: headingFontSizes, description: '三级标题字号' },
          { key: 'bold', label: '是否加粗', type: 'boolean', description: '是否加粗' },
          { key: 'alignment', label: '对齐方式', type: 'alignment', options: leftAlignments, description: '对齐方式' },
          { key: 'line_space', label: '行间距', type: 'line_space', options: commonLineSpaces, description: '行距设置' },
          { key: 'numbering', label: '编号格式', type: 'string', description: '自动编号格式' },
        ]
      },
    ]
  },
  {
    key: 'keywords',
    label: '关键词',
    type: 'object',
    description: '中文关键词格式',
    children: [
      {
        key: 'label',
        label: '关键词标签',
        type: 'object',
        children: [
          { key: 'font_name', label: '字体', type: 'font_name', options: chineseFontSizes, description: '标签字体' },
          { key: 'font_size', label: '字号', type: 'font_size', options: chineseFontSizes, description: '标签字号' },
          { key: 'bold', label: '是否加粗', type: 'boolean', default: true, description: '是否加粗' },
          { key: 'text', label: '标签文本', type: 'text', default: '关键词：', description: '固定标签文本' },
        ]
      },
      {
        key: 'content',
        label: '关键词内容',
        type: 'object',
        children: [
          { key: 'font_name', label: '字体', type: 'font_name', options: chineseFontSizes, description: '内容字体' },
          { key: 'font_size', label: '字号', type: 'font_size', options: chineseFontSizes, description: '内容字号' },
          { key: 'alignment', label: '对齐方式', type: 'alignment', options: leftAlignments, description: '对齐方式' },
          { key: 'separator', label: '分隔符', type: 'separator', options: [{ label: '分号', value: '；' }], description: '关键词分隔符' },
        ]
      },
    ]
  },
  {
    key: 'references',
    label: '参考文献',
    type: 'object',
    description: '参考文献格式',
    children: [
      {
        key: 'title',
        label: '参考文献标题',
        type: 'object',
        children: [
          { key: 'font_name', label: '字体', type: 'font_name', options: chineseFontSizes, description: '标题字体' },
          { key: 'font_size', label: '字号', type: 'font_size', options: headingFontSizes, description: '标题字号' },
          { key: 'bold', label: '是否加粗', type: 'boolean', default: true, description: '是否加粗' },
          { key: 'alignment', label: '对齐方式', type: 'alignment', options: centerAlignments, description: '对齐方式' },
        ]
      },
      {
        key: 'content',
        label: '参考文献内容',
        type: 'object',
        children: [
          { key: 'font_name', label: '字体', type: 'font_name', options: chineseFontSizes, description: '内容字体' },
          { key: 'font_size', label: '字号', type: 'font_size', options: chineseFontSizes, description: '内容字号' },
          { key: 'alignment', label: '对齐方式', type: 'alignment', options: leftAlignments, description: '对齐方式' },
          { key: 'line_space', label: '行间距', type: 'line_space', options: commonLineSpaces, description: '行距设置' },
          { key: 'numbering', label: '编号格式', type: 'string', description: '自动编号格式' },
        ]
      },
    ]
  },
  {
    key: 'page_setup',
    label: '页面设置',
    type: 'object',
    description: '页面布局设置',
    children: [
      { key: 'paper_size', label: '纸张大小', type: 'paper_size', options: paperSizes, description: '纸张规格' },
      { key: 'orientation', label: '页面方向', type: 'orientation', options: orientations, description: '页面方向' },
      {
        key: 'margins',
        label: '页边距',
        type: 'object',
        children: [
          { key: 'top', label: '上边距', type: 'margin', options: marginOptions, description: '上边距' },
          { key: 'bottom', label: '下边距', type: 'margin', options: marginOptions, description: '下边距' },
          { key: 'left', label: '左边距', type: 'margin', options: marginOptions, description: '左边距' },
          { key: 'right', label: '右边距', type: 'margin', options: marginOptions, description: '右边距' },
        ]
      },
      {
        key: 'header',
        label: '页眉',
        type: 'object',
        children: [
          { key: 'distance', label: '页眉距离', type: 'string', options: headerFooterDistances, description: '页眉距离边界' },
          { key: 'font_name', label: '字体', type: 'font_name', options: chineseFonts, description: '页眉字体' },
          { key: 'font_size', label: '字号', type: 'font_size', options: specialFontSizes, description: '页眉字号' },
          { key: 'underline', label: '下划线', type: 'boolean', description: '是否带下划线' },
          { key: 'start_from_abstract', label: '从摘要开始', type: 'boolean', description: '是否从摘要页开始显示页眉' },
          { key: 'print_mode', label: '打印模式', type: 'string', options: printModes, description: '单面/双面打印' },
          { key: 'left_page_content', label: '左页内容', type: 'text', description: '左页显示内容（如校名）' },
          { key: 'right_page_content', label: '右页内容', type: 'text', description: '右页显示内容（如章名）' },
        ]
      },
      {
        key: 'footer',
        label: '页脚',
        type: 'object',
        children: [
          { key: 'distance', label: '页脚距离', type: 'string', options: headerFooterDistances, description: '页脚距离边界' },
        ]
      },
      {
        key: 'page_number',
        label: '页码',
        type: 'object',
        children: [
          { key: 'front_matter_format', label: '前言页码格式', type: 'string', options: pageNumberFormats, description: '摘要、目录等前置部分页码' },
          { key: 'main_body_format', label: '主体页码格式', type: 'string', options: pageNumberFormats, description: '正文部分页码' },
          { key: 'front_matter_start', label: '前言起始页码', type: 'number', description: '前言部分起始页码' },
          { key: 'main_body_start', label: '主体起始页码', type: 'number', description: '主体部分起始页码' },
          { key: 'position', label: '页码位置', type: 'string', options: pageNumberPositions, description: '页码显示位置' },
        ]
      },
    ]
  },
]

// 当可视化编辑器中的 formatRequirements 发生变化时，同步更新 JSON 编辑器内容
// 仅当 JSON 编辑器标签页未激活时才自动同步（避免覆盖用户正在手动编辑的 JSON）
watch(
  formatRequirements,
  (val) => {
    if (activeTab.value !== 'json') {
      jsonContent.value = JSON.stringify(val, null, 2)
    }
  },
  { deep: true }
)

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  loadUniversities()
}, 300)

const loadUniversities = async () => {
  loading.value = true
  try {
    const response = await request({
      url: '/api/v1/admin/universities',
      method: 'GET',
      params: {
        page: currentPage.value,
        page_size: pageSize.value,
        q: searchQuery.value,
        subject: filterSubject.value
      }
    })

    if (response?.items) {
      universities.value = response.items
      total.value = response.total || 0
    }
  } catch (error) {
    ElMessage.error('加载高校列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  filterSubject.value = ''
  currentPage.value = 1
  loadUniversities()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadUniversities()
}

const getSubjectTagType = (subject: string) => {
  switch (subject) {
    case '文科': return 'warning'
    case '理科': return 'success'
    case '工科': return 'primary'
    case '综合': return 'info'
    default: return 'info'
  }
}

const handleRowClick = (row: any) => {
  openDetailDialog(row)
}

const openRenameDialog = (row: any) => {
  renameForm.value = {
    id: row.id,
    oldName: row.name || '',
    newName: row.name || '',
    abbr: row.abbr || ''
  }
  renameDialogVisible.value = true
}

const submitRename = async () => {
  if (!renameForm.value.newName.trim()) {
    ElMessage.warning('高校名称不能为空')
    return
  }
  renameSaving.value = true
  try {
    await request({
      url: `/api/v1/admin/universities/${renameForm.value.id}`,
      method: 'PUT',
      data: {
        name: renameForm.value.newName.trim(),
        abbr: renameForm.value.abbr.trim() || undefined
      }
    })
    ElMessage.success('高校名称已更新')
    renameDialogVisible.value = false
    await loadUniversities()
  } catch (error) {
    ElMessage.error('更新失败: ' + (error as Error).message)
  } finally {
    renameSaving.value = false
  }
}

const openDetailDialog = async (university: any) => {
  selectedUniversity.value = university
  detailDialogVisible.value = true
  activeTab.value = 'editor'

  if (university.format_requirements) {
    try {
      let req = university.format_requirements
      if (typeof req === 'string') {
        req = JSON.parse(req)
      }
      formatRequirements.value = FieldMapper.clean(req as FormatRequirements)
    } catch (e) {
      formatRequirements.value = JSON.parse(JSON.stringify(defaultFormatConfig)) as FormatRequirements
    }
  } else {
    formatRequirements.value = JSON.parse(JSON.stringify(defaultFormatConfig)) as FormatRequirements
  }

  jsonContent.value = JSON.stringify(formatRequirements.value, null, 2)

  setTimeout(() => {
    loadTemplatePreview(university)
  }, 100)
}

const switchPreview = async (type: string) => {
  previewType.value = type
  if (selectedUniversity.value) {
    await loadTemplatePreview(selectedUniversity.value)
  }
}

const loadTemplatePreview = async (university: any) => {
  if (!university) return
  previewLoading.value = true

  try {
    if (previewType.value === 'docx') {
      if (docxPreviewRef.value) {
        docxPreviewRef.value.innerHTML = ''
      }

      const templateUrl = constructTemplateUrl(university, 'docx')
      if (!templateUrl) return

      const response = await fetch(templateUrl)
      if (!response.ok) throw new Error('获取模板失败')

      const blob = await response.blob()
      if (docxPreviewRef.value) {
        await renderAsync(blob, docxPreviewRef.value, null, {
          className: 'docx-preview-content',
          inWrapper: false,
          ignoreWidth: false,
          ignoreHeight: false,
        })
      }
    } else if (previewType.value === 'pdf') {
      const templateUrl = constructTemplateUrl(university, 'pdf')
      if (templateUrl) {
        pdfPreviewUrl.value = templateUrl
      }
    }
  } catch (error) {
    ElMessage.error('预览加载失败')
  } finally {
    previewLoading.value = false
  }
}

const constructTemplateUrl = (university: any, fileType: string) => {
  if (!university) return null
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

  let url = null
  if (fileType === 'docx' && university.docx_template_url) {
    url = university.docx_template_url
  } else if (fileType === 'pdf' && university.pdf_template_url) {
    url = university.pdf_template_url
  } else if (university.file_path) {
    url = university.file_path
  }

  if (!url) return null

  if (!url.startsWith('http') && !url.startsWith('//')) {
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    return url.startsWith('/') ? cleanBaseUrl + url : cleanBaseUrl + '/' + url
  }
  return url
}

const downloadTemplate = () => {
  if (selectedUniversity.value) {
    const url = constructTemplateUrl(selectedUniversity.value, 'docx')
    if (url) {
      window.open(url, '_blank')
    }
  }
}

const updateSection = (sectionKey: string, value: any) => {
  formatRequirements.value = {
    ...formatRequirements.value,
    [sectionKey]: value
  }
  jsonContent.value = JSON.stringify(formatRequirements.value, null, 2)
  validateAll()
}

const onSectionChange = (path: string, value: any) => {
  console.log('Field changed:', path, value)
}

const onSectionValidate = (path: string, errors: Record<string, string | null>) => {
  
}

const onBatchApply = (path: string, value: any) => {
  ElMessage.success(`已将配置应用到 ${getDisplayLabel(path)}`)
}

const onExportSection = (path: string) => {
  const sectionData = formatRequirements.value[path as keyof FormatRequirements]
  const dataStr = JSON.stringify(sectionData, null, 2)
  navigator.clipboard.writeText(dataStr)
    .then(() => {
      ElMessage.success('配置已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}

const validateAll = () => {
  validationErrors.value = FieldMapper.validateAll(formatRequirements.value)
}

const resetToDefault = () => {
  ElMessageBox.confirm(
    '确定要将所有格式重置为默认值吗？',
    '确认重置',
    { type: 'warning' }
  ).then(() => {
    formatRequirements.value = JSON.parse(JSON.stringify(defaultFormatConfig)) as FormatRequirements
    jsonContent.value = JSON.stringify(formatRequirements.value, null, 2)
    ElMessage.success('已重置为默认值')
  })
}

const saveFormat = async () => {
  try {
    const cleanedData = FieldMapper.clean(formatRequirements.value)

    const response = await request({
      url: `/api/v1/admin/universities/${selectedUniversity.value.id}`,
      method: 'PUT',
      data: { format_requirements: cleanedData }
    })

    if (response) {
      ElMessage.success('格式配置已保存')
      await loadUniversities()
    } else {
      ElMessage.error('保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败: ' + (error as Error).message)
  }
}

const formatJSON = () => {
  try {
    const parsed = JSON.parse(jsonContent.value)
    jsonContent.value = JSON.stringify(parsed, null, 2)
  } catch {
    ElMessage.error('JSON 格式错误')
  }
}

const applyJSON = () => {
  try {
    const parsed = JSON.parse(jsonContent.value)
    formatRequirements.value = parsed as FormatRequirements
    validateAll()
    ElMessage.success('JSON 已应用')
  } catch {
    ElMessage.error('JSON 格式错误')
  }
}

const parseSmartInput = async () => {
  if (!smartInput.value.trim()) {
    ElMessage.warning('请输入格式要求')
    return
  }

  smartParsing.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))

    const result: any = {}

    if (smartInput.value.includes('宋体')) {
      result.font_name = '宋体'
    }
    if (smartInput.value.includes('黑体')) {
      result.font_name = '黑体'
    }
    if (smartInput.value.includes('小四')) {
      result.font_size = '小四'
    }
    if (smartInput.value.includes('三号')) {
      result.font_size = '三号'
    }
    if (smartInput.value.includes('居中')) {
      result.alignment = 'center'
    }
    if (smartInput.value.includes('左对齐')) {
      result.alignment = 'left'
    }
    if (smartInput.value.includes('两端对齐')) {
      result.alignment = 'justify'
    }
    if (smartInput.value.includes('1.5倍')) {
      result.line_space = '1.5'
    }
    if (smartInput.value.includes('单倍')) {
      result.line_space = 'single'
    }

    parseResult.value = result
    ElMessage.success('解析完成')
  } catch {
    ElMessage.error('解析失败')
  } finally {
    smartParsing.value = false
  }
}

const clearSmartInput = () => {
  smartInput.value = ''
  parseResult.value = null
}

onMounted(() => {
  loadUniversities()
})
</script>

<style scoped>
.paper-format-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.content-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.format-dialog :deep(.el-dialog__body) {
  padding: 10px 20px;
}

.editor-container {
  display: flex;
  gap: 20px;
  height: 70vh;
}

.preview-panel,
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.preview-actions,
.editor-actions {
  display: flex;
  gap: 8px;
}

.preview-content,
.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fff;
}

.docx-preview-area {
  padding: 20px;
  min-height: 100%;
}

.pdf-preview-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.validation-summary {
  margin-bottom: 16px;
}

.error-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.error-list li {
  font-size: 12px;
  color: #dc2626;
}

.format-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.json-editor-container {
  padding: 16px;
}

.json-editor-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.json-editor {
  font-family: monospace;
  font-size: 12px;
}

.smart-parse-container {
  padding: 16px;
}

.smart-actions {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}

.parse-result {
  margin-top: 16px;
}

.cell-empty {
  color: #c0c4cc;
  font-size: 13px;
}
</style>

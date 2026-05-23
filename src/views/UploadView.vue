<template>
  <div class="upload-view-container">
    <!-- 前景内容 -->
    <div class="content-layer">
      <!-- 探索模式：搜索和高校列表 -->
      <transition name="fade-slide" mode="out-in">
        <div v-if="viewMode === 'explore'" class="explore-mode" key="explore">
          <div class="explore-header">
            <h1 class="explore-title">探索你的高校论文标准</h1>
            <p class="explore-subtitle">搜索你的学校，获取精准的格式检查服务</p>
            
            <!-- 搜索栏 -->
            <div class="search-container">
              <el-input
                v-model="searchQuery"
                placeholder="输入高校名称搜索..."
                class="glass-search-input"
                prefix-icon="Search"
                clearable
                @input="handleSearch"
              >
                <template #append>
                  <el-button @click="handleSearch">搜索</el-button>
                </template>
              </el-input>
              
              <div class="quick-actions">
                <el-button link type="primary" @click="selectCustomMode" class="skip-btn">
                  找不到学校？直接进入自定义上传 <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </div>

          <!-- 热门高校卡片网格 -->
          <div class="university-grid">
            <div 
              v-for="uni in filteredUniversities" 
              :key="uni.id" 
              class="uni-card"
              :style="{ '--card-bg': uni.color || 'linear-gradient(90deg,#6366f1,#8b5cf6)' }"
              @click="selectUniversity(uni)"
            >
              <div class="card-image" :style="{ background: uni.color || 'linear-gradient(135deg,#6366f1,#8b5cf6)' }">
                {{ (uni.abbr || uni.name || '').slice(0, 2) }}
              </div>
              <div class="card-content">
                <h3 class="uni-name">{{ uni.name }}</h3>
                <div class="uni-tags">
                  <span v-for="tag in uni.tags" :key="tag" class="tag" :class="tag.type">{{ tag.text }}</span>
                </div>
                <p class="uni-desc">{{ uni.description }}</p>
              </div>
            </div>
          </div>

          <div class="mode-options">
            <h2 class="section-subtitle">其它模式</h2>
            <div class="mode-options-grid">
              <div class="uni-card custom-card" @click="selectCustomMode">
                <div class="card-image custom-bg">
                  <el-icon><EditPen /></el-icon>
                </div>
                <div class="card-content">
                  <h3 class="uni-name">自定义模式</h3>
                  <div class="uni-tags">
                    <span class="tag warning">手动配置</span>
                    <span class="tag info">灵活通用</span>
                  </div>
                  <p class="uni-desc">未找到你的学校？点击此处手动配置格式要求。</p>
                </div>
              </div>

              <div class="uni-card import-card" @click="triggerTemplateUpload" :class="{ 'uploading': uploadingTemplate }">
                <div class="card-image import-bg">
                  <el-icon v-if="!uploadingTemplate"><Download /></el-icon>
                  <el-icon v-else class="rotating"><Loading /></el-icon>
                </div>
                <div class="card-content">
                  <h3 class="uni-name">导入模板</h3>
                  <div class="uni-tags">
                    <span class="tag success">Word模板</span>
                    <span class="tag primary">标准参考</span>
                  </div>
                  <p class="uni-desc">上传学校模板文档，系统自动分析格式规范。</p>
                  <div v-if="uploadingTemplate" class="upload-progress-info">
                    <el-progress 
                      :percentage="templateUploadProgress" 
                      :stroke-width="4"
                      :show-text="true" 
                      :format="() => `${templateUploadProgress}%`"
                    />
                    <p class="progress-text">正在上传并解析模板...</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref="templateFileInput" 
                  style="display: none" 
                  accept=".docx,.doc"
                  @change="handleTemplateFileSelect"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 上传模式：PaperUpload 组件 -->
        <div v-else class="upload-mode" key="upload">
          <div class="upload-mode-header">
            <el-button class="back-btn glass-btn" @click="backToExplore">
              <el-icon><ArrowLeft /></el-icon> 返回探索
            </el-button>
            <div class="selected-uni-info" v-if="selectedUniversity">
              <span class="uni-badge" :style="{ background: selectedUniversity.color }">{{ selectedUniversity.abbr }}</span>
              <h2>{{ selectedUniversity.name }}</h2>
            </div>
            <div class="selected-uni-info" v-else>
              <span class="uni-badge custom-badge"><el-icon><EditPen /></el-icon></span>
              <h2>{{ importedTemplateFile ? '导入模板模式' : '自定义模式' }}</h2>
            </div>
          </div>

          <!-- 嵌入 PaperUpload 组件，通过 props 传递配置 -->
          <div class="paper-upload-wrapper glass-panel">
            <PaperUpload 
              ref="paperUploadRef"
              :initial-template="selectedUniversity ? (selectedUniversity.id || 'custom') : 'custom'" 
              :is-custom="!selectedUniversity"
              :imported-template-file="importedTemplateFile"
              :template-id="selectedUniversity ? selectedUniversity.id : null"
              @template-uploaded="handleTemplateUploaded"
            />

          </div>
        </div>
      </transition>
    </div>

    <!-- 底部半透明栏（保留统计信息，移除快速筛选） -->
    <div class="bottom-bar glass-bar">
      <div class="stats-info">
        <span>已收录 <strong>120+</strong> 所高校标准</span>
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, EditPen, ArrowLeft, ArrowRight, Loading, Download } from '@element-plus/icons-vue'
import PaperUpload from '../components/PaperUpload.vue'
import { ElMessage } from 'element-plus'
import { listUniversities } from '../api/universities'
import { uploadTemplate } from '../api/paper'

// 调色盘：每张卡片随机分配一种渐变
const CARD_PALETTES = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',  // 靛蓝-紫
  'linear-gradient(135deg,#3b82f6,#06b6d4)',  // 蓝-青
  'linear-gradient(135deg,#10b981,#059669)',  // 绿
  'linear-gradient(135deg,#f59e0b,#ef4444)',  // 橙-红
  'linear-gradient(135deg,#ec4899,#f43f5e)',  // 粉-玫红
  'linear-gradient(135deg,#14b8a6,#3b82f6)',  // 青-蓝
  'linear-gradient(135deg,#8b5cf6,#ec4899)',  // 紫-粉
  'linear-gradient(135deg,#f97316,#facc15)',  // 橙-黄
  'linear-gradient(135deg,#0ea5e9,#6366f1)',  // 天蓝-靛
  'linear-gradient(135deg,#22c55e,#16a34a)',  // 翠绿
  'linear-gradient(135deg,#a855f7,#6366f1)',  // 紫罗兰
  'linear-gradient(135deg,#fb923c,#f43f5e)',  // 珊瑚-红
]

// 根据字符串稳定散列，保证同一学校每次刷新颜色一致
const hashColor = (str) => {
  let h = 0
  for (let i = 0; i < (str || '').length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return CARD_PALETTES[h % CARD_PALETTES.length]
}

// 视图模式: 'explore' | 'upload'
const viewMode = ref('explore')
const searchQuery = ref('')
const selectedUniversity = ref(null)
const paperUploadRef = ref(null)
const importedTemplateFile = ref(null)
const templateFileInput = ref(null)

const universities = ref([])
const loadingUniversities = ref(false)
const uploadingTemplate = ref(false)
const templateUploadProgress = ref(0)

// 搜索过滤
const filteredUniversities = computed(() => {
  if (!searchQuery.value) return universities.value
  const q = searchQuery.value.toLowerCase()
  return universities.value.filter(u => (u.name || '').toLowerCase().includes(q) || (u.abbr || '').toLowerCase().includes(q))
})

// 交互处理
const handleSearch = () => {
  loadUniversities()
}

const selectUniversity = (uni) => {
  selectedUniversity.value = uni
  importedTemplateFile.value = null
  viewMode.value = 'upload'
}

const selectCustomMode = () => {
  selectedUniversity.value = null
  importedTemplateFile.value = null
  viewMode.value = 'upload'
}

const handleTemplateUploaded = (templateData) => {
  // 模板上传成功后的处理
  if (templateData && templateData.file) {
    importedTemplateFile.value = templateData.file
    ElMessage.success('模板文件已上传并解析成功')
  }
}

// 触发模板文件选择
const triggerTemplateUpload = () => {
  if (uploadingTemplate.value) {
    ElMessage.warning('模板正在上传中，请稍候...')
    return
  }
  templateFileInput.value?.click()
}

// 处理模板文件选择
const handleTemplateFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) {
    // 清空input，允许重新选择同一文件
    if (templateFileInput.value) {
      templateFileInput.value.value = ''
    }
    return
  }

  // 验证文件类型
  const extension = file.name.split('.').pop().toLowerCase()
  if (extension !== 'docx' && extension !== 'doc') {
    ElMessage.error('请上传 Word 格式的模板文件 (.docx, .doc)')
    if (templateFileInput.value) {
      templateFileInput.value.value = ''
    }
    return
  }

  // 验证文件大小（50MB）
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('模板文件大小不能超过 50MB')
    if (templateFileInput.value) {
      templateFileInput.value.value = ''
    }
    return
  }

  // 开始上传
  uploadingTemplate.value = true
  templateUploadProgress.value = 0

  try {
    const formData = new FormData()
    formData.append('file', file)

    // 调用上传模板接口
    const response = await uploadTemplate(formData, (progressEvent) => {
      if (progressEvent?.lengthComputable) {
        templateUploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      }
    })

    ElMessage.success('模板文件已上传并解析成功')

    // 上传成功后重新请求高校列表接口
    await loadUniversities()

    // 清空文件选择器
    if (templateFileInput.value) {
      templateFileInput.value.value = ''
    }

  } catch (error) {

    ElMessage.error('模板上传失败：' + (error.message || '网络错误'))
  } finally {
    uploadingTemplate.value = false
    templateUploadProgress.value = 0
    // 清空文件选择器，允许重新选择
    if (templateFileInput.value) {
      templateFileInput.value.value = ''
    }
  }
}


const backToExplore = () => {
  viewMode.value = 'explore'
  selectedUniversity.value = null
  importedTemplateFile.value = null
}

// 清理包含XML标签的文本
const cleanText = (text) => {
  if (!text) return text
  // 移除Word XML标签并解码HTML实体
  return text
    .replace(/<[^>]*>/g, '') // 移除所有XML/HTML标签
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

const mapUniversity = (it) => {
  const name = cleanText(it.name)
  const id   = it.id || name || ''
  return {
    id,
    name,
    abbr: cleanText(it.abbr),
    color: it.color || hashColor(id),
    templateId: it.template_id || it.templateId || null,
    tags: it.tags || [],
    description: cleanText(it.description) || ''
  }
}

const loadUniversities = async () => {
  try {
    loadingUniversities.value = true
    const data = await listUniversities({ q: searchQuery.value || '', page: 1, page_size: 20 })
    const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : [])
    universities.value = items.map(mapUniversity)
  } catch (e) {
    ElMessage.error('高校列表加载失败')
  } finally {
    loadingUniversities.value = false
  }
}

onMounted(() => {
  loadUniversities()
})

</script>

<style scoped>
/* ============================================================
   Upload View — Redesigned 2024
   ============================================================ */

.upload-view-container {
  position: relative;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  color: #1f2937;
  background: linear-gradient(160deg, #f0f4ff 0%, #fafbff 50%, #f5f3ff 100%);
  min-height: 100vh;
}

/* ---- 内容层 ---- */
.content-layer {
  position: relative;
  z-index: 10;
  max-width: 1280px;
  margin: 0 auto;
  padding: 56px 32px 100px;
}

/* ============================================================
   探索模式 Header
   ============================================================ */
.explore-header {
  text-align: center;
  margin-bottom: 56px;
}

.explore-title {
  font-size: 2.75rem;
  font-weight: 800;
  margin: 0 0 14px;
  background: linear-gradient(135deg, #1e293b 0%, #4f46e5 60%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.explore-subtitle {
  font-size: 1.1rem;
  color: #64748b;
  margin: 0 0 40px;
  font-weight: 400;
}

.search-container {
  max-width: 580px;
  margin: 0 auto;
}

.glass-search-input :deep(.el-input__wrapper) {
  background: #ffffff !important;
  border: 1.5px solid #e2e8f0 !important;
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.08) !important;
  border-radius: 14px 0 0 14px !important;
  padding: 8px 16px !important;
  height: 52px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.glass-search-input :deep(.el-input__wrapper:hover),
.glass-search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #6366f1 !important;
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.18) !important;
}

.glass-search-input :deep(.el-input-group__append) {
  background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
  color: white !important;
  border: none !important;
  border-radius: 0 14px 14px 0 !important;
  font-weight: 600 !important;
  font-size: 1rem !important;
  padding: 0 24px !important;
  transition: opacity 0.2s;
}

.glass-search-input :deep(.el-input-group__append:hover) {
  opacity: 0.88;
}

.quick-actions {
  margin-top: 14px;
  text-align: center;
}

.skip-btn {
  font-size: 0.95rem !important;
  color: #6366f1 !important;
  font-weight: 500 !important;
}

.skip-btn:hover {
  color: #4f46e5 !important;
}

/* ============================================================
   高校卡片网格
   ============================================================ */
.university-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  padding: 4px 0 24px;
}

/* ---- 卡片 ---- */
.uni-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 0;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.uni-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--card-bg, linear-gradient(90deg, #6366f1, #8b5cf6));
  border-radius: 18px 18px 0 0;
}

.uni-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.12);
}

.card-image {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 24px 20px 0;
  color: white;
  font-weight: 800;
  font-size: 1.1rem;
  background: var(--card-bg, linear-gradient(135deg, #6366f1, #8b5cf6));
  flex-shrink: 0;
  letter-spacing: -0.02em;
}

.card-content {
  width: 100%;
  padding: 14px 20px 20px;
}

.uni-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 10px;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.uni-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.tag {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
  background: #f1f5f9;
  color: #475569;
  letter-spacing: 0.01em;
}

.tag.primary { background: #eff6ff; color: #3b82f6; }
.tag.success { background: #f0fdf4; color: #16a34a; }
.tag.danger  { background: #fff1f2; color: #e11d48; }
.tag.warning { background: #fffbeb; color: #d97706; }
.tag.info    { background: #f0f9ff; color: #0284c7; }

.uni-desc {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

/* ============================================================
   其它模式区域
   ============================================================ */
.mode-options {
  margin-top: 8px;
}

.section-subtitle {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 16px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.mode-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

/* 自定义模式卡片 */
.custom-card {
  background: #ffffff;
}

.custom-card::before {
  background: linear-gradient(90deg, #f59e0b, #ef4444);
}

.custom-card .card-image {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
}

.custom-card:hover {
  box-shadow: 0 16px 40px rgba(245, 158, 11, 0.18), 0 0 0 1px rgba(245, 158, 11, 0.2);
}

/* 导入模板卡片 */
.import-card {
  background: #ffffff;
}

.import-card::before {
  background: linear-gradient(90deg, #10b981, #059669);
}

.import-card .card-image {
  background: linear-gradient(135deg, #10b981, #059669);
}

.import-card:hover {
  box-shadow: 0 16px 40px rgba(16, 185, 129, 0.18), 0 0 0 1px rgba(16, 185, 129, 0.2);
}

.import-card.uploading {
  pointer-events: none;
  opacity: 0.75;
}

.import-bg {
  background: linear-gradient(135deg, #10b981, #059669);
}

.custom-bg {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
}

.upload-progress-info {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #e2e8f0;
}

.progress-text {
  margin-top: 6px;
  font-size: 0.8rem;
  color: #94a3b8;
  text-align: center;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ============================================================
   上传模式
   ============================================================ */
.upload-mode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.back-btn {
  font-weight: 600;
  font-size: 0.95rem;
  padding: 10px 20px;
  height: auto;
}

.glass-btn {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s;
  color: #475569;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.glass-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateX(-3px);
}

.selected-uni-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.uni-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.custom-badge {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
}

.selected-uni-info h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.paper-upload-wrapper {
  margin-top: 20px;
}

.glass-panel {
  background: #ffffff;
  border: 1px solid #e8ecf2;
  border-radius: 20px;
  padding: 36px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

/* ============================================================
   底部状态栏
   ============================================================ */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 52px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 40px;
}

.glass-bar {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(20px);
  border-top: 1px solid #e8ecf2;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.04);
}

.stats-info {
  color: #94a3b8;
  font-weight: 500;
  font-size: 0.875rem;
}

.stats-info strong {
  color: #6366f1;
  font-weight: 700;
}

/* ============================================================
   动画
   ============================================================ */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

/* ============================================================
   PaperUpload 组件覆盖
   ============================================================ */
:deep(.paper-upload-container) {
  padding: 0 !important;
  max-width: none !important;
}

:deep(.upload-area) {
  background-color: #f8faff !important;
  border-color: rgba(99, 102, 241, 0.25) !important;
}

:deep(.format-standard-section),
:deep(.paper-requirements),
:deep(.standard-config-box) {
  background-color: #f8faff !important;
  border-color: #e2e8f0 !important;
}
</style>

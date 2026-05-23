<template>
  <div class="demo-root">

    <!-- ===== 顶部进度导航 ===== -->
    <header class="demo-header">
      <div class="header-inner">
        <button class="back-home" @click="$router.push('/')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          返回首页
        </button>

        <div class="step-nav">
          <div
            v-for="(s, i) in steps"
            :key="i"
            class="step-item"
            :class="{ active: currentStep === i, done: currentStep > i }"
            @click="jumpTo(i)"
          >
            <div class="step-circle">
              <svg v-if="currentStep > i" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="step-label">{{ s.title }}</span>
            <div v-if="i < steps.length - 1" class="step-line" :class="{ filled: currentStep > i }"></div>
          </div>
        </div>

        <div class="header-right">
          <span class="demo-badge">演示模式</span>
        </div>
      </div>
    </header>

    <!-- ===== 步骤面板 ===== -->
    <main class="demo-main">
      <transition :name="transDir" mode="out-in">

        <!-- ─────────────── STEP 0: 上传论文 ─────────────── -->
        <div v-if="currentStep === 0" key="s0" class="step-panel">
          <div class="panel-hero">
            <div class="hero-icon upload-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <h2>第一步：上传论文</h2>
            <p>支持 <strong>.docx</strong> 格式，系统将自动解析文档结构与排版信息。</p>
          </div>

          <!-- 拖拽区 -->
          <div
            class="upload-zone"
            :class="{ dragover: dragging, uploaded: uploadDone }"
            @dragover.prevent="dragging = true"
            @dragleave="dragging = false"
            @drop.prevent="handleDrop"
            @click="triggerFilePick"
          >
            <input ref="fileInput" type="file" accept=".docx" style="display:none" @change="handleFilePick" />

            <transition name="fade" mode="out-in">
              <!-- 已上传状态 -->
              <div v-if="uploadDone" key="done" class="upload-done-content">
                <div class="file-icon-wrap success">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p class="file-name">{{ uploadedFileName }}</p>
                <p class="file-meta">文件解析完成 · 准备好检查</p>
                <button class="re-pick" @click.stop="resetUpload">重新选择</button>
              </div>

              <!-- 上传中 -->
              <div v-else-if="uploading" key="loading" class="upload-loading-content">
                <div class="spinner"></div>
                <p>正在解析文档结构…</p>
                <div class="fake-progress-bar">
                  <div class="fake-progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                </div>
                <p class="progress-text">{{ uploadProgress }}%</p>
              </div>

              <!-- 默认提示 -->
              <div v-else key="idle" class="upload-idle-content">
                <div class="upload-icon-sm">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <p class="drop-hint">拖拽文件到此处，或 <span class="pick-link">点击选择</span></p>
                <p class="drop-sub">支持 .docx 文件，最大 50 MB</p>
                <button class="btn-demo-upload" @click.stop="useDemoFile">使用演示文件</button>
              </div>
            </transition>
          </div>

          <!-- 示例文件信息 -->
          <div class="demo-tip-card">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            演示模式下，系统使用内置的"西南大学·硕士论文样本"进行格式分析，<strong>无需真实文件</strong>。
          </div>

          <div class="step-actions">
            <button class="btn-next" :disabled="!uploadDone" @click="goNext">
              开始格式检查
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <!-- ─────────────── STEP 1: 格式检查结果 ─────────────── -->
        <div v-else-if="currentStep === 1" key="s1" class="step-panel">
          <div class="panel-hero">
            <div class="hero-icon check-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>
            </div>
            <h2>第二步：格式检查结果</h2>
            <p>系统对照 <strong>西南大学硕士论文规范</strong> 完成检测，共发现以下问题：</p>
          </div>

          <!-- 总览卡片 -->
          <div class="score-band">
            <div class="score-ring">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="10"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="url(#sg)" stroke-width="10"
                  stroke-dasharray="251.2" :stroke-dashoffset="251.2 * (1 - scoreRatio)"
                  stroke-linecap="round" transform="rotate(-90 50 50)"/>
                <defs>
                  <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#6366f1"/>
                    <stop offset="100%" stop-color="#8b5cf6"/>
                  </linearGradient>
                </defs>
              </svg>
              <span class="score-num">{{ displayScore }}</span>
            </div>
            <div class="score-detail">
              <h3>综合格式评分</h3>
              <p>系统共检测 <strong>{{ issues.length }}</strong> 类问题，建议修正后再提交。</p>
              <div class="stat-pills">
                <span class="pill error">严重 {{ countBySeverity('error') }}</span>
                <span class="pill warning">警告 {{ countBySeverity('warning') }}</span>
                <span class="pill info">提示 {{ countBySeverity('info') }}</span>
              </div>
            </div>
          </div>

          <!-- 问题列表 -->
          <div class="issue-list">
            <div
              v-for="(issue, i) in issues"
              :key="i"
              class="issue-row"
              :class="['severity-' + issue.severity, { expanded: expandedIssue === i }]"
              @click="expandedIssue = expandedIssue === i ? -1 : i"
            >
              <div class="issue-head">
                <span class="sev-dot" :class="issue.severity"></span>
                <span class="issue-title">{{ issue.title }}</span>
                <span class="issue-location">{{ issue.location }}</span>
                <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div class="issue-body" v-show="expandedIssue === i">
                <p class="issue-desc">{{ issue.desc }}</p>
                <div class="issue-compare">
                  <div class="cmp-col current">
                    <span class="cmp-label">当前格式</span>
                    <code>{{ issue.current }}</code>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                  <div class="cmp-col expected">
                    <span class="cmp-label">规范要求</span>
                    <code>{{ issue.expected }}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn-prev" @click="goPrev">上一步</button>
            <button class="btn-next" @click="goNext">
              智能修正所有问题
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <!-- ─────────────── STEP 2: 修正完成 & 导出 ─────────────── -->
        <div v-else-if="currentStep === 2" key="s2" class="step-panel">
          <div class="panel-hero">
            <div class="hero-icon export-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <h2>第三步：修正完成，导出结果</h2>
            <p>已自动修正 <strong>{{ issues.length }}</strong> 处格式问题，论文已符合规范标准。</p>
          </div>

          <!-- 修正成就 -->
          <div class="fix-summary">
            <div v-if="!fixAnimDone" class="fix-running">
              <div class="spinner large"></div>
              <p>正在应用修正方案…</p>
            </div>
            <div v-else class="fix-result-grid">
              <div v-for="(item, i) in fixItems" :key="i" class="fix-result-card" :style="{ '--delay': i * 0.08 + 's' }">
                <div class="fix-card-icon" :style="{ background: item.color }">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <p class="fix-card-title">{{ item.title }}</p>
                  <p class="fix-card-sub">{{ item.sub }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 下载区域 -->
          <div v-if="fixAnimDone" class="download-section">
            <h3 class="dl-title">选择导出格式</h3>
            <div class="dl-cards">
              <div
                v-for="fmt in exportFormats"
                :key="fmt.ext"
                class="dl-card"
                :class="{ selected: selectedFormat === fmt.ext }"
                @click="selectedFormat = fmt.ext"
              >
                <div class="dl-icon" :style="{ background: fmt.color }">{{ fmt.icon }}</div>
                <span class="dl-ext">{{ fmt.label }}</span>
                <span class="dl-desc">{{ fmt.desc }}</span>
                <div class="dl-check" v-if="selectedFormat === fmt.ext">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
            </div>

            <button class="btn-download" @click="triggerDownload">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              下载修正版论文（{{ selectedFormat.toUpperCase() }}）
            </button>

            <div class="also-export">
              <span>同时导出：</span>
              <button class="also-btn" @click="showToast('检查报告已生成')">格式检查报告 .txt</button>
              <button class="also-btn" @click="showToast('HTML报告已生成')">可视化报告 .html</button>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn-prev" @click="goPrev">上一步</button>
            <button class="btn-finish" @click="$router.push('/upload')">
              立即上传我的论文
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

      </transition>
    </main>

    <!-- Toast 提示 -->
    <transition name="toast-anim">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ========== 步骤控制 ==========
const steps = [
  { title: '上传论文' },
  { title: '格式检查' },
  { title: '修正导出' }
]
const currentStep = ref(0)
const transDir = ref('slide-left')

const jumpTo = (i) => {
  if (i > currentStep.value && i === 1 && !uploadDone.value) return
  transDir.value = i > currentStep.value ? 'slide-left' : 'slide-right'
  currentStep.value = i
}
const goNext = () => jumpTo(currentStep.value + 1)
const goPrev = () => jumpTo(currentStep.value - 1)

// ========== Step 0: 上传 ==========
const fileInput = ref(null)
const dragging = ref(false)
const uploading = ref(false)
const uploadDone = ref(false)
const uploadProgress = ref(0)
const uploadedFileName = ref('')

const triggerFilePick = () => {
  if (uploadDone.value) return
  fileInput.value?.click()
}

const handleFilePick = (e) => {
  const file = e.target.files[0]
  if (file) startFakeUpload(file.name)
}

const handleDrop = (e) => {
  dragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) startFakeUpload(file.name)
}

const useDemoFile = () => startFakeUpload('西南大学_硕士学位论文_样本.docx')

const startFakeUpload = (name) => {
  uploading.value = true
  uploadProgress.value = 0
  uploadedFileName.value = name
  const timer = setInterval(() => {
    uploadProgress.value += Math.floor(Math.random() * 18) + 6
    if (uploadProgress.value >= 100) {
      uploadProgress.value = 100
      clearInterval(timer)
      setTimeout(() => {
        uploading.value = false
        uploadDone.value = true
      }, 400)
    }
  }, 180)
}

const resetUpload = () => {
  uploadDone.value = false
  uploadedFileName.value = ''
  uploadProgress.value = 0
}

// ========== Step 1: 检查结果 ==========
const expandedIssue = ref(-1)

const issues = ref([
  {
    severity: 'error',
    title: '正文字体不符合规范',
    location: '第 3 页 – 第 5 页',
    desc: '正文段落字体应为宋体（中文）、Times New Roman（英文），当前使用了微软雅黑。',
    current: '字体：微软雅黑，字号：11pt',
    expected: '字体：宋体 / Times New Roman，字号：12pt（小四）'
  },
  {
    severity: 'error',
    title: '一级标题格式错误',
    location: '第 2、7、12 页',
    desc: '一级标题应为黑体三号（16pt），居中对齐，段前 24pt，段后 18pt。',
    current: '黑体 14pt，左对齐，段前 12pt',
    expected: '黑体 16pt，居中，段前 24pt，段后 18pt'
  },
  {
    severity: 'warning',
    title: '页边距不符合要求',
    location: '全文',
    desc: '上边距应为 30mm，下边距 25mm，左边距 30mm，右边距 25mm。',
    current: '上 25mm / 下 25mm / 左 25mm / 右 25mm',
    expected: '上 30mm / 下 25mm / 左 30mm / 右 25mm'
  },
  {
    severity: 'warning',
    title: '图题位置错误',
    location: '图 2.3、图 3.1、图 4.5',
    desc: '图题应置于图下方，居中，五号宋体；检测到图题位于图上方。',
    current: '图题在图上方',
    expected: '图题在图下方，居中，五号宋体'
  },
  {
    severity: 'warning',
    title: '参考文献格式不规范',
    location: '参考文献（第 45 页）',
    desc: '期刊类文献缺少 DOI 字段；外文文献比例不足 20%（当前 8%）。',
    current: '外文文献 8%，无 DOI',
    expected: '外文文献 ≥ 20%，含 DOI'
  },
  {
    severity: 'info',
    title: '目录最大层级超过三级',
    location: '目录页',
    desc: '目录仅展示至三级标题（1.1.1），当前文档目录包含四级标题（1.1.1.1）。',
    current: '目录展示至四级标题',
    expected: '目录仅展示至三级标题'
  },
  {
    severity: 'info',
    title: '页眉包含非页码内容',
    location: '正文部分页眉',
    desc: '正文页眉应仅含页码，检测到部分页眉含有章节标题文字。',
    current: '页眉：章节标题 + 页码',
    expected: '页眉：仅页码'
  }
])

const countBySeverity = (s) => issues.value.filter(i => i.severity === s).length

const targetScore = 62
const displayScore = ref(0)
const scoreRatio = computed(() => displayScore.value / 100)

// ========== Step 2: 修正导出 ==========
const fixAnimDone = ref(false)
const selectedFormat = ref('docx')

const fixItems = [
  { title: '字体规范化', sub: '正文、标题字体全部统一', color: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { title: '段落间距修正', sub: '标题/正文段前段后一键对齐', color: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  { title: '页边距调整', sub: '四边距精确还原规范值', color: 'linear-gradient(135deg,#10b981,#059669)' },
  { title: '图题位置修正', sub: '3 处图题移至图下方', color: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  { title: '目录层级清理', sub: '四级目录条目已隐藏', color: 'linear-gradient(135deg,#ec4899,#f43f5e)' },
  { title: '页眉页脚规范', sub: '移除非页码内容', color: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }
]

const exportFormats = [
  { ext: 'docx', label: 'Word', icon: 'W', color: '#2563eb', desc: '可继续编辑' },
  { ext: 'pdf',  label: 'PDF',  icon: 'P', color: '#dc2626', desc: '最终提交版' },
  { ext: 'txt',  label: '报告', icon: '📄', color: '#16a34a', desc: '格式检查报告' }
]

// ========== Toast ==========
const toastMsg = ref('')
let toastTimer = null
const showToast = (msg) => {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2500)
}

const triggerDownload = () => showToast(`演示模式：已模拟下载 修正版论文.${selectedFormat.value}`)

// ========== 进入步骤时动画 ==========
watch(currentStep, (val) => {
  if (val === 1) {
    displayScore.value = 0
    const t = setInterval(() => {
      displayScore.value = Math.min(displayScore.value + 2, targetScore)
      if (displayScore.value >= targetScore) clearInterval(t)
    }, 20)
  }
  if (val === 2) {
    fixAnimDone.value = false
    setTimeout(() => { fixAnimDone.value = true }, 1800)
  }
})
</script>

<style scoped>
/* ============================================================
   DEMO ROOT
   ============================================================ */
.demo-root {
  min-height: 100vh;
  background: linear-gradient(160deg, #f0f4ff 0%, #fafbff 50%, #f5f3ff 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
  color: #1e293b;
}

/* ============================================================
   HEADER
   ============================================================ */
.demo-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid #e8ecf2;
}

.header-inner {
  max-width: 960px;
  margin: 0 auto;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: 24px;
}

.back-home {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #64748b;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
  transition: color 0.2s;
}
.back-home:hover { color: #6366f1; }

/* 步骤导航 */
.step-nav {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  justify-content: center;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;
}

.step-item.active .step-circle {
  background: linear-gradient(135deg,#6366f1,#8b5cf6);
  color: white;
  box-shadow: 0 4px 12px rgba(99,102,241,0.4);
}

.step-item.done .step-circle {
  background: linear-gradient(135deg,#10b981,#059669);
  color: white;
}

.step-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #94a3b8;
  transition: color 0.3s;
  white-space: nowrap;
}

.step-item.active .step-label,
.step-item.done .step-label {
  color: #1e293b;
}

.step-line {
  width: 48px;
  height: 2px;
  background: #e2e8f0;
  margin: 0 8px;
  border-radius: 1px;
  transition: background 0.4s;
}
.step-line.filled { background: linear-gradient(90deg,#6366f1,#8b5cf6); }

.header-right { white-space: nowrap; }

.demo-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #7c3aed;
  background: #ede9fe;
  border-radius: 20px;
  padding: 4px 12px;
  letter-spacing: 0.04em;
}

/* ============================================================
   MAIN
   ============================================================ */
.demo-main {
  max-width: 720px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

/* ============================================================
   STEP PANEL
   ============================================================ */
.step-panel {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Hero */
.panel-hero {
  text-align: center;
  padding: 0 16px;
}

.hero-icon {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
}

.upload-icon { background: linear-gradient(135deg,#6366f1,#8b5cf6); }
.check-icon  { background: linear-gradient(135deg,#3b82f6,#06b6d4); }
.export-icon { background: linear-gradient(135deg,#10b981,#059669); }

.panel-hero h2 {
  font-size: 1.7rem;
  font-weight: 800;
  margin: 0 0 10px;
  letter-spacing: -0.02em;
}

.panel-hero p {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

/* ============================================================
   UPLOAD ZONE
   ============================================================ */
.upload-zone {
  border: 2px dashed #c7d2fe;
  border-radius: 20px;
  background: #fafbff;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
}

.upload-zone:hover,
.upload-zone.dragover {
  border-color: #6366f1;
  background: #f0f4ff;
  box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
}

.upload-zone.uploaded {
  border-color: #86efac;
  background: #f0fdf4;
  cursor: default;
}

.upload-idle-content,
.upload-done-content,
.upload-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px;
  text-align: center;
}

.drop-hint {
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
  margin: 0;
}
.pick-link { color: #6366f1; text-decoration: underline; text-underline-offset: 2px; }
.drop-sub { font-size: 0.82rem; color: #94a3b8; margin: 0; }

.btn-demo-upload {
  margin-top: 6px;
  padding: 8px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg,#6366f1,#8b5cf6);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-demo-upload:hover { opacity: 0.88; }

.file-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.file-icon-wrap.success { background: #dcfce7; }

.file-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #16a34a;
  margin: 0;
}
.file-meta {
  font-size: 0.82rem;
  color: #4ade80;
  margin: 0;
}
.re-pick {
  font-size: 0.8rem;
  color: #64748b;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px 12px;
  cursor: pointer;
  margin-top: 4px;
}
.re-pick:hover { border-color: #94a3b8; color: #475569; }

/* Progress */
.fake-progress-bar {
  width: 200px;
  height: 6px;
  border-radius: 3px;
  background: #e2e8f0;
  overflow: hidden;
}
.fake-progress-fill {
  height: 100%;
  background: linear-gradient(90deg,#6366f1,#8b5cf6);
  border-radius: 3px;
  transition: width 0.15s ease;
}
.progress-text { font-size: 0.8rem; color: #94a3b8; margin: 0; }

/* Spinner */
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.spinner.large { width: 48px; height: 48px; border-width: 4px; }

@keyframes spin { to { transform: rotate(360deg); } }

/* Tip card */
.demo-tip-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f0f4ff;
  border: 1px solid #c7d2fe;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 0.87rem;
  color: #4f46e5;
  line-height: 1.6;
}
.demo-tip-card svg { flex-shrink: 0; margin-top: 2px; }

/* ============================================================
   SCORE BAND
   ============================================================ */
.score-band {
  display: flex;
  align-items: center;
  gap: 28px;
  background: white;
  border: 1px solid #e8ecf2;
  border-radius: 20px;
  padding: 24px 28px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}

.score-ring {
  position: relative;
  flex-shrink: 0;
}
.score-ring svg { display: block; }
.score-num {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  font-size: 1.6rem;
  font-weight: 800;
  color: #6366f1;
  letter-spacing: -0.03em;
}

.score-detail h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 6px; }
.score-detail p  { font-size: 0.9rem; color: #64748b; margin: 0 0 14px; }

.stat-pills { display: flex; gap: 8px; flex-wrap: wrap; }
.pill {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
}
.pill.error   { background: #fff1f2; color: #e11d48; }
.pill.warning { background: #fffbeb; color: #d97706; }
.pill.info    { background: #eff6ff; color: #3b82f6; }

/* ============================================================
   ISSUE LIST
   ============================================================ */
.issue-list { display: flex; flex-direction: column; gap: 10px; }

.issue-row {
  background: white;
  border: 1px solid #e8ecf2;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.issue-row:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.issue-row.expanded { border-color: #c7d2fe; }

.issue-row.severity-error   { border-left: 4px solid #e11d48; }
.issue-row.severity-warning { border-left: 4px solid #f59e0b; }
.issue-row.severity-info    { border-left: 4px solid #3b82f6; }

.issue-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.sev-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sev-dot.error   { background: #e11d48; }
.sev-dot.warning { background: #f59e0b; }
.sev-dot.info    { background: #3b82f6; }

.issue-title {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}
.issue-location {
  font-size: 0.78rem;
  color: #94a3b8;
  white-space: nowrap;
}
.chevron {
  color: #94a3b8;
  transition: transform 0.25s;
  flex-shrink: 0;
}
.issue-row.expanded .chevron { transform: rotate(180deg); }

.issue-body {
  padding: 0 16px 16px 36px;
}
.issue-desc { font-size: 0.88rem; color: #475569; margin: 0 0 14px; line-height: 1.6; }

.issue-compare {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cmp-col {
  flex: 1;
  border-radius: 10px;
  padding: 10px 14px;
}
.cmp-col.current  { background: #fff1f2; }
.cmp-col.expected { background: #f0fdf4; }

.cmp-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.cmp-col.current .cmp-label  { color: #e11d48; }
.cmp-col.expected .cmp-label { color: #16a34a; }

.cmp-col code {
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 0.82rem;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ============================================================
   FIX SUMMARY
   ============================================================ */
.fix-summary {
  background: white;
  border: 1px solid #e8ecf2;
  border-radius: 20px;
  padding: 28px;
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fix-running {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  color: #64748b;
}

.fix-result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  width: 100%;
}

.fix-result-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fafbff;
  border: 1px solid #e8ecf2;
  border-radius: 12px;
  padding: 12px 14px;
  animation: popIn 0.4s ease both;
  animation-delay: var(--delay, 0s);
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.88) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.fix-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fix-card-title { font-size: 0.88rem; font-weight: 700; color: #1e293b; margin: 0 0 2px; }
.fix-card-sub   { font-size: 0.77rem; color: #64748b; margin: 0; }

/* ============================================================
   DOWNLOAD
   ============================================================ */
.download-section { display: flex; flex-direction: column; gap: 16px; }

.dl-title { font-size: 1rem; font-weight: 700; margin: 0; }

.dl-cards {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.dl-card {
  flex: 1;
  min-width: 120px;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.dl-card:hover { border-color: #c7d2fe; background: #f8faff; }
.dl-card.selected { border-color: #6366f1; background: #f0f4ff; }

.dl-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 1rem;
}

.dl-ext  { font-size: 0.9rem; font-weight: 700; color: #1e293b; }
.dl-desc { font-size: 0.76rem; color: #94a3b8; }

.dl-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-download {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg,#6366f1,#8b5cf6);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(99,102,241,0.35);
  transition: opacity 0.2s, transform 0.2s;
}
.btn-download:hover { opacity: 0.9; transform: translateY(-1px); }

.also-export {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: #64748b;
}
.also-btn {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 0.82rem;
  color: #475569;
  cursor: pointer;
  transition: border-color 0.2s;
}
.also-btn:hover { border-color: #6366f1; color: #6366f1; }

/* ============================================================
   ACTIONS
   ============================================================ */
.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.btn-next, .btn-finish {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 28px;
  border-radius: 12px;
  background: linear-gradient(135deg,#6366f1,#8b5cf6);
  color: white;
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(99,102,241,0.3);
  transition: opacity 0.2s, transform 0.2s;
}
.btn-next:hover:not(:disabled), .btn-finish:hover { opacity: 0.88; transform: translateY(-1px); }
.btn-next:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

.btn-prev {
  padding: 13px 24px;
  border-radius: 12px;
  background: white;
  border: 1.5px solid #e2e8f0;
  color: #475569;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-prev:hover { border-color: #94a3b8; color: #1e293b; }

/* ============================================================
   TOAST
   ============================================================ */
.toast {
  position: fixed;
  bottom: 36px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  z-index: 9999;
  white-space: nowrap;
}

/* ============================================================
   PAGE TRANSITIONS
   ============================================================ */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from  { opacity: 0; transform: translateX(48px); }
.slide-left-leave-to    { opacity: 0; transform: translateX(-48px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-48px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(48px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

.toast-anim-enter-active, .toast-anim-leave-active { transition: all 0.3s ease; }
.toast-anim-enter-from, .toast-anim-leave-to       { opacity: 0; transform: translateX(-50%) translateY(16px); }
</style>

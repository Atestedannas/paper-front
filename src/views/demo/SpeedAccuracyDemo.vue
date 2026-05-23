<template>
  <div class="demo-page">
    <div class="demo-header">
      <el-button text class="back-btn" @click="router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h1 class="demo-title">极速与准确</h1>
      <p class="demo-subtitle">模拟格式检查全流程 · 秒级响应 · 零遗漏校验</p>
    </div>

    <div class="demo-body">
      <!-- 左侧：论文预览 -->
      <div class="paper-panel">
        <div class="panel-label">论文文档预览</div>
        <div class="paper-mock">
          <div
            v-for="(line, i) in paperLines"
            :key="i"
            class="paper-line"
            :class="{ highlight: line.issue, scanning: scanning && scanIndex === i }"
          >
            <span class="line-text" :style="line.style">{{ line.text }}</span>
            <transition name="fade-issue">
              <span v-if="line.issue && showIssues" class="issue-badge" :class="line.issue.level">
                {{ line.issue.label }}
              </span>
            </transition>
          </div>
        </div>
      </div>

      <!-- 右侧：检查结果 -->
      <div class="result-panel">
        <!-- 进度 -->
        <div class="scan-box">
          <div class="scan-header">
            <span class="scan-title">{{ scanning ? '正在检查...' : (done ? '检查完成' : '准备就绪') }}</span>
            <span class="scan-pct" v-if="scanning || done">{{ progress }}%</span>
          </div>
          <el-progress :percentage="progress" :status="done ? 'success' : ''" :stroke-width="8" />
          <div class="scan-steps" v-if="scanning || done">
            <div v-for="(step, i) in steps" :key="i" class="scan-step" :class="{ done: step.done, active: step.active }">
              <el-icon class="step-icon">
                <CircleCheckFilled v-if="step.done" />
                <Loading v-else-if="step.active" class="spin" />
                <MoreFilled v-else />
              </el-icon>
              <span>{{ step.label }}</span>
            </div>
          </div>
        </div>

        <!-- 问题列表 -->
        <transition name="slide-up">
          <div class="issues-box" v-if="done">
            <div class="issues-header">
              <span class="issues-title">发现 {{ allIssues.length }} 个格式问题</span>
              <div class="issue-counts">
                <span class="badge error">错误 {{ issueCount('error') }}</span>
                <span class="badge warning">警告 {{ issueCount('warning') }}</span>
                <span class="badge info">提示 {{ issueCount('info') }}</span>
              </div>
            </div>
            <div class="issue-list">
              <div v-for="(iss, i) in allIssues" :key="i" class="issue-item" :class="iss.level">
                <el-icon class="iss-icon">
                  <WarningFilled v-if="iss.level === 'error'" />
                  <Warning v-else-if="iss.level === 'warning'" />
                  <InfoFilled v-else />
                </el-icon>
                <div class="iss-body">
                  <span class="iss-title">{{ iss.title }}</span>
                  <span class="iss-desc">{{ iss.desc }}</span>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- 操作按钮 -->
        <div class="action-row">
          <el-button class="demo-action-btn primary" size="large" @click="startScan" :loading="scanning">
            {{ done ? '重新检查' : '开始检查' }}
          </el-button>
          <el-button class="demo-action-btn" size="large" @click="router.push('/upload')">上传论文</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, CircleCheckFilled, MoreFilled, Loading, WarningFilled, Warning, InfoFilled } from '@element-plus/icons-vue'

const router = useRouter()
const scanning = ref(false)
const done = ref(false)
const progress = ref(0)
const showIssues = ref(false)
const scanIndex = ref(-1)

const steps = reactive([
  { label: '解析文档结构', done: false, active: false },
  { label: '检查页边距 / 纸张', done: false, active: false },
  { label: '标题层级与字号', done: false, active: false },
  { label: '正文行间距', done: false, active: false },
  { label: '参考文献格式', done: false, active: false },
])

const paperLines = [
  { text: '基于深度学习的图像分类研究', style: { fontSize: '15px', fontWeight: 700 }, issue: null },
  { text: '摘 要', style: { fontSize: '14px', fontWeight: 600, textAlign: 'center' }, issue: null },
  { text: '本文提出了一种改进的卷积神经网络架构，用于解决', style: {}, issue: null },
  { text: '大规模图像分类任务中的精度与效率平衡问题。', style: {}, issue: null },
  { text: '关键词：深度学习；图像分类；卷积神经网络；迁移学习', style: { fontSize: '12px' }, issue: null },
  { text: '1. 引言', style: { fontSize: '16px', fontWeight: 700 }, issue: { level: 'error', label: '字号偏大' } },
  { text: '近年来，深度学习技术在计算机视觉领域取得了', style: { lineHeight: '1.3' }, issue: { level: 'warning', label: '行距不足' } },
  { text: '突破性进展。本研究基于 ResNet-50 骨干网络...',  style: {}, issue: null },
  { text: '   图1 网络结构示意图', style: { textAlign: 'center', color: '#888' }, issue: { level: 'info', label: '图注格式' } },
  { text: '2. 相关工作', style: { fontSize: '16px', fontWeight: 700 }, issue: { level: 'error', label: '字号偏大' } },
  { text: '[1] LeCun Y, Bottou L. Gradient-based learning',   style: { fontSize: '11px' }, issue: { level: 'warning', label: '字号偏小' } },
  { text: '[2] He K, Zhang X. Deep residual learning...', style: { fontSize: '11px' }, issue: null },
]

const allIssues = [
  { level: 'error',   title: '标题字号不符',    desc: '第1、2级标题应为14pt，当前为16pt' },
  { level: 'error',   title: '页边距超出范围',   desc: '左边距3.5cm，规范要求≤3.0cm' },
  { level: 'warning', title: '正文行间距偏小',   desc: '第7行行距1.3，规范要求1.5倍' },
  { level: 'warning', title: '参考文献字号',     desc: '参考文献正文应为10.5pt，当前为11pt' },
  { level: 'info',    title: '图注格式建议',     desc: '图注建议居中且使用"图x"格式' },
]

const issueCount = (level) => allIssues.filter(i => i.level === level).length

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const startScan = async () => {
  if (scanning.value) return
  scanning.value = true
  done.value = false
  showIssues.value = false
  progress.value = 0
  scanIndex.value = -1
  steps.forEach(s => { s.done = false; s.active = false })

  for (let i = 0; i < steps.length; i++) {
    steps[i].active = true
    const target = Math.round((i + 1) / steps.length * 90)
    while (progress.value < target) {
      progress.value = Math.min(progress.value + 3, target)
      await sleep(30)
    }
    // scan lines
    for (let l = 0; l < paperLines.length; l++) {
      scanIndex.value = l
      await sleep(40)
    }
    scanIndex.value = -1
    steps[i].done = true
    steps[i].active = false
    await sleep(100)
  }
  while (progress.value < 100) { progress.value++; await sleep(15) }
  scanning.value = false
  done.value = true
  showIssues.value = true
}
</script>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #F5F7FA, #FFFFFF);
  padding: 40px 20px 80px;
}
.demo-header { max-width: 1100px; margin: 0 auto 36px; text-align: center; }
.back-btn { position: absolute; left: 24px; top: 24px; font-size: 14px; color: #6B7280; }
.demo-title { font-size: 40px; font-weight: 700; color: #111827; margin: 0 0 10px; letter-spacing: -0.02em; }
.demo-subtitle { font-size: 16px; color: #6B7280; margin: 0; }

.demo-body { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

/* Paper panel */
.paper-panel { background: #fff; border: 1px solid #E5E7EB; border-radius: 20px; padding: 24px; }
.panel-label { font-size: 12px; font-weight: 600; color: #9CA3AF; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 16px; }
.paper-mock { display: flex; flex-direction: column; gap: 8px; }
.paper-line { position: relative; padding: 6px 10px; border-radius: 8px; transition: background .2s; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.paper-line.scanning { background: #EFF6FF; }
.paper-line.highlight { background: #FEF9EC; }
.line-text { font-size: 13px; color: #374151; flex: 1; line-height: 1.6; }
.issue-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
.issue-badge.error   { background: #FEE2E2; color: #DC2626; }
.issue-badge.warning { background: #FEF3C7; color: #D97706; }
.issue-badge.info    { background: #E0E7FF; color: #4F46E5; }

/* Result panel */
.result-panel { display: flex; flex-direction: column; gap: 20px; }
.scan-box { background: #fff; border: 1px solid #E5E7EB; border-radius: 20px; padding: 24px; }
.scan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.scan-title { font-size: 15px; font-weight: 600; color: #111827; }
.scan-pct { font-size: 14px; font-weight: 700; color: #3B82F6; }
.scan-steps { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.scan-step { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #9CA3AF; transition: color .3s; }
.scan-step.done   { color: #10B981; }
.scan-step.active { color: #3B82F6; font-weight: 600; }
.step-icon { font-size: 16px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Issues */
.issues-box { background: #fff; border: 1px solid #E5E7EB; border-radius: 20px; padding: 24px; }
.issues-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.issues-title { font-size: 15px; font-weight: 600; color: #111827; }
.issue-counts { display: flex; gap: 6px; }
.badge { font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 999px; }
.badge.error   { background: #FEE2E2; color: #DC2626; }
.badge.warning { background: #FEF3C7; color: #D97706; }
.badge.info    { background: #E0E7FF; color: #4F46E5; }
.issue-list { display: flex; flex-direction: column; gap: 10px; }
.issue-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border-radius: 10px; }
.issue-item.error   { background: #FEF2F2; }
.issue-item.warning { background: #FFFBEB; }
.issue-item.info    { background: #EFF6FF; }
.iss-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
.issue-item.error   .iss-icon { color: #DC2626; }
.issue-item.warning .iss-icon { color: #D97706; }
.issue-item.info    .iss-icon { color: #4F46E5; }
.iss-body { display: flex; flex-direction: column; gap: 2px; }
.iss-title { font-size: 14px; font-weight: 600; color: #111827; }
.iss-desc  { font-size: 12px; color: #6B7280; }

.action-row { display: flex; gap: 12px; }
.demo-action-btn { border-radius: 999px; flex: 1; }
.demo-action-btn.primary { background: #111827; color: #fff; border: none; }

/* Transitions */
.fade-issue-enter-active { transition: opacity .4s, transform .4s; }
.fade-issue-enter-from   { opacity: 0; transform: translateX(8px); }
.slide-up-enter-active   { transition: opacity .5s, transform .5s; }
.slide-up-enter-from     { opacity: 0; transform: translateY(16px); }

@media (max-width: 768px) {
  .demo-body { grid-template-columns: 1fr; }
  .demo-title { font-size: 28px; }
}
</style>

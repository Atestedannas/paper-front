<template>
  <div class="demo-page">
    <div class="demo-header">
      <el-button text class="back-btn" @click="router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h1 class="demo-title">整洁的导出</h1>
      <p class="demo-subtitle">一键导出修正版 DOCX · PDF 报告 · 格式对比记录</p>
    </div>

    <div class="demo-body">
      <!-- 顶部统计卡片 -->
      <div class="stats-row">
        <div class="stat-card stat-green">
          <div class="stat-num">23</div>
          <div class="stat-lbl">已修正问题</div>
        </div>
        <div class="stat-card stat-blue">
          <div class="stat-num">2</div>
          <div class="stat-lbl">需人工确认</div>
        </div>
        <div class="stat-card stat-purple">
          <div class="stat-num">98.7%</div>
          <div class="stat-lbl">格式合规率</div>
        </div>
        <div class="stat-card stat-amber">
          <div class="stat-num">4</div>
          <div class="stat-lbl">可导出格式</div>
        </div>
      </div>

      <!-- 主体内容 -->
      <div class="main-row">
        <!-- 左侧：导出选项 -->
        <div class="export-col">
          <div class="card">
            <div class="card-title"><el-icon><Download /></el-icon> 导出选项</div>
            <div class="export-options">
              <div
                v-for="opt in exportOptions"
                :key="opt.id"
                class="export-opt"
                :class="{ selected: selectedExport === opt.id }"
                @click="selectedExport = opt.id"
              >
                <div class="opt-icon" :class="opt.color">
                  <el-icon size="22"><component :is="opt.icon" /></el-icon>
                </div>
                <div class="opt-info">
                  <div class="opt-name">{{ opt.name }}</div>
                  <div class="opt-desc">{{ opt.desc }}</div>
                </div>
                <el-icon v-if="selectedExport === opt.id" color="#111827"><CircleCheckFilled /></el-icon>
              </div>
            </div>

            <!-- 导出配置 -->
            <div class="export-cfg">
              <div class="cfg-row">
                <label>文件名</label>
                <el-input v-model="fileName" size="small" style="flex:1" />
              </div>
              <div class="cfg-row">
                <label>包含封面</label>
                <el-switch v-model="includeCover" />
              </div>
              <div class="cfg-row">
                <label>附修正说明</label>
                <el-switch v-model="includeReport" />
              </div>
            </div>

            <el-button class="export-btn primary" size="large" @click="handleExport" :loading="exporting">
              <el-icon><Download /></el-icon>
              {{ exporting ? '正在生成...' : '立即导出' }}
            </el-button>
          </div>

          <!-- 历史记录 -->
          <div class="card">
            <div class="card-title"><el-icon><Clock /></el-icon> 导出历史</div>
            <div class="history-list">
              <div v-for="h in historyList" :key="h.id" class="history-item">
                <div class="hist-icon" :class="h.color">
                  <el-icon size="14"><Document /></el-icon>
                </div>
                <div class="hist-info">
                  <div class="hist-name">{{ h.name }}</div>
                  <div class="hist-time">{{ h.time }}</div>
                </div>
                <el-button text size="small" class="hist-dl">
                  <el-icon><Download /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：文档预览 + 修正说明 -->
        <div class="preview-col">
          <div class="card preview-card">
            <div class="card-title">
              <el-icon><Files /></el-icon> 修正版预览
              <el-tag type="success" size="small" style="margin-left:auto">已就绪</el-tag>
            </div>
            <div class="doc-preview">
              <div class="doc-page">
                <div class="doc-title">基于深度学习的图像分类研究</div>
                <div class="doc-meta">北京理工大学 · 计算机科学与技术学院</div>
                <div class="doc-divider"></div>
                <div class="doc-section">摘 要</div>
                <div class="doc-body">
                  本文提出了一种改进的卷积神经网络架构，用于解决大规模图像分类任务中的精度与效率平衡问题。实验结果表明，本方法在 ImageNet 数据集上达到了 Top-1 准确率 79.2%，相比基线方法提升了 3.1%。
                </div>
                <div class="doc-section">1. 引言</div>
                <div class="doc-body">
                  近年来，深度学习技术在计算机视觉领域取得了突破性进展。本研究基于 ResNet-50 骨干网络，提出了多尺度特征融合模块（MSFM）...
                </div>
                <!-- 修正标注 -->
                <div class="correction-tags">
                  <div class="ctag ctag-green">
                    <el-icon><CircleCheckFilled /></el-icon>
                    标题字号：已修正 16pt → 14pt
                  </div>
                  <div class="ctag ctag-green">
                    <el-icon><CircleCheckFilled /></el-icon>
                    行间距：已修正 1.3 → 1.5 倍
                  </div>
                  <div class="ctag ctag-amber">
                    <el-icon><Warning /></el-icon>
                    第3章图注格式：需人工确认
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 修正摘要 -->
          <div class="card summary-card">
            <div class="card-title"><el-icon><DataAnalysis /></el-icon> 修正摘要</div>
            <div class="summary-grid">
              <div v-for="item in summaryItems" :key="item.label" class="summary-item" :class="item.cls">
                <div class="sum-val">{{ item.val }}</div>
                <div class="sum-lbl">{{ item.label }}</div>
              </div>
            </div>
            <div class="progress-list">
              <div v-for="cat in categories" :key="cat.name" class="cat-row">
                <span class="cat-name">{{ cat.name }}</span>
                <el-progress :percentage="cat.pct" :color="cat.color" :stroke-width="6" style="flex:1" />
                <span class="cat-pct">{{ cat.pct }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出成功 Toast -->
    <transition name="toast">
      <div v-if="showToast" class="export-toast">
        <el-icon color="#10B981" size="20"><CircleCheckFilled /></el-icon>
        <span>{{ toastMsg }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Download, Document, Files, Clock,
  DataAnalysis, CircleCheckFilled, Warning
} from '@element-plus/icons-vue'

const router = useRouter()
const selectedExport = ref('docx')
const exporting = ref(false)
const showToast = ref(false)
const toastMsg = ref('')
const fileName = ref('修正版_基于深度学习的图像分类研究')
const includeCover = ref(true)
const includeReport = ref(false)

const exportOptions = [
  { id: 'docx',   name: '修正版 DOCX',    desc: '完整格式已修正的 Word 文档', icon: 'Document', color: 'opt-blue' },
  { id: 'pdf',    name: '格式检查报告 PDF', desc: '包含所有问题与修正详情',      icon: 'Files',    color: 'opt-red' },
  { id: 'html',   name: 'HTML 报告',       desc: '可在浏览器中直接查看',         icon: 'Document', color: 'opt-amber' },
  { id: 'json',   name: '差异数据 JSON',   desc: '供开发者集成或二次处理',       icon: 'DataAnalysis', color: 'opt-purple' },
]

const historyList = [
  { id: 1, name: '修正版_论文_v2.docx',    time: '3 分钟前',  color: 'h-blue' },
  { id: 2, name: '格式报告_论文_v1.pdf',   time: '昨天 14:30', color: 'h-red' },
  { id: 3, name: '修正版_论文_v1.docx',    time: '昨天 10:05', color: 'h-blue' },
  { id: 4, name: '差异数据.json',          time: '2天前',      color: 'h-purple' },
]

const summaryItems = [
  { val: '23', label: '已自动修正', cls: 'sum-green' },
  { val: '2',  label: '待确认',     cls: 'sum-amber' },
  { val: '0',  label: '严重错误',   cls: 'sum-green' },
  { val: '98.7%', label: '合规率',  cls: 'sum-blue' },
]

const categories = [
  { name: '页面排版', pct: 100, color: '#10B981' },
  { name: '标题层级', pct: 100, color: '#10B981' },
  { name: '正文格式', pct: 96,  color: '#3B82F6' },
  { name: '参考文献', pct: 90,  color: '#F59E0B' },
  { name: '图表规范', pct: 85,  color: '#F59E0B' },
]

const handleExport = async () => {
  exporting.value = true
  await new Promise(r => setTimeout(r, 1200))
  exporting.value = false
  const opt = exportOptions.find(o => o.id === selectedExport.value)
  toastMsg.value = `${opt?.name || '文件'} 已生成，开始下载`
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
}
</script>

<style scoped>
.demo-page { min-height: 100vh; background: linear-gradient(to bottom, #F5F7FA, #FFFFFF); padding: 40px 20px 80px; }
.demo-header { max-width: 1100px; margin: 0 auto 32px; text-align: center; }
.back-btn { position: absolute; left: 24px; top: 24px; font-size: 14px; color: #6B7280; }
.demo-title { font-size: 40px; font-weight: 700; color: #111827; margin: 0 0 10px; letter-spacing: -.02em; }
.demo-subtitle { font-size: 16px; color: #6B7280; margin: 0; }

/* Stats row */
.stats-row { max-width: 1100px; margin: 0 auto 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 20px 24px; text-align: center; }
.stat-num { font-size: 32px; font-weight: 700; margin-bottom: 4px; }
.stat-lbl { font-size: 13px; color: #9CA3AF; }
.stat-green  .stat-num { color: #10B981; }
.stat-blue   .stat-num { color: #3B82F6; }
.stat-purple .stat-num { color: #8B5CF6; }
.stat-amber  .stat-num { color: #F59E0B; }

/* Main */
.demo-body { max-width: 1100px; margin: 0 auto; }
.main-row { display: grid; grid-template-columns: 360px 1fr; gap: 24px; }
.card { background: #fff; border: 1px solid #E5E7EB; border-radius: 20px; padding: 20px; margin-bottom: 20px; }
.card-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 16px; }

/* Export options */
.export-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.export-opt { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1.5px solid #E5E7EB; border-radius: 12px; cursor: pointer; transition: all .2s; }
.export-opt:hover { border-color: #D1D5DB; background: #F9FAFB; }
.export-opt.selected { border-color: #111827; background: #F9FAFB; }
.opt-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.opt-blue   { background: #EFF6FF; color: #3B82F6; }
.opt-red    { background: #FEF2F2; color: #EF4444; }
.opt-amber  { background: #FFFBEB; color: #F59E0B; }
.opt-purple { background: #F5F3FF; color: #8B5CF6; }
.opt-name { font-size: 13px; font-weight: 600; color: #111827; }
.opt-desc { font-size: 11px; color: #9CA3AF; margin-top: 1px; }
.opt-info { flex: 1; }

/* Config */
.export-cfg { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; padding: 14px; background: #F9FAFB; border-radius: 10px; }
.cfg-row { display: flex; align-items: center; gap: 10px; }
.cfg-row label { font-size: 13px; color: #374151; flex: 0 0 80px; }
.export-btn { width: 100%; border-radius: 999px; }
.export-btn.primary { background: #111827; color: #fff; border: none; }

/* History */
.history-list { display: flex; flex-direction: column; gap: 8px; }
.history-item { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; }
.history-item:hover { background: #F9FAFB; }
.hist-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.h-blue   { background: #EFF6FF; color: #3B82F6; }
.h-red    { background: #FEF2F2; color: #EF4444; }
.h-purple { background: #F5F3FF; color: #8B5CF6; }
.hist-name { font-size: 12px; font-weight: 500; color: #374151; }
.hist-time { font-size: 11px; color: #9CA3AF; margin-top: 1px; }
.hist-info { flex: 1; }
.hist-dl   { color: #9CA3AF; }

/* Doc preview */
.preview-card { }
.doc-preview { background: #F9FAFB; border-radius: 10px; padding: 12px; overflow: auto; max-height: 320px; }
.doc-page { background: #fff; border: 1px solid #E5E7EB; border-radius: 6px; padding: 24px 28px; min-height: 260px; }
.doc-title { font-size: 16px; font-weight: 700; color: #111827; text-align: center; margin-bottom: 4px; }
.doc-meta { font-size: 12px; color: #9CA3AF; text-align: center; margin-bottom: 12px; }
.doc-divider { height: 1px; background: #E5E7EB; margin: 12px 0; }
.doc-section { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 6px; }
.doc-body { font-size: 12px; color: #374151; line-height: 1.7; margin-bottom: 12px; }
.correction-tags { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.ctag { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 6px 10px; border-radius: 8px; }
.ctag-green { background: #ECFDF5; color: #059669; }
.ctag-amber { background: #FFFBEB; color: #D97706; }

/* Summary */
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.summary-item { background: #F9FAFB; border-radius: 10px; padding: 12px; text-align: center; }
.sum-val { font-size: 22px; font-weight: 700; margin-bottom: 2px; }
.sum-lbl { font-size: 11px; color: #9CA3AF; }
.sum-green .sum-val { color: #10B981; }
.sum-amber .sum-val { color: #F59E0B; }
.sum-blue  .sum-val { color: #3B82F6; }
.progress-list { display: flex; flex-direction: column; gap: 10px; }
.cat-row { display: flex; align-items: center; gap: 10px; }
.cat-name { font-size: 13px; color: #374151; flex: 0 0 70px; }
.cat-pct  { font-size: 12px; color: #9CA3AF; flex: 0 0 36px; text-align: right; }

/* Toast */
.export-toast {
  position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
  background: #fff; border: 1px solid #E5E7EB; border-radius: 12px;
  padding: 12px 24px; display: flex; align-items: center; gap: 10px;
  font-size: 14px; color: #111827; box-shadow: 0 8px 24px rgba(0,0,0,.12);
  z-index: 999;
}
.toast-enter-active, .toast-leave-active { transition: all .35s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }

@media (max-width: 900px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .main-row  { grid-template-columns: 1fr; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .demo-title { font-size: 28px; }
}
</style>

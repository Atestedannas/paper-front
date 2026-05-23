<template>
  <div class="demo-page">
    <div class="demo-header">
      <el-button text class="back-btn" @click="router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h1 class="demo-title">模板与自定义</h1>
      <p class="demo-subtitle">选择院校规范或自由定制格式参数，即时预览效果</p>
    </div>

    <div class="demo-body">
      <!-- 左侧：模板列表 + 参数编辑 -->
      <div class="editor-col">
        <!-- 院校模板选择 -->
        <div class="card">
          <div class="card-title">
            <el-icon><School /></el-icon> 选择院校模板
          </div>
          <div class="tpl-list">
            <div
              v-for="tpl in templates"
              :key="tpl.id"
              class="tpl-item"
              :class="{ active: selectedTpl === tpl.id }"
              @click="selectTemplate(tpl)"
            >
              <div class="tpl-name">{{ tpl.name }}</div>
              <div class="tpl-meta">{{ tpl.type }} · {{ tpl.year }}</div>
            </div>
          </div>
        </div>

        <!-- 参数调整 -->
        <div class="card">
          <div class="card-title">
            <el-icon><Setting /></el-icon> 格式参数
          </div>
          <div class="param-list">
            <div class="param-row" v-for="p in params" :key="p.key">
              <label class="param-label">{{ p.label }}</label>
              <div class="param-ctrl">
                <el-input-number
                  v-if="p.type === 'number'"
                  v-model="form[p.key]"
                  :min="p.min"
                  :max="p.max"
                  :step="p.step"
                  size="small"
                  @change="updatePreview"
                  style="width:110px"
                />
                <el-select
                  v-else-if="p.type === 'select'"
                  v-model="form[p.key]"
                  size="small"
                  @change="updatePreview"
                  style="width:140px"
                >
                  <el-option v-for="o in p.options" :key="o" :label="o" :value="o" />
                </el-select>
                <span class="param-unit" v-if="p.unit">{{ p.unit }}</span>
              </div>
            </div>
          </div>
          <div class="apply-row">
            <el-button class="apply-btn primary" @click="applyAndAnimate" :loading="applying">
              {{ applying ? '应用中...' : '应用配置' }}
            </el-button>
            <el-button class="apply-btn" @click="resetToDefault">恢复默认</el-button>
          </div>
        </div>
      </div>

      <!-- 右侧：实时文档预览 -->
      <div class="preview-col">
        <div class="card preview-card">
          <div class="card-title">
            <el-icon><Document /></el-icon> 实时预览
            <el-tag v-if="applied" type="success" size="small" style="margin-left:auto">已应用</el-tag>
          </div>
          <div class="paper-preview" :style="previewStyle">
            <div class="paper-page" :style="pageStyle">
              <div class="pp-title" :style="{ fontSize: form.titleSize + 'pt', fontFamily: form.font }">
                基于深度学习的图像分类研究
              </div>
              <div class="pp-label" :style="{ fontSize: form.bodySize + 'pt' }">摘 要</div>
              <div class="pp-body" :style="bodyStyle">
                本文提出了一种改进的卷积神经网络架构，用于解决大规模图像分类任务中的精度与效率平衡问题。实验结果表明，本方法在 ImageNet 数据集上达到了 Top-1 准确率 79.2%。
              </div>
              <div class="pp-section" :style="{ fontSize: form.h1Size + 'pt', fontFamily: form.font }">1. 引言</div>
              <div class="pp-body" :style="bodyStyle">
                近年来，深度学习技术在计算机视觉领域取得了突破性进展。本研究基于 ResNet-50 骨干网络，提出了多尺度特征融合模块（MSFM）。
              </div>
              <div class="pp-section" :style="{ fontSize: form.h1Size + 'pt', fontFamily: form.font }">参考文献</div>
              <div class="pp-ref" :style="{ fontSize: form.refSize + 'pt' }">
                [1] LeCun Y, Bottou L, Bengio Y, Haffner P. Gradient-based learning applied to document recognition[J]. Proceedings of the IEEE, 1998.
              </div>
            </div>
          </div>
        </div>

        <!-- 规范对比 -->
        <div class="card compare-card">
          <div class="card-title"><el-icon><DataAnalysis /></el-icon> 规范合规性</div>
          <div class="comply-list">
            <div v-for="c in complianceList" :key="c.item" class="comply-row">
              <span class="comply-item">{{ c.item }}</span>
              <span class="comply-val" :class="c.ok ? 'ok' : 'fail'">{{ c.current }}</span>
              <span class="comply-status">
                <el-icon v-if="c.ok" color="#10B981"><CircleCheckFilled /></el-icon>
                <el-icon v-else color="#EF4444"><CircleCloseFilled /></el-icon>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, School, Setting, Document, DataAnalysis,
  CircleCheckFilled, CircleCloseFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const selectedTpl = ref('bit')
const applied = ref(false)
const applying = ref(false)

const templates = [
  { id: 'bit',   name: '北京理工大学', type: '理工科', year: '2024版' },
  { id: 'thu',   name: '清华大学',     type: '通用',   year: '2024版' },
  { id: 'pku',   name: '北京大学',     type: '通用',   year: '2023版' },
  { id: 'seu',   name: '东南大学',     type: '理工科', year: '2024版' },
  { id: 'custom',name: '自定义模板',   type: '自定义', year: '—'      },
]

const tplDefaults = {
  bit:    { titleSize: 16, h1Size: 14, bodySize: 12, refSize: 10.5, lineSpacing: 1.5, marginTop: 3.0, marginLeft: 3.0, font: '宋体' },
  thu:    { titleSize: 18, h1Size: 15, bodySize: 12, refSize: 10.5, lineSpacing: 1.5, marginTop: 2.5, marginLeft: 2.5, font: '宋体' },
  pku:    { titleSize: 17, h1Size: 14, bodySize: 12, refSize: 10.5, lineSpacing: 1.5, marginTop: 2.8, marginLeft: 2.8, font: '宋体' },
  seu:    { titleSize: 16, h1Size: 14, bodySize: 12, refSize: 10.5, lineSpacing: 1.5, marginTop: 3.0, marginLeft: 3.0, font: '黑体' },
  custom: { titleSize: 16, h1Size: 14, bodySize: 12, refSize: 10.5, lineSpacing: 1.5, marginTop: 2.5, marginLeft: 2.5, font: '宋体' },
}

const form = reactive({ ...tplDefaults.bit })

const params = [
  { key: 'titleSize',    label: '论文标题字号',  type: 'number', min: 12, max: 22, step: 0.5, unit: 'pt' },
  { key: 'h1Size',       label: '一级标题字号',  type: 'number', min: 10, max: 20, step: 0.5, unit: 'pt' },
  { key: 'bodySize',     label: '正文字号',      type: 'number', min: 9,  max: 16, step: 0.5, unit: 'pt' },
  { key: 'refSize',      label: '参考文献字号',  type: 'number', min: 8,  max: 14, step: 0.5, unit: 'pt' },
  { key: 'lineSpacing',  label: '行间距',        type: 'number', min: 1.0, max: 3.0, step: 0.1, unit: '倍' },
  { key: 'marginTop',    label: '上边距',        type: 'number', min: 1.5, max: 4.0, step: 0.1, unit: 'cm' },
  { key: 'marginLeft',   label: '左边距',        type: 'number', min: 1.5, max: 4.0, step: 0.1, unit: 'cm' },
  { key: 'font',         label: '正文字体',      type: 'select', options: ['宋体', '黑体', 'Arial', 'Times New Roman'] },
]

const selectTemplate = (tpl) => {
  selectedTpl.value = tpl.id
  Object.assign(form, tplDefaults[tpl.id])
  applied.value = false
}

const updatePreview = () => { applied.value = false }

const resetToDefault = () => {
  Object.assign(form, tplDefaults[selectedTpl.value])
  applied.value = false
}

const applyAndAnimate = async () => {
  applying.value = true
  await new Promise(r => setTimeout(r, 800))
  applying.value = false
  applied.value = true
  ElMessage.success('格式配置已应用')
}

// 预览样式
const pageStyle = computed(() => ({
  padding: `${form.marginTop * 8}px ${form.marginLeft * 8}px`,
}))
const bodyStyle = computed(() => ({
  fontSize: form.bodySize + 'pt',
  lineHeight: form.lineSpacing,
  fontFamily: form.font,
  color: '#374151',
}))
const previewStyle = computed(() => ({ fontFamily: form.font }))

// 合规性计算
const complianceList = computed(() => {
  const ref = tplDefaults[selectedTpl.value]
  return [
    { item: '标题字号', current: form.titleSize + 'pt', ok: form.titleSize === ref.titleSize },
    { item: '正文字号', current: form.bodySize + 'pt',  ok: form.bodySize  === ref.bodySize },
    { item: '行间距',   current: form.lineSpacing + '倍', ok: form.lineSpacing >= 1.5 },
    { item: '上边距',   current: form.marginTop + 'cm', ok: form.marginTop <= 3.0 && form.marginTop >= 2.0 },
    { item: '左边距',   current: form.marginLeft + 'cm',ok: form.marginLeft <= 3.0 && form.marginLeft >= 2.0 },
  ]
})
</script>

<style scoped>
.demo-page { min-height: 100vh; background: linear-gradient(to bottom, #F5F7FA, #FFFFFF); padding: 40px 20px 80px; }
.demo-header { max-width: 1100px; margin: 0 auto 36px; text-align: center; }
.back-btn { position: absolute; left: 24px; top: 24px; font-size: 14px; color: #6B7280; }
.demo-title { font-size: 40px; font-weight: 700; color: #111827; margin: 0 0 10px; letter-spacing: -.02em; }
.demo-subtitle { font-size: 16px; color: #6B7280; margin: 0; }

.demo-body { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 380px 1fr; gap: 24px; }
.card { background: #fff; border: 1px solid #E5E7EB; border-radius: 20px; padding: 20px; margin-bottom: 20px; }
.card-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 16px; }

/* Template list */
.tpl-list { display: flex; flex-direction: column; gap: 8px; }
.tpl-item { padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px; cursor: pointer; transition: all .2s; }
.tpl-item:hover { border-color: #111827; }
.tpl-item.active { border-color: #111827; background: #F9FAFB; }
.tpl-name { font-size: 14px; font-weight: 600; color: #111827; }
.tpl-meta { font-size: 12px; color: #9CA3AF; margin-top: 2px; }

/* Params */
.param-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.param-row { display: flex; align-items: center; justify-content: space-between; }
.param-label { font-size: 13px; color: #374151; }
.param-ctrl { display: flex; align-items: center; gap: 6px; }
.param-unit { font-size: 12px; color: #9CA3AF; }
.apply-row { display: flex; gap: 10px; }
.apply-btn { border-radius: 999px; flex: 1; }
.apply-btn.primary { background: #111827; color: #fff; border: none; }

/* Preview */
.preview-col { display: flex; flex-direction: column; gap: 0; }
.preview-card { }
.paper-preview { background: #F9FAFB; border-radius: 10px; padding: 12px; overflow: auto; max-height: 380px; }
.paper-page { background: #fff; border: 1px solid #E5E7EB; border-radius: 6px; min-height: 300px; transition: padding .3s; }
.pp-title { text-align: center; font-weight: 700; color: #111827; margin-bottom: 10px; padding-top: 8px; transition: font-size .3s; }
.pp-label { text-align: center; font-weight: 600; color: #374151; margin-bottom: 8px; }
.pp-body  { margin-bottom: 12px; transition: font-size .3s, line-height .3s; }
.pp-section { font-weight: 700; color: #111827; margin-bottom: 8px; transition: font-size .3s; }
.pp-ref  { color: #6B7280; line-height: 1.6; transition: font-size .3s; }

/* Compliance */
.comply-list { display: flex; flex-direction: column; gap: 10px; }
.comply-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #F3F4F6; }
.comply-row:last-child { border-bottom: none; }
.comply-item { flex: 1; font-size: 13px; color: #374151; }
.comply-val  { font-size: 13px; font-weight: 600; }
.comply-val.ok   { color: #10B981; }
.comply-val.fail { color: #EF4444; }
.comply-status { font-size: 16px; }

@media (max-width: 768px) {
  .demo-body { grid-template-columns: 1fr; }
  .demo-title { font-size: 28px; }
}
</style>

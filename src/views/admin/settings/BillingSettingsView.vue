<template>
  <div class="billing-settings">
    <div class="hero">
      <div class="hero-content">
        <h1 class="title">计费策略</h1>
        <p class="subtitle">配置检查与修复价格策略，支持活动开关</p>
        <div class="chips">
          <el-tag :type="form.is_check_free ? 'success' : 'info'">{{ form.is_check_free ? '免费检查已开启' : '免费检查未开启' }}</el-tag>
          <el-tag type="primary">检查 ¥{{ form.format_check.toFixed(2) }}</el-tag>
          <el-tag type="warning">修正 ¥{{ form.format_fix.toFixed(2) }}</el-tag>
        </div>
      </div>
    </div>
    <div class="grid">
      <el-card class="card highlight" shadow="hover">
        <div class="card-head">
          <div class="card-title">活动开关</div>
          <el-switch v-model="form.is_check_free" />
        </div>
        <div class="card-body">
          <p class="desc">开启后，用户进行格式检查将不计费，适用于运营活动与拉新期。</p>
        </div>
      </el-card>
      <el-card class="card" shadow="hover">
        <div class="card-title">价格设置</div>
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="form-grid">
          <el-form-item label="检查单价 (元)" prop="format_check">
            <el-input-number v-model="form.format_check" :min="0" :precision="2" :step="0.5" />
          </el-form-item>
          <el-form-item label="修正单价 (元)" prop="format_fix">
            <el-input-number v-model="form.format_fix" :min="0" :precision="2" :step="0.5" />
          </el-form-item>
        </el-form>
        <div class="preview">
          <div class="preview-item">
            <span class="label">示例：仅检查</span>
            <span class="value">¥{{ form.format_check.toFixed(2) }}</span>
          </div>
          <div class="preview-item">
            <span class="label">示例：检查 + 修正</span>
            <span class="value">{{ (form.is_check_free ? form.format_fix : form.format_check + form.format_fix).toFixed(2) | currency }}</span>
          </div>
        </div>
        <div class="actions">
          <el-button @click="load">刷新</el-button>
          <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { getPaymentConfig, updatePaymentConfig } from '../../../api/admin'

const formRef = ref()
const saving = ref(false)
const form = reactive({
  is_check_free: false,
  format_check: 10,
  format_fix: 15
})

const rules = {
  is_check_free: [{ required: true, message: '请选择是否开启活动', trigger: 'change' }],
  format_check: [{ required: true, message: '请输入检查单价', trigger: 'blur' }],
  format_fix: [{ required: true, message: '请输入修正单价', trigger: 'blur' }]
}

const load = async () => {
  try {
    const data = await getPaymentConfig()
    const cfg = data?.data || data
    if (cfg && typeof cfg === 'object') {
      form.is_check_free = !!cfg.is_check_free
      form.format_check = Number(cfg.format_check ?? form.format_check)
      form.format_fix = Number(cfg.format_fix ?? form.format_fix)
    }
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const save = async () => {
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    saving.value = true
    await updatePaymentConfig({
      payment_config: {
        is_check_free: form.is_check_free,
        format_check: form.format_check,
        format_fix: form.format_fix
      }
    })
    ElMessage.success('计费策略已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

load()
</script>

<style scoped>
.billing-settings { max-width: 1100px; margin: 0 auto; padding: 20px; }
.hero { background: linear-gradient(135deg,#eef2ff,#ffffff); border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; margin-bottom: 16px; }
.title { margin: 0; font-size: 24px; font-weight: 700; color: #111827; }
.subtitle { margin: 6px 0 12px; color: #64748b; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap: 16px; }
.card { border-radius: 16px; }
.highlight { background: linear-gradient(135deg,#ecfdf5,#ffffff); border: 1px solid #e5e7eb; }
.card-head { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 8px; }
.card-body .desc { color: #6b7280; line-height: 1.6; }
.form-grid :deep(.el-form-item) { margin-bottom: 16px; }
.preview { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 12px; margin-top: 8px; }
.preview-item { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px 12px; }
.label { color: #6b7280; }
.value { font-weight: 700; color: #111827; }
.actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 12px; }
@media (max-width: 768px) {
  .billing-settings { padding: 16px; }
}
</style>

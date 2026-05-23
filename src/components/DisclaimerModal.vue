<template>
  <el-dialog
    :model-value="visible"
    @update:modelValue="val => emit('update:visible', val)"
    width="520px"
    :show-close="false"
    custom-class="glass-dialog"
    align-center
  >
    <div class="disclaimer-content">
      <h3 class="title">重要提示</h3>
      <ul class="points">
        <li>本网站论文格式修改不是完全准确，无法做到十全十美，请悉知。</li>
        <li>本网站旨在快速解决论文格式问题，若需人工协助请前往 联系我们 页面。</li>
      </ul>
      <div class="actions">
        <router-link to="/contact" class="glass-btn">联系我们</router-link>
        <el-button class="glass-btn primary" @click="acknowledge">我已知悉</el-button>
      </div>
      <div class="subnote">本提示本次会话仅显示一次</div>
    </div>
  </el-dialog>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'ack'])

const acknowledge = () => {
  emit('ack')
  emit('update:visible', false)
}
</script>

<style scoped>
.glass-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.disclaimer-content {
  padding: 20px 24px;
}

.title {
  margin: 0 0 8px;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
}

.points {
  margin: 0 0 16px;
  padding-left: 18px;
  color: #475569;
  line-height: 1.6;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.subnote {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
  text-align: right;
}
</style>

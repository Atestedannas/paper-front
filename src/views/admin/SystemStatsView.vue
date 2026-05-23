<template>
  <div class="admin-stats-view">
    <div class="page-header">
      <h1 class="page-title">系统统计</h1>
      <p class="page-subtitle">访问量、用户增长、任务处理概览</p>
    </div>
    <div class="grid">
      <el-card class="glass-card" shadow="hover">
        <template #header>
          <div class="card-header"><h3>近30天访问量</h3></div>
        </template>
        <div class="mock-chart line-chart">
          <svg width="100%" height="200" viewBox="0 0 400 200">
            <polyline :points="points" fill="none" stroke="#3B82F6" stroke-width="2"/>
          </svg>
        </div>
      </el-card>
      <el-card class="glass-card" shadow="hover">
        <template #header>
          <div class="card-header"><h3>任务处理统计</h3></div>
        </template>
        <div class="stat-list">
          <div class="item"><span>总检查次数</span><strong>1,234</strong></div>
          <div class="item"><span>修正完成</span><strong>982</strong></div>
          <div class="item"><span>失败次数</span><strong>32</strong></div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
const data = ref([20, 28, 40, 36, 50, 65, 70, 68, 80, 95, 90, 100])
const points = computed(() => {
  const max = Math.max(...data.value) || 1
  const stepX = 400 / (data.value.length + 1)
  return data.value.map((v, i) => `${(i + 1) * stepX},${200 - (v / max) * 180}`).join(' ')
})
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-title { margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #1e293b; }
.page-subtitle { margin: 0; color: #64748b; }
.grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.card-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #1e293b; }
.stat-list .item { display: flex; justify-content: space-between; padding: 8px 0; color: #475569; }
.line-chart { display: flex; align-items: center; justify-content: center; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
</style>


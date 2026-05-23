<template>
  <div class="admin-settings-logs">
    <div class="page-header">
      <h1 class="page-title">操作日志</h1>
      <p class="page-subtitle">审计平台关键操作记录</p>
    </div>
    <el-card class="glass-card" shadow="hover">
      <el-table :data="logs" stripe v-if="logs.length > 0">
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="admin" label="管理员" width="120" />
        <el-table-column prop="action" label="动作" />
        <el-table-column prop="target" label="对象" width="180" />
        <el-table-column prop="result" label="结果" width="120" />
      </el-table>
      <el-empty v-else description="暂无日志记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const logs = ref([
  { time: '2025-12-20 12:00', admin: 'admin', action: '删除用户', target: 'user003', result: '成功' },
  { time: '2025-12-19 09:10', admin: 'admin', action: '修改系统配置', target: 'enableOrders=true', result: '成功' }
])
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-title { margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #1e293b; }
.page-subtitle { margin: 0; color: #64748b; }
</style>


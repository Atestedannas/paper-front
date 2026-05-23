<template>
  <div class="admin-settings-system">
    <div class="page-header">
      <h1 class="page-title">系统配置</h1>
      <p class="page-subtitle">平台参数、权限与风格配置</p>
    </div>
    <el-card class="glass-card" shadow="hover">
      <el-form :model="config" label-width="140px">
        <el-form-item label="允许自助修正">
          <el-switch v-model="config.selfCorrection" />
        </el-form-item>
        <el-form-item label="启用订单系统">
          <el-switch v-model="config.enableOrders" />
        </el-form-item>
        <el-form-item label="主题风格">
          <el-select v-model="config.theme" style="width: 220px">
            <el-option label="玻璃风格" value="glass" />
            <el-option label="简约风格" value="minimal" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button class="glass-btn primary">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
const config = reactive({ selfCorrection: true, enableOrders: true, theme: 'glass' })
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-title { margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #1e293b; }
.page-subtitle { margin: 0; color: #64748b; }
</style>


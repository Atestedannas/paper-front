<template>
  <div class="admin-help-view">
    <div class="page-header">
      <h1 class="page-title">帮助中心</h1>
      <p class="page-subtitle">后台使用指南与常见问题</p>
    </div>
    <el-card class="glass-card" shadow="hover">
      <el-collapse>
        <el-collapse-item title="如何新增菜单与路由？">
          <p>在 router/index.js 的 /admin 子路由中新增子项，并在 AdminLayout 的菜单中添加对应入口。</p>
        </el-collapse-item>
        <el-collapse-item title="如何查看系统统计？">
          <p>进入“系统统计”页面查看概览。如需接入后端数据，请替换当前的 mock 数据源。</p>
        </el-collapse-item>
        <el-collapse-item title="权限与登录问题">
          <p>管理员路由带有 requiresAdmin 守卫，非管理员访问会被重定向至普通用户工作台。</p>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup>
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-title { margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #1e293b; }
.page-subtitle { margin: 0; color: #64748b; }
</style>


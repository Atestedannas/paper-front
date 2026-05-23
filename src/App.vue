<template>
  <div id="app">
    <el-config-provider :locale="zhCn">
      <MainLayout />
    </el-config-provider>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import MainLayout from '@/components/Layout/MainLayout.vue'

const userStore = useUserStore()

onMounted(() => {
  // 检查用户认证状态
  if (userStore.isLoggedIn) {
    // 如果已登录，尝试加载用户资料
    userStore.loadProfile().catch(error => {

      // 如果加载失败，可能是token过期，清除登录状态
      if (error.response?.status === 401) {
        userStore.logout()
      }
    })
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #303133;
  background-color: #f5f7fa;
}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
}
</style>

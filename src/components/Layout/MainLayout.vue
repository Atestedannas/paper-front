<template>
  <div class="main-layout">
    <!-- 全局背景 -->
    <GlobalMapBackground />

    <!-- 顶部导航栏 -->
    <el-header v-if="!isAdmin" class="header glass-bar">
      <div class="header-content">
     
        
        <div class="nav-menu">
          <template v-if="isAuthenticated">
            <router-link to="/upload" class="nav-item">论文上传</router-link>
            <router-link to="/history" class="nav-item">检查历史</router-link>
            <router-link to="/contact" class="nav-item">联系我们</router-link>
            <router-link to="/community" class="nav-item">交流社区</router-link>
          </template>
          <template v-else>
            <router-link to="/contact" class="nav-item">联系我们</router-link>
            <router-link to="/community" class="nav-item">交流社区</router-link>
          </template>
        </div>
        
        <div class="user-info">
          <template v-if="isAuthenticated">
            <el-dropdown @command="handleUserCommand">
              <span class="user-dropdown">
                <el-avatar :size="32" :src="resolveAvatarUrl(user?.avatar)" />
                <span class="username">{{ user?.username || '用户' }}</span>
                <el-icon><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>

  
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <router-link to="/login" class="login-btn">登录</router-link>
          </template>
        </div>
      </div>
    </el-header>
    
    <!-- 主要内容区域 -->
    <el-main class="main-content">
      <router-view />
    </el-main>
    
    <!-- 免责声明弹窗 -->
    <DisclaimerModal
      v-if="!isAdmin"
      v-model:visible="showDisclaimer"
      @ack="onDisclaimerAck"
    />
    
    <!-- 底部信息 -->
    <el-footer v-if="!isAdmin" class="footer">
      <div class="footer-content">
        <p>&copy; 2024 论文格式检查系统. 保留所有权利.</p>
      </div>
    </el-footer>
  </div>
</template>

<script setup>
import { computed, onMounted, watch, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { resolveAvatarUrl } from '@/utils/avatar'
import GlobalMapBackground from '../GlobalMapBackground.vue'
import DisclaimerModal from '../DisclaimerModal.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isAuthenticated = computed(() => userStore.isLoggedIn)
const user = computed(() => userStore.user)

const showDisclaimer = ref(false)
const isAdmin = computed(() => route.path.startsWith('/admin'))

// 在组件挂载时打印认证状态
onMounted(() => {

  
  // 路由为上传页且本会话未提示则显示
  const ack = sessionStorage.getItem('disclaimer_ack')
  if (!ack && route.path.startsWith('/upload')) {
    showDisclaimer.value = true
  }
})

// 监听认证状态变化
watch(isAuthenticated, (newValue, oldValue) => {
  
})

// 监听路由变化，在进入上传页时触发一次
watch(
  () => route.path,
  (p) => {
    const ack = sessionStorage.getItem('disclaimer_ack')
    if (!ack && p.startsWith('/upload')) {
      showDisclaimer.value = true
    }
  }
)

const onDisclaimerAck = () => {
  sessionStorage.setItem('disclaimer_ack', '1')
}

const handleUserCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/settings')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        userStore.logout()
        ElMessage.success('已退出登录')
        router.push('/')
      } catch {
        // 用户取消操作
      }
      break
  }
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  /* background: #fff; Removed for glass effect */
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0;
  height: 64px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
}

.logo-link {
  text-decoration: none;
  color: #409eff;
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.nav-menu {
  display: flex;
  gap: 32px;
}

.nav-item {
  text-decoration: none;
  color: #606266;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: #409eff;
  background-color: #f5f7fa;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.username {
  font-weight: 500;
  color: #303133;
}

.login-btn {
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s;
  color: #409eff;
  border: 1px solid #409eff;
}

.login-btn:hover {
  background-color: #409eff;
  color: white;
}


.main-content {
  flex: 1;
  padding: 0;
  background-color: transparent; /* Allow map background to show */
}

.footer {
  /* background: #fff; Removed for glass effect */
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  text-align: center;
  padding: 16px 0;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  color: #909399;
}
</style>

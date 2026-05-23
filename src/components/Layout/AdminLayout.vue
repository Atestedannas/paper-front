<template>
  <el-container class="admin-layout">
    <el-header class="admin-header glass-bar">
      <div class="header-left">
        <el-button type="text" @click="toggleSidebar" class="toggle-sidebar-btn" size="large">
          <el-icon :size="24"><Menu /></el-icon>
        </el-button>
        <div class="admin-logo">
          <h1>论文格式检查系统</h1>
        </div>
      </div>

      <div class="header-right">
        <el-dropdown>
          <el-button type="text" size="large">
            <el-badge :value="3" :hidden="false">
              <el-icon :size="24"><Bell /></el-icon>
            </el-badge>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <div class="notification-item">
                  <span class="notification-title">新用户注册</span>
                  <span class="notification-time">5分钟前</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item>
                <div class="notification-item">
                  <span class="notification-title">论文格式检查请求</span>
                  <span class="notification-time">10分钟前</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item>
                <div class="notification-item">
                  <span class="notification-title">系统更新提醒</span>
                  <span class="notification-time">1小时前</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item divided class="text-center">查看全部</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown @command="handleUserCommand">
          <span class="admin-dropdown">
            <el-avatar :size="36" :src="resolveAvatarUrl(admin?.avatar)" />
            <span class="admin-name">{{ adminDisplayName }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <TagsView />

    <el-container>
      <el-aside :width="isSidebarCollapsed ? '64px' : '240px'" class="admin-sidebar" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <el-menu
          :default-active="activeMenu"
          class="admin-menu"
          :router="true"
          :collapse="isSidebarCollapsed"
          :collapse-transition="false"
          text-color="var(--admin-menu-text)"
          active-text-color="var(--primary-color)"
          background-color="var(--admin-sidebar-bg)"
          :default-openeds="defaultOpeneds"
          @select="handleMenuSelect"
        >
          <!-- 根菜单（没有分组的顶级菜单） -->
          <el-menu-item
            v-for="item in rootMenuRoutes"
            :key="item.name"
            :index="item.path"
          >
            <el-icon><component :is="resolveMenuIcon(item.meta?.menuIcon)" /></el-icon>
            <span>{{ item.meta?.title }}</span>
          </el-menu-item>

          <!-- 分组菜单（系统管理、角色权限、内容管理） -->
          <el-sub-menu v-for="group in visibleMenuGroups" :key="group.key" :index="group.key">
            <template #title>
              <el-icon><component :is="group.icon" /></el-icon>
              <span>{{ group.title }}</span>
            </template>
            <el-menu-item
              v-for="item in group.children"
              :key="item.name"
              :index="item.path"
            >
              <el-icon><component :is="resolveMenuIcon(item.meta?.menuIcon)" /></el-icon>
              <span>{{ item.meta?.title }}</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>

    <el-footer class="admin-footer glass-bar">
      <div class="footer-content">
        <p>&copy; {{ new Date().getFullYear() }} 论文格式检查系统 保留所有权利</p>
      </div>
    </el-footer>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Menu, Bell, ArrowDown, House, User, Document,
  DataAnalysis, Setting, QuestionFilled,
  Reading, EditPen, ShoppingCart, Money,
  UserFilled, Timer, Key, Box
} from '@element-plus/icons-vue'
import { logout } from '../../api/auth'
import TagsView from '../admin/TagsView.vue'
import { useUserStore } from '@/stores/user'
import { resolveAvatarUrl } from '@/utils/avatar'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isSidebarCollapsed = ref(false)
const admin = computed(() => userStore.user || JSON.parse(localStorage.getItem('user') || '{}'))
// 显示名称：管理员账号显示「管理员」，其它显示用户名
const adminDisplayName = computed(() => {
  const u = admin.value?.username || admin.value?.name || ''
  if (u === 'admin' || u === 'administrator') return '管理员'
  return u || '管理员'
})
const allowlistVersion = ref(0)

const GROUP_META = {
  content: { key: 'content', title: '内容管理', icon: Document },
  system: { key: 'system', title: '系统管理', icon: Setting },
  rbac: { key: 'rbac', title: '角色权限', icon: Key }
}

const ICON_MAP = {
  House,
  User,
  Reading,
  EditPen,
  ShoppingCart,
  DataAnalysis,
  Money,
  UserFilled,
  Timer,
  Setting,
  QuestionFilled,
  Key,
  Box
}

const resolveMenuIcon = (iconKey) => ICON_MAP[iconKey] || Menu

// 静态管理端菜单（与 router 中 adminChildren 的 menu:true 项一致，不依赖 getRoutes）
const STATIC_ADMIN_MENUS = [
  { name: 'admin-dashboard', path: '/admin/dashboard', meta: { title: '管理员控制台', menu: true, menuGroup: 'root', menuOrder: 1, menuIcon: 'House' } },
  { name: 'admin-users', path: '/admin/users', meta: { title: '用户管理', menu: true, menuGroup: 'content', menuOrder: 10, menuIcon: 'User' } },
  { name: 'admin-papers', path: '/admin/papers', meta: { title: '论文管理', menu: true, menuGroup: 'content', menuOrder: 20, menuIcon: 'Reading' } },
  { name: 'admin-paper-format', path: '/admin/papers/format', meta: { title: '论文格式管理', menu: true, menuGroup: 'content', menuOrder: 30, menuIcon: 'EditPen' } },
  { name: 'admin-templates', path: '/admin/templates', meta: { title: '模板规范库', menu: true, menuGroup: 'content', menuOrder: 35, menuIcon: 'Reading' } },
  { name: 'admin-orders', path: '/admin/orders', meta: { title: '订单管理', menu: true, menuGroup: 'content', menuOrder: 40, menuIcon: 'ShoppingCart' } },
  { name: 'admin-universities', path: '/admin/universities', meta: { title: '高校管理', menu: true, menuGroup: 'content', menuOrder: 45, menuIcon: 'Reading' } },
  { name: 'admin-stats', path: '/admin/stats', meta: { title: '系统统计', menu: true, menuGroup: 'system', menuOrder: 50, menuIcon: 'DataAnalysis' } },
  { name: 'admin-settings-billing', path: '/admin/settings/billing', meta: { title: '计费策略', menu: true, menuGroup: 'system', menuOrder: 60, menuIcon: 'Money' } },
  { name: 'admin-settings-profile', path: '/admin/settings/profile', meta: { title: '个人设置', menu: true, menuGroup: 'system', menuOrder: 70, menuIcon: 'UserFilled' } },
  { name: 'admin-settings-logs', path: '/admin/settings/logs', meta: { title: '操作日志', menu: true, menuGroup: 'system', menuOrder: 80, menuIcon: 'Timer' } },
  { name: 'admin-settings-payment', path: '/admin/settings/payment', meta: { title: '支付设置', menu: true, menuGroup: 'system', menuOrder: 90, menuIcon: 'Setting' } },
  { name: 'admin-settings-system', path: '/admin/settings/system', meta: { title: '系统配置', menu: true, menuGroup: 'system', menuOrder: 95, menuIcon: 'Setting' } },
  { name: 'admin-support-contact', path: '/admin/settings/support-contact', meta: { title: '客服联系方式', menu: true, menuGroup: 'system', menuOrder: 100, menuIcon: 'QuestionFilled' } },
  { name: 'admin-help', path: '/admin/help', meta: { title: '帮助中心', menu: true, menuGroup: 'system', menuOrder: 105, menuIcon: 'QuestionFilled' } },
  { name: 'admin-roles', path: '/admin/settings/roles', meta: { title: '角色权限', menu: true, menuGroup: 'rbac', menuOrder: 110, menuIcon: 'Key' } },
  { name: 'admin-permissions', path: '/admin/settings/permissions', meta: { title: '权限管理', menu: true, menuGroup: 'rbac', menuOrder: 115, menuIcon: 'Key' } },
  { name: 'admin-permission-packages', path: '/admin/settings/permission-packages', meta: { title: '权限包', menu: true, menuGroup: 'rbac', menuOrder: 120, menuIcon: 'Box' } },
  { name: 'admin-menus', path: '/admin/menus', meta: { title: '菜单管理', menu: true, menuGroup: 'rbac', menuOrder: 130, menuIcon: 'Menu' } }
]

const EXTRA_ADMIN_PATHS = [
  '/admin/settings/permissions',
  '/admin/rbac',
  '/admin/templates',
  '/admin/universities',
  '/admin/settings/system',
  '/admin/help'
]

const KNOWN_ADMIN_PATH_SET = new Set([
  ...STATIC_ADMIN_MENUS.map((item) => item.path),
  ...EXTRA_ADMIN_PATHS
])

const normalizeAdminPath = (path) => {
  const rawPath = String(path || '').replace(/^\/+/, '')
  if (!rawPath) return ''
  if (rawPath.toLowerCase().startsWith('admin/')) return `/${rawPath}`
  return `/admin/${rawPath}`
}

const resolveKnownAdminPath = (menu) => {
  const rawPath = String(menu?.path || '').toLowerCase()
  const permission = String(menu?.permission || '').toLowerCase()
  const title = String(menu?.title || '').toLowerCase()

  if (rawPath.includes('dashboard')) return '/admin/dashboard'
  if (rawPath.includes('paper') && rawPath.includes('format')) return '/admin/papers/format'
  if (rawPath.includes('paper')) return '/admin/papers'
  if (rawPath.includes('user')) return '/admin/users'
  if (rawPath.includes('order')) return '/admin/orders'
  if (rawPath.includes('stats')) return '/admin/stats'
  if (rawPath.includes('billing')) return '/admin/settings/billing'
  if (rawPath.includes('payment')) return '/admin/settings/payment'
  if (rawPath.includes('profile')) return '/admin/settings/profile'
  if (rawPath.includes('log')) return '/admin/settings/logs'
  if (rawPath.includes('support') || rawPath.includes('contact')) return '/admin/settings/support-contact'
  if (rawPath.includes('permission-package')) return '/admin/settings/permission-packages'
  if (rawPath.includes('permission')) return '/admin/settings/permissions'
  if (rawPath.includes('role')) return '/admin/settings/roles'
  if (rawPath.includes('menu')) return '/admin/menus'

  if (permission.includes('rbac:role')) return '/admin/settings/roles'
  if (permission.includes('rbac:permission')) return '/admin/settings/permissions'
  if (permission.includes('system:menu')) return '/admin/menus'
  if (permission.includes('billing')) return '/admin/settings/billing'
  if (permission.includes('payment')) return '/admin/settings/payment'
  if (permission.includes('support')) return '/admin/settings/support-contact'

  if (title.includes('角色')) return '/admin/settings/roles'
  if (title.includes('权限包')) return '/admin/settings/permission-packages'
  if (title.includes('权限')) return '/admin/settings/permissions'
  if (title.includes('菜单')) return '/admin/menus'

  return ''
}

const menuRoutes = computed(() => {
  allowlistVersion.value

  // admin / super_admin 直接使用前端完整菜单，不受后端菜单分配限制
  const roleCodes = userStore.roles.map((r) => (typeof r === 'string' ? r : r?.code || '')).filter(Boolean)
  const userRole  = userStore.user?.role || ''
  const isAdminUser = roleCodes.some((c) => ['admin', 'super_admin'].includes(c))
                   || ['admin', 'super_admin'].includes(userRole)
  if (isAdminUser) {
    return STATIC_ADMIN_MENUS.slice().sort((a, b) => (a.meta.menuOrder || 0) - (b.meta.menuOrder || 0))
  }

  // 普通管理员：优先使用后端菜单树
  const currentMenus = userStore.menus
  if (currentMenus && currentMenus.length > 0) {
    return buildMenuRoutesFromMenus(currentMenus)
  }

  // 后端菜单未加载时仅保留个人设置兜底
  return STATIC_ADMIN_MENUS.filter((item) => item.path === '/admin/settings/profile')
})

// 根据路径推导菜单分组（与 gin-vue-admin 一致：系统管理 / 角色权限 / 内容）
function getMenuGroup(menu, parentPath = '') {
  const path = (menu.path || '').toLowerCase()
  if (path.includes('/settings') || path.includes('setting')) return 'system'
  if (path.includes('/role') || path.includes('/rbac') || path.includes('/menu') || path.includes('/permission')) return 'rbac'
  // 有 parent_id 说明是二级菜单，根据父级路径判断分组
  if (menu.parent_id) {
    const parentPathLower = (parentPath || '').toLowerCase()
    if (parentPathLower.includes('/settings') || parentPathLower.includes('setting')) return 'system'
    if (parentPathLower.includes('/role') || parentPathLower.includes('/rbac')) return 'rbac'
    return 'content'
  }
  return 'root'
}

// 从后端菜单构建侧栏路由（按分组展示）
const buildMenuRoutesFromMenus = (menus) => {
  const routes = []

  const traverse = (menuList, parentPath = '', parentGroup = 'root') => {
    if (!Array.isArray(menuList)) return

    for (const menu of menuList) {
      if (menu.visible === false) continue

      // 后端返回的路径：确保为完整路径 /admin/xxx
      const fullPath = normalizeAdminPath(menu.path)
      const fixedPath = KNOWN_ADMIN_PATH_SET.has(fullPath) ? fullPath : resolveKnownAdminPath(menu)
      if (!fixedPath) continue
      
      // 根据路径推导菜单分组
      const menuGroup = getMenuGroup({ ...menu, path: fixedPath }, parentPath)

      routes.push({
        name: menu.name || `menu-${menu.id}`,
        path: fixedPath,
        meta: {
          title: menu.title,
          menu: true,
          menuGroup: menuGroup,
          menuOrder: menu.sort_order || 0,
          menuIcon: menu.icon || 'Menu',
          permission: menu.permission
        }
      })

      // 递归处理子菜单
      if (Array.isArray(menu.children) && menu.children.length > 0) {
        traverse(menu.children, fixedPath, menuGroup)
      }
    }
  }

  traverse(menus)
  return routes.sort((a, b) => (a.meta.menuOrder || 0) - (b.meta.menuOrder || 0))
}

const rootMenuRoutes = computed(() => {
  return menuRoutes.value.filter((r) => r.meta?.menuGroup === 'root')
})

const visibleMenuGroups = computed(() => {
  const groups = Object.values(GROUP_META)
    .map((group) => ({
      ...group,
      children: menuRoutes.value.filter((r) => r.meta?.menuGroup === group.key)
    }))
    .filter((group) => group.children.length > 0)

  return groups
})

const activeMenu = computed(() => {
  if (menuRoutes.value.some((r) => r.path === route.path)) {
    return route.path
  }

  const matched = [...route.matched]
    .reverse()
    .find((m) => String(m.path || '').startsWith('/admin/') && m.meta?.menu)

  if (matched?.path) return matched.path

  return rootMenuRoutes.value[0]?.path || '/admin/dashboard'
})

const defaultOpeneds = computed(() => {
  // 展开当前菜单所属的分组
  const current = menuRoutes.value.find((r) => r.path === route.path)
  const group = current?.meta?.menuGroup
  if (!group || group === 'root') return []
  return [group]
})

const handleAllowlistUpdated = () => {
  allowlistVersion.value += 1
}

onMounted(async () => {
  window.addEventListener('role-route-mapping-updated', handleAllowlistUpdated)

  // 确保菜单已加载
  if (userStore.permissions.length === 0 && userStore.user?.id) {
    console.log('开始加载用户权限...')
    await userStore.loadUserPermissions()
    console.log('onMounted: 菜单加载完成 userStore.menus =', userStore.menus)
  } else {
    console.log('onMounted: 权限已加载 userStore.menus =', userStore.menus)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('role-route-mapping-updated', handleAllowlistUpdated)
})

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const handleMenuSelect = (index) => {
  if (!index || typeof index !== 'string') return
  // 分组标题点击不触发跳转
  if (['content', 'system', 'rbac'].includes(index)) return
}

const handleUserCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/admin/settings/profile')
      break
    case 'settings':
      router.push('/admin/settings/system')
      break
    case 'logout':
      handleLogout()
      break
    default:
      break
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    logout()
    userStore.logout()
    ElMessage.success('退出登录成功')
    router.push('/admin/login')
  } catch {
    // ignore
  }
}

watch(() => route.path, () => {})
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  --primary-color: #3B82F6;
  --admin-sidebar-bg: #F8F9FA;
  --admin-sidebar-hover-bg: #F0F2F5;
  --admin-menu-text: #334155;
  --tags-height: 48px;
}

.admin-layout .el-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: row;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 56px;
  z-index: 100;
  border-bottom: 1px solid #e5e7eb;
}

.header-left { display: flex; align-items: center; gap: 16px; }
.admin-logo h1 { margin: 0; font-size: 18px; font-weight: 600; color: #1f2937; }
.header-right { display: flex; align-items: center; gap: 16px; }
.admin-dropdown { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 12px; }
.notification-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; }

.admin-sidebar {
  background-color: var(--admin-sidebar-bg);
  transition: width 0.3s ease;
  overflow-x: hidden;
  overflow-y: auto;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
  height: 100%;
}

.admin-sidebar.sidebar-collapsed {
  width: 64px !important;
}

.admin-menu {
  border-right: none;
  height: 100%;
  background-color: var(--admin-sidebar-bg);
  width: 100%;
}

.admin-menu :deep(.el-menu-item),
.admin-menu :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  padding: 0 16px;
  color: var(--admin-menu-text);
  border-radius: 8px;
  margin: 4px 8px;
  box-sizing: border-box;
}

.admin-menu :deep(.el-menu-item:hover),
.admin-menu :deep(.el-sub-menu__title:hover) {
  background-color: var(--admin-sidebar-hover-bg);
}

.admin-menu :deep(.is-active) {
  background-color: rgba(59, 130, 246, 0.12);
  color: var(--primary-color);
}

.admin-main {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  min-height: calc(100vh - 56px - 56px - var(--tags-height));
}

.admin-footer {
  padding: 16px 20px;
  text-align: center;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .admin-main { padding: 12px; }
}
</style>

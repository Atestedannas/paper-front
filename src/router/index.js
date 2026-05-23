import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { canAccessRouteByStore } from '@/utils/rbac'
import { getRouteRequiredPermissions } from '@/utils/rbac-adapter'

const HomeView = () => import('../views/HomeView.vue')
const CorrectionDemoView = () => import('../views/CorrectionDemoView.vue')
const LoginView = () => import('../views/LoginView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const UploadView = () => import('../views/UploadView.vue')
const FormatCheckView = () => import('../views/FormatCheckView.vue')
const FormatCorrectionView = () => import('../views/FormatCorrectionView.vue')
const ExportResultView = () => import('../views/ExportResultView.vue')
const HistoryView = () => import('../views/HistoryView.vue')
const ProfileView = () => import('../views/ProfileView.vue')
const MemberView = () => import('../views/MemberView.vue')
const OrderView = () => import('../views/OrderView.vue')
const ForgotPasswordView = () => import('../views/ForgotPasswordView.vue')
const ContactView = () => import('../views/ContactView.vue')
const CommunityView = () => import('../views/CommunityView.vue')
const CommunityPostView = () => import('../views/CommunityPostView.vue')

const AdminLoginView = () => import('../views/admin/AdminLoginView.vue')
const OAuthCallbackView = () => import('../views/OAuthCallbackView.vue')
const SpeedAccuracyDemo = () => import('../views/demo/SpeedAccuracyDemo.vue')
const TemplateCustomDemo = () => import('../views/demo/TemplateCustomDemo.vue')
const ExportDemo = () => import('../views/demo/ExportDemo.vue')
const AdminDashboardView = () => import('../views/admin/AdminDashboardView.vue')
const UserManagementView = () => import('../views/admin/UserManagementView.vue')
const PaperManagementView = () => import('../views/admin/PaperManagementView.vue')
const PaperFormatView = () => import('../views/admin/PaperFormatView.vue')
const OrderManagementView = () => import('../views/admin/OrderManagementView.vue')
const SystemStatsView = () => import('../views/admin/SystemStatsView.vue')
const HelpCenterView = () => import('../views/admin/HelpCenterView.vue')
const ProfileSettingsView = () => import('../views/admin/settings/ProfileSettingsView.vue')
const SystemSettingsView = () => import('../views/admin/settings/SystemSettingsView.vue')
const OperationLogsView = () => import('../views/admin/settings/OperationLogsView.vue')
const PaymentSettingsView = () => import('../views/admin/settings/PaymentSettingsView.vue')
const TemplateLibraryView = () => import('../views/admin/templates/TemplateLibraryView.vue')
const BillingSettingsView = () => import('../views/admin/settings/BillingSettingsView.vue')

const SupportContactView = () => import('../views/admin/SupportContactView.vue')
const RoleManagementView = () => import('../views/admin/settings/RoleManagementView.vue')
const PermissionManagementView = () => import('../views/admin/settings/PermissionManagementView.vue')
const RBACManagementView = () => import('../views/admin/RBACManagementView.vue')
const PermissionPackageView = () => import('../views/admin/settings/PermissionPackageView.vue')
const MenuManagementView = () => import('../views/admin/MenuManagementView.vue')

const adminChildren = [
  {
    path: 'dashboard',
    name: 'admin-dashboard',
    component: AdminDashboardView,
    meta: { title: '管理员控制台', menu: true, menuGroup: 'root', menuOrder: 1, menuIcon: 'House', permission: ['system:stats:view'] }
  },
  {
    path: 'users',
    name: 'admin-users',
    component: UserManagementView,
    meta: { title: '用户管理', menu: true, menuGroup: 'content', menuOrder: 10, menuIcon: 'User', permission: ['user:list'] }
  },
  {
    path: 'papers',
    name: 'admin-papers',
    component: PaperManagementView,
    meta: { title: '论文管理', menu: true, menuGroup: 'content', menuOrder: 20, menuIcon: 'Reading', permission: ['paper:list'] }
  },
  {
    path: 'papers/format',
    name: 'admin-paper-format',
    component: PaperFormatView,
    meta: { title: '论文格式管理', menu: true, menuGroup: 'content', menuOrder: 30, menuIcon: 'EditPen', permission: ['paper:format:manage'] }
  },
  {
    path: 'orders',
    name: 'admin-orders',
    component: OrderManagementView,
    meta: { title: '订单管理', menu: true, menuGroup: 'content', menuOrder: 40, menuIcon: 'ShoppingCart', permission: ['order:list'] }
  },
  {
    path: 'stats',
    name: 'admin-stats',
    component: SystemStatsView,
    meta: { title: '系统统计', menu: true, menuGroup: 'system', menuOrder: 50, menuIcon: 'DataAnalysis', permission: ['system:stats:view'] }
  },
  {
    path: 'settings/billing',
    name: 'admin-settings-billing',
    component: BillingSettingsView,
    meta: { title: '计费策略', menu: true, menuGroup: 'system', menuOrder: 60, menuIcon: 'Money', permission: ['billing:manage'] }
  },
  {
    path: 'settings/profile',
    name: 'admin-settings-profile',
    component: ProfileSettingsView,
    meta: { title: '个人设置', menu: true, menuGroup: 'system', menuOrder: 70, menuIcon: 'UserFilled' }
  },
  {
    path: 'settings/logs',
    name: 'admin-settings-logs',
    component: OperationLogsView,
    meta: { title: '操作日志', menu: true, menuGroup: 'system', menuOrder: 80, menuIcon: 'Timer', permission: ['system:logs:view'] }
  },
  {
    path: 'settings/payment',
    name: 'admin-settings-payment',
    component: PaymentSettingsView,
    meta: { title: '支付设置', menu: true, menuGroup: 'system', menuOrder: 90, menuIcon: 'Setting', permission: ['payment:manage'] }
  },
  {
    path: 'settings/support-contact',
    name: 'admin-support-contact',
    component: SupportContactView,
    meta: { title: '客服联系方式', menu: true, menuGroup: 'system', menuOrder: 100, menuIcon: 'QuestionFilled', permission: ['support:manage'] }
  },
  {
    path: 'settings/roles',
    name: 'admin-roles',
    component: RoleManagementView,
    meta: { title: '角色权限', menu: true, menuGroup: 'rbac', menuOrder: 110, menuIcon: 'Key', permission: ['rbac:role:manage'] }
  },
  {
    path: 'settings/permission-packages',
    name: 'admin-permission-packages',
    component: PermissionPackageView,
    meta: { title: '权限包', menu: true, menuGroup: 'rbac', menuOrder: 120, menuIcon: 'Box', permission: ['rbac:permission:manage'] }
  },
  {
    path: 'menus',
    name: 'admin-menus',
    component: MenuManagementView,
    meta: { title: '菜单管理', menu: true, menuGroup: 'rbac', menuOrder: 130, menuIcon: 'Menu', permission: ['system:menu:manage'] }
  },
  {
    path: 'settings/permissions',
    name: 'admin-permissions',
    component: PermissionManagementView,
    meta: { title: '权限管理', menu: true, menuGroup: 'rbac', menuOrder: 115, menuIcon: 'Key', permission: ['rbac:permission:manage'] }
  },
  {
    path: 'rbac',
    name: 'admin-rbac',
    component: RBACManagementView,
    meta: { title: 'RBAC 权限管理', menu: false, permission: ['rbac:role:manage', 'rbac:permission:manage'] }
  },
  {
    path: 'templates',
    name: 'admin-templates',
    component: TemplateLibraryView,
    meta: { title: '模板规范库', menu: true, menuGroup: 'content', menuOrder: 35, menuIcon: 'Reading', permission: ['template:list', 'template:manage'] }
  },

  {
    path: 'settings/system',
    name: 'admin-settings-system',
    component: SystemSettingsView,
    meta: { title: '系统配置', menu: true, menuGroup: 'system', menuOrder: 95, menuIcon: 'Setting', permission: ['system:config:read', 'system:config:update'] }
  },
  {
    path: 'help',
    name: 'admin-help',
    component: HelpCenterView,
    meta: { title: '帮助中心', menu: true, menuGroup: 'system', menuOrder: 105, menuIcon: 'QuestionFilled' }
  }
]

const router = createRouter({
  history: createWebHistory('/paper-front/'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: '论文格式检查系统' }
    },
    {
      path: '/check/preview',
      name: 'correction-demo',
      component: CorrectionDemoView,
      meta: { title: '体验修正流程' }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { title: '登录' }
    },
    {
      path: '/auth/callback/:provider',
      name: 'oauth-callback',
      component: OAuthCallbackView,
      meta: { title: '登录中', public: true }
    },
    {
      path: '/demo/speed',
      name: 'demo-speed',
      component: SpeedAccuracyDemo,
      meta: { title: '极速与准确 · 演示' }
    },
    {
      path: '/demo/template',
      name: 'demo-template',
      component: TemplateCustomDemo,
      meta: { title: '模板与自定义 · 演示' }
    },
    {
      path: '/demo/export',
      name: 'demo-export',
      component: ExportDemo,
      meta: { title: '整洁的导出 · 演示' }
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactView,
      meta: { title: '联系我们' }
    },
    {
      path: '/community',
      name: 'community',
      component: CommunityView,
      meta: { title: '交流社区' }
    },
    {
      path: '/community/:id',
      name: 'community-post',
      component: CommunityPostView,
      meta: { title: '帖子详情' }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, title: '工作台' }
    },
    {
      path: '/upload',
      name: 'upload',
      component: UploadView,
      meta: { requiresAuth: true, title: '论文上传' }
    },
    {
      path: '/check/:paperId',
      name: 'format-check',
      component: FormatCheckView,
      meta: { requiresAuth: true, title: '格式检查' }
    },
    {
      path: '/correction/:paperId',
      name: 'format-correction',
      component: FormatCorrectionView,
      meta: { requiresAuth: true, title: '格式修正' }
    },
    {
      path: '/papers/:id/review',
      name: 'FormatReview',
      component: () => import('@/views/FormatReviewView.vue'),
      meta: { requiresAuth: true, title: '格式差异审核' }
    },
    {
      path: '/export/:paperId',
      name: 'export-result',
      component: ExportResultView,
      meta: { requiresAuth: true, title: '结果导出' }
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
      meta: { requiresAuth: true, title: '检查历史' }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true, title: '个人资料' }
    },
    {
      path: '/member',
      name: 'member',
      component: MemberView,
      meta: { requiresAuth: true, title: '会员中心' }
    },
    {
      path: '/orders',
      name: 'orders',
      component: OrderView,
      meta: { requiresAuth: true, title: '我的订单' }
    },
    {
      path: '/payment/success',
      name: 'payment-success',
      component: () => import('../views/PaymentSuccessView.vue'),
      meta: { requiresAuth: true, title: '支付结果' }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
      meta: { title: '忘记密码' }
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: AdminLoginView,
      meta: { title: '管理员登录' }
    },
    {
      path: '/admin',
      component: () => import('../components/Layout/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        ...adminChildren
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

const CHUNK_RELOAD_KEY = 'paper:last-chunk-reload'

const isChunkLoadError = (error) => {
  const message = String(error?.message || error || '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/.test(message)
}

router.onError((error) => {
  if (!isChunkLoadError(error)) {
    console.error(error)
    return
  }

  const lastReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
  const now = Date.now()

  if (now - lastReloadAt > 10000) {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now))
    window.location.reload()
    return
  }

  console.error(error)
})

const resolveFirstAdminPath = (userStore) => {
  const candidate = adminChildren
    .filter((route) => route.meta?.menu !== false)
    .sort((a, b) => (a.meta?.menuOrder || 0) - (b.meta?.menuOrder || 0))
    .find((route) => canAccessRouteByStore(userStore, route))

  return candidate ? `/admin/${candidate.path}` : '/admin/settings/profile'
}

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 论文格式检查系统` : '论文格式检查系统'

  if (!to.matched.some((record) => record.meta.requiresAuth)) {
    next()
    return
  }

  const token = localStorage.getItem('token') || localStorage.getItem('access_token')
  if (!token) {
    const loginPath = to.matched.some((record) => record.meta.requiresAdmin) ? '/admin/login' : '/login'
    if (to.path !== loginPath) {
      next({ path: loginPath, query: { redirect: to.fullPath } })
      return
    }
  }

  const userStore = useUserStore()
  // 统一从 store/profile 获取用户，避免仅依赖 localStorage 造成误判
  if (!userStore.user?.id) {
    try {
      await userStore.getInfo()
    } catch {
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
  }

  if (to.matched.some((record) => record.meta.requiresAdmin) && !userStore.isAdmin) {
    next({ path: '/dashboard', query: { error: 'admin_required' } })
    return
  }

  if (!userStore.permissionLoaded) {
    console.log('路由守卫：开始加载用户权限...')
    await userStore.loadUserPermissions()
    console.log('路由守卫：用户权限加载完成，menus =', userStore.menus)
  }

  // 查找最后一个管理员路由记录
  const adminRouteRecord = to.matched.find((record) => record.meta?.requiresAdmin)
    ? to.matched[to.matched.length - 1]
    : null

  // 权限检查（仅当路由有权限要求时才检查）
  const requiredPermission = adminRouteRecord ? getRouteRequiredPermissions(adminRouteRecord.meta) : null
  if (adminRouteRecord && requiredPermission) {
    const hasPermission = canAccessRouteByStore(userStore, adminRouteRecord)
    console.log('权限检查:', { 
      path: to.path, 
      hasPermission, 
      permission: requiredPermission,
      userPermissions: userStore.permissions 
    })
    
    if (!hasPermission) {
      const fallback = resolveFirstAdminPath(userStore)
      if (to.path !== fallback) {
        next({ path: fallback, query: { error: 'permission_denied' } })
        return
      }
    }
  }

  next()
})

export default router

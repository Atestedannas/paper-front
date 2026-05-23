import { defineStore } from 'pinia'
import router from '@/router'

const constantRoutes = router.options.routes || []

// 匹配所有 views 目录下的 Vue 文件
const modules = import.meta.glob('../../views/**/*.vue')

/**
 * 递归过滤有权限的菜单并转换为路由（与 gin-vue-admin 一致：基于用户菜单树生成动态路由）
 */
export function filterAsyncRoutes(routes) {
  const res = []

  routes.forEach(route => {
    const tmp = { ...route }

    // 只处理菜单类型
    if (tmp.menu_type === 'menu' || tmp.menu_type === 'catalog') {
      const routeConfig = {
        path: tmp.path,
        name: tmp.name,
        meta: {
          title: tmp.title || tmp.name,
          icon: tmp.icon,
          noCache: !tmp.keep_alive,
          breadcrumb: tmp.visible !== false,
          affix: tmp.visible !== false,
          menu: true,
          menuGroup: 'root',
          menuOrder: tmp.sort_order || 0,
          menuIcon: tmp.icon || 'Menu',
          permission: tmp.permission ? [tmp.permission] : []
        },
        redirect: tmp.redirect || undefined
      }

      // 转换 component
      if (tmp.component) {
        if (tmp.component === 'Layout') {
          routeConfig.component = () => import('@/layout/index.vue')
        } else {
          const componentPath = `../../views/${tmp.component}`

          if (modules[componentPath]) {
            routeConfig.component = modules[componentPath]
          } else {
            console.warn(`组件不存在：${componentPath}`)
            return
          }
        }
      }

      if (tmp.children && tmp.children.length > 0) {
        routeConfig.children = filterAsyncRoutes(tmp.children)
      }

      res.push(routeConfig)
    }
  })

  return res
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    menus: [],
    routes: [],
    addRoutes: [],
    permissionLoaded: false
  }),

  getters: {
    menusGetter: (state) => state.menus,
    routesGetter: (state) => state.routes
  },

  actions: {
    /**
     * 根据用户菜单树生成动态路由（与 gin-vue-admin 一致：单数据源，仅注册用户有权限的路由）
     * @param {Array} userMenuTree - 用户菜单树，来自 userStore.menus（getUserMenuTree 接口）
     */
    generateRoutes(userMenuTree) {
      const menuTree = Array.isArray(userMenuTree) ? userMenuTree : []
      this.menus = menuTree
      const accessedRoutes = filterAsyncRoutes(menuTree)
      this.addRoutes = accessedRoutes
      this.routes = constantRoutes.concat(accessedRoutes)
      this.permissionLoaded = true
      return Promise.resolve(accessedRoutes)
    },

    /**
     * 设置菜单
     */
    setMenus(menus) {
      this.menus = menus
    },

    /**
     * 动态添加路由
     */
    addDynamicRoutes(routes) {
      this.addRoutes = routes
      this.routes = constantRoutes.concat(routes)
    },

    /**
     * 重置权限
     */
    resetPermission() {
      this.menus = []
      this.routes = []
      this.addRoutes = []
      this.permissionLoaded = false
    }
  }
})

export default usePermissionStore

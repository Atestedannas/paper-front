import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { canAccessRouteByStore } from '@/utils/rbac'

export function useMenuPermission() {
  const router = useRouter()
  const userStore = useUserStore()

  const routeMap = computed(() => {
    const map = new Map()
    router.getRoutes().forEach((route) => {
      if (route.name) map.set(String(route.name), route)
    })
    return map
  })

  const canAccessRoute = (routeName) => {
    const route = routeMap.value.get(String(routeName))
    if (!route) return true
    return canAccessRouteByStore(userStore, route)
  }

  const isMenuVisible = (menuKey) => canAccessRoute(menuKey)

  return {
    visibleMenus: computed(() => ({})),
    isMenuVisible,
    canAccess: (permission) => userStore.permissions.includes(permission),
    canAccessAny: (permissions) => permissions.some((perm) => userStore.permissions.includes(perm)),
    canAccessAll: (permissions) => permissions.every((perm) => userStore.permissions.includes(perm)),
    canAccessRoute
  }
}
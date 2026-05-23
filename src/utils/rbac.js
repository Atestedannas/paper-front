import { getMergedRoutesByRoleCodes } from '@/utils/role-route-mapping'
import { getRouteRequiredPermissions } from '@/utils/rbac-adapter'

export const SUPER_ADMIN_ROLES = ['super_admin']
export const ADMIN_ROLES = ['admin', 'super_admin']

// 标准化权限代码（从菜单的 permission 字段获取）
export const normalizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return []
  return permissions.map((p) => {
    if (typeof p === 'string') return p
    if (!p || typeof p !== 'object') return ''
    // 支持多种字段名：permission, permission_code, code
    return p.permission || p.permission_code || p.code || ''
  }).filter(Boolean)
}

export const normalizeRoleCodes = (roles) => {
  if (!Array.isArray(roles)) return []
  return roles.map((r) => {
    if (typeof r === 'string') return r
    if (!r || typeof r !== 'object') return ''
    return r.code || r.role || ''
  }).filter(Boolean)
}

// 检查是否有任何一个权限
export const hasAnyPermission = (userPermissions, requiredPermissions) => {
  const required = Array.isArray(requiredPermissions) ? requiredPermissions.filter(Boolean) : []
  if (required.length === 0) return true
  const owned = new Set(normalizePermissions(userPermissions))
  return required.some((code) => owned.has(code))
}

// 检查是否有所有权限
export const hasAllPermissions = (userPermissions, requiredPermissions) => {
  const required = Array.isArray(requiredPermissions) ? requiredPermissions.filter(Boolean) : []
  if (required.length === 0) return true
  const owned = new Set(normalizePermissions(userPermissions))
  return required.every((code) => owned.has(code))
}

export const isSuperAdminByStore = (userStore) => {
  const roleCodes = normalizeRoleCodes(userStore?.roles)
  if (roleCodes.some((code) => SUPER_ADMIN_ROLES.includes(code))) return true
  const userRole = userStore?.user?.role
  return SUPER_ADMIN_ROLES.includes(userRole)
}

export const isAdminByUser = (user) => {
  if (!user) return false
  return ADMIN_ROLES.includes(user.role)
}

export const isAdminByStore = (userStore) => {
  const roleCodes = normalizeRoleCodes(userStore?.roles)
  if (roleCodes.some((code) => ADMIN_ROLES.includes(code))) return true
  const userRole = userStore?.user?.role
  return ADMIN_ROLES.includes(userRole)
}

// 检查是否配置了角色路由映射
const isRoleRouteConfigEnabled = (roleCodes) => {
  const assigned = getMergedRoutesByRoleCodes(roleCodes)
  return assigned.length > 0
}

// 根据角色路由映射判断是否可以访问
const canAccessByRoleRouteConfig = (roleCodes, route) => {
  const assigned = getMergedRoutesByRoleCodes(roleCodes)
  if (assigned.length === 0) return null

  const routeName = route?.name ? String(route.name) : ''
  if (!routeName) return true

  // 个人设置页面始终可访问
  if (routeName === 'admin-settings-profile') return true

  return assigned.includes(routeName)
}

// 根据菜单权限判断是否可以访问路由
export const canAccessRouteByStore = (userStore, route) => {
  if (!route) return false

  // 仅 super_admin 默认全量放行；admin 走标准角色/权限链路
  if (isSuperAdminByStore(userStore)) return true

  const roleCodes = normalizeRoleCodes(userStore?.roles)

  // 检查角色路由映射配置
  const byRoleRoute = canAccessByRoleRouteConfig(roleCodes, route)
  if (typeof byRoleRoute === 'boolean') {
    return byRoleRoute
  }

  // 从路由 meta 中获取所需的权限代码
  const requiredPermission = getRouteRequiredPermissions(route.meta)
  
  // 如果没有设置权限要求，默认允许访问
  if (!requiredPermission) return true

  // 检查用户是否拥有该权限
  return hasAnyPermission(userStore?.permissions, requiredPermission)
}

export const hasRoleRouteConfig = (userStore) => {
  const roleCodes = normalizeRoleCodes(userStore?.roles)
  return isRoleRouteConfigEnabled(roleCodes)
}

// 从菜单树中提取所有权限代码
export const extractPermissionsFromMenus = (menus) => {
  const permissions = new Set()
  
  const traverse = (menuList) => {
    if (!Array.isArray(menuList)) return
    for (const menu of menuList) {
      if (menu.permission) {
        permissions.add(menu.permission)
      }
      if (Array.isArray(menu.children)) {
        traverse(menu.children)
      }
    }
  }
  
  traverse(menus)
  return Array.from(permissions)
}
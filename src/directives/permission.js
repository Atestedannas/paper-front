import { useUserStore } from '@/stores/user'
import { normalizeRoleCodes, normalizePermissions } from '@/utils/rbac'

/**
 * 权限指令 - 控制按钮显示（与 gin-vue-admin 一致：基于权限码或角色码）
 * 用法：v-permission="['user:create', 'admin']"  // 权限码或角色码，满足其一即显示
 */
export const permission = {
  mounted(el, binding) {
    const { value } = binding
    const userStore = useUserStore()
    const permissions = userStore.permissions || []
    const roleCodes = normalizeRoleCodes(userStore.roles || [])
    const permissionCodes = normalizePermissions(permissions)

    if (value && value instanceof Array && value.length > 0) {
      const required = value.filter(Boolean)
      const hasPermission = required.some(code => permissionCodes.includes(code))
      const hasRole = required.some(code => roleCodes.includes(code))

      if (!hasPermission && !hasRole) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      console.warn('v-permission 请设置权限/角色标签值，例如 v-permission="[\'user:create\', \'admin\']"')
    }
  }
}

/**
 * 角色指令 - 控制按钮显示（比较 role.code，与 userStore.roles 结构一致）
 * 用法：v-role="['super_admin', 'admin']"
 */
export const role = {
  mounted(el, binding) {
    const { value } = binding
    const userStore = useUserStore()
    const roleCodes = normalizeRoleCodes(userStore.roles || [])

    if (value && value instanceof Array && value.length > 0) {
      const required = value.filter(Boolean)
      const hasRole = required.some(code => roleCodes.includes(code))

      if (!hasRole) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      console.warn('v-role 请设置角色标签值，例如 v-role="[\'super_admin\', \'admin\']"')
    }
  }
}

/**
 * 安装指令
 */
export function setupPermissionDirective(app) {
  app.directive('permission', permission)
  app.directive('role', role)
}

export default {
  install(app) {
    setupPermissionDirective(app)
  }
}

import request from '@/utils/request'

const requestWithFallback = (v1Config, fallbackConfig) => {
  return request(v1Config).catch(() => request(fallbackConfig))
}

export default {
  // ==================== 角色管理 ====================

  // 获取角色列表（使用 v1 版本，如果不存在则回退到普通版本）
  getRoles(params) {
    return requestWithFallback(
      { url: '/api/v1/admin/roles', method: 'get', params },
      { url: '/api/admin/roles', method: 'get', params }
    )
  },

  // 获取角色详情
  getRoleByID(id) {
    return requestWithFallback(
      { url: `/api/v1/admin/roles/${id}`, method: 'get' },
      { url: `/api/admin/roles/${id}`, method: 'get' }
    )
  },

  // 创建角色
  createRole(data) {
    return requestWithFallback(
      { url: '/api/v1/admin/roles', method: 'post', data },
      { url: '/api/admin/roles', method: 'post', data }
    )
  },

  // 更新角色
  updateRole(id, data) {
    return requestWithFallback(
      { url: `/api/v1/admin/roles/${id}`, method: 'put', data },
      { url: `/api/admin/roles/${id}`, method: 'put', data }
    )
  },

  // 删除角色
  deleteRole(id) {
    return requestWithFallback(
      { url: `/api/v1/admin/roles/${id}`, method: 'delete' },
      { url: `/api/admin/roles/${id}`, method: 'delete' }
    )
  },

  // ==================== 菜单管理（菜单即权限）====================

  // 获取菜单树（所有菜单）
  getMenuTree() {
    return requestWithFallback(
      { url: '/api/v1/admin/menus/tree', method: 'get' },
      { url: '/api/admin/menus/tree', method: 'get' }
    )
  },

  // 获取用户菜单树（根据用户角色动态生成）
  getUserMenuTree() {
    return requestWithFallback(
      { url: '/api/v1/admin/menus/user-tree', method: 'get' },
      { url: '/api/admin/menus/user-tree', method: 'get' }
    )
  },

  // 获取角色菜单列表
  getRoleMenus(roleId) {
    return requestWithFallback(
      { url: `/api/v1/admin/roles/${roleId}/menus`, method: 'get' },
      { url: `/api/admin/roles/${roleId}/menus`, method: 'get' }
    )
  },

  // 为角色分配菜单
  assignMenusToRole(roleId, menuIds) {
    return requestWithFallback(
      { url: `/api/v1/admin/roles/${roleId}/menus`, method: 'post', data: { menu_ids: menuIds } },
      { url: `/api/admin/roles/${roleId}/menus`, method: 'post', data: { menu_ids: menuIds } }
    )
  },

  // 从角色移除菜单
  removeMenuFromRole(roleId, menuId) {
    return this.getRoleMenus(roleId).then((menus) => {
      const list = Array.isArray(menus) ? menus : (menus?.menus || menus?.items || [])
      const keepIds = list
        .map((menu) => menu?.id)
        .filter((id) => id && String(id) !== String(menuId))
      return this.assignMenusToRole(roleId, keepIds)
    })
  },

  // ==================== 用户角色与权限 ====================

  // 获取用户角色列表（当前用户或指定用户）
  getUserRoles(userId) {
    return requestWithFallback(
      { url: `/api/v1/admin/users/${userId}/roles`, method: 'get' },
      { url: `/api/admin/users/${userId}/roles`, method: 'get' }
    )
  },

  // 获取用户菜单（所有可访问的菜单）
  getUserMenus() {
    return requestWithFallback(
      { url: '/api/v1/admin/menus/user-tree', method: 'get' },
      { url: '/api/admin/menus/user-tree', method: 'get' }
    )
  },

  // 检查用户是否有指定菜单权限
  checkUserMenuPermission(_userId, menuCode) {
    return requestWithFallback(
      { url: '/api/v1/admin/casbin/enforce', method: 'post', data: { obj: menuCode, act: 'read' } },
      { url: '/api/admin/casbin/enforce', method: 'post', data: { obj: menuCode, act: 'read' } }
    )
  },

  // 获取用户全部权限（包含角色继承）
  getUserPermissions(userId) {
    return requestWithFallback(
      { url: `/api/v1/admin/users/${userId}/permissions`, method: 'get' },
      { url: `/api/admin/users/${userId}/permissions`, method: 'get' }
    )
  },

  // 获取用户直接权限（不含角色继承）
  getUserDirectPermissions(userId) {
    return requestWithFallback(
      { url: `/api/v1/admin/users/${userId}/direct-permissions`, method: 'get' },
      { url: `/api/admin/users/${userId}/direct-permissions`, method: 'get' }
    )
  },

  // 获取角色权限
  getRolePermissions(roleId) {
    return requestWithFallback(
      { url: `/api/v1/admin/roles/${roleId}/permissions`, method: 'get' },
      { url: `/api/admin/roles/${roleId}/permissions`, method: 'get' }
    )
  },

  // 获取权限列表
  getPermissions(params) {
    return requestWithFallback(
      { url: '/api/v1/admin/permissions', method: 'get', params },
      { url: '/api/admin/permissions', method: 'get', params }
    )
  },

  // 获取权限详情
  getPermissionByID(id) {
    return requestWithFallback(
      { url: `/api/v1/admin/permissions/${id}`, method: 'get' },
      { url: `/api/admin/permissions/${id}`, method: 'get' }
    )
  },

  // 创建权限
  createPermission(data) {
    return requestWithFallback(
      { url: '/api/v1/admin/permissions', method: 'post', data },
      { url: '/api/admin/permissions', method: 'post', data }
    )
  },

  // 更新权限
  updatePermission(id, data) {
    return requestWithFallback(
      { url: `/api/v1/admin/permissions/${id}`, method: 'put', data },
      { url: `/api/admin/permissions/${id}`, method: 'put', data }
    )
  },

  // 删除权限
  deletePermission(id) {
    return requestWithFallback(
      { url: `/api/v1/admin/permissions/${id}`, method: 'delete' },
      { url: `/api/admin/permissions/${id}`, method: 'delete' }
    )
  },

  // 为角色分配权限
  assignPermissionToRole(roleId, permissionId) {
    return requestWithFallback(
      { url: `/api/v1/admin/role-permission-assign/${roleId}/${permissionId}`, method: 'put' },
      { url: `/api/admin/role-permission-assign/${roleId}/${permissionId}`, method: 'put' }
    )
  },

  // 从角色移除权限
  removePermissionFromRole(roleId, permissionId) {
    return requestWithFallback(
      { url: `/api/v1/admin/role-permission-assign/${roleId}/${permissionId}`, method: 'delete' },
      { url: `/api/admin/role-permission-assign/${roleId}/${permissionId}`, method: 'delete' }
    )
  },

  // 为用户分配权限
  assignPermissionToUser(userId, permissionId) {
    return requestWithFallback(
      { url: `/api/v1/admin/user-permission-assign/${userId}/${permissionId}`, method: 'put' },
      { url: `/api/admin/user-permission-assign/${userId}/${permissionId}`, method: 'put' }
    )
  },

  // 从用户移除权限
  removePermissionFromUser(userId, permissionId) {
    return requestWithFallback(
      { url: `/api/v1/admin/user-permission-assign/${userId}/${permissionId}`, method: 'delete' },
      { url: `/api/admin/user-permission-assign/${userId}/${permissionId}`, method: 'delete' }
    )
  },

  // 为用户分配角色
  assignRoleToUser(userId, roleId) {
    return requestWithFallback(
      { url: `/api/v1/admin/user-role-assign/${userId}/${roleId}`, method: 'put' },
      { url: `/api/admin/user-role-assign/${userId}/${roleId}`, method: 'put' }
    )
  },

  // 从用户移除角色
  removeRoleFromUser(userId, roleId) {
    return requestWithFallback(
      { url: `/api/v1/admin/user-role-assign/${userId}/${roleId}`, method: 'delete' },
      { url: `/api/admin/user-role-assign/${userId}/${roleId}`, method: 'delete' }
    )
  },

  // 根据角色获取用户（后端不支持时回退为按 role_id 过滤的 users 接口）
  getUsersByRole(roleId, params = {}) {
    return requestWithFallback(
      { url: `/api/v1/admin/roles/${roleId}/users`, method: 'get', params },
      { url: `/api/admin/roles/${roleId}/users`, method: 'get', params }
    )
  },

  // 批量为角色分配权限（前端聚合）
  batchAssignPermissionsToRole(roleId, permissionIds = []) {
    const ids = Array.isArray(permissionIds) ? permissionIds : []
    return Promise.all(ids.map((permissionId) => this.assignPermissionToRole(roleId, permissionId)))
  },

  // 批量为用户分配角色（前端聚合）
  batchAssignRolesToUser(userId, roleIds = []) {
    const ids = Array.isArray(roleIds) ? roleIds : []
    return Promise.all(ids.map((roleId) => this.assignRoleToUser(userId, roleId)))
  },
}

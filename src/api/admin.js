import request from '../utils/request'
import { ElMessage } from 'element-plus'

// 管理员登录
const adminLogin = async (email, password) => {
  try {
    const response = await request({
      url: '/api/auth/login',
      method: 'POST',
      data: {
        email,
        password
      }
    })
    return response
  } catch (error) {
    throw error
  }
}

// 获取用户列表
const getUsers = async (params = {}) => {
  try {
    const response = await request({
      url: '/api/v1/admin/users',
      method: 'GET',
      params
    })
    return response
  } catch (error) {
    if (error.response?.status === 404) {
      try {
        const response = await request({
          url: '/api/admin/users',
          method: 'GET',
          params
        })
        return response
      } catch (fallbackError) {
        throw fallbackError
      }
    }
    throw error
  }
}

// 删除用户
const deleteUser = async (userId) => {
  try {
    const response = await request({
      url: `/api/v1/admin/users/${userId}`,
      method: 'DELETE'
    })
    
    ElMessage.success('用户删除成功')
    return response
  } catch (error) {
    throw error
  }
}

// 更新用户角色
const updateUserRole = async (userId, role) => {
  try {
    const response = await request({
      url: `/api/v1/admin/users/${userId}/role`,
      method: 'PUT',
      data: { role }
    })
    
    ElMessage.success('用户角色更新成功')
    return response
  } catch (error) {
    throw error
  }
}

// 更新用户状态
const updateUserStatus = async (userId, status) => {
  try {
    const payload = {
      status
    }
    
    const response = await request({
      url: `/api/v1/admin/users/${userId}/status`,
      method: 'PUT',
      data: payload
    })
    
    ElMessage.success('用户状态更新成功')
    return response
  } catch (error) {
    console.error('更新用户状态失败', error)
    console.error('错误详情:', error.response?.data)
    throw error
  }
}

// 创建用户
const createUser = async (data) => {
  try {
    const response = await request({
      url: '/api/v1/admin/users',
      method: 'POST',
      data
    })
    
    ElMessage.success('用户创建成功')
    return response
  } catch (error) {
    if (error.response?.status === 404) {
      try {
        const response = await request({
          url: '/api/admin/users',
          method: 'POST',
          data
        })
        ElMessage.success('用户创建成功')
        return response
      } catch (fallbackError) {
        throw fallbackError
      }
    }
    throw error
  }
}

// 更新用户
const updateUser = async (userId, data) => {
  try {
    const response = await request({
      url: `/api/v1/admin/users/${userId}`,
      method: 'PUT',
      data
    })
    
    ElMessage.success('用户更新成功')
    return response
  } catch (error) {
    if (error.response?.status === 404) {
      try {
        const response = await request({
          url: `/api/admin/users/${userId}`,
          method: 'PUT',
          data
        })
        ElMessage.success('用户更新成功')
        return response
      } catch (fallbackError) {
        throw fallbackError
      }
    }
    throw error
  }
}

// 获取论文列表
const getPapers = async (params = {}) => {
  try {
    const response = await request({
      url: '/api/v1/admin/papers',
      method: 'GET',
      params
    })
    return response
  } catch (error) {
    throw error
  }
}

// 删除单个论文
const deletePaper = async (paperId) => {
  try {
    const response = await request({
      url: `/api/v1/admin/papers/${paperId}`,
      method: 'DELETE'
    })
    return response
  } catch (error) {
    throw error
  }
}

// 批量删除论文（软删除，可恢复）
const batchDeletePapers = async (paperIds) => {
  try {
    const response = await request({
      url: '/api/v1/admin/papers/batch-delete',
      method: 'POST',
      data: { ids: paperIds }
    })
    return response
  } catch (error) {
    throw error
  }
}

// 批量永久删除论文（硬删除 + 删除服务器文件，不可恢复）
const batchForceDeletePapers = async (paperIds) => {
  try {
    const response = await request({
      url: '/api/v1/admin/papers/batch-force-delete',
      method: 'POST',
      data: { ids: paperIds }
    })
    return response
  } catch (error) {
    throw error
  }
}

// 恢复单个论文
const restorePaper = async (paperId) => {
  try {
    const response = await request({
      url: `/api/v1/admin/papers/${paperId}/restore`,
      method: 'POST'
    })
    return response
  } catch (error) {
    throw error
  }
}

// 批量恢复论文
const batchRestorePapers = async (paperIds) => {
  try {
    const response = await request({
      url: '/api/v1/admin/papers/batch-restore',
      method: 'POST',
      data: { ids: paperIds }
    })
    return response
  } catch (error) {
    throw error
  }
}

// 管理员检查单篇论文
const checkPaperFormat = async (paperId) => {
  try {
    const response = await request({
      url: `/api/v1/admin/papers/${paperId}/check-format`,
      method: 'POST'
    })
    return response
  } catch (error) {
    throw error
  }
}

// 管理员批量检查论文
const batchCheckPapers = async (paperIds) => {
  try {
    const response = await request({
      url: '/api/v1/admin/papers/batch-check',
      method: 'POST',
      data: { ids: paperIds }
    })
    return response
  } catch (error) {
    throw error
  }
}

// 管理员下载论文原文件
const downloadPaperFile = async (paperId) => {
  try {
    const response = await request({
      url: `/api/v1/admin/papers/${paperId}/file`,
      method: 'GET',
      responseType: 'blob'
    })
    return response
  } catch (error) {
    throw error
  }
}

// 获取订单列表
const getOrders = async (params = {}) => {
  try {
    const response = await request({
      url: '/api/v1/admin/orders',
      method: 'GET',
      params
    })
    return response
  } catch (error) {
    throw error
  }
}

// 获取管理员控制台数据
const getAdminDashboard = async () => {
  try {
    const response = await request({
      url: '/api/v1/admin/dashboard',
      method: 'GET'
    })
    return response
  } catch (error) {
    throw error
  }
}

// 获取系统统计数据
const getSystemStats = async () => {
  try {
    const response = await request({
      url: '/api/v1/admin/stats',
      method: 'GET'
    })
    return response
  } catch (error) {
    throw error
  }
}

// 获取支付设置
const getPaymentSettings = async (provider) => {
  try {
    const response = await request({
      url: `/api/v1/admin/settings/payment/${provider}`,
      method: 'GET'
    })
    return response
  } catch (error) {
    throw error
  }
}

// 更新支付设置
const updatePaymentSettings = async (provider, payload) => {
  try {
    const response = await request({
      url: `/api/v1/admin/settings/payment/${provider}`,
      method: 'PUT',
      data: payload
    })
    return response
  } catch (error) {
    throw error
  }
}

// 支付健康检查
const testPayment = async (provider) => {
  try {
    const response = await request({
      url: `/api/v1/admin/settings/payment/${provider}/test`,
      method: 'POST'
    })
    return response
  } catch (error) {
    throw error
  }
}

const getSecuritySettings = async () => {
  try {
    const response = await request({
      url: '/api/v1/admin/settings/security',
      method: 'GET'
    })
    return response
  } catch (error) {
    throw error
  }
}

const updateSecuritySettings = async (payload) => {
  try {
    const response = await request({
      url: '/api/v1/admin/settings/security',
      method: 'PUT',
      data: payload
    })
    return response
  } catch (error) {
    throw error
  }
}

const getPaymentConfig = async () => {
  try {
    const response = await request({
      url: '/api/v1/admin/settings/payment-config',
      method: 'GET'
    })
    return response
  } catch (error) {
    throw error
  }
}

const updatePaymentConfig = async (payload) => {
  try {
    const response = await request({
      url: '/api/v1/admin/settings/payment-config',
      method: 'PUT',
      data: payload
    })
    return response
  } catch (error) {
    throw error
  }
}

// ==================== 菜单管理 ====================

// 获取菜单树
const getMenuTree = async () => {
  try {
    const response = await request({
      url: '/api/admin/menus/tree',
      method: 'GET'
    })
    return response
  } catch (error) {
    throw error
  }
}

// 获取用户菜单
const getUserMenus = async () => {
  try {
    const response = await request({
      url: '/api/admin/menus/user',
      method: 'GET'
    })
    return response
  } catch (error) {
    throw error
  }
}

// 获取所有菜单
const getAllMenus = async () => {
  try {
    const response = await request({
      url: '/api/admin/menus',
      method: 'GET'
    })
    return response
  } catch (error) {
    throw error
  }
}

// 创建菜单
const createMenu = async (data) => {
  try {
    const response = await request({
      url: '/api/admin/menus',
      method: 'POST',
      data
    })
    return response
  } catch (error) {
    throw error
  }
}

// 更新菜单
const updateMenu = async (id, data) => {
  try {
    const response = await request({
      url: `/api/admin/menus/${id}`,
      method: 'PUT',
      data
    })
    return response
  } catch (error) {
    throw error
  }
}

// 删除菜单
const deleteMenu = async (id) => {
  try {
    const response = await request({
      url: `/api/admin/menus/${id}`,
      method: 'DELETE'
    })
    return response
  } catch (error) {
    throw error
  }
}

// 获取角色菜单
const getRoleMenus = async (roleId) => {
  try {
    const response = await request({
      url: `/api/admin/roles/${roleId}/menus`,
      method: 'GET'
    })
    return response
  } catch (error) {
    throw error
  }
}

// 为角色分配菜单
const assignMenusToRole = async (roleId, data) => {
  try {
    const response = await request({
      url: `/api/admin/roles/${roleId}/menus`,
      method: 'POST',
      data
    })
    return response
  } catch (error) {
    throw error
  }
}

export {
  adminLogin,
  getUsers,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  createUser,
  updateUser,
  getPapers,
  deletePaper,
  batchDeletePapers,
  batchForceDeletePapers,
  restorePaper,
  batchRestorePapers,
  checkPaperFormat,
  batchCheckPapers,
  downloadPaperFile,
  getOrders,
  getAdminDashboard,
  getSystemStats,
  getPaymentSettings,
  updatePaymentSettings,
  testPayment,
  getSecuritySettings,
  updateSecuritySettings,
  getPaymentConfig,
  updatePaymentConfig,
  // 菜单管理
  getMenuTree,
  getUserMenus,
  getAllMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  getRoleMenus,
  assignMenusToRole
}

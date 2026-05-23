import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  login as apiLogin, 
  getProfile, 
  updateProfile, 
  changePassword, 
  refreshToken, 
  logout as apiLogout, 
  isAuthenticated, 
  getCurrentUser,
  getWeChatLoginUrl,
  getAlipayLoginUrl,
  handleWeChatCallback,
  handleAlipayCallback,
  uploadAvatar
} from '../api/auth'
import rbacApi from '@/api/rbac'
import tokenManager from '@/utils/tokenManager'
import { usePermissionStore } from '@/stores/permission'

export const useUserStore = defineStore('user', () => {
  const user = ref(getCurrentUser())
  const token = ref(tokenManager.getAccessToken())
  const isLoading = ref(false)

  const permissions = ref([])
  const roles = ref([])
  const menus = ref([])  // 用户可访问的菜单
  const dataScope = ref('self')
  const permissionLoaded = ref(false)

  const isLoggedIn = computed(() => !!token.value && tokenManager.isAuthenticated())

  const setAuthSession = (authData) => {
    const accessToken = authData?.access_token || authData?.token
    if (!accessToken) {
      throw new Error('登录失败：服务端未返回访问令牌')
    }

    token.value = accessToken
    localStorage.setItem('token', accessToken)

    tokenManager.setTokens(
      accessToken,
      authData.refresh_token,
      authData.token_type || 'Bearer',
      authData.expires_in || 3600
    )

    if (authData.user) {
      user.value = authData.user
      localStorage.setItem('user', JSON.stringify(authData.user))
    } else {
      user.value = null
      localStorage.removeItem('user')
    }

    permissionLoaded.value = false
    return accessToken
  }

  // 获取用户信息
  const getInfo = async () => {
    try {
      const profile = await getProfile()
      user.value = profile
      
      // 加载用户权限
      await loadUserPermissions()
      
      return profile
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  const login = async (email, password) => {
    isLoading.value = true
    try {
      const result = await apiLogin(email, password)

      const accessToken = result.access_token || result.token
      
      if (accessToken) {
        token.value = accessToken
        user.value = result.user || null
        
        tokenManager.setTokens(
          accessToken,
          result.refresh_token,
          result.token_type || 'Bearer',
          result.expires_in || 3600
        )
        
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user))
        } else {
          localStorage.removeItem('user')
        }

        return true
      } else {
        throw new Error('登录失败：服务器返回无效响应')
      }
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

 

  const loadProfile = async () => {
    isLoading.value = true
    try {
      const profile = await getProfile()
      user.value = profile
      return profile
    } catch (error) {

      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateUserProfile = async (userData) => {
    isLoading.value = true
    try {
      const updatedProfile = await updateProfile(userData)
      user.value = updatedProfile
      return updatedProfile
    } catch (error) {

      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 上传头像
  const uploadUserAvatar = async (file, onProgress) => {
    isLoading.value = true
    try {
      const result = await uploadAvatar(file, onProgress)
      if (result && result.avatar_url) {
        // 更新用户状态
        if (user.value) {
          user.value.avatar = result.avatar_url
        }
        // 更新本地存储
        const currentUser = getCurrentUser()
        if (currentUser) {
          currentUser.avatar = result.avatar_url
          localStorage.setItem('user', JSON.stringify(currentUser))
        }
      }
      return result
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updatePassword = async (oldPassword, newPassword) => {
    isLoading.value = true
    try {
      const result = await changePassword(oldPassword, newPassword)
      return result
    } catch (error) {

      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 微信登录 - 获取登录URL
  const wechatLogin = async () => {
    try {
      const result = await getWeChatLoginUrl()
      return result
    } catch (error) {

      throw error
    }
  }

  // 支付宝登录 - 获取登录URL
  const alipayLogin = async () => {
    try {
      const result = await getAlipayLoginUrl()
      return result
    } catch (error) {

      throw error
    }
  }

  // 处理微信登录回调
  const handleWeChatLoginCallback = async (code, state = null) => {
    try {
      const result = await handleWeChatCallback(code, state)
      setAuthSession(result)
      return true
    } catch (error) {

      throw error
    }
  }

  // 处理支付宝登录回调
  const handleAlipayLoginCallback = async (authCode) => {
    try {
      const result = await handleAlipayCallback(authCode)
      setAuthSession(result)
      return true
    } catch (error) {

      throw error
    }
  }

  const refreshUserToken = async () => {
    try {
      const newToken = await refreshToken()
      token.value = newToken
      return newToken
    } catch (error) {

      throw error
    }
  }

  const logout = () => {
    apiLogout()
    user.value = null
    token.value = null
    tokenManager.clearTokens()
    localStorage.removeItem('user')
    clearPermissions()
    try {
      usePermissionStore().resetPermission()
    } catch (_) {}
  }

  const resetToken = () => {
    token.value = null
    user.value = null
    tokenManager.clearTokens()
    localStorage.removeItem('user')
    clearPermissions()
    try {
      usePermissionStore().resetPermission()
    } catch (_) {}
  }

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUser = (userData) => {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  const hasPermission = computed(() => (perm) => {
    return permissions.value.includes(perm)
  })

  const hasAnyPermission = computed(() => (perms) => {
    return perms.some(p => permissions.value.includes(p))
  })

  const hasAllPermissions = computed(() => (perms) => {
    return perms.every(p => permissions.value.includes(p))
  })

  const hasRole = computed(() => (roleCode) => {
    return roles.value.some(r => r.code === roleCode)
  })

  const hasAnyRole = (roleCodes) => {
    return roleCodes.some(r => roles.value.some(ur => ur.code === r))
  }

  const isAdmin = computed(() => {
    if (hasAnyRole(['admin', 'super_admin'])) {
      return true
    }
    if (user.value?.role === 'admin' || user.value?.role === 'super_admin') {
      return true
    }
    return false
  })

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.items)) return payload.items
    if (Array.isArray(payload?.list)) return payload.list
    if (Array.isArray(payload?.results)) return payload.results
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.data?.items)) return payload.data.items
    return []
  }

  const normalizePermissionCode = (perm) => {
    if (typeof perm === 'string') return perm
    if (!perm || typeof perm !== 'object') return ''
    // 支持从菜单对象中提取 permission 字段
    return perm.permission || perm.code || perm.permission_code || ''
  }

  // 加载用户权限（基于菜单权限模型）
  const loadUserPermissions = async () => {
    if (!user.value?.id || permissionLoaded.value) {
      console.log('跳过加载权限：user.value?.id =', user.value?.id, 'permissionLoaded =', permissionLoaded.value)
      return
    }

    try {
      console.log('开始加载用户权限...')
      // 获取当前登录用户的菜单树（从后端动态加载）
      console.log('调用 getUserMenuTree...')
      const menusResponse = await (rbacApi.getUserMenuTree ? rbacApi.getUserMenuTree() : Promise.resolve([]))
      console.log('getUserMenuTree 返回:', menusResponse)
      
      const roleResponse = rbacApi.getUserRoles ? await rbacApi.getUserRoles(user.value.id) : Promise.resolve([])
      console.log('getUserRoles 返回:', roleResponse)

      // 从响应中提取菜单数据（request 拦截器可能已返回 response.data.data，即直接为数组）
      // 注意：不能用 const menus 避免遮蔽外层 ref
      const menuData = Array.isArray(menusResponse)
        ? menusResponse
        : (menusResponse?.data ?? menusResponse?.items ?? [])
      console.log('提取的菜单数据:', menuData)
      
      const roleList = normalizeList(roleResponse)

      // 从菜单树中提取所有权限代码
      const extractPermissions = (menuList) => {
        const perms = []
        const traverse = (list) => {
          if (!Array.isArray(list)) return
          for (const menu of list) {
            if (menu.permission) {
              perms.push(menu.permission)
            }
            if (Array.isArray(menu.children)) {
              traverse(menu.children)
            }
          }
        }
        traverse(menuList)
        return perms
      }

      permissions.value = extractPermissions(menuData)
      roles.value = roleList
      menus.value = menuData
      console.log('✅ 用户菜单加载完成:', menus.value)
      console.log('✅ menus.value 赋值后:', menus.value.length)
      permissionLoaded.value = true
      
      // 强制触发响应式更新
      console.log('🔄 触发菜单更新事件')
    } catch (error) {
      console.error('加载用户权限失败:', error)
      permissions.value = []
      roles.value = []
      menus.value = []
      permissionLoaded.value = false
    }
  }
  const checkPermission = (perm) => {
    return permissions.value.includes(perm)
  }

  const checkAnyPermission = (perms) => {
    return perms.some(p => permissions.value.includes(p))
  }

  const checkRole = (roleCode) => {
    return roles.value.some(r => r.code === roleCode)
  }

  const clearPermissions = () => {
    permissions.value = []
    roles.value = []
    menus.value = []
    dataScope.value = 'self'
    permissionLoaded.value = false
  }

  const setPermissions = (perms) => {
    permissions.value = perms
    permissionLoaded.value = true
  }

  const setRoles = (roleList) => {
    roles.value = roleList
  }

  return {
    user,
    token,
    isLoading,
    isLoggedIn,
    permissions,
    roles,
    menus,  // 添加 menus 导出
    dataScope,
    permissionLoaded,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    login,
    getInfo,
    loadProfile,
    updateUserProfile,
    uploadUserAvatar,
    updatePassword,
    refreshUserToken,
    logout,
    resetToken,
    setAuthSession,
    setToken,
    setUser,
    setAuthSession,
    updateUser,
    wechatLogin,
    alipayLogin,
    handleWeChatLoginCallback,
    handleAlipayLoginCallback,
    loadUserPermissions,
    checkPermission,
    checkAnyPermission,
    checkRole,
    clearPermissions,
    setPermissions,
    setRoles
  }
})

import request from '../utils/request'
import tokenManager from '../utils/tokenManager'
import { ElMessage } from 'element-plus'

const login = async (email, password) => {
  try {
    const response = await request({
      url: '/api/auth/login',
      method: 'POST',
      data: {
        email,
        password
      }
    })
    
    const token = response.token || response.access_token
    
    if (token) {
      localStorage.setItem('token', token)
      tokenManager.setTokens(
        response.access_token || token,
        response.refresh_token,
        response.token_type || 'Bearer',
        response.expires_in || 3600
      )
    }
    
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    
    return response
  } catch (error) {
    throw error
  }
}


const getProfile = async () => {
  try {
    const response = await request({
      url: '/api/v1/auth/profile',
      method: 'GET'
    })
    
    localStorage.setItem('user', JSON.stringify(response))
    
    return response
  } catch (error) {
    throw error
  }
}

const updateProfile = async (userData) => {
  try {
    const response = await request({
      url: '/api/v1/auth/profile',
      method: 'PUT',
      data: userData
    })
    
    localStorage.setItem('user', JSON.stringify(response))
    
    return response
  } catch (error) {
    throw error
  }
}

const changePassword = async (oldPassword, newPassword) => {
  try {
    const response = await request({
      url: '/api/v1/auth/password',
      method: 'PUT',
      data: {
        old_password: oldPassword,
        new_password: newPassword
      }
    })
    
    return response
  } catch (error) {
    throw error
  }
}

const refreshToken = async (refreshToken) => {
  try {
    const response = await request({
      url: '/api/v1/auth/refresh',
      method: 'POST',
      data: {
        refresh_token: refreshToken
      }
    })
    
    if (response.access_token) {
      tokenManager.setTokens(
        response.access_token,
        response.refresh_token || tokenManager.getRefreshToken(),
        response.token_type,
        response.expires_in
      )
      
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user))
      }
      
      return response.access_token
    }
  } catch (error) {
    tokenManager.clearTokens()
    localStorage.removeItem('user')
    throw error
  }
}

const logout = async () => {
  try {
    await request({
      url: '/api/v1/auth/logout',
      method: 'POST'
    })
  } catch (error) {
    console.error('Logout request failed:', error)
  } finally {
    tokenManager.clearTokens()
    localStorage.removeItem('user')
  }
}

const isAuthenticated = () => {
  return tokenManager.isAuthenticated()
}

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  if (userStr && userStr !== 'undefined' && userStr !== 'null') {
    try {
      return JSON.parse(userStr)
    } catch (error) {
      localStorage.removeItem('user')
      return null
    }
  }
  return null
}

// 发送密码重置验证码
const sendResetCode = async (email) => {
  try {
    const response = await request({
      url: '/api/v1/auth/forgot-password',
      method: 'POST',
      data: { email }
    })
    return response
  } catch (error) {
    throw error
  }
}

// 验证重置码
const verifyResetCode = async (email, code) => {
  try {
    const response = await request({
      url: '/api/v1/auth/verify-reset-code',
      method: 'POST',
      data: { email, code }
    })
    return response
  } catch (error) {
    throw error
  }
}

// 通过重置码重置密码
const resetPasswordByCode = async (resetToken, newPassword) => {
  try {
    const response = await request({
      url: '/api/v1/auth/reset-password',
      method: 'POST',
      data: {
        reset_token: resetToken,
        new_password: newPassword
      }
    })
    return response
  } catch (error) {
    throw error
  }
}



// 获取微信登录URL — interceptor 已解包，直接返回 { auth_url, state }
const getWeChatLoginUrl = async () => {
  const response = await request({
    url: '/api/v1/auth/wechat/login-url',
    method: 'GET'
  })
  return response
}

// 获取支付宝登录URL
const getAlipayLoginUrl = async () => {
  const response = await request({
    url: '/api/v1/auth/alipay/login-url',
    method: 'GET'
  })
  return response
}

const createAlipayQrSession = async () => {
  const response = await request({
    url: '/api/v1/auth/alipay/qr-session',
    method: 'GET'
  })
  return response
}

const getAlipayQrSessionStatus = async (sessionId) => {
  const response = await request({
    url: `/api/v1/auth/alipay/qr-session/${sessionId}/status`,
    method: 'GET'
  })
  return response
}

// 处理微信登录回调 — 后端 GET callback 返回 { access_token, ... }
const handleWeChatCallback = async (code, state = null) => {
  const response = await request({
    url: '/api/v1/auth/wechat/callback',
    method: 'GET',
    params: state ? { code, state } : { code }
  })
  return response
}

// 处理支付宝登录回调 — GET redirect 带 auth_code
const handleAlipayCallback = async (authCode) => {
  const response = await request({
    url: '/api/v1/auth/alipay/callback',
    method: 'GET',
    params: { auth_code: authCode }
  })
  return response
}

// 检查论文相关服务付费状态
const checkPaperPaymentStatus = async (params) => {
  try {
    const response = await request({
      url: '/api/auth/payment/check-paper',
      method: 'GET',
      params
    })
    return response
  } catch (error) {
    throw error
  }
}

// 检查通用服务付费状态
const checkServicePaymentStatus = async (params) => {
  try {
    const response = await request({
      url: '/api/v1/auth/payment/check-service',
      method: 'GET',
      params
    })
    return response
  } catch (error) {
    throw error
  }
}

// 获取用户剩余免费检查次数
const getUserFreeChecks = async () => {
  try {
    const response = await request({
      url: '/api/v1/auth/payment/free-checks',
      method: 'GET'
    })
    return response
  } catch (error) {
    throw error
  }
}

// 上传用户头像
const uploadAvatar = async (file, onProgress) => {
  try {
    const formData = new FormData()
    formData.append('file', file)  // 修改为 'file' 以匹配后端参数
    
    const response = await request({
      url: '/api/v1/admin/upload/image',  // 修改为实际的上传接口
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      }
    })
    
    // 返回头像 URL
    return response ? { avatar_url: response.data?.url } : null
  } catch (error) {
    throw error
  }
}

export { 
  login, 
  getProfile, 
  updateProfile, 
  changePassword, 
  refreshToken, 
  logout, 
  isAuthenticated, 
  getCurrentUser,
  sendResetCode,
  verifyResetCode,
  resetPasswordByCode,
  getWeChatLoginUrl,
  getAlipayLoginUrl,
  createAlipayQrSession,
  getAlipayQrSessionStatus,
  handleWeChatCallback,
  handleAlipayCallback,
  checkPaperPaymentStatus,
  checkServicePaymentStatus,
  getUserFreeChecks,
  uploadAvatar
}

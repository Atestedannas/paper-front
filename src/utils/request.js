import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import tokenManager from './tokenManager'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ,
  timeout: 600000
})

let isRefreshing = false
let refreshSubscribers = []

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback)
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach(callback => callback(newToken))
  refreshSubscribers = []
}

async function handleTokenRefresh() {
  try {
    const newToken = await tokenManager.refreshAccessToken()
    onRefreshed(newToken)
    return newToken
  } catch (error) {
    onRefreshed(null)
    tokenManager.clearTokens()
    localStorage.removeItem('user')
    router.push('/login')
    throw error
  }
}

request.interceptors.request.use(
  async config => {
    try {
      const authHeader = tokenManager.getAuthorizationHeader()
      if (authHeader) {
        config.headers.Authorization = authHeader
      }
    } catch (error) {
      console.warn('Failed to get authorization header:', error)
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    if (response.config.responseType === 'blob') {
      return response
    }

    if (response.data && response.data.data) {
      return response.data.data
    }
    return response.data
  },
  async error => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (newToken) {
              originalRequest.headers.Authorization = tokenManager.getAuthorizationHeader()
              resolve(request(originalRequest))
            } else {
              reject(error)
            }
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await handleTokenRefresh()
        originalRequest.headers.Authorization = tokenManager.getAuthorizationHeader()
        return request(originalRequest)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response) {
      switch (error.response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          tokenManager.clearTokens()
          localStorage.removeItem('user')
          if (router.currentRoute.value.path !== '/login' && router.currentRoute.value.path !== '/admin/login') {
            router.push('/login')
          }
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 400: {
          const m = error.response.data?.msg || error.response.data?.message || '请求参数错误'
          ElMessage.error(m)
          break
        }
        case 500: {
          const errMsg = error.response.data?.msg || error.response.data?.message || '服务器内部错误'
          ElMessage.error(errMsg)
          break
        }
        default:
          ElMessage.error(error.response.data?.msg || error.response.data?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }
    return Promise.reject(error)
  }
)

export default request
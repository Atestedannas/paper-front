import { ElMessage } from 'element-plus'

class TokenManager {
  constructor() {
    this.accessToken = null
    this.refreshToken = null
    this.tokenType = 'Bearer'
    this.expiresIn = 0
    this.expiresAt = null
    this.isRefreshing = false
    this.refreshSubscribers = []
    
    this.loadFromStorage()
  }

  loadFromStorage() {
    try {
      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      const tokenType = localStorage.getItem('token_type')
      const expiresIn = localStorage.getItem('expires_in')
      const expiresAt = localStorage.getItem('expires_at')

      if (accessToken) {
        this.accessToken = accessToken
      }
      if (refreshToken) {
        this.refreshToken = refreshToken
      }
      if (tokenType) {
        this.tokenType = tokenType
      }
      if (expiresIn) {
        this.expiresIn = parseInt(expiresIn)
      }
      if (expiresAt) {
        this.expiresAt = new Date(expiresAt)
      }
    } catch (error) {
      console.error('Failed to load tokens from storage:', error)
    }
  }

  saveToStorage() {
    try {
      if (this.accessToken) {
        localStorage.setItem('access_token', this.accessToken)
      } else {
        localStorage.removeItem('access_token')
      }
      
      if (this.refreshToken) {
        localStorage.setItem('refresh_token', this.refreshToken)
      } else {
        localStorage.removeItem('refresh_token')
      }
      
      if (this.tokenType) {
        localStorage.setItem('token_type', this.tokenType)
      }
      
      if (this.expiresIn) {
        localStorage.setItem('expires_in', this.expiresIn.toString())
      }
      
      if (this.expiresAt) {
        localStorage.setItem('expires_at', this.expiresAt.toISOString())
      }
    } catch (error) {
      console.error('Failed to save tokens to storage:', error)
    }
  }

  setTokens(accessToken, refreshToken, tokenType = 'Bearer', expiresIn = 3600) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.tokenType = tokenType
    this.expiresIn = expiresIn
    this.expiresAt = new Date(Date.now() + expiresIn * 1000)
    
    this.saveToStorage()
  }

  getAccessToken() {
    return this.accessToken
  }

  getRefreshToken() {
    return this.refreshToken
  }

  getAuthorizationHeader() {
    if (!this.accessToken) {
      return null
    }
    return `${this.tokenType} ${this.accessToken}`
  }

  isAccessTokenExpired() {
    if (!this.expiresAt) {
      return false
    }
    return new Date() >= this.expiresAt
  }

  isAccessTokenExpiringSoon(thresholdSeconds = 300) {
    if (!this.expiresAt) {
      return false
    }
    const expiresSoon = new Date(Date.now() + thresholdSeconds * 1000)
    return new Date() >= expiresSoon
  }

  isAuthenticated() {
    return !!this.accessToken && !this.isAccessTokenExpired()
  }

  clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    this.tokenType = 'Bearer'
    this.expiresIn = 0
    this.expiresAt = null
    
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_type')
    localStorage.removeItem('expires_in')
    localStorage.removeItem('expires_at')
  }

  subscribeToRefresh(callback) {
    this.refreshSubscribers.push(callback)
  }

  unsubscribeFromRefresh(callback) {
    const index = this.refreshSubscribers.indexOf(callback)
    if (index > -1) {
      this.refreshSubscribers.splice(index, 1)
    }
  }

  notifyRefreshSubscribers(newAccessToken) {
    this.refreshSubscribers.forEach(callback => {
      try {
        callback(newAccessToken)
      } catch (error) {
        console.error('Error in refresh subscriber callback:', error)
      }
    })
  }

  async refreshAccessToken() {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        const callback = (newToken) => {
          if (newToken) {
            resolve(newToken)
          } else {
            reject(new Error('Token refresh failed'))
          }
        }
        this.subscribeToRefresh(callback)
      })
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    this.isRefreshing = true

    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002'
      const response = await fetch(`${baseURL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Token refresh failed')
      }

      const data = await response.json()
      
      if (data.data) {
        const { access_token, refresh_token, token_type, expires_in, user } = data.data
        
        this.setTokens(
          access_token,
          refresh_token || this.refreshToken,
          token_type,
          expires_in
        )
        
        if (user) {
          localStorage.setItem('user', JSON.stringify(user))
        }
        
        this.notifyRefreshSubscribers(access_token)
        
        return access_token
      }
    } catch (error) {
      console.error('Failed to refresh access token:', error)
      this.clearTokens()
      this.notifyRefreshSubscribers(null)
      throw error
    } finally {
      this.isRefreshing = false
      this.refreshSubscribers = []
    }
  }

  async ensureValidAccessToken() {
    if (!this.accessToken) {
      throw new Error('No access token available')
    }

    if (this.isAccessTokenExpired()) {
      return await this.refreshAccessToken()
    }

    if (this.isAccessTokenExpiringSoon()) {
      try {
        return await this.refreshAccessToken()
      } catch (error) {
        console.warn('Failed to proactively refresh token:', error)
      }
    }

    return this.accessToken
  }
}

const tokenManager = new TokenManager()

export default tokenManager

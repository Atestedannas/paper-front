import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from './user'
import tokenManager from '@/utils/tokenManager'

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: vi.fn(),
  getCurrentUser: vi.fn(() => null),
  getWeChatLoginUrl: vi.fn(),
  getAlipayLoginUrl: vi.fn(),
  handleWeChatCallback: vi.fn(),
  handleAlipayCallback: vi.fn(),
  uploadAvatar: vi.fn()
}))

vi.mock('@/api/rbac', () => ({
  default: {}
}))

vi.mock('@/stores/permission', () => ({
  usePermissionStore: () => ({
    resetPermission: vi.fn()
  })
}))

vi.mock('@/utils/tokenManager', () => ({
  default: {
    getAccessToken: vi.fn(() => null),
    isAuthenticated: vi.fn(() => false),
    setTokens: vi.fn(),
    clearTokens: vi.fn()
  }
}))

describe('user store oauth session', () => {
  beforeEach(() => {
    const storage = new Map()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => storage.get(key) || null),
      setItem: vi.fn((key, value) => storage.set(key, String(value))),
      removeItem: vi.fn((key) => storage.delete(key)),
      clear: vi.fn(() => storage.clear())
    })
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('stores token and user from alipay oauth result', () => {
    const store = useUserStore()
    const result = {
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      token_type: 'Bearer',
      expires_in: 7200,
      user: { id: 7, email: 'ali@example.com' }
    }

    store.setAuthSession(result)

    expect(store.token).toBe('access-1')
    expect(store.user).toEqual(result.user)
    expect(localStorage.getItem('token')).toBe('access-1')
    expect(localStorage.getItem('user')).toBe(JSON.stringify(result.user))
    expect(tokenManager.setTokens).toHaveBeenCalledWith('access-1', 'refresh-1', 'Bearer', 7200)
  })

  it('rejects oauth results without token', () => {
    const store = useUserStore()

    expect(() => store.setAuthSession({ user: { id: 7 } })).toThrow('登录失败：服务端未返回访问令牌')
  })
})

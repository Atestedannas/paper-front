import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from '../utils/request'
import {
  createAlipayQrSession,
  getAlipayLoginUrl,
  getAlipayQrSessionStatus,
  handleAlipayCallback,
  resetPasswordByCode,
  sendResetCode,
  verifyResetCode
} from './auth'

vi.mock('../utils/request', () => ({
  default: vi.fn()
}))

vi.mock('../utils/tokenManager', () => ({
  default: {
    setTokens: vi.fn(),
    getRefreshToken: vi.fn(),
    clearTokens: vi.fn(),
    isAuthenticated: vi.fn()
  }
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn()
  }
}))

describe('auth api alipay qr session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an alipay qr login session through the new backend endpoint', async () => {
    const payload = { session_id: 'session-1', auth_url: 'https://example.com' }
    request.mockResolvedValue(payload)

    await expect(createAlipayQrSession()).resolves.toBe(payload)

    expect(request).toHaveBeenCalledWith({
      url: '/api/v1/auth/alipay/qr-session',
      method: 'GET'
    })
  })

  it('polls alipay qr login session status through the new backend endpoint', async () => {
    const payload = { status: 'authorized', access_token: 'token' }
    request.mockResolvedValue(payload)

    await expect(getAlipayQrSessionStatus('session-1')).resolves.toBe(payload)

    expect(request).toHaveBeenCalledWith({
      url: '/api/v1/auth/alipay/qr-session/session-1/status',
      method: 'GET'
    })
  })

  it('gets the alipay oauth login url as mobile and fallback entry', async () => {
    const payload = { auth_url: 'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm' }
    request.mockResolvedValue(payload)

    await expect(getAlipayLoginUrl()).resolves.toBe(payload)

    expect(request).toHaveBeenCalledWith({
      url: '/api/v1/auth/alipay/login-url',
      method: 'GET'
    })
  })

  it('exchanges alipay auth_code through callback endpoint', async () => {
    const payload = { access_token: 'token', user: { id: 1 } }
    request.mockResolvedValue(payload)

    await expect(handleAlipayCallback('auth-code-1')).resolves.toBe(payload)

    expect(request).toHaveBeenCalledWith({
      url: '/api/v1/auth/alipay/callback',
      method: 'GET',
      params: { auth_code: 'auth-code-1' }
    })
  })

  it('returns the unwrapped password reset code response', async () => {
    const payload = { reset_code: '123456' }
    request.mockResolvedValue(payload)

    await expect(sendResetCode('user@example.com')).resolves.toBe(payload)

    expect(request).toHaveBeenCalledWith({
      url: '/api/v1/auth/forgot-password',
      method: 'POST',
      data: { email: 'user@example.com' }
    })
  })

  it('returns the unwrapped reset token response', async () => {
    const payload = { reset_token: 'reset-token' }
    request.mockResolvedValue(payload)

    await expect(verifyResetCode('user@example.com', '123456')).resolves.toBe(payload)

    expect(request).toHaveBeenCalledWith({
      url: '/api/v1/auth/verify-reset-code',
      method: 'POST',
      data: { email: 'user@example.com', code: '123456' }
    })
  })

  it('posts the reset token and new password', async () => {
    const payload = { message: 'password reset successfully' }
    request.mockResolvedValue(payload)

    await expect(resetPasswordByCode('reset-token', 'NewPass1!')).resolves.toBe(payload)

    expect(request).toHaveBeenCalledWith({
      url: '/api/v1/auth/reset-password',
      method: 'POST',
      data: {
        reset_token: 'reset-token',
        new_password: 'NewPass1!'
      }
    })
  })
})

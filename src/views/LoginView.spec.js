import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))
const loginViewSource = readFileSync(resolve(currentDir, 'LoginView.vue'), 'utf8')

describe('LoginView alipay qr login state', () => {
  it('reuses the user store auth session setter after qr authorization', () => {
    expect(loginViewSource).toContain('userStore.setAuthSession(data)')
    expect(loginViewSource).not.toContain("import tokenManager from '../utils/tokenManager'")
  })

  it('renders a backend-owned alipay qr session and polls the desktop login state', () => {
    expect(loginViewSource).toContain('result = await createAlipayQrSession()')
    expect(loginViewSource).toContain('qrSessionId.value = sessionId ||')
    expect(loginViewSource).toContain('scheduleAlipayQrPoll()')
    expect(loginViewSource).toContain('getAlipayQrSessionStatus(qrSessionId.value)')
    expect(loginViewSource).not.toContain('auth.alipay.com/login/index.htm')
  })
})

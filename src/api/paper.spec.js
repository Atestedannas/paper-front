import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from '../utils/request'
import { uploadPaper } from './paper'

vi.mock('../utils/request', () => ({
  default: vi.fn()
}))

describe('paper api uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads papers through the existing v1 endpoint', async () => {
    const response = { data: { id: 'paper-1' } }
    const formData = new FormData()
    const onUploadProgress = vi.fn()
    request.mockResolvedValue(response)

    await expect(uploadPaper(formData, onUploadProgress)).resolves.toBe(response)

    expect(request).toHaveBeenCalledWith({
      url: '/api/v1/papers/upload',
      method: 'POST',
      data: formData,
      timeout: 300000,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    })
  })
})

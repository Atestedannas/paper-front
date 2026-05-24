import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from '../utils/request'
import { downloadPaperJob, getPaperJob, runPaperJob, uploadPaper } from './paper'

vi.mock('../utils/request', () => ({
  default: vi.fn()
}))

describe('paper api uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads papers through the v2 workflow endpoint', async () => {
    const response = { data: { id: 'paper-1' } }
    const formData = new FormData()
    const onUploadProgress = vi.fn()
    request.mockResolvedValue(response)

    await expect(uploadPaper(formData, onUploadProgress)).resolves.toBe(response)

    expect(request).toHaveBeenCalledWith({
      url: '/api/v2/papers',
      method: 'POST',
      data: formData,
      timeout: 300000,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    })
  })

  it('runs paper workflow jobs through the v2 endpoint', async () => {
    const response = { job: { id: 'job-1', status: 'verified_pass' } }
    request.mockResolvedValue(response)

    await expect(runPaperJob('job-1')).resolves.toBe(response)

    expect(request).toHaveBeenCalledWith({
      url: '/api/v2/jobs/job-1/run',
      method: 'POST',
      timeout: 600000
    })
  })

  it('loads paper workflow job status through the v2 endpoint', async () => {
    const response = { job: { id: 'job-1', status: 'uploaded' } }
    request.mockResolvedValue(response)

    await expect(getPaperJob('job-1')).resolves.toBe(response)

    expect(request).toHaveBeenCalledWith({
      url: '/api/v2/jobs/job-1',
      method: 'GET'
    })
  })

  it('downloads paper workflow job output through the v2 endpoint', async () => {
    const response = new Blob(['docx'])
    request.mockResolvedValue(response)

    await expect(downloadPaperJob('job-1')).resolves.toBe(response)

    expect(request).toHaveBeenCalledWith({
      url: '/api/v2/jobs/job-1/download',
      method: 'GET',
      responseType: 'blob'
    })
  })
})

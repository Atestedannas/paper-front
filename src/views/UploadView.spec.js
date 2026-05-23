import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const uploadViewSource = readFileSync(resolve(currentDir, 'UploadView.vue'), 'utf8')

describe('UploadView production upload modes', () => {
  it('does not expose the unfinished v2 paper job entry', () => {
    expect(uploadViewSource).not.toContain('triggerV2JobUpload')
    expect(uploadViewSource).not.toContain('handleV2JobFileSelect')
    expect(uploadViewSource).not.toContain('v2任务')
  })
})

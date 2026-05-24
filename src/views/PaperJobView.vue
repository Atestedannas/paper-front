<template>
  <div class="paper-job-view">
    <section class="job-panel">
      <el-page-header content="DOCX 闭环任务" @back="router.push('/upload')" />

      <div class="job-body">
        <el-result
          :icon="resultIcon"
          :title="resultTitle"
          :sub-title="resultSubtitle"
        >
          <template #extra>
            <div class="job-meta">
              <el-tag>{{ job?.status || 'pending' }}</el-tag>
              <el-tag type="info">{{ job?.stage || 'queued' }}</el-tag>
            </div>

            <div class="job-actions">
              <el-button :loading="running" type="primary" @click="startJob">
                {{ running ? '处理中...' : '重新运行任务' }}
              </el-button>
              <el-button v-if="canDownload" type="success" :loading="downloading" @click="downloadResult">
                下载修正稿
              </el-button>
              <el-button @click="router.push('/history')">查看历史</el-button>
            </div>
          </template>
        </el-result>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { downloadPaperJob, getPaperJob, runPaperJob } from '../api/paper'

const route = useRoute()
const router = useRouter()
const jobId = computed(() => route.params.jobId)
const job = ref(null)
const running = ref(false)
const downloading = ref(false)
const errorMessage = ref('')
let pollTimer = null

const normalizedJob = (payload) => payload?.job || payload?.data?.job || payload

const canDownload = computed(() => {
  const status = job.value?.status
  return status === 'verified_pass' || Boolean(job.value?.download_path)
})

const resultIcon = computed(() => {
  if (errorMessage.value) return 'error'
  if (canDownload.value) return 'success'
  return 'info'
})

const resultTitle = computed(() => {
  if (errorMessage.value) return '任务处理失败'
  if (canDownload.value) return '复检完成'
  if (running.value) return '正在处理论文'
  return '等待处理'
})

const resultSubtitle = computed(() => {
  if (errorMessage.value) return errorMessage.value
  if (canDownload.value) return '论文已完成格式检查与修正，可以下载修正稿。'
  return '系统正在执行 DOCX 闭环处理，请保持页面打开。'
})

const loadJob = async () => {
  const payload = await getPaperJob(jobId.value)
  job.value = normalizedJob(payload)
}

const startPolling = () => {
  stopPolling()
  pollTimer = window.setInterval(async () => {
    try {
      await loadJob()
      if (canDownload.value || job.value?.status === 'manual_review') {
        stopPolling()
        running.value = false
      }
    } catch (error) {
      stopPolling()
      running.value = false
      errorMessage.value = error?.response?.data?.msg || error.message || '任务状态获取失败'
    }
  }, 3000)
}

const stopPolling = () => {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

const startJob = async () => {
  if (!jobId.value) {
    errorMessage.value = '任务 ID 缺失'
    return
  }
  running.value = true
  errorMessage.value = ''
  try {
    const payload = await runPaperJob(jobId.value)
    job.value = normalizedJob(payload)
    if (!canDownload.value) {
      startPolling()
    }
  } catch (error) {
    errorMessage.value = error?.response?.data?.msg || error.message || '任务运行失败'
  } finally {
    if (canDownload.value || errorMessage.value) {
      running.value = false
    }
  }
}

const downloadResult = async () => {
  downloading.value = true
  try {
    const response = await downloadPaperJob(jobId.value)
    const blob = response?.data instanceof Blob ? response.data : response
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `paper-${jobId.value}.docx`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    ElMessage.error(error?.response?.data?.msg || error.message || '下载失败')
  } finally {
    downloading.value = false
  }
}

onMounted(async () => {
  await startJob()
})

onBeforeUnmount(stopPolling)
</script>

<style scoped>
.paper-job-view {
  min-height: 100vh;
  padding: 56px 20px;
  background: #f5f7fb;
}

.job-panel {
  max-width: 960px;
  margin: 0 auto;
  padding: 28px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
}

.job-body {
  padding: 36px 0 16px;
}

.job-meta,
.job-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.job-actions {
  margin-top: 20px;
}
</style>

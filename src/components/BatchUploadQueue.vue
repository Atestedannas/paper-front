<template>
  <div class="batch-upload">
    <div class="header">
      <h3>批量上传与队列</h3>
      <div class="actions">
        <el-button @click="triggerInput">选择多文件</el-button>
        <input ref="fileInput" type="file" multiple accept=".docx,.pdf" style="display:none" @change="handleSelect" />
        <el-button type="primary" :disabled="queue.length===0 || uploading" @click="startAll">开始全部</el-button>
        <el-button :disabled="queue.length===0" @click="clearQueue">清空队列</el-button>
      </div>
    </div>
    <el-table :data="queue" style="width:100%" stripe>
      <el-table-column label="文件" min-width="220">
        <template #default="{ row }">
          <div class="file-cell">
            <span class="name">{{ row.file.name }}</span>
            <span class="size">{{ formatSize(row.file.size) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="140">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="进度" width="200">
        <template #default="{ row }">
          <el-progress :percentage="row.progress" :status="row.status==='failed'?'exception':row.status==='done'?'success':''" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button size="small" :disabled="uploading || row.status==='uploading' || row.status==='done'" @click="startOne(row)">开始</el-button>
          <el-button size="small" :disabled="row.status!=='failed'" @click="retry(row)">重试</el-button>
          <el-button size="small" type="danger" @click="remove(row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadPaper } from '../api/paper'

const fileInput = ref()
const queue = ref([])
const uploading = ref(false)

const triggerInput = () => fileInput.value?.click()

const handleSelect = (e) => {
  const files = Array.from(e.target.files || [])
  files.forEach(f => {
    queue.value.push({ file: f, progress: 0, status: 'pending', paperId: null })
  })
  e.target.value = ''
}

const startAll = async () => {
  uploading.value = true
  for (const item of queue.value) {
    if (item.status === 'pending' || item.status === 'failed') {
      await startUpload(item)
    }
  }
  uploading.value = false
}

const startOne = async (row) => {
  uploading.value = true
  await startUpload(row)
  uploading.value = false
}

const retry = async (row) => {
  row.status = 'pending'
  row.progress = 0
  await startOne(row)
}

const remove = (row) => {
  queue.value = queue.value.filter(i => i !== row)
}

const clearQueue = () => {
  queue.value = []
}

const startUpload = async (item) => {
  item.status = 'uploading'
  item.progress = 0
  try {
    const formData = new FormData()
    formData.append('file', item.file)
    const response = await uploadPaper(formData, (evt) => {
      if (evt.lengthComputable) item.progress = Math.round((evt.loaded * 100) / evt.total)
    })
    item.status = 'done'
    item.paperId = response?.job_id || response?.id || null
  } catch (e) {
    item.status = 'failed'
    ElMessage.error(`上传失败：${item.file.name}`)
  }
}

const formatSize = (bytes) => {
  const sizes = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes)/Math.log(1024))
  return (bytes/Math.pow(1024,i)).toFixed(2)+' '+sizes[i]
}

const statusType = (s) => s==='done'?'success':s==='failed'?'danger':s==='uploading'?'warning':'info'
const statusText = (s) => ({ pending:'等待', uploading:'上传中', done:'完成', failed:'失败' }[s] || s)
</script>

<style scoped>
.batch-upload { margin-top: 20px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
.header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.file-cell { display:flex; flex-direction:column; }
.name { font-weight:600; color:#111827; }
.size { color:#6b7280; font-size:12px; }
</style>

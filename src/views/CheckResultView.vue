<template>
  <div class="check-result-view">
    <h2>论文格式检查结果</h2>
    
    <div class="paper-info">
        <el-card shadow="hover">
          <h3>{{ paperInfo?.title || '论文信息' }}</h3>
          <div class="paper-meta">
            <p>文件类型: {{ paperInfo?.fileType || '未知' }}</p>
            <p>上传时间: {{ formatDate(paperInfo?.uploadTime) }}</p>
          </div>
        </el-card>
      </div>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="格式检查" name="check">
        <FormatChecker 
          :paper-id="paperId" 
          :paper-title="paperInfo?.title || '未命名论文'"
          :paper-type="paperInfo?.fileType || '未知类型'"
        />
      </el-tab-pane>
      <el-tab-pane label="格式对比" name="compare">
        <FormatCompare />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPaperById } from '../api/paper'
import FormatChecker from '../components/FormatChecker.vue'
import FormatCompare from '../components/FormatCompare.vue'

const route = useRoute()
const paperId = ref(route.params.id)
const activeTab = ref('check')
const paperInfo = ref(null)

const loadPaperInfo = async () => {
  try {
    const paper = await getPaperById(paperId.value)
    if (paper) {
      paperInfo.value = {
        ...paper,
        title:      paper.title     || paper.file_name || '未命名论文',
        fileType:   (paper.file_type || paper.file_name?.split('.').pop() || 'UNKNOWN').toUpperCase(),
        uploadTime: paper.created_at,
      }
    }
  } catch (error) {
    console.error('加载论文信息失败:', error)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}

onMounted(() => {
  loadPaperInfo()
})
</script>

<style scoped>
.check-result-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.check-result-view h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  font-weight: 600;
}

.paper-info {
  margin-bottom: var(--spacing-xl) !important;
}

.paper-info :deep(.el-card__body) {
  padding: var(--spacing-lg);
}

.paper-info h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
  font-size: 1.5rem;
}

.paper-info p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
  font-size: 1rem;
}

.paper-info p:last-child {
  margin-bottom: 0;
}
</style>
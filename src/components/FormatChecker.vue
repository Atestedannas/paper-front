<template>
  <div class="format-checker-container">
    <div class="checker-header">
      <h2>格式检查报告</h2>
      <div class="paper-info">
        <span class="paper-title">{{ paperTitle }}</span>
        <span class="paper-type">{{ paperType }}</span>
      </div>
    </div>
    
    <div class="checker-content">
      <!-- 检查状态 -->
      <div class="check-status" v-if="!checkResult">
        <div class="loading-state">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>正在检查论文格式，请稍候...</span>
        </div>
        <el-progress :percentage="checkProgress" :status="checkProgressStatus" />
        <div class="progress-text">
          检查进度：{{ checkProgress }}%
        </div>
      </div>
      
      <!-- 检查结果 -->
      <div class="check-result" v-else>
        <!-- 检查概览 -->
        <div class="check-overview">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-stats">
              <div class="stat-item">
                <div class="stat-label">总问题数</div>
                <div class="stat-value" :class="checkResult.totalIssues > 0 ? 'warning' : 'success'">
                  {{ checkResult.totalIssues }}
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-label">严重问题</div>
                <div class="stat-value danger">{{ checkResult.severityCount.high }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">中等问题</div>
                <div class="stat-value warning">{{ checkResult.severityCount.medium }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">轻微问题</div>
                <div class="stat-value info">{{ checkResult.severityCount.low }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">检查时间</div>
                <div class="stat-value">{{ formatDate(checkResult.checkTime) }}</div>
              </div>
            </div>
          </el-card>
        </div>
        
        <!-- 检查详情 -->
        <div class="check-details">
          <div class="details-header">
            <h3>问题详情</h3>
            <div class="filter-controls">
              <el-select v-model="filterSeverity" placeholder="按严重程度筛选" size="small">
                <el-option label="全部" value="" />
                <el-option label="严重" value="high" />
                <el-option label="中等" value="medium" />
                <el-option label="轻微" value="low" />
              </el-select>
              <el-select v-model="filterType" placeholder="按问题类型筛选" size="small">
                <el-option label="全部" value="" />
                <el-option label="标题格式" value="title" />
                <el-option label="段落格式" value="paragraph" />
                <el-option label="引用格式" value="citation" />
                <el-option label="目录格式" value="toc" />
                <el-option label="页码格式" value="page" />
                <el-option label="图表格式" value="figure" />
                <el-option label="参考文献格式" value="reference" />
              </el-select>
            </div>
          </div>
          
          <!-- 问题列表 -->
          <div class="issues-list">
            <el-collapse v-model="activeIssue" accordion class="issue-accordion">
              <el-collapse-item
                v-for="issue in filteredIssues"
                :key="issue.id"
                :title="getIssueTitle(issue)"
                :name="issue.id"
                :disabled="false"
              >
                <div class="issue-detail">
                  <div class="detail-item">
                    <span class="detail-label">问题类型：</span>
                    <span class="detail-value">{{ getIssueTypeText(issue.type) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">位置：</span>
                    <span class="detail-value">{{ issue.location }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">严重程度：</span>
                    <el-tag :type="issue.severity === 'high' ? 'danger' : issue.severity === 'medium' ? 'warning' : 'info'">
                      {{ getSeverityText(issue.severity) }}
                    </el-tag>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">描述：</span>
                    <span class="detail-value">{{ issue.description }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">建议：</span>
                    <span class="detail-value">{{ issue.suggestion }}</span>
                  </div>
                  <div class="issue-actions">
                    <el-button type="primary" size="small" @click="applyCorrection(issue.id)">
                      应用修正
                    </el-button>
                    <el-button size="small" @click="ignoreIssue(issue.id)">
                      忽略此问题
                    </el-button>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
            
            <!-- 空状态 -->
            <div class="empty-state" v-if="filteredIssues.length === 0">
              <el-empty description="未找到符合条件的问题" />
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="check-actions">
          <el-button type="primary" size="large" @click="viewCorrections">
            查看修正版本
          </el-button>
          <el-button size="large" @click="exportReport">
            导出检查报告
          </el-button>
          <el-button size="large" @click="applyAllCorrections">
            应用所有修正
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { checkFormat, exportCheckReport } from '../api/paper'
import { checkPaperPaymentStatus } from '../api/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const props = defineProps({
  paperId: {
    type: String,
    required: true
  },
  paperTitle: {
    type: String,
    default: '未命名论文'
  },
  paperType: {
    type: String,
    default: '未知类型'
  }
})

// 检查状态
const checkResult = ref(null)
const checkProgress = ref(0)
const checkProgressStatus = ref('success')
const activeIssue = ref('')

// 筛选条件
const filterSeverity = ref('')
const filterType = ref('')

// 模拟检查结果数据
const mockCheckResult = {
  totalIssues: 12,
  severityCount: {
    high: 3,
    medium: 5,
    low: 4
  },
  checkTime: new Date().toISOString(),
  issues: [
    {
      id: 1,
      type: 'title',
      description: '一级标题格式不正确',
      location: '第1页，第1行',
      severity: 'high',
      suggestion: '建议使用黑体，字号24pt，居中对齐',
      status: 'pending'
    },
    {
      id: 2,
      type: 'paragraph',
      description: '段落首行缩进不正确',
      location: '第2页，第3段',
      severity: 'medium',
      suggestion: '建议首行缩进2字符',
      status: 'pending'
    },
    {
      id: 3,
      type: 'citation',
      description: '引用格式不符合APA规范',
      location: '第3页，第5段',
      severity: 'high',
      suggestion: '建议使用APA 7th引用格式',
      status: 'pending'
    },
    {
      id: 4,
      type: 'toc',
      description: '目录格式不正确',
      location: '第4页',
      severity: 'medium',
      suggestion: '建议使用自动生成目录',
      status: 'pending'
    },
    {
      id: 5,
      type: 'page',
      description: '页码格式不一致',
      location: '全文',
      severity: 'low',
      suggestion: '建议统一页码格式',
      status: 'pending'
    },
    {
      id: 6,
      type: 'figure',
      description: '图表编号格式不正确',
      location: '第5页，图1',
      severity: 'medium',
      suggestion: '建议使用"图1-1"格式',
      status: 'pending'
    },
    {
      id: 7,
      type: 'reference',
      description: '参考文献格式不符合要求',
      location: '第10页，参考文献列表',
      severity: 'high',
      suggestion: '建议使用GB/T 7714-2015格式',
      status: 'pending'
    },
    {
      id: 8,
      type: 'title',
      description: '二级标题格式不正确',
      location: '第2页，第1行',
      severity: 'medium',
      suggestion: '建议使用黑体，字号20pt',
      status: 'pending'
    },
    {
      id: 9,
      type: 'paragraph',
      description: '行距设置不正确',
      location: '全文',
      severity: 'low',
      suggestion: '建议使用1.5倍行距',
      status: 'pending'
    },
    {
      id: 10,
      type: 'citation',
      description: '引用缺少页码',
      location: '第3页，第7段',
      severity: 'medium',
      suggestion: '建议添加引用页码',
      status: 'pending'
    },
    {
      id: 11,
      type: 'figure',
      description: '图表标题位置不正确',
      location: '第6页，图2',
      severity: 'low',
      suggestion: '建议图表标题位于图表下方',
      status: 'pending'
    },
    {
      id: 12,
      type: 'reference',
      description: '参考文献缺少DOI',
      location: '第10页，参考文献1',
      severity: 'medium',
      suggestion: '建议添加DOI链接',
      status: 'pending'
    }
  ]
}

// 筛选后的问题列表
const filteredIssues = computed(() => {
  if (!checkResult.value) return []
  
  return checkResult.value.issues.filter(issue => {
    const matchesSeverity = !filterSeverity.value || issue.severity === filterSeverity.value
    const matchesType = !filterType.value || issue.type === filterType.value
    return matchesSeverity && matchesType
  })
})

// 开始检查
const startCheck = async () => {
  checkProgress.value = 0
  checkProgressStatus.value = 'success'
  
  // 模拟检查过程
  const checkInterval = setInterval(() => {
    checkProgress.value += 5
    if (checkProgress.value >= 100) {
      clearInterval(checkInterval)
      checkResult.value = mockCheckResult
    }
  }, 200)
  
  try {
    // 实际调用API
    // const response = await checkFormat(props.paperId)
    // checkResult.value = response.data
  } catch (error) {
    ElMessage.error('格式检查失败：' + error.message)
    checkProgressStatus.value = 'exception'
  }
}

// 获取问题标题
const getIssueTitle = (issue) => {
  return `${getIssueTypeText(issue.type)} - ${issue.description}`
}

// 获取问题类型文本
const getIssueTypeText = (type) => {
  const typeMap = {
    title: '标题格式',
    paragraph: '段落格式',
    citation: '引用格式',
    toc: '目录格式',
    page: '页码格式',
    figure: '图表格式',
    reference: '参考文献格式'
  }
  return typeMap[type] || type
}

// 获取严重程度文本
const getSeverityText = (severity) => {
  const severityMap = {
    high: '严重',
    medium: '中等',
    low: '轻微'
  }
  return severityMap[severity] || severity
}

// 应用单个修正
const applyCorrection = (issueId) => {
  // 更新问题状态
  const issue = checkResult.value.issues.find(issue => issue.id === issueId)
  if (issue) {
    issue.status = 'applied'
    ElMessage.success('修正已应用')
  }
}

// 忽略问题
const ignoreIssue = (issueId) => {
  // 更新问题状态
  const issue = checkResult.value.issues.find(issue => issue.id === issueId)
  if (issue) {
    issue.status = 'ignored'
    ElMessage.info('问题已忽略')
  }
}

// 查看修正版本
const viewCorrections = () => {
  router.push({ name: 'format-correction', params: { paperId: props.paperId } })
}

// 导出检查报告
const exportReport = async () => {
  try {
    // 实际调用API
    // const response = await exportCheckReport(props.paperId)
    // const blob = new Blob([response.data], { type: 'application/pdf' })
    // const url = window.URL.createObjectURL(blob)
    // const link = document.createElement('a')
    // link.href = url
    // link.download = `格式检查报告_${props.paperId}.pdf`
    // link.click()
    // window.URL.revokeObjectURL(url)
    
    ElMessage.success('报告导出成功')
  } catch (error) {
    ElMessage.error('报告导出失败：' + error.message)
  }
}

// 应用所有修正
const applyAllCorrections = async () => {
  try {
    // 获取支付配置
    const paymentConfig = await checkPaperPaymentStatus({
      service_type: 'format_fix',
      paper_id: props.paperId
    })
    
    if (paymentConfig && paymentConfig.code === 200 && paymentConfig.data) {
      // 计算需要支付的金额
      let price = 0
      
      // 根据服务类型计算费用
      if (props.serviceType === 'check_and_fix') {
        // 检查费+修正费
        if (!paymentConfig.data.is_check_free) {
          price += paymentConfig.data.format_check || 0
        }
        price += paymentConfig.data.format_fix || 0
      } else if (props.serviceType === 'format_check') {
        // 仅检查费
        if (!paymentConfig.data.is_check_free) {
          price += paymentConfig.data.format_check || 0
        }
      } else if (props.serviceType === 'format_fix') {
        // 仅修正费
        price += paymentConfig.data.format_fix || 0
      }
      
      // 检查是否需要付费
      if (price > 0) {
        emit('show-payment', {
          amount: price,
          serviceType: props.serviceType || 'format_fix',
          description: '支付后可应用所有格式修正'
        })
        return
      }
    }
    
    checkResult.value.issues.forEach(issue => {
      if (issue.status === 'pending') {
        issue.status = 'applied'
      }
    })
    ElMessage.success('所有修正已应用')
  } catch (error) {

    ElMessage.error('修正失败：' + error.message)
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 组件挂载时开始检查
onMounted(() => {
  startCheck()
})
</script>

<style scoped>
.format-checker-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  background-color: transparent;
  border-radius: var(--border-radius-lg);
  box-shadow: none;
}

.checker-header {
  margin-bottom: var(--spacing-xl);
}

.checker-header h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
}

.paper-info {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  flex-wrap: wrap;
}

.paper-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.paper-type {
  font-size: 0.9rem;
  color: var(--primary-color);
  background-color: var(--primary-light);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-weight: 500;
}

.checker-content {
  background-color: var(--bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.check-status {
  text-align: center;
  padding: var(--spacing-xxl) 0;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  font-size: 1rem;
  color: var(--text-secondary);
}

.loading-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.progress-text {
  margin-top: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.check-result {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.check-overview {
  margin-bottom: 0;
}

.overview-card {
  margin-bottom: 0;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--spacing-lg);
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-value.danger {
  color: var(--error-color);
}

.stat-value.warning {
  color: var(--warning-color);
}

.stat-value.success {
  color: var(--success-color);
}

.stat-value.info {
  color: var(--text-tertiary);
}

.check-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.details-header h3 {
  color: var(--text-primary);
  margin: 0;
  font-weight: 600;
  font-size: 1.25rem;
}

.filter-controls {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  flex-wrap: wrap;
}

.issues-list {
  margin-top: 0;
}

.issue-accordion {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.issue-accordion :deep(.el-collapse-item__header) {
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  color: var(--text-primary);
  padding: var(--spacing-md) var(--spacing-lg);
}

.issue-accordion :deep(.el-collapse-item__header:hover) {
  background-color: var(--bg-tertiary);
}

.issue-accordion :deep(.el-collapse-item.is-active) .el-collapse-item__header {
  background-color: var(--primary-light);
  border-bottom-color: var(--primary-color);
  color: var(--primary-color);
}

.issue-accordion :deep(.el-collapse-item.is-active) .el-collapse-item__header .el-collapse-item__arrow {
  color: var(--primary-color);
}

.issue-detail {
  padding: var(--spacing-lg);
  background-color: var(--bg-primary);
}

.detail-item {
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.detail-label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 90px;
  flex-shrink: 0;
  font-size: 0.95rem;
}

.detail-value {
  color: var(--text-primary);
  flex: 1;
  line-height: 1.6;
  font-size: 0.95rem;
}

.issue-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.check-actions {
  display: flex;
  gap: var(--spacing-lg);
  justify-content: center;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xxl) 0;
}
</style>

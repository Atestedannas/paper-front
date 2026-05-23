<template>
  <div class="admin-papers">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">论文管理</h1>
      <p class="page-subtitle">管理系统中的所有论文</p>
    </div>

    <!-- 操作栏 -->
    <el-card class="operation-card" shadow="hover">
      <div class="operation-content">
        <div class="search-filter">
          <el-input
            v-model="searchQuery"
            placeholder="搜索论文标题、提交人"
            clearable
            size="large"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="filterStatus"
            placeholder="筛选状态"
            size="large"
            @change="handleFilter"
          >
            <el-option label="全部状态" value="" />
            <el-option label="待检查" value="pending" />
            <el-option label="已检查" value="checked" />
            <el-option label="已修正" value="corrected" />
            <el-option label="已导出" value="exported" />
            <el-option label="检查失败" value="failed" />
          </el-select>

          <el-select
            v-model="filterDeleted"
            placeholder="删除状态"
            size="large"
            @change="handleFilter"
          >
            <el-option label="全部" value="" />
            <el-option label="未删除" value="false" />
            <el-option label="已删除" value="true" />
          </el-select>

          <el-select
            v-model="filterDate"
            placeholder="筛选时间"
            size="large"
            @change="handleFilter"
          >
            <el-option label="全部时间" value="" />
            <el-option label="今天" value="today" />
            <el-option label="近7天" value="7d" />
            <el-option label="近30天" value="30d" />
            <el-option label="近90天" value="90d" />
          </el-select>
        </div>

        <div class="batch-operations">
          <el-select
            v-model="selectedAction"
            placeholder="批量操作"
            size="large"
          >
            <el-option label="批量软删除（可恢复）" value="delete" />
            <el-option label="批量永久删除（删文件）" value="force_delete" />
            <el-option label="批量恢复" value="restore" />
            <el-option label="批量审核" value="check" />
            <el-option label="批量导出" value="export" />
          </el-select>

          <el-button
            type="primary"
            size="large"
            @click="handleBatchAction"
            :disabled="!selectedPapers.length || !selectedAction"
          >
            <el-icon><Check /></el-icon>
            执行{{ selectedPapers.length ? `（${selectedPapers.length}篇）` : '' }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 论文列表 -->
    <el-card class="papers-card" shadow="hover">
      <el-table
        :data="filteredPapers"
        :stripe="true"
        :border="false"
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column type="index" label="序号" width="80" />

        <el-table-column label="论文标题" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ scope.row.display_title || scope.row.title || scope.row.file_name || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="提交人" width="120">
          <template #default="scope">
            {{ scope.row.submitter_name || scope.row.user?.username || '—' }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="格式规范" width="150" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.format_name || scope.row.selected_template?.name || '—' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="提交时间" width="170">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column prop="check_time" label="检查时间" width="170">
          <template #default="scope">
            <span v-if="scope.row.check_time">{{ formatDateTime(scope.row.check_time) }}</span>
            <el-tag v-else type="info" size="small">未检查</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="format_issues" label="格式问题" width="100">
          <template #default="scope">
            <el-tag
              v-if="scope.row.check_time"
              :type="scope.row.format_issues > 0 ? 'danger' : 'success'"
              size="small"
            >
              {{ scope.row.format_issues ?? 0 }} 个
            </el-tag>
            <span v-else class="text-gray">—</span>
          </template>
        </el-table-column>

        <el-table-column prop="file_size" label="文件大小" width="100">
          <template #default="scope">
            {{ scope.row.file_size ? formatFileSize(scope.row.file_size) : '—' }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="420" fixed="right" class-name="col-ops">
          <template #default="scope">
            <div class="op-btns">
              <el-button
                type="primary"
                size="small"
                @click="viewPaper(scope.row.id)"
              >查看</el-button>
              <el-button
                type="warning"
                size="small"
                @click="checkPaper(scope.row.id)"
                :disabled="scope.row.status === 'checked'"
              >检查</el-button>
              <el-button
                v-if="!scope.row.deleted_at"
                type="danger"
                size="small"
                @click="deletePaper(scope.row.id)"
              >删除</el-button>
              <el-button
                v-else
                type="success"
                size="small"
                @click="restorePaper(scope.row.id)"
              >恢复</el-button>
              <el-button
                type="info"
                size="small"
                @click="exportPaper(scope.row.id)"
              >导出</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalPapers"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 论文详情抽屉 -->
    <el-drawer
      v-model="paperDrawerVisible"
      title="论文详情"
      direction="rtl"
      :size="800"
      :destroy-on-close="true"
    >
      <div v-if="selectedPaper" class="paper-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="论文标题">{{ selectedPaper.title }}</el-descriptions-item>
          <el-descriptions-item label="提交人">{{ selectedPaper.user?.username }}</el-descriptions-item>
          <el-descriptions-item label="格式规范">{{ selectedPaper.selected_template?.name }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusText(selectedPaper.status) }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDateTime(selectedPaper.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="检查时间">{{ selectedPaper.check_time ? formatDateTime(selectedPaper.check_time) : '未检查' }}</el-descriptions-item>
          <el-descriptions-item label="字数">{{ selectedPaper.word_count || 0 }}</el-descriptions-item>
          <el-descriptions-item label="页数">{{ selectedPaper.page_count || 0 }}</el-descriptions-item>
          <el-descriptions-item label="格式问题数">{{ selectedPaper.format_issues || 0 }}</el-descriptions-item>
          <el-descriptions-item label="论文描述" :span="2">{{ selectedPaper.description || '无描述' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 格式问题详情 -->
        <div class="format-issues" v-if="selectedPaper.format_issues > 0">
          <h3>格式问题详情</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(issue, index) in selectedPaper.issues"
              :key="index"
              :timestamp="issue.type"
            >
              <div class="issue-content">
                <h4>{{ issue.title }}</h4>
                <p>{{ issue.description }}</p>
                <el-tag :type="issue.severity === 'high' ? 'danger' : issue.severity === 'medium' ? 'warning' : 'info'">
                  {{ issue.severity === 'high' ? '严重' : issue.severity === 'medium' ? '中等' : '轻微' }}
                </el-tag>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Check } from '@element-plus/icons-vue'
import {
  getPapers as apiGetPapers,
  deletePaper as apiDeletePaper,
  batchDeletePapers as apiBatchDeletePapers,
  batchForceDeletePapers as apiBatchForceDeletePapers,
  restorePaper as apiRestorePaper,
  batchRestorePapers as apiBatchRestorePapers
} from '../../api/admin'

const router = useRouter()

// 加载状态
const loading = ref(false)

// 搜索和筛选
const searchQuery = ref('')
const filterStatus = ref('')
const filterDate = ref('')
const filterDeleted = ref('') // 删除状态筛选

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const totalPapers = ref(0)

// 批量操作
const selectedPapers = ref([])
const selectedAction = ref('')

// 论文列表
const papers = ref([])

const loadPapers = async () => {
  try {
    loading.value = true
    const params = {
      q: searchQuery.value || '',
      status: filterStatus.value || '',
      date: filterDate.value || '',
      deleted: filterDeleted.value || '',
      page: currentPage.value,
      page_size: pageSize.value
    }
    const data = await apiGetPapers(params)
    papers.value = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.papers)
      ? data.papers
      : Array.isArray(data)
      ? data
      : []
    totalPapers.value = typeof data?.total === 'number' ? data.total : papers.value.length
    if (typeof data?.page === 'number') currentPage.value = data.page
    if (typeof data?.page_size === 'number') pageSize.value = data.page_size
  } catch (e) {
    ElMessage.error('论文数据加载失败')
  } finally {
    loading.value = false
  }
}

// 筛选后的论文列表
const filteredPapers = computed(() => {
  if (!searchQuery.value && !filterStatus.value && !filterDate.value && !filterDeleted.value) return papers.value
  return papers.value.filter(paper => {
    const matchesSearch =
      !searchQuery.value ||
      paper.title?.includes(searchQuery.value) ||
      paper.user?.username?.includes(searchQuery.value) ||
      paper.user_name?.includes(searchQuery.value)
    const matchesStatus = !filterStatus.value || paper.status === filterStatus.value
    const matchesDate = true
    const matchesDeleted = !filterDeleted.value || 
      (filterDeleted.value === 'true' && paper.deleted_at) ||
      (filterDeleted.value === 'false' && !paper.deleted_at)
    return matchesSearch && matchesStatus && matchesDate && matchesDeleted
  })
})

// 论文详情抽屉
const paperDrawerVisible = ref(false)
const selectedPaper = ref(null)

// 获取状态类型
const getStatusType = (status) => ({
  // 后端真实状态值
  uploaded:          'info',
  parsed:            'info',
  template_selected: 'warning',
  checked:           'success',
  corrected:         'primary',
  exported:          'info',
  failed:            'danger',
  // 兼容旧值
  pending:           'warning',
}[status] || 'default')

// 获取状态文本
const getStatusText = (status) => ({
  uploaded:          '已上传',
  parsed:            '已解析',
  template_selected: '待检查',
  checked:           '已检查',
  corrected:         '已修正',
  exported:          '已导出',
  failed:            '检查失败',
  pending:           '待检查',
}[status] || status || '未知状态')

// 格式化日期为 年月日 时分秒
const formatDateTime = (raw) => {
  if (!raw) return '—'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

// 搜索论文
const handleSearch = () => {
  currentPage.value = 1
  loadPapers()
}

// 筛选论文
const handleFilter = () => {
  currentPage.value = 1
  loadPapers()
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedPapers.value = selection
}

// 批量操作
const handleBatchAction = async () => {
  if (!selectedAction.value) {
    ElMessage.warning('请选择操作类型')
    return
  }

  if (!selectedPapers.value.length) {
    ElMessage.warning('请选择要操作的论文')
    return
  }

  try {
    const count = selectedPapers.value.length
    let message = ''
    let confirmType = 'warning'
    switch (selectedAction.value) {
      case 'delete':
        message = `确定要软删除选中的 ${count} 篇论文吗？软删除可以通过"恢复"操作找回。`
        break
      case 'force_delete':
        message = `⚠️ 永久删除 ${count} 篇论文！\n\n此操作将从数据库和服务器彻底删除论文及其检查记录和源文件，无法恢复！\n\n请谨慎操作。`
        confirmType = 'error'
        break
      case 'restore':
        message = `确定要恢复选中的 ${count} 篇论文吗？`
        break
      case 'check':
        message = `确定要检查选中的 ${count} 篇论文吗？`
        break
      case 'export':
        message = `确定要导出选中的 ${count} 篇论文吗？`
        break
      default:
        return
    }

    await ElMessageBox.confirm(message, '确认操作', {
      confirmButtonText: selectedAction.value === 'force_delete' ? '确认永久删除' : '确定',
      cancelButtonText: '取消',
      type: confirmType,
      dangerouslyUseHTMLString: false
    })

    const ids = selectedPapers.value.map(p => p.id)

    switch (selectedAction.value) {
      case 'delete': {
        await apiBatchDeletePapers(ids)
        ElMessage.success(`${count} 篇论文已软删除（可恢复）`)
        break
      }
      case 'force_delete': {
        // 确保 ids 是字符串数组（UUID 字符串）
        const uuidIds = ids.map(id => String(id))
        if (uuidIds.length === 0) {
          ElMessage.warning('没有有效的论文 ID')
          return
        }
        const res = await apiBatchForceDeletePapers(uuidIds)
        const deleted = res?.deleted_count ?? count
        const fileErrs = Array.isArray(res?.file_errors) ? res.file_errors.length : 0
        if (fileErrs > 0) {
          ElMessage.warning(`${deleted} 篇论文已永久删除，${fileErrs} 个文件删除失败（请手动清理）`)
        } else {
          ElMessage.success(`${deleted} 篇论文及服务器文件已永久删除`)
        }
        break
      }
      case 'restore': {
        await apiBatchRestorePapers(ids)
        ElMessage.success(`${count} 篇论文已恢复`)
        break
      }
      case 'check':
        ElMessage.info('批量检查功能开发中')
        break
      case 'export':
        ElMessage.info('批量导出功能开发中')
        break
    }
    
    // 清空选择
    selectedPapers.value = []
    selectedAction.value = ''
    
    // 刷新列表
    await loadPapers()
  } catch (error) {
    if (error === 'cancel' || error?.message === 'cancel') return
    console.error('批量操作失败:', error)
    // 后端响应字段是 msg，不是 message
    const msg = error?.response?.data?.msg
      || error?.response?.data?.message
      || error?.message
      || '操作失败，请查看控制台'
    ElMessage.error(`操作失败：${msg}`)
  }
}

// 查看论文
const viewPaper = (paperId) => {
  const paper = papers.value.find(p => p.id === paperId)
  if (paper) {
    selectedPaper.value = paper
    paperDrawerVisible.value = true
  }
}

// 检查论文
const checkPaper = (paperId) => {
  // 实际项目中，这里应该调用API检查论文
  const paper = papers.value.find(p => p.id === paperId)
  if (paper) {
    paper.status = 'checked'
    paper.check_time = new Date().toISOString().slice(0, 19).replace('T', ' ')
    paper.format_issues = Math.floor(Math.random() * 5) // 模拟随机生成格式问题数
    ElMessage.success('论文检查完成')
  }
}

// 导出论文
const exportPaper = (paperId) => {
  // 实际项目中，这里应该调用API导出论文
  ElMessage.success('论文导出成功')
}

// 删除论文
const deletePaper = async (paperId) => {
  try {
    const paper = papers.value.find(p => p.id === paperId)
    if (!paper) return
    
    await ElMessageBox.confirm(
      `确定要删除论文 "${paper.title}" 吗？此操作可以恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }
    )
    
    // 调用 API 删除论文
    await apiDeletePaper(paperId)
    ElMessage.success('论文已删除')
    
    // 刷新列表
    await loadPapers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 恢复论文
const restorePaper = async (paperId) => {
  try {
    const paper = papers.value.find(p => p.id === paperId)
    if (!paper) return
    
    await ElMessageBox.confirm(
      `确定要恢复论文 "${paper.title}" 吗？`,
      '确认恢复',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    
    // 调用 API 恢复论文
    await apiRestorePaper(paperId)
    ElMessage.success('论文已恢复')
    
    // 刷新列表
    await loadPapers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('恢复失败')
    }
  }
}

// 分页大小改变
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  loadPapers()
}

// 当前页码改变
const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  loadPapers()
}

// 组件挂载时初始化
onMounted(() => {
  loadPapers()
})
</script>

<style scoped>
.admin-papers {
  width: 100%;
  height: 100%;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

/* 操作栏 */
.operation-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.operation-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.search-filter {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.batch-operations {
  display: flex;
  gap: 16px;
  align-items: center;
}

/* 论文列表 */
.papers-card {
  border-radius: 12px;
  overflow: hidden;
}

/* 分页 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 论文详情 */
.paper-detail {
  padding: 20px;
}

.format-issues {
  margin-top: 24px;
}

.format-issues h3 {
  margin-bottom: 16px;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.issue-content {
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.issue-content h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-weight: 600;
  font-size: 16px;
}

.issue-content p {
  margin: 0 0 8px 0;
  color: #6b7280;
}

.op-btns {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.papers-card :deep(.col-ops .cell) {
  white-space: nowrap;
}

.op-btns :deep(.el-button) {
  padding: 6px 10px;
}

.text-gray {
  color: #9CA3AF;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .operation-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-filter {
    flex-direction: column;
  }
  
  .batch-operations {
    margin-top: 16px;
    justify-content: flex-start;
  }
  
  .page-title {
    font-size: 20px;
  }
}
</style>

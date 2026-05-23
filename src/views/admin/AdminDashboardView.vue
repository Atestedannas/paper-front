<template>
  <div class="admin-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">控制台</h1>
      <p class="page-subtitle">欢迎回来，管理员！这是系统的概览信息</p>
    </div>

    <!-- 统计卡片 -->
    <div v-loading="loading" class="stats-cards glass-container">
      <!-- 用户总数 -->
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <h3 class="stat-value">{{ stats.users.total.toLocaleString() }}</h3>
            <p class="stat-label">用户总数</p>
            <div class="stat-change">
              <el-icon :color="stats.users.increase >= 0 ? '#67c23a' : '#f56c6c'">
                <ArrowUp v-if="stats.users.increase >= 0" /><ArrowDown v-else />
              </el-icon>
              <span :class="['change-value', stats.users.increase >= 0 ? 'positive' : 'negative']">
                {{ formatChange(stats.users.increase) }}%
              </span>
              <span class="change-label">较上月</span>
            </div>
          </div>
          <div class="stat-icon user-icon">
            <el-icon :size="48"><User /></el-icon>
          </div>
        </div>
      </el-card>

      <!-- 论文总数 -->
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <h3 class="stat-value">{{ stats.papers.total.toLocaleString() }}</h3>
            <p class="stat-label">论文总数</p>
            <div class="stat-change">
              <el-icon :color="stats.papers.increase >= 0 ? '#67c23a' : '#f56c6c'">
                <ArrowUp v-if="stats.papers.increase >= 0" /><ArrowDown v-else />
              </el-icon>
              <span :class="['change-value', stats.papers.increase >= 0 ? 'positive' : 'negative']">
                {{ formatChange(stats.papers.increase) }}%
              </span>
              <span class="change-label">较上月</span>
            </div>
          </div>
          <div class="stat-icon paper-icon">
            <el-icon :size="48"><Document /></el-icon>
          </div>
        </div>
      </el-card>

      <!-- 今日检查 -->
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <h3 class="stat-value">{{ stats.today.checks.toLocaleString() }}</h3>
            <p class="stat-label">今日检查</p>
            <div class="stat-change">
              <el-icon :color="stats.today.change >= 0 ? '#67c23a' : '#f56c6c'">
                <ArrowUp v-if="stats.today.change >= 0" /><ArrowDown v-else />
              </el-icon>
              <span :class="['change-value', stats.today.change >= 0 ? 'positive' : 'negative']">
                {{ formatChange(stats.today.change) }}%
              </span>
              <span class="change-label">较昨日</span>
            </div>
          </div>
          <div class="stat-icon check-icon">
            <el-icon :size="48"><CircleCheck /></el-icon>
          </div>
        </div>
      </el-card>

      <!-- 系统状态 -->
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <h3 class="stat-value">{{ stats.system.status }}</h3>
            <p class="stat-label">系统状态</p>
            <div class="stat-change">
              <el-icon color="#67c23a"><CircleCheck /></el-icon>
              <span class="change-value positive">正常</span>
              <span class="change-label">运行中</span>
            </div>
          </div>
          <div class="stat-icon system-icon">
            <el-icon :size="48"><Cpu /></el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表和列表 -->
    <div class="dashboard-content">
      <!-- 左侧：用户增长图表 -->
      <el-card class="content-card glass-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>用户增长趋势</h3>
            <el-select v-model="chartPeriod" size="small" @change="updateChartData">
              <el-option label="近7天" value="7d" />
              <el-option label="近30天" value="30d" />
              <el-option label="近3个月" value="90d" />
              <el-option label="近1年" value="1y" />
            </el-select>
          </div>
        </template>
        <div class="chart-container">
          <div v-if="userGrowthData.length === 0" class="chart-empty">
            <el-empty description="暂无数据" :image-size="64" />
          </div>
          <div v-else class="mock-chart line-chart">
            <svg width="100%" height="220" viewBox="0 0 400 240" preserveAspectRatio="none">
              <!-- 网格线 -->
              <line v-for="n in 4" :key="n" x1="0" :y1="n * 50" x2="400" :y2="n * 50"
                stroke="#e5e7eb" stroke-width="1" />
              <!-- 折线区域填充 -->
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.18"/>
                  <stop offset="100%" stop-color="#3B82F6" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <polygon v-if="linePoints"
                :points="`0,220 ${linePoints} 400,220`"
                fill="url(#areaGrad)" />
              <!-- 折线 -->
              <polyline :points="linePoints" fill="none" stroke="#3B82F6" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round"/>
              <!-- 数据点 -->
              <circle v-for="(d, i) in userGrowthData" :key="i"
                :cx="(i + 1) * (400 / (userGrowthData.length + 1))"
                :cy="220 - (d.count / Math.max(...userGrowthData.map(x => x.count), 1)) * 200"
                r="4" fill="#3B82F6" stroke="#fff" stroke-width="2"/>
              <!-- X 轴日期标签 -->
              <text v-for="(d, i) in userGrowthData" :key="'l'+i"
                :x="(i + 1) * (400 / (userGrowthData.length + 1))"
                y="236" text-anchor="middle" font-size="11" fill="#9ca3af">
                {{ d.date }}
              </text>
            </svg>
          </div>
        </div>
      </el-card>

      <!-- 右侧：最近用户和论文 -->
      <div class="right-content">
        <!-- 最近注册用户 -->
        <el-card class="content-card glass-card" shadow="hover" :body-style="{ paddingBottom: '0' }">
          <template #header>
            <div class="card-header">
              <h3>最近注册用户</h3>
              <el-link type="primary" :underline="false" @click="$router.push('/admin/users')">
                查看全部
              </el-link>
            </div>
          </template>
          <el-table :data="recentUsers" :stripe="true" :border="false" size="small" v-if="recentUsers.length > 0" class="recent-table">
            <el-table-column prop="username" label="用户名" min-width="100" show-overflow-tooltip />
            <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
            <el-table-column prop="role" label="角色" width="90" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.role === 'admin' ? 'primary' : 'success'" size="small" effect="light" round>
                  {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="注册时间" width="150" />
            <el-table-column label="操作" width="130" fixed="right" align="center" class-name="action-column">
              <template #default="scope">
                <div class="action-buttons">
                  <el-tooltip content="查看详情" placement="top">
                    <el-button type="primary" link size="small" @click="viewUser(scope.row.id)">
                      <el-icon><View /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="编辑用户" placement="top">
                    <el-button type="primary" link size="small" @click="editUser(scope.row.id)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无新注册用户" />
        </el-card>

        <!-- 最近提交论文 -->
        <el-card class="content-card glass-card" shadow="hover" :body-style="{ paddingBottom: '0' }">
          <template #header>
            <div class="card-header">
              <h3>最近提交论文</h3>
              <el-link type="primary" :underline="false" @click="$router.push('/admin/papers')">
                查看全部
              </el-link>
            </div>
          </template>
          <el-table :data="recentPapers" :stripe="true" :border="false" size="small" v-if="recentPapers.length > 0" class="recent-table">
            <el-table-column prop="title" label="论文标题" min-width="140" show-overflow-tooltip />
            <el-table-column prop="user.username" label="提交人" width="100" />
            <el-table-column prop="status" label="状态" width="85" align="center">
              <template #default="scope">
                <el-tag
                  :type="getStatusType(scope.row.status)"
                  size="small"
                  effect="light"
                  round
                >
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="提交时间" width="150" />
            <el-table-column label="操作" width="130" fixed="right" align="center" class-name="action-column">
              <template #default="scope">
                <div class="action-buttons">
                  <el-tooltip content="查看论文" placement="top">
                    <el-button type="primary" link size="small" @click="viewPaper(scope.row.id)">
                      <el-icon><View /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="检查论文" placement="top">
                    <el-button type="success" link size="small" @click="checkPaper(scope.row.id)">
                      <el-icon><CircleCheck /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无新提交论文" />
        </el-card>
      </div>
    </div>

    <!-- 系统动态（基于真实数据） -->
    <el-card class="notification-card glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>系统动态</h3>
          <el-button type="primary" link size="small" @click="loadDashboard">
            <el-icon><CircleCheck /></el-icon>&nbsp;刷新
          </el-button>
        </div>
      </template>
      <el-timeline v-if="recentUsers.length || recentPapers.length">
        <el-timeline-item
          v-for="u in recentUsers.slice(0, 3)"
          :key="'u-' + u.id"
          :timestamp="formatDateTime(u.created_at)"
          type="primary"
        >
          <div class="timeline-content">
            <h4 class="notification-title">新用户注册</h4>
            <p class="notification-desc">
              用户 <strong>{{ u.username }}</strong>（{{ u.email }}）完成注册
            </p>
            <el-button type="primary" size="small" @click="viewUser(u.id)">查看用户</el-button>
          </div>
        </el-timeline-item>
        <el-timeline-item
          v-for="p in recentPapers.slice(0, 3)"
          :key="'p-' + p.id"
          :timestamp="formatDateTime(p.created_at)"
          type="success"
        >
          <div class="timeline-content">
            <h4 class="notification-title">论文提交</h4>
            <p class="notification-desc">
              <strong>{{ p.user?.username || '未知用户' }}</strong> 提交了论文：{{ p.title || p.file_name || '未命名' }}
            </p>
            <el-button type="success" size="small" @click="viewPaper(p.id)">查看论文</el-button>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无最近动态" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User, Document, CircleCheck, Cpu, ArrowUp, ArrowDown, View, Edit
} from '@element-plus/icons-vue'
import { getAdminDashboard } from '@/api/admin'

const router = useRouter()

const loading = ref(false)
const chartPeriod = ref('7d')

const stats = reactive({
  users:  { total: 0, increase: 0 },
  papers: { total: 0, increase: 0 },
  today:  { checks: 0, change: 0 },
  system: { status: '加载中...' }
})

const userGrowthData = ref([])
const recentUsers = ref([])
const recentPapers = ref([])

// 折线图坐标
const linePoints = computed(() => {
  if (!userGrowthData.value.length) return ''
  const maxY = Math.max(...userGrowthData.value.map(d => d.count), 1)
  const stepX = 400 / (userGrowthData.value.length + 1)
  return userGrowthData.value
    .map((d, i) => `${(i + 1) * stepX},${220 - (d.count / maxY) * 200}`)
    .join(' ')
})

// X 轴日期标签
const growthLabels = computed(() =>
  userGrowthData.value.map(d => d.date)
)

// 格式化时间
const formatDateTime = (val) => {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}年${pad(d.getMonth()+1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 增减幅度展示
const formatChange = (val) => {
  if (val === null || val === undefined) return '0.0'
  return Math.abs(val).toFixed(1)
}

// 加载 dashboard 数据
const loadDashboard = async () => {
  loading.value = true
  try {
    const data = await getAdminDashboard()
    if (!data) return

    stats.users.total     = data.total_users    ?? 0
    stats.papers.total    = data.total_papers   ?? 0
    stats.today.checks    = data.today_checks   ?? 0
    stats.users.increase  = data.users_increase ?? 0
    stats.papers.increase = data.papers_increase ?? 0
    stats.today.change    = data.checks_change  ?? 0
    stats.system.status   = data.system_status  || '正常'

    userGrowthData.value = Array.isArray(data.user_growth) ? data.user_growth : []
    recentUsers.value    = Array.isArray(data.recent_users)  ? data.recent_users  : []
    recentPapers.value   = Array.isArray(data.recent_papers) ? data.recent_papers : []
  } catch (err) {
    console.error('加载控制台数据失败:', err)
    ElMessage.warning('控制台数据加载失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

const updateChartData = () => {
  loadDashboard()
}

const getStatusType = (status) => ({
  pending: 'warning', checked: 'success',
  corrected: 'primary', exported: 'info', failed: 'danger'
}[status] || 'default')

const getStatusText = (status) => ({
  pending: '待检查', checked: '已检查',
  corrected: '已修正', exported: '已导出', failed: '检查失败'
}[status] || '未知状态')

const viewUser   = id => router.push(`/admin/users/${id}`)
const editUser   = id => router.push(`/admin/users/${id}/edit`)
const viewPaper  = id => router.push(`/admin/papers/${id}`)
const checkPaper = id => router.push(`/admin/papers/${id}/check`)

const handleNotificationAction = (action) => {
  const map = { '查看详情': '/admin/settings/system', '了解更多': '/admin/help', '查看统计': '/admin/stats' }
  if (map[action]) router.push(map[action])
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.admin-dashboard {
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

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  margin: 0 0 8px 0;
  color: #6b7280;
  font-size: 14px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.change-value {
  font-weight: 600;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.change-label {
  color: #9ca3af;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.user-icon {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.paper-icon {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.check-icon {
  background-color: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.system-icon {
  background-color: rgba(144, 147, 153, 0.1);
  color: #909399;
}

/* 内容区域 */
.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.content-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.chart-container {
  height: 300px;
  margin-top: 20px;
}

.line-chart {
  width: 100%;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 右侧内容 */
.right-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 表格样式 */
.recent-table {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__header-wrapper th) {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  font-weight: 600;
  color: #606266;
  font-size: 13px;
  padding: 12px 8px !important;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-table__body-wrapper td) {
  padding: 10px 8px !important;
  font-size: 13px;
  color: #606266;
  transition: all 0.2s ease;
}

:deep(.el-table__body-wrapper tr) {
  transition: all 0.2s ease;
}

:deep(.el-table__body-wrapper tr:hover td) {
  background-color: #f0f9ff;
  color: #409eff;
}

:deep(.el-table__body-wrapper tr:hover .action-buttons) {
  opacity: 1;
}

/* 操作按钮样式 */
:deep(.action-column .cell) {
  padding: 6px 8px !important;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

:deep(.el-table__body-wrapper tr:hover .action-buttons) {
  opacity: 1;
}

.action-buttons .el-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.action-buttons .el-button:hover {
  background-color: rgba(64, 158, 255, 0.15);
  transform: scale(1.1);
}

.action-buttons .el-button--success:hover {
  background-color: rgba(103, 194, 58, 0.15);
}

/* 标签样式优化 */
:deep(.el-tag--small) {
  font-size: 12px;
  padding: 0 10px;
  height: 22px;
  line-height: 20px;
  font-weight: 500;
}

/* 卡片头部样式优化 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header h3::before {
  content: '';
  width: 4px;
  height: 18px;
  background: linear-gradient(180deg, #409eff 0%, #67c23a 100%);
  border-radius: 2px;
}

/* 时间线样式 */
.notification-card {
  border-radius: 12px;
}

.timeline-content {
  padding: 12px 0;
}

.notification-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.notification-desc {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .right-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .stat-icon {
    width: 56px;
    height: 56px;
    font-size: 28px;
  }
  
  .chart-container {
    height: 250px;
  }
}

@media (max-width: 576px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .chart-container {
    height: 200px;
  }
}
</style>

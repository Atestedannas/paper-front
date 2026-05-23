<template>
  <div class="dashboard">
    <el-alert
      v-if="route.query.error === 'admin_required'"
      type="warning"
      :closable="true"
      show-icon
      class="admin-alert"
    >
      <template #title>
        该功能仅限管理员，请前往后台管理中心
      </template>
      <template #default>
        <div class="alert-actions">
          <router-link to="/admin" class="glass-btn primary">进入后台 /admin</router-link>
        </div>
      </template>
    </el-alert>
    <!-- 顶部导航栏（增强版） -->
    <header class="dashboard-header">
      <div class="header-left">
        <!-- 品牌标识 -->
        <div class="brand">
          <router-link to="/" class="logo">论文格式检查系统</router-link>
        </div>
        <!-- 面包屑导航 -->
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>

          </el-breadcrumb>
        </div>
      </div>
      <div class="header-right">
        <!-- 搜索框 -->
        <div class="search-box">
          <el-input
            placeholder="搜索项目或论文..."
            prefix-icon="Search"
            clearable
            size="small"
            class="search-input"
          />
        </div>
        <!-- 通知图标 -->
        <div class="notification">
          <el-badge :value="3" class="notification-badge">
            <el-icon class="notification-icon"><Bell /></el-icon>
          </el-badge>
        </div>
        <!-- 用户头像 + 下拉菜单 -->
        <div class="user-info">
          <el-dropdown>
            <span class="user-avatar">
              <el-avatar size="small">JD</el-avatar>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人设置</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <div class="dashboard-content">
      <!-- 左侧边栏 -->
      <aside class="sidebar">
        <!-- 折叠按钮 -->
        <div class="sidebar-header">
          <el-button type="text" icon="Menu" size="small" @click="toggleSidebar">
            {{ isSidebarCollapsed ? '展开' : '收起' }}
          </el-button>
        </div>
        <!-- 导航菜单 -->
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          :collapse="isSidebarCollapsed"
          router
          background-color="var(--bg-primary)"
          text-color="var(--text-primary)"
          active-text-color="var(--primary-color)"
        >
      
          <el-menu-item index="format-rules">
            <template #icon>
              <el-icon><Document /></el-icon>
            </template>
            <span>格式规范库</span>
          </el-menu-item>
          <el-menu-item index="custom-rules">
            <template #icon>
              <el-icon><Setting /></el-icon>
            </template>
            <span>自定义规范</span>
          </el-menu-item>
          <el-menu-item index="manual-review">
            <template #icon>
              <el-icon><User /></el-icon>
            </template>
            <span>人工复核</span>
          </el-menu-item>
          <el-menu-item index="history">
            <template #icon>
              <el-icon><Clock /></el-icon>
            </template>
            <span>历史记录</span>
          </el-menu-item>
          <el-menu-item index="statistics">
            <template #icon>
              <el-icon><DataAnalysis /></el-icon>
            </template>
            <span>统计分析</span>
          </el-menu-item>
        </el-menu>
        <!-- 底部用户信息 -->
        <div class="sidebar-footer">
          <div class="footer-avatar">
            <el-avatar size="small">JD</el-avatar>
          </div>
          <div class="footer-info" v-if="!isSidebarCollapsed">
            <div class="footer-name">John Doe</div>
            <div class="footer-role">普通用户</div>
          </div>
        </div>
      </aside>

      <!-- 右侧主内容 -->
      <main class="main-content">
        <!-- 统计卡片区 -->
        <section class="stats-section">
          <div class="stats-grid">
            <!-- 卡片1：今日处理数量 -->
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-header">
                  <h3 class="stat-title">今日处理</h3>
                </div>
                <div class="stat-body">
                  <div class="stat-number">8</div>
                  <div class="stat-trend positive">
                    <el-icon><ArrowUp /></el-icon>
                    <span>12% 较昨日</span>
                  </div>
                </div>
              </div>
            </el-card>

            <!-- 卡片2：格式问题分布 -->
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-header">
                  <h3 class="stat-title">格式问题分布</h3>
                </div>
                <div class="stat-body">
                  <div class="chart-container">
                    <!-- 环形图/饼图：显示各类问题占比 -->
                    <div class="mock-chart pie-chart">
                      <div class="pie-svg">
                        <!-- 模拟环形图 -->
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="40" fill="var(--bg-tertiary)" />
                          <!-- 引用与参考文献 (35%) -->
                          <path d="M60 20 A40 40 0 0 1 95.355 40 L60 60 Z" fill="#3B82F6" />
                          <!-- 图表 (25%) -->
                          <path d="M95.355 40 A40 40 0 0 1 100 80 L60 60 Z" fill="#10B981" />
                          <!-- 封面与标题页 (20%) -->
                          <path d="M100 80 A40 40 0 0 1 60 100 L60 60 Z" fill="#F59E0B" />
                          <!-- 其他 (20%) -->
                          <path d="M60 100 A40 40 0 0 1 20 80 L60 60 Z" fill="#6B7280" />
                        </svg>
                      </div>
                      <!-- 图例 -->
                      <div class="chart-legend">
                        <div class="legend-item">
                          <div class="legend-color" style="background-color: #3B82F6;"></div>
                          <span>引用与参考文献 (35%)</span>
                        </div>
                        <div class="legend-item">
                          <div class="legend-color" style="background-color: #10B981;"></div>
                          <span>图表 (25%)</span>
                        </div>
                        <div class="legend-item">
                          <div class="legend-color" style="background-color: #F59E0B;"></div>
                          <span>封面与标题页 (20%)</span>
                        </div>
                        <div class="legend-item">
                          <div class="legend-color" style="background-color: #6B7280;"></div>
                          <span>其他 (20%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>

            <!-- 卡片3：月度处理统计 -->
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-header">
                  <h3 class="stat-title">月度处理统计</h3>
                </div>
                <div class="stat-body">
                  <div class="chart-container">
                    <!-- 柱状图：显示各月处理数量 -->
                    <div class="mock-chart bar-chart">
                      <div class="bar-svg">
                        <!-- 模拟柱状图 -->
                        <svg width="150" height="120" viewBox="0 0 150 120">
                          <g transform="translate(20, 10)">
                            <!-- 柱状图柱子 -->
                            <rect x="0" y="80" width="15" height="40" fill="#3B82F6" rx="3" />
                            <rect x="30" y="60" width="15" height="60" fill="#3B82F6" rx="3" />
                            <rect x="60" y="40" width="15" height="80" fill="#3B82F6" rx="3" />
                            <rect x="90" y="20" width="15" height="100" fill="#3B82F6" rx="3" />
                            <rect x="120" y="0" width="15" height="120" fill="#3B82F6" rx="3" />
                            <!-- X轴标签 -->
                            <text x="7" y="130" font-size="10" text-anchor="middle" fill="var(--text-secondary)">8月</text>
                            <text x="37" y="130" font-size="10" text-anchor="middle" fill="var(--text-secondary)">6月</text>
                            <text x="67" y="130" font-size="10" text-anchor="middle" fill="var(--text-secondary)">4月</text>
                            <text x="97" y="130" font-size="10" text-anchor="middle" fill="var(--text-secondary)">2月</text>
                            <text x="127" y="130" font-size="10" text-anchor="middle" fill="var(--text-secondary)">0月</text>
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </section>

        <!-- 项目列表区（双面板设计） -->
        <section class="projects-section">
          <div class="projects-container">
            <!-- 左侧：最近项目 -->
            <div class="recent-projects">
              <h3 class="section-title">最近项目</h3>
              <el-card class="projects-card" shadow="hover">
                <div class="project-list">
                  <div v-for="(project, index) in recentProjects" :key="index" class="project-item">
                    <div class="project-info">
                      <div class="project-title">{{ project.title }}</div>
                      <div class="project-meta">
                        <el-tag :type="getStatusType(project.status)" size="small">{{ project.status }}</el-tag>
                        <span class="project-spec">{{ project.spec }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>

            <!-- 右侧：所有项目 -->
            <div class="all-projects">
              <h3 class="section-title">所有项目</h3>
              <el-card class="projects-card" shadow="hover">
                <div class="project-table">
                  <el-table :data="allProjects" stripe style="width: 100%">
                    <el-table-column prop="title" label="项目标题" min-width="200">
                      <template #default="scope">
                        <a href="#" class="project-link">{{ scope.row.title }}</a>
                      </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="120">
                      <template #default="scope">
                        <el-tag :type="getStatusType(scope.row.status)" size="small">{{ scope.row.status }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="spec" label="格式规范" min-width="180" />
                    <el-table-column prop="lastModified" label="上次修改" width="160" />
                    <el-table-column label="操作" width="200" fixed="right">
                      <template #default="scope">
                        <el-button size="small" type="primary" text>查看报告</el-button>
                        <el-button size="small" type="success" text>重新检测</el-button>
                        <el-button size="small" type="danger" text>删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-card>
            </div>
          </div>
        </section>
      </main>
    </div>

    <!-- 底部操作栏 -->
    <div class="dashboard-footer">
      <!-- 固定位置的主按钮 -->
      <el-floating-button
        type="primary"
        size="large"
        :icon="Plus"
        @click="createNewProject"
        class="create-project-btn"
      >
        新建项目
      </el-floating-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Bell, HomeFilled, Document, Setting, User, Clock, DataAnalysis, Plus, ArrowUp } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 侧边栏折叠状态
const isSidebarCollapsed = ref(false)

// 当前活跃菜单
const activeMenu = ref('dashboard')

// 模拟最近项目数据
const recentProjects = ref([
  {
    title: '深度学习在自然语言处理...',
    status: '检测完成',
    spec: '清华大学博士学位论文'
  },
  {
    title: '基于机器学习的图像识...',
    status: '传统正',
    spec: 'IEEE Transactions on Pattern Analysis...'
  },
  {
    title: '碳纳米管材料的制备与...',
    status: '传统正',
    spec: 'Nature Journal'
  }
])

// 模拟所有项目数据
const allProjects = ref([
  {
    id: 1,
    title: '深度学习在自然语言处理中的应用研究',
    status: '检测完成',
    spec: '清华大学博士学位论文',
    lastModified: '2025-11-28 14:30'
  },
  {
    id: 2,
    title: '基于机器学习的图像识别技术',
    status: '传统正',
    spec: 'IEEE Transactions on Pattern Analysis and Machine Intelligence',
    lastModified: '2025-11-27 10:15'
  },
  {
    id: 3,
    title: '碳纳米管材料的制备与性能研究',
    status: '传统正',
    spec: 'Nature Journal',
    lastModified: '2025-11-26 16:45'
  },
  {
    id: 4,
    title: '量子计算的理论与实验进展',
    status: '进行中',
    spec: '科学通报',
    lastModified: '2025-11-25 09:20'
  },
  {
    id: 5,
    title: '人工智能在医学影像分析中的应用',
    status: '检测完成',
    spec: '中华医学杂志',
    lastModified: '2025-11-24 14:10'
  }
])

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// 获取状态对应的标签类型
const getStatusType = (status) => {
  const statusMap = {
    '检测完成': 'success',
    '传统正': 'primary',
    '进行中': 'warning',
    '失败': 'danger'
  }
  return statusMap[status] || 'info'
}

// 创建新项目
const createNewProject = () => {
  router.push('/upload')
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-secondary);
}

.admin-alert {
  margin: 12px var(--spacing-xl);
}

/* 顶部导航栏 */
.dashboard-header {
  background-color: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  padding: 0 var(--spacing-xl);
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
}

/* 品牌标识 */
.brand {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--brand-color);
  text-decoration: none;
  font-family: var(--font-family-heading);
}

/* 面包屑导航 */
.breadcrumb {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

/* 搜索框 */
.search-box {
  position: relative;
}

.search-input {
  width: 300px;
  border-radius: var(--border-radius-md);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

/* 通知图标 */
.notification {
  position: relative;
  cursor: pointer;
}

.notification-icon {
  font-size: 1.25rem;
  color: var(--text-primary);
  transition: color 0.2s ease;
}

.notification-icon:hover {
  color: var(--primary-color);
}

/* 用户头像 */
.user-info {
  cursor: pointer;
}

.user-avatar {
  display: flex;
  align-items: center;
}

/* 主内容区域 */
.dashboard-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 240px;
  background-color: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar:deep(.el-menu) {
  background-color: transparent;
  border-right: none;
  flex: 1;
}

.sidebar:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  padding: 0 var(--spacing-lg);
  margin: 0;
  transition: all 0.2s ease;
}

.sidebar:deep(.el-menu-item:hover) {
  background-color: var(--bg-secondary);
}

.sidebar:deep(.el-menu-item.is-active) {
  background-color: var(--primary-light);
  color: var(--primary-color);
}

.sidebar:deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background-color: var(--primary-color);
  border-radius: 0 3px 3px 0;
}

.sidebar-header {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.sidebar-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.footer-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.footer-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.footer-role {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* 主内容 */
.main-content {
  flex: 1;
  padding: var(--spacing-xl);
  overflow-y: auto;
}

/* 统计卡片区 */
.stats-section {
  margin-bottom: var(--spacing-xl);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: var(--spacing-lg);
}

.stat-card {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: none;
  transition: all 0.2s ease;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-content {
  padding: var(--spacing-lg);
}

.stat-header {
  margin-bottom: var(--spacing-lg);
}

.stat-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  font-family: var(--font-family-heading);
}

.stat-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-number {
  font-size: 3rem;
  font-weight: 700;
  color: var(--primary-color);
  font-family: var(--font-family-heading);
  line-height: 1.2;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--success-color);
}

.stat-trend.positive {
  color: var(--success-color);
}

.stat-trend.negative {
  color: var(--error-color);
}

/* 模拟图表样式 */
.chart-container {
  width: 100%;
  height: 100%;
}

.mock-chart {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.pie-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  width: 100%;
}

.pie-svg {
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  font-size: 0.85rem;
  color: var(--text-secondary);
  width: 180px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.bar-chart {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bar-svg {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 项目列表区 */
.projects-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-lg) 0;
  font-family: var(--font-family-heading);
}

.projects-container {
  display: grid;
  grid-template-columns: 1fr 2.5fr;
  gap: var(--spacing-lg);
}

.projects-card {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: none;
  transition: all 0.2s ease;
}

.projects-card:hover {
  box-shadow: var(--shadow-md);
}

.projects-card:deep(.el-card__body) {
  padding: var(--spacing-lg);
}

/* 最近项目 */
.recent-projects {
  display: flex;
  flex-direction: column;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.project-item {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  background-color: var(--bg-secondary);
  transition: all 0.2s ease;
  cursor: pointer;
}

.project-item:hover {
  background-color: var(--bg-tertiary);
  transform: translateX(4px);
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.project-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1.4;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.85rem;
}

.project-spec {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 所有项目 */
.all-projects {
  display: flex;
  flex-direction: column;
}

.project-table {
  width: 100%;
  overflow: auto;
}

.project-link {
  color: var(--primary-color);
  text-decoration: none;
  transition: all 0.2s ease;
}

.project-link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

/* 底部操作栏 */
.dashboard-footer {
  position: relative;
  flex: 1;
}

.create-project-btn {
  position: fixed;
  right: var(--spacing-xl);
  bottom: var(--spacing-xl);
  z-index: 99;
  box-shadow: var(--shadow-lg);
  transition: all 0.2s ease;
}

.create-project-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
  
  .projects-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 0 var(--spacing-lg);
  }
  
  .search-input {
    width: 200px;
  }
  
  .header-left {
    gap: var(--spacing-md);
  }
  
  .sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    bottom: 0;
    z-index: 90;
    transition: transform 0.3s ease;
  }
  
  .sidebar.collapsed {
    transform: translateX(-100%);
  }
  
  .main-content {
    padding: var(--spacing-lg);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .stat-card {
    width: 100%;
  }
}
</style>

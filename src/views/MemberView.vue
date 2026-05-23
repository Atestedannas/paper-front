<template>
  <div class="member-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
    </div>
    
    <div class="member-content">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1>会员中心</h1>
        <p class="page-description">解锁更多高级功能，享受专属服务</p>
      </div>
      
      <!-- 加载状态 -->
      <div class="loading-state" v-if="loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      
      <!-- 当前会员信息 -->
      <el-card class="member-info-card" v-if="memberInfo && !loading" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Medal /></el-icon>
            <span>我的会员</span>
          </div>
        </template>
        <div class="member-info-content">
          <div class="member-badge" :class="memberInfo.memberLevel?.levelName?.toLowerCase()">
            <el-icon size="32"><Trophy /></el-icon>
            <span>{{ memberInfo.memberLevel?.levelName || '普通用户' }}</span>
          </div>
          <div class="member-stats">
            <div class="stat-item">
              <span class="stat-label">有效期至</span>
              <span class="stat-value">{{ formatDate(memberInfo.expireAt) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">剩余检查次数</span>
              <span class="stat-value highlight">{{ memberInfo.remainingChecks }} 次</span>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 会员等级列表 -->
      <div class="member-levels" v-if="!loading">
        <h2 class="section-title">
          <el-icon><Star /></el-icon>
          选择会员套餐
        </h2>
        
        <div class="level-grid" v-if="memberLevels.length > 0">
          <el-card 
            v-for="level in memberLevels" 
            :key="level.id" 
            class="level-card"
            :class="{ recommended: level.recommended }"
            shadow="hover"
          >
            <div class="level-badge" v-if="level.recommended">推荐</div>
            <div class="level-header">
              <h3>{{ level.levelName }}</h3>
              <div class="level-price">
                <span class="currency">¥</span>
                <span class="amount">{{ level.price }}</span>
                <span class="period">/{{ level.durationDays }}天</span>
              </div>
            </div>
            <div class="level-features">
              <p class="features-text">{{ level.features }}</p>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>最多检查 {{ level.maxChecks }} 次</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>优先技术支持</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>导出完整报告</span>
              </div>
            </div>
            <el-button 
              type="primary" 
              size="large"
              class="buy-btn"
              :loading="buyLoading === level.id"
              @click="buyMembership(level.id)"
            >
              {{ buyLoading === level.id ? '处理中...' : '立即开通' }}
            </el-button>
          </el-card>
        </div>
        
        <el-empty v-else description="暂无可用的会员套餐" />
      </div>
      
      <!-- 错误提示 -->
      <div class="error-state" v-if="error">
        <el-alert :title="error" type="error" show-icon />
        <el-button type="primary" @click="loadData" style="margin-top: 16px;">重试</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Medal, Trophy, Star, Check } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const memberInfo = ref(null)
const memberLevels = ref([])
const loading = ref(true)
const buyLoading = ref(null)
const error = ref('')

const loadMemberInfo = async () => {
  try {
    const response = await request({
      url: '/member/info',
      method: 'GET'
    })
    memberInfo.value = response.data
  } catch (err) {

    // 会员信息加载失败不影响页面显示
  }
}

const loadMemberLevels = async () => {
  try {
    const response = await request({
      url: '/member/levels',
      method: 'GET'
    })
     memberLevels.value = response.data || []
     if (memberLevels.value.length === 0) {
       error.value = '暂无可用的会员套餐'
     }
    error.value = ''
   } catch (err) {

     error.value = '加载会员套餐失败：' + (err.response?.data?.message || err.message)
  } finally {
    loading.value = false
  }
}

const loadData = async () => {
  loading.value = true
  error.value = ''
  await Promise.all([loadMemberInfo(), loadMemberLevels()])
}

const buyMembership = async (levelId) => {
  buyLoading.value = levelId
  try {
    const response = await request({
      url: '/order',
      method: 'POST',
      data: {
        member_level_id: levelId,
        payment_method: 'wechat'
      }
    })
    
    ElMessage.success('订单创建成功，请前往订单页面完成支付')
    router.push('/orders')
  } catch (err) {

    ElMessage.error('订单创建失败，请稍后重试')
  } finally {
    buyLoading.value = null
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '暂无'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.member-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
}

.member-content {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
}

.page-description {
  font-size: 1.1rem;
  color: #666;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: #666;
  font-size: 1.1rem;
}

.loading-state .el-icon {
  font-size: 24px;
  color: #667eea;
}

.member-info-card {
  margin-bottom: 40px;
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.card-header .el-icon {
  color: #667eea;
}

.member-info-content {
  display: flex;
  align-items: center;
  gap: 40px;
  flex-wrap: wrap;
}

.member-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.member-badge span {
  font-size: 1rem;
  font-weight: 600;
}

.member-stats {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: #999;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.stat-value.highlight {
  color: #667eea;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
}

.section-title .el-icon {
  color: #f59e0b;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.level-card {
  position: relative;
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  overflow: hidden;
}

.level-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.level-card.recommended {
  border-color: #667eea;
}

.level-badge {
  position: absolute;
  top: 16px;
  right: -32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 40px;
  font-size: 0.8rem;
  font-weight: 600;
  transform: rotate(45deg);
}

.level-header {
  text-align: center;
  padding: 24px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.level-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.level-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.level-price .currency {
  font-size: 1.25rem;
  color: #667eea;
}

.level-price .amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: #667eea;
}

.level-price .period {
  font-size: 0.9rem;
  color: #999;
}

.level-features {
  padding: 24px 20px;
}

.features-text {
  text-align: center;
  color: #666;
  margin-bottom: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  color: #333;
}

.feature-item .el-icon {
  color: #10b981;
}

.buy-btn {
  width: calc(100% - 40px);
  margin: 0 20px 20px;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.buy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.error-state {
  text-align: center;
  padding: 40px;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 2rem;
  }
  
  .member-info-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .member-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .level-grid {
    grid-template-columns: 1fr;
  }
}
</style>

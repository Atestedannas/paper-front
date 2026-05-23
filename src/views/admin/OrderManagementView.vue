<template>
  <div class="admin-order-view">
    <div class="page-header">
      <h1 class="page-title">订单管理</h1>
      <p class="page-subtitle">查看与管理平台订单流转与支付状态</p>
    </div>
    <div class="glass-card" style="padding: 20px;">
      <el-table :data="orders" stripe v-loading="loading" v-if="orders.length > 0">
        <el-table-column label="订单编号" width="200">
          <template #default="scope">{{ scope.row.order_no }}</template>
        </el-table-column>
        <el-table-column label="用户" width="130">
          <template #default="scope">{{ scope.row.user?.username || '-' }}</template>
        </el-table-column>
        <el-table-column label="会员等级/服务" width="130">
          <template #default="scope">
            {{ scope.row.member_level?.level_name || '论文检查服务' }}
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="scope">
            ¥{{ scope.row.total_amount != null ? Number(scope.row.total_amount).toFixed(2) : '0.00' }}
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="110">
          <template #default="scope">
            <el-tag :type="scope.row.payment_method === 'alipay' ? 'primary' : 'success'">
              {{ scope.row.payment_method === 'alipay' ? '支付宝' : '微信支付' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" width="110">
          <template #default="scope">
            <el-tag :type="payStatusType(scope.row.payment_status)">
              {{ payStatusText(scope.row.payment_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="110">
          <template #default="scope">
            <el-tag :type="orderStatusType(scope.row.order_status)">
              {{ orderStatusText(scope.row.order_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="scope">{{ formatDate(scope.row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="过期时间" width="170">
          <template #default="scope">{{ formatDate(scope.row.expired_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" class-name="col-ops">
          <template #default="scope">
            <div class="op-btns">
              <el-button type="primary" size="small">详情</el-button>
              <el-button type="warning" size="small" :disabled="scope.row.payment_status !== 'pending'">标记已支付</el-button>
              <el-button type="danger" size="small">取消</el-button>
              <el-button type="info" size="small">导出</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无订单数据" />

      <!-- 分页组件 -->
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOrders as apiGetOrders } from '../../api/admin'

const orders = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 支付状态
const payStatusType = (s) => ({ paid: 'success', pending: 'warning', cancelled: 'info', refunded: 'warning', failed: 'danger' }[s] || 'info')
const payStatusText = (s) => ({ paid: '已支付', pending: '待支付', cancelled: '已取消', refunded: '已退款', failed: '失败' }[s] || s || '-')

// 订单状态
const orderStatusType = (s) => ({ completed: 'success', created: 'warning', cancelled: 'info', processing: 'primary' }[s] || 'info')
const orderStatusText = (s) => ({ completed: '已完成', created: '已创建', cancelled: '已取消', processing: '处理中' }[s] || s || '-')

// 时间格式化：YYYY-MM-DD HH:mm:00
const formatDate = (val) => {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

const loadOrders = async () => {
  loading.value = true
  try {
    const data = await apiGetOrders({ page: currentPage.value, page_size: pageSize.value })
    orders.value = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : [])
    total.value = data?.total || orders.value.length
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val) => { pageSize.value = val; currentPage.value = 1; loadOrders() }
const handleCurrentChange = (val) => { currentPage.value = val; loadOrders() }

onMounted(loadOrders)
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-title { margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #1e293b; }
.page-subtitle { margin: 0; color: #64748b; }
.op-btns { display:flex; align-items:center; gap:8px; flex-wrap:nowrap; }
:deep(.col-ops .cell){ white-space:nowrap; }
.op-btns :deep(.el-button){ padding:6px 10px; }

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

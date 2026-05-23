<template>
  <div class="billing-settings">
    <div class="page-header">
      <h2>计费设置</h2>
      <p class="subtitle">配置服务的免费/付费模式和价格</p>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- 服务定价管理 -->
      <el-tab-pane label="服务定价" name="services">
        <div class="toolbar">
          <el-button type="primary" @click="showServiceDialog('create')">
            <el-icon><Plus /></el-icon> 添加服务
          </el-button>
        </div>

        <el-table :data="services" v-loading="loading" stripe>
          <el-table-column prop="service_name" label="服务名称" min-width="150" />
          <el-table-column prop="service_type" label="服务类型" min-width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ row.service_type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="pricing_model" label="计费模式" min-width="100">
            <template #default="{ row }">
              <el-tag :type="getPricingModelType(row.pricing_model)" size="small">
                {{ getPricingModelName(row.pricing_model) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="免费/付费" min-width="120">
            <template #default="{ row }">
              <el-switch
                v-model="row.is_free"
                active-text="免费"
                inactive-text="付费"
                @change="handleFreeChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="启用状态" min-width="100">
            <template #default="{ row }">
              <el-switch
                v-model="row.is_enabled"
                @change="handleEnableChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="price" label="价格(元)" min-width="100">
            <template #default="{ row }">
              {{ row.is_free ? '免费' : `¥${row.price.toFixed(2)}` }}
            </template>
          </el-table-column>
          <el-table-column prop="free_count" label="免费次数" min-width="100">
            <template #default="{ row }">
              {{ row.free_count || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" min-width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="showServiceDialog('edit', row)">编辑</el-button>
              <el-button link type="danger" @click="deleteService(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 套餐管理 -->
      <el-tab-pane label="套餐管理" name="plans">
        <div class="toolbar">
          <el-button type="primary" @click="showPlanDialog('create')">
            <el-icon><Plus /></el-icon> 添加套餐
          </el-button>
        </div>

        <el-table :data="plans" v-loading="plansLoading" stripe>
          <el-table-column prop="plan_name" label="套餐名称" min-width="120" />
          <el-table-column prop="plan_type" label="套餐类型" min-width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ getPlanTypeName(row.plan_type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="service_type" label="服务类型" min-width="120">
            <template #default="{ row }">
              <el-tag v-if="row.service_type" type="info" size="small">{{ row.service_type }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="价格(元)" min-width="100">
            <template #default="{ row }">
              ¥{{ row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="period_days" label="周期(天)" min-width="100" />
          <el-table-column prop="check_count" label="检查次数" min-width="100">
            <template #default="{ row }">
              {{ row.check_count || '无限' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" min-width="80">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
                {{ row.is_active ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="showPlanDialog('edit', row)">编辑</el-button>
              <el-button link type="danger" @click="deletePlan(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 服务定价对话框 -->
    <el-dialog
      v-model="serviceDialogVisible"
      :title="serviceDialogType === 'create' ? '添加服务' : '编辑服务'"
      width="600px"
    >
      <el-form :model="serviceForm" :rules="serviceRules" ref="serviceFormRef" label-width="100px">
        <el-form-item label="服务类型" prop="service_type">
          <el-input v-model="serviceForm.service_type" :disabled="serviceDialogType === 'edit'" placeholder="如: paper_check" />
        </el-form-item>
        <el-form-item label="服务名称" prop="service_name">
          <el-input v-model="serviceForm.service_name" placeholder="如: 论文格式检查" />
        </el-form-item>
        <el-form-item label="计费模式" prop="pricing_model">
          <el-select v-model="serviceForm.pricing_model" placeholder="选择计费模式">
            <el-option label="免费" value="free" />
            <el-option label="按次计费" value="count" />
            <el-option label="按月订阅" value="month" />
            <el-option label="按年订阅" value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否免费">
          <el-switch v-model="serviceForm.is_free" active-text="免费" inactive-text="付费" />
        </el-form-item>
        <el-form-item label="价格" prop="price" v-if="!serviceForm.is_free">
          <el-input-number v-model="serviceForm.price" :min="0" :precision="2" :step="0.01" />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="免费次数">
          <el-input-number v-model="serviceForm.free_count" :min="0" />
          <span class="unit">次/月</span>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="serviceForm.is_enabled" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="serviceForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="serviceForm.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="serviceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitService">确定</el-button>
      </template>
    </el-dialog>

    <!-- 套餐对话框 -->
    <el-dialog
      v-model="planDialogVisible"
      :title="planDialogType === 'create' ? '添加套餐' : '编辑套餐'"
      width="600px"
    >
      <el-form :model="planForm" :rules="planRules" ref="planFormRef" label-width="100px">
        <el-form-item label="套餐名称" prop="plan_name">
          <el-input v-model="planForm.plan_name" placeholder="如: 基础版" />
        </el-form-item>
        <el-form-item label="套餐类型" prop="plan_type">
          <el-select v-model="planForm.plan_type" placeholder="选择套餐类型">
            <el-option label="月度订阅" value="monthly" />
            <el-option label="年度订阅" value="yearly" />
            <el-option label="永久" value="permanent" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联服务">
          <el-select v-model="planForm.service_type" placeholder="选择关联服务（可选）" clearable>
            <el-option
              v-for="service in services"
              :key="service.service_type"
              :label="service.service_name"
              :value="service.service_type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="planForm.price" :min="0" :precision="2" :step="0.01" />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="周期天数">
          <el-input-number v-model="planForm.period_days" :min="1" />
          <span class="unit">天</span>
        </el-form-item>
        <el-form-item label="检查次数">
          <el-input-number v-model="planForm.check_count" :min="0" :unlimited="true" />
          <span class="unit">0表示无限</span>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="planForm.is_active" />
        </el-form-item>
        <el-form-item label="套餐描述">
          <el-input v-model="planForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="功能特性">
          <el-input v-model="planForm.features" type="textarea" :rows="3" placeholder="JSON数组格式，如: [&quot;功能1&quot;, &quot;功能2&quot;]" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="planForm.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPlan">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import billingApi from '@/api/billing'

const activeTab = ref('services')
const loading = ref(false)
const plansLoading = ref(false)
const services = ref([])
const plans = ref([])

// 服务对话框
const serviceDialogVisible = ref(false)
const serviceDialogType = ref('create')
const serviceFormRef = ref(null)
const serviceForm = ref({
  id: '',
  service_type: '',
  service_name: '',
  pricing_model: 'count',
  is_free: false,
  is_enabled: true,
  price: 0,
  free_count: 0,
  description: '',
  sort_order: 0
})

const serviceRules = {
  service_type: [
    { required: true, message: '请输入服务类型', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '服务类型只能包含小写字母和下划线', trigger: 'blur' }
  ],
  service_name: [
    { required: true, message: '请输入服务名称', trigger: 'blur' }
  ],
  pricing_model: [
    { required: true, message: '请选择计费模式', trigger: 'change' }
  ]
}

// 套餐对话框
const planDialogVisible = ref(false)
const planDialogType = ref('create')
const planFormRef = ref(null)
const planForm = ref({
  id: '',
  plan_name: '',
  plan_type: 'monthly',
  service_type: '',
  price: 0,
  period_days: 30,
  check_count: 0,
  is_active: true,
  description: '',
  features: '',
  sort_order: 0
})

const planRules = {
  plan_name: [
    { required: true, message: '请输入套餐名称', trigger: 'blur' }
  ],
  plan_type: [
    { required: true, message: '请选择套餐类型', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' }
  ]
}

// 获取服务列表
const fetchServices = async () => {
  loading.value = true
  try {
    const res = await billingApi.getServicePricings()
    if (res.code === 200 && Array.isArray(res.data)) {
      services.value = res.data
    }
  } catch (err) {
    console.error('获取服务列表失败:', err)
    ElMessage.error('获取服务列表失败')
  } finally {
    loading.value = false
  }
}

// 获取套餐列表
const fetchPlans = async () => {
  plansLoading.value = true
  try {
    const res = await billingApi.getPlans()
    if (res.code === 200 && Array.isArray(res.data)) {
      plans.value = res.data
    }
  } catch (err) {
    console.error('获取套餐列表失败:', err)
    ElMessage.error('获取套餐列表失败')
  } finally {
    plansLoading.value = false
  }
}

// 显示服务对话框
const showServiceDialog = (type, row = null) => {
  serviceDialogType.value = type
  if (type === 'edit' && row) {
    serviceForm.value = { ...row }
  } else {
    serviceForm.value = {
      id: '',
      service_type: '',
      service_name: '',
      pricing_model: 'count',
      is_free: false,
      is_enabled: true,
      price: 0,
      free_count: 0,
      description: '',
      sort_order: 0
    }
  }
  serviceDialogVisible.value = true
}

// 提交服务
const submitService = async () => {
  if (!serviceFormRef.value) return
  
  await serviceFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      let res
      if (serviceDialogType.value === 'create') {
        res = await billingApi.createServicePricing(serviceForm.value)
      } else {
        res = await billingApi.updateServicePricing(serviceForm.value.id, serviceForm.value)
      }
      
      if (res.code === 200) {
        ElMessage.success(serviceDialogType.value === 'create' ? '创建成功' : '更新成功')
        serviceDialogVisible.value = false
        fetchServices()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (err) {
      console.error('提交服务失败:', err)
      ElMessage.error('操作失败')
    }
  })
}

// 删除服务
const deleteService = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除服务"${row.service_name}"吗？`, '确认删除', {
      type: 'warning'
    })
    
    const res = await billingApi.deleteServicePricing(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchServices()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除服务失败:', err)
      ElMessage.error('删除失败')
    }
  }
}

// 切换免费状态
const handleFreeChange = async (row) => {
  try {
    const res = await billingApi.setServiceFree(row.id, row.is_free)
    if (res.code === 200) {
      ElMessage.success('设置成功')
    } else {
      ElMessage.error(res.message || '设置失败')
      row.is_free = !row.is_free
    }
  } catch (err) {
    console.error('设置免费状态失败:', err)
    row.is_free = !row.is_free
    ElMessage.error('设置失败')
  }
}

// 切换启用状态
const handleEnableChange = async (row) => {
  try {
    const res = await billingApi.toggleServicePricing(row.id, row.is_enabled)
    if (res.code === 200) {
      ElMessage.success('设置成功')
    } else {
      ElMessage.error(res.message || '设置失败')
      row.is_enabled = !row.is_enabled
    }
  } catch (err) {
    console.error('设置启用状态失败:', err)
    row.is_enabled = !row.is_enabled
    ElMessage.error('设置失败')
  }
}

// 显示套餐对话框
const showPlanDialog = (type, row = null) => {
  planDialogType.value = type
  if (type === 'edit' && row) {
    planForm.value = { ...row }
  } else {
    planForm.value = {
      id: '',
      plan_name: '',
      plan_type: 'monthly',
      service_type: '',
      price: 0,
      period_days: 30,
      check_count: 0,
      is_active: true,
      description: '',
      features: '',
      sort_order: 0
    }
  }
  planDialogVisible.value = true
}

// 提交套餐
const submitPlan = async () => {
  if (!planFormRef.value) return
  
  await planFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      let res
      if (planDialogType.value === 'create') {
        res = await billingApi.createPlan(planForm.value)
      } else {
        res = await billingApi.updatePlan(planForm.value.id, planForm.value)
      }
      
      if (res.code === 200) {
        ElMessage.success(planDialogType.value === 'create' ? '创建成功' : '更新成功')
        planDialogVisible.value = false
        fetchPlans()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (err) {
      console.error('提交套餐失败:', err)
      ElMessage.error('操作失败')
    }
  })
}

// 删除套餐
const deletePlan = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除套餐"${row.plan_name}"吗？`, '确认删除', {
      type: 'warning'
    })
    
    const res = await billingApi.deletePlan(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchPlans()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除套餐失败:', err)
      ElMessage.error('删除失败')
    }
  }
}

// 获取计费模式显示名称
const getPricingModelName = (model) => {
  const names = {
    free: '免费',
    count: '按次',
    month: '按月',
    year: '按年'
  }
  return names[model] || model
}

const getPricingModelType = (model) => {
  const types = {
    free: 'success',
    count: 'warning',
    month: 'primary',
    year: 'primary'
  }
  return types[model] || 'info'
}

const getPlanTypeName = (type) => {
  const names = {
    monthly: '月度',
    yearly: '年度',
    permanent: '永久'
  }
  return names[type] || type
}

onMounted(() => {
  fetchServices()
  fetchPlans()
})
</script>

<style scoped>
.billing-settings {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.subtitle {
  margin: 8px 0 0;
  color: #909399;
  font-size: 14px;
}

.toolbar {
  margin-bottom: 16px;
}

.unit {
  margin-left: 8px;
  color: #909399;
}
</style>

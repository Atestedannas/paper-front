<template>
  <div class="permission-package-view">
    <div class="page-header">
      <h1 class="page-title">权限包管理</h1>
      <p class="page-subtitle">批量管理权限组，快速分配权限</p>
    </div>

    <el-card class="operation-card" shadow="hover">
      <div class="operation-content">
        <el-input
          v-model="searchQuery"
          placeholder="搜索权限包名称、代码"
          clearable
          size="large"
          @input="handleSearch"
          style="width: 300px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="large" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新建权限包
        </el-button>
      </div>
    </el-card>

    <el-card class="table-card" shadow="hover">
      <el-table
        :data="packages"
        :stripe="true"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="权限包名称" width="200" />
        <el-table-column prop="code" label="权限包代码" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="权限数量" width="100">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.permissions?.length || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="op-btns">
              <el-button type="primary" size="small" link @click="viewPackage(row)">
                查看
              </el-button>
              <el-button type="warning" size="small" link @click="editPackage(row)">
                编辑
              </el-button>
              <el-button type="danger" size="small" link @click="deletePackage(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-drawer
      v-model="detailDrawerVisible"
      title="权限包详情"
      direction="rtl"
      :size="600"
    >
      <div v-if="selectedPackage" class="package-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="权限包名称">{{ selectedPackage.name }}</el-descriptions-item>
          <el-descriptions-item label="权限包代码">{{ selectedPackage.code }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ selectedPackage.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedPackage.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(selectedPackage.updated_at) }}</el-descriptions-item>
        </el-descriptions>

        <div class="permissions-section">
          <h4>包含的权限 ({{ selectedPackage.permissions?.length || 0 }})</h4>
          <el-table :data="selectedPackage.permissions" max-height="400" size="small">
            <el-table-column prop="name" label="权限名称" width="150" />
            <el-table-column prop="code" label="权限代码" width="180" />
            <el-table-column prop="resource_type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag size="small">{{ row.resource_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="method" label="方法" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.resource_type === 'api'" :type="getMethodTag(row.method)" size="small">
                  {{ row.method }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑权限包' : '新建权限包'"
      width="700px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入权限包名称" />
        </el-form-item>
        <el-form-item label="代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入权限包代码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限包描述"
          />
        </el-form-item>
        <el-form-item label="权限选择">
          <div class="permission-selector">
            <div class="permission-search">
              <el-input
                v-model="permissionSearch"
                placeholder="搜索权限"
                clearable
                size="small"
                style="width: 200px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
            <el-table
              :data="filteredAllPermissions"
              max-height="300"
              @selection-change="handlePermissionSelection"
            >
              <el-table-column type="selection" width="50" />
              <el-table-column prop="name" label="权限名称" />
              <el-table-column prop="code" label="权限代码" width="150" />
              <el-table-column prop="resource_type" label="类型" width="80">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.resource_type }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="cloneDrawerVisible"
      title="克隆权限包"
      direction="rtl"
      :size="400"
    >
      <el-form
        ref="cloneFormRef"
        :model="cloneForm"
        :rules="cloneRules"
        label-width="100px"
      >
        <el-form-item label="原权限包">
          <span>{{ selectedPackage?.name }}</span>
        </el-form-item>
        <el-form-item label="新代码" prop="newCode">
          <el-input v-model="cloneForm.newCode" placeholder="请输入新权限包代码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cloneDrawerVisible = false">取消</el-button>
        <el-button type="primary" @click="submitClone">确定克隆</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import permissionPackageApi from '@/api/permission-package'
import rbacApi from '@/api/rbac'

const loading = ref(false)
const packages = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const form = reactive({
  name: '',
  code: '',
  description: '',
  permission_ids: []
})

const rules = {
  name: [
    { required: true, message: '请输入权限包名称', trigger: 'blur' },
    { min: 2, max: 100, message: '名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限包代码', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]*$/, message: '权限包代码必须以小写字母开头，只能包含小写字母、数字和下划线', trigger: 'blur' }
  ]
}

const detailDrawerVisible = ref(false)
const selectedPackage = ref(null)

const cloneDrawerVisible = ref(false)
const cloneFormRef = ref()
const cloneForm = reactive({
  newCode: ''
})

const cloneRules = {
  newCode: [
    { required: true, message: '请输入新代码', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]*$/, message: '代码必须以小写字母开头，只能包含小写字母、数字和下划线', trigger: 'blur' }
  ]
}

const allPermissions = ref([])
const permissionSearch = ref('')
const selectedPermissionIds = ref([])

const filteredAllPermissions = computed(() => {
  if (!permissionSearch.value) return allPermissions.value
  return allPermissions.value.filter(p =>
    p.name?.includes(permissionSearch.value) ||
    p.code?.includes(permissionSearch.value)
  )
})

const loadPackages = async () => {
  try {
    loading.value = true
    const res = await permissionPackageApi.getPackages({
      q: searchQuery.value,
      page: currentPage.value,
      page_size: pageSize.value
    })
    packages.value = res?.items || []
    total.value = res?.total || 0
  } catch (e) {
    ElMessage.error('加载权限包列表失败')
  } finally {
    loading.value = false
  }
}

const loadAllPermissions = async () => {
  try {
    const res = await rbacApi.getPermissions()
    allPermissions.value = res || []
  } catch (e) {
    console.error('加载权限列表失败')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadPackages()
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  loadPackages()
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  loadPackages()
}

const formatDate = (s) => {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const getMethodTag = (method) => {
  const map = { GET: '', POST: 'success', PUT: 'warning', DELETE: 'danger' }
  return map[method] || 'info'
}

const showCreateDialog = async () => {
  isEdit.value = false
  Object.assign(form, {
    name: '',
    code: '',
    description: '',
    permission_ids: []
  })
  selectedPermissionIds.value = []
  await loadAllPermissions()
  dialogVisible.value = true
}

const viewPackage = async (row) => {
  try {
    const res = await permissionPackageApi.getPackageByID(row.id)
    selectedPackage.value = res
    detailDrawerVisible.value = true
  } catch (e) {
    ElMessage.error('获取权限包详情失败')
  }
}

const editPackage = async (row) => {
  try {
    const res = await permissionPackageApi.getPackageByID(row.id)
    selectedPackage.value = res
    isEdit.value = true
    Object.assign(form, {
      name: res.name,
      code: res.code,
      description: res.description,
      permission_ids: res.permissions?.map(p => p.id) || []
    })
    selectedPermissionIds.value = res.permissions?.map(p => p.id) || []
    await loadAllPermissions()
    dialogVisible.value = true
  } catch (e) {
    ElMessage.error('获取权限包详情失败')
  }
}

const deletePackage = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限包 "${row.name}" 吗？此操作不可恢复！`,
      '确认删除',
      { type: 'warning' }
    )
    await permissionPackageApi.deletePackage(row.id)
    ElMessage.success('删除成功')
    loadPackages()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handlePermissionSelection = (selection) => {
  selectedPermissionIds.value = selection.map(p => p.id)
}

const handleSelectionChange = (selection) => {
  console.log('Selection changed:', selection)
}

const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    const data = {
      name: form.name,
      code: form.code,
      description: form.description,
      permission_ids: selectedPermissionIds.value
    }
    
    if (isEdit.value) {
      await permissionPackageApi.updatePackage(selectedPackage.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await permissionPackageApi.createPackage(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadPackages()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const submitClone = async () => {
  if (!cloneFormRef.value) return
  try {
    await cloneFormRef.value.validate()
    await permissionPackageApi.clonePackage(selectedPackage.value.id, cloneForm.newCode)
    ElMessage.success('克隆成功')
    cloneDrawerVisible.value = false
    loadPackages()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('克隆失败')
    }
  }
}

onMounted(() => {
  loadPackages()
})
</script>

<style scoped>
.permission-package-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.operation-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.operation-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.table-card {
  border-radius: 12px;
  overflow: hidden;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.op-btns {
  display: flex;
  gap: 4px;
}

.package-detail {
  padding: 20px;
}

.permissions-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.permissions-section h4 {
  margin: 0 0 16px 0;
  color: #374151;
}

.permission-selector {
  width: 100%;
}

.permission-search {
  margin-bottom: 12px;
}
</style>

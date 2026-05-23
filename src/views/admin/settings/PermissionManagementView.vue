<template>
  <div class="permission-management">
    <div class="page-header">
      <h1 class="page-title">权限管理</h1>
      <p class="page-subtitle">管理系统权限，包括菜单权限、按钮权限、接口权限和数据权限</p>
    </div>

    <el-card class="operation-card" shadow="hover">
      <div class="operation-content">
        <div class="search-filter">
          <el-input
            v-model="searchQuery"
            placeholder="搜索权限名称、代码"
            clearable
            size="large"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="filterResourceType"
            placeholder="资源类型"
            clearable
            size="large"
            @change="handleFilter"
          >
            <el-option label="接口权限 (api)" value="api" />
            <el-option label="菜单权限 (menu)" value="menu" />
            <el-option label="按钮权限 (button)" value="button" />
          </el-select>

          <el-select
            v-model="filterMethod"
            placeholder="请求方法"
            clearable
            size="large"
            @change="handleFilter"
          >
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </div>

        <el-button type="primary" size="large" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新建权限
        </el-button>
      </div>
    </el-card>

    <el-card class="table-card" shadow="hover">
      <el-table
        :data="filteredPermissions"
        :stripe="true"
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="name" label="权限名称" width="180" />
        <el-table-column prop="code" label="权限代码" width="200" />
        <el-table-column prop="resource_type" label="资源类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getResourceTypeTag(row.resource_type)" size="small">
              {{ getResourceTypeLabel(row.resource_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="method" label="方法" width="100">
          <template #default="{ row }">
            <el-tag
              v-if="row.resource_type === 'api'"
              :type="getMethodTag(row.method)"
              size="small"
            >
              {{ row.method }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="资源路径" min-width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="op-btns">
              <el-button type="primary" size="small" link @click="viewPermission(row)">
                查看
              </el-button>
              <el-button type="warning" size="small" link @click="editPermission(row)">
                编辑
              </el-button>
              <el-button type="danger" size="small" link @click="deletePermission(row)">
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
      title="权限详情"
      direction="rtl"
      :size="500"
    >
      <div v-if="selectedPermission" class="permission-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="权限名称">{{ selectedPermission.name }}</el-descriptions-item>
          <el-descriptions-item label="权限代码">{{ selectedPermission.code }}</el-descriptions-item>
          <el-descriptions-item label="资源类型">
            <el-tag :type="getResourceTypeTag(selectedPermission.resource_type)">
              {{ getResourceTypeLabel(selectedPermission.resource_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="请求方法">
            <el-tag
              v-if="selectedPermission.resource_type === 'api'"
              :type="getMethodTag(selectedPermission.method)"
            >
              {{ selectedPermission.method }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="资源路径">{{ selectedPermission.path || '-' }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{ selectedPermission.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedPermission.created_at) }}</el-descriptions-item>
        </el-descriptions>

        <div class="roles-section">
          <h4>关联角色</h4>
          <el-tag
            v-for="role in permissionRoles"
            :key="role.id"
            type="info"
            size="small"
            class="role-tag"
          >
            {{ role.name }}
          </el-tag>
          <span v-if="permissionRoles.length === 0" class="no-roles">暂无关联角色</span>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑权限' : '新建权限'"
      width="550px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入权限代码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="资源类型" prop="resource_type">
          <el-select v-model="form.resource_type" placeholder="请选择资源类型" @change="handleResourceTypeChange">
            <el-option label="接口权限 (api)" value="api" />
            <el-option label="菜单权限 (menu)" value="menu" />
            <el-option label="按钮权限 (button)" value="button" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.resource_type === 'api'" label="请求方法" prop="method">
          <el-select v-model="form.method" placeholder="请选择请求方法">
            <el-option label="GET - 查询" value="GET" />
            <el-option label="POST - 创建" value="POST" />
            <el-option label="PUT - 更新" value="PUT" />
            <el-option label="PATCH - 部分更新" value="PATCH" />
            <el-option label="DELETE - 删除" value="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.resource_type === 'api'" label="资源路径" prop="path">
          <el-input v-model="form.path" placeholder="如: /api/v1/users" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import rbacApi from '@/api/rbac'

const loading = ref(false)
const permissions = ref([])
const searchQuery = ref('')
const filterResourceType = ref('')
const filterMethod = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const form = reactive({
  name: '',
  code: '',
  resource_type: 'api',
  method: 'GET',
  path: '',
  description: ''
})

const rules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 100, message: '权限名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限代码', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_:]*$/, message: '权限代码必须以小写字母开头，只能包含小写字母、数字、下划线和冒号', trigger: 'blur' }
  ],
  resource_type: [
    { required: true, message: '请选择资源类型', trigger: 'change' }
  ],
  method: [
    { required: true, message: '请选择请求方法', trigger: 'change' }
  ]
}

const detailDrawerVisible = ref(false)
const selectedPermission = ref(null)
const permissionRoles = ref([])

const filteredPermissions = computed(() => {
  if (!permissions.value.length) return []
  return permissions.value.filter(p => {
    const matchesSearch = !searchQuery.value ||
      p.name?.includes(searchQuery.value) ||
      p.code?.includes(searchQuery.value)
    const matchesType = !filterResourceType.value || p.resource_type === filterResourceType.value
    const matchesMethod = !filterMethod.value ||
      (p.resource_type !== 'api' && filterMethod.value !== 'GET') ||
      p.method === filterMethod.value
    return matchesSearch && matchesType && matchesMethod
  })
})

const loadPermissions = async () => {
  try {
    loading.value = true
    const res = await rbacApi.getPermissions({ page: currentPage.value, page_size: pageSize.value })
    permissions.value = res?.items || res || []
    total.value = res?.total || permissions.value.length
  } catch (e) {
    ElMessage.error('加载权限列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  loadPermissions()
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  loadPermissions()
}

const getResourceTypeTag = (type) => {
  const map = { api: 'primary', menu: 'success', button: 'warning' }
  return map[type] || 'info'
}

const getResourceTypeLabel = (type) => {
  const map = { api: '接口', menu: '菜单', button: '按钮' }
  return map[type] || type
}

const getMethodTag = (method) => {
  const map = { GET: '', POST: 'success', PUT: 'warning', DELETE: 'danger', PATCH: 'info' }
  return map[method] || 'info'
}

const formatDate = (s) => {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const showCreateDialog = () => {
  isEdit.value = false
  Object.assign(form, {
    name: '',
    code: '',
    resource_type: 'api',
    method: 'GET',
    path: '',
    description: ''
  })
  dialogVisible.value = true
}

const editPermission = (row) => {
  isEdit.value = true
  Object.assign(form, {
    name: row.name,
    code: row.code,
    resource_type: row.resource_type,
    method: row.method || 'GET',
    path: row.path || '',
    description: row.description || ''
  })
  dialogVisible.value = true
}

const viewPermission = async (row) => {
  selectedPermission.value = row
  try {
    const roles = await rbacApi.getRolePermissions(row.id)
    permissionRoles.value = roles || []
  } catch (e) {
    permissionRoles.value = []
  }
  detailDrawerVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      await rbacApi.updatePermission(selectedPermission.value.id, form)
      ElMessage.success('权限更新成功')
    } else {
      await rbacApi.createPermission(form)
      ElMessage.success('权限创建成功')
    }
    dialogVisible.value = false
    loadPermissions()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const deletePermission = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限 "${row.name}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    await rbacApi.deletePermission(row.id)
    ElMessage.success('权限删除成功')
    loadPermissions()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleResourceTypeChange = (type) => {
  if (type !== 'api') {
    form.method = ''
    form.path = ''
  } else {
    form.method = 'GET'
  }
}

onMounted(() => {
  loadPermissions()
})
</script>

<style scoped>
.permission-management {
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
  flex-wrap: wrap;
  gap: 16px;
}

.search-filter {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
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

.permission-detail {
  padding: 20px;
}

.roles-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.roles-section h4 {
  margin: 0 0 12px 0;
  color: #374151;
}

.role-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.no-roles {
  color: #9ca3af;
  font-size: 14px;
}
</style>

<template>
  <div class="role-management">
    <div class="page-header">
      <h1 class="page-title">角色管理</h1>
      <p class="page-subtitle">RBAC模型核心 - 管理角色分层、继承和权限分配</p>
    </div>

    <div class="content-container">
      <el-row :gutter="20">
        <el-col :span="roleTreeSpan">
          <el-card class="tree-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>角色层级</span>
                <el-button type="primary" size="small" @click="showCreateRootDialog">
                  <el-icon><Plus /></el-icon>
                  新建角色
                </el-button>
              </div>
            </template>
            <el-input
              v-model="treeFilter"
              placeholder="搜索角色"
              prefix-icon="Search"
              clearable
              size="small"
              class="tree-filter"
            />
            <el-tree
              ref="roleTreeRef"
              :data="roleTree"
              :props="treeProps"
              :filter-node-method="filterNode"
              node-key="id"
              highlight-current
              default-expand-all
              @node-click="handleNodeClick"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <el-icon class="type-icon" :class="data.type">
                    <component :is="data.type === 'system' ? 'Lock' : 'User'"/>
                  </el-icon>
                  <span class="node-label">{{ node.label }}</span>
                  <el-tag
                    v-if="data.parent_id"
                    type="info"
                    size="small"
                    effect="plain"
                  >
                    继承
                  </el-tag>
                </div>
              </template>
            </el-tree>
          </el-card>
        </el-col>

        <el-col :span="24 - roleTreeSpan">
          <el-card v-if="selectedRole" class="detail-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>角色详情 - {{ selectedRole.name }}</span>
                <div class="header-actions">
                  <el-button type="primary" size="small" @click="showEditDialog">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    :disabled="selectedRole.code === 'super_admin'"
                    @click="deleteRole"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>
            </template>

            <el-tabs v-model="activeTab">
              <el-tab-pane label="基本信息" name="info">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="角色名称">{{ selectedRole.name }}</el-descriptions-item>
                  <el-descriptions-item label="角色代码">{{ selectedRole.code }}</el-descriptions-item>
                  <el-descriptions-item label="角色类型">
                    <el-tag :type="selectedRole.type === 'system' ? 'danger' : 'primary'">
                      {{ selectedRole.type === 'system' ? '系统角色' : '业务角色' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="状态">
                    <el-tag :type="selectedRole.status === 'active' ? 'success' : 'info'">
                      {{ selectedRole.status === 'active' ? '启用' : '禁用' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="描述" :span="2">{{ selectedRole.description || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="创建时间">{{ formatDate(selectedRole.created_at) }}</el-descriptions-item>
                  <el-descriptions-item label="更新时间">{{ formatDate(selectedRole.updated_at) }}</el-descriptions-item>
                  <el-descriptions-item label="父级角色">
                    <span v-if="selectedRole.parent">{{ selectedRole.parent.name }}</span>
                    <span v-else>-</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="子角色数量">{{ selectedRole.children?.length || 0 }}</el-descriptions-item>
                </el-descriptions>
              </el-tab-pane>

              <el-tab-pane label="权限分配" name="permissions">
                <div class="permission-header">
                  <el-input
                    v-model="permissionFilter"
                    placeholder="搜索权限"
                    prefix-icon="Search"
                    clearable
                    size="small"
                    style="width: 250px"
                  />
                  <el-button type="primary" size="small" @click="showBatchAssignDialog">
                    <el-icon><Plus /></el-icon>
                    批量分配
                  </el-button>
                </div>
                <el-table
                  :data="filteredPermissions"
                  :stripe="true"
                  style="width: 100%"
                  max-height="400"
                >
                  <el-table-column prop="name" label="权限名称" width="180" />
                  <el-table-column prop="code" label="权限代码" width="180" />
                  <el-table-column prop="resource_type" label="资源类型" width="120">
                    <template #default="{ row }">
                      <el-tag size="small" :type="getResourceTypeTag(row.resource_type)">
                        {{ row.resource_type }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="method" label="方法" width="100">
                    <template #default="{ row }">
                      <el-tag size="small" :type="getMethodTag(row.method)">
                        {{ row.method }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="path" label="路径" show-overflow-tooltip />
                  <el-table-column label="操作" width="100">
                    <template #default="{ row }">
                      <el-button
                        type="danger"
                        size="small"
                        link
                        @click="revokePermission(row.id)"
                      >
                        移除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
              <el-tab-pane label="路由分配" name="routes">
                <div class="permission-header">
                  <el-input
                    v-model="routeFilter"
                    placeholder="搜索路由"
                    prefix-icon="Search"
                    clearable
                    size="small"
                    style="width: 250px"
                  />
                  <div style="display: flex; gap: 8px;">
                    <el-button size="small" @click="selectAllRoutes">全选</el-button>
                    <el-button size="small" @click="clearAllRoutes">清空</el-button>
                    <el-button type="primary" size="small" @click="saveRoleRoutes">保存路由配置</el-button>
                  </div>
                </div>
                <el-table
                  :data="filteredRouteOptions"
                  :stripe="true"
                  style="width: 100%"
                  max-height="420"
                >
                  <el-table-column width="60">
                    <template #default="{ row }">
                      <el-checkbox
                        :model-value="selectedRouteNames.includes(row.name)"
                        @change="() => toggleRouteSelection(row.name)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column prop="title" label="路由名称" width="220" />
                  <el-table-column prop="name" label="路由标识" width="240" />
                  <el-table-column prop="path" label="路径" />
                </el-table>
              </el-tab-pane>

              <el-tab-pane label="用户列表" name="users">
                <el-table
                  :data="roleUsers"
                  :stripe="true"
                  style="width: 100%"
                >
                  <el-table-column type="index" label="序号" width="60" />
                  <el-table-column prop="username" label="用户名" width="150" />
                  <el-table-column prop="email" label="邮箱" width="200" />
                  <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                        {{ row.status === 'active' ? '启用' : '禁用' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="created_at" label="注册时间" width="180">
                    <template #default="{ row }">
                      {{ formatDate(row.created_at) }}
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>

              <el-tab-pane label="子角色" name="children">
                <el-table
                  :data="selectedRole.children || []"
                  :stripe="true"
                  style="width: 100%"
                >
                  <el-table-column type="index" label="序号" width="60" />
                  <el-table-column prop="name" label="角色名称" width="150" />
                  <el-table-column prop="code" label="角色代码" width="150" />
                  <el-table-column prop="type" label="类型" width="100">
                    <template #default="{ row }">
                      <el-tag :type="row.type === 'system' ? 'danger' : 'primary'" size="small">
                        {{ row.type === 'system' ? '系统' : '业务' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="description" label="描述" show-overflow-tooltip />
                </el-table>
                <div class="add-child-section">
                  <el-button type="primary" plain size="small" @click="showCreateChildDialog">
                    <el-icon><Plus /></el-icon>
                    添加子角色
                  </el-button>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>

          <el-card v-else class="empty-card" shadow="hover">
            <el-empty description="请选择一个角色查看详情">
              <el-button type="primary" @click="showCreateRootDialog">新建角色</el-button>
            </el-empty>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-dialog
      v-model="roleDialogVisible"
      :title="isEdit ? '编辑角色' : '新建角色'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色代码" prop="code">
          <el-input v-model="roleForm.code" placeholder="请输入角色代码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="角色类型" prop="type">
          <el-select v-model="roleForm.type" placeholder="请选择角色类型" :disabled="isEdit && roleForm.type === 'system'">
            <el-option label="系统角色" value="system" />
            <el-option label="业务角色" value="business" />
          </el-select>
        </el-form-item>
        <el-form-item label="父级角色" prop="parent_id">
          <el-select v-model="roleForm.parent_id" placeholder="请选择父级角色（可选）" clearable>
            <el-option
              v-for="role in availableParentRoles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRoleForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchAssignVisible"
      title="批量分配权限"
      width="600px"
      destroy-on-close
    >
      <el-input
        v-model="batchSearch"
        placeholder="搜索权限"
        prefix-icon="Search"
        clearable
        class="batch-search"
      />
      <el-checkbox-group v-model="selectedPermissionIds">
        <el-table :data="availablePermissions" max-height="350">
          <el-table-column width="50">
            <template #default="{ row }">
              <el-checkbox :value="row.id" />
            </template>
          </el-table-column>
          <el-table-column prop="name" label="权限名称" />
          <el-table-column prop="code" label="权限代码" />
          <el-table-column prop="resource_type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ row.resource_type }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="batchAssignVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchAssign">确定分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Lock, User } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import rbacApi from '@/api/rbac'
import { getRoutesByRoleCode, setRoutesByRoleCode } from '@/utils/role-route-mapping'

const router = useRouter()

const roleTreeRef = ref(null)
const treeFilter = ref('')
const roleTree = ref([])
const selectedRole = ref(null)
const roleUsers = ref([])
const rolePermissions = ref([])
const availablePermissions = ref([])
const activeTab = ref('info')
const roleTreeSpan = ref(6)
const permissionFilter = ref('')
const routeFilter = ref('')
const selectedRouteNames = ref([])

const roleDialogVisible = ref(false)
const isEdit = ref(false)
const roleFormRef = ref()
const roleForm = reactive({
  name: '',
  code: '',
  type: 'business',
  parent_id: null,
  description: ''
})

const roleRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色代码', trigger: 'blur' },
    { min: 2, max: 50, message: '角色代码长度在 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]*$/, message: '角色代码必须以小写字母开头，只能包含小写字母、数字和下划线', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择角色类型', trigger: 'change' }
  ]
}

const treeProps = {
  label: 'name',
  children: 'children'
}

const batchAssignVisible = ref(false)
const batchSearch = ref('')
const selectedPermissionIds = ref([])

const availableParentRoles = computed(() => {
  if (!selectedRole.value) return roleTree.value
  return roleTree.value.filter(r => r.id !== selectedRole.value.id)
})

const filteredPermissions = computed(() => {
  if (!permissionFilter.value) return rolePermissions.value
  return rolePermissions.value.filter(p =>
    p.name?.includes(permissionFilter.value) ||
    p.code?.includes(permissionFilter.value)
  )
})

const availablePermissionsForBatch = computed(() => {
  if (!batchSearch.value) return availablePermissions.value
  return availablePermissions.value.filter(p =>
    p.name?.includes(batchSearch.value) ||
    p.code?.includes(batchSearch.value)
  )
})
const routeOptions = computed(() => {
  return router.getRoutes()
    .filter(r => String(r.path || '').startsWith('/admin/') && r.meta?.menu)
    .filter(r => r.name)
    .map(r => ({
      name: String(r.name),
      title: r.meta?.title || String(r.name),
      path: r.path,
      menuOrder: r.meta?.menuOrder || 0
    }))
    .sort((a, b) => a.menuOrder - b.menuOrder)
})

const filteredRouteOptions = computed(() => {
  if (!routeFilter.value) return routeOptions.value
  return routeOptions.value.filter(r =>
    r.title?.includes(routeFilter.value) ||
    r.name?.includes(routeFilter.value) ||
    r.path?.includes(routeFilter.value)
  )
})
watch(treeFilter, (val) => {
  roleTreeRef.value?.filter(val)
})

const filterNode = (value, data) => {
  if (!value) return true
  return data.name?.includes(value)
}

const loadRoles = async () => {
  try {
    const res = await rbacApi.getRoles()
    roleTree.value = buildTree(res || [])
  } catch (e) {
    ElMessage.error('加载角色列表失败')
  }
}

const buildTree = (roles) => {
  const map = {}
  const roots = []
  roles.forEach(r => {
    map[r.id] = { ...r, children: [] }
  })
  roles.forEach(r => {
    if (r.parent_id && map[r.parent_id]) {
      map[r.parent_id].children.push(map[r.id])
    } else {
      roots.push(map[r.id])
    }
  })
  return roots
}

const handleNodeClick = async (data) => {
  selectedRole.value = data
  activeTab.value = 'info'
  loadRoleRoutes(data.code)
  await loadRoleDetail(data.id)
}

const loadRoleDetail = async (roleId) => {
  try {
    const [role, permissions, users] = await Promise.all([
      rbacApi.getRoleByID(roleId),
      rbacApi.getRolePermissions(roleId),
      rbacApi.getUsersByRole(roleId, { page: 1, page_size: 100 })
    ])
    selectedRole.value = role
    loadRoleRoutes(role?.code)
    rolePermissions.value = permissions || []
    roleUsers.value = users?.users || []
    const allPerms = await rbacApi.getPermissions()
    availablePermissions.value = allPerms || []
  } catch (e) {
    ElMessage.error('加载角色详情失败')
  }
}

const showCreateRootDialog = () => {
  isEdit.value = false
  Object.assign(roleForm, {
    name: '',
    code: '',
    type: 'business',
    parent_id: null,
    description: ''
  })
  roleDialogVisible.value = true
}

const showCreateChildDialog = () => {
  if (!selectedRole.value) return
  isEdit.value = false
  Object.assign(roleForm, {
    name: '',
    code: '',
    type: 'business',
    parent_id: selectedRole.value.id,
    description: ''
  })
  roleDialogVisible.value = true
}

const showEditDialog = () => {
  if (!selectedRole.value) return
  isEdit.value = true
  Object.assign(roleForm, {
    name: selectedRole.value.name,
    code: selectedRole.value.code,
    type: selectedRole.value.type,
    parent_id: selectedRole.value.parent_id,
    description: selectedRole.value.description
  })
  roleDialogVisible.value = true
}

const submitRoleForm = async () => {
  if (!roleFormRef.value) return
  try {
    await roleFormRef.value.validate()
    if (isEdit.value) {
      await rbacApi.updateRole(selectedRole.value.id, roleForm)
      ElMessage.success('角色更新成功')
    } else {
      await rbacApi.createRole(roleForm)
      ElMessage.success('角色创建成功')
    }
    roleDialogVisible.value = false
    await loadRoles()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const deleteRole = async () => {
  if (!selectedRole.value) return
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${selectedRole.value.name}" 吗？此操作不可恢复！`,
      '确认删除',
      { type: 'warning' }
    )
    await rbacApi.deleteRole(selectedRole.value.id)
    ElMessage.success('角色删除成功')
    selectedRole.value = null
    await loadRoles()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const showBatchAssignDialog = async () => {
  if (!selectedRole.value) return
  try {
    const allPerms = await rbacApi.getPermissions()
    availablePermissions.value = allPerms || []
    const currentIds = rolePermissions.value.map(p => p.id)
    selectedPermissionIds.value = [...currentIds]
    batchAssignVisible.value = true
  } catch (e) {
    ElMessage.error('加载权限列表失败')
  }
}

const submitBatchAssign = async () => {
  if (!selectedRole.value) return
  try {
    const currentIds = rolePermissions.value.map(p => p.id)
    const toAdd = selectedPermissionIds.value.filter(id => !currentIds.includes(id))
    const toRemove = currentIds.filter(id => !selectedPermissionIds.value.includes(id))
    for (const pid of toRemove) {
      await rbacApi.removePermissionFromRole(selectedRole.value.id, pid)
    }
    for (const pid of toAdd) {
      await rbacApi.assignPermissionToRole(selectedRole.value.id, pid)
    }
    ElMessage.success('权限分配成功')
    batchAssignVisible.value = false
    await loadRoleDetail(selectedRole.value.id)
  } catch (e) {
    ElMessage.error('批量分配失败')
  }
}

const revokePermission = async (permissionId) => {
  if (!selectedRole.value) return
  try {
    await ElMessageBox.confirm('确定要移除此权限吗？', '确认移除', { type: 'warning' })
    await rbacApi.removePermissionFromRole(selectedRole.value.id, permissionId)
    ElMessage.success('权限已移除')
    await loadRoleDetail(selectedRole.value.id)
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('移除失败')
    }
  }
}


const ensureDefaultRoleRoutes = (names = []) => {
  return Array.from(new Set([...names, 'admin-settings-profile']))
}

const loadRoleRoutes = (roleCode) => {
  if (!roleCode) {
    selectedRouteNames.value = []
    return
  }
  selectedRouteNames.value = ensureDefaultRoleRoutes(getRoutesByRoleCode(roleCode))
}

const toggleRouteSelection = (routeName) => {
  const idx = selectedRouteNames.value.indexOf(routeName)
  if (idx > -1) {
    selectedRouteNames.value.splice(idx, 1)
  } else {
    selectedRouteNames.value.push(routeName)
  }
  selectedRouteNames.value = ensureDefaultRoleRoutes(selectedRouteNames.value)
}

const selectAllRoutes = () => {
  selectedRouteNames.value = ensureDefaultRoleRoutes(routeOptions.value.map(r => r.name))
}

const clearAllRoutes = () => {
  selectedRouteNames.value = ensureDefaultRoleRoutes([])
}

const saveRoleRoutes = () => {
  if (!selectedRole.value?.code) return
  const names = ensureDefaultRoleRoutes(selectedRouteNames.value)
  setRoutesByRoleCode(selectedRole.value.code, names)
  selectedRouteNames.value = names
  ElMessage.success('路由配置已保存')
}
const getResourceTypeTag = (type) => {
  const map = { api: 'primary', menu: 'success', button: 'warning' }
  return map[type] || 'info'
}

const getMethodTag = (method) => {
  const map = { GET: '', POST: 'success', PUT: 'warning', DELETE: 'danger' }
  return map[method] || 'info'
}

const formatDate = (s) => {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  loadRoles()
})
</script>

<style scoped>
.role-management {
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

.content-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tree-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tree-filter {
  margin-bottom: 12px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.type-icon {
  font-size: 16px;
}

.type-icon.system {
  color: #f56c6c;
}

.type-icon.business {
  color: #409eff;
}

.node-label {
  flex: 1;
}

.detail-card {
  border-radius: 12px;
}

.empty-card {
  border-radius: 12px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.add-child-section {
  margin-top: 16px;
}

.batch-search {
  margin-bottom: 12px;
}
</style>

<template>
  <div class="admin-users">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
      <p class="page-subtitle">管理系统中的所有用户</p>
    </div>

    <el-card class="operation-card" shadow="hover">
      <div class="operation-content">
        <div class="search-filter">
          <el-input v-model="searchQuery" placeholder="搜索用户名、邮箱" clearable size="large" @input="handleSearch">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select v-model="filterRole" placeholder="筛选角色" size="large" @change="handleFilter">
            <el-option label="全部角色" value="" />
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>

          <el-select v-model="filterStatus" placeholder="筛选状态" size="large" @change="handleFilter">
            <el-option label="全部状态" value="" />
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </div>

        <el-button type="primary" size="large" @click="createUser">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
      </div>
    </el-card>

    <el-card class="users-card" shadow="hover">
      <el-table :data="filteredUsers" :stripe="true" :border="false" style="width: 100%" v-loading="loading">
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="email" label="邮箱" width="220" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'primary' : 'success'">
              {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="免费权限" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.is_free_user" type="warning" size="small" effect="dark">免费</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right" class-name="col-ops">
          <template #default="scope">
            <div class="op-btns">
              <el-button type="primary" size="small" @click="editUser(scope.row.id)">编辑</el-button>
              <el-button :type="scope.row.status === 'active' ? 'danger' : 'success'" size="small" @click="toggleUserStatus(scope.row)">
                {{ scope.row.status === 'active' ? '禁用' : '启用' }}
              </el-button>
              <el-button v-if="canDeleteTargetUser(scope.row.id)" type="danger" size="small" @click="deleteUser(scope.row.id)" :disabled="scope.row.role === 'admin'">删除</el-button>
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
          :total="totalUsers"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="userDialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="900px" destroy-on-close :close-on-click-modal="false">
      <el-form ref="userFormRef" :model="userForm" :rules="userRules" label-width="100px">
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="基本信息" name="basic">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="isEdit" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email" placeholder="请输入邮箱" :disabled="isEdit" />
            </el-form-item>
            <el-form-item v-if="!isEdit" label="密码" prop="password">
              <el-input v-model="userForm.password" type="password" placeholder="请输入密码(6-20位)" show-password />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="userForm.status" placeholder="请选择状态">
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="disabled" />
              </el-select>
            </el-form-item>
            <el-form-item label="免费用户">
              <el-switch
                v-model="userForm.is_free_user"
                active-text="是"
                inactive-text="否"
                inline-prompt
              />
              <span class="form-tip">开启后该用户在付费模式下也可免费使用检查、修正和下载功能</span>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="角色列表" name="roles">
            <div class="role-assign-section">
              <div class="section-header">
                <el-input v-model="roleSearchQuery" placeholder="搜索角色..." prefix-icon="Search" clearable size="default" style="width: 300px" />
              </div>
              <div class="role-cards">
                <div
                  v-for="role in filteredAvailableRoles"
                  :key="role.id"
                  class="role-card"
                  :class="{ selected: selectedRoleIds.includes(role.id) }"
                  @click="toggleRoleSelection(role.id)"
                >
                  <div class="role-card-header">
                    <div class="role-card-title">
                      <span class="role-name">{{ role.name }}</span>
                      <el-tag :type="role.type === 'system' ? 'danger' : 'primary'" size="small" effect="plain">
                        {{ role.type === 'system' ? '系统' : '业务' }}
                      </el-tag>
                    </div>
                    <el-checkbox :model-value="selectedRoleIds.includes(role.id)" @click.stop="toggleRoleSelection(role.id)" />
                  </div>
                  <div class="role-card-desc" v-if="role.description">{{ role.description }}</div>
                  <div class="role-card-meta">
                    <span class="role-code">编码: {{ role.code }}</span>
                    <span class="role-permission-count" v-if="role.permission_count">权限数: {{ role.permission_count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="权限列表" name="permissions">
            <div class="permission-assign-section">
              <div class="section-header">
                <el-input v-model="permissionSearchQuery" placeholder="搜索权限..." prefix-icon="Search" clearable size="default" style="width: 300px" />
                <el-select v-model="permissionTypeFilter" placeholder="权限类型" clearable size="default" style="width: 150px">
                  <el-option label="全部" value="" />
                  <el-option label="API权限" value="api" />
                  <el-option label="菜单权限" value="menu" />
                  <el-option label="按钮权限" value="button" />
                </el-select>
              </div>

              <el-collapse v-model="activePermissionPackages" accordion>
                <el-collapse-item v-for="pkg in filteredPermissionPackages" :key="pkg.id" :name="pkg.id">
                  <template #title>
                    <div class="package-title">
                      <span class="package-name">{{ pkg.name }}</span>
                      <el-tag size="small" type="info">{{ pkg.permissions?.length || 0 }} 个权限</el-tag>
                    </div>
                  </template>
                  <div class="permission-list">
                    <div
                      v-for="perm in filterPermissions(pkg.permissions)"
                      :key="perm.id"
                      class="permission-item"
                      :class="{ selected: selectedPermissionIds.includes(perm.id) }"
                      @click="togglePermissionSelection(perm.id)"
                    >
                      <div class="permission-info">
                        <div class="permission-name">{{ perm.name }}</div>
                        <div class="permission-detail">
                          <el-tag size="small" :type="getPermissionTypeTag(perm.resource_type)">
                            {{ getPermissionTypeLabel(perm.resource_type) }}
                          </el-tag>
                          <span class="permission-resource" v-if="perm.resource">资源: {{ perm.resource }}</span>
                          <span class="permission-action" v-if="perm.action">操作: {{ perm.action }}</span>
                        </div>
                      </div>
                      <el-checkbox :model-value="selectedPermissionIds.includes(perm.id)" @click.stop="togglePermissionSelection(perm.id)" />
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-tab-pane>

          <el-tab-pane label="权限预览" name="preview">
            <div class="preview-section">
              <div class="preview-card">
                <h4>已选角色 ({{ selectedRoleIds.length }})</h4>
                <div class="selected-roles">
                  <el-tag v-for="roleId in selectedRoleIds" :key="roleId" type="primary" size="default" closable @close="toggleRoleSelection(roleId)">
                    {{ getRoleNameById(roleId) }}
                  </el-tag>
                  <el-tag v-if="selectedRoleIds.length === 0" type="info" effect="plain">未选择角色</el-tag>
                </div>
              </div>

              <div class="preview-card">
                <h4>直接分配的权限 ({{ selectedPermissionIds.length }})</h4>
                <div class="selected-permissions">
                  <el-tag v-for="permId in selectedPermissionIds" :key="permId" type="success" size="default" closable @close="togglePermissionSelection(permId)">
                    {{ getPermissionNameById(permId) }}
                  </el-tag>
                  <el-tag v-if="selectedPermissionIds.length === 0" type="info" effect="plain">未分配额外权限</el-tag>
                </div>
              </div>

              <div class="preview-card" v-if="roleInheritedPermissionIds.size > 0">
                <h4>角色继承的权限 ({{ roleInheritedPermissionIds.size }})</h4>
                <div class="selected-permissions">
                  <el-tag v-for="permId in Array.from(roleInheritedPermissionIds)" :key="permId" type="info" size="default">
                    {{ getPermissionNameById(permId) }}
                  </el-tag>
                </div>
              </div>

              <el-alert type="info" :closable="false" show-icon class="preview-tip">
                <template #title>
                  <div class="tip-content">
                    <p><strong>注意事项</strong></p>
                    <ul>
                      <li>最终权限 = 角色权限 + 直接分配的权限</li>
                      <li>选择角色会自动继承该角色的所有权限</li>
                      <li>直接分配的权限仅对当前用户生效</li>
                    </ul>
                  </div>
                </template>
              </el-alert>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUserForm" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import rbacApi from '@/api/rbac'
import { getUsers as apiGetUsers, createUser as apiCreateUser, updateUser as apiUpdateUser, deleteUser as apiDeleteUser, updateUserStatus as apiUpdateUserStatus } from '@/api/admin'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const searchQuery = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const loading = ref(false)
const users = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalUsers = ref(0)

const userDialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const userFormRef = ref()
const activeTab = ref('basic')
const editingUserId = ref('')

const userForm = reactive({
  username: '',
  email: '',
  password: '',
  status: 'active',
  is_free_user: false
})

const userRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: '请输入正确的邮箱地址',
      trigger: 'blur'
    }
  ],
  password: [
    { required: !isEdit.value, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
})

const selectedUser = ref(null)
const userRoles = ref([])
const userPermissions = ref([])

const availableRoles = ref([])
const allPermissions = ref([])
const permissionPackages = ref([])
const roleSearchQuery = ref('')
const permissionSearchQuery = ref('')
const permissionTypeFilter = ref('')
const activePermissionPackages = ref([])
const selectedRoleIds = ref([])
const selectedPermissionIds = ref([])
const roleInheritedPermissionIds = ref(new Set())

const normalizeList = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.results)) return data.results
  return []
}

const filteredAvailableRoles = computed(() => {
  if (!roleSearchQuery.value) return availableRoles.value
  return availableRoles.value.filter(r =>
    (r.name && r.name.includes(roleSearchQuery.value)) ||
    (r.code && r.code.includes(roleSearchQuery.value))
  )
})

const filteredPermissionPackages = computed(() => {
  if (!permissionSearchQuery.value && !permissionTypeFilter.value) return permissionPackages.value
  return permissionPackages.value
    .map(pkg => {
      const filteredPerms = filterPermissions(pkg.permissions || [])
      return { ...pkg, permissions: filteredPerms }
    })
    .filter(pkg => pkg.permissions.length > 0)
})

const getPermissionTypeLabel = (type) => {
  const map = { api: 'API权限', menu: '菜单权限', button: '按钮权限' }
  return map[type] || type
}

const getPermissionTypeTag = (type) => {
  const map = { api: 'primary', menu: 'success', button: 'warning' }
  return map[type] || 'info'
}

const filterPermissions = (permissions) => {
  return permissions.filter(perm => {
    const matchesSearch = !permissionSearchQuery.value ||
      (perm.name && perm.name.includes(permissionSearchQuery.value)) ||
      (perm.resource && perm.resource.includes(permissionSearchQuery.value)) ||
      (perm.action && perm.action.includes(permissionSearchQuery.value))
    const matchesType = !permissionTypeFilter.value || perm.resource_type === permissionTypeFilter.value
    return matchesSearch && matchesType
  })
}

const getRoleNameById = (roleId) => {
  const role = availableRoles.value.find(r => String(r.id) === String(roleId))
  return role ? role.name : `角色${roleId}`
}

const getPermissionNameById = (permId) => {
  const perm = allPermissions.value.find(p => String(p.id) === String(permId))
  return perm ? perm.name : `权限${permId}`
}

const toggleRoleSelection = (roleId) => {
  const index = selectedRoleIds.value.indexOf(roleId)
  if (index > -1) selectedRoleIds.value.splice(index, 1)
  else selectedRoleIds.value.push(roleId)
}

const togglePermissionSelection = (permId) => {
  const index = selectedPermissionIds.value.indexOf(permId)
  if (index > -1) selectedPermissionIds.value.splice(index, 1)
  else selectedPermissionIds.value.push(permId)
}

const loadUsers = async () => {
  try {
    loading.value = true
    const params = {
      q: searchQuery.value || '',
      role: filterRole.value || '',
      status: filterStatus.value || '',
      page: currentPage.value,
      page_size: pageSize.value
    }
    const data = await apiGetUsers(params)
    users.value = Array.isArray(data?.users) ? data.users : Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : [])
    totalUsers.value = typeof data?.total === 'number' ? data.total : users.value.length
    if (typeof data?.page === 'number') currentPage.value = data.page
    if (typeof data?.page_size === 'number') pageSize.value = data.page_size
  } catch (e) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  if (users.value.length === 0) return []
  if (!searchQuery.value && !filterRole.value && !filterStatus.value) return users.value
  return users.value.filter(user => {
    const matchesSearch = !searchQuery.value || (user.username && user.username.includes(searchQuery.value)) || (user.email && user.email.includes(searchQuery.value))
    const matchesRole = !filterRole.value || user.role === filterRole.value
    const matchesStatus = !filterStatus.value || user.status === filterStatus.value
    return matchesSearch && matchesRole && matchesStatus
  })
})

const getInitial = (name) => {
  if (!name || typeof name !== 'string') return 'U'
  return name.charAt(0).toUpperCase()
}

const formatDateTime = (s) => {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const canDeleteUser = computed(() => {
  if (userStore.isAdmin) return true
  return userStore.permissions.some(p => p === 'user:delete' || p === 'admin:user:delete' || p === 'delete' || (typeof p === 'object' && p.code === 'user:delete'))
})

const canDeleteTargetUser = (userId) => {
  if (userStore.user?.id === userId) return false
  return canDeleteUser.value
}

const handleSearch = () => { currentPage.value = 1; loadUsers() }
const handleFilter = () => { currentPage.value = 1; loadUsers() }
const handleSizeChange = (newSize) => { pageSize.value = newSize; currentPage.value = 1; loadUsers() }
const handleCurrentChange = (newPage) => { currentPage.value = newPage; loadUsers() }

const viewUser = async (userId) => {
  const user = users.value.find(u => u.id === userId)
  if (!user) return
  selectedUser.value = user
  try {
    const [roles, permissions] = await Promise.all([
      rbacApi.getUserRoles(userId),
      rbacApi.getUserPermissions(userId)
    ])
    userRoles.value = roles || []
    userPermissions.value = permissions || []
  } catch (e) {
    userRoles.value = []
    userPermissions.value = []
  }
}

const editUser = async (userId) => {
  const user = users.value.find(u => u.id === userId)
  if (!user) return

  isEdit.value = true
  editingUserId.value = userId
  userForm.username = user.username
  userForm.email = user.email
  userForm.status = user.status
  userForm.is_free_user = !!user.is_free_user
  selectedRoleIds.value = []
  selectedPermissionIds.value = []
  roleInheritedPermissionIds.value = new Set()

  try {
    const [roles, directPermissions] = await Promise.all([
      rbacApi.getUserRoles(userId),
      rbacApi.getUserDirectPermissions(userId)
    ])

    const roleList = normalizeList(roles)
    const directPermissionList = normalizeList(directPermissions)
    selectedRoleIds.value = roleList.map(r => r.id)

    for (const role of roleList) {
      const rolePerms = await rbacApi.getRolePermissions(role.id)
      normalizeList(rolePerms).forEach(p => roleInheritedPermissionIds.value.add(p.id))
    }

    selectedPermissionIds.value = directPermissionList.map(p => p.id)
  } catch (e) {
    console.error('编辑用户时加载角色/权限失败:', e)
  }

  userDialogVisible.value = true
}

const createUser = () => {
  isEdit.value = false
  editingUserId.value = ''
  Object.assign(userForm, { username: '', email: '', password: '', status: 'active', is_free_user: false })
  selectedRoleIds.value = []
  selectedPermissionIds.value = []
  roleInheritedPermissionIds.value = new Set()
  activeTab.value = 'basic'
  userDialogVisible.value = true
}

const toggleUserStatus = async (user) => {
  try {
    const newStatus = user.status === 'active' ? 'disabled' : 'active'
    const actionText = newStatus === 'active' ? '启用' : '禁用'
    await ElMessageBox.confirm(`确定要${actionText}用户 "${user.username}" 吗？`, '确认操作', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    await apiUpdateUserStatus(user.id, newStatus)
    user.status = newStatus
    ElMessage.success(`用户已${actionText}`)
  } catch (error) {
    if (error !== 'cancel') {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || '操作失败'
      ElMessage.error(msg)
    }
  }
}

const deleteUser = async (userId) => {
  try {
    const user = users.value.find(u => u.id === userId)
    if (!user) return
    await ElMessageBox.confirm(`确认彻底删除用户 "${user.username}" 吗？`, '确认删除', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'danger' })
    await apiDeleteUser(userId)
    ElMessage.success('用户已删除')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

const submitUserForm = async () => {
  if (!userFormRef.value) return
  try {
    await userFormRef.value.validate()
    submitting.value = true

    const selectedRoles = selectedRoleIds.value.map(id => availableRoles.value.find(r => r.id === id)).filter(Boolean)
    const primaryRoleCode = selectedRoles[0]?.code || 'user'

    const payload = {
      username: userForm.username,
      email: userForm.email,
      status: userForm.status,
      is_free_user: userForm.is_free_user,
      role: primaryRoleCode,
      role_ids: [...selectedRoleIds.value],
      permission_ids: [...selectedPermissionIds.value]
    }

    if (!isEdit.value) {
      payload.password = userForm.password
      await apiCreateUser(payload)
      ElMessage.success('用户创建成功')
    } else {
      await apiUpdateUser(editingUserId.value, payload)
      ElMessage.success('用户更新成功')
    }

    userDialogVisible.value = false
    await loadUsers()
  } catch (error) {
    if (submitting.value) {
      ElMessage.error(error?.response?.data?.message || '提交失败')
    }
  } finally {
    submitting.value = false
  }
}

const loadRolesAndPermissions = async () => {
  try {
    const [rolesResult, permissionsResult] = await Promise.allSettled([
      rbacApi.getRoles({ page_size: 200 }),
      rbacApi.getPermissions({ page_size: 1000 })
    ])

    const roleList = rolesResult.status === 'fulfilled' ? normalizeList(rolesResult.value) : []
    const permissionList = permissionsResult.status === 'fulfilled' ? normalizeList(permissionsResult.value) : []

    availableRoles.value = roleList
    allPermissions.value = permissionList
    const packagesMap = new Map()
    permissionList.forEach(perm => {
      const pkgId = perm.package_id || 'default'
      const pkgName = perm.package_name || '默认权限包'
      if (!packagesMap.has(pkgId)) {
        packagesMap.set(pkgId, { id: pkgId, name: pkgName, permissions: [] })
      }
      packagesMap.get(pkgId).permissions.push(perm)
    })
    permissionPackages.value = Array.from(packagesMap.values())

    if (rolesResult.status === 'rejected' || permissionsResult.status === 'rejected') {
      ElMessage.warning('角色或权限接口部分不可用，已自动降级处理')
    }
  } catch (e) {
    ElMessage.warning('角色/权限服务暂不可用，已使用空列表')
    availableRoles.value = []
    allPermissions.value = []
    permissionPackages.value = []
  }
}

onMounted(() => {
  loadUsers()
  loadRolesAndPermissions()
})
</script>

<style scoped>
.admin-users { width: 100%; height: 100%; }
.page-header { margin-bottom: 24px; }
.page-title { margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #1f2937; }
.page-subtitle { margin: 0; color: #6b7280; font-size: 14px; }
.operation-card { margin-bottom: 24px; border-radius: 12px; }
.operation-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
.search-filter { display: flex; gap: 16px; flex-wrap: wrap; }
.users-card { border-radius: 12px; overflow: hidden; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
.op-btns { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; }
.role-assign-section { padding: 10px; }
.section-header { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
.role-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; max-height: 400px; overflow-y: auto; }
.role-card { border: 2px solid #e5e7eb; border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s; background: #fff; }
.role-card:hover { border-color: var(--el-color-primary); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); transform: translateY(-2px); }
.role-card.selected { border-color: var(--el-color-primary); background: #f0f9ff; }
.role-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.role-card-title { display: flex; align-items: center; gap: 8px; }
.role-name { font-weight: 600; color: #1f2937; font-size: 14px; }
.role-card-desc { font-size: 12px; color: #6b7280; margin-bottom: 8px; line-height: 1.4; }
.role-card-meta { display: flex; gap: 12px; font-size: 12px; color: #9ca3af; }
.permission-assign-section { padding: 10px; }
.package-title { display: flex; align-items: center; gap: 12px; width: 100%; }
.package-name { font-weight: 600; color: #1f2937; font-size: 14px; }
.permission-list { display: flex; flex-direction: column; gap: 8px; }
.permission-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; transition: all 0.2s; background: #fff; }
.permission-item.selected { border-color: var(--el-color-success); background: #f0fdf4; }
.permission-info { flex: 1; }
.permission-name { font-weight: 500; color: #1f2937; margin-bottom: 6px; font-size: 14px; }
.permission-detail { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.permission-resource, .permission-action { font-size: 12px; color: #6b7280; }
.preview-section { display: flex; flex-direction: column; gap: 16px; }
.preview-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
.preview-card h4 { margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1f2937; }
.selected-roles, .selected-permissions { display: flex; flex-wrap: wrap; gap: 8px; }
.preview-tip { margin-top: 8px; }
.tip-content { font-size: 13px; line-height: 1.6; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 8px; }
.col-ops :deep(.cell) { white-space: nowrap; }
.text-muted { color: #c0c4cc; font-size: 13px; }
.form-tip { margin-left: 12px; font-size: 12px; color: #909399; }
</style>

<template>
  <div class="rbac-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-title">
        <h1 class="page-title">权限管理</h1>
        <p class="page-subtitle">基于 RBAC 模型的角色权限分配系统</p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="currentView" size="large">
          <el-radio-button label="matrix">
            <el-icon><Grid /></el-icon>
            权限矩阵
          </el-radio-button>
          <el-radio-button label="roles">
            <el-icon><UserFilled /></el-icon>
            角色管理
          </el-radio-button>
          <el-radio-button label="permissions">
            <el-icon><Key /></el-icon>
            权限管理
          </el-radio-button>
          <el-radio-button label="users">
            <el-icon><User /></el-icon>
            用户分配
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 权限矩阵视图 -->
    <div v-if="currentView === 'matrix'" class="view-container">
      <el-card class="matrix-card" shadow="hover">
        <template #header>
          <div class="matrix-header">
            <div class="header-left">
              <h3>角色-权限矩阵</h3>
              <p class="header-desc">点击单元格可快速分配/取消权限</p>
            </div>
            <div class="header-right">
              <el-input
                v-model="matrixSearch"
                placeholder="搜索权限"
                clearable
                style="width: 220px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button type="primary" @click="saveMatrixChanges">
                <el-icon><Check /></el-icon>
                保存更改
              </el-button>
            </div>
          </div>
        </template>

        <div class="matrix-container">
          <el-table
            :data="filteredPermissionsForMatrix"
            :stripe="true"
            style="width: 100%"
            max-height="600"
            v-loading="matrixLoading"
          >
            <el-table-column prop="name" label="权限名称" width="180" fixed="left">
              <template #default="{ row }">
                <div class="permission-cell">
                  <el-icon><component :is="getPermissionIcon(row.resource_type)" /></el-icon>
                  <div class="permission-info">
                    <span class="permission-name">{{ row.name }}</span>
                    <span class="permission-code">{{ row.code }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="resource_type" label="类型" width="100" fixed="left">
              <template #default="{ row }">
                <el-tag :type="getResourceTypeTag(row.resource_type)" size="small">
                  {{ getResourceTypeLabel(row.resource_type) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              width="100"
              align="center"
            >
              <template #header>
                <div class="role-header">
                  <el-tooltip :content="role.description" placement="top">
                    <span>{{ role.name }}</span>
                  </el-tooltip>
                </div>
              </template>
              <template #default="{ row }">
                <div
                  class="matrix-cell"
                  :class="{ 'has-permission': hasPermission(role.id, row.id) }"
                  @click="togglePermission(role.id, row.id)"
                >
                  <el-icon v-if="hasPermission(role.id, row.id)" class="check-icon">
                    <Check />
                  </el-icon>
                  <el-icon v-else class="plus-icon">
                    <Plus />
                  </el-icon>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="matrix-legend">
          <div class="legend-item">
            <div class="legend-box has-permission"></div>
            <span>已分配</span>
          </div>
          <div class="legend-item">
            <div class="legend-box no-permission"></div>
            <span>未分配</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 角色管理视图 -->
    <div v-else-if="currentView === 'roles'" class="view-container">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="role-list-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>角色列表</span>
                <el-button type="primary" size="small" @click="showCreateRoleDialog">
                  <el-icon><Plus /></el-icon>
                  新建角色
                </el-button>
              </div>
            </template>

            <el-input
              v-model="roleSearch"
              placeholder="搜索角色"
              clearable
              class="search-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <div class="role-list">
              <div
                v-for="role in filteredRoles"
                :key="role.id"
                class="role-item"
                :class="{ active: selectedRole?.id === role.id }"
                @click="selectRole(role)"
              >
                <div class="role-icon">
                  <el-icon :size="20">
                    <component :is="role.type === 'system' ? 'Lock' : 'User'" />
                  </el-icon>
                </div>
                <div class="role-info">
                  <span class="role-name">{{ role.name }}</span>
                  <span class="role-code">{{ role.code }}</span>
                </div>
                <el-tag
                  :type="role.type === 'system' ? 'danger' : 'primary'"
                  size="small"
                  effect="plain"
                >
                  {{ role.type === 'system' ? '系统' : '业务' }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="16">
          <el-card v-if="selectedRole" class="role-detail-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <div class="header-title-section">
                  <h3>{{ selectedRole.name }}</h3>
                  <el-tag
                    :type="selectedRole.status === 'active' ? 'success' : 'info'"
                    size="small"
                  >
                    {{ selectedRole.status === 'active' ? '启用' : '禁用' }}
                  </el-tag>
                </div>
                <div class="header-actions">
                  <el-button type="primary" size="small" @click="showEditRoleDialog">
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

            <el-descriptions :column="2" border class="role-descriptions">
              <el-descriptions-item label="角色代码">{{ selectedRole.code }}</el-descriptions-item>
              <el-descriptions-item label="角色类型">
                <el-tag :type="selectedRole.type === 'system' ? 'danger' : 'primary'">
                  {{ selectedRole.type === 'system' ? '系统角色' : '业务角色' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="描述" :span="2">
                {{ selectedRole.description || '暂无描述' }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatDate(selectedRole.created_at) }}
              </el-descriptions-item>
              <el-descriptions-item label="更新时间">
                {{ formatDate(selectedRole.updated_at) }}
              </el-descriptions-item>
            </el-descriptions>

            <el-divider content-position="left">
              <span class="divider-title">权限分配 ({{ rolePermissions.length }})</span>
            </el-divider>

            <div class="permission-tags">
              <el-tag
                v-for="perm in rolePermissions"
                :key="perm.id"
                :type="getResourceTypeTag(perm.resource_type)"
                size="small"
                closable
                @close="removePermissionFromRole(perm.id)"
                class="permission-tag"
              >
                {{ perm.name }}
              </el-tag>
              <el-button type="primary" size="small" plain @click="showAssignPermissionDialog">
                <el-icon><Plus /></el-icon>
                添加权限
              </el-button>
            </div>
          </el-card>

          <el-card v-else class="empty-card" shadow="hover">
            <el-empty description="请选择一个角色查看详情">
              <el-button type="primary" @click="showCreateRoleDialog">新建角色</el-button>
            </el-empty>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 权限管理视图 -->
    <div v-else-if="currentView === 'permissions'" class="view-container">
      <el-card class="permission-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <h3>权限列表</h3>
            </div>
            <div class="header-right">
              <el-input
                v-model="permissionSearch"
                placeholder="搜索权限"
                clearable
                style="width: 220px; margin-right: 12px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button type="primary" @click="showCreatePermissionDialog">
                <el-icon><Plus /></el-icon>
                新建权限
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          :data="filteredPermissions"
          :stripe="true"
          style="width: 100%"
          v-loading="permissionLoading"
        >
          <el-table-column type="index" label="序号" width="60" />
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
              <el-tag v-if="row.method" :type="getMethodTag(row.method)" size="small">
                {{ row.method }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="path" label="路径" min-width="200" show-overflow-tooltip />
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" link @click="editPermission(row)">
                编辑
              </el-button>
              <el-button type="danger" size="small" link @click="deletePermission(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 用户分配视图 -->
    <div v-else-if="currentView === 'users'" class="view-container">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="user-list-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>用户列表</span>
                <el-input
                  v-model="userSearch"
                  placeholder="搜索用户"
                  clearable
                  style="width: 200px"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </template>

            <el-table
              :data="filteredUsers"
              :stripe="true"
              style="width: 100%"
              highlight-current-row
              @row-click="selectUserForRoleAssign"
              v-loading="userLoading"
            >
              <el-table-column label="用户" min-width="200">
                <template #default="{ row }">
                  <div class="user-cell">
                    <el-avatar :size="32" :src="resolveAvatarUrl(row.avatar)">
                      {{ getInitial(row.username) }}
                    </el-avatar>
                    <div class="user-info">
                      <span class="user-name">{{ row.username }}</span>
                      <span class="user-email">{{ row.email }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                    {{ row.status === 'active' ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card v-if="selectedUserForAssign" class="user-role-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <div class="user-header-info">
                  <el-avatar :size="40" :src="resolveAvatarUrl(selectedUserForAssign.avatar)">
                    {{ getInitial(selectedUserForAssign.username) }}
                  </el-avatar>
                  <div>
                    <h4>{{ selectedUserForAssign.username }}</h4>
                    <p class="user-email">{{ selectedUserForAssign.email }}</p>
                  </div>
                </div>
              </div>
            </template>

            <div class="role-assign-section">
              <h4>分配角色</h4>
              <el-checkbox-group v-model="selectedUserRoleIds">
                <div class="role-checkbox-list">
                  <div
                    v-for="role in roles"
                    :key="role.id"
                    class="role-checkbox-item"
                  >
                    <el-checkbox :value="role.id">
                      <div class="checkbox-content">
                        <span class="role-name">{{ role.name }}</span>
                        <el-tag
                          :type="role.type === 'system' ? 'danger' : 'primary'"
                          size="small"
                          effect="plain"
                        >
                          {{ role.type === 'system' ? '系统' : '业务' }}
                        </el-tag>
                      </div>
                    </el-checkbox>
                    <p v-if="role.description" class="role-description">
                      {{ role.description }}
                    </p>
                  </div>
                </div>
              </el-checkbox-group>
            </div>

            <div class="action-buttons">
              <el-button @click="selectedUserForAssign = null">取消</el-button>
              <el-button type="primary" @click="saveUserRoles">保存分配</el-button>
            </div>
          </el-card>

          <el-card v-else class="empty-card" shadow="hover">
            <el-empty description="请选择一个用户进行角色分配" />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 角色表单对话框 -->
    <el-dialog
      v-model="roleDialogVisible"
      :title="isEditRole ? '编辑角色' : '新建角色'"
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
          <el-input
            v-model="roleForm.code"
            placeholder="请输入角色代码"
            :disabled="isEditRole"
          />
        </el-form-item>
        <el-form-item label="角色类型" prop="type">
          <el-select v-model="roleForm.type" placeholder="请选择角色类型">
            <el-option label="系统角色" value="system" />
            <el-option label="业务角色" value="business" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="roleForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
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

    <!-- 权限分配对话框 -->
    <el-dialog
      v-model="assignPermissionDialogVisible"
      title="分配权限"
      width="600px"
      destroy-on-close
    >
      <el-input
        v-model="permissionAssignSearch"
        placeholder="搜索权限"
        clearable
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div class="permission-assign-list">
        <el-checkbox-group v-model="selectedPermissionIds">
          <div
            v-for="perm in filteredPermissionsForAssign"
            :key="perm.id"
            class="permission-assign-item"
          >
            <el-checkbox :value="perm.id">
              <div class="checkbox-content">
                <span class="perm-name">{{ perm.name }}</span>
                <el-tag :type="getResourceTypeTag(perm.resource_type)" size="small">
                  {{ getResourceTypeLabel(perm.resource_type) }}
                </el-tag>
              </div>
            </el-checkbox>
            <p class="perm-code">{{ perm.code }}</p>
          </div>
        </el-checkbox-group>
      </div>

      <template #footer>
        <el-button @click="assignPermissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPermissionAssign">确定</el-button>
      </template>
    </el-dialog>

    <!-- 权限表单对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      :title="isEditPermission ? '编辑权限' : '新建权限'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="permissionFormRef"
        :model="permissionForm"
        :rules="permissionRules"
        label-width="100px"
      >
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="permissionForm.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限代码" prop="code">
          <el-input
            v-model="permissionForm.code"
            placeholder="请输入权限代码"
            :disabled="isEditPermission"
          />
        </el-form-item>
        <el-form-item label="资源类型" prop="resource_type">
          <el-select v-model="permissionForm.resource_type" placeholder="请选择资源类型">
            <el-option label="接口权限" value="api" />
            <el-option label="菜单权限" value="menu" />
            <el-option label="按钮权限" value="button" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="permissionForm.resource_type === 'api'"
          label="请求方法"
          prop="method"
        >
          <el-select v-model="permissionForm.method" placeholder="请选择请求方法">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="permissionForm.resource_type === 'api'"
          label="资源路径"
          prop="path"
        >
          <el-input v-model="permissionForm.path" placeholder="如: /api/v1/users" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="permissionForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPermissionForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Grid,
  UserFilled,
  Key,
  User,
  Search,
  Plus,
  Check,
  Edit,
  Delete,
  Lock,
  Connection,
  Menu,
  Mouse
} from '@element-plus/icons-vue'
import rbacApi from '@/api/rbac'
import { getUsers as apiGetUsers } from '@/api/admin'
import { resolveAvatarUrl } from '@/utils/avatar'

// 当前视图
const currentView = ref('matrix')

// 加载状态
const matrixLoading = ref(false)
const roleLoading = ref(false)
const permissionLoading = ref(false)
const userLoading = ref(false)

// 数据
const roles = ref([])
const permissions = ref([])
const users = ref([])
const rolePermissions = ref([])

// 矩阵视图
const matrixSearch = ref('')
const matrixChanges = ref(new Map()) // 记录矩阵中的变更

// 角色视图
const roleSearch = ref('')
const selectedRole = ref(null)

// 权限视图
const permissionSearch = ref('')

// 用户视图
const userSearch = ref('')
const selectedUserForAssign = ref(null)
const selectedUserRoleIds = ref([])

// 对话框可见性
const roleDialogVisible = ref(false)
const assignPermissionDialogVisible = ref(false)
const permissionDialogVisible = ref(false)

// 编辑状态
const isEditRole = ref(false)
const isEditPermission = ref(false)

// 表单引用
const roleFormRef = ref()
const permissionFormRef = ref()

// 角色表单
const roleForm = reactive({
  name: '',
  code: '',
  type: 'business',
  status: 'active',
  description: ''
})

// 权限表单
const permissionForm = reactive({
  name: '',
  code: '',
  resource_type: 'api',
  method: 'GET',
  path: '',
  description: ''
})

// 权限分配
const permissionAssignSearch = ref('')
const selectedPermissionIds = ref([])

// 验证规则
const roleRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色代码', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]*$/, message: '以小写字母开头，只能包含小写字母、数字和下划线', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择角色类型', trigger: 'change' }
  ]
}

const permissionRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限代码', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_:]*$/, message: '以小写字母开头，只能包含小写字母、数字、下划线和冒号', trigger: 'blur' }
  ],
  resource_type: [
    { required: true, message: '请选择资源类型', trigger: 'change' }
  ]
}

// 计算属性
const filteredPermissionsForMatrix = computed(() => {
  if (!matrixSearch.value) return permissions.value
  return permissions.value.filter(p =>
    p.name?.includes(matrixSearch.value) ||
    p.code?.includes(matrixSearch.value)
  )
})

const filteredRoles = computed(() => {
  if (!roleSearch.value) return roles.value
  return roles.value.filter(r =>
    r.name?.includes(roleSearch.value) ||
    r.code?.includes(roleSearch.value)
  )
})

const filteredPermissions = computed(() => {
  if (!permissionSearch.value) return permissions.value
  return permissions.value.filter(p =>
    p.name?.includes(permissionSearch.value) ||
    p.code?.includes(permissionSearch.value)
  )
})

const filteredUsers = computed(() => {
  if (!userSearch.value) return users.value
  return users.value.filter(u =>
    u.username?.includes(userSearch.value) ||
    u.email?.includes(userSearch.value)
  )
})

const filteredPermissionsForAssign = computed(() => {
  if (!permissionAssignSearch.value) return permissions.value
  return permissions.value.filter(p =>
    p.name?.includes(permissionAssignSearch.value) ||
    p.code?.includes(permissionAssignSearch.value)
  )
})

// 方法
const loadRoles = async () => {
  try {
    roleLoading.value = true
    const res = await rbacApi.getRoles()
    roles.value = res || []
  } catch (e) {
    ElMessage.error('加载角色失败')
  } finally {
    roleLoading.value = false
  }
}

const loadPermissions = async () => {
  try {
    permissionLoading.value = true
    const res = await rbacApi.getPermissions()
    permissions.value = res || []
  } catch (e) {
    ElMessage.error('加载权限失败')
  } finally {
    permissionLoading.value = false
  }
}

const loadUsers = async () => {
  try {
    userLoading.value = true
    const res = await apiGetUsers({ page: 1, page_size: 100 })
    users.value = res?.users || res?.items || []
  } catch (e) {
    ElMessage.error('加载用户失败')
  } finally {
    userLoading.value = false
  }
}

const loadRolePermissions = async (roleId) => {
  try {
    const res = await rbacApi.getRolePermissions(roleId)
    rolePermissions.value = res || []
  } catch (e) {
    rolePermissions.value = []
  }
}

// 矩阵相关方法
const hasPermission = (roleId, permissionId) => {
  const key = `${roleId}-${permissionId}`
  if (matrixChanges.value.has(key)) {
    return matrixChanges.value.get(key)
  }
  // 这里应该从后端获取实际的权限关系
  return false
}

const togglePermission = (roleId, permissionId) => {
  const key = `${roleId}-${permissionId}`
  const current = hasPermission(roleId, permissionId)
  matrixChanges.value.set(key, !current)
}

const saveMatrixChanges = async () => {
  try {
    matrixLoading.value = true
    // 批量保存变更
    const promises = []
    matrixChanges.value.forEach((value, key) => {
      const [roleId, permissionId] = key.split('-')
      if (value) {
        promises.push(rbacApi.assignPermissionToRole(roleId, permissionId))
      } else {
        promises.push(rbacApi.removePermissionFromRole(roleId, permissionId))
      }
    })
    await Promise.all(promises)
    ElMessage.success('保存成功')
    matrixChanges.value.clear()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    matrixLoading.value = false
  }
}

// 角色相关方法
const selectRole = async (role) => {
  selectedRole.value = role
  await loadRolePermissions(role.id)
}

const showCreateRoleDialog = () => {
  isEditRole.value = false
  Object.assign(roleForm, {
    name: '',
    code: '',
    type: 'business',
    status: 'active',
    description: ''
  })
  roleDialogVisible.value = true
}

const showEditRoleDialog = () => {
  if (!selectedRole.value) return
  isEditRole.value = true
  Object.assign(roleForm, {
    name: selectedRole.value.name,
    code: selectedRole.value.code,
    type: selectedRole.value.type,
    status: selectedRole.value.status,
    description: selectedRole.value.description
  })
  roleDialogVisible.value = true
}

const submitRoleForm = async () => {
  if (!roleFormRef.value) return
  try {
    await roleFormRef.value.validate()
    if (isEditRole.value) {
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
      `确定要删除角色 "${selectedRole.value.name}" 吗？`,
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

// 权限分配方法
const showAssignPermissionDialog = () => {
  if (!selectedRole.value) return
  selectedPermissionIds.value = rolePermissions.value.map(p => p.id)
  permissionAssignSearch.value = ''
  assignPermissionDialogVisible.value = true
}

const submitPermissionAssign = async () => {
  if (!selectedRole.value) return
  try {
    await rbacApi.batchAssignPermissionsToRole(
      selectedRole.value.id,
      selectedPermissionIds.value
    )
    ElMessage.success('权限分配成功')
    assignPermissionDialogVisible.value = false
    await loadRolePermissions(selectedRole.value.id)
  } catch (e) {
    ElMessage.error('分配失败')
  }
}

const removePermissionFromRole = async (permissionId) => {
  if (!selectedRole.value) return
  try {
    await ElMessageBox.confirm('确定要移除此权限吗？', '确认移除', { type: 'warning' })
    await rbacApi.removePermissionFromRole(selectedRole.value.id, permissionId)
    ElMessage.success('权限已移除')
    await loadRolePermissions(selectedRole.value.id)
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('移除失败')
    }
  }
}

// 权限管理方法
const showCreatePermissionDialog = () => {
  isEditPermission.value = false
  Object.assign(permissionForm, {
    name: '',
    code: '',
    resource_type: 'api',
    method: 'GET',
    path: '',
    description: ''
  })
  permissionDialogVisible.value = true
}

const editPermission = (row) => {
  isEditPermission.value = true
  Object.assign(permissionForm, {
    name: row.name,
    code: row.code,
    resource_type: row.resource_type,
    method: row.method || 'GET',
    path: row.path || '',
    description: row.description || ''
  })
  permissionDialogVisible.value = true
}

const submitPermissionForm = async () => {
  if (!permissionFormRef.value) return
  try {
    await permissionFormRef.value.validate()
    if (isEditPermission.value) {
      // 需要存储当前编辑的权限ID
      ElMessage.success('权限更新成功')
    } else {
      await rbacApi.createPermission(permissionForm)
      ElMessage.success('权限创建成功')
    }
    permissionDialogVisible.value = false
    await loadPermissions()
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
    await loadPermissions()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 用户角色分配方法
const selectUserForRoleAssign = async (user) => {
  selectedUserForAssign.value = user
  try {
    const roles = await rbacApi.getUserRoles(user.id)
    selectedUserRoleIds.value = roles?.map(r => r.id) || []
  } catch (e) {
    selectedUserRoleIds.value = []
  }
}

const saveUserRoles = async () => {
  if (!selectedUserForAssign.value) return
  try {
    await rbacApi.batchAssignRolesToUser(
      selectedUserForAssign.value.id,
      selectedUserRoleIds.value
    )
    ElMessage.success('角色分配成功')
    selectedUserForAssign.value = null
  } catch (e) {
    ElMessage.error('分配失败')
  }
}

// 工具方法
const getPermissionIcon = (type) => {
  const map = {
    api: Connection,
    menu: Menu,
    button: Mouse
  }
  return map[type] || Key
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
  const map = { GET: '', POST: 'success', PUT: 'warning', DELETE: 'danger' }
  return map[method] || 'info'
}

const getInitial = (name) => {
  if (!name) return 'U'
  return name.charAt(0).toUpperCase()
}

const formatDate = (s) => {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 初始化
onMounted(() => {
  loadRoles()
  loadPermissions()
  loadUsers()
})
</script>

<style scoped>
.rbac-management {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: #fff;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

.view-container {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 矩阵样式 */
.matrix-card {
  border-radius: 12px;
}

.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
}

.header-desc {
  color: #6b7280;
  font-size: 13px;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.matrix-container {
  overflow-x: auto;
}

.permission-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.permission-info {
  display: flex;
  flex-direction: column;
}

.permission-name {
  font-weight: 500;
}

.permission-code {
  font-size: 12px;
  color: #6b7280;
}

.role-header {
  font-size: 13px;
  font-weight: 500;
}

.matrix-cell {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #f3f4f6;
  margin: 0 auto;
}

.matrix-cell:hover {
  background: #e5e7eb;
}

.matrix-cell.has-permission {
  background: #10b981;
}

.matrix-cell.has-permission:hover {
  background: #059669;
}

.matrix-cell .check-icon {
  color: #fff;
  font-size: 16px;
}

.matrix-cell .plus-icon {
  color: #9ca3af;
  font-size: 14px;
  opacity: 0;
}

.matrix-cell:hover .plus-icon {
  opacity: 1;
}

.matrix-legend {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.legend-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-box.has-permission {
  background: #10b981;
}

.legend-box.no-permission {
  background: #f3f4f6;
}

/* 角色列表样式 */
.role-list-card,
.role-detail-card {
  border-radius: 12px;
  height: calc(100vh - 200px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-input {
  margin-bottom: 16px;
}

.role-list {
  overflow-y: auto;
  max-height: calc(100% - 100px);
}

.role-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.role-item:hover {
  background: #f3f4f6;
}

.role-item.active {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.role-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.role-item.active .role-icon {
  background: #dbeafe;
  color: #3b82f6;
}

.role-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.role-name {
  font-weight: 500;
  color: #1f2937;
}

.role-code {
  font-size: 12px;
  color: #6b7280;
}

/* 角色详情样式 */
.header-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title-section h3 {
  margin: 0;
}

.role-descriptions {
  margin-bottom: 24px;
}

.divider-title {
  font-weight: 500;
  color: #374151;
}

.permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-tag {
  margin: 0;
}

/* 权限列表样式 */
.permission-card {
  border-radius: 12px;
}

/* 用户列表样式 */
.user-list-card,
.user-role-card {
  border-radius: 12px;
  height: calc(100vh - 200px);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
}

.user-email {
  font-size: 12px;
  color: #6b7280;
}

.user-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-header-info h4 {
  margin: 0 0 4px 0;
}

.role-assign-section {
  margin-bottom: 24px;
}

.role-assign-section h4 {
  margin: 0 0 16px 0;
  color: #374151;
}

.role-checkbox-list {
  max-height: 400px;
  overflow-y: auto;
}

.role-checkbox-item {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #f9fafb;
}

.role-checkbox-item:hover {
  background: #f3f4f6;
}

.checkbox-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-description {
  margin: 4px 0 0 24px;
  font-size: 12px;
  color: #6b7280;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 权限分配对话框样式 */
.permission-assign-list {
  max-height: 400px;
  overflow-y: auto;
}

.permission-assign-item {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #f9fafb;
}

.permission-assign-item:hover {
  background: #f3f4f6;
}

.perm-name {
  font-weight: 500;
  margin-right: 8px;
}

.perm-code {
  margin: 4px 0 0 24px;
  font-size: 12px;
  color: #6b7280;
}

/* 空卡片样式 */
.empty-card {
  border-radius: 12px;
  height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .matrix-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
  }
}
</style>

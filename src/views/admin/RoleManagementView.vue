<template>
  <div class="role-management">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon> 新增角色
          </el-button>
        </div>
      </template>

      <!-- 角色列表 -->
      <el-table :data="roles" border style="width: 100%">
        <el-table-column prop="name" label="角色名称" min-width="150" />
        <el-table-column prop="code" label="角色代码" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'system' ? 'danger' : 'primary'">
              {{ row.type === 'system' ? '系统' : '业务' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleAssignMenus(row)">
              分配菜单
            </el-button>
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              :disabled="row.code === 'super_admin'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分配菜单对话框 -->
    <el-dialog
      v-model="menuDialogVisible"
      title="分配菜单"
      width="500px"
    >
      <el-tree
        ref="menuTreeRef"
        :data="menuTree"
        :props="{ children: 'children', label: 'title' }"
        show-checkbox
        node-key="id"
        default-expand-all
        :check-strictly="false"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="menuDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmMenus" :loading="loading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新增/编辑角色对话框 -->
    <el-dialog
      v-model="roleDialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="500px"
    >
      <el-form ref="roleFormRef" :model="roleForm" :rules="roleRules" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色代码" prop="code">
          <el-input v-model="roleForm.code" placeholder="请输入角色代码（英文）" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
        <el-form-item label="角色类型" prop="type">
          <el-select v-model="roleForm.type">
            <el-option label="系统角色" value="system" />
            <el-option label="业务角色" value="business" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitRole" :loading="loading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getRoles, createRole, updateRole, deleteRole, getRoleMenus, assignMenusToRole } from '@/api/admin'
import { getMenuTree } from '@/api/admin'

const roles = ref([])
const menuTree = ref([])
const menuDialogVisible = ref(false)
const roleDialogVisible = ref(false)
const isEdit = ref(false)
const loading = ref(false)
const currentRoleId = ref(null)
const menuTreeRef = ref(null)
const roleFormRef = ref(null)

const roleForm = reactive({
  name: '',
  code: '',
  description: '',
  type: 'business'
})

const roleRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色代码', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '只能输入小写字母和下划线', trigger: 'blur' }
  ]
}

onMounted(() => {
  loadRoles()
  loadMenuTree()
})

const loadRoles = async () => {
  try {
    const { data } = await getRoles()
    roles.value = data || []
  } catch (error) {
    ElMessage.error('加载角色列表失败')
  }
}

const loadMenuTree = async () => {
  try {
    const { data } = await getMenuTree()
    menuTree.value = data || []
  } catch (error) {
    ElMessage.error('加载菜单树失败')
  }
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(roleForm, {
    name: '',
    code: '',
    description: '',
    type: 'business'
  })
  roleDialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentRoleId.value = row.id
  Object.assign(roleForm, {
    name: row.name,
    code: row.code,
    description: row.description,
    type: row.type
  })
  roleDialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除角色"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteRole(row.id)
    ElMessage.success('删除成功')
    loadRoles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleAssignMenus = async (row) => {
  currentRoleId.value = row.id
  menuDialogVisible.value = true

  try {
    // 获取角色已分配的菜单
    const { data } = await getRoleMenus(row.id)
    const checkedMenuIds = data.map(menu => menu.id)

    // 设置默认选中的节点
    menuTreeRef.value.setCheckedKeys(checkedMenuIds)
  } catch (error) {
    ElMessage.error('获取角色菜单失败')
  }
}

const handleConfirmMenus = async () => {
  loading.value = true

  try {
    // 获取选中的节点（包括全选和半选的）
    const checkedKeys = menuTreeRef.value.getCheckedKeys()
    const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys()

    // 合并全选和半选的节点（父节点需要包含子节点）
    const menuIds = [...new Set([...checkedKeys, ...halfCheckedKeys])]

    await assignMenusToRole(currentRoleId.value, { menu_ids: menuIds })

    ElMessage.success('分配成功')
    menuDialogVisible.value = false
  } catch (error) {
    ElMessage.error('分配失败')
  } finally {
    loading.value = false
  }
}

const handleSubmitRole = async () => {
  try {
    await roleFormRef.value.validate()
    loading.value = true

    if (isEdit.value) {
      await updateRole(currentRoleId.value, roleForm)
      ElMessage.success('更新成功')
    } else {
      await createRole(roleForm)
      ElMessage.success('创建成功')
    }

    roleDialogVisible.value = false
    loadRoles()
  } catch (error) {
    if (error !== false) {
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.role-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

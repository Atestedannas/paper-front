<template>
  <div class="menu-management">
    <el-card shadow="never">
      <div class="toolbar">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon> 新增菜单
        </el-button>
        <el-button @click="refresh">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>

      <el-table :data="menuTree" row-key="id" default-expand-all :tree-props="{ children: 'children' }" border>
        <el-table-column prop="title" label="菜单名称" min-width="200" />
        <el-table-column prop="icon" label="图标" width="100">
          <template #default="{ row }">
            <el-icon v-if="row.icon" :size="20">
              <component :is="row.icon" />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" min-width="200" />
        <el-table-column prop="permission" label="权限标识" min-width="150" />
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column prop="visible" label="可见" width="80">
          <template #default="{ row }">
            <el-tag :type="row.visible ? 'success' : 'info'">
              {{ row.visible ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="success" link size="small" @click.stop="handleAddChild(row)">
              添加子菜单
            </el-button>
            <el-button type="danger" link size="small" @click.stop="handleDelete(row)" :disabled="row.children && row.children.length > 0">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑菜单' : (formData.parent_id ? '添加子菜单' : '新增菜单')" width="600px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="上级菜单" prop="parent_id">
          <el-tree-select
            v-model="formData.parent_id"
            :data="menuTree"
            check-strictly
            placeholder="请选择上级菜单（留空为顶级）"
            clearable
          />
        </el-form-item>
        <el-alert 
          v-if="formData.parent_id" 
          title="当前正在添加子菜单" 
          type="info" 
          :closable="false" 
          show-icon 
          style="margin-bottom: 15px;"
        />
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入菜单名称（英文）" />
        </el-form-item>
        <el-form-item label="显示标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入显示标题（中文）" />
        </el-form-item>
        <el-form-item label="路由路径" prop="path">
          <el-input v-model="formData.path" placeholder="请输入路由路径，如：/admin/users" />
        </el-form-item>
        <el-form-item label="组件路径" prop="component">
          <el-input v-model="formData.component" placeholder="请输入组件路径，如：admin/UserView.vue" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="formData.icon" placeholder="请输入图标名称，如：User, Folder, Setting" />
        </el-form-item>
        <el-form-item label="权限标识" prop="permission">
          <el-input v-model="formData.permission" placeholder="请输入权限标识，如：user:list" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="formData.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menu_type">
          <el-select v-model="formData.menu_type">
            <el-option label="目录" value="catalog" />
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否可见" prop="visible">
          <el-switch v-model="formData.visible" />
        </el-form-item>
        <el-form-item label="KeepAlive" prop="keep_alive">
          <el-switch v-model="formData.keep_alive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { getMenuTree, createMenu, updateMenu, deleteMenu } from '@/api/admin'

const menuTree = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const loading = ref(false)
const formRef = ref(null)

const formData = reactive({
  id: null,
  parent_id: null,
  name: '',
  title: '',
  icon: '',
  path: '',
  component: '',
  menu_type: 'menu',
  permission: '',
  visible: true,
  keep_alive: false,
  sort_order: 0,
  meta: {}
})

const formRules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  title: [{ required: true, message: '请输入显示标题', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }]
}

onMounted(() => {
  loadMenuTree()
})

const loadMenuTree = async () => {
  try {
    console.log('开始加载菜单树...')
    const { data } = await getMenuTree()
    console.log('菜单树数据:', data)
    menuTree.value = data || []
    console.log('菜单树加载完成，长度:', menuTree.value.length)
  } catch (error) {
    console.error('加载菜单树失败:', error)
    ElMessage.error('加载菜单树失败')
  }
}

const refresh = () => {
  loadMenuTree()
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(formData, {
    id: null,
    parent_id: null,
    name: '',
    title: '',
    icon: '',
    path: '',
    component: '',
    menu_type: 'menu',
    permission: '',
    visible: true,
    keep_alive: false,
    sort_order: 0,
    meta: {}
  })
  dialogVisible.value = true
}

// 添加子菜单
const handleAddChild = (parent) => {
  console.log('添加子菜单，父菜单:', parent)
  console.log('父菜单 ID:', parent.id)
  
  if (!parent || !parent.id) {
    ElMessage.error('父菜单信息不完整')
    return
  }
  
  isEdit.value = false
  Object.assign(formData, {
    id: null,
    parent_id: parent.id,
    name: '',
    title: '',
    icon: '',
    path: '',
    component: '',
    menu_type: 'menu',
    permission: '',
    visible: true,
    keep_alive: false,
    sort_order: 0,
    meta: {}
  })
  dialogVisible.value = true
  console.log('表单数据:', formData)
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    parent_id: row.parent_id,
    name: row.name,
    title: row.title,
    icon: row.icon,
    path: row.path,
    component: row.component,
    menu_type: row.menu_type,
    permission: row.permission,
    visible: row.visible,
    keep_alive: row.keep_alive,
    sort_order: row.sort_order,
    meta: row.meta
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该菜单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteMenu(row.id)
    ElMessage.success('删除成功')
    loadMenuTree()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    
    if (isEdit.value) {
      await updateMenu(formData.id, formData)
      ElMessage.success('更新成功')
    } else {
      await createMenu(formData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadMenuTree()
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
.menu-management {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>

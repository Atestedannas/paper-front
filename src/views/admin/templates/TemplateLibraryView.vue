<template>
  <div class="template-library">
    <div class="header">
      <h1>模板规范库</h1>
      <div class="actions">
        <el-button @click="openCreate" type="success">新增模板</el-button>
        <el-upload
          :show-file-list="false"
          accept=".docx,.doc"
          :http-request="handleImport"
        >
          <el-button type="primary">导入模板文档</el-button>
        </el-upload>
        <el-button @click="loadList" :loading="loading">刷新</el-button>
      </div>
    </div>

    <el-table :data="templates" style="width: 100%" stripe>
      <el-table-column prop="name" label="名称" min-width="240" />
      <el-table-column prop="university" label="院校" width="160" />
      <el-table-column prop="version" label="当前版本" width="140" />
      <el-table-column prop="enabled" label="启用" width="120">
        <template #default="{ row }">
          <el-switch :model-value="row.enabled" @change="val => onToggle(row, val)" />
        </template>
      </el-table-column>
      <el-table-column label="版本管理" width="260">
        <template #default="{ row }">
          <el-select v-model="row.selectedVersion" placeholder="选择版本" size="small" style="width: 160px" @visible-change="open => open && loadVersions(row)">
            <el-option v-for="v in row.versions" :key="v.id" :label="`${v.version} (${v.created_at})`" :value="v.id" />
          </el-select>
          <el-button size="small" @click="promoteVersion(row)" :disabled="!row.selectedVersion">设为当前</el-button>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button size="small" @click="previewJson(row)">预览规范JSON</el-button>
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="removeTemplate(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="previewVisible" title="规范 JSON 预览" size="50%">
      <pre class="json-view">{{ jsonContent }}</pre>
    </el-drawer>

    <el-dialog v-model="createVisible" title="新增模板" width="520px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="院校" prop="university">
          <el-input v-model="form.university" />
        </el-form-item>
        <el-form-item label="公开">
          <el-switch v-model="form.is_public" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitCreate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="编辑模板" width="520px">
      <el-form :model="form" :rules="rules" ref="editFormRef" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="院校" prop="university">
          <el-input v-model="form.university" />
        </el-form-item>
        <el-form-item label="公开">
          <el-switch v-model="form.is_public" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { listTemplates, getTemplateDetail, toggleTemplate, listTemplateVersions, promoteTemplateVersion, importTemplateDocx, createTemplate, updateTemplate, deleteTemplate } from '../../../api/templates'

const loading = ref(false)
const templates = ref([])
const previewVisible = ref(false)
const jsonContent = ref('')
const createVisible = ref(false)
const editVisible = ref(false)
const saving = ref(false)
const formRef = ref()
const editFormRef = ref()
const currentId = ref(null)
const form = ref({ name: '', university: '', is_public: true })
const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  university: [{ required: true, message: '请输入院校', trigger: 'blur' }]
}

const loadList = async () => {
  loading.value = true
  try {
    const data = await listTemplates()
    templates.value = (data?.items || []).map(t => ({ ...t, versions: [], selectedVersion: null }))
  } catch (e) {
    ElMessage.error('加载模板列表失败')
  } finally {
    loading.value = false
  }
}

const onToggle = async (row, val) => {
  try {
    await toggleTemplate(row.id, val)
    row.enabled = val
    ElMessage.success(val ? '已启用' : '已停用')
  } catch {
    ElMessage.error('更新状态失败')
  }
}

const loadVersions = async (row) => {
  try {
    const data = await listTemplateVersions(row.id)
    row.versions = data?.items || []
  } catch {
    ElMessage.error('加载版本失败')
  }
}

const promoteVersion = async (row) => {
  if (!row.selectedVersion) return
  try {
    await promoteTemplateVersion(row.id, row.selectedVersion)
    ElMessage.success('已设为当前版本')
    await loadList()
  } catch {
    ElMessage.error('设置版本失败')
  }
}

const previewJson = async (row) => {
  try {
    const data = await getTemplateDetail(row.id)
    jsonContent.value = JSON.stringify(data?.template || data, null, 2)
    previewVisible.value = true
  } catch {
    ElMessage.error('加载规范失败')
  }
}

const openCreate = () => {
  form.value = { name: '', university: '', is_public: true }
  createVisible.value = true
}

const submitCreate = async () => {
  try {
    await formRef.value.validate()
    saving.value = true
    await createTemplate(form.value)
    ElMessage.success('新增成功')
    createVisible.value = false
    await loadList()
  } catch {
    ElMessage.error('新增失败')
  } finally {
    saving.value = false
  }
}

const openEdit = (row) => {
  currentId.value = row.id
  form.value = { name: row.name, university: row.university, is_public: !!row.is_public }
  editVisible.value = true
}

const submitEdit = async () => {
  try {
    await editFormRef.value.validate()
    saving.value = true
    await updateTemplate(currentId.value, form.value)
    ElMessage.success('保存成功')
    editVisible.value = false
    await loadList()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const removeTemplate = async (row) => {
  try {
    await deleteTemplate(row.id)
    ElMessage.success('删除成功')
    await loadList()
  } catch {
    ElMessage.error('删除失败')
  }
}

const handleImport = async (options) => {
  const form = new FormData()
  form.append('file', options.file)
  try {
    const data = await importTemplateDocx(form)
    ElMessage.success('导入成功')
    await loadList()
  } catch {
    ElMessage.error('导入失败')
  }
}

loadList()
</script>

<style scoped>
.template-library { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.header h1 { margin: 0; font-size: 22px; font-weight: 700; }
.actions { display: flex; gap: 12px; }
.json-view { background: #111827; color: #d1fae5; padding: 16px; border-radius: 8px; overflow: auto; max-height: 70vh; }
</style>

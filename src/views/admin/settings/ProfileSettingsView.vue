<template>
  <div class="admin-settings-profile">
    <div class="page-header">
      <h1 class="page-title">个人设置</h1>
      <p class="page-subtitle">更新管理员头像、昵称与联系方式</p>
    </div>
    <el-card class="glass-card" shadow="hover">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="头像" prop="avatar">
          <div class="avatar-row">
            <el-avatar :size="64" :src="form.avatar" class="avatar-click" @click="triggerAvatarPicker">
              {{ initial(form.full_name) }}
            </el-avatar>
     
            <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarSelect" />
          </div>
        </el-form-item>
        <el-form-item label="昵称" prop="full_name">
          <el-input v-model="form.full_name" class="glass-input" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="角色">
          <el-tag type="primary">{{ form.role === 'admin' ? '管理员' : '用户' }}</el-tag>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" class="glass-input" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item>
          <el-button class="glass-btn" @click="load" :loading="loading">刷新</el-button>
          <el-button class="glass-btn primary" @click="save" :loading="saving">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getProfile, updateProfile, uploadAvatar } from '../../../api/auth'

const formRef = ref()
const loading = ref(false)
const saving = ref(false)
const avatarInput = ref(null)
const form = reactive({ avatar: '', serverAvatar: '', avatarFile: null, full_name: '', email: '', role: 'admin' })

const rules = {
  avatar: [{ required: false }],
  full_name: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: '请输入有效邮箱', trigger: 'blur' }]
}

const initial = (name) => (name || 'U').charAt(0).toUpperCase()

const load = async () => {
  loading.value = true
  try {
    const profile = await getProfile()
    const avatarUrl = profile.avatar || ''
    form.avatar = avatarUrl
    form.serverAvatar = avatarUrl // 保存服务端返回的 URL，避免把 blob 提交上去
    form.full_name = profile.full_name || profile.username || ''
    form.email = profile.email || ''
    form.role = profile.role || form.role
    form.avatarFile = null
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 组件卸载时清理临时 URL
onUnmounted(() => {
  if (form.avatar && form.avatar.startsWith('blob:')) {
    URL.revokeObjectURL(form.avatar)
  }
})

const save = async () => {
  try {
    await formRef.value.validate()
    saving.value = true
    
    // 如果有头像文件，先上传头像
    if (form.avatarFile) {
      try {
        const uploadResult = await uploadAvatar(form.avatarFile)
        if (uploadResult && uploadResult.avatar_url) {
          form.avatar = uploadResult.avatar_url
          form.serverAvatar = uploadResult.avatar_url
          form.avatarFile = null
        }
      } catch (uploadError) {
        console.error('头像上传失败:', uploadError)
        ElMessage.warning('头像上传失败，将保存原始图片')
      }
    }
    
    // 提交时不要传 blob URL（刷新后会失效），只传已上传的服务端 URL
    const avatarToSave = (form.avatar && !form.avatar.startsWith('blob:')) ? form.avatar : (form.serverAvatar || '')
    await updateProfile({
      avatar: avatarToSave,
      full_name: form.full_name,
      email: form.email
    })
    ElMessage.success('个人设置已保存')
  } catch (e) {
    console.error('保存失败:', e)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const triggerAvatarPicker = () => {
  avatarInput.value?.click()
}

const handleAvatarSelect = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不超过 2MB')
    return
  }
  
  // 直接使用文件对象，不转换为 base64
  form.avatarFile = file
  
  // 创建一个临时 URL 用于预览
  form.avatar = URL.createObjectURL(file)
  e.target.value = ''
}

onMounted(load)
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-title { margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #1e293b; }
.page-subtitle { margin: 0; color: #64748b; }
.avatar-row { display:flex; align-items:center; gap:12px; }
.avatar-click { cursor: pointer; }
</style>

<template>
  <div class="profile-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>
    
    <!-- 个人资料卡片 -->
    <div class="profile-box">
      <div class="profile-header">
        <el-icon class="profile-icon"><User /></el-icon>
        <h2 class="profile-title">个人资料</h2>
        <p class="profile-subtitle">管理您的账户信息和安全设置</p>
      </div>
      
      <!-- 头像上传区域 -->
      <div class="avatar-section">
        <div class="avatar-wrapper" @click="triggerAvatarUpload">
          <el-avatar 
            :size="100" 
            :src="resolveAvatarUrl(userStore.user?.avatar)" 
            class="user-avatar"
          >
            <el-icon :size="40"><User /></el-icon>
          </el-avatar>
          <div class="avatar-overlay">
            <el-icon :size="24"><Camera /></el-icon>
            <span>更换头像</span>
          </div>
        </div>
        <input
          ref="avatarInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleAvatarChange"
        />
        <p class="avatar-tip">点击头像更换</p>
      </div>
      
      <!-- 头像上传进度 -->
      <div v-if="avatarUploading" class="avatar-upload-progress">
        <el-progress :percentage="avatarProgress" :stroke-width="4" />
      </div>
      
      <!-- 基本信息表单 -->
      <div class="profile-section">
        <h3 class="section-title">
          <el-icon><UserFilled /></el-icon>
          基本信息
        </h3>
        <el-form :model="form" :rules="profileRules" ref="profileFormRef" label-width="80px">
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              maxlength="50"
              show-word-limit
              clearable
            />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入邮箱"
              :prefix-icon="Message"
              disabled
            />
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="updateProfile" 
              :loading="loading"
              size="large"
              style="width: 100%"
            >
              {{ loading ? '保存中...' : '保存修改' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 修改密码 -->
      <div class="profile-section">
        <h3 class="section-title">
          <el-icon><Lock /></el-icon>
          修改密码
        </h3>
        <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="80px">
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input
              v-model="passwordForm.oldPassword"
              type="password"
              placeholder="请输入旧密码"
              :prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
              :prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button 
              type="warning" 
              @click="changePassword" 
              :loading="passwordLoading"
              size="large"
              style="width: 100%"
            >
              {{ passwordLoading ? '修改中...' : '修改密码' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 退出登录 -->
      <div class="logout-section">
        <el-button 
          type="danger" 
          @click="handleLogout" 
          size="large"
          style="width: 100%"
          :icon="SwitchButton"
        >
          退出登录
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, UserFilled, Message, Lock, SwitchButton, Camera } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { resolveAvatarUrl } from '@/utils/avatar'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const profileFormRef = ref()
const passwordFormRef = ref()
const avatarInput = ref()

const profileForm = reactive({
  username: '',
  email: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: ''
})

const loading = ref(false)
const passwordLoading = ref(false)
const avatarUploading = ref(false)
const avatarProgress = ref(0)

// 表单验证规则
const profileRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度应在2-50个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 生命周期
onMounted(async () => {
  await loadProfile()
})

// 加载个人资料
const loadProfile = async () => {
  try {
    const profile = await userStore.loadProfile()
    if (profile) {
      profileForm.username = profile.username || ''
      profileForm.email = profile.email || ''
    }
  } catch (error) {
    if (error.response?.status !== 401) {
      ElMessage.error('加载个人资料失败')
    }
  }
}

// 更新个人资料
const updateProfile = async () => {
  try {
    await profileFormRef.value.validate()
    
    loading.value = true
    await userStore.updateUserProfile(profileForm)
    ElMessage.success('个人资料更新成功')
  } catch (error) {
    if (error.response) {
      ElMessage.error('个人资料更新失败')
    }
    // 表单验证错误不显示消息
  } finally {
    loading.value = false
  }
}

// 修改密码
const changePassword = async () => {
  try {
    await passwordFormRef.value.validate()
    
    passwordLoading.value = true
    await userStore.updatePassword(passwordForm.oldPassword, passwordForm.newPassword)
    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordFormRef.value.resetFields()
  } catch (error) {
    if (error.response) {
      if (error.response.status === 400) {
        ElMessage.error('旧密码不正确')
      } else {
        ElMessage.error('密码修改失败')
      }
    }
    // 表单验证错误不显示消息
  } finally {
    passwordLoading.value = false
  }
}

// 退出登录
const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

// 触发头像上传
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

// 处理头像文件选择
const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('请上传 JPG、PNG、GIF 或 WebP 格式的图片')
    return
  }

  // 验证文件大小（最大 5MB）
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('图片大小不能超过 5MB')
    return
  }

  // 开始上传
  avatarUploading.value = true
  avatarProgress.value = 0

  try {
    const result = await userStore.uploadUserAvatar(file, (progress) => {
      avatarProgress.value = progress
    })
    
    ElMessage.success('头像上传成功')
  } catch (error) {
    ElMessage.error(error.message || '头像上传失败')
  } finally {
    avatarUploading.value = false
    avatarProgress.value = 0
    // 清空 input，允许重复选择同一文件
    if (avatarInput.value) {
      avatarInput.value.value = ''
    }
  }
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.circle-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.profile-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 500px;
  margin: 20px;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.profile-header {
  text-align: center;
  margin-bottom: 40px;
}

.profile-icon {
  font-size: 48px;
  color: #667eea;
  margin-bottom: 16px;
}

.profile-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.profile-subtitle {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.profile-section {
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* 头像区域样式 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  transition: all 0.3s ease;
}

.avatar-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.user-avatar {
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay span {
  font-size: 12px;
  margin-top: 4px;
}

.avatar-tip {
  margin-top: 12px;
  color: #666;
  font-size: 14px;
}

.avatar-upload-progress {
  margin-bottom: 24px;
  padding: 0 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

.section-title .el-icon {
  color: #667eea;
}

.logout-section {
  margin-top: 32px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: #667eea;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

:deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

:deep(.el-button--warning) {
  background: linear-gradient(135deg, #ff9a9e, #fad0c4);
  border: none;
  color: #fff;
}

:deep(.el-button--warning:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 154, 158, 0.3);
}

:deep(.el-button--danger) {
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  border: none;
}

:deep(.el-button--danger:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
}

@media (max-width: 768px) {
  .profile-box {
    margin: 10px;
    padding: 24px;
  }
  
  .profile-title {
    font-size: 24px;
  }
  
  .profile-section {
    padding: 16px;
  }
}
</style>

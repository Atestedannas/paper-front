<template>
  <div class="scv-root">

    <!-- ── 顶部导航栏 ── -->
    <div class="scv-navbar">
      <div class="scv-navbar-inner">
        <div class="scv-nav-breadcrumb">
          <span class="scv-nav-item">系统管理</span>
          <span class="scv-nav-sep">›</span>
          <span class="scv-nav-item active">客服联系方式</span>
        </div>
        <div class="scv-nav-actions">
          <button class="scv-btn scv-btn-ghost" @click="resetForm" :disabled="saving">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.44"/></svg>
            还原
          </button>
          <button class="scv-btn scv-btn-primary" @click="submitForm" :disabled="saving">
            <svg v-if="!saving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            {{ saving ? '保存中…' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <div class="scv-content">
      <!-- ── 页面标题区 ── -->
      <div class="scv-title-block">
        <div class="scv-app-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.42 11 19.79 19.79 0 0 1 1.41 2.38 2 2 0 0 1 3.38 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 7.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92z"/></svg>
        </div>
        <div>
          <h1 class="scv-title">客服联系方式</h1>
          <p class="scv-subtitle">管理展示给用户的客服渠道与联系信息</p>
        </div>
      </div>

      <el-form :model="contactForm" :rules="formRules" ref="formRef">
        <div class="scv-grid">

          <!-- ════ 左列 ════ -->
          <div class="scv-col">

            <!-- 基本信息组 -->
            <div class="scv-group">
              <div class="scv-group-label">基本信息</div>
              <div class="scv-group-body">

                <div class="scv-row">
                  <div class="scv-row-icon" style="background:#f0f0f5;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div class="scv-row-content">
                    <div class="scv-row-label">客服名称 <span class="req">*</span></div>
                    <el-form-item prop="name" class="inrow-item">
                      <input
                        v-model="contactForm.name"
                        class="scv-input"
                        placeholder="请输入客服名称"
                        maxlength="50"
                      />
                    </el-form-item>
                  </div>
                </div>
                <div class="scv-divider" />

                <div class="scv-row">
                  <div class="scv-row-icon" style="background:#f0f0f5;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div class="scv-row-content">
                    <div class="scv-row-label">公司地址</div>
                    <el-form-item prop="address" class="inrow-item">
                      <input v-model="contactForm.address" class="scv-input" placeholder="请输入公司或服务地址" />
                    </el-form-item>
                  </div>
                </div>
                <div class="scv-divider" />

                <div class="scv-row">
                  <div class="scv-row-icon" style="background:#f0f0f5;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div class="scv-row-content">
                    <div class="scv-row-label">工作时间</div>
                    <el-form-item prop="work_hours" class="inrow-item">
                      <input v-model="contactForm.work_hours" class="scv-input" placeholder="例：周一至周五 9:00–18:00" />
                    </el-form-item>
                  </div>
                </div>

              </div>
            </div>

            <!-- 联系渠道组 -->
            <div class="scv-group">
              <div class="scv-group-label">联系渠道</div>
              <div class="scv-group-body">

                <div class="scv-row">
                  <div class="scv-row-icon" style="background:#e8f5e9;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.42 11 19.79 19.79 0 0 1 1.41 2.38 2 2 0 0 1 3.38 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 7.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 14.92z"/></svg>
                  </div>
                  <div class="scv-row-content">
                    <div class="scv-row-label">客服电话</div>
                    <el-form-item prop="phone" class="inrow-item">
                      <input v-model="contactForm.phone" class="scv-input" placeholder="请输入客服电话号码" />
                    </el-form-item>
                  </div>
                </div>
                <div class="scv-divider" />

                <div class="scv-row">
                  <div class="scv-row-icon" style="background:#e3f2fd;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div class="scv-row-content">
                    <div class="scv-row-label">商务邮箱</div>
                    <el-form-item prop="email_business" class="inrow-item">
                      <input v-model="contactForm.email_business" class="scv-input" placeholder="请输入商务合作邮箱" type="email" />
                    </el-form-item>
                  </div>
                </div>
                <div class="scv-divider" />

                <div class="scv-row">
                  <div class="scv-row-icon" style="background:#e3f2fd;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div class="scv-row-content">
                    <div class="scv-row-label">客服邮箱</div>
                    <el-form-item prop="email_support" class="inrow-item">
                      <input v-model="contactForm.email_support" class="scv-input" placeholder="请输入用户支持邮箱" type="email" />
                    </el-form-item>
                  </div>
                </div>

              </div>
            </div>

            <!-- 备注信息组 -->
            <div class="scv-group">
              <div class="scv-group-label">备注信息</div>
              <div class="scv-group-body">
                <el-form-item prop="remarks" class="inrow-item" style="padding:14px 16px;">
                  <textarea
                    v-model="contactForm.remarks"
                    class="scv-textarea"
                    placeholder="其他需要告知用户的信息（可选）"
                    rows="3"
                  />
                </el-form-item>
              </div>
            </div>

          </div>

          <!-- ════ 右列 ════ -->
          <div class="scv-col">

            <!-- 微信二维码组 -->
            <div class="scv-group">
              <div class="scv-group-label">微信客服二维码</div>
              <div class="scv-group-body qr-body">

                <!-- 已上传 -->
                <div v-if="contactForm.wechat_qrcode" class="qr-uploaded-wrap">
                  <div class="qr-frame">
                    <img :src="contactForm.wechat_qrcode" alt="微信二维码" class="qr-img" />
                  </div>
                  <div class="qr-status">
                    <div class="qr-status-dot"></div>
                    二维码已配置
                  </div>
                  <div class="qr-btn-row">
                    <button class="scv-btn scv-btn-ghost" @click="previewQR">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      预览
                    </button>
                    <button class="scv-btn scv-btn-destructive" @click="removeQR">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      删除
                    </button>
                  </div>
                </div>

                <!-- 未上传 -->
                <el-upload
                  v-else
                  class="qr-upload-wrap"
                  drag
                  :action="uploadAction"
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  :before-upload="beforeQRUpload"
                  :on-success="handleQrUploadSuccess"
                  :on-error="handleQrUploadError"
                  accept=".jpg,.jpeg,.png"
                >
                  <div class="qr-drop-zone">
                    <div class="qr-drop-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="1.4"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                    </div>
                    <div class="qr-drop-title">点击或拖拽上传</div>
                    <div class="qr-drop-sub">JPG · PNG · 最大 5 MB</div>
                  </div>
                </el-upload>

              </div>
            </div>

            <!-- 信息预览组 -->
            <div class="scv-group">
              <div class="scv-group-label">预览效果</div>
              <div class="scv-group-body preview-body">

                <div class="preview-mock">
                  <div class="mock-header">
                    <div class="mock-dot r"></div>
                    <div class="mock-dot y"></div>
                    <div class="mock-dot g"></div>
                    <span class="mock-title">联系客服</span>
                  </div>
                  <div class="mock-content">
                    <div class="mock-row" v-if="contactForm.name">
                      <span class="mock-label">客服</span>
                      <span class="mock-val">{{ contactForm.name }}</span>
                    </div>
                    <div class="mock-row" v-if="contactForm.phone">
                      <span class="mock-label">电话</span>
                      <span class="mock-val link">{{ contactForm.phone }}</span>
                    </div>
                    <div class="mock-row" v-if="contactForm.email_support">
                      <span class="mock-label">邮箱</span>
                      <span class="mock-val link">{{ contactForm.email_support }}</span>
                    </div>
                    <div class="mock-row" v-if="contactForm.work_hours">
                      <span class="mock-label">时间</span>
                      <span class="mock-val">{{ contactForm.work_hours }}</span>
                    </div>
                    <div class="mock-row" v-if="contactForm.address">
                      <span class="mock-label">地址</span>
                      <span class="mock-val">{{ contactForm.address }}</span>
                    </div>
                    <div class="mock-empty" v-if="!contactForm.name && !contactForm.phone && !contactForm.email_support">
                      填写左侧信息后此处预览
                    </div>
                    <div class="mock-qr-row" v-if="contactForm.wechat_qrcode">
                      <img :src="contactForm.wechat_qrcode" class="mock-qr" />
                      <span class="mock-qr-label">扫码加微信客服</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import tokenManager from '@/utils/tokenManager'

const formRef = ref()
const saving  = ref(false)
const uploadAction = ref('/api/v1/upload/image')

const contactForm = ref({
  name: '', address: '', phone: '',
  email_business: '', email_support: '',
  wechat_qrcode: '', work_hours: '', remarks: ''
})

const formRules = {
  name:           [{ required: true, message: '请输入客服名称', trigger: 'blur' }, { min: 2, max: 50, message: '2–50 个字符', trigger: 'blur' }],
  phone:          [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  email_business: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
  email_support:  [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
  wechat_qrcode:  [{ required: false }]
}

const uploadHeaders = computed(() => {
  const authHeader = tokenManager.getAuthorizationHeader()
  return authHeader ? { Authorization: authHeader } : {}
})

onMounted(loadContactInfo)

async function loadContactInfo() {
  try {
    const res = await request({ url: '/api/v1/admin/support/contact', method: 'GET' })
    if (res && typeof res === 'object') {
      Object.assign(contactForm.value, res)
    }
  } catch {}
}

const beforeQRUpload = (file) => {
  if (!file.type.startsWith('image/')) { ElMessage.error('请上传图片文件'); return false }
  if (file.size / 1024 / 1024 >= 5)    { ElMessage.error('图片不超过 5MB'); return false }
  return true
}
const handleQrUploadSuccess = (res) => {
  if (res?.code === 200 && res.data?.url) { contactForm.value.wechat_qrcode = res.data.url; ElMessage.success('上传成功') }
  else ElMessage.error(res?.msg || '上传失败')
}
const handleQrUploadError = () => ElMessage.error('上传失败，请重试')
const previewQR = () => contactForm.value.wechat_qrcode && window.open(contactForm.value.wechat_qrcode, '_blank')
const removeQR  = () => {
  ElMessageBox.confirm('确定删除当前微信二维码？', '删除确认', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    .then(() => { contactForm.value.wechat_qrcode = ''; ElMessage.success('已删除') }).catch(() => {})
}

const submitForm = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await request({ url: '/api/v1/admin/support/contact', method: 'PUT', data: contactForm.value })
    ElMessage.success('已保存')
    await loadContactInfo()
  } catch (e) {
    ElMessage.error('保存失败：' + (e.message || '网络错误'))
  } finally { saving.value = false }
}

const resetForm = () => { formRef.value?.resetFields(); loadContactInfo() }
</script>

<style scoped>
/* ── Reset & Root ── */
*, *::before, *::after { box-sizing: border-box; }

.scv-root {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", sans-serif;
  background: #f2f2f7;
  color: #1c1c1e;
}

/* ── 顶部导航栏（嵌入页面流，不 sticky）── */
.scv-navbar {
  background: rgba(242,242,247,.9);
  border-bottom: 1px solid rgba(0,0,0,.08);
}
.scv-navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 44px;
}
.scv-nav-breadcrumb { display: flex; align-items: center; gap: 6px; }
.scv-nav-item   { font-size: 13px; color: #8e8e93; }
.scv-nav-item.active { color: #1c1c1e; font-weight: 500; }
.scv-nav-sep    { color: #c7c7cc; font-size: 13px; }
.scv-nav-actions { display: flex; gap: 8px; }

/* ── 按钮 ── */
.scv-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 14px;
  height: 30px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  outline: none;
  transition: opacity .15s, transform .1s;
  font-family: inherit;
}
.scv-btn:active { transform: scale(.97); }
.scv-btn:disabled { opacity: .45; cursor: not-allowed; }

.scv-btn-ghost {
  background: rgba(0,0,0,.06);
  color: #3c3c43;
}
.scv-btn-ghost:hover:not(:disabled) { background: rgba(0,0,0,.1); }

.scv-btn-primary {
  background: #007aff;
  color: #fff;
}
.scv-btn-primary:hover:not(:disabled) { background: #0071e3; }

.scv-btn-destructive {
  background: rgba(255,59,48,.1);
  color: #ff3b30;
}
.scv-btn-destructive:hover:not(:disabled) { background: rgba(255,59,48,.18); }

/* ── 内容区 ── */
.scv-content { padding: 24px; max-width: 1060px; margin: 0 auto; }

/* ── 标题块 ── */
.scv-title-block {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}
.scv-app-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(145deg, #34aadc, #007aff);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0,122,255,.35);
  flex-shrink: 0;
}
.scv-title    { margin: 0 0 3px; font-size: 22px; font-weight: 700; letter-spacing: -.4px; }
.scv-subtitle { margin: 0; font-size: 13px; color: #8e8e93; }

/* ── 双栏布局 ── */
.scv-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  align-items: start;
}
.scv-col { display: flex; flex-direction: column; gap: 20px; }

/* ── 分组 ── */
.scv-group-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: #6c6c70;
  padding: 0 4px;
  margin-bottom: 8px;
}
.scv-group-body {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 0 rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.04);
}

/* ── 行 ── */
.scv-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  min-height: 54px;
}
.scv-row-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.scv-row-content { flex: 1; min-width: 0; }
.scv-row-label {
  font-size: 12px;
  color: #8e8e93;
  margin-bottom: 3px;
  font-weight: 500;
}
.req { color: #ff3b30; margin-left: 2px; }
.scv-divider { height: 1px; background: #f2f2f7; margin: 0 16px; }

/* ── 输入框 ── */
.scv-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  color: #1c1c1e;
  background: transparent;
  padding: 0;
}
.scv-input::placeholder { color: #c7c7cc; }

.scv-textarea {
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  color: #1c1c1e;
  background: transparent;
  resize: none;
  padding: 0;
  line-height: 1.5;
}
.scv-textarea::placeholder { color: #c7c7cc; }

/* 隐藏 el-form-item 的默认样式 */
.inrow-item { margin: 0 !important; }
.inrow-item :deep(.el-form-item__content) { line-height: normal; }
.inrow-item :deep(.el-form-item__error) {
  font-size: 11px;
  padding-top: 2px;
}

/* ── 二维码区 ── */
.qr-body { display: flex; flex-direction: column; align-items: center; padding: 24px 20px; gap: 16px; }

.qr-upload-wrap { width: 100%; }
.qr-upload-wrap :deep(.el-upload),
.qr-upload-wrap :deep(.el-upload-dragger) {
  width: 100%;
  border: 1.5px dashed #c7c7cc;
  border-radius: 10px;
  background: #fafafa;
  transition: border-color .2s, background .2s;
  box-shadow: none;
}
.qr-upload-wrap :deep(.el-upload-dragger:hover) {
  border-color: #007aff;
  background: #f0f7ff;
}

.qr-drop-zone {
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.qr-drop-icon {
  width: 56px; height: 56px;
  background: rgba(0,122,255,.08);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.qr-drop-title { font-size: 14px; font-weight: 500; color: #1c1c1e; }
.qr-drop-sub   { font-size: 12px; color: #aeaeb2; }

/* 已上传二维码 */
.qr-uploaded-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
}
.qr-frame {
  width: 160px; height: 160px;
  border-radius: 14px;
  overflow: hidden;
  background: #f2f2f7;
  box-shadow: 0 2px 12px rgba(0,0,0,.12);
  border: 1px solid rgba(0,0,0,.06);
}
.qr-img { width: 100%; height: 100%; object-fit: contain; }
.qr-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #34c759;
  font-weight: 500;
}
.qr-status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #34c759;
}
.qr-btn-row { display: flex; gap: 8px; }

/* ── 预览卡片 ── */
.preview-body { padding: 16px; }
.preview-mock {
  background: #f9f9f9;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,.07);
}
.mock-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  background: #ececec;
  border-bottom: 1px solid rgba(0,0,0,.06);
}
.mock-dot { width: 10px; height: 10px; border-radius: 50%; }
.mock-dot.r { background: #ff5f57; }
.mock-dot.y { background: #febc2e; }
.mock-dot.g { background: #28c840; }
.mock-title { font-size: 12px; font-weight: 600; color: #3c3c43; margin-left: 6px; }

.mock-content { padding: 12px; display: flex; flex-direction: column; gap: 8px; }

.mock-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.mock-label {
  font-size: 11px;
  color: #aeaeb2;
  width: 28px;
  flex-shrink: 0;
  padding-top: 1px;
}
.mock-val { font-size: 12px; color: #1c1c1e; line-height: 1.4; }
.mock-val.link { color: #007aff; }

.mock-empty { font-size: 12px; color: #c7c7cc; text-align: center; padding: 12px 0; }

.mock-qr-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid rgba(0,0,0,.06);
  margin-top: 4px;
}
.mock-qr { width: 40px; height: 40px; border-radius: 6px; border: 1px solid rgba(0,0,0,.1); }
.mock-qr-label { font-size: 11px; color: #8e8e93; }

/* ── 旋转动画 ── */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }

/* ── 响应式 ── */
@media (max-width: 960px) {
  .scv-grid { grid-template-columns: 1fr; }
  .scv-content { padding: 16px; }
}
</style>

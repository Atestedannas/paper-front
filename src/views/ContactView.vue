<template>
  <div class="contact-view">
    <div class="contact-container">
      <div class="page-header">
        <h1 class="page-title">联系我们</h1>
        <p class="page-subtitle">如有任何问题或建议，欢迎随时与我们联系</p>
      </div>

      <div class="contact-grid">
        <!-- 客服信息卡片 -->
        <div class="info-card" v-if="contactInfo.name || contactInfo.phone || contactInfo.workHours || contactInfo.address">
          <div class="card-icon-bar">
            <div class="icon-circle blue"><el-icon :size="22"><User /></el-icon></div>
            <h3>客服信息</h3>
          </div>
          <div class="info-rows">
            <div class="info-row" v-if="contactInfo.name">
              <span class="row-label">客服</span>
              <span class="row-value">{{ contactInfo.name }}</span>
            </div>
            <div class="info-row" v-if="contactInfo.phone">
              <span class="row-label">电话</span>
              <a :href="`tel:${contactInfo.phone}`" class="row-value link">{{ contactInfo.phone }}</a>
            </div>
            <div class="info-row" v-if="contactInfo.workHours">
              <span class="row-label">时间</span>
              <span class="row-value">{{ contactInfo.workHours }}</span>
            </div>
            <div class="info-row" v-if="contactInfo.address">
              <span class="row-label">地址</span>
              <span class="row-value">{{ contactInfo.address }}</span>
            </div>
          </div>
        </div>

        <!-- 联系邮箱卡片 -->
        <div class="info-card" v-if="contactInfo.emailSupport || contactInfo.emailBusiness">
          <div class="card-icon-bar">
            <div class="icon-circle indigo"><el-icon :size="22"><Message /></el-icon></div>
            <h3>联系邮箱</h3>
          </div>
          <div class="info-rows">
            <div class="info-row" v-if="contactInfo.emailSupport">
              <span class="row-label">技术支持</span>
              <a :href="`mailto:${contactInfo.emailSupport}`" class="row-value link">{{ contactInfo.emailSupport }}</a>
            </div>
            <div class="info-row" v-if="contactInfo.emailBusiness">
              <span class="row-label">商务合作</span>
              <a :href="`mailto:${contactInfo.emailBusiness}`" class="row-value link">{{ contactInfo.emailBusiness }}</a>
            </div>
          </div>
        </div>

        <!-- 微信客服卡片 -->
        <div class="info-card" v-if="contactInfo.wechatQrcode">
          <div class="card-icon-bar">
            <div class="icon-circle green"><el-icon :size="22"><ChatLineSquare /></el-icon></div>
            <h3>微信客服</h3>
          </div>
          <p class="card-desc">扫码添加客服微信，获取一对一帮助</p>
          <div class="qr-wrap">
            <el-image :src="contactInfo.wechatQrcode" fit="contain" class="qr-img">
              <template #error><div class="qr-error">二维码加载失败</div></template>
            </el-image>
            <span class="qr-tip">扫码加微信客服</span>
          </div>
        </div>

        <!-- 在线留言卡片 -->
        <div class="info-card form-card">
          <div class="card-icon-bar">
            <div class="icon-circle orange"><el-icon :size="22"><Promotion /></el-icon></div>
            <h3>在线留言</h3>
          </div>
          <p class="card-desc">填写以下信息，我们将尽快通过邮件回复您</p>
          <el-form :model="contactForm" :rules="contactRules" ref="contactFormRef" label-position="top" class="msg-form">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="姓名" prop="name">
                  <el-input v-model="contactForm.name" placeholder="怎么称呼您？" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="contactForm.email" placeholder="接收回复的邮箱" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="留言内容" prop="message">
              <el-input v-model="contactForm.message" type="textarea" :rows="5" placeholder="请描述您的问题或建议..." />
            </el-form-item>
            <el-button type="primary" :loading="submitting" @click="submitForm" class="submit-btn">
              发送消息
            </el-button>
          </el-form>
        </div>
      </div>

      <!-- 常见问题 -->
      <div class="faq-card">
        <h3>常见问题</h3>
        <el-collapse>
          <el-collapse-item title="如何使用论文格式检查系统？" name="1">
            <p>注册登录 → 点击"论文上传" → 选择学校或自定义格式 → 上传论文（Word/PDF） → 等待自动检查并下载报告</p>
          </el-collapse-item>
          <el-collapse-item title="系统支持哪些文件格式？" name="2">
            <p>完美支持 <strong>DOCX</strong> 和 <strong>PDF</strong>。旧 DOC 格式建议先转为 DOCX。</p>
          </el-collapse-item>
          <el-collapse-item title="检查结果需要多长时间？" name="3">
            <p>通常 <strong>1-3 分钟</strong>，超长篇幅（50 页+）稍长。</p>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Message, ChatLineSquare, Promotion } from '@element-plus/icons-vue'
import { getContactInfo } from '@/api/config'

const contactFormRef = ref()
const submitting = ref(false)

const contactInfo = reactive({
  name: '',
  emailSupport: '',
  emailBusiness: '',
  wechatQrcode: '',
  phone: '',
  address: '',
  workHours: ''
})

const contactForm = reactive({ name: '', email: '', message: '' })
const contactRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  message: [{ required: true, message: '请输入留言', trigger: 'blur' }, { min: 5, message: '至少 5 个字符', trigger: 'blur' }]
}

const fetchContactInfo = async () => {
  try {
    const res = await getContactInfo()
    if (res && typeof res === 'object') {
      contactInfo.name = res.name || ''
      contactInfo.emailSupport = res.email_support || ''
      contactInfo.emailBusiness = res.email_business || ''
      contactInfo.wechatQrcode = res.wechat_qrcode || ''
      contactInfo.phone = res.phone || ''
      contactInfo.address = res.address || ''
      contactInfo.workHours = res.work_hours || ''
    }
  } catch (e) {
    console.error('获取联系信息失败:', e)
  }
}

const submitForm = async () => {
  if (!contactFormRef.value) return
  try {
    await contactFormRef.value.validate()
    submitting.value = true
    setTimeout(() => {
      ElMessage.success('消息已发送，我们将尽快回复！')
      contactFormRef.value.resetFields()
      submitting.value = false
    }, 1200)
  } catch {
    submitting.value = false
  }
}

onMounted(fetchContactInfo)
</script>

<style scoped>
.contact-view {
  min-height: calc(100vh - 64px);
  background: transparent;
}
.contact-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 20px 60px;
}
.page-header {
  text-align: center;
  margin-bottom: 40px;
}
.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}
.page-subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

/* ── Grid ── */
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 28px;
}

/* ── Card ── */
.info-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: transform .25s, box-shadow .25s;
}
.info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.1);
}
.form-card {
  grid-column: 1 / -1;
}
.card-icon-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.icon-circle.blue   { background: linear-gradient(135deg,#60a5fa,#3b82f6); }
.icon-circle.indigo { background: linear-gradient(135deg,#818cf8,#6366f1); }
.icon-circle.green  { background: linear-gradient(135deg,#34d399,#10b981); }
.icon-circle.orange { background: linear-gradient(135deg,#fb923c,#f97316); }
.card-icon-bar h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
}
.card-desc {
  color: #64748b;
  font-size: .9rem;
  margin: 0 0 16px;
}

/* ── Info Rows ── */
.info-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.info-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
}
.row-label {
  min-width: 48px;
  font-size: .85rem;
  font-weight: 600;
  color: #94a3b8;
  flex-shrink: 0;
}
.row-value {
  font-size: .95rem;
  color: #334155;
  font-weight: 500;
}
.row-value.link {
  color: #3b82f6;
  text-decoration: none;
  cursor: pointer;
}
.row-value.link:hover {
  text-decoration: underline;
}

/* ── QR ── */
.qr-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.qr-img {
  width: 180px;
  height: 180px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
.qr-error {
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #94a3b8;
  font-size: .85rem;
  border-radius: 12px;
}
.qr-tip {
  font-size: .8rem;
  color: #94a3b8;
}

/* ── Form ── */
.msg-form .submit-btn {
  width: 100%;
  height: 42px;
  font-size: .95rem;
  border-radius: 8px;
}

/* ── FAQ ── */
.faq-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.faq-card h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px;
}
.faq-card p {
  color: #64748b;
  line-height: 1.7;
  margin: 0;
}

/* ── Responsive ── */
@media (max-width: 700px) {
  .contact-grid { grid-template-columns: 1fr; }
}
</style>

<template>
  <div class="payment-settings">
    <div class="header">
      <h1>支付设置</h1>
      <p>配置支付宝与微信支付参数</p>
    </div>
    <div class="grid">
      <el-card class="card" shadow="hover">
        <h2 class="card-title">支付宝</h2>
        <el-form :model="alipay" :rules="rules.alipay" ref="alipayRef" label-position="top">
          <el-form-item label="App ID" prop="appId">
            <el-input v-model="alipay.appId" placeholder="请输入支付宝 App ID" />
          </el-form-item>
          <el-form-item label="应用私钥" prop="privateKey">
            <el-input v-model="alipay.privateKey" type="textarea" placeholder="请输入应用私钥" />
          </el-form-item>
          <el-form-item label="支付宝公钥" prop="alipayPublicKey">
            <el-input v-model="alipay.alipayPublicKey" type="textarea" placeholder="请输入支付宝公钥" />
          </el-form-item>
          <el-form-item label="签名算法" prop="signType">
            <el-select v-model="alipay.signType" placeholder="请选择">
              <el-option label="RSA2" value="RSA2" />
              <el-option label="RSA" value="RSA" />
            </el-select>
          </el-form-item>
          <el-form-item label="异步通知地址" prop="notifyUrl">
            <el-input v-model="alipay.notifyUrl" placeholder="https://example.com/api/payments/alipay/notify" />
          </el-form-item>
          <div class="actions">
            <el-button type="primary" :loading="savingAlipay" @click="saveAlipay">保存支付宝设置</el-button>
            <el-button @click="runHealthCheck('alipay')">健康检查</el-button>
          </div>
        </el-form>
      </el-card>
      <el-card class="card" shadow="hover">
        <h2 class="card-title">微信支付</h2>
        <el-form :model="wechat" :rules="rules.wechat" ref="wechatRef" label-position="top">
          <el-form-item label="商户号 Mch ID" prop="mchId">
            <el-input v-model="wechat.mchId" placeholder="请输入商户号" />
          </el-form-item>
          <el-form-item label="商户API密钥" prop="apiKey">
            <el-input v-model="wechat.apiKey" placeholder="请输入商户API密钥" />
          </el-form-item>
          <el-form-item label="应用 AppID" prop="appId">
            <el-input v-model="wechat.appId" placeholder="请输入应用 AppID" />
          </el-form-item>
          <el-form-item label="证书序列号" prop="serialNo">
            <el-input v-model="wechat.serialNo" placeholder="请输入证书序列号" />
          </el-form-item>
          <el-form-item label="平台公钥" prop="platformPublicKey">
            <el-input v-model="wechat.platformPublicKey" type="textarea" placeholder="请输入平台公钥" />
          </el-form-item>
          <el-form-item label="异步通知地址" prop="notifyUrl">
            <el-input v-model="wechat.notifyUrl" placeholder="https://example.com/api/payments/wechat/notify" />
          </el-form-item>
          <div class="actions">
            <el-button type="primary" :loading="savingWechat" @click="saveWechat">保存微信支付设置</el-button>
            <el-button @click="runHealthCheck('wechat')">健康检查</el-button>
          </div>
        </el-form>
      </el-card>
    </div>
    <el-drawer v-model="healthVisible" :title="`支付健康检查 - ${healthProvider}`" size="30%">
      <pre style="background:#111827;color:#d1fae5;padding:12px;border-radius:8px;overflow:auto;max-height:60vh;">
{{ JSON.stringify(healthResult, null, 2) }}
      </pre>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { getPaymentSettings, updatePaymentSettings, testPayment } from '../../../api/admin'

const alipayRef = ref()
const wechatRef = ref()
const savingAlipay = ref(false)
const savingWechat = ref(false)
const healthVisible = ref(false)
const healthProvider = ref('')
const healthResult = ref({})

const alipay = reactive({
  appId: '',
  privateKey: '',
  alipayPublicKey: '',
  signType: 'RSA2',
  notifyUrl: ''
})

const wechat = reactive({
  mchId: '',
  apiKey: '',
  appId: '',
  serialNo: '',
  platformPublicKey: '',
  notifyUrl: ''
})

const rules = {
  alipay: {
    appId: [{ required: true, message: '请输入 App ID', trigger: 'blur' }],
    privateKey: [{ required: true, message: '请输入应用私钥', trigger: 'blur' }],
    alipayPublicKey: [{ required: true, message: '请输入支付宝公钥', trigger: 'blur' }],
    signType: [{ required: true, message: '请选择签名算法', trigger: 'change' }],
    notifyUrl: [{ required: true, message: '请输入异步通知地址', trigger: 'blur' }]
  },
  wechat: {
    mchId: [{ required: true, message: '请输入商户号', trigger: 'blur' }],
    apiKey: [{ required: true, message: '请输入商户API密钥', trigger: 'blur' }],
    appId: [{ required: true, message: '请输入 AppID', trigger: 'blur' }],
    serialNo: [{ required: true, message: '请输入证书序列号', trigger: 'blur' }],
    platformPublicKey: [{ required: true, message: '请输入平台公钥', trigger: 'blur' }],
    notifyUrl: [{ required: true, message: '请输入异步通知地址', trigger: 'blur' }]
  }
}

const saveAlipay = async () => {
  try {
    const valid = await alipayRef.value.validate()
    if (!valid) return
    savingAlipay.value = true
    await updatePaymentSettings('alipay', {
      app_id: alipay.appId,
      private_key: alipay.privateKey,
      alipay_public_key: alipay.alipayPublicKey,
      sign_type: alipay.signType,
      notify_url: alipay.notifyUrl
    })
    ElMessage.success('支付宝设置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    savingAlipay.value = false
  }
}

const saveWechat = async () => {
  try {
    const valid = await wechatRef.value.validate()
    if (!valid) return
    savingWechat.value = true
    await updatePaymentSettings('wechat', {
      mch_id: wechat.mchId,
      api_key: wechat.apiKey,
      app_id: wechat.appId,
      serial_no: wechat.serialNo,
      platform_public_key: wechat.platformPublicKey,
      notify_url: wechat.notifyUrl
    })
    ElMessage.success('微信支付设置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    savingWechat.value = false
  }
}

const runHealthCheck = async (provider) => {
  try {
    healthProvider.value = provider
    const res = await testPayment(provider)
    healthResult.value = res || {}
    healthVisible.value = true
  } catch (e) {
    ElMessage.error('健康检查失败')
  }
}

// 初始化加载（不回显敏感字段，后端可选择mask）
const loadSettings = async () => {
  try {
    const [ali, we] = await Promise.all([
      getPaymentSettings('alipay'),
      getPaymentSettings('wechat')
    ])
    if (ali) {
      alipay.appId = ali.app_id || ''
      alipay.signType = ali.sign_type || 'RSA2'
      alipay.notifyUrl = ali.notify_url || ''
      // 私钥与公钥不做前端持久化与回显
    }
    if (we) {
      wechat.mchId = we.mch_id || ''
      wechat.appId = we.app_id || ''
      wechat.serialNo = we.serial_no || ''
      wechat.notifyUrl = we.notify_url || ''
      // api_key 与 platform_public_key 不做前端持久化与回显
    }
  } catch (e) {
    // 静默失败，避免暴露细节
  }
}

loadSettings()
</script>

<style scoped>
.payment-settings {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
}
.header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}
.header p {
  margin: 8px 0 16px;
  color: #64748b;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 20px;
}
.card {
  border-radius: 16px;
}
.card-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
}
</style>

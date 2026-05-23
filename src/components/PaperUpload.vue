<template>
  <div class="paper-upload-container">
    <!-- 支付确认对话框 -->
    <PaymentModal
      v-model="showPaymentDialog"
      :amount="paymentAmount"
      :order-id="orderId"
      @payment-success="onPaymentSuccess"
      @payment-cancel="onPaymentCancel"
      @payment-error="onPaymentError"
    />
    
    <!-- 步骤导航 -->
    <div class="upload-steps">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="上传论文" />
        <el-step title="选择模板" v-if="!props.templateId" />
        <el-step title="支付确认" v-if="paperCheckConfig.is_paper_check_paid" />
        <el-step title="查看结果" />
      </el-steps>
    </div>

    <!-- 主标题区域 -->
    <div class="upload-header">
      <div class="school-name" v-if="props.templateId">
        <el-tag type="info" size="large">{{ getSchoolNameById(props.templateId) }}</el-tag>
      </div>
      <h2 class="upload-title">论文上传</h2>
      <p class="upload-description">上传您的论文文件，系统将自动进行格式检查</p>
    </div>

    <!-- 上传区域 -->
    <div class="upload-area" 
         :class="{ 'drag-over': isDragOver, 'has-file': selectedFile }"
         @drop="handleDrop"
         @dragover="handleDragOver"
         @dragleave="handleDragLeave">
      
      <!-- 未选择文件时的状态 -->
      <div v-if="!selectedFile" class="upload-empty-state">
        <el-icon class="upload-icon"><upload-filled /></el-icon>
        <h3>拖拽论文文件到此区域</h3>
        <p>或点击下方按钮选择文件</p>
        <el-button type="primary" size="large" @click="triggerFileInput">
          选择论文文件
        </el-button>
        <input 
          ref="fileInput" 
          type="file" 
          style="display: none" 
          @change="handleFileSelect"
          accept=".doc,.docx,.pdf" />
      </div>

      <!-- 已选择文件时的状态 -->
      <div v-else class="file-info-container">
        <div class="file-info">
          <el-icon class="file-icon"><document /></el-icon>
          <div class="file-details">
            <h4>{{ selectedFile.name }}</h4>
            <p>{{ formatFileSize(selectedFile.size) }}</p>
            <p class="file-type">{{ getFileType(selectedFile.name) }}</p>
          </div>
          <el-button type="text" @click="removeFile">
            <el-icon><close /></el-icon>
          </el-button>
        </div>
        
        <!-- 文件相关的支付信息 -->
        <div v-if="paperCheckConfig.is_paper_check_paid && selectedFile" class="payment-info">
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="服务费用">
              <el-tag type="danger" size="small">¥{{ paymentAmount }}</el-tag>
              <span class="payment-note">（格式检查及修正服务）</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </div>

    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress">
      <div class="progress-header">
        <span>上传进度</span>
        <span>{{ progress }}%</span>
      </div>
      <el-progress 
        :percentage="progress" 
        :stroke-width="8"
        :show-text="false" />
      <p class="progress-text">正在上传论文文件，请稍候...</p>
    </div>

    <!-- 操作按钮 -->
    <div class="upload-actions">
      <el-button 
        type="primary" 
        size="large" 
        :loading="uploading" 
        :disabled="!selectedFile || uploading"
        @click="initiateUpload">
        {{ uploading ? '上传中...' : (isPaid ? '查看结果' : (props.templateId ? '上传论文并按高校模板修正' : '开始格式检查')) }}
      </el-button>
      <el-button v-if="selectedFile && !uploading" @click="removeFile">
        重新选择
      </el-button>
    </div>

    <!-- 格式标准配置 -->
  

    <!-- 补充要求说明 -->
   
    
    <!-- 底部信息区 -->
    <div class="footer-info">
      <el-divider />
      <div class="footer-content">
        <div class="university-count">
          <el-icon><Collection /></el-icon>
          <span>已收录 {{ universityCount }} 所高校标准</span>
        </div>
        <div class="support-links">
          <el-link type="primary" href="/contact" target="_blank">联系我们</el-link>
          <el-link type="info" href="/history" target="_blank">检查历史</el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document, Close, Loading, Upload, InfoFilled, Delete, ArrowDown, ArrowUp, Setting, Collection } from '@element-plus/icons-vue'
import request from '../utils/request'
import { uploadPaper, fixByTemplate, uploadTemplate } from '../api/paper'
import { getPaperCheckConfig, getPaperCheckConfigPublic } from '../api/config'
import { checkPaperPaymentStatus } from '../api/auth'
import { createOrder, getOrders } from '../api/order'
import { useRouter } from 'vue-router'
import PaymentModal from './PaymentModal.vue'
const emit = defineEmits(['fixed', 'template-uploaded'])

const props = defineProps({
  initialTemplate: {
      type: [String, Number],
      default: 'default'
    },
  isCustom: {
    type: Boolean,
    default: false
  },
  importedTemplateFile: {
    type: Object, // File 对象
    default: null
  },
  templateId: {
    type: [String, Number],
    default: null
  },
  formatStandardId: {
    type: [String, Number, Object],
    default: null
  }
})

// 内部管理的导入模板文件（用于组件内部上传）
const importedTemplateFile = ref(props.importedTemplateFile)

const router = useRouter()
const fileInput = ref(null)
const templateFileInput = ref(null)

// 响应式数据
const selectedFile = ref(null)
const selectedTemplate = ref('default')
const showConfigDetail = ref(false)
const paperRequirements = ref('')
const uploading = ref(false)
const progress = ref(0)
const isDragOver = ref(false)
const formatSource = ref('preset')
const jsonInput = ref('')
const autoStartWhenFileSelected = ref(false)
const uploadingTemplate = ref(false)
const templateUploadProgress = ref(0)
// 支付相关数据
const showPaymentDialog = ref(false)
const paymentAmount = ref(0)
const isPaid = ref(false)
const orderId = ref('')
const paperCheckConfig = ref({
  is_paper_check_paid: true,
  max_free_checks: 2,
  max_file_size: 52428800,
  allowed_file_types: 'pdf,doc,docx',
  enable_pdf_check: true,
  enable_docx_check: true,
  check_timeout: 300
})
// 新增变量
const currentStep = ref(0) // 当前步骤
const universityCount = ref(120) // 高校数量

const normalizePaymentCheck = (response) => {
  const payload = response?.data || response || {}
  return {
    is_check_free: Boolean(payload.is_check_free),
    price: Number(payload.price ?? payload.amount ?? 0) || 0,
    message: payload.message || ''
  }
}

const fetchServicePriceFromBackend = async (serviceType = 'check_and_fix') => {
  const response = await checkPaperPaymentStatus({
    service_type: serviceType,
    paper_id: '',
    template_id: props.templateId
  })
  const normalized = normalizePaymentCheck(response)
  paymentAmount.value = normalized.price
  return normalized
}

// 监听 props 变化
watch(() => props.initialTemplate, (newVal) => {
  if (newVal) {
    selectedTemplate.value = newVal
    handleTemplateChange(newVal)
  }
})

watch(() => props.isCustom, (newVal) => {
  if (newVal) {
    selectedTemplate.value = 'custom'
    showConfigDetail.value = true
  }
})

watch(() => props.templateId, () => {
  fetchServicePriceFromBackend().catch(() => {
    paymentAmount.value = 0
  })
})

onMounted(async () => {
  // 初始化导入的模板文件
  importedTemplateFile.value = props.importedTemplateFile
  
  if (props.importedTemplateFile) {
    // 如果有导入的模板文件
    selectedTemplate.value = 'custom'
    showConfigDetail.value = false // 默认折叠，因为主要依赖文件
  } else if (props.isCustom) {
    selectedTemplate.value = 'custom'
    showConfigDetail.value = true
    formatSource.value = 'json'
  } else if (props.initialTemplate) {
    selectedTemplate.value = props.initialTemplate
    handleTemplateChange(props.initialTemplate)
  }
  
   // 获取论文格式检查配置（优先使用公开API）
   try {
     // 先尝试调用公开API
     let configResponse = await getPaperCheckConfigPublic();


     if (configResponse && configResponse.code === 200 && configResponse.data) {
       paperCheckConfig.value = configResponse.data;

     } else {
       // 如果公开API失败，尝试鉴权API
  
       configResponse = await getPaperCheckConfig();

       if (configResponse && configResponse.code === 200 && configResponse.data) {
         paperCheckConfig.value = configResponse.data;

       }
     }
   } catch (error) {

     // 使用默认免费配置
     paperCheckConfig.value = {
       is_paper_check_paid: false,
       max_free_checks: 999,
       max_file_size: 52428800,
       allowed_file_types: "pdf,doc,docx"
     };

   }

   fetchServicePriceFromBackend().catch(() => {
     paymentAmount.value = 0
   })
})

watch(() => props.importedTemplateFile, (newVal) => {
  importedTemplateFile.value = newVal
  if (newVal) {
    selectedTemplate.value = 'custom'
    showConfigDetail.value = true
    // 如果传入的是文件对象，不需要直接赋值到configForm
    if (newVal instanceof File) {
      autoStartWhenFileSelected.value = !selectedFile.value
      if (!selectedFile.value) {
        ElMessage.info('已加载模板文件，请选择论文文件以开始上传')
      }
    } else {
      // 如果是配置对象，则更新配置
      Object.assign(configForm, newVal)
    }
  }
})

// 格式配置表单
const configForm = reactive({
  pageSetup: {
    margin_top: 2.5,
    margin_bottom: 2.5,
    margin_left: 3.0,
    margin_right: 2.5
  },
  paragraph_styles: {
    body: {
      font: 'SimSun',
      size: '12pt',
      line_spacing: '20磅'
    }
  },
  heading_styles: {
    type: 'science', // science(理工) or arts(文科)
    level1_font: '三号黑体',
    level2_font: '小三加粗',
    level3_font: '四号黑体'
  },
  page_header: {
    content: ''
  },
  page_footer: {
    style: 'continuous' // continuous or roman_arabic
  },
  reference: {
    style: 'gbt7714',
    font: '五号宋体'
  }
})

// 预设模板数据
const templates = {
  default: {
    pageSetup: { margin_top: 2.5, margin_bottom: 2.5, margin_left: 3.0, margin_right: 2.5 },
    paragraph_styles: { body: { font: 'SimSun', size: '12pt', line_spacing: '1.5倍' } },
    heading_styles: { type: 'science', level1_font: '三号黑体', level2_font: '小三加粗', level3_font: '四号黑体' },
    page_header: { content: '' },
    page_footer: { style: 'continuous' },
    reference: { style: 'gbt7714', font: '五号宋体' }
  },
  cq_eng: {
    pageSetup: { margin_top: 2.5, margin_bottom: 2.5, margin_left: 2.5, margin_right: 2.5 },
    paragraph_styles: { body: { font: 'SimSun', size: '12pt', line_spacing: '20磅' } },
    heading_styles: { type: 'science', level1_font: '三号黑体', level2_font: '小三加粗', level3_font: '四号黑体' },
    page_header: { content: '重庆工程学院本科毕业设计（论文）' },
    page_footer: { style: 'roman_arabic' },
    reference: { style: 'gbt7714', font: '五号宋体' }
  }
}

// 监听模板变化
const handleTemplateChange = (val) => {
  if (val === 'custom') {
    showConfigDetail.value = true
  } else if (templates[val]) {
    const t = templates[val]
    configForm.pageSetup = { ...t.pageSetup }
    configForm.paragraph_styles.body = { ...t.paragraph_styles.body }
    configForm.heading_styles = { ...t.heading_styles }
    configForm.page_header = { ...t.page_header }
    configForm.page_footer = { ...t.page_footer }
    configForm.reference = { ...t.reference }
    
    // 如果选择了特定高校模板，可以自动填充一些文本要求到输入框（可选）
    if (val === 'cq_eng') {
      ElMessage.success('已加载重庆工程学院格式标准')
    }
  }
}

// 文件大小格式化
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取文件类型
const getFileType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase()
  return extension === 'docx' ? 'Word 文档' : 'PDF 文档'
}

// 文件验证
const validateFile = (file) => {
  const allowedExtensions = ['.doc', '.docx', '.pdf']
  const maxSize = 100 * 1024 * 1024 // 100MB
  
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
  
  if (!allowedExtensions.includes(fileExtension)) {
    ElMessage.error('仅支持上传 DOC、DOCX、PDF 格式文件')
    return false
  }
  
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 100MB')
    return false
  }
  
  return true
}

// 拖拽事件处理
const handleDragOver = (e) => {
  e.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (e) => {
  e.preventDefault()
  isDragOver.value = false
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragOver.value = false
  
  const files = e.dataTransfer.files
  if (files.length > 0) {
    handleFile(files[0])
  }
}

// 文件选择处理
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) {
    handleFile(file)
  }
}

const handleFile = (file) => {
  if (validateFile(file)) {
    selectedFile.value = file
    fetchServicePriceFromBackend().catch(() => {
      paymentAmount.value = 0
    })
    if (autoStartWhenFileSelected.value) {
      setTimeout(() => {
        startUpload()
      }, 0)
      autoStartWhenFileSelected.value = false
    }
  }
}

// 移除文件
const removeFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 触发模板文件选择
const triggerTemplateInput = () => {
  templateFileInput.value?.click()
}

// 处理模板文件选择
const handleTemplateFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  const extension = file.name.split('.').pop().toLowerCase()
  if (extension !== 'docx' && extension !== 'doc') {
    ElMessage.error('请上传 Word 格式的模板文件 (.docx, .doc)')
    if (templateFileInput.value) {
      templateFileInput.value.value = ''
    }
    return
  }

  // 验证文件大小（建议不超过50MB）
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    ElMessage.error('模板文件大小不能超过 50MB')
    if (templateFileInput.value) {
      templateFileInput.value.value = ''
    }
    return
  }

  // 上传模板文件
  uploadingTemplate.value = true
  templateUploadProgress.value = 0

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await uploadTemplate(formData, (progressEvent) => {
      if (progressEvent?.lengthComputable) {
        templateUploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      }
    })

    // 模板上传成功，保存文件引用
    importedTemplateFile.value = file
    
    // 如果后端返回了解析后的配置，可以更新配置表单
    if (response && response.format_config) {
      try {
        const config = typeof response.format_config === 'string' 
          ? JSON.parse(response.format_config) 
          : response.format_config
        
        // 更新配置表单
        if (config.pageSetup) {
          Object.assign(configForm.pageSetup, config.pageSetup)
        }
        if (config.paragraph_styles) {
          Object.assign(configForm.paragraph_styles, config.paragraph_styles)
        }
        if (config.heading_styles) {
          Object.assign(configForm.heading_styles, config.heading_styles)
        }
        if (config.page_header) {
          Object.assign(configForm.page_header, config.page_header)
        }
        if (config.page_footer) {
          Object.assign(configForm.page_footer, config.page_footer)
        }
        if (config.reference) {
          Object.assign(configForm.reference, config.reference)
        }
      } catch (e) {

      }
    }

    ElMessage.success('模板文件已上传并解析成功')
    
    // 触发事件通知父组件
    emit('template-uploaded', { file, config: response })
    
  } catch (error) {

    ElMessage.error('模板上传失败：' + (error.message || '网络错误'))
  } finally {
    uploadingTemplate.value = false
    templateUploadProgress.value = 0
    if (templateFileInput.value) {
      templateFileInput.value.value = ''
    }
  }
}

// 清除导入的模板
const clearImportedTemplate = () => {
  importedTemplateFile.value = null
  ElMessage.info('已清除导入的模板文件')
}

// 获取高校名称的方法
const getSchoolNameById = (templateId) => {
  // 这里应该从后端获取高校名称，暂时使用模拟数据
  const schoolNames = {
    'cq_eng': '重庆工程学院',
    'pku': '北京大学',
    'thu': '清华大学',
    'default': '默认高校'
  };
  
  return schoolNames[templateId] || `高校模板${templateId}`;
};

// 初始化上传流程
const initiateUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择论文文件')
    return
  }

  try {
    const paymentCheck = await fetchServicePriceFromBackend('check_and_fix');
    
    if (paymentCheck.is_check_free) {
      await performUpload()
    } else {
      // 检查是否有已支付但未使用的订单
      try {
        const ordersResp = await getOrders({ page: 1, page_size: 10 })
        const ordersList = ordersResp?.orders || (Array.isArray(ordersResp) ? ordersResp : [])
        const paidOrder = ordersList.find(o => o.payment_status === 'paid')
        if (paidOrder) {
          ElMessage.success('检测到已支付订单，直接上传...')
          orderId.value = paidOrder.id
          await performUpload()
          return
        }
      } catch {
        // 查询失败不影响新建订单流程
      }

      const orderData = {
        service_type: 'check_and_fix',
        amount: paymentCheck.price,
        paper_id: '',
        template_id: props.templateId,
        payment_method: 'wechat'
      };
      
      const orderResponse = await createOrder(orderData);
      if (orderResponse && orderResponse.id) {
        orderId.value = orderResponse.id;
        paymentAmount.value = Number(orderResponse.total_amount ?? orderResponse.amount ?? paymentCheck.price ?? 0);
        showPaymentDialog.value = true;
      } else {
        ElMessage.error('创建订单失败');
      }
    }
  } catch (error) {
    ElMessage.error('初始化上传失败：' + (error.message || '网络错误'));
  }
}

// 执行上传
const performUpload = async () => {
  uploading.value = true 
  progress.value = 0 
  
  try { 
    const formData = new FormData() 
    formData.append('file', selectedFile.value) 
    
    // 构建配置：优先使用自定义 JSON，其次使用表单配置
    if (!importedTemplateFile.value && !props.templateId) { 
      if (formatSource.value === 'json' && jsonInput.value.trim()) { 
        formData.append('format_config_json', jsonInput.value.trim()) 
      } else { 
        const finalConfig = { 
          template: selectedTemplate.value, 
          ...configForm 
        } 
        formData.append('format_config_json', JSON.stringify(finalConfig)) 
      } 
    }

    // 如果有导入的模板文件，添加到 FormData 
    if (importedTemplateFile.value) { 
      formData.append('template_file', importedTemplateFile.value) 
    } 

    // 如果有模板ID，添加到FormData中
    if (props.templateId != null && props.templateId !== '') { 
      formData.append('template_id', String(props.templateId)) 
    } 

    // 添加格式标准ID（format_standard_id）
    // 这里假设formatStandardId是从props或其他地方获取的格式ID
    // 请根据实际情况来调整
    if (props.formatStandardId != null && props.formatStandardId !== '') {
      formData.append('format_standard_id', String(props.formatStandardId))
    } 

    // 如果有论文要求文本，也添加到FormData中
    // 对于高校模板，不需要添加论文要求
    if (!props.templateId && paperRequirements.value.trim()) { 
      formData.append('requirements', paperRequirements.value.trim()) 
    } 
    
    const uploadRes = await uploadPaper(formData, (progressEvent) => { 
      if (progressEvent?.lengthComputable) { 
        progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total) 
      } 
    }) 
    const job = uploadRes?.job || uploadRes?.data?.job || uploadRes
    const jobId = job?.id || job?.job_id || uploadRes?.job_id
    if (jobId) {
      ElMessage.success('论文已进入 DOCX 闭环处理，请在任务页等待复检结果')
      router.push({
        name: 'paper-job',
        params: { jobId }
      })
      return
    }

    const paperId = uploadRes?.id || uploadRes?.paper_id || uploadRes?.data?.id || uploadRes?.paper?.id
    if (!paperId) { 
      ElMessage.error('上传成功但未返回论文ID') 
      return 
    } 
    
    // 检查上传响应中是否已经包含修正结果
    // 后端在有模板时会自动执行修正，不需要重复调用
    const alreadyFixed = uploadRes?.corrected_file_path || uploadRes?.download_url || uploadRes?.fix_result
    if (alreadyFixed) {
      ElMessage.success('论文已上传并修正完成，正在准备下载..')
      emit('fixed', { paperId })
      router.push({ 
        name: 'format-check', 
        params: { paperId },
        query: { auto_download: 'true' }
      })
      return
    }
    
    // 只有在上传接口没有完成修正时才调用修正接口
    try {
      const fixForm = new FormData() 
      if (importedTemplateFile.value) { 
        fixForm.append('requirements_file', importedTemplateFile.value) 
      } else if (props.templateId) { 
        fixForm.append('template_id', props.templateId) 
      } else {
        // 即使没有模板，也使用配置进行修正
        const finalConfig = { 
          template: selectedTemplate.value, 
          ...configForm 
        }
        fixForm.append('format_config_json', JSON.stringify(finalConfig))
      }
      
      await fixByTemplate(paperId, fixForm) 
      ElMessage.success('论文已上传并修正完成，正在准备下载..') 
      emit('fixed', { paperId }) 
    } catch (fixError) {
      console.error('修正失败:', fixError)
      ElMessage.warning('论文已上传，但修正过程出现问题')
    }
    
    router.push({ 
      name: 'format-check', 
      params: { paperId },
      query: { auto_download: 'true' }
    }) 
    
  } catch (error) { 

    // 处理后端返回的支付相关错误
    if (error.response) { 
      const { status, data } = error.response 
      // 检查是否为402错误或包含支付提示的消息 
      if (status === 402 || (data && (data.error?.includes('支付') || data.error?.includes('付费') || data.message?.includes('支付') || data.message?.includes('付费')))) { 
        // 更新支付金额并显示支付对话框 
        paymentAmount.value = Number(data?.price ?? paymentAmount.value ?? 0)
        showPaymentDialog.value = true 
        return 
      } 
    } 
    ElMessage.error('上传失败：' + (error.message || '网络错误')) 
  } finally { 
    uploading.value = false 
    progress.value = 0 
  } 
}

// 检查论文相关服务支付状态
const checkPaperServicePayment = async (serviceType = 'check_and_fix') => {
  try {
    const paymentCheck = await fetchServicePriceFromBackend(serviceType)
    return {
      isPaid: paymentCheck.is_check_free,
      price: paymentCheck.price,
      message: paymentCheck.message
    }
  } catch (error) {

    return {
      isPaid: false,
      price: 0,
      message: '检查支付状态失败'
    };
  }
}

// 支付成功回调
const onPaymentSuccess = async () => {
  showPaymentDialog.value = false
  ElMessage.success('支付成功！开始上传论文...')
  
  await performUpload()
}

// 支付取消回调
const onPaymentCancel = () => {
  showPaymentDialog.value = false
  ElMessage.info('支付已取消，如已完成支付可在「检查历史」中恢复')
}

const onPaymentError = (error) => {
  ElMessage.error('支付流程异常，请稍后重试')
  console.error('支付流程错误:', error)
}

defineExpose({ initiateUpload })
</script>

<style scoped>
.paper-upload-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.upload-steps {
  margin-bottom: 30px;
}

.school-name {
  margin-bottom: 10px;
  text-align: center;
}

.upload-header {
  text-align: center;
  margin-bottom: 40px;
}

.upload-title {
  font-size: 32px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.upload-description {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 0;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  transition: all 0.3s ease;
  margin-bottom: 30px;
  background-color: #f9fafb;
}

.upload-area.drag-over {
  border-color: #3b82f6;
  background-color: #dbeafe;
}

.upload-area.has-file {
  padding: 20px;
  border-style: solid;
}

.upload-empty-state h3 {
  margin: 16px 0;
  color: #374151;
  font-size: 20px;
}

.upload-empty-state p {
  color: #6b7280;
  margin-bottom: 24px;
}

.upload-icon {
  font-size: 48px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.file-info-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.file-icon {
  font-size: 24px;
  color: #3b82f6;
  margin-right: 20px;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-details h4 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.file-details p {
  color: #6b7280;
  margin-bottom: 2px;
}

.file-type {
  color: #10b981 !important;
  font-weight: 500;
}

.payment-info {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px;
}

.payment-note {
  margin-left: 8px;
  color: #6b7280;
  font-size: 14px;
}

.upload-progress {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-header span:first-child {
  font-weight: 600;
  color: #374151;
}

.progress-header span:last-child {
  color: #3b82f6;
  font-weight: 600;
}

.progress-text {
  margin-top: 12px;
  color: #6b7280;
  text-align: center;
}

.upload-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 40px;
}

.format-standard-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.standard-config-box {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 20px;
}

.config-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px;
  background: rgba(241, 245, 249, 0.6);
  border-radius: 6px;
  margin-top: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.config-summary:hover {
  background: rgba(241, 245, 249, 0.9);
}

.summary-item {
  display: flex;
  gap: 8px;
  font-size: 0.9rem;
  color: #64748b;
}

.summary-item .label {
  font-weight: 600;
}

.config-detail-panel {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
}

.toggle-detail-btn {
  text-align: center;
  margin-top: 10px;
  cursor: pointer;
}

.paper-requirements {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.paper-requirements h3 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}

.requirements-tip {
  color: #6b7280;
  font-size: 14px;
  margin-top: 12px;
}

.format-info {
  background: #f8fafc;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-top: 30px;
}

.format-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}

.format-list {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.format-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4b5563;
}

.format-icon {
  color: #3b82f6;
}

.format-tip {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

/* 底部信息区 */
.footer-info {
  margin-top: 40px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.university-count {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.support-links {
  display: flex;
  gap: 16px;
}

/* 导入模板样式 */
.import-template-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #e5e7eb;
}

.import-template-box {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 20px;
}

.import-template-empty {
  text-align: center;
  padding: 30px 20px;
}

.import-icon {
  font-size: 48px;
  color: #10b981;
  margin-bottom: 16px;
}

.import-desc {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 20px;
}

.imported-template-info {
  margin-top: 10px;
}

.template-file-alert {
  margin-top: 16px;
}

.template-upload-progress {
  padding: 20px;
  background: #f8fafc;
  border-radius: 6px;
}

.template-upload-progress .progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.template-upload-progress .progress-header span:first-child {
  font-weight: 600;
  color: #374151;
}

.template-upload-progress .progress-header span:last-child {
  color: #10b981;
  font-weight: 600;
}

.template-upload-progress .progress-text {
  margin-top: 12px;
  color: #6b7280;
  text-align: center;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .paper-upload-container {
    padding: 20px 16px;
  }
  
  .upload-title {
    font-size: 24px;
  }
  
  .upload-area {
    padding: 40px 20px;
  }
  
  .file-info {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .file-details {
    text-align: center;
  }
  
  .footer-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .support-links {
    width: 100%;
    justify-content: flex-end;
  }
  
  .format-list {
    flex-direction: column;
    gap: 12px;
  }
  
  .upload-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>

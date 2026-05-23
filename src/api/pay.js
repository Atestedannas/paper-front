import request from '../utils/request'
import { ElMessage } from 'element-plus'

// 获取支付宝支付参数
export const getAlipayParams = async (orderId) => {
  try {
    const response = await request({
      url: `/pay/alipay/${orderId}`,
      method: 'GET'
    })
    
    if (response && response.data) {
      return response.data
    }
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 获取微信支付参数
export const getWechatParams = async (orderId) => {
  try {
    const response = await request({
      url: `/pay/wechat/${orderId}`,
      method: 'GET'
    })
    
    if (response && response.data) {
      return response.data
    }
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 支付宝支付回调处理
export const handleAlipayCallback = async (params) => {
  try {
    const response = await request({
      url: `/pay/alipay/callback`,
      method: 'POST',
      data: params
    })
    
    if (response && response.data) {
      return response.data
    }
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 微信支付回调处理
export const handleWechatCallback = async (params) => {
  try {
    const response = await request({
      url: `/pay/wechat/callback`,
      method: 'POST',
      data: params
    })
    
    if (response && response.data) {
      return response.data
    }
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 查询支付宝支付结果
export const queryAlipayResult = async (orderId) => {
  try {
    // 使用订单状态查询接口
    const response = await request({
      url: `/api/order/${orderId}/status`,
      method: 'GET'
    })
    
    if (response && response.data) {
      return response.data
    }
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 查询微信支付结果
export const queryWechatResult = async (orderId) => {
  try {
    // 使用订单状态查询接口
    const response = await request({
      url: `/api/order/${orderId}/status`,
      method: 'GET'
    })
    
    if (response && response.data) {
      return response.data
    }
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 获取支付配置
export const getPayConfig = async () => {
  try {
    const response = await request({
      url: `/pay/config`,
      method: 'GET'
    })
    
    if (response && response.data) {
      return response.data
    }
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 获取支付二维码
export const getPayQrCode = async (orderId, payType = 'alipay') => {
  try {
    const response = await request({
      url: `/pay/qrcode/${orderId}`,
      method: 'GET',
      params: {
        pay_type: payType
      },
      responseType: 'blob' // 二维码返回的是二进制数据
    })
    
    return response
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 发起手机端支付
export const mobilePay = async (orderId, payType = 'alipay') => {
  try {
    const response = await request({
      url: `/pay/mobile/${orderId}`,
      method: 'POST',
      data: {
        pay_type: payType
      }
    })
    
    if (response && response.data) {
      return response.data
    }
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 发起PC端支付
export const pcPay = async (orderId, payType = 'alipay') => {
  try {
    const response = await request({
      url: `/pay/pc/${orderId}`,
      method: 'POST',
      data: {
        pay_type: payType
      }
    })
    
    if (response && response.data) {
      return response.data
    }
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 关闭支付订单
export const closePayOrder = async (orderId) => {
  try {
    const response = await request({
      url: `/pay/close/${orderId}`,
      method: 'POST'
    })
    
    if (response && response.data) {
      return response.data
    }
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 退款处理
export const refundOrder = async (orderId, amount, reason) => {
  try {
    const response = await request({
      url: `/pay/refund/${orderId}`,
      method: 'POST',
      data: {
        amount,
        reason
      }
    })
    
    ElMessage.success('退款申请已提交')
    return response.data
  } catch (error) {
    // 错误处理由拦截器统一处理
    throw error
  }
}

// 查询退款结果
export const queryRefundResult = async (orderId, refundId) => {
  try {
    const response = await request({
      url: `/pay/refund/query/${orderId}`,
      method: 'GET',
      params: {
        refund_id: refundId
      }
    })
    
    if (response && response.data) {
      return response.data
    }
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 获取下载配置
export const getDownloadConfig = async () => {
  try {
    const response = await request({
      url: `/config/download`,
      method: 'GET'
    })
    
    if (response && response.data) {
      return response.data
    }
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

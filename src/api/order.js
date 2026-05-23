import request from '../utils/request'
import { ElMessage } from 'element-plus'

// 创建订单（统一使用 DTO 入参）
export const createOrder = async (payload = {}) => {
  const data = {
    payment_method: 'wechat',
    ...payload
  }

  if (!data.service_type) {
    throw new Error('createOrder 缺少 service_type')
  }

  try {
    const response = await request({
      url: '/api/order',
      method: 'POST',
      data
    })
    
    return response
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 获取订单状态
export const getOrderStatus = async (orderId) => {
  try {
    const response = await request({
      url: `/api/order/${orderId}`,
      method: 'GET'
    })
    
    return response
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 获取订单列表
export const getOrders = async (params = {}) => {
  try {
    const response = await request({
      url: '/api/order',
      method: 'GET',
      params
    })
    
    return response
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 取消订单
export const cancelOrder = async (orderId) => {
  try {
    const response = await request({
      url: `/api/order/${orderId}/cancel`,
      method: 'PUT'
    })
    
    ElMessage.success('订单已取消')
    return response
  } catch (error) {
    // 错误处理由拦截器统一处理
    throw error
  }
}

// 创建支付记录
export const createPayment = async (orderId, paymentMethod = 'wechat', paymentType = '') => {
  try {
    const data = {
      order_id: orderId,
      payment_method: paymentMethod
    }
    if (paymentType) {
      data.payment_type = paymentType
    }
    const response = await request({
      url: '/api/payment',
      method: 'POST',
      data
    })
    
    return response
  } catch (error) {
    throw error
  }
}

// 生成微信支付参数
export const generateWechatPaymentParams = async (orderId) => {
  try {
    const response = await request({
      url: '/api/payment/wechat',
      method: 'POST',
      data: {
        order_id: orderId
      }
    })
    
    return response
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 生成支付宝支付参数
export const generateAlipayPaymentParams = async (orderId) => {
  try {
    const response = await request({
      url: '/api/payment/alipay',
      method: 'POST',
      data: {
        order_id: orderId
      }
    })
    
    return response
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 查询订单支付结果
export const queryPayResult = async (orderId) => {
  try {
    const response = await request({
      url: `/api/order/${orderId}`,
      method: 'GET'
    })
    
    return response
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

// 获取订单支付链接
export const getOrderPayUrl = async (orderId) => {
  try {
    const response = await request({
      url: `/api/orders/${orderId}/pay-url`,
      method: 'GET'
    })
    
    return response
  } catch (error) {
    // 重新抛出错误，让调用者处理
    throw error
  }
}

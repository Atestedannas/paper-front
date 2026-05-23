import request from '@/utils/request'

export default {
  // ==================== 服务定价管理 ====================

  // 获取所有服务定价
  getServicePricings() {
    return request({
      url: '/api/v1/admin/billing/services',
      method: 'get'
    })
  },

  // 获取单个服务定价
  getServicePricing(type) {
    return request({
      url: `/api/v1/admin/billing/services/${type}`,
      method: 'get'
    })
  },

  // 创建服务定价
  createServicePricing(data) {
    return request({
      url: '/api/v1/admin/billing/services',
      method: 'post',
      data
    })
  },

  // 更新服务定价
  updateServicePricing(id, data) {
    return request({
      url: `/api/v1/admin/billing/services/${id}`,
      method: 'put',
      data
    })
  },

  // 删除服务定价
  deleteServicePricing(id) {
    return request({
      url: `/api/v1/admin/billing/services/${id}`,
      method: 'delete'
    })
  },

  // 启用/禁用服务
  toggleServicePricing(id, enabled) {
    return request({
      url: `/api/v1/admin/billing/services/${id}/toggle`,
      method: 'put',
      data: { enabled }
    })
  },

  // 设置服务是否免费
  setServiceFree(id, isFree) {
    return request({
      url: `/api/v1/admin/billing/services/${id}/free`,
      method: 'put',
      data: { is_free: isFree }
    })
  },

  // ==================== 套餐管理 ====================

  // 获取所有套餐
  getPlans(params) {
    return request({
      url: '/api/v1/admin/billing/plans',
      method: 'get',
      params
    })
  },

  // 获取单个套餐
  getPlan(id) {
    return request({
      url: `/api/v1/admin/billing/plans/${id}`,
      method: 'get'
    })
  },

  // 创建套餐
  createPlan(data) {
    return request({
      url: '/api/v1/admin/billing/plans',
      method: 'post',
      data
    })
  },

  // 更新套餐
  updatePlan(id, data) {
    return request({
      url: `/api/v1/admin/billing/plans/${id}`,
      method: 'put',
      data
    })
  },

  // 删除套餐
  deletePlan(id) {
    return request({
      url: `/api/v1/admin/billing/plans/${id}`,
      method: 'delete'
    })
  },

  // ==================== 公开接口 ====================

  // 获取完整的服务配置（公开）
  getServiceConfig() {
    return request({
      url: '/api/v1/config/public/billing',
      method: 'get'
    })
  },

  // 检查服务定价（公开）
  checkServicePricing(serviceType) {
    return request({
      url: '/api/v1/config/public/billing/check',
      method: 'get',
      params: { service_type: serviceType }
    })
  }
}

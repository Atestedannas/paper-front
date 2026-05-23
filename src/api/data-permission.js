import request from '@/utils/request'

export default {
  getUserDataScope(userId) {
    return request({
      url: `/api/v1/admin/users/${userId}/data-scope`,
      method: 'get'
    })
  },
  
  setUserDataScope(userId, scope) {
    return request({
      url: `/api/v1/admin/users/${userId}/data-scope`,
      method: 'put',
      data: { scope }
    })
  },
  
  getUserDataFilter(userId, resourceType) {
    return request({
      url: `/api/v1/admin/users/${userId}/data-filter`,
      method: 'get',
      params: { resource_type: resourceType }
    })
  },
  
  getDataRules(resourceType) {
    return request({
      url: '/api/v1/admin/data-rules',
      method: 'get',
      params: { resource_type: resourceType }
    })
  },
  
  getDataRuleByID(id) {
    return request({
      url: `/api/v1/admin/data-rules/${id}`,
      method: 'get'
    })
  },
  
  createDataRule(data) {
    return request({
      url: '/api/v1/admin/data-rules',
      method: 'post',
      data
    })
  },
  
  updateDataRule(id, data) {
    return request({
      url: `/api/v1/admin/data-rules/${id}`,
      method: 'put',
      data
    })
  },
  
  deleteDataRule(id) {
    return request({
      url: `/api/v1/admin/data-rules/${id}`,
      method: 'delete'
    })
  },
  
  getUserFieldPermissions(userId, resourceType) {
    return request({
      url: `/api/v1/admin/users/${userId}/field-permissions`,
      method: 'get',
      params: { resource_type: resourceType }
    })
  },
  
  checkDataAccess(userId, resourceType) {
    return request({
      url: '/api/v1/admin/data-rules/check-access',
      method: 'get',
      params: { user_id: userId, resource_type: resourceType }
    })
  }
}

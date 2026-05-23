import request from '../utils/request'

// 获取高校列表
export const getUniversities = (params = {}) => {
  return request({
    url: '/api/v1/admin/universities',
    method: 'GET',
    params
  })
}

// 获取高校详情
export const getUniversityById = (id) => {
  return request({
    url: `/api/v1/admin/universities/${id}`,
    method: 'GET'
  })
}

// 创建高校
export const createUniversity = (data) => {
  return request({
    url: '/api/v1/admin/universities',
    method: 'POST',
    data
  })
}

// 更新高校
export const updateUniversity = (id, data) => {
  return request({
    url: `/api/v1/admin/universities/${id}`,
    method: 'PUT',
    data
  })
}

// 删除高校
export const deleteUniversity = (id) => {
  return request({
    url: `/api/v1/admin/universities/${id}`,
    method: 'DELETE'
  })
}

// 批量更新高校
export const batchUpdateUniversities = (data) => {
  return request({
    url: '/api/v1/admin/universities',
    method: 'PUT',
    data
  })
}

// 解析模板
export const parseTemplate = (formData) => {
  return request({
    url: '/api/v1/admin/universities/parse-template',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
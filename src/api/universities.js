import request from '../utils/request'

export const listUniversities = (params = {}) => {
  return request({
    url: '/api/v1/universities',
    method: 'GET',
    params
  })
}

export const getUniversityTags = () => {
  return request({
    url: '/api/v1/universities/tags',
    method: 'GET'
  })
}

export const getUniversityDetail = (id) => {
  return request({
    url: `/api/v1/universities/${id}`,
    method: 'GET'
  })
}

export const importUniversityTemplate = (formData) => {
  return request({
    url: '/api/v1/universities/templates/import',
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

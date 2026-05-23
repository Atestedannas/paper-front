import request from '../utils/request'

export const listTemplates = (params = {}) => {
  return request({
    url: '/api/v1/admin/templates',
    method: 'GET',
    params
  })
}

export const getTemplateDetail = (templateId) => {
  return request({
    url: `/api/v1/admin/templates/${templateId}`,
    method: 'GET'
  })
}

export const toggleTemplate = (templateId, enabled) => {
  return request({
    url: `/api/v1/admin/templates/${templateId}/toggle`,
    method: 'PUT',
    data: { enabled }
  })
}

export const listTemplateVersions = (templateId) => {
  return request({
    url: `/api/v1/admin/templates/${templateId}/versions`,
    method: 'GET'
  })
}

export const promoteTemplateVersion = (templateId, versionId) => {
  return request({
    url: `/api/v1/admin/templates/${templateId}/versions/${versionId}/promote`,
    method: 'POST'
  })
}

export const importTemplateDocx = (formData) => {
  return request({
    url: '/api/v1/templates/import',
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const createTemplate = (payload) => {
  return request({
    url: '/api/v1/admin/templates',
    method: 'POST',
    data: payload
  })
}

export const updateTemplate = (id, payload) => {
  return request({
    url: `/api/v1/admin/templates/${id}`,
    method: 'PUT',
    data: payload
  })
}

export const deleteTemplate = (id) => {
  return request({
    url: `/api/v1/admin/templates/${id}`,
    method: 'DELETE'
  })
}

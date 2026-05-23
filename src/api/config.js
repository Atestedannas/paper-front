/**
 * 系统配置相关API
 */

import request from '@/utils/request'

/**
 * 获取系统配置
 */
export const getSystemConfig = () => {
  return request({
    url: '/api/v1/auth/config/system',
    method: 'GET'
  })
}

/**
 * 获取论文格式检查配置
 */
export const getPaperCheckConfig = () => {
  return request({
    url: '/api/v1/auth/config/paper-check',
    method: 'GET'
  })
}

/**
 * 公开获取论文格式检查配置（不需要认证）
 */
export const getPaperCheckConfigPublic = () => {
  return request({
    url: '/api/config/public/paper-check',
    method: 'GET'
  })
}

/**
 * 获取联系信息（不需要认证）
 */
export const getContactInfo = () => {
  return request({
    url: '/api/config/public/contact',
    method: 'GET'
  })
}
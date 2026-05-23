import request from '@/utils/request'

export default {
  createPackage(data) {
    return request({
      url: '/api/v1/admin/permission-packages',
      method: 'post',
      data
    })
  },
  
  getPackages(params) {
    return request({
      url: '/api/v1/admin/permission-packages',
      method: 'get',
      params
    })
  },
  
  getPackageByID(id) {
    return request({
      url: `/api/v1/admin/permission-packages/${id}`,
      method: 'get'
    })
  },
  
  updatePackage(id, data) {
    return request({
      url: `/api/v1/admin/permission-packages/${id}`,
      method: 'put',
      data
    })
  },
  
  deletePackage(id) {
    return request({
      url: `/api/v1/admin/permission-packages/${id}`,
      method: 'delete'
    })
  },
  
  getPackagePermissions(id) {
    return request({
      url: `/api/v1/admin/permission-packages/${id}/permissions`,
      method: 'get'
    })
  },
  
  addPackagePermissions(id, permissionIds) {
    return request({
      url: `/api/v1/admin/permission-packages/${id}/permissions`,
      method: 'post',
      data: { permission_ids: permissionIds }
    })
  },
  
  removePackagePermissions(id, permissionIds) {
    return request({
      url: `/api/v1/admin/permission-packages/${id}/permissions`,
      method: 'delete',
      data: { permission_ids: permissionIds }
    })
  },
  
  assignPackageToRole(packageId, roleId) {
    return request({
      url: `/api/v1/admin/permission-packages/${packageId}/assign/${roleId}`,
      method: 'post'
    })
  },
  
  getRolePackages(roleId) {
    return request({
      url: `/api/v1/admin/permission-packages/roles/${roleId}/packages`,
      method: 'get'
    })
  },
  
  clonePackage(id, newCode) {
    return request({
      url: `/api/v1/admin/permission-packages/${id}/clone`,
      method: 'post',
      data: { new_code: newCode }
    })
  }
}

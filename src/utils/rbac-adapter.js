// RBAC compatibility adapter:
// prefer `meta.permission`, fallback to legacy `meta.authorities`.
export const getRouteRequiredPermissions = (meta = {}) => {
  if (!meta || typeof meta !== 'object') return null
  return meta.permission || meta.authorities || null
}


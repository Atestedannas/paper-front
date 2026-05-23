const STORAGE_KEY = 'role_route_mapping_v1'

export const getRoleRouteMapping = () => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export const getRoutesByRoleCode = (roleCode) => {
  const mapping = getRoleRouteMapping()
  const list = mapping?.[roleCode]
  return Array.isArray(list) ? list.filter(Boolean) : []
}

export const setRoutesByRoleCode = (roleCode, routeNames = []) => {
  if (!roleCode || typeof window === 'undefined') return

  const mapping = getRoleRouteMapping()
  mapping[roleCode] = Array.from(new Set(routeNames.filter(Boolean)))
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping))
  window.dispatchEvent(new CustomEvent('role-route-mapping-updated'))
}

export const getMergedRoutesByRoleCodes = (roleCodes = []) => {
  const mapping = getRoleRouteMapping()
  const merged = new Set()

  for (const code of roleCodes) {
    const list = mapping?.[code]
    if (Array.isArray(list)) {
      list.forEach((name) => {
        if (name) merged.add(name)
      })
    }
  }

  return Array.from(merged)
}
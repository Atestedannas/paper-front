/**
 * 头像 URL 安全处理：blob URL 在刷新/关闭后失效，不能用于持久展示
 * @param {string} url - 可能是 blob: 或 服务端 URL
 * @returns {string|undefined} 仅当为有效可访问 URL 时返回，否则 undefined（组件会显示首字母）
 */
export function resolveAvatarUrl(url) {
  if (!url || typeof url !== 'string') return undefined
  if (url.startsWith('blob:')) return undefined
  return url
}

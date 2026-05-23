// RBAC 路由守卫单轨方案：
// 统一使用 router/index.js 中的 beforeEach 作为唯一入口。
// 本文件保留为空兼容模块，避免被误引入时重复注册守卫。
import router from './index'

export default router

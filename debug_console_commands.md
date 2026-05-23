# 浏览器控制台调试命令

## 请在浏览器控制台（F12）中依次执行以下命令：

### 1. 查看当前路由
```javascript
console.log('所有路由:', window.$router.getRoutes())
console.log('Admin 路由:', window.$router.getRoutes().filter(r => r.path && r.path.startsWith('/admin/')))
```

### 2. 查看 Store 状态
```javascript
console.log('User Store:', window.$pinia.state.value.user)
console.log('Permission Store:', window.$pinia.state.value.permission)
```

### 3. 查看菜单路由
```javascript
// 在 AdminLayout 页面按 F12 执行
const routes = window.$router.getRoutes().filter(r => {
  return r.path && r.path.startsWith('/admin/') && r.meta && r.meta.menu
})
console.log('菜单路由:', routes)
console.log('菜单路由数量:', routes.length)
routes.forEach((r, i) => {
  console.log(`${i+1}. ${r.path} - ${r.meta.title} (group: ${r.meta.menuGroup || 'root'}, order: ${r.meta.menuOrder || 0})`)
})
```

### 4. 检查权限
```javascript
const user = window.$pinia.state.value.user
console.log('用户权限:', user.permissions)
console.log('用户角色:', user.roles)
```

### 5. 如果使用了动态路由
```javascript
const perm = window.$pinia.state.value.permission
console.log('动态菜单:', perm.menus)
console.log('动态路由:', perm.addRoutes)
```

## 请将以上命令的输出结果截图或复制给我！

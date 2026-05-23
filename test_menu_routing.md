# 测试 RBAC 菜单功能

## 测试步骤

### 1. 检查后端 API

```bash
cd d:\workpace\博客\paper\backend
```

测试获取菜单树 API：

```bash
# 先登录获取 token
curl -X POST http://localhost:8002/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"2673078804@qq.com\",\"password\":\"your_password\"}"
```

然后使用返回的 token 测试菜单 API：

```bash
curl -X GET http://localhost:8002/api/admin/menus/tree ^
  -H "Authorization: Bearer <token>"
```

### 2. 检查前端控制台日志

打开浏览器控制台（F12），登录后应该看到：

```
API 完整响应：{...}
response.data: [...]
菜单树数据：[...]
生成的路由：[...]
```

### 3. 检查路由是否添加成功

在浏览器控制台执行：

```javascript
// 查看所有路由
console.log(router.getRoutes())

// 查看 admin 相关路由
console.log(router.getRoutes().filter(r => r.path.startsWith('/admin/')))
```

### 4. 检查 permission store

在浏览器控制台执行：

```javascript
// 查看 permission store
console.log(window.$pinia.state.value.permission)
```

## 常见问题排查

### 问题 1：菜单没有完全显示
- 检查 `response.data` 是否有 7 个菜单
- 检查 `生成的路由` 数组是否有 7 个路由
- 检查每个路由的 `meta.menu` 是否为 `true`

### 问题 2：路由添加了但菜单没显示
- 检查 AdminLayout 中的 `menuRoutes` computed 是否正确
- 检查 `canAccessRouteByStore` 函数是否过滤了路由

### 问题 3：权限验证失败
- 检查 userStore.permissions 是否有值
- 检查 userStore.roles 是否有值

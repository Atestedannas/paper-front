# 前端 RBAC 权限管理设计方案（基于 gin-vue-admin 理念）

## 一、核心设计理念

### 1.1 设计原则

**菜单即权限** - 菜单和路由一一对应，分配菜单就是分配页面访问权限

**动态路由** - 登录后根据用户角色动态生成可访问的路由

**按钮级控制** - 页面内的按钮通过权限标识（authority）控制显示/隐藏

**简化模型** - 角色 → 菜单 → 页面权限，不需要复杂的权限表

### 1.2 权限模型

```
用户 (User) → 角色 (Role) → 菜单 (Menu) → 页面权限
                              ↓
                        按钮权限 (Authority)
```

## 二、后端设计

### 2.1 菜单表结构增强

```go
type Menu struct {
    ID            uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
    ParentID      *uuid.UUID `gorm:"type:uuid" json:"parent_id"`
    Name          string     `gorm:"size:50" json:"name"`           // 菜单名称（英文）
    Title         string     `gorm:"size:100" json:"title"`         // 显示标题（中文）
    Icon          string     `gorm:"size:50" json:"icon"`           // 菜单图标
    Path          string     `gorm:"size:255" json:"path"`          // 路由路径
    Component     string     `gorm:"size:255" json:"component"`     // Vue 组件路径
    Redirect      string     `gorm:"size:255" json:"redirect"`      // 重定向路径
    Meta          MenuMeta   `gorm:"type:jsonb" json:"meta"`        // 路由元信息
    SortOrder     int        `gorm:"default:0" json:"sort_order"`   // 排序
    MenuType      string     `gorm:"size:20;default:'menu'" json:"menu_type"` // menu/button/catalog
    Permission    string     `gorm:"size:100" json:"permission"`    // 权限标识
    KeepAlive     bool       `gorm:"default:false" json:"keep_alive"` // 是否缓存
    Visible       bool       `gorm:"default:true" json:"visible"`   // 是否可见
    Roles         []Role     `gorm:"many2many:role_menus;" json:"roles"`
}

type MenuMeta struct {
    Title       string `json:"title"`        // 页面标题
    Icon        string `json:"icon"`         // 页面图标
    NoCache     bool   `json:"noCache"`      // 是否缓存
    Breadcrumb  bool   `json:"breadcrumb"`   // 是否在面包屑导航
    Affix       bool   `json:"affix"`        // 是否固定在 TagsView
    ActiveMenu  string `json:"activeMenu"`   // 激活的菜单
    CanTo       bool   `json:"canTo"`        // 是否可以跳转
}
```

### 2.2 简化权限模型

**不再使用复杂的 authority 表**，菜单的 permission 字段就是权限标识。

角色只需要关联菜单，不需要单独关联权限：

```go
type Role struct {
    ID     uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
    Name   string    `gorm:"size:50;uniqueIndex" json:"name"`
    Code   string    `gorm:"size:50;uniqueIndex" json:"code"`
    Menus  []Menu    `gorm:"many2many:role_menus;" json:"menus"` // 只关联菜单
}
```

### 2.3 核心 API

#### 获取用户菜单
```
GET /api/v1/admin/menus/user
Authorization: Bearer <token>

Response:
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "name": "dashboard",
      "title": "控制台",
      "icon": "DataAnalysis",
      "path": "/admin/dashboard",
      "component": "admin/AdminDashboardView.vue",
      "redirect": "",
      "meta": {
        "title": "控制台",
        "icon": "DataAnalysis",
        "noCache": false
      },
      "children": [...]
    }
  ]
}
```

#### 为角色分配菜单
```
POST /api/v1/admin/roles/:id/menus
Authorization: Bearer <token>
Content-Type: application/json

{
  "menu_ids": ["uuid1", "uuid2", "uuid3"]
}
```

#### 获取角色菜单
```
GET /api/v1/admin/roles/:id/menus
Authorization: Bearer <token>

Response:
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "name": "dashboard",
      "title": "控制台",
      "path": "/admin/dashboard",
      ...
    }
  ]
}
```

## 三、前端设计

### 3.1 权限管理 Store

```javascript
// stores/permission.js
import { defineStore } from 'pinia'
import { constantRoutes } from '@/router'
import { getMenuTree } from '@/api/admin'

const modules = import.meta.glob('../../views/**/**.vue')

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    menus: [],           // 用户菜单
    routes: [],          // 动态路由
    addRoutes: [],       // 添加的路由
    permissionLoaded: false
  }),
  
  actions: {
    // 生成路由
    async generateRoutes() {
      return new Promise(async (resolve) => {
        // 获取用户菜单
        const { data: menuTree } = await getMenuTree()
        this.menus = menuTree
        
        // 将菜单转换为路由
        const accessedRoutes = filterAsyncRoutes(menuTree)
        
        this.addRoutes = accessedRoutes
        this.routes = constantRoutes.concat(accessedRoutes)
        this.permissionLoaded = true
        
        resolve(accessedRoutes)
      })
    },
    
    // 设置菜单
    setMenus(menus) {
      this.menus = menus
    }
  }
})

// 动态路由生成
function filterAsyncRoutes(routes) {
  const res = []
  
  routes.forEach(route => {
    const tmp = { ...route }
    
    // 转换 component 路径
    if (tmp.component) {
      tmp.component = loadView(tmp.component)
    }
    
    // 递归处理子路由
    if (tmp.children && tmp.children.length) {
      tmp.children = filterAsyncRoutes(tmp.children)
    }
    
    // 构建路由配置
    const routeConfig = {
      path: tmp.path,
      name: tmp.name,
      component: tmp.component,
      meta: tmp.meta,
      redirect: tmp.redirect,
      children: tmp.children
    }
    
    res.push(routeConfig)
  })
  
  return res
}

function loadView(view) {
  if (view.startsWith('admin/')) {
    return modules[`../../views/admin/${view.replace('admin/', '')}`]
  }
  return modules[`../../views/${view}`]
}

export default usePermissionStore
```

### 3.2 路由守卫

```javascript
// router/permission.js
import router from './index'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/auth-redirect', '/bind', '/register']

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  
  // 判断是否登录
  if (userStore.token) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      // 检查是否已获取用户信息
      if (!userStore.name) {
        try {
          // 获取用户信息
          await userStore.getInfo()
          
          // 生成动态路由
          const accessRoutes = await permissionStore.generateRoutes()
          
          // 添加路由
          accessRoutes.forEach(route => {
            router.addRoute(route)
          })
          
          // 确保添加路由已完成
          next({ ...to, replace: true })
        } catch (error) {
          // 清除 token 并跳转登录页
          await userStore.resetToken()
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      } else {
        next()
      }
    }
  } else {
    // 未登录
    if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
```

### 3.3 菜单组件

```vue
<!-- components/Sidebar/index.vue -->
<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="isCollapse"
    :background-color="variables['menu-bg']"
    :text-color="variables['menu-text']"
    :active-text-color="variables['menu-active-text']"
    mode="vertical"
  >
    <sidebar-item
      v-for="route in permissionStore.menus"
      :key="route.path"
      :item="route"
      :base-path="route.path"
    />
  </el-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import SidebarItem from './SidebarItem.vue'
import variables from '@/styles/variables.module.scss'

const route = useRoute()
const permissionStore = usePermissionStore()

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

const isCollapse = computed(() => !sidebarStore.sidebar.opened)
</script>
```

### 3.4 权限指令

```javascript
// directives/permission.js
import { useUserStore } from '@/stores/user'

export const permission = {
  mounted(el, binding) {
    const { value } = binding
    const userStore = useUserStore()
    const permissions = userStore.permissions || []
    const roles = userStore.roles || []
    
    if (value && value instanceof Array && value.length > 0) {
      // 检查是否有权限
      const hasPermission = permissions.some(perm => value.includes(perm))
      
      if (!hasPermission) {
        // 移除元素
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error('请设置权限标签值，例如 v-permission="[\'admin\']"')
    }
  }
}

export const role = {
  mounted(el, binding) {
    const { value } = binding
    const userStore = useUserStore()
    const roles = userStore.roles || []
    
    if (value && value instanceof Array && value.length > 0) {
      const hasRole = roles.some(role => value.includes(role))
      
      if (!hasRole) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error('请设置角色标签值')
    }
  }
}
```

### 3.5 使用示例

#### 按钮级权限控制

```vue
<template>
  <div>
    <!-- 使用 v-permission 指令 -->
    <el-button v-permission="['admin']" type="primary">
      管理员可见按钮
    </el-button>
    
    <el-button v-permission="['user:create']" type="success">
      创建用户按钮
    </el-button>
    
    <!-- 使用 v-role 指令 -->
    <el-button v-role="['super_admin', 'admin']" type="danger">
      超级管理员和管理员可见
    </el-button>
    
    <!-- 使用 hasPermission 函数 -->
    <el-button v-if="hasPermission('user:delete')" type="danger">
      删除用户按钮
    </el-button>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const hasPermission = (permission) => {
  return userStore.permissions.includes(permission)
}
</script>
```

## 四、角色菜单管理页面

### 4.1 角色管理页面

```vue
<!-- views/admin/RoleManagementView.vue -->
<template>
  <div class="role-management">
    <el-card>
      <!-- 角色列表 -->
      <el-table :data="roles" border>
        <el-table-column prop="name" label="角色名称" />
        <el-table-column prop="code" label="角色代码" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button @click="handleAssignMenus(row)">
              分配菜单
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 分配菜单对话框 -->
    <el-dialog v-model="dialogVisible" title="分配菜单">
      <el-tree
        ref="menuTreeRef"
        :data="menuTree"
        :props="{ children: 'children', label: 'title' }"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedMenuIds"
      />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRoles, getRoleMenus, assignMenusToRole } from '@/api/admin'
import { getMenuTree } from '@/api/admin'

const roles = ref([])
const menuTree = ref([])
const dialogVisible = ref(false)
const currentRoleId = ref(null)
const checkedMenuIds = ref([])
const menuTreeRef = ref(null)

onMounted(() => {
  loadRoles()
  loadMenuTree()
})

const loadRoles = async () => {
  const { data } = await getRoles()
  roles.value = data
}

const loadMenuTree = async () => {
  const { data } = await getMenuTree()
  menuTree.value = data
}

const handleAssignMenus = async (role) => {
  currentRoleId.value = role.id
  dialogVisible.value = true
  
  // 获取角色已分配的菜单
  const { data } = await getRoleMenus(role.id)
  checkedMenuIds.value = data.map(menu => menu.id)
}

const handleConfirm = async () => {
  const checkedKeys = menuTreeRef.value.getCheckedKeys()
  const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys()
  
  // 合并全选和半选的节点
  const menuIds = [...checkedKeys, ...halfCheckedKeys]
  
  await assignMenusToRole(currentRoleId.value, { menu_ids: menuIds })
  
  ElMessage.success('分配成功')
  dialogVisible.value = false
}
</script>
```

## 五、菜单管理页面

### 5.1 菜单管理

```vue
<!-- views/admin/MenuManagementView.vue -->
<template>
  <div class="menu-management">
    <el-card>
      <el-button type="primary" @click="handleCreate">
        新增菜单
      </el-button>
      
      <el-table :data="menuTree" row-key="id" default-expand-all>
        <el-table-column prop="title" label="菜单名称" />
        <el-table-column prop="icon" label="图标" />
        <el-table-column prop="path" label="路由路径" />
        <el-table-column prop="component" label="组件路径" />
        <el-table-column prop="permission" label="权限标识" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
```

## 六、实施步骤

### 6.1 后端实施

1. **简化数据模型** - 移除复杂的 authority 表，只保留 menu 表
2. **更新角色 - 菜单关联** - 角色只关联菜单，不关联权限
3. **提供菜单 API** - 获取用户菜单、分配菜单给角色
4. **Casbin 策略简化** - 只用于 API 权限验证，不用于页面权限

### 6.2 前端实施

1. **创建 permission store** - 管理菜单和路由
2. **实现路由守卫** - 动态添加路由
3. **创建菜单组件** - 根据菜单树生成侧边栏
4. **实现权限指令** - v-permission, v-role
5. **开发管理页面** - 角色菜单分配、菜单管理

### 6.3 权限配置流程

1. **创建角色** - 在角色管理页面创建角色
2. **配置菜单** - 在菜单管理页面配置所有可用菜单
3. **分配菜单** - 为角色分配可访问的菜单
4. **分配角色** - 为用户分配角色
5. **登录验证** - 用户登录后自动获取菜单和路由

## 七、总结

这种设计的优势：

✅ **简单直观** - 菜单即权限，容易理解和管理
✅ **灵活配置** - 动态路由，无需硬编码
✅ **按钮级控制** - 页面内按钮也可精确控制
✅ **用户体验好** - 用户只能看到有权限的菜单
✅ **安全性高** - 前端路由 + 后端 API 双重验证

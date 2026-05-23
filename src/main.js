import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import './assets/modern-theme.css'
import './assets/glass-theme.css'
import App from './App.vue'
import router from './router'
import { permission, role } from './directives/permission'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.directive('permission', permission)
app.directive('role', role)

app.mount('#app')

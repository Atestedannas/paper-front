<template>
  <div class="tags-view">
    <div class="tags-scroll">
      <div
        v-for="tag in tags"
        :key="tag.path"
        class="tag-item"
        :class="{ active: tag.path === route.path }"
        @click="go(tag.path)"
      >
        <span class="tag-title">{{ tag.title }}</span>
        <el-icon class="close" @click.stop="close(tag.path)"><Close /></el-icon>
      </div>
    </div>
    <div class="tags-ops">
      <el-dropdown @command="handleCommand">
        <span class="ops-btn">
          <el-icon><Operation /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="closeOther">关闭其他</el-dropdown-item>
            <el-dropdown-item command="closeAll">关闭全部</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Close, Operation } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const tags = ref([])

const getTitle = (r) => r.meta?.title || r.name || r.path

const addTag = (r) => {
  if (!r.path.startsWith('/admin')) return
  if (!tags.value.find(t => t.path === r.path)) {
    tags.value.push({ path: r.path, title: getTitle(r) })
  } else {
    // 同步标题
    const t = tags.value.find(t => t.path === r.path)
    if (t) t.title = getTitle(r)
  }
}

watch(
  () => route.path,
  () => addTag(route),
  { immediate: true }
)

const go = (path) => router.push(path)

const close = (path) => {
  const idx = tags.value.findIndex(t => t.path === path)
  if (idx !== -1) {
    tags.value.splice(idx, 1)
    // 若关闭当前，跳到最后一个或 /admin/dashboard
    if (route.path === path) {
      const last = tags.value[tags.value.length - 1]
      router.push(last ? last.path : '/admin/dashboard')
    }
  }
}

const handleCommand = (command) => {
  if (command === 'closeAll') {
    // 保留 Dashboard 如果有的话，或者清空并跳转 Dashboard
    tags.value = []
    router.push('/admin/dashboard')
  } else if (command === 'closeOther') {
    const current = tags.value.find(t => t.path === route.path)
    if (current) {
      tags.value = [current]
    } else {
      // 如果当前路由不在 tags 中（理论上不可能），则不处理或清空
    }
  }
}
</script>

<style scoped>
.tags-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  height: var(--tags-height);
  border-bottom: 1px solid rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.5);
  backdrop-filter: blur(10px);
}
.tags-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  flex: 1;
  /* 隐藏滚动条 */
  scrollbar-width: none; 
}
.tags-scroll::-webkit-scrollbar {
  display: none;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid rgba(255,255,255,0.7);
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.5));
  color: #475569;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(59,130,246,0.08);
  transition: all 0.2s ease;
  white-space: nowrap;
}
.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(59,130,246,0.12);
}
.tag-item.active {
  border-color: rgba(59,130,246,0.4);
  color: #1e293b;
  background: linear-gradient(135deg, rgba(147,197,253,0.35), rgba(167,243,208,0.35));
  box-shadow: 0 10px 24px rgba(59,130,246,0.18);
}
.tag-title {
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.close {
  color: #6b7280;
  border-radius: 50%;
  padding: 1px;
}
.close:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.tags-ops {
  margin-left: 10px;
  display: flex;
  align-items: center;
}
.ops-btn {
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}
.ops-btn:hover {
  background: rgba(0,0,0,0.05);
  color: #1e293b;
}
</style>

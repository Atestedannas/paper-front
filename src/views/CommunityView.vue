<template>
  <div class="community-page">
    <div class="container">
      <!-- 顶部 -->
      <div class="top-bar">
        <div>
          <h1 class="page-title">交流社区</h1>
          <p class="page-desc">分享经验、提出问题、互助解答</p>
        </div>
        <el-button v-if="isLoggedIn" type="primary" round @click="openCreate">
          <el-icon><EditPen /></el-icon>&nbsp;发布帖子
        </el-button>
        <el-button v-else round @click="$router.push('/login')">登录后发帖</el-button>
      </div>

      <!-- 帖子列表 -->
      <div v-loading="loading" class="list-wrap">
        <el-empty v-if="!posts.length && !loading" description="暂无帖子，来发第一篇吧" />

        <router-link
          v-for="post in posts" :key="post.id"
          :to="`/community/${post.id}`"
          class="post-card"
        >
          <!-- 左侧缩略图 -->
          <img v-if="firstImg(post.content)" :src="firstImg(post.content)" class="card-thumb" />

          <div class="card-body">
            <h3 class="card-title">{{ post.title }}</h3>
            <p class="card-snippet">{{ plainText(post.content, 100) }}</p>
            <div class="card-meta">
              <el-avatar :size="22" :src="post.avatar || undefined">{{ post.username?.[0] }}</el-avatar>
              <span class="meta-author">{{ post.username }}</span>
              <span class="meta-dot">·</span>
              <span class="meta-time">{{ ago(post.created_at) }}</span>
              <span class="meta-gap"></span>
              <span class="meta-stat"><el-icon><ChatDotRound /></el-icon>{{ post.reply_count || 0 }}</span>
              <span class="meta-stat"><el-icon><View /></el-icon>{{ post.view_count || 0 }}</span>
            </div>
          </div>
        </router-link>
      </div>

      <!-- 分页 -->
      <div class="pager" v-if="total > pageSize">
        <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize"
          v-model:current-page="currentPage" @current-change="fetchPosts" />
      </div>
    </div>

    <!-- 发帖弹窗 -->
    <el-dialog v-model="showCreate" title="发布帖子" width="700px" destroy-on-close :close-on-click-modal="false" @closed="onCreateClosed">
      <el-form :model="form" ref="formRef" label-position="top">
        <el-form-item label="标题" prop="title" :rules="[{required:true,message:'请输入标题',trigger:'blur'}]">
          <el-input v-model="form.title" placeholder="帖子标题" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" prop="content" :rules="[{required:true,message:'请输入内容',trigger:'blur'}]">
          <div class="editor-wrap">
            <Toolbar :editor="editorRef" :defaultConfig="tbCfg" mode="simple" />
            <Editor v-model="form.content" :defaultConfig="edCfg" mode="simple"
              @onCreated="e => editorRef = e" style="height:300px;overflow-y:auto;" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="posting" @click="submitPost">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, shallowRef, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { EditPen, ChatDotRound, View } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import tokenManager from '@/utils/tokenManager'

import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

const router = useRouter()
const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)

// ── list ──
const loading = ref(false)
const posts = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 15

async function fetchPosts() {
  loading.value = true
  try {
    const r = await request({ url: '/api/v1/cms/posts', params: { page: currentPage.value, page_size: pageSize } })
    posts.value = r?.items || []
    total.value = r?.total || 0
  } catch { /* */ } finally { loading.value = false }
}

// ── helpers ──
function plainText(html, max) {
  if (!html) return ''
  const d = document.createElement('div'); d.innerHTML = html
  const t = (d.textContent || '').trim()
  return t.length > max ? t.slice(0, max) + '…' : t
}
function firstImg(html) {
  if (!html) return ''
  const m = html.match(/<img[^>]+src="([^"]+)"/)
  return m ? m[1] : ''
}
function ago(t) {
  if (!t) return ''
  const s = (Date.now() - new Date(t)) / 1000
  if (s < 60) return '刚刚'
  if (s < 3600) return `${Math.floor(s/60)}分钟前`
  if (s < 86400) return `${Math.floor(s/3600)}小时前`
  if (s < 2592000) return `${Math.floor(s/86400)}天前`
  return new Date(t).toLocaleDateString('zh-CN')
}

// ── create post ──
const showCreate = ref(false)
const posting = ref(false)
const formRef = ref()
const form = ref({ title: '', content: '' })
const editorRef = shallowRef(null)

function uploadHeaders() {
  const h = tokenManager.getAuthorizationHeader()
  return h ? { Authorization: h } : {}
}
const uploadImgMenu = {
  server: '/api/v1/upload/image',
  fieldName: 'file',
  maxFileSize: 5 * 1024 * 1024,
  allowedFileTypes: ['image/*'],
  headers: uploadHeaders(),
  customInsert(res, insertFn) {
    const url = res?.data?.url
    if (url) insertFn(url, '', '')
    else ElMessage.error('图片上传失败')
  }
}
const tbCfg = { excludeKeys: ['fullScreen', 'group-video'] }
const edCfg = { placeholder: '写下你想分享的内容...', MENU_CONF: { uploadImage: uploadImgMenu } }

function openCreate() {
  uploadImgMenu.headers = uploadHeaders()
  showCreate.value = true
}
function onCreateClosed() {
  if (editorRef.value) { editorRef.value.destroy(); editorRef.value = null }
  form.value = { title: '', content: '' }
}
async function submitPost() {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  if (!editorRef.value?.getText()?.trim()) { ElMessage.warning('内容不能为空'); return }
  posting.value = true
  try {
    const created = await request({ url: '/api/v1/cms/posts', method: 'POST', data: form.value })
    ElMessage.success('发布成功')
    showCreate.value = false
    if (created?.id) router.push(`/community/${created.id}`)
    else { currentPage.value = 1; await fetchPosts() }
  } catch { ElMessage.error('发布失败') } finally { posting.value = false }
}

onMounted(fetchPosts)
onBeforeUnmount(() => { if (editorRef.value) editorRef.value.destroy() })
</script>

<style scoped>
.community-page { min-height: calc(100vh - 64px); background: transparent; }
.container { max-width: 860px; margin: 0 auto; padding: 36px 20px 60px; }

.top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-title { font-size: 1.7rem; font-weight: 700; color: #1e293b; margin: 0 0 2px; }
.page-desc { color: #94a3b8; font-size: .88rem; margin: 0; }

/* ── Card ── */
.post-card {
  display: flex; gap: 16px; align-items: flex-start;
  background: #fff; border-radius: 12px; padding: 18px 20px;
  margin-bottom: 12px; text-decoration: none; color: inherit;
  border: 1px solid #f1f5f9; transition: all .2s;
}
.post-card:hover {
  border-color: #c7d2fe; box-shadow: 0 4px 16px rgba(99,102,241,.08);
}
.card-thumb {
  width: 120px; height: 80px; object-fit: cover; border-radius: 8px;
  flex-shrink: 0; background: #f1f5f9;
}
.card-body { flex: 1; min-width: 0; }
.card-title {
  font-size: 1.05rem; font-weight: 700; color: #1e293b;
  margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.card-snippet {
  font-size: .85rem; color: #64748b; line-height: 1.5; margin: 0 0 10px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.card-meta {
  display: flex; align-items: center; gap: 6px; font-size: .78rem; color: #94a3b8;
}
.meta-author { font-weight: 600; color: #64748b; }
.meta-dot { color: #cbd5e1; }
.meta-gap { flex: 1; }
.meta-stat { display: flex; align-items: center; gap: 3px; }

/* ── Pager ── */
.pager { display: flex; justify-content: center; margin-top: 20px; }

/* ── Editor ── */
.editor-wrap { border: 1px solid #dcdfe6; border-radius: 8px; overflow: hidden; }
.editor-wrap :deep(.w-e-toolbar) { border-bottom: 1px solid #e4e7ed; }
</style>

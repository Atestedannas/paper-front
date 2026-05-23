<template>
  <div class="post-page">
    <div class="container" v-loading="loading">
      <!-- 返回 -->
      <div class="back-row">
        <el-button link @click="$router.push('/community')">
          <el-icon><ArrowLeft /></el-icon> 返回社区
        </el-button>
      </div>

      <template v-if="post">
        <!-- ====== 正文卡片 ====== -->
        <div class="main-card">
          <h1 class="post-title">{{ post.title }}</h1>
          <div class="author-row">
            <el-avatar :size="36" :src="post.avatar || undefined">{{ post.username?.[0] }}</el-avatar>
            <div class="author-info">
              <span class="author-name">{{ post.username }}</span>
              <span class="author-time">{{ formatDate(post.created_at) }} · {{ post.view_count }} 次浏览</span>
            </div>
            <el-button v-if="canDel(post)" type="danger" text size="small" @click="delPost">删除帖子</el-button>
          </div>
          <el-divider style="margin:16px 0" />
          <div class="post-body" v-html="post.content"></div>
        </div>

        <!-- ====== 评论区卡片 ====== -->
        <div class="comment-card">
          <h2 class="comment-title">评论 <span class="comment-count">{{ replies.length }}</span></h2>

          <!-- 回复输入 -->
          <div class="reply-box" v-if="isLoggedIn">
            <div v-if="replyTo" class="reply-to-tip">
              回复 <b>@{{ replyTo.username }}</b>
              <el-button type="info" link size="small" @click="replyTo = null">取消</el-button>
            </div>
            <div class="reply-editor-wrap">
              <Toolbar :editor="replyEditorRef" :defaultConfig="replyTbCfg" mode="simple" />
              <Editor v-model="replyHtml" :defaultConfig="replyEdCfg" mode="simple"
                @onCreated="e => replyEditorRef = e" style="height:110px;overflow-y:auto;" />
            </div>
            <div class="reply-actions-row">
              <el-button type="primary" :loading="replying" @click="submitReply">发表评论</el-button>
            </div>
          </div>
          <div v-else class="login-hint">
            <router-link to="/login">登录</router-link> 后参与评论
          </div>

          <el-divider v-if="replies.length" style="margin:20px 0 0" />

          <!-- 评论列表 -->
          <div class="comment-list">
            <div v-for="r in replies" :key="r.id" class="comment-item">
              <el-avatar :size="32" :src="r.avatar || undefined">{{ r.username?.[0] }}</el-avatar>
              <div class="comment-main">
                <div class="cm-head">
                  <span class="cm-name">{{ r.username }}</span>
                  <el-tag v-if="r.is_admin" type="danger" size="small" effect="dark" round>管理员</el-tag>
                  <template v-if="r.reply_to_username">
                    <span class="cm-arrow">▸</span>
                    <span class="cm-at">@{{ r.reply_to_username }}</span>
                  </template>
                  <span class="cm-time">{{ ago(r.created_at) }}</span>
                </div>
                <div class="cm-content" v-html="r.content"></div>
                <div class="cm-actions">
                  <el-button v-if="isLoggedIn" type="primary" link size="small" @click="setReplyTo(r)">
                    <el-icon><ChatDotRound /></el-icon> 回复
                  </el-button>
                  <el-button v-if="canDelReply(r)" type="danger" link size="small" @click="delReply(r.id)">删除</el-button>
                </div>
              </div>
            </div>
            <div v-if="!replies.length" class="no-comment">还没有评论，快来抢沙发吧</div>
          </div>
        </div>
      </template>

      <el-empty v-if="!post && !loading" description="帖子不存在或已被删除">
        <el-button type="primary" @click="$router.push('/community')">返回社区</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, shallowRef, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ChatDotRound } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import tokenManager from '@/utils/tokenManager'

import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const me = computed(() => userStore.user)

const loading = ref(false)
const post = ref(null)
const replies = computed(() => post.value?.replies || [])

async function loadPost() {
  loading.value = true
  try {
    post.value = await request({ url: `/api/v1/cms/posts/${route.params.id}` })
  } catch {
    post.value = null
  } finally { loading.value = false }
}

// ── helpers ──
function ago(t) {
  if (!t) return ''
  const s = (Date.now() - new Date(t)) / 1000
  if (s < 60) return '刚刚'
  if (s < 3600) return `${Math.floor(s/60)}分钟前`
  if (s < 86400) return `${Math.floor(s/3600)}小时前`
  if (s < 2592000) return `${Math.floor(s/86400)}天前`
  return new Date(t).toLocaleDateString('zh-CN')
}
function formatDate(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function canDel(p) { return me.value && (me.value.id === p.user_id || me.value.role === 'admin') }
function canDelReply(r) { return me.value && (me.value.id === r.user_id || me.value.role === 'admin') }

// ── delete ──
async function delPost() {
  try { await ElMessageBox.confirm('确定删除该帖子及所有评论？', '确认', { type: 'warning' }) } catch { return }
  try {
    await request({ url: `/api/v1/cms/posts/${post.value.id}`, method: 'DELETE' })
    ElMessage.success('已删除')
    router.push('/community')
  } catch { ElMessage.error('删除失败') }
}
async function delReply(rid) {
  try { await ElMessageBox.confirm('确定删除？', '确认', { type: 'warning' }) } catch { return }
  try {
    await request({ url: `/api/v1/cms/posts/${post.value.id}/replies/${rid}`, method: 'DELETE' })
    ElMessage.success('已删除')
    await loadPost()
  } catch { ElMessage.error('删除失败') }
}

// ── reply ──
const replyTo = ref(null)
const replyHtml = ref('')
const replying = ref(false)
const replyEditorRef = shallowRef(null)

function getHeaders() {
  const h = tokenManager.getAuthorizationHeader()
  return h ? { Authorization: h } : {}
}
const replyTbCfg = { toolbarKeys: ['bold', 'italic', 'through', 'code', 'emotion', 'uploadImage', '|', 'undo', 'redo'] }
const replyEdCfg = {
  placeholder: '写下你的评论...',
  MENU_CONF: {
    uploadImage: {
      server: '/api/v1/upload/image', fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024, allowedFileTypes: ['image/*'],
      headers: getHeaders(),
      customInsert(res, insertFn) {
        const url = res?.data?.url
        if (url) insertFn(url, '', '')
        else ElMessage.error('图片上传失败')
      }
    }
  }
}

function setReplyTo(r) {
  replyTo.value = r
  replyHtml.value = ''
  replyEditorRef.value?.focus()
}

async function submitReply() {
  const plain = replyEditorRef.value?.getText()?.trim()
  if (!plain) { ElMessage.warning('请输入评论内容'); return }
  replying.value = true
  try {
    await request({
      url: `/api/v1/cms/posts/${post.value.id}/replies`, method: 'POST',
      data: { content: replyHtml.value, reply_to_id: replyTo.value?.id || '', reply_to_username: replyTo.value?.username || '' }
    })
    replyHtml.value = ''
    replyTo.value = null
    ElMessage.success('评论成功')
    await loadPost()
  } catch { ElMessage.error('评论失败') } finally { replying.value = false }
}

onMounted(() => {
  replyEdCfg.MENU_CONF.uploadImage.headers = getHeaders()
  loadPost()
})
onBeforeUnmount(() => { if (replyEditorRef.value) replyEditorRef.value.destroy() })
</script>

<style scoped>
.post-page { min-height: calc(100vh - 64px); background: transparent; }
.container { max-width: 820px; margin: 0 auto; padding: 24px 20px 60px; }

.back-row { margin-bottom: 16px; }

/* ── Main Card ── */
.main-card {
  background: #fff; border-radius: 14px; padding: 28px 32px;
  box-shadow: 0 1px 8px rgba(0,0,0,.05); margin-bottom: 16px;
}
.post-title { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0 0 16px; line-height: 1.4; }
.author-row { display: flex; align-items: center; gap: 10px; }
.author-info { display: flex; flex-direction: column; flex: 1; }
.author-name { font-weight: 600; font-size: .9rem; color: #334155; }
.author-time { font-size: .78rem; color: #94a3b8; }

.post-body { font-size: .95rem; line-height: 1.9; color: #334155; }
.post-body :deep(img) { max-width: 100%; border-radius: 8px; margin: 10px 0; }
.post-body :deep(pre) { background: #f8fafc; padding: 14px; border-radius: 8px; overflow-x: auto; font-size: .85rem; }
.post-body :deep(blockquote) { border-left: 3px solid #c7d2fe; padding-left: 14px; color: #64748b; margin: 12px 0; }
.post-body :deep(a) { color: #6366f1; }

/* ── Comment Card ── */
.comment-card {
  background: #fff; border-radius: 14px; padding: 24px 32px;
  box-shadow: 0 1px 8px rgba(0,0,0,.05);
}
.comment-title { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 16px; }
.comment-count {
  display: inline-flex; align-items: center; justify-content: center;
  background: #6366f1; color: #fff; font-size: .7rem; font-weight: 700;
  width: 22px; height: 22px; border-radius: 50%; margin-left: 4px; vertical-align: middle;
}

/* reply input */
.reply-box { margin-bottom: 4px; }
.reply-to-tip {
  padding: 6px 14px; margin-bottom: 8px; background: #eef2ff;
  border-radius: 6px; font-size: .85rem; color: #475569;
  display: flex; align-items: center; gap: 8px;
}
.reply-editor-wrap { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
.reply-editor-wrap :deep(.w-e-toolbar) { border-bottom: 1px solid #e2e8f0; }
.reply-actions-row { display: flex; justify-content: flex-end; margin-top: 10px; }
.login-hint { text-align: center; padding: 14px 0; color: #94a3b8; }
.login-hint a { color: #6366f1; text-decoration: none; font-weight: 600; }

/* comment list */
.comment-list { display: flex; flex-direction: column; }
.comment-item {
  display: flex; gap: 12px; padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
}
.comment-item:last-child { border-bottom: none; }
.comment-main { flex: 1; min-width: 0; }
.cm-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
.cm-name { font-weight: 600; font-size: .88rem; color: #334155; }
.cm-arrow { color: #cbd5e1; font-size: .7rem; }
.cm-at { color: #6366f1; font-weight: 600; font-size: .85rem; }
.cm-time { font-size: .75rem; color: #c0c4cc; margin-left: auto; }
.cm-content { font-size: .9rem; color: #475569; line-height: 1.7; }
.cm-content :deep(p) { margin: 0 0 4px; }
.cm-content :deep(p:last-child) { margin-bottom: 0; }
.cm-content :deep(img) { max-width: 280px; border-radius: 6px; margin: 6px 0; display: block; }
.cm-actions { display: flex; gap: 10px; margin-top: 6px; }
.no-comment { text-align: center; color: #c0c4cc; padding: 32px 0; font-size: .9rem; }
</style>

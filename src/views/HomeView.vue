<template>
  <div class="home apple-home">
    <section class="apple-hero">
      <div class="hero-inner">
        <h1 class="hero-heading">论文格式修改系统</h1>
        <p class="hero-subtitle">专业 · 迅捷 · 精准</p>
        <p class="hero-desc">自动检查排版、引用与页眉页脚，智能修正并导出。将精力，聚焦在研究本身。</p>
        <div class="hero-cta">
          <el-button class="hero-btn primary" size="large" @click="go('/upload')">开始格式检查</el-button>
          <el-button class="hero-btn" size="large" @click="go('/history')">查看历史</el-button>
        </div>
      </div>
    </section>

    <section class="apple-section">
      <div class="section-grid">
        <div class="panel panel-blue">
          <div class="panel-content">
            <h2 class="panel-title">一键检查</h2>
            <p class="panel-desc">上传 DOCX/PDF，即刻扫描页边距、标题层级、行间距与引用格式。</p>
            <div class="panel-actions">
              <el-button class="panel-btn primary" @click="go('/upload')">上传论文</el-button>
            </div>
          </div>
        </div>
        <div class="panel panel-mint">
          <div class="panel-content">
            <h2 class="panel-title">智能修正</h2>
            <p class="panel-desc">匹配院校规范模板，自动应用修正方案并可一键导出修正版。</p>
            <div class="panel-actions">
              <el-button class="panel-btn" @click="go('/check/preview')">体验修正流程</el-button>
            </div>
          </div>
        </div>
        <div class="panel panel-pink">
          <div class="panel-content">
            <h2 class="panel-title">院校规范库</h2>
            <p class="panel-desc">已收录 120+ 所高校格式标准，支持自定义模板与导入Word模板。</p>
            <div class="panel-actions">
              <el-button class="panel-btn" @click="go('/upload')">选择规范 / 自定义</el-button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="apple-feature">
      <div class="feature-grid">
        <div class="feature-item feature-indigo">
          <h3 class="feature-title">极速与准确</h3>
          <p class="feature-desc">针对页边距、正文与标题规范、引用标准进行逐项校验与提示。</p>
          <div class="feature-actions">
            <el-button class="feature-btn" @click="go('/demo/speed')">查看演示</el-button>
          </div>
        </div>
        <div class="feature-item feature-amber">
          <h3 class="feature-title">模板与自定义</h3>
          <p class="feature-desc">内置院校模板，支持 Word 模板导入与表单细粒度设置。</p>
          <div class="feature-actions">
            <el-button class="feature-btn" @click="go('/demo/template')">体验模板编辑</el-button>
          </div>
        </div>
        <div class="feature-item feature-emerald">
          <h3 class="feature-title">整洁的导出</h3>
          <p class="feature-desc">修正完成后，可直接下载修正版 DOCX，亦可生成报告与历史记录。</p>
          <div class="feature-actions">
            <el-button class="feature-btn" @click="go('/demo/export')">预览导出效果</el-button>
          </div>
        </div>
      </div>
    </section>

    <section class="apple-cta">
      <div class="cta-inner">
        <h2 class="cta-title">专注内容，让格式更简单</h2>
        <div class="cta-actions">
          <el-button class="cta-btn primary" size="large" @click="go('/upload')">立即开始</el-button>
          <el-button class="cta-btn" size="large" @click="go('/contact')">联系我们</el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const go = (p) => router.push(p)
</script>

<style scoped>
.apple-home { background: #fff; }
.apple-hero { padding: 80px 20px 60px; background: linear-gradient(to bottom, #F5F7FA, #FFFFFF); text-align: center; }
.hero-inner { max-width: 980px; margin: 0 auto; }
.hero-heading { margin: 0; font-size: 56px; font-weight: 700; letter-spacing: -0.02em; color: #111827; }
.hero-subtitle { margin: 12px 0 6px; font-size: 22px; color: #374151; font-weight: 600; }
.hero-desc { margin: 0 auto 24px; max-width: 720px; font-size: 16px; color: #6B7280; line-height: 1.7; }
.hero-cta { display: inline-flex; gap: 12px; }
.hero-btn { border-radius: 999px; padding: 12px 20px; }
.hero-btn.primary { background: #111827; color: #fff; border: none; }
.apple-section { padding: 40px 20px; background: #FFFFFF; }
.section-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
.panel { border-radius: 24px; padding: 32px; min-height: 220px; display: flex; align-items: center; }
.panel-blue { background: linear-gradient(135deg, #EFF6FF, #FFFFFF); border: 1px solid #E5E7EB; }
.panel-mint { background: linear-gradient(135deg, #ECFDF5, #FFFFFF); border: 1px solid #E5E7EB; }
.panel-pink { background: linear-gradient(135deg, #FDF2F8, #FFFFFF); border: 1px solid #E5E7EB; }
.panel-title { margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #111827; }
.panel-desc { margin: 0 0 16px; color: #6B7280; font-size: 15px; }
.panel-btn { border-radius: 999px; }
.panel-btn.primary { background: #111827; color: #fff; border: none; }
.apple-feature { padding: 40px 20px 20px; background: #FFFFFF; }
.feature-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
.feature-item { background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; }
.feature-indigo { background: linear-gradient(135deg, #E0E7FF, #FFFFFF); border-color: #E5E7EB; }
.feature-amber { background: linear-gradient(135deg, #FEF3C7, #FFFFFF); border-color: #E5E7EB; }
.feature-emerald { background: linear-gradient(135deg, #D1FAE5, #FFFFFF); border-color: #E5E7EB; }
.feature-title { margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827; }
.feature-desc { margin: 0 0 16px; color: #6B7280; line-height: 1.7; }
.feature-actions { margin-top: auto; }
.feature-btn { border-radius: 999px; border: 1.5px solid #D1D5DB; background: rgba(255,255,255,0.7); font-size: 13px; }
.apple-cta { padding: 60px 20px 80px; background: linear-gradient(to bottom, #F5F7FA, #FFFFFF); text-align: center; }
.cta-inner { max-width: 980px; margin: 0 auto; }
.cta-title { margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #111827; }
.cta-actions { display: inline-flex; gap: 12px; }
.cta-btn { border-radius: 999px; padding: 12px 20px; }
.cta-btn.primary { background: #111827; color: #fff; border: none; }
@media (max-width: 768px) { .hero-heading { font-size: 36px; } .hero-subtitle { font-size: 18px; } }
</style>

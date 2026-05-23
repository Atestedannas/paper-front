<template>
  <div class="review-container">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <h2>格式差异审核</h2>
    </div>

    <el-skeleton v-if="loading" :rows="6" animated />

    <template v-else-if="report">
      <el-alert
        :type="report.error_count > 0 ? 'warning' : 'success'"
        :closable="false"
        style="margin-bottom: 16px"
      >
        <template #title>
          <span v-if="report.error_count > 0 || report.warning_count > 0">
            自动修正后仍发现
            <strong>{{ report.error_count }}</strong> 处错误，
            <strong>{{ report.warning_count }}</strong> 处警告。
            请审核下方差异列表，选择接受或拒绝修改。
          </span>
          <span v-else>🎉 文档格式已完全符合模板要求！</span>
        </template>
      </el-alert>

      <div v-if="report.para_diffs && report.para_diffs.length > 0">
        <div class="toolbar">
          <el-button size="small" @click="selectAll(true)">全部接受</el-button>
          <el-button size="small" @click="selectAll(false)">全部拒绝</el-button>
          <span class="count-info">
            已选 {{ acceptedCount }} / 共 {{ report.para_diffs.length }} 处差异
          </span>
        </div>

        <el-table :data="report.para_diffs" stripe style="margin-bottom: 16px">
          <el-table-column type="expand">
            <template #default="{ row }">
              <el-table :data="row.diffs" size="small" style="margin: 8px 16px">
                <el-table-column prop="field" label="属性" width="160">
                  <template #default="{ row: d }">{{ fieldLabel(d.field) }}</template>
                </el-table-column>
                <el-table-column prop="expected" label="模板要求" />
                <el-table-column prop="actual" label="当前值" />
                <el-table-column prop="severity" label="级别" width="80">
                  <template #default="{ row: d }">
                    <el-tag
                      :type="d.severity === 'error' ? 'danger' : 'warning'"
                      size="small"
                    >{{ d.severity === 'error' ? '错误' : '警告' }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </el-table-column>

          <el-table-column label="#" prop="para_index" width="60" />
          <el-table-column label="区域" prop="category" width="110">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ categoryLabel(row.category) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="段落预览" prop="text" show-overflow-tooltip />
          <el-table-column label="差异数" width="75">
            <template #default="{ row }">
              <el-badge :value="row.diffs.length" :type="hasCritical(row) ? 'danger' : 'warning'" />
            </template>
          </el-table-column>
          <el-table-column label="接受修改" width="95">
            <template #default="{ row }">
              <el-switch v-model="accepted[row.para_index]" />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-empty v-else description="没有发现格式差异，文档完全符合模板要求" />
    </template>

    <el-empty v-else description="暂无差异报告，请先进行格式修正" />

    <div class="action-bar">
      <el-button
        type="primary"
        size="large"
        :loading="applying"
        :disabled="!report"
        @click="confirm"
      >
        确认并下载修正文档
      </el-button>
      <span class="hint">仅对已选「接受」的差异段落重新应用修正</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getReviewDiffs, applySelectedDiffs } from '@/api/paper'

const route = useRoute()
const paperId = route.params.id

const loading = ref(true)
const report = ref(null)
const accepted = ref({})
const applying = ref(false)

const acceptedCount = computed(() =>
  Object.values(accepted.value).filter(Boolean).length
)

onMounted(async () => {
  try {
    const res = await getReviewDiffs(paperId)
    const data = res.data?.data ?? res.data
    report.value = data?.diff_report ?? null
    if (report.value?.para_diffs) {
      report.value.para_diffs.forEach(d => {
        accepted.value[d.para_index] = true
      })
    }
  } catch (e) {
    ElMessage.error('加载差异报告失败: ' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
})

const selectAll = (val) => {
  report.value?.para_diffs?.forEach(d => {
    accepted.value[d.para_index] = val
  })
}

const hasCritical = (row) => row.diffs.some(d => d.severity === 'error')

const confirm = async () => {
  applying.value = true
  try {
    const indices = Object.entries(accepted.value)
      .filter(([, v]) => v)
      .map(([k]) => parseInt(k))
    await applySelectedDiffs(paperId, indices)
    ElMessage.success('修正已应用，正在下载...')
    window.open(`/api/v1/papers/${paperId}/corrected-file`, '_blank')
  } catch (e) {
    ElMessage.error('应用修正失败: ' + (e.response?.data?.message || e.message))
  } finally {
    applying.value = false
  }
}

const categoryLabel = (cat) => ({
  abstract: '中文摘要', english_abstract: '英文摘要',
  body: '正文', heading_1: '一级标题',
  heading_2: '二级标题', heading_3: '三级标题',
  references: '参考文献', keywords: '关键词',
  en_keywords: '英文关键词', cover: '封面',
  acknowledgements: '致谢',
})[cat] || cat

const fieldLabel = (field) => ({
  font_east_asia: '中文字体', font_ascii: '西文字体',
  font_size: '字号', bold: '加粗',
  alignment: '对齐', line_spacing: '行距',
  space_before: '段前距', space_after: '段后距',
  first_line_indent: '首行缩进',
})[field] || field
</script>

<style scoped>
.review-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.count-info {
  color: #666;
  font-size: 13px;
}
.action-bar {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.hint {
  color: #909399;
  font-size: 13px;
}
</style>

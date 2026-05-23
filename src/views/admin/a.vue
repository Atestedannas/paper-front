<template>
  <div class="paper-format-view">
    <div class="page-header">
      <h2 class="page-title">高校管理</h2>
      <p class="page-description">管理高校信息和格式模板</p>
    </div>

    <div class="content-container">
      <!-- 智能识别输入框 -->
 
      
      <!-- 搜索和筛选 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input 
              v-model="searchQuery" 
              placeholder="搜索高校名称或ID" 
              prefix-icon="Search"
              @input="debouncedSearch"
            />
          </el-col>
          <el-col :span="6">
            <el-select 
              v-model="filterSubject" 
              placeholder="学科类别" 
              clearable
              @change="loadPapers"
            >
              <el-option label="文科" value="文科"></el-option>
              <el-option label="理科" value="理科"></el-option>
              <el-option label="工科" value="工科"></el-option>
              <el-option label="综合" value="综合"></el-option>
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="loadPapers">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 高校列表 -->
      <div class="university-list">
        <el-table 
          :data="universities" 
          v-loading="loading"
          style="width: 100%"
          @row-click="handleRowClick"
        >
          <el-table-column prop="id" label="ID" width="100"></el-table-column>
          <el-table-column prop="abbr" label="简称" width="120"></el-table-column>
          <el-table-column prop="subject" label="学科类别" width="120">
            <template #default="{ row }">
              <el-tag :type="getSubjectTagType(row.subject)">
                {{ row.subject }}
              </el-tag>
            </template>
          </el-table-column>

      
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="openDetailDialog(row)"
                >
                  查看详情
                </el-button>
                <el-button 
                  type="info" 
                  size="small" 
                  @click="editUniversity(row)"
                >
                  编辑
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="deleteUniversity(row.id)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="loadPapers"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>

    <!-- 详情对话框 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      :title="`高校详情 - ${selectedUniversity?.name || ''}`"
      width="95%"
      top="2vh"
      class="detail-dialog"
    >
      <div v-if="selectedUniversity" class="detail-content">
        <el-tabs v-model="activeTab">
          <!-- 格式对比与修正 -->
          <el-tab-pane label="格式对比与修正" name="compare">
            <div class="compare-container">
              <el-row :gutter="20" style="height: 100%;">
                <!-- 左侧：模板预览 -->
                <el-col :span="12" class="preview-col">
                  <div class="panel-header">
                    <h4>模板预览</h4>
                    <div class="preview-actions">
                      <el-button-group>
                        <el-button size="small" :type="previewType === 'docx' ? 'primary' : 'default'" @click="switchPreview('docx')" v-if="selectedUniversity.file_path || selectedUniversity.docx_template_url">DOCX</el-button>
                        <el-button size="small" :type="previewType === 'pdf' ? 'primary' : 'default'" @click="switchPreview('pdf')" v-if="selectedUniversity.pdf_template_url">PDF</el-button>
                      </el-button-group>
                      <el-button size="small" type="primary" icon="Download" @click="downloadTemplate" style="margin-left: 10px;">下载</el-button>
                    </div>
                  </div>
                  <div class="preview-content" v-loading="previewLoading">
                    <div v-if="previewType === 'docx'" ref="docxPreviewRef" class="docx-preview-area"></div>
                    <iframe v-else-if="previewType === 'pdf'" :src="pdfPreviewUrl" class="pdf-preview-frame"></iframe>
                    <div v-else class="no-preview-placeholder">
                      <el-empty description="暂无预览文件" />
                    </div>
                  </div>
                </el-col>
                
                <!-- 右侧：解析结果修正 -->
                <el-col :span="12" class="rules-col">
                  <div class="panel-header">
                    <h4>解析规则修正</h4>
                    <div class="rules-actions">
                      <el-button type="primary" size="small" @click="saveFormatRequirements">保存修正</el-button>
                    </div>
                  </div>
                  <div class="rules-content">
                    <div class="format-requirements">
                      <table class="requirements-table">
                        <thead>
                          <tr>
                            <th width="120">部分</th>
                            <th>格式要求 (可直接编辑)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(value, key) in orderedFormatRequirements" :key="key">
                            <td>{{ getLabel(key) }}</td>
                            <td>
                              <span v-if="typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'">{{ value }}</span>
                              <div v-else-if="typeof value === 'object' && value !== null" class="object-requirements">
                                <span v-for="(subValue, subKey) in value" :key="subKey" class="requirement-pair">
                                  <template v-if="typeof subValue === 'string' || typeof subValue === 'number' || typeof subValue === 'boolean'">
                                    <span class="sub-key">{{ getLabel(subKey) }}:</span>
                                    
                                    <!-- 对齐方式选择 -->
                                    <el-select 
                                      v-if="subKey.includes('alignment') || subKey.includes('对齐方式')" 
                                      v-model="value[subKey]" 
                                      size="small" 
                                      class="editable-value-select" 
                                      @change="onFormatRequirementChange(key, subKey, value[subKey])">
                                      <el-option label="左对齐 (left)" :value="'left'" />
                                      <el-option label="居中 (center)" :value="'center'" />
                                      <el-option label="右对齐 (right)" :value="'right'" />
                                      <el-option label="两端对齐 (justify)" :value="'justify'" />
                                    </el-select>

                                    <!-- 是否加粗选择 -->
                                    <el-switch
                                      v-else-if="subKey.includes('bold') || subKey.includes('是否加粗') || subKey.includes('bold_for_headings') || subKey.includes('标题是否加粗')"
                                      v-model="value[subKey]"
                                      size="small"
                                      active-text="是"
                                      inactive-text="否"
                                      @change="onFormatRequirementChange(key, subKey, value[subKey])"
                                    />

                                    <!-- 字体选择 -->
                                    <el-select
                                      v-else-if="subKey.includes('font_name') || subKey.includes('字体')"
                                      v-model="value[subKey]"
                                      size="small"
                                      filterable
                                      allow-create
                                      class="editable-value-select"
                                      @change="onFormatRequirementChange(key, subKey, value[subKey])">
                                      <el-option label="宋体" :value="'宋体'" />
                                      <el-option label="黑体" :value="'黑体'" />
                                      <el-option label="仿宋" :value="'仿宋'" />
                                      <el-option label="楷体" :value="'楷体'" />
                                      <el-option label="Times New Roman" :value="'Times New Roman'" />
                                      <el-option label="Arial" :value="'Arial'" />
                                    </el-select>

                                    <!-- 字号选择 -->
                                    <el-select
                                      v-else-if="subKey.includes('font_size') || subKey.includes('字号')"
                                      v-model="value[subKey]"
                                      size="small"
                                      filterable
                                      allow-create
                                      class="editable-value-select"
                                      @change="onFormatRequirementChange(key, subKey, value[subKey])">
                                      <el-option label="初号" :value="'初号'" />
                                      <el-option label="小初" :value="'小初'" />
                                      <el-option label="一号" :value="'一号'" />
                                      <el-option label="小一" :value="'小一'" />
                                      <el-option label="二号" :value="'二号'" />
                                      <el-option label="小二" :value="'小二'" />
                                      <el-option label="三号" :value="'三号'" />
                                      <el-option label="小三" :value="'小三'" />
                                      <el-option label="四号" :value="'四号'" />
                                      <el-option label="小四" :value="'小四'" />
                                      <el-option label="五号" :value="'五号'" />
                                      <el-option label="小五" :value="'小五'" />
                                    </el-select>

                                    <!-- 默认输入框 -->
                                    <el-select
                                      v-if="subKey.includes('line_space') || subKey.includes('行间距')"
                                      v-model="value[subKey]"
                                      size="small"
                                      class="editable-value-select"
                                      filterable
                                      allow-create
                                      default-first-option
                                      @change="onFormatRequirementChange(key, subKey, value[subKey])">
                                      <el-option label="单倍行距 (single)" :value="'single'" />
                                      <el-option label="1.5倍行距 (1.5)" :value="'1.5'" />
                                      <el-option label="2倍行距 (2)" :value="'2'" />
                                      <el-option label="固定值20磅 (fixed_20_pt)" :value="'fixed_20_pt'" />
                                      <el-option label="最小值 (min_value)" :value="'min_value'" />
                                    </el-select>
                                  </template>
                                  <template v-else-if="typeof subValue === 'object' && subValue !== null">
                                    <div class="nested-object">
                                      <span class="nested-sub-key">{{ getLabel(subKey) }}:</span>
                                      <span v-for="(nestedValue, nestedKey) in subValue" :key="nestedKey" class="nested-pair">
                                        <template v-if="typeof nestedValue === 'string' || typeof nestedValue === 'number' || typeof nestedValue === 'boolean'">
                                          <span class="nested-key">{{ getLabel(nestedKey) }}:</span>
                                          <el-select
                                            v-if="nestedKey.includes('alignment') || nestedKey.includes('对齐方式')"
                                            v-model="subValue[nestedKey]"
                                            size="small"
                                            class="editable-nested-value"
                                            @change="onNestedFormatRequirementChange(key, subKey, nestedKey, subValue[nestedKey])">
                                            <el-option label="左对齐 (left)" :value="'left'" />
                                            <el-option label="居中 (center)" :value="'center'" />
                                            <el-option label="右对齐 (right)" :value="'right'" />
                                            <el-option label="两端对齐 (justify)" :value="'justify'" />
                                          </el-select>
                                          <el-switch
                                            v-else-if="nestedKey.includes('bold') || nestedKey.includes('是否加粗') || nestedKey.includes('bold_for_headings') || nestedKey.includes('标题是否加粗')"
                                            v-model="subValue[nestedKey]"
                                            size="small"
                                            active-text="是"
                                            inactive-text="否"
                                            @change="onNestedFormatRequirementChange(key, subKey, nestedKey, subValue[nestedKey])"
                                          />
                                          <el-select
                                            v-else-if="nestedKey.includes('font_name') || nestedKey.includes('字体')"
                                            v-model="subValue[nestedKey]"
                                            size="small"
                                            filterable
                                            allow-create
                                            class="editable-nested-value"
                                            @change="onNestedFormatRequirementChange(key, subKey, nestedKey, subValue[nestedKey])">
                                            <el-option label="宋体" :value="'宋体'" />
                                            <el-option label="黑体" :value="'黑体'" />
                                            <el-option label="仿宋" :value="'仿宋'" />
                                            <el-option label="楷体" :value="'楷体'" />
                                            <el-option label="Times New Roman" :value="'Times New Roman'" />
                                            <el-option label="Arial" :value="'Arial'" />
                                          </el-select>
                                          <el-select
                                            v-else-if="nestedKey.includes('font_size') || nestedKey.includes('字号')"
                                            v-model="subValue[nestedKey]"
                                            size="small"
                                            filterable
                                            allow-create
                                            class="editable-nested-value"
                                            @change="onNestedFormatRequirementChange(key, subKey, nestedKey, subValue[nestedKey])">
                                            <el-option label="初号" :value="'初号'" />
                                            <el-option label="小初" :value="'小初'" />
                                            <el-option label="一号" :value="'一号'" />
                                            <el-option label="小一" :value="'小一'" />
                                            <el-option label="二号" :value="'二号'" />
                                            <el-option label="小二" :value="'小二'" />
                                            <el-option label="三号" :value="'三号'" />
                                            <el-option label="小三" :value="'小三'" />
                                            <el-option label="四号" :value="'四号'" />
                                            <el-option label="小四" :value="'小四'" />
                                            <el-option label="五号" :value="'五号'" />
                                            <el-option label="小五" :value="'小五'" />
                                          </el-select>
                                          <el-select
                                            v-if="nestedKey.includes('line_space') || nestedKey.includes('行间距')"
                                            v-model="subValue[nestedKey]"
                                            size="small"
                                            class="editable-nested-value"
                                            filterable
                                            allow-create
                                            default-first-option
                                            @change="onNestedFormatRequirementChange(key, subKey, nestedKey, subValue[nestedKey])">
                                            <el-option label="单倍行距 (single)" :value="'single'" />
                                            <el-option label="1.5倍行距 (1.5)" :value="'1.5'" />
                                            <el-option label="2倍行距 (2)" :value="'2'" />
                                            <el-option label="固定值20磅 (fixed_20_pt)" :value="'fixed_20_pt'" />
                                            <el-option label="最小值 (min_value)" :value="'min_value'" />
                                          </el-select>
                                        </template>
                                        <template v-else-if="typeof nestedValue === 'object' && nestedValue !== null">
                                          <div class="nested-object nested-level-3">
                                            <span class="nested-sub-key">{{ getLabel(nestedKey) }}:</span>
                                            <span v-for="(deepValue, deepKey) in nestedValue" :key="deepKey" class="nested-pair">
                                              <template v-if="typeof deepValue === 'string' || typeof deepValue === 'number' || typeof deepValue === 'boolean'">
                                                <span class="nested-key">{{ getLabel(deepKey) }}:</span>
                                                <el-select
                                                  v-if="deepKey.includes('alignment') || deepKey.includes('对齐方式')"
                                                  v-model="nestedValue[deepKey]"
                                                  size="small"
                                                  class="editable-nested-value"
                                                  @change="onDeepFormatRequirementChange(key, subKey, nestedKey, deepKey, nestedValue[deepKey])">
                                                  <el-option label="左对齐 (left)" :value="'left'" />
                                                  <el-option label="居中 (center)" :value="'center'" />
                                                  <el-option label="右对齐 (right)" :value="'right'" />
                                                  <el-option label="两端对齐 (justify)" :value="'justify'" />
                                                </el-select>
                                                <el-switch
                                                  v-else-if="deepKey.includes('bold') || deepKey.includes('是否加粗') || deepKey.includes('bold_for_headings') || deepKey.includes('标题是否加粗')"
                                                  v-model="nestedValue[deepKey]"
                                                  size="small"
                                                  active-text="是"
                                                  inactive-text="否"
                                                  @change="onDeepFormatRequirementChange(key, subKey, nestedKey, deepKey, nestedValue[deepKey])"
                                                />
                                                <el-select
                                                  v-else-if="deepKey.includes('font_name') || deepKey.includes('字体')"
                                                  v-model="nestedValue[deepKey]"
                                                  size="small"
                                                  filterable
                                                  allow-create
                                                  class="editable-nested-value"
                                                  @change="onDeepFormatRequirementChange(key, subKey, nestedKey, deepKey, nestedValue[deepKey])">
                                                  <el-option label="宋体" :value="'宋体'" />
                                                  <el-option label="黑体" :value="'黑体'" />
                                                  <el-option label="仿宋" :value="'仿宋'" />
                                                  <el-option label="楷体" :value="'楷体'" />
                                                  <el-option label="Times New Roman" :value="'Times New Roman'" />
                                                  <el-option label="Arial" :value="'Arial'" />
                                                </el-select>
                                                <el-select
                                                  v-else-if="deepKey.includes('font_size') || deepKey.includes('字号')"
                                                  v-model="nestedValue[deepKey]"
                                                  size="small"
                                                  filterable
                                                  allow-create
                                                  class="editable-nested-value"
                                                  @change="onDeepFormatRequirementChange(key, subKey, nestedKey, deepKey, nestedValue[deepKey])">
                                                  <el-option label="初号" :value="'初号'" />
                                                  <el-option label="小初" :value="'小初'" />
                                                  <el-option label="一号" :value="'一号'" />
                                                  <el-option label="小一" :value="'小一'" />
                                                  <el-option label="二号" :value="'二号'" />
                                                  <el-option label="小二" :value="'小二'" />
                                                  <el-option label="三号" :value="'三号'" />
                                                  <el-option label="小三" :value="'小三'" />
                                                  <el-option label="四号" :value="'四号'" />
                                                  <el-option label="小四" :value="'小四'" />
                                                  <el-option label="五号" :value="'五号'" />
                                                  <el-option label="小五" :value="'小五'" />
                                                </el-select>
                                                <el-select
                                                  v-if="deepKey.includes('line_space') || deepKey.includes('行间距')"
                                                  v-model="nestedValue[deepKey]"
                                                  size="small"
                                                  class="editable-nested-value"
                                                  filterable
                                                  allow-create
                                                  default-first-option
                                                  @change="onDeepFormatRequirementChange(key, subKey, nestedKey, deepKey, nestedValue[deepKey])">
                                                  <el-option label="单倍行距 (single)" :value="'single'" />
                                                  <el-option label="1.5倍行距 (1.5)" :value="'1.5'" />
                                                  <el-option label="2倍行距 (2)" :value="'2'" />
                                                  <el-option label="固定值20磅 (fixed_20_pt)" :value="'fixed_20_pt'" />
                                                  <el-option label="最小值 (min_value)" :value="'min_value'" />
                                                </el-select>
                                              </template>
                                              <span v-else>{{ formatValue(deepValue) }}</span>
                                            </span>
                                          </div>
                                        </template>
                                        <span v-else>{{ formatValue(nestedValue) }}</span>
                                      </span>
                                    </div>
                                  </template>
                                  <span v-else>{{ formatValue(subValue) }}</span>
                                  <!-- <template v-if="subKey !== Object.keys(value)[Object.keys(value).length - 1]">；</template> -->
                                </span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <!-- 高校信息 -->
          <el-tab-pane label="基本信息" name="info">
            <div class="info-section">
              <el-row :gutter="20">
                <!-- 左侧：格式要求 -->
                <el-col :span="12">
                  <div class="university-info">
                    <div class="info-item">
                      <h4>高校基本信息:<strong>高校名称:</strong> {{ selectedUniversity.name }}</h4>
                                        
                      <!-- 文件展示区域 -->
                      <div class="file-section">
                        <h4>相关文档</h4>
                        
                        <!-- DOCX文件展示 -->
                        <div v-if="selectedUniversity.file_path || selectedUniversity.docx_template_url" class="docx-file-section">
                          <div class="file-item">
                            <el-icon><Document /></el-icon>
                            <span class="file-name" @click="openDocxFile()" style="cursor: pointer; color: #409eff; text-decoration: underline;">
                              {{ getFileNameFromUrl(selectedUniversity.file_path || selectedUniversity.docx_template_url) }}
                            </span>
                          </div>
                        </div>
                        
                        <!-- PDF文件展示 -->
                        <div v-if="selectedUniversity.pdf_template_url" class="pdf-file-section">
                          <div class="file-item">
                            <el-icon><Document /></el-icon>
                            <span class="file-name" @click="openPdfFile()" style="cursor: pointer; color: #409eff; text-decoration: underline;">
                              {{ getFileNameFromUrl(selectedUniversity.pdf_template_url) }}
                            </span>
                          </div>
                        </div>
                      </div>
                                        
                      <div v-if="selectedUniversity.format_requirements">
                        <h4>格式要求</h4>
                        <div class="format-requirements">
                          <table class="requirements-table">
                            <thead>
                              <tr>
                                <th>部分</th>
                                <th>字体与格式要求</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(value, key) in orderedFormatRequirements" :key="key">
                                <td>{{ key }}</td>
                                <td>
                                  <span v-if="typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'">{{ value }}</span>
                                  <div v-else-if="typeof value === 'object' && value !== null" class="object-requirements">
                                    <span v-for="(subValue, subKey) in value" :key="subKey" class="requirement-pair">
                                      <template v-if="typeof subValue === 'string' || typeof subValue === 'number' || typeof subValue === 'boolean'">
                                        <span class="sub-key">{{ subKey }}:</span>
                                        <el-select
                                          v-if="subKey.includes('alignment') || subKey.includes('对齐方式')" 
                                          v-model="value[subKey]" 
                                          size="small" 
                                          class="editable-value-select" 
                                          @change="onFormatRequirementChange(key, subKey, value[subKey])">
                                          <el-option label="左对齐 (left)" :value="'left'" />
                                          <el-option label="居中 (center)" :value="'center'" />
                                          <el-option label="右对齐 (right)" :value="'right'" />
                                          <el-option label="两端对齐 (justify)" :value="'justify'" />
                                        </el-select>
                                        <el-switch
                                          v-else-if="subKey.includes('bold') || subKey.includes('是否加粗') || subKey.includes('bold_for_headings') || subKey.includes('标题是否加粗')"
                                          v-model="value[subKey]"
                                          size="small"
                                          active-text="是"
                                          inactive-text="否"
                                          @change="onFormatRequirementChange(key, subKey, value[subKey])"
                                        />
                                        <el-select
                                          v-else-if="subKey.includes('font_name') || subKey.includes('字体')"
                                          v-model="value[subKey]"
                                          size="small"
                                          filterable
                                          allow-create
                                          class="editable-value-select"
                                          @change="onFormatRequirementChange(key, subKey, value[subKey])">
                                          <el-option label="宋体" :value="'宋体'" />
                                          <el-option label="黑体" :value="'黑体'" />
                                          <el-option label="仿宋" :value="'仿宋'" />
                                          <el-option label="楷体" :value="'楷体'" />
                                          <el-option label="Times New Roman" :value="'Times New Roman'" />
                                          <el-option label="Arial" :value="'Arial'" />
                                        </el-select>
                                        <el-select
                                          v-else-if="subKey.includes('font_size') || subKey.includes('字号')"
                                          v-model="value[subKey]"
                                          size="small"
                                          filterable
                                          allow-create
                                          class="editable-value-select"
                                          @change="onFormatRequirementChange(key, subKey, value[subKey])">
                                          <el-option label="初号" :value="'初号'" />
                                          <el-option label="小初" :value="'小初'" />
                                          <el-option label="一号" :value="'一号'" />
                                          <el-option label="小一" :value="'小一'" />
                                          <el-option label="二号" :value="'二号'" />
                                          <el-option label="小二" :value="'小二'" />
                                          <el-option label="三号" :value="'三号'" />
                                          <el-option label="小三" :value="'小三'" />
                                          <el-option label="四号" :value="'四号'" />
                                          <el-option label="小四" :value="'小四'" />
                                          <el-option label="五号" :value="'五号'" />
                                          <el-option label="小五" :value="'小五'" />
                                        </el-select>
                                        <el-select
                                          v-if="subKey.includes('line_space') || subKey.includes('行间距')"
                                          v-model="value[subKey]"
                                          size="small"
                                          class="editable-value-select"
                                          filterable
                                          allow-create
                                          default-first-option
                                          @change="onFormatRequirementChange(key, subKey, value[subKey])">
                                          <el-option label="单倍行距 (single)" :value="'single'" />
                                          <el-option label="1.5倍行距 (1.5)" :value="'1.5'" />
                                          <el-option label="2倍行距 (2)" :value="'2'" />
                                          <el-option label="固定值20磅 (fixed_20_pt)" :value="'fixed_20_pt'" />
                                          <el-option label="最小值 (min_value)" :value="'min_value'" />
                                        </el-select>
                                      </template>
                                      <template v-else-if="typeof subValue === 'object' && subValue !== null">
                                        <div class="nested-object">
                                          <span class="nested-sub-key">{{ subKey }}:</span>
                                          <span v-for="(nestedValue, nestedKey) in subValue" :key="nestedKey" class="nested-pair">
                                            <template v-if="typeof nestedValue === 'string' || typeof nestedValue === 'number' || typeof nestedValue === 'boolean'">
                                              <span class="nested-key">{{ nestedKey }}:</span>
                                              <el-select
                                                v-if="nestedKey.includes('alignment') || nestedKey.includes('对齐方式')"
                                                v-model="subValue[nestedKey]"
                                                size="small"
                                                class="editable-nested-value"
                                                @change="onNestedFormatRequirementChange(key, subKey, nestedKey, subValue[nestedKey])">
                                                <el-option label="左对齐 (left)" :value="'left'" />
                                                <el-option label="居中 (center)" :value="'center'" />
                                                <el-option label="右对齐 (right)" :value="'right'" />
                                                <el-option label="两端对齐 (justify)" :value="'justify'" />
                                              </el-select>
                                              <el-switch
                                                v-else-if="nestedKey.includes('bold') || nestedKey.includes('是否加粗') || nestedKey.includes('bold_for_headings') || nestedKey.includes('标题是否加粗')"
                                                v-model="subValue[nestedKey]"
                                                size="small"
                                                active-text="是"
                                                inactive-text="否"
                                                @change="onNestedFormatRequirementChange(key, subKey, nestedKey, subValue[nestedKey])"
                                              />
                                              <el-select
                                                v-else-if="nestedKey.includes('font_name') || nestedKey.includes('字体')"
                                                v-model="subValue[nestedKey]"
                                                size="small"
                                                filterable
                                                allow-create
                                                class="editable-nested-value"
                                                @change="onNestedFormatRequirementChange(key, subKey, nestedKey, subValue[nestedKey])">
                                                <el-option label="宋体" :value="'宋体'" />
                                                <el-option label="黑体" :value="'黑体'" />
                                                <el-option label="仿宋" :value="'仿宋'" />
                                                <el-option label="楷体" :value="'楷体'" />
                                                <el-option label="Times New Roman" :value="'Times New Roman'" />
                                                <el-option label="Arial" :value="'Arial'" />
                                              </el-select>
                                              <el-select
                                                v-else-if="nestedKey.includes('font_size') || nestedKey.includes('字号')"
                                                v-model="subValue[nestedKey]"
                                                size="small"
                                                filterable
                                                allow-create
                                                class="editable-nested-value"
                                                @change="onNestedFormatRequirementChange(key, subKey, nestedKey, subValue[nestedKey])">
                                                <el-option label="初号" :value="'初号'" />
                                                <el-option label="小初" :value="'小初'" />
                                                <el-option label="一号" :value="'一号'" />
                                                <el-option label="小一" :value="'小一'" />
                                                <el-option label="二号" :value="'二号'" />
                                                <el-option label="小二" :value="'小二'" />
                                                <el-option label="三号" :value="'三号'" />
                                                <el-option label="小三" :value="'小三'" />
                                                <el-option label="四号" :value="'四号'" />
                                                <el-option label="小四" :value="'小四'" />
                                                <el-option label="五号" :value="'五号'" />
                                                <el-option label="小五" :value="'小五'" />
                                              </el-select>
                                              <el-select
                                                v-if="nestedKey.includes('line_space') || nestedKey.includes('行间距')"
                                                v-model="subValue[nestedKey]"
                                                size="small"
                                                class="editable-nested-value"
                                                filterable
                                                allow-create
                                                default-first-option
                                                @change="onNestedFormatRequirementChange(key, subKey, nestedKey, subValue[nestedKey])">
                                                <el-option label="单倍行距 (single)" :value="'single'" />
                                                <el-option label="1.5倍行距 (1.5)" :value="'1.5'" />
                                                <el-option label="2倍行距 (2)" :value="'2'" />
                                                <el-option label="固定值20磅 (fixed_20_pt)" :value="'fixed_20_pt'" />
                                                <el-option label="最小值 (min_value)" :value="'min_value'" />
                                              </el-select>
                                            </template>
                                            <template v-else-if="typeof nestedValue === 'object' && nestedValue !== null">
                                              <div class="nested-object nested-level-3">
                                                <span class="nested-sub-key">{{ nestedKey }}:</span>
                                                <span v-for="(deepValue, deepKey) in nestedValue" :key="deepKey" class="nested-pair">
                                                  <template v-if="typeof deepValue === 'string' || typeof deepValue === 'number' || typeof deepValue === 'boolean'">
                                                    <span class="nested-key">{{ deepKey }}:</span>
                                                    <el-select
                                                      v-if="deepKey.includes('alignment') || deepKey.includes('对齐方式')"
                                                      v-model="nestedValue[deepKey]"
                                                      size="small"
                                                      class="editable-nested-value"
                                                      @change="onDeepFormatRequirementChange(key, subKey, nestedKey, deepKey, nestedValue[deepKey])">
                                                      <el-option label="左对齐 (left)" :value="'left'" />
                                                      <el-option label="居中 (center)" :value="'center'" />
                                                      <el-option label="右对齐 (right)" :value="'right'" />
                                                      <el-option label="两端对齐 (justify)" :value="'justify'" />
                                                    </el-select>
                                                    <el-switch
                                                      v-else-if="deepKey.includes('bold') || deepKey.includes('是否加粗') || deepKey.includes('bold_for_headings') || deepKey.includes('标题是否加粗')"
                                                      v-model="nestedValue[deepKey]"
                                                      size="small"
                                                      active-text="是"
                                                      inactive-text="否"
                                                      @change="onDeepFormatRequirementChange(key, subKey, nestedKey, deepKey, nestedValue[deepKey])"
                                                    />
                                                    <el-select
                                                      v-else-if="deepKey.includes('font_name') || deepKey.includes('字体')"
                                                      v-model="nestedValue[deepKey]"
                                                      size="small"
                                                      filterable
                                                      allow-create
                                                      class="editable-nested-value"
                                                      @change="onDeepFormatRequirementChange(key, subKey, nestedKey, deepKey, nestedValue[deepKey])">
                                                      <el-option label="宋体" :value="'宋体'" />
                                                      <el-option label="黑体" :value="'黑体'" />
                                                      <el-option label="仿宋" :value="'仿宋'" />
                                                      <el-option label="楷体" :value="'楷体'" />
                                                      <el-option label="Times New Roman" :value="'Times New Roman'" />
                                                      <el-option label="Arial" :value="'Arial'" />
                                                    </el-select>
                                                    <el-select
                                                      v-else-if="deepKey.includes('font_size') || deepKey.includes('字号')"
                                                      v-model="nestedValue[deepKey]"
                                                      size="small"
                                                      filterable
                                                      allow-create
                                                      class="editable-nested-value"
                                                      @change="onDeepFormatRequirementChange(key, subKey, nestedKey, deepKey, nestedValue[deepKey])">
                                                      <el-option label="初号" :value="'初号'" />
                                                      <el-option label="小初" :value="'小初'" />
                                                      <el-option label="一号" :value="'一号'" />
                                                      <el-option label="小一" :value="'小一'" />
                                                      <el-option label="二号" :value="'二号'" />
                                                      <el-option label="小二" :value="'小二'" />
                                                      <el-option label="三号" :value="'三号'" />
                                                      <el-option label="小三" :value="'小三'" />
                                                      <el-option label="四号" :value="'四号'" />
                                                      <el-option label="小四" :value="'小四'" />
                                                      <el-option label="五号" :value="'五号'" />
                                                      <el-option label="小五" :value="'小五'" />
                                                    </el-select>
                                                    <el-select
                                                      v-if="deepKey.includes('line_space') || deepKey.includes('行间距')"
                                                      v-model="nestedValue[deepKey]"
                                                      size="small"
                                                      class="editable-nested-value"
                                                      filterable
                                                      allow-create
                                                      default-first-option
                                                      @change="onDeepFormatRequirementChange(key, subKey, nestedKey, deepKey, nestedValue[deepKey])">
                                                      <el-option label="单倍行距 (single)" :value="'single'" />
                                                      <el-option label="1.5倍行距 (1.5)" :value="'1.5'" />
                                                      <el-option label="2倍行距 (2)" :value="'2'" />
                                                      <el-option label="固定值20磅 (fixed_20_pt)" :value="'fixed_20_pt'" />
                                                      <el-option label="最小值 (min_value)" :value="'min_value'" />
                                                    </el-select>
                                                  </template>
                                                  <span v-else>{{ formatValue(deepValue) }}</span>
                                                </span>
                                              </div>
                                            </template>
                                            <span v-else>{{ formatValue(nestedValue) }}</span>
                                          </span>
                                        </div>
                                      </template>
                                      <span v-else>{{ formatValue(subValue) }}</span>
                                      <template v-if="subKey !== Object.keys(value)[Object.keys(value).length - 1]">；</template>
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div class="format-actions">
                          <el-button type="primary" size="small" @click="saveFormatRequirements">保存格式要求</el-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-col>
                
                <!-- 右侧：智能修改区域 -->
                <el-col :span="12">
                  <!-- 智能输入区域 - 用于修改高校信息 -->
                  <div class="smart-input-section">
                    <h4>智能修改高校信息</h4>
                    <div class="smart-input-area">
                      <el-input 
                        v-model="smartInput" 
                        placeholder="请输入高校信息（如：重庆工程学院，学科类别：工科，描述：...）" 
                        prefix-icon="Document"
                        type="textarea"
                        :rows="3"
                        @input="handleSmartInput"
                      />
                      <div class="smart-input-actions">
                        <el-button type="primary" @click="processSmartInputForUniversity" :loading="smartInputProcessing">
                          {{ smartInputProcessing ? '处理中...' : '智能修改' }}
                        </el-button>
                        <el-button @click="clearSmartInput">清空</el-button>
                      </div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>


     
        </el-tabs>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { debounce } from 'lodash-es'
import { getPapers, getPaperById } from '@/api/paper'
import request from '@/utils/request'
import { renderAsync } from 'docx-preview'
import { Document, Download } from '@element-plus/icons-vue'

// 响应式数据
const universities = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterSubject = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const detailDialogVisible = ref(false)
const selectedUniversity = ref(null)
const activeTab = ref('compare')
const fileContent = ref(null)
const previewLoading = ref(false)
const smartInput = ref('')
const smartInputProcessing = ref(false)
const previewType = ref('docx')
const pdfPreviewUrl = ref('')
const docxPreviewRef = ref(null)
const editingRequirements = ref({})

// 字段映射表
const fieldMappings = {
  // 通用字段
  'body': '正文格式',
  'title': '标题格式',
  'author': '作者格式',
  'abstract': '摘要格式',
  'english_abstract': '英文摘要格式',
  'headings': '标题层级格式',
  'keywords': '关键词格式',
  'page_setup': '页面设置',
  'references': '参考文献格式',
  'english_title': '英文标题格式',
  'cover': '封面',
  'table_of_contents': '目录',
  'acknowledgements': '致谢',
  'appendix': '附录',
  
  // 正文字段
  'alignment': '对齐方式',
  'font_name': '字体名称',
  'font_size': '字号',
  'line_space': '行间距',
  'paragraph_space': '段落间距',
  'first_line_indent': '首行缩进',
  
  // 标题字段
  'level1': '一级标题',
  'level2': '二级标题',
  'level3': '三级标题',
  'level4': '四级标题',
  'level5': '五级标题',
  'level6': '六级标题',
  
  // 页面设置字段
  'footer': '页脚',
  'header': '页眉',
  'margins': '页边距',
  'orientation': '页面方向',
  'paper_size': '纸张大小',
  'distance': '距离',
  
  // 参考文献字段
  'content': '内容格式',
  'label': '标签格式',
  'style': '格式风格',
  'numbering': '编号格式',
  'text': '文本内容',
  'bold': '是否加粗',
  'bold_for_headings': '标题是否加粗',
  
  // 页边距字段
  'top': '上边距',
  'bottom': '下边距',
  'left': '左边距',
  'right': '右边距',
  
  // 段落间距字段
  'after': '段后间距',
  'before': '段前间距',
  
  // 其他字段
  'separator': '分隔符',
  'no_end_punctuation': '无结尾标点',
  'description': '描述'
}

// 反向映射表（中文名 -> 英文名）
const reverseFieldMappings = Object.fromEntries(
  Object.entries(fieldMappings).map(([key, value]) => [value, key])
);

// 清洗和标准化格式要求数据
const cleanFormatRequirements = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  // 如果是数组，递归处理每个元素
  if (Array.isArray(data)) {
    return data.map(item => cleanFormatRequirements(item));
  }
  
  const cleaned = {};
  
  // 遍历所有键
  Object.keys(data).forEach(key => {
    let value = data[key];
    
    // 递归清洗值
    if (typeof value === 'object' && value !== null) {
      value = cleanFormatRequirements(value);
    } else if (typeof value === 'string') {
      // 修复常见的单位拼写错误
      if (value === '2.54c' || value === '2.54') {
        value = '2.54cm';
      } else if (/^\d+(\.\d+)?c$/.test(value)) {
         // 修复以c结尾但应该是cm的情况
         value = value + 'm';
      }
    }
    
    // 判断当前键是英文还是中文
    // 如果是标准英文键，直接保留
    if (fieldMappings.hasOwnProperty(key)) {
      // 如果已存在（可能是之前从中文键合并过来的），则合并
      if (cleaned.hasOwnProperty(key) && typeof cleaned[key] === 'object' && typeof value === 'object') {
        cleaned[key] = { ...cleaned[key], ...value };
      } else {
        cleaned[key] = value;
      }
    } 
    // 如果是中文键，尝试转换为英文键
    else if (reverseFieldMappings.hasOwnProperty(key)) {
      const engKey = reverseFieldMappings[key];
      
      // 如果目标英文键已存在，则合并
      if (cleaned.hasOwnProperty(engKey)) {
        if (typeof cleaned[engKey] === 'object' && typeof value === 'object') {
          cleaned[engKey] = { ...cleaned[engKey], ...value };
        } else {
          // 如果不是对象，且英文键已有值，通常优先保留英文键的原始值，或者覆盖
          // 这里选择保留英文键的值（假设它是更标准的）
          // 但如果是空值，则使用中文键的值
          if (!cleaned[engKey]) {
            cleaned[engKey] = value;
          }
        }
      } else {
        cleaned[engKey] = value;
      }
    } 
    // 其他未知键，保持原样
    else {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
};

// 获取显示标签
const getLabel = (key) => {
  return fieldMappings[key] || key
}

// 切换预览类型
const switchPreview = async (type) => {
  previewType.value = type
  if (selectedUniversity.value) {
    await loadTemplatePreview(selectedUniversity.value)
  }
}

// 加载模板预览
const loadTemplatePreview = async (university) => {
  if (!university) return
  
  previewLoading.value = true
  try {
    if (previewType.value === 'docx') {
       // 清理旧内容
       if (docxPreviewRef.value) {
         docxPreviewRef.value.innerHTML = ''
       }

       const templateUrl = constructTemplateUrl(university, 'docx')
       if (!templateUrl) {
         // 如果没有DOCX，尝试PDF
         if (university.pdf_template_url) {
           previewType.value = 'pdf'
           pdfPreviewUrl.value = constructTemplateUrl(university, 'pdf')
         }
         return
       }

       const response = await fetch(templateUrl)
       if (!response.ok) throw new Error('获取模板文件失败')
       
       const blob = await response.blob()
       if (docxPreviewRef.value) {
         await renderAsync(blob, docxPreviewRef.value, null, {
           className: "docx-preview-content",
           inWrapper: false,
           ignoreWidth: false,
           ignoreHeight: false,
           ignoreFonts: false,
           breakPages: true,
           ignoreLastRenderedPageBreak: true,
           ignoreHeaders: false,
           ignoreFooters: false,
           useBase64URL: true
         })
       }
    } else if (previewType.value === 'pdf') {
       const templateUrl = constructTemplateUrl(university, 'pdf')
       if (templateUrl) {
         pdfPreviewUrl.value = templateUrl
       } else {
         // 如果没有PDF，尝试DOCX
         if (university.file_path || university.docx_template_url) {
           previewType.value = 'docx'
           await loadTemplatePreview(university)
         }
       }
    }
  } catch (error) {
    console.error('预览加载失败:', error)
    ElMessage.error('预览加载失败，请检查文件是否存在')
  } finally {
    previewLoading.value = false
  }
}

// 下载模板
const downloadTemplate = () => {
  if (previewType.value === 'docx') {
    openDocxFile()
  } else if (previewType.value === 'pdf') {
    openPdfFile()
  }
}

// 按特定顺序展示格式要求
const orderedFormatRequirements = computed(() => {
  if (!editingRequirements.value || Object.keys(editingRequirements.value).length === 0) {
    return {};
  }
  
  // 定义期望的顺序 (使用英文Key)
  const order = [
    'cover', 'table_of_contents', 'title', 'author', 'abstract', 'english_title', 'english_abstract', 
    'body', 'headings', 'references', 'acknowledgements', 'appendix', 'page_setup', 'keywords'
  ];
  
  // 创建一个新对象，按顺序添加属性
  const ordered = {};
  
  // 首先添加按顺序定义的属性
  order.forEach(key => {
    if (editingRequirements.value.hasOwnProperty(key)) {
      ordered[key] = editingRequirements.value[key];
    }
  });
  
  // 然后添加剩余的属性
  Object.keys(editingRequirements.value).forEach(key => {
    if (!ordered.hasOwnProperty(key)) {
      ordered[key] = editingRequirements.value[key];
    }
  });
  
  return ordered;
})

// 防抖搜索
const debouncedSearch = debounce(() => {
  currentPage.value = 1
  loadPapers()
}, 500)

// 智能输入防抖
const debouncedSmartInput = debounce(() => {
  // 判断 smartInput 字段是否为空
  if (smartInput.value && smartInput.value.trim()) {

    // 将输入框的数据发送给后端
    // 根据当前上下文决定调用哪个处理函数
    if (selectedUniversity.value && selectedUniversity.value.id) {
      // 如果已选择高校，则修改特定高校

      processSmartInputForUniversity()
     
    } else {

      // 否则创建新高校
      processSmartInput()
    }
  }
}, 1000)

// 处理智能输入事件
const handleSmartInput = () => {
  // 只更新输入值，不立即触发处理函数
  // 如果需要自动处理，可以取消注释下面这行
  // debouncedSmartInput();
}

// 处理格式要求变更
const onFormatRequirementChange = (section, key, value) => {
  if (editingRequirements.value[section] && typeof editingRequirements.value[section] === 'object') {
    editingRequirements.value[section][key] = value;
  }
};

// 处理嵌套格式要求变更
const onNestedFormatRequirementChange = (section, subSection, key, value) => {
  if (editingRequirements.value[section] && editingRequirements.value[section][subSection] && typeof editingRequirements.value[section][subSection] === 'object') {
    editingRequirements.value[section][subSection][key] = value;
  }
};

const onDeepFormatRequirementChange = (section, subSection, nestedSection, key, value) => {
  if (editingRequirements.value[section] && editingRequirements.value[section][subSection] && editingRequirements.value[section][subSection][nestedSection] && typeof editingRequirements.value[section][subSection][nestedSection] === 'object') {
    editingRequirements.value[section][subSection][nestedSection][key] = value;
  }
};

// 保存格式要求
const saveFormatRequirements = async () => {
  try {
    // 发送到后端
    // 在保存前清洗数据，移除中文Key，修复单位错误
    const cleanedRequirements = cleanFormatRequirements(editingRequirements.value);
    // 更新本地显示的数据，确保界面上也同步清洗后的结果
    editingRequirements.value = JSON.parse(JSON.stringify(cleanedRequirements));
    
    const response = await request({
      url: `/api/v1/admin/universities/${selectedUniversity.value.id}`,
      method: 'PUT',
      data: {
        format_requirements: cleanedRequirements // 发送清洗后的对象
      }
    });
    
    if (response ) {
      ElMessage.success('格式要求已保存');
      // 重新加载高校信息
      await loadPapers();
    } else {
      ElMessage.error(response?.msg || '保存格式要求失败');
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存格式要求失败: ' + (error.message || '网络错误'));
  }
};


// 加载论文列表
const loadPapers = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      q: searchQuery.value,
      subject: filterSubject.value
    }
    const response = await request({
      url: '/api/v1/admin/universities',
      method: 'GET',
      params
    })





    // 确保正确处理后端返回的数据结构
    if (response && response.items ) {
      universities.value = response.items || []
      total.value = response.total || 0
    } else {
      universities.value = []
      total.value = 0
    }
  } catch (error) {

    ElMessage.error('加载高校列表失败: ' + (error.message || '网络错误'))
  } finally {
    loading.value = false
  }
}

























// 解析标签
const parseTags = (tagsString) => {
  try {
    if (!tagsString) return []
    if (typeof tagsString === 'string') {
      const parsed = JSON.parse(tagsString)
      return Array.isArray(parsed) ? parsed : []
    }
    return tagsString
  } catch (e) {

    return []
  }
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 获取学科类别标签类型
const getSubjectTagType = (subject) => {
  switch (subject) {
    case '文科': return 'warning'
    case '理科': return 'success'
    case '工科': return 'primary'
    case '综合': return 'info'
    default: return 'info'
  }
}

// 编辑高校
const editUniversity = (university) => {
  // 这里可以跳转到编辑页面或打开编辑对话框

  ElMessage.info('编辑功能将在高校管理页面中实现')
}

// 删除高校
const deleteUniversity = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个高校吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 这里应该调用删除API

    ElMessage.success('高校删除成功')
    // 重新加载数据
    await loadPapers()
  } catch (error) {
    if (error !== 'cancel') {

      ElMessage.error('删除高校失败')
    }
  }
}

// 处理智能输入 - 创建新高校
const processSmartInput = async () => {
  if (!smartInput.value.trim()) {
    ElMessage.warning('请输入高校信息')
    return
  }
  
  smartInputProcessing.value = true
  try {
    // 模拟智能识别过程，实际应用中这里应该调用后端API
    // 暂时模拟解析输入内容
    const universityData = parseUniversityInput(smartInput.value)
    
    // 如果解析到高校信息，可以创建或更新高校
    if (universityData && universityData.name) {
      // 这里可以调用API创建高校
      const response = await request({
        url: '/api/v1/admin/universities',
        method: 'POST',
        data: universityData
      })
      
      if (response.code === 200) {
        ElMessage.success(`${universityData.name} 信息已保存`)
        // 重新加载高校列表
        await loadPapers()
        // 清空输入框
        smartInput.value = ''
      } else {
        ElMessage.error('处理高校信息失败')
      }
    } else {
      ElMessage.info('未能从输入中识别出有效的高校信息')
    }
  } catch (error) {

    ElMessage.error('处理失败: ' + (error.message || '网络错误'))
  } finally {
    smartInputProcessing.value = false
  }
}

// 处理智能输入 - 修改特定高校
const processSmartInputForUniversity = async () => {
  if (!smartInput.value.trim()) {
    ElMessage.warning('请输入高校信息')
    return
  }

  if (!selectedUniversity.value || !selectedUniversity.value.id) {
    ElMessage.error('请选择要修改的高校')
    return
  }
  
  smartInputProcessing.value = true
  try {
    // 直接使用用户输入的原始值作为 format_requirements 字段的值，去除特殊字符
    const formatRequirements = smartInput.value.trim().replace(/\t/g, '  '); // 将制表符替换为两个空格
    
    // 构建要发送的数据对象，只包含 format_requirements 字段
    const universityData = {
      format_requirements: formatRequirements
    };
    
    // 发送数据到后端
    const response = await request({
      url: `/api/v1/admin/universities/${selectedUniversity.value.id}`,
      method: 'PUT',
      data: universityData
    })
    
    if (response) {
      ElMessage.success(`${selectedUniversity.value.name} 信息已更新`)
      // 更新本地数据
      Object.assign(selectedUniversity.value, response.data)
      // 清空输入框
      smartInput.value = ''
      // 重新加载列表
      await loadPapers()
    } else {
      ElMessage.error(response?.msg || '更新高校信息失败')
    }
  } catch (error) {

    ElMessage.error('处理失败: ' + (error.message || '网络错误'))
  } finally {
    smartInputProcessing.value = false
  }
}

// 将表格格式的输入转换为JSON格式
const convertTableToJSON = (input) => {
  // 按行分割输入内容
  const lines = input.split('\n').filter(line => line.trim() !== '');
  
  // 创建格式要求对象
  const formatObj = {};
  
  // 遍历每一行，查找表格格式
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 查找包含制表符或多个空格分隔的行（表格格式）
    if (line.includes('\t') || line.includes('  ')) {
      // 分割行内容，获取部分和格式要求
      const parts = line.split(/[\t]+| {2,}/); // 按制表符或多个空格分割
      
      if (parts.length >= 2) {
        const section = parts[0].trim(); // 部分名称
        const requirements = parts.slice(1).join(' ').trim(); // 格式要求
        
        // 解析格式要求并转换为JSON格式
        formatObj[section] = parseRequirements(requirements);
      }
    }
  }
  
  // 返回JSON字符串
  return JSON.stringify(formatObj);
};

// 解析格式要求
const parseRequirements = (requirements) => {
  const result = {};
  
  // 解析字体信息
  const fontMatches = requirements.match(/([一-龯A-Za-z\s]+)([号一二三四五六七八九十\d\.]+)/g);
  if (fontMatches) {
    // 提取字体名称（非数字和"号"的字符）
    const fontName = fontMatches[0].replace(/[号一二三四五六七八九十\d\.]/g, '').trim();
    result.font = fontName;
    
    // 提取字号
    const sizeMatch = requirements.match(/([一二三四五六七八九十\d\.]+号)/);
    if (sizeMatch) {
      result.size = sizeMatch[1];
    }
  }
  
  // 解析对齐方式
  if (requirements.includes('居中')) {
    result.alignment = 'center';
  } else if (requirements.includes('左')) {
    result.alignment = 'left';
  } else if (requirements.includes('右')) {
    result.alignment = 'right';
  } else if (requirements.includes('两端')) {
    result.alignment = 'justify';
  }
  
  // 解析行距
  const lineSpaceMatch = requirements.match(/(\d+(?:\.\d+)?)倍行距/);
  if (lineSpaceMatch) {
    result.line_spacing = parseFloat(lineSpaceMatch[1]);
  }
  
  // 解析加粗
  if (requirements.includes('加粗') || requirements.includes('粗体')) {
    result.bold = true;
  }
  
  // 解析其他属性
  if (requirements.includes('顶格')) {
    result.indent = 'none';
  }
  
  // 如果没有解析到特定格式，将整个要求作为描述
  if (Object.keys(result).length === 0) {
    result.description = requirements;
  }
  
  return result;
};

// 翻译格式要求为中文
const translateFormatRequirements = (requirements) => {
  if (!requirements || typeof requirements !== 'object') {
    return requirements
  }
  
  // 定义字段映射
  const fieldMappings = {
    // 通用字段
    'body': '正文格式',
    'title': '标题格式',
    'author': '作者格式',
    'abstract': '摘要格式',
    'english_abstract': '英文摘要格式',
    'headings': '标题层级格式',
    'keywords': '关键词格式',
    'page_setup': '页面设置',
    'references': '参考文献格式',
    'english_title': '英文标题格式',
    
    // 正文字段
    'alignment': '对齐方式',
    'font_name': '字体名称',
    'font_size': '字号',
    'line_space': '行间距',
    'paragraph_space': '段落间距',
    'first_line_indent': '首行缩进',
    
    // 标题字段
    'level1': '一级标题',
    'level2': '二级标题',
    'level3': '三级标题',
    'level4': '四级标题',
    'level5': '五级标题',
    'level6': '六级标题',
    
    // 页面设置字段
    'footer': '页脚',
    'header': '页眉',
    'margins': '页边距',
    'orientation': '页面方向',
    'paper_size': '纸张大小',
    'distance': '距离',
    
    // 参考文献字段
    'content': '内容格式',
    'label': '标签格式',
    'style': '格式风格',
    'numbering': '编号格式',
    'text': '文本内容',
    'bold': '是否加粗',
    'bold_for_headings': '标题是否加粗',
    
    // 页边距字段
    'top': '上边距',
    'bottom': '下边距',
    'left': '左边距',
    'right': '右边距',
    
    // 段落间距字段
    'after': '段后间距',
    'before': '段前间距',
    
    // 其他字段
    'separator': '分隔符',
    'no_end_punctuation': '无结尾标点',
  }
  
  const translated = {}
  
  for (const [key, value] of Object.entries(requirements)) {
    const translatedKey = fieldMappings[key] || key
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // 递归翻译嵌套对象
      translated[translatedKey] = translateFormatRequirements(value)
    } else {
      // 直接赋值非对象值
      translated[translatedKey] = value
    }
  }
  
  return translated
}

// 从URL中提取文件名
const getFileNameFromUrl = (url) => {
  if (!url) return '模板.docx';
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  return fileName || '模板.docx';
}

// 构造高校模板文件访问URL
const constructTemplateUrl = (university, fileType = 'docx') => {
  if (!university) return null;
  
  let url = null;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

  // 如果已有直接的URL，优先使用
  if (fileType === 'docx' && university.docx_template_url) {
    url = university.docx_template_url;
  } else if (fileType === 'pdf' && university.pdf_template_url) {
    url = university.pdf_template_url;
  } else if (university.file_path) {
    // 如果有file_path字段，使用它
    url = university.file_path;
  } else if (university.id) {
    // 构造高校模板文件访问URL
    const extension = fileType.toLowerCase();
    url = `/uploads/universities/${university.id}/template.${extension}`;
    // 添加时间戳防止缓存
    url += `?t=${new Date().getTime()}`;
  }

  if (!url) return null;

  // 如果是相对路径，添加BaseURL
  if (!url.startsWith('http') && !url.startsWith('//')) {
    // 确保url以/开头
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    // 移除BaseURL末尾的/（如果有）
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return cleanBaseUrl + url;
  }

  return url;
}

// 打开DOCX文件
const openDocxFile = async () => {
  if (!selectedUniversity.value) {
    ElMessage.error('请选择高校');
    return;
  }
  
  try {
    const templateUrl = constructTemplateUrl(selectedUniversity.value, 'docx');
    
    if (!templateUrl) {
      ElMessage.error('未找到DOCX模板文件');
      return;
    }
    
    const response = await fetch(templateUrl);
    
    if (!response.ok) {
      throw new Error(`文件获取失败: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // 触发下载
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = getFileNameFromUrl(templateUrl);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理资源
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {

    ElMessage.error('打开DOCX文件失败: ' + (error.message || '文件不存在'));
  }
}

// 打开PDF文件
const openPdfFile = async () => {
  if (!selectedUniversity.value) {
    ElMessage.error('请选择高校');
    return;
  }
  
  try {
    const templateUrl = constructTemplateUrl(selectedUniversity.value, 'pdf');
    
    if (!templateUrl) {
      ElMessage.error('未找到PDF模板文件');
      return;
    }
    
    const response = await fetch(templateUrl);
    
    if (!response.ok) {
      throw new Error(`文件获取失败: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // 对于PDF文件，在新标签页中打开预览
    const previewUrl = window.URL.createObjectURL(blob);
    window.open(previewUrl, '_blank');
    
    // 清理资源
    window.URL.revokeObjectURL(previewUrl);
  } catch (error) {

    ElMessage.error('打开PDF文件失败: ' + (error.message || '文件不存在'));
  }
}

// 格式化值的显示
const formatValue = (value) => {
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  if (typeof value === 'string') {
    // 处理包含英文的字符串，如 "center（居中）" 格式
    if (value.includes('（') && value.includes('）')) {
      return value;
    }
    // 简单处理一些常见格式
    if (value.includes('(') && value.includes(')')) {
      // 将如 "SimSun(宋体)" 转换为 "宋体（SimSun）"
      const match = value.match(/([^(]+)\(([^)]+)\)/);
      if (match) {
        return `${match[2]}（${match[1]}）`;
      }
    }
  }
  return value;
}



// 清空智能输入框
const clearSmartInput = () => {
  smartInput.value = ''
}

// 重置筛选条件
const resetFilters = () => {
  searchQuery.value = ''
  filterSubject.value = ''
  currentPage.value = 1
  loadPapers()
}

// 处理表格行点击
const handleRowClick = (row) => {
  openDetailDialog(row)
}

// 打开详情对话框
const openDetailDialog = async (university) => {
  selectedUniversity.value = university
  detailDialogVisible.value = true
  activeTab.value = 'compare' // 默认打开对比标签页
  
  // 初始化编辑对象
  editingRequirements.value = {}
  if (university.format_requirements) {
    try {
      let req = university.format_requirements
      if (typeof req === 'string') {
        req = JSON.parse(req)
        if (typeof req === 'string') {
          req = JSON.parse(req)
        }
      }
      // 在加载时也进行清洗，确保显示的是标准数据
      const cleanedReq = cleanFormatRequirements(req);
      editingRequirements.value = JSON.parse(JSON.stringify(cleanedReq)) // 深拷贝
    } catch (e) {
      console.error('解析格式要求失败', e)
    }
  }
  
  // 确定默认预览类型
  if (university.pdf_template_url && !university.file_path && !university.docx_template_url) {
    previewType.value = 'pdf'
  } else {
    previewType.value = 'docx'
  }
  
  // 等待DOM更新后加载预览
  setTimeout(() => {
    loadTemplatePreview(university)
  }, 100)
}

// 加载文件预览
const loadFilePreview = async (paperId) => {
  previewLoading.value = true
  fileContent.value = null
  try {
    const response = await request({
      url: `/api/v1/papers/${paperId}/file`,
      method: 'GET',
      responseType: 'arraybuffer'
    })
    
    if (response && response.data) {
      // 将响应数据转换为ArrayBuffer
      const arrayBuffer = response.data
      
      // 创建临时容器来渲染文档
      const tempContainer = document.createElement('div')
      tempContainer.style.display = 'none'
      document.body.appendChild(tempContainer)
      
      // 使用docx-preview渲染文档
      await renderAsync(arrayBuffer, tempContainer, null, {
        className: "docx", // 添加类名用于样式定制
        inWrapper: false, // 不使用默认包装器
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
        ignoreHeaders: false,
        ignoreFooters: false,
        defaultMemo: null,
      })
      
      // 获取渲染后的内容
      fileContent.value = tempContainer.innerHTML
      
      // 移除临时容器
      document.body.removeChild(tempContainer)
    }
  } catch (error) {

    fileContent.value = '<p>文档预览加载失败，请尝试下载文件查看</p>'
  } finally {
    previewLoading.value = false
  }
}



// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadPapers()
}

// 初始化数据
onMounted(() => {
  loadPapers()
})
</script>

<style scoped>
.paper-format-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.smart-input-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #b3e1ff;
}

.smart-input-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  justify-content: flex-end;
}

.smart-input-area {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.smart-input-area .el-input {
  flex: 1;
  margin-bottom: 15px;
}

.smart-input-area .smart-input-actions {
  margin-top: auto;
  flex-direction: row;
  justify-content: flex-start;
}

/* 确保左右两列高度一致 */
.el-col-12 {
  display: flex;
}

.university-info, .smart-input-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.format-requirements {
  flex: 1;
  min-height: 200px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.content-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.university-list {
  padding: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.info-section, .actions-section {
  padding: 10px 0;
}

.file-info {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 6px;
}

.file-info h4 {
  margin: 0 0 10px 0;
  color: #374151;
  font-size: 16px;
}

.file-info p {
  margin: 5px 0;
  color: #4b5563;
}

.file-preview {
  margin-top: 20px;
}

.file-preview h4 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 16px;
}

.preview-container {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-height: 400px;
  padding: 20px;
  background: white;
  overflow-y: auto;
}

.loading-preview {
  text-align: center;
  padding: 60px 0;
}

.no-preview {
  text-align: center;
  padding: 60px 0;
  color: #6b7280;
}

.format-info h4 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 16px;
}

.format-result {
  margin-bottom: 30px;
}

.format-detail p {
  margin: 5px 0;
  line-height: 1.5;
}

.format-translation {
  margin-top: 30px;
}

.format-translation h4 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 16px;
}

.format-actions {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.docx-content {
  font-family: "Microsoft YaHei", "SimSun", serif;
  line-height: 1.6;
}

.docx-content :deep(p) {
  margin: 1em 0;
}

.docx-content :deep(h1), 
.docx-content :deep(h2), 
.docx-content :deep(h3), 
.docx-content :deep(h4) {
  margin: 0.8em 0 0.4em 0;
}

.format-requirements {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.5;
}

.file-section {
  margin: 15px 0;
}

.docx-file-section {
  margin: 15px 0;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #b3e1ff;
}

.pdf-file-section {
  margin: 15px 0;
  padding: 12px;
  background: #fef7ed;
  border-radius: 6px;
  border: 1px solid #fed7aa;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.file-name {
  font-family: monospace;
}

.format-requirements-raw {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
  max-height: 300px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.5;
}

.requirement-section {
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.requirement-header {
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 14px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 4px;
}

.requirement-content {
  padding-left: 10px;
}

.requirement-content-single {
  padding-left: 10px;
  color: #4b5563;
}

.requirement-item {
  display: flex;
  margin: 6px 0;
  align-items: flex-start;
}

.requirement-label {
  font-weight: 500;
  color: #374151;
  min-width: 100px;
  flex-shrink: 0;
}

.requirement-value {
  color: #4b5563;
  flex: 1;
  word-break: break-word;
}

.editable-value {
  width: 70%;
  margin-left: 10px;
  display: inline-block;
}

.editable-value-single {
  width: calc(100% - 20px);
  margin-top: 5px;
}

.requirements-table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 14px;
}

.requirements-table th,
.requirements-table td {
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}

.requirements-table th {
  background-color: #f3f4f6;
  font-weight: 600;
}

.object-requirements {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

/* 格式要求列表布局优化 */
.requirement-pair {
  display: inline-flex;
  align-items: center;
  margin-right: 15px;
  margin-bottom: 8px;
  background: #f0f9ff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e0f2fe;
}

.sub-key {
  font-weight: 600;
  color: #0369a1;
  margin-right: 8px;
  white-space: nowrap;
}

.editable-value-inline {
  width: 150px;
}

.editable-value-select {
  width: 160px;
}

.nested-object {
  margin: 5px 0;
  padding: 10px;
  background-color: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  width: 100%;
}

.nested-level-3 {
  margin-top: 8px;
  padding: 8px;
  background-color: #fefce8;
  border: 1px dashed #fde047;
  border-radius: 4px;
}

.nested-sub-key {
  font-weight: 700;
  color: #7c3aed;
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 4px;
}

.nested-pair {
  display: inline-flex;
  align-items: center;
  margin-right: 15px;
  margin-bottom: 5px;
}

.requirements-table td {
  padding: 12px;
  vertical-align: middle;
}

.nested-key {
  font-weight: 500;
  color: #059669;
  margin-right: 4px;
}

.editable-nested-value {
  width: auto;
  display: inline-block;
  margin: 0 2px;
  margin-bottom: 4px;
}

.action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 对比容器样式 */
.compare-container {
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.preview-col, .rules-col {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.panel-header {
  background: #f3f4f6;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
  color: #374151;
}

.preview-content, .rules-content {
  flex: 1;
  overflow-y: auto;
  background: #fff;
  position: relative;
}

.docx-preview-area {
  padding: 20px;
  min-height: 100%;
}

.pdf-preview-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.no-preview-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

:deep(.docx-preview-content) {
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 40px !important;
  margin: 0 auto;
}

.detail-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
  padding-bottom: 10px;
}
</style>
<template>
  <div class="aether-recycle-page">
    <!-- 1. 顶部 30 天自动清理机制 Banner (matching _4/code.html) -->
    <section class="banner-section">
      <div class="cleanup-banner">
        <div class="banner-content">
          <div class="banner-icon-box">
            <span class="material-symbols-outlined">auto_delete</span>
          </div>
          <div class="banner-main-text">
            <div class="title-row">
              <h2 class="banner-title">30 天自动清理机制</h2>
              <span class="security-badge">安全防护中</span>
            </div>
            <p class="banner-desc">
              回收站项目将在 30 天后自动永久清理。在此期间，您可以随时一键原路恢复。
            </p>
            <div class="banner-footer-row">
              <div class="storage-summary">
                <span class="material-symbols-outlined summary-icon">pie_chart</span>
                <span class="summary-count">{{ tableData?.totalCount || 0 }} 个项目</span>
              </div>
              <button
                class="clean-all-btn"
                :disabled="!tableData?.list || tableData.list.length === 0"
                @click="cleanAllRecycle"
              >
                <span class="material-symbols-outlined">delete_sweep</span>
                <span>清空回收站</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 装饰性渐变进度指示条 -->
        <div class="meter-bar-track">
          <div class="meter-segment seg-doc" style="width: 45%;"></div>
          <div class="meter-segment seg-zip" style="width: 25%;"></div>
          <div class="meter-segment seg-media" style="width: 20%;"></div>
          <div class="meter-segment seg-other" style="width: 10%;"></div>
        </div>
      </div>
    </section>

    <!-- 2. 分类筛选胶囊标签 (横向滚动) -->
    <section class="filter-pills-section">
      <div class="pills-scroll-track">
        <button
          v-for="cat in categoryList"
          :key="cat.key"
          class="cat-pill"
          :class="{ 'is-active': activeCategory === cat.key }"
          @click="selectCategory(cat.key)"
        >
          <span>{{ cat.label }}</span>
          <span class="pill-count" v-if="cat.key === 'all'">{{ tableData?.totalCount || 0 }}</span>
        </button>
      </div>
    </section>

    <!-- 3. 列表控制栏：排序指示与全选操作 -->
    <section class="control-strip">
      <div class="sort-indicator">
        <span>按删除时间</span>
        <span class="material-symbols-outlined">arrow_downward</span>
      </div>

      <div class="selection-controls">
        <button
          class="control-btn"
          @click="toggleSelectAll"
          v-if="filteredList.length > 0"
        >
          <span class="material-symbols-outlined">{{ isAllSelected ? 'deselect' : 'done_all' }}</span>
          <span>{{ isAllSelected ? '取消全选' : '全选' }}</span>
        </button>
      </div>
    </section>

    <!-- 4. 回收站文件列表主体 (Matching _4 cards) -->
    <section class="trash-list-section">
      <div class="trash-cards-container" v-if="filteredList.length > 0">
        <div
          v-for="(row, idx) in filteredList"
          :key="row.fileId || idx"
          class="trash-item-card"
          :class="{ 'is-selected': isRowSelected(row.fileId) }"
          @click="toggleRowSelection(row.fileId)"
        >
          <!-- 复选框勾选指示 -->
          <div class="item-checkbox" @click.stop="toggleRowSelection(row.fileId)">
            <div class="checkbox-circle" :class="{ 'is-checked': isRowSelected(row.fileId) }">
              <span class="material-symbols-outlined" v-if="isRowSelected(row.fileId)">check</span>
            </div>
          </div>

          <!-- 文件类型图标 / 缩略图 -->
          <div class="item-icon-wrapper">
            <div
              v-if="(row.fileType === 3 || row.fileType === 1) && row.status === 2 && row.fileCover"
              class="thumb-box"
            >
              <img :src="proxy.globalInfo.imageUrl + row.fileCover" class="thumb-img" loading="lazy" />
            </div>
            <div v-else class="item-icon-box">
              <Icon v-if="row.folderType === 1" :fileType="0" :width="38"></Icon>
              <Icon v-else :fileType="row.fileType" :width="38"></Icon>
            </div>
          </div>

          <!-- 文件主要信息 -->
          <div class="item-info-col min-w-0">
            <div class="item-title truncate" :title="row.fileName">
              {{ row.fileName }}
            </div>
            <div class="item-meta-row">
              <span class="meta-size" v-if="row.fileSize">{{ proxy.Utils.size2Str(row.fileSize) }}</span>
              <span class="meta-size" v-else-if="row.folderType === 1">文件夹</span>
              <span class="meta-dot">·</span>
              <span class="meta-time">{{ row.recoveryTime || '--' }} 删除</span>
              <span class="meta-dot">·</span>
              <span class="expire-pill">剩余 10 天</span>
            </div>
          </div>

          <!-- 单项操作按钮 -->
          <div class="item-actions-col" @click.stop>
            <button
              class="row-action-btn restore-btn"
              @click="recoverSingle(row)"
              title="一键还原"
            >
              <span class="material-symbols-outlined">settings_backup_restore</span>
            </button>
            <button
              class="row-action-btn delete-btn"
              @click="delSingle(row)"
              title="彻底删除"
            >
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <div class="empty-icon-wrap">
          <span class="material-symbols-outlined">delete_outline</span>
        </div>
        <div class="empty-title">回收站空空如也</div>
        <div class="empty-desc">删除的文件会在此处保留 10 天，您可以随时还原</div>
      </div>
    </section>

    <!-- 5. 分页器 -->
    <div class="pagination-wrap" v-if="tableData?.totalCount > 0">
      <el-pagination
        v-model:current-page="tableData.pageNo"
        v-model:page-size="tableData.pageSize"
        :page-sizes="[15, 30, 50]"
        layout="total, prev, pager, next"
        :total="tableData.totalCount || 0"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 6. 底部固定浮动批量操作栏 (Floating Bottom Bar matching _4/code.html) -->
    <transition name="batch-bar-slide">
      <aside class="floating-batch-bar" v-show="selectIdList.length > 0">
        <div class="batch-bar-inner">
          <div class="batch-bar-left">
            <div class="badge-row">
              <span class="pulse-dot"></span>
              <span class="count-text">已选 {{ selectIdList.length }} 项</span>
            </div>
          </div>

          <div class="batch-bar-right">
            <button class="batch-btn primary-batch-btn" @click="recoverFileBatch">
              <span class="material-symbols-outlined">restore</span>
              <span>还原 ({{ selectIdList.length }})</span>
            </button>
            <button class="batch-btn danger-batch-btn" @click="delFileBatch">
              <span class="material-symbols-outlined">delete_forever</span>
              <span>彻底删除</span>
            </button>
          </div>
        </div>
      </aside>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, getCurrentInstance, onMounted } from 'vue'
import { ElPagination } from 'element-plus'
import Icon from '@/components/Icon.vue'

const { proxy } = getCurrentInstance()

const api = {
  loadRecycleList: '/recycle/loadRecycleList',
  recoverFile: '/recycle/recoverFile',
  delFile: '/recycle/delFile'
}

const tableData = ref({
  list: [],
  pageNo: 1,
  pageSize: 15,
  totalCount: 0
})

const selectIdList = ref([])
const activeCategory = ref('all')

const categoryList = [
  { key: 'all', label: '全部' },
  { key: 'doc', label: '文档' },
  { key: 'image', label: '图片' },
  { key: 'video', label: '视频' },
  { key: 'zip', label: '压缩包' },
  { key: 'folder', label: '文件夹' }
]

const selectCategory = (catKey) => {
  activeCategory.value = catKey
}

const filteredList = computed(() => {
  const list = tableData.value.list || []
  if (activeCategory.value === 'all') return list
  if (activeCategory.value === 'folder') {
    return list.filter(item => item.folderType === 1)
  }
  if (activeCategory.value === 'doc') {
    return list.filter(item => item.fileType === 4 || item.fileType === 5 || item.fileType === 6 || item.fileType === 7)
  }
  if (activeCategory.value === 'image') {
    return list.filter(item => item.fileType === 3)
  }
  if (activeCategory.value === 'video') {
    return list.filter(item => item.fileType === 1)
  }
  if (activeCategory.value === 'zip') {
    return list.filter(item => item.fileType === 9)
  }
  return list
})

const isRowSelected = (fileId) => {
  return selectIdList.value.includes(fileId)
}

const toggleRowSelection = (fileId) => {
  const index = selectIdList.value.indexOf(fileId)
  if (index > -1) {
    selectIdList.value.splice(index, 1)
  } else {
    selectIdList.value.push(fileId)
  }
}

const isAllSelected = computed(() => {
  if (filteredList.value.length === 0) return false
  return filteredList.value.every(item => selectIdList.value.includes(item.fileId))
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectIdList.value = []
  } else {
    selectIdList.value = filteredList.value.map(item => item.fileId)
  }
}

const getFileIconMeta = (row) => {
  if (row.folderType === 1) {
    return { icon: 'folder', containerClass: 'folder-avatar' }
  }
  const type = row.fileType
  switch (type) {
    case 1:
      return { icon: 'movie', containerClass: 'video-avatar' }
    case 2:
      return { icon: 'graphic_eq', containerClass: 'audio-avatar' }
    case 3:
      return { icon: 'image', containerClass: 'image-avatar' }
    case 4:
      return { icon: 'picture_as_pdf', containerClass: 'pdf-avatar' }
    case 5:
      return { icon: 'description', containerClass: 'word-avatar' }
    case 6:
      return { icon: 'table_chart', containerClass: 'excel-avatar' }
    case 7:
      return { icon: 'article', containerClass: 'txt-avatar' }
    case 8:
      return { icon: 'code', containerClass: 'code-avatar' }
    case 9:
      return { icon: 'folder_zip', containerClass: 'zip-avatar' }
    default:
      return { icon: 'insert_drive_file', containerClass: 'default-avatar' }
  }
}

// 加载列表
const loadRecycleList = async () => {
  let params = {
    pageNo: tableData.value.pageNo || 1,
    pageSize: tableData.value.pageSize || 15
  }
  let result = await proxy.request({
    url: api.loadRecycleList,
    params: params
  })
  if (!result) return
  tableData.value = result.data
  selectIdList.value = []
}

const handlePageChange = (page) => {
  tableData.value.pageNo = page
  selectIdList.value = []
  loadRecycleList()
}

// 单个还原
const recoverSingle = (row) => {
  proxy.confirm(`确认还原文件【${row.fileName}】吗？`, async () => {
    let result = await proxy.request({
      url: api.recoverFile,
      params: {
        fileId: row.fileId
      }
    })
    if (!result) return
    proxy.message.success('文件还原成功！')
    loadRecycleList()
  })
}

// 批量还原
const recoverFileBatch = () => {
  if (selectIdList.value.length === 0) return
  proxy.confirm(`确定要还原选中的 ${selectIdList.value.length} 个文件吗？`, async () => {
    let result = await proxy.request({
      url: api.recoverFile,
      params: {
        fileId: selectIdList.value.join(',')
      }
    })
    if (!result) return
    proxy.message.success('文件批量还原成功！')
    loadRecycleList()
  })
}

// 单个删除
const delSingle = (row) => {
  proxy.confirm(`彻底删除【${row.fileName}】后将无法恢复，确认删除吗？`, async () => {
    let result = await proxy.request({
      url: api.delFile,
      params: {
        fileId: row.fileId
      }
    })
    if (!result) return
    proxy.message.success('文件已彻底删除！')
    loadRecycleList()
  })
}

// 批量删除
const delFileBatch = () => {
  if (selectIdList.value.length === 0) return
  proxy.confirm(`彻底删除选中的 ${selectIdList.value.length} 个文件后将无法恢复，确认删除吗？`, async () => {
    let result = await proxy.request({
      url: api.delFile,
      params: {
        fileId: selectIdList.value.join(',')
      }
    })
    if (!result) return
    proxy.message.success('选中文件已彻底删除！')
    loadRecycleList()
  })
}

// 清空回收站
const cleanAllRecycle = () => {
  if (!tableData.value.list || tableData.value.list.length === 0) return
  proxy.confirm('确定要清空回收站的所有文件吗？此操作不可逆！', async () => {
    const allIds = tableData.value.list.map(i => i.fileId).join(',')
    let result = await proxy.request({
      url: api.delFile,
      params: {
        fileId: allIds
      }
    })
    if (!result) return
    proxy.message.success('回收站已清空！')
    loadRecycleList()
  })
}

onMounted(() => {
  loadRecycleList()
})
</script>

<style lang="scss" scoped>
.aether-recycle-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-bottom: 90px;
  box-sizing: border-box;

  // 1. 顶部提示横幅
  .banner-section {
    padding: 6px 12px 10px;

    .cleanup-banner {
      background: #eff4ff;
      border-radius: 14px;
      padding: 12px 14px;
      box-shadow: 0 1px 3px rgba(11, 28, 48, 0.04);
      display: flex;
      flex-direction: column;
      gap: 10px;

      .banner-content {
        display: flex;
        align-items: flex-start;
        gap: 10px;

        .banner-icon-box {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #dbe1ff;
          color: #004ac6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          span {
            font-size: 20px;
          }
        }

        .banner-main-text {
          flex: 1;
          min-width: 0;

          .title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .banner-title {
              font-size: 14px;
              font-weight: 600;
              color: #0b1c30;
              margin: 0;
            }

            .security-badge {
              font-size: 10px;
              font-weight: 600;
              background: #dae2fd;
              color: #5c647a;
              padding: 1px 6px;
              border-radius: 9999px;
            }
          }

          .banner-desc {
            font-size: 11px;
            color: #565e74;
            margin: 4px 0 8px;
            line-height: 1.45;
          }

          .banner-footer-row {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .storage-summary {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 12px;
              color: #0b1c30;
              font-weight: 600;

              .summary-icon {
                font-size: 16px;
                color: #004ac6;
              }
            }

            .clean-all-btn {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 4px 10px;
              border-radius: 8px;
              background: #ffdad6;
              color: #ba1a1a;
              border: none;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.15s;

              span.material-symbols-outlined {
                font-size: 15px;
              }

              &:hover {
                background: #ffb4ab;
              }

              &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
            }
          }
        }
      }

      .meter-bar-track {
        height: 4px;
        width: 100%;
        background: #d3e4fe;
        border-radius: 9999px;
        overflow: hidden;
        display: flex;

        .meter-segment {
          height: 100%;

          &.seg-doc {
            background: #004ac6;
          }

          &.seg-zip {
            background: #ffb95f;
          }

          &.seg-media {
            background: #bec6e0;
          }

          &.seg-other {
            background: #d3e4fe;
          }
        }
      }
    }
  }

  // 2. 分类横向滚动标签
  .filter-pills-section {
    padding: 2px 12px 8px;

    .pills-scroll-track {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      .cat-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 5px 12px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 500;
        background: #eff4ff;
        color: #434655;
        border: none;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s;
        flex-shrink: 0;

        .pill-count {
          font-size: 10px;
          opacity: 0.8;
        }

        &:hover {
          background: #e5eeff;
        }

        &.is-active {
          background: #004ac6;
          color: #ffffff;
          font-weight: 600;
        }
      }
    }
  }

  // 3. 排序与全选栏
  .control-strip {
    padding: 4px 12px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .sort-indicator {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
      color: #434655;
      font-weight: 500;

      span.material-symbols-outlined {
        font-size: 14px;
      }
    }

    .selection-controls {
      display: flex;
      align-items: center;
      gap: 8px;

      .control-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 6px;
        background: transparent;
        border: none;
        color: #004ac6;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;

        span.material-symbols-outlined {
          font-size: 16px;
        }

        &:hover {
          background: #eff4ff;
        }
      }
    }
  }

  // 4. 列表卡片
  .trash-list-section {
    padding: 0 12px;

    .trash-cards-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .trash-item-card {
      background: #ffffff;
      border-radius: 14px;
      padding: 10px 12px;
      box-shadow: 0 1px 3px rgba(11, 28, 48, 0.04);
      border: 1px solid #e5eeff;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        box-shadow: 0 3px 10px rgba(11, 28, 48, 0.08);
      }

      &.is-selected {
        background: #eff4ff;
        border-color: #004ac6;
        box-shadow: 0 0 0 1px #004ac6;
      }

      .item-checkbox {
        flex-shrink: 0;

        .checkbox-circle {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 1.5px solid #c3c6d7;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;

          &.is-checked {
            background: #004ac6;
            border-color: #004ac6;
            color: #ffffff;

            span {
              font-size: 14px;
            }
          }
        }
      }

      .item-icon-wrapper {
        flex-shrink: 0;

        .item-icon-box {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .thumb-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          overflow: hidden;
          background: #e5eeff;

          .thumb-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }
      }

      .item-info-col {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;

        .item-title {
          font-size: 13px;
          font-weight: 600;
          color: #0b1c30;
        }

        .item-meta-row {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #737686;
          flex-wrap: wrap;

          .meta-dot {
            color: #c3c6d7;
          }

          .expire-pill {
            background: #dae2fd;
            color: #5c647a;
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
          }
        }
      }

      .item-actions-col {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;

        .row-action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #eff4ff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;

          span {
            font-size: 18px;
          }

          &.restore-btn {
            color: #004ac6;

            &:hover {
              background: #dbe1ff;
            }
          }

          &.delete-btn {
            color: #ba1a1a;

            &:hover {
              background: #ffdad6;
            }
          }

          &:active {
            transform: scale(0.92);
          }
        }
      }
    }
  }

  // 图标头像
  .icon-avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    span {
      font-size: 22px;
    }

    &.folder-avatar {
      background: #ffddb8;
      color: #784b00;

      .fill-icon {
        font-variation-settings: 'FILL' 1;
      }
    }

    &.pdf-avatar {
      background: #ffdad6;
      color: #ba1a1a;
    }

    &.excel-avatar {
      background: #ecfdf5;
      color: #059669;
    }

    &.word-avatar {
      background: #dae2fd;
      color: #004ac6;
    }

    &.image-avatar {
      background: #e0f2fe;
      color: #0284c7;
    }

    &.video-avatar {
      background: #fef3c7;
      color: #b45309;
    }

    &.audio-avatar {
      background: #ede9fe;
      color: #7c3aed;
    }

    &.zip-avatar {
      background: #e0e7ff;
      color: #4338ca;
    }

    &.code-avatar {
      background: #f1f5f9;
      color: #0f172a;
    }

    &.default-avatar {
      background: #f1f5f9;
      color: #64748b;
    }
  }

  // 空状态
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 16px;
    text-align: center;

    .empty-icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      background: #e5eeff;
      color: #004ac6;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;

      span {
        font-size: 32px;
      }
    }

    .empty-title {
      font-size: 15px;
      font-weight: 600;
      color: #0b1c30;
      margin-bottom: 4px;
    }

    .empty-desc {
      font-size: 12px;
      color: #737686;
    }
  }

  // 分页器
  .pagination-wrap {
    display: flex;
    justify-content: center;
    padding: 16px 12px 6px;
  }

  // 6. 底部固定浮动批量操作条
  .floating-batch-bar {
    position: fixed;
    bottom: 74px;
    left: 12px;
    right: 12px;
    max-width: 460px;
    margin: 0 auto;
    z-index: 100;

    .batch-bar-inner {
      background: rgba(11, 28, 48, 0.94);
      backdrop-filter: blur(12px);
      border-radius: 18px;
      padding: 8px 14px;
      box-shadow: 0 10px 30px rgba(11, 28, 48, 0.25);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;

      .batch-bar-left {
        .badge-row {
          display: flex;
          align-items: center;
          gap: 6px;

          .pulse-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #b4c5ff;
            animation: pulseGlow 1.8s infinite;
          }

          .count-text {
            color: #ffffff;
            font-size: 13px;
            font-weight: 600;
          }
        }
      }

      .batch-bar-right {
        display: flex;
        align-items: center;
        gap: 6px;

        .batch-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          height: 34px;
          padding: 0 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.15s;

          span.material-symbols-outlined {
            font-size: 16px;
          }

          &.primary-batch-btn {
            background: #004ac6;
            color: #ffffff;
            box-shadow: 0 2px 6px rgba(0, 74, 198, 0.35);

            &:hover {
              background: #2563eb;
            }
          }

          &.danger-batch-btn {
            background: rgba(186, 26, 26, 0.3);
            color: #ffdad6;

            &:hover {
              background: rgba(186, 26, 26, 0.5);
            }
          }

          &:active {
            transform: scale(0.96);
          }
        }
      }
    }
  }

  // 批量操作条进入退出动画
  .batch-bar-slide-enter-active,
  .batch-bar-slide-leave-active {
    transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
  }

  .batch-bar-slide-enter-from,
  .batch-bar-slide-leave-to {
    opacity: 0;
    transform: translateY(20px);
  }
}
</style>
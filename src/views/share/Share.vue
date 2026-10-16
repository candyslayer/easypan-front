<template>
  <div class="aether-share-page">
    <!-- 顶部状态横幅 -->
    <section class="banner-section">
      <div class="share-overview-banner">
        <div class="banner-left">
          <div class="banner-icon-circle">
            <span class="material-symbols-outlined">share</span>
          </div>
          <div class="banner-text-col">
            <div class="title-row">
              <h2 class="banner-title">我的共享链接</h2>
              <span class="share-count-tag">{{ tableData?.totalCount || 0 }} 个外链</span>
            </div>
            <p class="banner-desc">管理您已生成的对外共享与提取码链接，可随时中止访问</p>
          </div>
        </div>

        <div class="banner-right">
          <button class="refresh-pill-btn" @click="loadShareList" title="刷新列表">
            <span class="material-symbols-outlined">refresh</span>
            <span>刷新</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 列表控制栏：全选与排序 -->
    <section class="control-strip" v-if="tableData?.list && tableData.list.length > 0">
      <div class="left-tip">
        <span>按分享时间倒序</span>
      </div>

      <div class="right-actions">
        <button class="select-all-btn" @click="toggleSelectAll">
          <span class="material-symbols-outlined">{{ isAllSelected ? 'deselect' : 'done_all' }}</span>
          <span>{{ isAllSelected ? '取消全选' : '全选' }}</span>
        </button>
      </div>
    </section>

    <!-- 分享列表卡片 -->
    <section class="share-list-section">
      <div class="share-cards-container" v-if="tableData?.list && tableData.list.length > 0">
        <div
          v-for="(row, idx) in tableData.list"
          :key="row.shareId || idx"
          class="share-item-card"
          :class="{ 'is-selected': isRowSelected(row.shareId) }"
          @click="toggleRowSelection(row.shareId)"
        >
          <!-- 复选框 -->
          <div class="item-checkbox" @click.stop="toggleRowSelection(row.shareId)">
            <div class="checkbox-circle" :class="{ 'is-checked': isRowSelected(row.shareId) }">
              <span class="material-symbols-outlined" v-if="isRowSelected(row.shareId)">check</span>
            </div>
          </div>

          <!-- 文件图标 / 封面 -->
          <div class="item-icon-wrapper">
            <div
              v-if="(row.fileType === 3 || row.fileType === 1) && row.fileCover"
              class="thumb-box"
            >
              <img :src="proxy.globalInfo.imageUrl + row.fileCover" class="thumb-img" loading="lazy" />
            </div>
            <div v-else class="item-icon-box">
              <Icon v-if="row.folderType === 1" :fileType="0" :width="38"></Icon>
              <Icon v-else :fileType="row.fileType" :width="38"></Icon>
            </div>
          </div>

          <!-- 主要详情 -->
          <div class="item-info-col min-w-0">
            <div class="item-title truncate" :title="row.fileName">
              {{ row.fileName || '分享文件' }}
            </div>

            <!-- 元数据与标签行 -->
            <div class="item-meta-row">
              <span class="code-pill" @click.stop="copyCode(row.code)" title="点击复制提取码">
                <span class="material-symbols-outlined code-icon">key</span>
                <span>{{ row.code }}</span>
              </span>

              <span class="view-pill">
                <span class="material-symbols-outlined view-icon">visibility</span>
                <span>{{ row.showCount || 0 }} 次</span>
              </span>

              <span
                class="expire-pill"
                :class="{ 'is-expired': isExpired(row.expireTime) }"
              >
                {{ row.validType === 3 ? '永久有效' : (isExpired(row.expireTime) ? '已失效' : row.expireTime) }}
              </span>
            </div>
          </div>

          <!-- 操作按钮组 -->
          <div class="item-actions-col" @click.stop>
            <button
              class="row-action-btn copy-btn"
              @click="copyShareLink(row)"
              title="复制分享链接及提取码"
            >
              <span class="material-symbols-outlined">link</span>
            </button>
            <button
              class="row-action-btn cancel-btn"
              @click="cancelShareSingle(row)"
              title="取消外链分享"
            >
              <span class="material-symbols-outlined">link_off</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <div class="empty-icon-wrap">
          <span class="material-symbols-outlined">share</span>
        </div>
        <div class="empty-title">暂无分享链接</div>
        <div class="empty-desc">在“我的文件”中选择文件并点击“分享”，即可生成专属链接</div>
      </div>
    </section>

    <!-- 分页器 -->
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

    <!-- 底部固定浮动批量取消栏 -->
    <transition name="batch-bar-slide">
      <aside class="floating-batch-bar" v-show="selectIdList.length > 0">
        <div class="batch-bar-inner">
          <div class="batch-bar-left">
            <span class="pulse-dot"></span>
            <span class="count-text">已选 {{ selectIdList.length }} 项分享</span>
          </div>

          <div class="batch-bar-right">
            <button class="batch-btn danger-batch-btn" @click="cancelShareBatch">
              <span class="material-symbols-outlined">link_off</span>
              <span>取消分享 ({{ selectIdList.length }})</span>
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
  loadShareList: '/share/loadShareList',
  cancelShare: '/share/cancelShare'
}

const tableData = ref({
  list: [],
  pageNo: 1,
  pageSize: 15,
  totalCount: 0
})

const selectIdList = ref([])

const isExpired = (expireTime) => {
  if (!expireTime) return false
  return new Date(expireTime).getTime() < new Date().getTime()
}

const isRowSelected = (shareId) => {
  return selectIdList.value.includes(shareId)
}

const toggleRowSelection = (shareId) => {
  const index = selectIdList.value.indexOf(shareId)
  if (index > -1) {
    selectIdList.value.splice(index, 1)
  } else {
    selectIdList.value.push(shareId)
  }
}

const isAllSelected = computed(() => {
  const list = tableData.value?.list || []
  if (list.length === 0) return false
  return list.every(item => selectIdList.value.includes(item.shareId))
})

const toggleSelectAll = () => {
  const list = tableData.value?.list || []
  if (isAllSelected.value) {
    selectIdList.value = []
  } else {
    selectIdList.value = list.map(item => item.shareId)
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

const loadShareList = async () => {
  let params = {
    pageNo: tableData.value.pageNo || 1,
    pageSize: tableData.value.pageSize || 15
  }
  let result = await proxy.request({
    url: api.loadShareList,
    params: params
  })
  if (!result) return
  tableData.value = result.data
  selectIdList.value = []
}

const handlePageChange = (page) => {
  tableData.value.pageNo = page
  selectIdList.value = []
  loadShareList()
}

const copyCode = (code) => {
  navigator.clipboard.writeText(code).then(() => {
    proxy.message.success('提取码已复制！')
  }).catch(() => {
    proxy.message.info(`提取码：${code}`)
  })
}

const copyShareLink = (row) => {
  const shareUrl = `${window.location.origin}/share/${row.shareId}`
  const shareText = `链接: ${shareUrl} 提取码: ${row.code}`
  navigator.clipboard.writeText(shareText).then(() => {
    proxy.message.success('分享链接与提取码已复制！')
  }).catch(() => {
    proxy.message.info(shareText)
  })
}

const cancelShareSingle = (row) => {
  proxy.confirm(`确定取消分享【${row.fileName || '该文件'}】吗？`, async () => {
    let result = await proxy.request({
      url: api.cancelShare,
      params: {
        shareId: row.shareId
      }
    })
    if (!result) return
    proxy.message.success('已取消分享！')
    loadShareList()
  })
}

const cancelShareBatch = () => {
  if (selectIdList.value.length === 0) return
  proxy.confirm(`确定取消选中的 ${selectIdList.value.length} 个分享吗？`, async () => {
    let result = await proxy.request({
      url: api.cancelShare,
      params: {
        shareId: selectIdList.value.join(',')
      }
    })
    if (!result) return
    proxy.message.success('已批量取消分享！')
    loadShareList()
  })
}

onMounted(() => {
  loadShareList()
})
</script>

<style lang="scss" scoped>
.aether-share-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-bottom: 90px;
  box-sizing: border-box;

  .banner-section {
    padding: 6px 12px 10px;

    .share-overview-banner {
      background: #eff4ff;
      border-radius: 14px;
      padding: 12px 14px;
      box-shadow: 0 1px 3px rgba(11, 28, 48, 0.04);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;

      .banner-left {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;

        .banner-icon-circle {
          width: 38px;
          height: 38px;
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

        .banner-text-col {
          display: flex;
          flex-direction: column;
          min-width: 0;

          .title-row {
            display: flex;
            align-items: center;
            gap: 6px;

            .banner-title {
              font-size: 14px;
              font-weight: 700;
              color: #0b1c30;
              margin: 0;
            }

            .share-count-tag {
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
            margin: 2px 0 0;
            line-height: 1.35;
          }
        }
      }

      .banner-right {
        flex-shrink: 0;

        .refresh-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 9999px;
          background: #ffffff;
          border: 1px solid #dce9ff;
          color: #004ac6;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;

          span {
            font-size: 16px;
          }

          &:hover {
            background: #e5eeff;
          }

          &:active {
            transform: scale(0.95);
          }
        }
      }
    }
  }

  .control-strip {
    padding: 4px 12px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .left-tip {
      font-size: 12px;
      color: #737686;
    }

    .right-actions {
      .select-all-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: transparent;
        border: none;
        color: #004ac6;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 6px;

        span {
          font-size: 16px;
        }

        &:hover {
          background: #eff4ff;
        }
      }
    }
  }

  .share-list-section {
    padding: 0 12px;

    .share-cards-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .share-item-card {
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
        gap: 4px;

        .item-title {
          font-size: 13px;
          font-weight: 600;
          color: #0b1c30;
        }

        .item-meta-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;

          .code-pill {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            padding: 1px 6px;
            border-radius: 4px;
            background: #eff4ff;
            color: #004ac6;
            font-size: 11px;
            font-weight: 600;
            font-family: 'JetBrains Mono', monospace;
            cursor: pointer;

            .code-icon {
              font-size: 12px;
            }

            &:hover {
              background: #dbe1ff;
            }
          }

          .view-pill {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            font-size: 11px;
            color: #565e74;

            .view-icon {
              font-size: 13px;
            }
          }

          .expire-pill {
            font-size: 10px;
            font-weight: 500;
            padding: 1px 6px;
            border-radius: 4px;
            background: #eff4ff;
            color: #565e74;

            &.is-expired {
              background: #ffdad6;
              color: #ba1a1a;
              font-weight: 600;
            }
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

          &.copy-btn {
            color: #004ac6;

            &:hover {
              background: #dbe1ff;
            }
          }

          &.cancel-btn {
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

    &.pdf-avatar { background: #ffdad6; color: #ba1a1a; }
    &.excel-avatar { background: #ecfdf5; color: #059669; }
    &.word-avatar { background: #dae2fd; color: #004ac6; }
    &.image-avatar { background: #e0f2fe; color: #0284c7; }
    &.video-avatar { background: #fef3c7; color: #b45309; }
    &.audio-avatar { background: #ede9fe; color: #7c3aed; }
    &.zip-avatar { background: #e0e7ff; color: #4338ca; }
    &.code-avatar { background: #f1f5f9; color: #0f172a; }
    &.default-avatar { background: #f1f5f9; color: #64748b; }
  }

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
      max-width: 260px;
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    padding: 16px 12px 6px;
  }

  .floating-batch-bar {
    position: fixed;
    bottom: 74px;
    left: 12px;
    right: 12px;
    max-width: 440px;
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

      .batch-bar-right {
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
          background: rgba(186, 26, 26, 0.3);
          color: #ffdad6;
          transition: all 0.15s;

          span {
            font-size: 16px;
          }

          &:hover {
            background: rgba(186, 26, 26, 0.5);
          }

          &:active {
            transform: scale(0.96);
          }
        }
      }
    }
  }

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
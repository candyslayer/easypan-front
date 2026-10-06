<template>
  <div class="share-page">
    <!-- 顶部操作栏 -->
    <div class="share-header">
      <div class="share-title-box">
        <span class="dripicons-direction share-header-icon"></span>
        <span class="share-title-text">我的分享</span>
      </div>
      <div class="share-actions">
        <el-button
          type="danger"
          size="small"
          class="action-btn"
          :disabled="selectIdList.length === 0"
          @click="cancelShareBatch"
        >
          <span class="dripicons-cross btn-icon"></span>
          取消分享({{ selectIdList.length }})
        </el-button>
        <el-button
          type="primary"
          link
          size="small"
          @click="loadShareList"
        >
          <span class="dripicons-clockwise btn-icon"></span>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 分享列表内容 -->
    <div class="share-content">
      <Table
        ref="tableRef"
        :data-source="tableData"
        :columns="columns"
        :options="tableOptions"
        :fetch="loadShareList"
        @rowSelected="handleRowSelected"
      >
        <!-- 文件名插槽 -->
        <template #fileName="{ row }">
          <div class="file-item-cell">
            <template v-if="(row.fileType === 3 || row.fileType === 1)">
              <Icon :cover="row.fileCover" :width="32"></Icon>
            </template>
            <template v-else>
              <Icon v-if="row.folderType === 0" :fileType="row.fileType"></Icon>
              <Icon v-if="row.folderType === 1" :fileType="0"></Icon>
            </template>
            <div class="file-meta">
              <span class="file-name-text" :title="row.fileName">{{ row.fileName || '分享文件' }}</span>
              <span class="mobile-sub-info">
                提取码: <b>{{ row.code }}</b> | 浏览: {{ row.showCount || 0 }}次
              </span>
            </div>
          </div>
        </template>

        <!-- 分享时间 -->
        <template #shareTime="{ row }">
          <span class="time-text">{{ row.shareTime || '--' }}</span>
        </template>

        <!-- 失效时间 -->
        <template #expireTime="{ row }">
          <span
            class="expire-text"
            :class="{ 'is-expired': isExpired(row.expireTime) }"
          >
            {{ row.validType === 3 ? '永久有效' : (row.expireTime || '--') }}
          </span>
        </template>

        <!-- 提取码 -->
        <template #code="{ row }">
          <el-tag size="small" type="info" class="code-tag" @click="copyCode(row.code)">
            {{ row.code }}
          </el-tag>
        </template>

        <!-- 浏览次数 -->
        <template #showCount="{ row }">
          <span class="count-text">{{ row.showCount || 0 }}</span>
        </template>

        <!-- 操作 -->
        <template #op="{ row }">
          <div class="row-op-btns">
            <el-button
              type="primary"
              link
              size="small"
              @click.stop="copyShareLink(row)"
            >
              <span class="dripicons-link op-icon"></span>
              复制链接
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click.stop="cancelShareSingle(row)"
            >
              <span class="dripicons-cross op-icon"></span>
              取消
            </el-button>
          </div>
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { ElButton, ElTag } from 'element-plus'
import Table from '@/components/Table.vue'
import Icon from '@/components/Icon.vue'

const { proxy } = getCurrentInstance()

const api = {
  loadShareList: '/share/loadShareList',
  cancelShare: '/share/cancelShare'
}

const tableData = ref({})
const tableRef = ref()
const selectIdList = ref([])

const columns = [
  {
    prop: 'fileName',
    label: '文件名',
    scopedSlots: 'fileName'
  },
  {
    prop: 'shareTime',
    label: '分享时间',
    width: 155,
    scopedSlots: 'shareTime'
  },
  {
    prop: 'expireTime',
    label: '失效时间',
    width: 155,
    scopedSlots: 'expireTime'
  },
  {
    prop: 'code',
    label: '提取码',
    width: 80,
    align: 'center',
    scopedSlots: 'code'
  },
  {
    prop: 'showCount',
    label: '浏览',
    width: 70,
    align: 'center',
    scopedSlots: 'showCount'
  },
  {
    prop: 'op',
    label: '操作',
    width: 150,
    align: 'center',
    scopedSlots: 'op'
  }
]

const tableOptions = reactive({
  stripe: false,
  border: false,
  selectType: 'checkbox',
  extHeight: 50
})

// 判断是否过期
const isExpired = (expireTime) => {
  if (!expireTime) return false
  return new Date(expireTime).getTime() < new Date().getTime()
}

// 加载分享列表
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

// 多选
const handleRowSelected = (rows) => {
  selectIdList.value = rows.map((item) => item.shareId)
}

// 复制提取码
const copyCode = (code) => {
  navigator.clipboard.writeText(code).then(() => {
    proxy.message.success('提取码已复制到剪贴板！')
  }).catch(() => {
    proxy.message.info(`提取码：${code}`)
  })
}

// 复制分享完整链接
const copyShareLink = (row) => {
  const shareUrl = `${window.location.origin}/share/${row.shareId}`
  const shareText = `链接: ${shareUrl} 提取码: ${row.code}`
  navigator.clipboard.writeText(shareText).then(() => {
    proxy.message.success('分享链接与提取码已复制！')
  }).catch(() => {
    proxy.message.info(`分享链接: ${shareUrl} 提取码: ${row.code}`)
  })
}

// 单个取消分享
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

// 批量取消分享
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
.share-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px 15px;
  box-sizing: border-box;
  animation: fadeInSlideUp 0.35s cubic-bezier(0.25, 1, 0.5, 1) forwards;

  .share-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    border-radius: 8px;
    padding: 10px 16px;
    margin-bottom: 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .share-title-box {
      display: flex;
      align-items: center;
      gap: 6px;

      .share-header-icon {
        color: #409eff;
        font-size: 16px;
        animation: floatGentle 2.8s ease-in-out infinite;
      }

      .share-title-text {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }
    }

    .share-actions {
      display: flex;
      align-items: center;
      gap: 10px;

      .action-btn {
        display: inline-flex;
        align-items: center;
        border-radius: 6px;

        .btn-icon {
          margin-right: 4px;
          font-size: 12px;
        }
      }
    }
  }

  .share-content {
    flex: 1;
    background: #fff;
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    overflow: hidden;

    :deep(.el-table__row) {
      transition: background-color 0.2s ease;

      &:hover {
        .file-item-cell {
          transform: translateX(4px);
        }
      }
    }

    .file-item-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      transition: transform 0.2s ease;

      .file-meta {
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .file-name-text {
          font-size: 14px;
          color: #303133;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mobile-sub-info {
          display: none;
          font-size: 11px;
          color: #909399;
          margin-top: 2px;
        }
      }
    }

    .time-text {
      font-size: 13px;
      color: #606266;
    }

    .expire-text {
      font-size: 13px;
      color: #67c23a;

      &.is-expired {
        color: #f56c6c;
      }
    }

    .code-tag {
      cursor: pointer;
      font-family: monospace;
      font-weight: 600;
    }

    .count-text {
      font-size: 13px;
      color: #909399;
    }

    .row-op-btns {
      display: flex;
      justify-content: center;
      gap: 4px;

      .op-icon {
        margin-right: 2px;
      }
    }
  }
}

// 移动端/小程序适配
@media screen and (max-width: 768px) {
  .share-page {
    padding: 6px 8px;

    .share-header {
      padding: 8px 10px;
    }

    .share-content {
      padding: 4px;

      .file-item-cell {
        .file-meta {
          .mobile-sub-info {
            display: block;
          }
        }
      }
    }
  }
}
</style>
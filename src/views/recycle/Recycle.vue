<template>
  <div class="recycle-page">
    <!-- 顶部操作栏与提示 -->
    <div class="recycle-header">
      <div class="recycle-tip">
        <span class="dripicons-information tip-icon"></span>
        <span class="tip-text">回收站文件为您保留10天，过期将自动永久清理</span>
      </div>
      <div class="recycle-actions">
        <el-button
          type="success"
          size="small"
          class="action-btn"
          :disabled="selectIdList.length === 0"
          @click="recoverFileBatch"
        >
          <span class="dripicons-clockwise btn-icon"></span>
          还原({{ selectIdList.length }})
        </el-button>
        <el-button
          type="danger"
          size="small"
          class="action-btn"
          :disabled="selectIdList.length === 0"
          @click="delFileBatch"
        >
          <span class="dripicons-trash btn-icon"></span>
          彻底删除
        </el-button>
      </div>
    </div>

    <!-- 回收站文件列表 -->
    <div class="recycle-content">
      <Table
        ref="tableRef"
        :data-source="tableData"
        :columns="columns"
        :options="tableOptions"
        :fetch="loadRecycleList"
        @rowSelected="handleRowSelected"
      >
        <!-- 文件名列 -->
        <template #fileName="{ row }">
          <div class="file-item-cell">
            <template v-if="(row.fileType === 3 || row.fileType === 1) && row.status === 2">
              <Icon :cover="row.fileCover" :width="32"></Icon>
            </template>
            <template v-else>
              <Icon v-if="row.folderType === 0" :fileType="row.fileType"></Icon>
              <Icon v-if="row.folderType === 1" :fileType="0"></Icon>
            </template>
            <span class="file-name-text" :title="row.fileName">{{ row.fileName }}</span>
          </div>
        </template>

        <!-- 文件大小列 -->
        <template #fileSize="{ row }">
          <span class="file-size-text">
            {{ row.fileSize ? proxy.Utils.size2Str(row.fileSize) : '--' }}
          </span>
        </template>

        <!-- 进入回收站时间列 -->
        <template #recoveryTime="{ row }">
          <span class="file-time-text">{{ row.recoveryTime || '--' }}</span>
        </template>

        <!-- 操作列 -->
        <template #op="{ row }">
          <div class="row-op-btns">
            <el-button
              type="primary"
              link
              size="small"
              title="还原"
              @click.stop="recoverSingle(row)"
            >
              <span class="dripicons-clockwise op-icon"></span>
              还原
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              title="彻底删除"
              @click.stop="delSingle(row)"
            >
              <span class="dripicons-trash op-icon"></span>
              删除
            </el-button>
          </div>
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { ElButton } from 'element-plus'
import Table from '@/components/Table.vue'
import Icon from '@/components/Icon.vue'

const { proxy } = getCurrentInstance()

const api = {
  loadRecycleList: '/recycle/loadRecycleList',
  recoverFile: '/recycle/recoverFile',
  delFile: '/recycle/delFile'
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
    prop: 'recoveryTime',
    label: '回收时间',
    width: 160,
    scopedSlots: 'recoveryTime'
  },
  {
    prop: 'fileSize',
    label: '大小',
    width: 90,
    scopedSlots: 'fileSize'
  },
  {
    prop: 'op',
    label: '操作',
    width: 140,
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
  if (!result) {
    return
  }
  tableData.value = result.data
  selectIdList.value = []
}

// 多选变化
const handleRowSelected = (rows) => {
  selectIdList.value = rows.map((item) => item.fileId)
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

onMounted(() => {
  loadRecycleList()
})
</script>

<style lang="scss" scoped>
.recycle-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px 15px;
  box-sizing: border-box;
  animation: fadeInSlideUp 0.35s cubic-bezier(0.25, 1, 0.5, 1) forwards;

  .recycle-header {
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

    .recycle-tip {
      display: flex;
      align-items: center;
      color: #909399;
      font-size: 13px;

      .tip-icon {
        margin-right: 6px;
        color: #e6a23c;
        font-size: 16px;
        animation: floatGentle 2.5s ease-in-out infinite;
      }
    }

    .recycle-actions {
      display: flex;
      gap: 10px;

      .action-btn {
        display: inline-flex;
        align-items: center;
        border-radius: 6px;
        font-weight: 500;

        .btn-icon {
          margin-right: 4px;
          font-size: 12px;
        }
      }
    }
  }

  .recycle-content {
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

      .file-name-text {
        font-size: 14px;
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .file-size-text,
    .file-time-text {
      font-size: 13px;
      color: #606266;
    }

    .row-op-btns {
      display: flex;
      justify-content: center;
      gap: 6px;

      .op-icon {
        margin-right: 2px;
      }
    }
  }
}

// 小程序 / 移动端自适应优化
@media screen and (max-width: 768px) {
  .recycle-page {
    padding: 6px 8px;

    .recycle-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 10px;

      .recycle-tip {
        font-size: 12px;
      }

      .recycle-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }

    .recycle-content {
      padding: 4px;
    }
  }
}
</style>
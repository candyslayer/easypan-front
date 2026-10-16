<template>
  <div class="aether-transfer-panel">
    <!-- 顶部状态栏 -->
    <div class="transfer-header-row">
      <div class="header-left">
        <h2 class="section-title">传输任务中心</h2>
        <span class="tips-text">（仅展示当前会话任务）</span>
      </div>
      <div class="header-right" v-if="activeUploadingCount > 0">
        <span class="live-indicator-dot"></span>
        <span class="live-status-text">{{ activeUploadingCount }} 个任务进行中</span>
      </div>
    </div>

    <!-- 分段标签控制器 (Segmented Tab Control matching _1/code.html) -->
    <div class="segment-tabs-bar">
      <button
        class="tab-btn"
        :class="{ 'is-active': currentTab === 'uploading' }"
        @click="currentTab = 'uploading'"
      >
        <span>正在上传</span>
        <span class="tab-badge" v-if="activeUploadingCount > 0">{{ activeUploadingCount }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ 'is-active': currentTab === 'completed' }"
        @click="currentTab = 'completed'"
      >
        <span>已完成</span>
        <span class="tab-sub-count">({{ completedCount }})</span>
      </button>

      <button
        class="tab-btn"
        :class="{ 'is-active': currentTab === 'all' }"
        @click="currentTab = 'all'"
      >
        <span>全部任务</span>
        <span class="tab-sub-count">({{ fileList.length }})</span>
      </button>
    </div>

    <!-- 传输任务卡片列表 -->
    <div class="tasks-scroll-list">
      <div
        v-for="(item, index) in displayList"
        :key="item.uid || index"
        class="transfer-task-card"
      >
        <div class="task-top-row">
          <div class="task-info-left">
            <!-- 类型图标容器 -->
            <div
              class="task-icon-avatar"
              :class="{
                'bg-blue-avatar': item.status === STATUS.uploading.value,
                'bg-amber-avatar': item.status === STATUS.init.value,
                'bg-green-avatar': item.status === STATUS.upload_finish.value || item.status === STATUS.upload_seconds.value,
                'bg-red-avatar': item.status === STATUS.fail.value || item.status === STATUS.emptyfile.value
              }"
            >
              <span class="material-symbols-outlined" v-if="item.status === STATUS.upload_finish.value || item.status === STATUS.upload_seconds.value">check_circle</span>
              <span class="material-symbols-outlined" v-else-if="item.status === STATUS.init.value">hourglass_top</span>
              <span class="material-symbols-outlined" v-else-if="item.status === STATUS.fail.value">error</span>
              <span class="material-symbols-outlined" v-else>upload</span>
            </div>

            <div class="task-text-col min-w-0">
              <span class="task-name truncate" :title="item.fileName">{{ item.fileName }}</span>
              <div class="task-sub-status">
                <span :style="{ color: STATUS[item.status].color }" class="status-desc">
                  {{ item.status === 'fail' ? item.errorMsg : STATUS[item.status].desc }}
                </span>
                <span class="status-sep" v-if="item.status === STATUS.uploading.value">·</span>
                <span class="size-progress" v-if="item.status === STATUS.uploading.value">
                  {{ proxy.Utils.size2Str(item.uploadSize) }} / {{ proxy.Utils.size2Str(item.totalSize) }}
                </span>
                <span class="size-progress" v-else-if="item.totalSize">
                  {{ proxy.Utils.size2Str(item.totalSize) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 右侧操作按钮组 -->
          <div class="task-actions-right">
            <!-- 暂停 / 继续上传 -->
            <button
              class="action-circle-btn"
              v-if="item.status === STATUS.uploading.value"
              @click="item.pause ? startUpload(item.uid) : pauseUpload(item.uid)"
              :title="item.pause ? '继续上传' : '暂停上传'"
            >
              <span class="material-symbols-outlined">{{ item.pause ? 'play_arrow' : 'pause' }}</span>
            </button>

            <!-- 删除 / 移除任务 -->
            <button
              class="action-circle-btn del-btn"
              @click="delTransfer(item.uid, index)"
              title="清除任务"
            >
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>

        <!-- 进度条 -->
        <div
          class="task-progress-bar"
          v-if="
            item.status === STATUS.uploading.value ||
            item.status === STATUS.upload_seconds.value ||
            item.status === STATUS.upload_finish.value
          "
        >
          <div
            class="progress-fill"
            :style="{ width: item.uploadProgress + '%' }"
            :class="{ 'is-completed': item.uploadProgress === 100 }"
          ></div>
        </div>

        <!-- MD5 计算分片进度 -->
        <div class="md5-progress-row" v-if="item.status === STATUS.init.value">
          <span class="md5-text">正在极速计算哈希分片：{{ item.md5Progress }}%</span>
          <div class="md5-bar">
            <div class="md5-fill" :style="{ width: item.md5Progress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 空任务状态 -->
      <div class="empty-transfer" v-if="displayList.length === 0">
        <div class="empty-icon-wrap">
          <span class="material-symbols-outlined">cloud_sync</span>
        </div>
        <div class="empty-title">当前没有传输任务</div>
        <div class="empty-desc">上传的文件或下载任务将在此处实时显示传输进度</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import SparkMD5 from 'spark-md5';
import { getCurrentInstance, inject, onMounted, ref, computed } from 'vue';

const { proxy } = getCurrentInstance()

const api = {
  uploadFile: "/file/uploadFile"
}

const currentTab = ref('uploading') // 'uploading' | 'completed' | 'all'

const STATUS = {
  emptyfile: {
    value: "emptyfile",
    desc: "文件为空",
    color: "#ba1a1a",
    icon: "close",
  },
  fail: {
    value: "fail",
    desc: "上传失败",
    color: "#ba1a1a",
    icon: "close",
  },
  init: {
    value: "init",
    desc: "解析中",
    color: "#784b00",
    icon: "clock",
  },
  uploading: {
    value: "uploading",
    desc: "上传中",
    color: "#004ac6",
    icon: "upload",
  },
  upload_finish: {
    value: "upload_finish",
    desc: "上传完成",
    color: "#10b981",
    icon: "ok",
  },
  upload_seconds: {
    value: "upload_seconds",
    desc: "极速秒传",
    color: "#10b981",
    icon: "ok",
  },
}

// 分片大小 5MB
const chunkSize = 1024 * 1024 * 5

// 文件列表
const fileList = ref([])

// 删除文件的 id 记录
const delFile = ref([])

const activeUploadingCount = computed(() => {
  return fileList.value.filter(
    item => item.status === STATUS.uploading.value || item.status === STATUS.init.value
  ).length
})

const completedCount = computed(() => {
  return fileList.value.filter(
    item => item.status === STATUS.upload_finish.value || item.status === STATUS.upload_seconds.value
  ).length
})

const displayList = computed(() => {
  if (currentTab.value === 'uploading') {
    return fileList.value.filter(
      item => item.status === STATUS.uploading.value || item.status === STATUS.init.value || item.status === STATUS.fail.value
    )
  }
  if (currentTab.value === 'completed') {
    return fileList.value.filter(
      item => item.status === STATUS.upload_finish.value || item.status === STATUS.upload_seconds.value
    )
  }
  return fileList.value
})

// 添加上传文件
const addFile = async (file, filePid) => {
  const fileItem = {
    file: file,
    uid: file.uid,
    md5Progress: 0,
    md5: null,
    fileName: file.name,
    status: STATUS.init.value,
    uploadSize: 0,
    totalSize: file.size,
    uploadProgress: 0,
    pause: false,
    chunkIndex: 0,
    filePid: filePid,
    errorMsg: null,
  }

  fileList.value.unshift(fileItem)
  currentTab.value = 'uploading'

  if (fileItem.totalSize == 0) {
    fileItem.status = STATUS.emptyfile.value
    return
  }

  let md5FileUid = await computeMd5(fileItem)
  if (md5FileUid == null) return

  uploadFile(md5FileUid)
}

defineExpose({
  addFile
})

// 上传文件分片
const emit = defineEmits(['uploadCallback'])
const uploadFile = async (uid, chunkIndex) => {
  chunkIndex = chunkIndex ? chunkIndex : 0
  let currentFile = getFileByUid(uid)
  if (!currentFile) return

  const file = currentFile.file
  const fileSize = currentFile.totalSize
  const chunks = Math.ceil(fileSize / chunkSize)

  for (let i = chunkIndex; i < chunks; i++) {
    let delIndex = delFile.value.indexOf(uid)
    if (delIndex != -1) {
      delFile.value.splice(delIndex, 1)
      break
    }

    if (currentFile.pause) break

    let start = i * chunkSize
    let end = start + chunkSize >= fileSize ? fileSize : start + chunkSize
    let chunkFile = file.slice(start, end)

    let uploadResult = await proxy.request({
      url: api.uploadFile,
      showLoading: false,
      dataType: 'file',
      params: {
        file: chunkFile,
        fileName: file.name,
        fileMd5: currentFile.md5,
        chunkIndex: i,
        chunks: chunks,
        fileId: currentFile.fileId,
        filePid: currentFile.filePid,
      },
      showError: false,
      errorCallback: (errorMsg) => {
        currentFile.status = STATUS.fail.value
        currentFile.errorMsg = errorMsg
      },
      uploadProgressCallback: (event) => {
        let loaded = event.loaded
        if (loaded > fileSize) {
          loaded = fileSize
        }
        currentFile.uploadSize = i * chunkSize + loaded
        currentFile.uploadProgress = Math.floor(
          (currentFile.uploadSize / fileSize) * 100
        )
      },
    })

    if (uploadResult == null) break

    currentFile.fileId = uploadResult.data.fileId
    currentFile.status = STATUS[uploadResult.data.status].value
    currentFile.chunkIndex = i

    if (
      uploadResult.data.status == STATUS.upload_seconds.value ||
      uploadResult.data.status == STATUS.upload_finish.value
    ) {
      currentFile.uploadProgress = 100
      emit("uploadCallback")
      break
    }
  }
}

// 计算 md5
let computeMd5 = (fileItem) => {
  let file = fileItem.file
  let blobSlice =
    File.prototype.slice ||
    File.prototype.mozSlice ||
    File.prototype.webkitSlice
  let chunks = Math.ceil(file.size / chunkSize)
  let currentChunk = 0
  let spark = new SparkMD5.ArrayBuffer()
  let fileReader = new FileReader()

  let loadNext = () => {
    let start = currentChunk * chunkSize
    let end = start + chunkSize >= file.size ? file.size : start + chunkSize
    fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
  }

  loadNext()

  return new Promise((resolve, reject) => {
    let resultFile = getFileByUid(file.uid)

    fileReader.onload = (e) => {
      spark.append(e.target.result)
      currentChunk++

      if (currentChunk < chunks) {
        let percent = Math.floor((currentChunk / chunks) * 100)
        resultFile.md5Progress = percent
        loadNext()
      } else {
        let md5 = spark.end()
        spark.destroy()
        resultFile.md5Progress = 100
        resultFile.status = STATUS.uploading.value
        resultFile.md5 = md5
        resolve(fileItem.uid)
      }
    }
  }).catch(() => null)
}

const getFileByUid = (uid) => {
  return fileList.value.find((item) => item.file.uid == uid)
}

// 继续上传
const startUpload = (uid) => {
  const fileItem = getFileByUid(uid)
  if (fileItem) {
    fileItem.pause = false
    uploadFile(uid, fileItem.chunkIndex)
  }
}

// 暂停上传
const pauseUpload = (uid) => {
  const fileItem = getFileByUid(uid)
  if (fileItem) {
    fileItem.pause = true
  }
}

// 删除传输项
const delTransfer = (uid, index) => {
  if (fileList.value[index]?.status === STATUS.uploading.value) {
    delFile.value.push(uid)
  }
  fileList.value.splice(index, 1)
}
</script>

<style lang="scss" scoped>
.aether-transfer-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 10px 14px 80px;
  box-sizing: border-box;

  .transfer-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .header-left {
      display: flex;
      align-items: baseline;
      gap: 8px;

      .section-title {
        font-size: 16px;
        font-weight: 700;
        color: #0b1c30;
        margin: 0;
      }

      .tips-text {
        font-size: 11px;
        color: #737686;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 6px;

      .live-indicator-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #004ac6;
        animation: pulseGlow 1.8s infinite;
      }

      .live-status-text {
        font-size: 12px;
        font-weight: 600;
        color: #004ac6;
      }
    }
  }

  // 分段控制标签
  .segment-tabs-bar {
    display: flex;
    background: #e5eeff;
    padding: 3px;
    border-radius: 12px;
    margin-bottom: 12px;

    .tab-btn {
      flex: 1;
      height: 34px;
      border-radius: 9px;
      border: none;
      background: transparent;
      color: #565e74;
      font-size: 13px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);

      &.is-active {
        background: #ffffff;
        color: #004ac6;
        font-weight: 600;
        box-shadow: 0 1px 4px rgba(11, 28, 48, 0.08);
      }

      .tab-badge {
        background: #004ac6;
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        border-radius: 9999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .tab-sub-count {
        font-size: 11px;
        opacity: 0.75;
      }
    }
  }

  // 任务卡片列表
  .tasks-scroll-list {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .transfer-task-card {
      background: #ffffff;
      border-radius: 14px;
      padding: 12px 14px;
      box-shadow: 0 1px 4px rgba(11, 28, 48, 0.04);
      border: 1px solid #e5eeff;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: all 0.2s;

      &:hover {
        box-shadow: 0 4px 12px rgba(11, 28, 48, 0.08);
      }

      .task-top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;

        .task-info-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;

          .task-icon-avatar {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;

            span {
              font-size: 20px;
            }

            &.bg-blue-avatar {
              background: #dbe1ff;
              color: #004ac6;
            }

            &.bg-amber-avatar {
              background: #ffddb8;
              color: #784b00;
            }

            &.bg-green-avatar {
              background: #d1fae5;
              color: #059669;
            }

            &.bg-red-avatar {
              background: #ffdad6;
              color: #ba1a1a;
            }
          }

          .task-text-col {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .task-name {
              font-size: 13px;
              font-weight: 600;
              color: #0b1c30;
            }

            .task-sub-status {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 11px;

              .status-desc {
                font-weight: 500;
              }

              .status-sep {
                color: #c3c6d7;
              }

              .size-progress {
                color: #737686;
                font-family: 'JetBrains Mono', monospace;
              }
            }
          }
        }

        .task-actions-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;

          .action-circle-btn {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            border: none;
            background: #eff4ff;
            color: #004ac6;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s;

            span {
              font-size: 18px;
            }

            &:hover {
              background: #dbe1ff;
            }

            &.del-btn {
              color: #737686;

              &:hover {
                background: #ffdad6;
                color: #ba1a1a;
              }
            }

            &:active {
              transform: scale(0.92);
            }
          }
        }
      }

      .task-progress-bar {
        height: 5px;
        width: 100%;
        background: #eff4ff;
        border-radius: 9999px;
        overflow: hidden;

        .progress-fill {
          height: 100%;
          background: #004ac6;
          border-radius: 9999px;
          transition: width 0.2s ease;

          &.is-completed {
            background: #10b981;
          }
        }
      }

      .md5-progress-row {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .md5-text {
          font-size: 11px;
          color: #784b00;
        }

        .md5-bar {
          height: 4px;
          width: 100%;
          background: #ffddb8;
          border-radius: 9999px;
          overflow: hidden;

          .md5-fill {
            height: 100%;
            background: #f59e0b;
            transition: width 0.15s;
          }
        }
      }
    }

    .empty-transfer {
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
        max-width: 280px;
      }
    }
  }
}
</style>
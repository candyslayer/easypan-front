<template>
  <div class="transfer-panel">
    <!-- 顶部标题 -->
    <div class="transfer-title">
      <span>传输列表</span>
      <span class="tips">（仅展示本次传输任务）</span>
    </div>

    <!-- 文件列表 -->
    <div class="file-list">
      <div v-for="(item, index) in fileList" class="file-item">
        <!-- 文件传输信息面板 -->
        <div class="transfer-panel">
          <!-- 文件名 -->
          <div class="file-name">{{ item.fileName }}</div>
          <!-- 进度条 -->
          <div class="progress">
            <el-progress :percentage="item.uploadProgress" v-if="item.status == STATUS.uploading.value ||
              item.status == STATUS.upload_seconds.value ||
              item.status == STATUS.upload_finish.value" />
          </div>
          <!-- 状态信息 -->
          <div class="transfer-status">
            <span :class="['iconfont', 'icon-' + STATUS[item.status].icon]"
              :style="{ color: STATUS[item.status].color }"></span>
            <span class="status" :style="{ color: STATUS[item.status].color }">
              {{ item.status == 'fail' ? item.errorMsg : STATUS[item.status].desc }}
            </span>
            <span class="transfer-info" v-if="item.status == STATUS.uploading.value">
              {{ proxy.Utils.size2Str(item.uploadSize) }}/{{ proxy.Utils.size2Str(item.totalSize) }}
            </span>
          </div>
        </div>

        <!-- 操作区域 -->
        <div class="op">
          <!-- MD5计算进度 -->
          <el-progress type="circle" :width="50" :percentage="item.md5Progress"
            v-if="item.status == STATUS.init.value"></el-progress>

          <!-- 操作按钮 -->
          <div class="op-btn">
            <!-- 上传/暂停按钮 -->
            <span v-if="item.status == STATUS.uploading.value">
              <Icon :width="20" class="btn-item" iconName="upload" v-if="item.pause" title="上传"
                @click="startUpload(item.uid)"></Icon>
              <Icon :width="20" class="btn-item" iconName="pause" title="暂停" @click="pauseUpload(item.uid)" v-else>
              </Icon>
            </span>

            <!-- 删除按钮 -->
            <Icon :width="20" class="del btn-item" iconName="del" title="删除" v-if="item.status != STATUS.init.value &&
              item.status != STATUS.upload_finish.value &&
              item.status != STATUS.upload_seconds.value" @click="delTransfer(item.uid, index)"></Icon>

            <!-- 清除按钮 -->
            <Icon :width="20" class="clean btn-item" iconName="clean" title="清除" v-if="item.status == STATUS.upload_finish.value ||
              item.status == STATUS.upload_seconds.value" @click="delTransfer(item.uid, index)"></Icon>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="fileList.length == 0">
        <NoData msg="暂无传输任务"></NoData>
      </div>
    </div>
  </div>
</template>

<script setup>
import SparkMD5 from 'spark-md5';
import { getCurrentInstance, inject, onMounted, ref } from 'vue';
import { ElProgress } from 'element-plus';
import Icon from '@/components/Icon.vue';

const { proxy } = getCurrentInstance()

const api = {
  uploadFile: "/file/uploadFile"
}

const STATUS = {
  emptyfile: {
    value: "emptyfile",
    desc: "文件为空",
    color: "#F75000",
    icon: "close",
  },
  fail: {
    value: "fail",
    desc: "上传失败",
    color: "#F75000",
    icon: "close",
  },
  init: {
    value: "init",
    desc: "解析中",
    color: "#e6a23c",
    icon: "clock",
  },
  uploading: {
    value: "uploading",
    desc: "上传中",
    color: "#409eff",
    icon: "upload",
  },
  upload_finish: {
    value: "upload_finish",
    desc: "上传完成",
    color: "#67c23a",
    icon: "ok",
  },
  upload_seconds: {
    value: "upload_seconds",
    desc: "秒传",
    color: "#67c23a",
    icon: "ok",
  },
}

//分片大小
const chunkSize = 1024 * 1024 * 5

//文件列表
const fileList = ref([]);

//删除文件的id
const delFile = ref([])

//上传文件
const addFile = async (file, filePid) => {
  const fileItem = {
    // 文件
    file: file,
    // 文件ID
    uid: file.uid,
    // md5进度
    md5Progress: 0,
    // md5值
    md5: null,
    // 文件名
    fileName: file.name,
    // 上传状态
    status: STATUS.init.value,
    // 已上传大小
    uploadSize: 0,
    // 文件总大小
    totalSize: file.size,
    // 进度
    uploadProgress: 0,
    //暂停
    pause: false,
    // 当前分片
    chunkIndex: 0,
    // 父级ID
    filePid: filePid,
    // 错误信息
    errorMsg: null,
  }

  //加入文件
  fileList.value.unshift(fileItem)

  if (fileItem.totalSize == 0) {
    fileItem.status = STATUS.emptyfile.value;
    return;
  }

  //计算md5值
  let md5FileUid = await computeMd5(fileItem)

  if (md5FileUid == null) {
    return
  }

  uploadFile(md5FileUid)
}

defineExpose({
  addFile
})

//上传文件
const emit = defineEmits(['uploadCallback'])
const uploadFile = async (uid,chunkIndex) => {
  chunkIndex = chunkIndex ? chunkIndex : 0

  //获取当前文件
  let currentFile = getFileByUid(uid)

  const file = currentFile.file
  const fileSize = currentFile.totalSize
  const chunks = Math.ceil(fileSize / chunkSize)

  //读取分片文件
  for (let i = chunkIndex; i < chunks; i++){
    // 判断如果在文件上传的过程中删除了文件,那么直接跳出循环
    let delIndex = delFile.value.indexOf(uid)

    if (delIndex != -1) {
      delList.value.splice(delIndex, 1);
      break;
    }

    // 如果当前文件被暂停,那么直接跳出循环
    if (currentFile.pause) break;

    // 获取分片
    let start = i * chunkSize;
    let end = start + chunkSize >= fileSize ? fileSize : start + chunkSize;
    let chunkFile = file.slice(start, end);

    // 上传分片
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
      // 报错
      errorCallback: (errorMsg) => {
        currentFile.status = STATUS.fail.value;
        currentFile.errorMsg = errorMsg;
      },
      // 进度更新
      uploadProgressCallback: (event) => {
        let loaded = event.loaded;
        if (loaded > fileSize) {
          loaded = fileSize;
        }
        currentFile.uploadSize = i * chunkSize + loaded;
        currentFile.uploadProgress = Math.floor(
          (currentFile.uploadSize / fileSize) * 100
        );
      },
    })

    if (uploadResult == null) {
      break;
    }

    currentFile.fileId = uploadResult.data.fileId;
    currentFile.status = STATUS[uploadResult.data.status].value;
    currentFile.chunkIndex = i;

    if (
      uploadResult.data.status == STATUS.upload_seconds.value ||
      uploadResult.data.status == STATUS.upload_finish.value
    ) {
      currentFile.uploadProgress = 100;
      // 上传结束后,uploaderCallback,将Framework中的列表刷新
      emit("uploadCallback");
      break;
    }

  }
}

//计算md5值
//对大文件进行分片
let computeMd5 = (fileItem) => {
  let file = fileItem.file

  // slice 分割文件
  // mozSlice 兼容firefox
  // webkitSlice 兼容webkit
  let blobSlice =
    File.prototype.slice ||
    File.prototype.mozSlice ||
    File.prototype.webkitSlice;

  // chunkSize 每片的大小
  // chunks 切片数量(向上取整)
  let chunks = Math.ceil(file.size / chunkSize);

  // 当前切片的下标为0
  let currentChunk = 0;

  // 创建md5对象
  let spark = new SparkMD5.ArrayBuffer();

  //使用fileRead读取数据
  let fileReader = new FileReader();

  //已删除文件的索引
  const delList = ref([])

  //加载数据
  let loadNext = () => {
    let start = currentChunk * chunkSize;
    let end = start + chunkSize >= file.size ? file.size : start + chunkSize;

    fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
  }

  loadNext()

  return new Promise((resolve, reject) => {
    //根据文件id获取文件
    let resultFile = getFileByUid(file.uid)

    //当读取操作完成后调用
    fileReader.onload = (e) => {
      //向sparkmd5对象追加数据
      //计算分片后的md5值
      spark.append(e.target.result)

      //切片下标+1
      currentChunk++

      // 如果当前切片下标比切片数量小,说明还可以分片解析
      if (currentChunk < chunks) {
        /*  console.log(
        `第${file.name},${currentChunk}分片解析完成, 开始第${
        currentChunk + 1
        } / ${chunks}分片解析`
        ); */
        let percent = Math.floor((currentChunk / chunks) * 100);
        resultFile.md5Progress = percent;
        // 再次读取数据
        loadNext();
      } else {

        // 如果当前切片下标不比切片数量小,说明解析到最后了
        let md5 = spark.end();
        /*  console.log(
          `MD5计算完成：${file.name} \nMD5：${md5} \n分片：${chunks} 大小:${
            file.size
          } 用时：${new Date().getTime() - time} ms`
        ); */
        spark.destroy()
        resultFile.md5Progress = 100;
        resultFile.status = STATUS.uploading.value;
        resultFile.md5 = md5;
        resolve(fileItem.uid);

      }
    }

  }).catch((e) => {
    return null
  })
}

const getFileByUid = (uid) => {
  let file = fileList.value.find((item) => item.file.uid == uid)

  return file;
}

// 开始上传
const startUpload = (uid) => {
  const fileItem = getFileByUid(uid);
  if (fileItem) {
    fileItem.pause = false;
    // 从上次暂停的位置继续上传
    uploadFile(uid, fileItem.chunkIndex);
  }
};

// 暂停上传
const pauseUpload = (uid) => {
  const fileItem = getFileByUid(uid);
  if (fileItem) {
    fileItem.pause = true;
  }
};

// 删除/清除传输项
const delTransfer = (uid, index) => {
  // 如果文件正在上传，先将其加入删除列表
  if (fileList.value[index].status === STATUS.uploading.value) {
    delFile.value.push(uid);
  }
  // 从列表中移除
  fileList.value.splice(index, 1);
};

</script>

<style lang="scss">
.transfer-panel {
  .transfer-title {
    border-bottom: 1px solid #ddd;
    line-height: 40px;
    padding: 0px 10px;
    font-size: 15px;

    .tips {
      font-size: 13px;
      color: rgb(169, 169, 169);
    }
  }

  .file-list {
    overflow: auto;
    padding: 10px 0px;
    min-height: calc(100vh / 2);
    max-height: calc(100vh - 120px);

    .file-item {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 3px 10px;
      background-color: #fff;
      border-bottom: 1px solid #ddd;

      &:nth-child(even) {
        background-color: #fcf8f4;
      }
    }

    .transfer-panel {
      flex: 1;

      .file-name {
        color: rgb(64, 62, 62);
        font-size: 13px;
        padding: 5px 0px;
        text-overflow: ellipsis;
      }

      .progress {
        height: 10px;
      }

      .transfer-status {
        display: flex;
        align-items: center;
        margin-top: 5px;

        .iconfont {
          margin-right: 3px;
        }

        .status {
          color: red;
          font-size: 13px;
        }

        .transfer-info {
          margin-left: 5px;
          font-size: 12px;
          color: rgb(112, 111, 111);
        }
      }
    }

    .op {
      width: 50px;
      display: flex;
      align-items: center;
      justify-content: flex-end;

      .op-btn {
        .btn-item {
          cursor: pointer;
        }

        .del,
        .clean {
          margin-left: 5px;
        }
      }
    }
  }
}
</style>
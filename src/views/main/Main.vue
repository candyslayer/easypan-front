<template>
    <div @click="handleClickOutside">
        <!-- 操作按钮 -->
        <div class="operation-section" @click.stop>
            <OperationMenu :operations="operations">
                <template #upload="{ item }">

                    <ElUpload :show-file-list="false" :with-credentials="true" :multiple="true" :http-request="addFile"
                        :auto-upload="true" :accept="fileAccept">
                        <div>
                            <span class="dripicons-upload"></span>
                        </div>
                    </ElUpload>
                </template>

                <template #download="{ item }">
                    <div>
                        <span class="dripicons-download" @click="hadleDownload"></span>
                    </div>
                </template>

                <template #newFolder="{ item }">
                    <div v-if="isOk">
                        <span class="dripicons-plus" @click="newFolder"></span>
                    </div>

                    <div v-if="!isOk">
                        <span class="dripicons-checkmark" @click="saveNameEdit"></span>
                    </div>
                </template>

                <template #share="{ item }">
                    <div>
                        <span class="dripicons-direction" @click="openShare"></span>
                    </div>
                </template>

                <template #delete="{ item }">
                    <div>
                        <span class="dripicons-trash" @click="delFile"></span>
                    </div>
                </template>

            </OperationMenu>
        </div>

        <!-- 文件列表 -->
        <div class="file-list" @click.stop>
            <Table :data-source="tableData" :columns="columns" :options="tableOptions" @rowClick="handleRowClick"
                :fetch="loadFileList" @rowSelected="handleRowSelected">

                <template #fileName="{ index, row }">
                    <div class="file-item">
                        <!-- 现有的文件图标和名称显示 -->
                        <div class="file-content">
                            <template v-if="(row.fileType == 3 || row.fileType == 1) && row.status == 2">
                                <!-- 如果文件类型是图片或者视频,且已经成功转码,则执行 Icon中的cover -->
                                <Icon :cover="row.fileCover" :width="32"></Icon>
                            </template>

                            <template v-else>
                                <!-- 如果文件夹类型是文件,则文件类型是该文件类型 -->
                                <Icon v-if="row.folderType == 0" :fileType="row.fileType"></Icon>
                                <!-- 如果文件夹类型是目录,则文件类型就是目录0 -->
                                <Icon v-if="row.folderType == 1" :fileType="0"></Icon>
                            </template>

                            <!-- 显示文件名称 -->
                            <!-- v-if="!row.showEdit" 如果该行文件没有编辑 -->
                            <span class="file-name" v-if="!row.showEdit" :title="row.fileName">
                                <span @click="preview(row)">{{ row.fileName }}</span>
                                <span v-if="row.status == 0" class="transfer-status">转码中</span>
                                <span v-if="row.status == 1" class="transfer-status transfer-fail">转码失败</span>
                            </span>

                            <div class="edit-panel" v-if="row.showEdit">
                                <Icon :file-type="0"></Icon>
                                <ElInput v-model.trim="row.fileNameReal" ref="editNameRef">
                                    <template #suffix>{{ row.fileSuffix }}</template>
                                </ElInput>
                            </div>
                        </div>

                    </div>
                </template>

                <!-- 文件大小 -->
                <template #fileSize="{ index, row }">
                    <span v-if="row.fileSize">
                        {{ proxy.Utils.size2Str(row.fileSize) }}</span>
                </template>

                <!-- 修改时间 -->
                <template #lastUpdateTime="{ index, row }">
                    <span>
                        {{ formatDate(row.lastUpdateTime) }}</span>
                </template>

            </Table>
        </div>

        <div class="no-date"></div>
    </div>

    <Preview ref="previewRef" @click.stop></Preview>

    <!-- 分享弹窗 -->
    <Dialog
        :show="shareDialog.show"
        title="分享文件"
        width="420px"
        :buttons="shareDialog.buttons"
        @close="shareDialog.show = false"
    >
        <div class="share-dialog-body" v-if="!shareResult.shareId">
            <el-form :model="shareForm" label-width="80px" size="default">
                <el-form-item label="文件名">
                    <span class="share-file-name">{{ currentSelectedRow?.fileName }}</span>
                </el-form-item>
                <el-form-item label="有效期">
                    <el-radio-group v-model="shareForm.validType">
                        <el-radio :label="0">1天</el-radio>
                        <el-radio :label="1">7天</el-radio>
                        <el-radio :label="2">30天</el-radio>
                        <el-radio :label="3">永久有效</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="提取码">
                    <el-radio-group v-model="shareForm.codeType">
                        <el-radio :label="0">系统随机</el-radio>
                        <el-radio :label="1">自定义</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="shareForm.codeType === 1" label="自定义码">
                    <el-input v-model.trim="shareForm.code" maxlength="5" placeholder="请输入5位提取码" />
                </el-form-item>
            </el-form>
        </div>
        <div class="share-result-body" v-else>
            <div class="share-success-tip">
                <span class="dripicons-checkmark tip-icon"></span>
                <span>分享链接生成成功！</span>
            </div>
            <div class="share-info-block">
                <div class="info-row">
                    <span class="info-label">分享链接：</span>
                    <span class="info-val">{{ shareResult.shareUrl }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">提取码：</span>
                    <span class="info-val code-highlight">{{ shareResult.code }}</span>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { ElButton, ElUpload, ElInput, ElRadioGroup, ElRadio, ElForm, ElFormItem } from 'element-plus';
import Table from '@/components/Table.vue';
import Icon from '@/components/Icon.vue';
import Preview from '@/components/preview/Preview.vue';
import Dialog from '@/components/Dialog.vue';
import OperationMenu from '@/components/OperationMenu.vue';
import { ref, reactive, computed, getCurrentInstance, onMounted, onUnmounted, nextTick } from 'vue';
import CategoryInfo from '@/js/CategoryInfo';

const { proxy } = getCurrentInstance()

const api = {
    loadFileList: "/file/loadFileList",
    createDownloadUrl: "/file/createDownloadUrl",
    download: "/api/file/download",
    rename: "/file/rename",
    newFolder: "/file/newFolder",
    move: "/file/moveFileFolder",
    renameFileFolder: "/file/renameFileFolder",
    delFile: "/file/delFile",
    shareFile: "/share/shareFile"
}

const previewRef = ref()

const emit = defineEmits(['addFile'])
const addFile = async (fileData) => {
    emit("addFile", { file: fileData.file, filePid: currentFolder.value.fileId });
};

const category = ref()
//接受文件类型
const fileAccept = computed(() => {
    const categoryItem = CategoryInfo[category.value];
    return categoryItem ? categoryItem.accept : "*";
});

// 基础操作按钮（始终显示）
const baseOperations = [
    {
        name: 'upload',
        icon: 'dripicons-upload',
        type: 'primary',
    },
    {
        name: 'newFolder',
        icon: 'dripicons-plus',
        type: 'warning'
    }
];

// 文件操作按钮配置
const fileOperations = [
    {
        name: 'download',
        icon: 'dripicons-download',
        type: 'success',
        label: '下载'
    },
    {
        name: 'share',
        icon: 'dripicons-direction',
        type: 'warning',
        label: '分享'
    },
    {
        name: 'move',
        icon: 'dripicons-move',
        type: 'info',
        label: '移动'
    },
    {
        name: 'rename',
        icon: 'dripicons-pencil',
        type: 'primary',
        label: '重命名'
    },
    {
        name: 'delete',
        icon: 'dripicons-trash',
        type: 'danger',
        label: '删除'
    }
];

const currentSelectedRow = ref(null)


// 初始化操作按钮
const operations = ref([...baseOperations]);

// 表格数据
const tableData = ref({})

// 表格列配置
const columns = [
    {
        prop: 'fileName',
        label: '文件名',
        width: '135',
        scopedSlots: 'fileName'
    },
    {
        prop: 'size',
        label: '大小',
        width: '70',
        scopedSlots: 'fileSize'  // 使用作用域插槽处理大小显示
    },
    {
        prop: 'lastUpdateTime',
        label: '修改时间',
        width: '100',
        scopedSlots: 'lastUpdateTime'  // 添加作用域插槽处理时间显示
    }
];

// 表格选项配置
const tableOptions = {
    stripe: true,
    border: true,
    showIndex: false,
    selectType: '',
    extHeight: 0
};

const editing = ref(false)

const selectedId = ref()
// 修改行点击事件处理
const handleRowClick = (row, event) => {

    selectedId.value = row.fileId

    console.log(selectedId.value)

    // 首先阻止事件冒泡
    event?.stopPropagation();

    // 如果点击的是操作按钮区域，直接返回
    if (event?.target?.closest('.operation-section')) {
        return;
    }

    // 清除其他行的选中状态
    if (tableData.value?.list) {
        tableData.value.list.forEach(item => {
            if (item !== row) {
                item.selected = false;
            }
        });
    }

    // 切换当前行的选中状态
    row.selected = !row.selected;

    // 更新操作按钮
    if (row.selected) {
        operations.value = [...baseOperations, ...fileOperations];
    } else {
        operations.value = [...baseOperations];
    }
};

// 文件名
const fileNameFuzzy = ref();

// 多选事件处理
const handleRowSelected = (rows) => {
    console.log('选中行:', rows);
};

const currentFolder = ref({
    fileId: 0 // 添加这个必要的响应式数据
});

const loadFileList = async () => {
    let params = {
        // 页码
        pageNo: tableData.value.pageNo,
        // 分页大小
        pageSize: tableData.value.pageSize,
        // 文件名（模糊）
        fileNameFuzzy: fileNameFuzzy.value,
        // 分类
        category: category.value,
        // 文件父id
        filePid: currentFolder.value.fileId,
    }

    // 如果分类是全部，则不传filePid
    if (params.category != "all") {
        delete params.filePid
    }

    let result = await proxy.request({
        url: api.loadFileList,
        showLoading: true,
        params: params
    })

    if (!result) {
        return
    }

    tableData.value = result.data


}

const preview = (data) => {
    // 如果是目录(文件夹)
    if (data.folderType == 1) {
        navigationRef.value.openFolder(data);
        return;
    }
    if (data.status != 2) {
        proxy.Message.warning("文件未完成转码,无法预览");
        return;
    }
    previewRef.value.showPreview(data, 0);
};


// const showOp=(row)=>{
//     // 关闭所有的显示
//     tableData.value.list.forEach((element) => {
//         element.showOp = false;
//     });
//     // 只开启当前显示
//     row.showOp = true;
// };

const cancelShowOp = (row) => {
    row.showOp = false;
}


// 添加日期格式化方法
const formatDate = (dateStr) => {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    // 移动端判断
    if (window.innerWidth <= 768) {
        // 只显示到天
        return proxy.Utils.formatDate(date, 'yyyy-MM-dd');
    }
    // PC端显示完整时间
    return proxy.Utils.formatDate(date, 'yyyy-MM-dd HH:mm:ss');
};

// 添加窗口大小变化监听以更新日期格式
onMounted(() => {
    window.addEventListener('resize', handleResize);
    // 添加点击事件监听
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    // 移除点击事件监听
    document.removeEventListener('click', handleClickOutside);
});

const handleResize = () => {
    // 触发表格重新渲染
    if (tableData.value?.list) {
        tableData.value = { ...tableData.value };
    }
};

// 修改点击外部取消选中方法
const handleClickOutside = (event) => {

    // 判断点击的区域是否在表格内或操作按钮区域内
    const tableEl = document.querySelector('.file-list');
    const operationEl = document.querySelector('.operation-section');
    const targetEl = event.target;

    // 检查是否点击了操作按钮或其子元素
    const isOperationButton = targetEl.closest('.el-button') ||
        targetEl.closest('.operation-section');

    if (!tableEl?.contains(targetEl) &&
        !operationEl?.contains(targetEl) &&
        !isOperationButton) {
        // 清除所有选中状态
        if (tableData.value?.list) {
            tableData.value.list.forEach(item => {
                item.selected = false;
            });
        }
        // 恢复基础操作按钮
        operations.value = [...baseOperations];
    }
};

const hadleDownload = async () => {
    //执行下载
    let result = await proxy.request({
        url: api.createDownloadUrl + "?fileId=" + selectedId.value
    })

    if (!result) {
        return
    }

    window.location.href = api.download + "/" + result.data
}

const editNameRef = ref()

const isOk = ref(true)

const currenntEditIndex = ref(-1)

//新建文件夹
const newFolder = () => {
    console.log("新建文件夹")
    //如果不是编辑状态，则点新建文件夹按钮不上起作用
    if (editing.value) {
        return
    }

    //其他行不运行编辑
    tableData.value.list.forEach((element) => {
        element.editing = false
    })

    editing.value = true

    //新建文件夹时将当前编辑索引设置为0，因为使用了unshift方法添加到数组
    currenntEditIndex.value = 0
    
    tableData.value.list.unshift({
        showEdit: true,
        fileType: 0,
        fileId: "",
        filePId: currentFolder.value.fileId
    })

    nextTick(() => {
        editNameRef.value = false
    })

    isOk.value = false
}

// 确定新建文件夹操作
const saveNameEdit = async () => {

    const index = currenntEditIndex.value

        const { fileId, filePid, fileNameReal } = tableData.value.list[index]

        if (fileNameReal == "" || fileNameReal.indexOf("/") != -1) {
            proxy.message.warning("文件名不能为空且不能含有斜杠")

            return
        }
    
    // 重命名
    let url = api.rename

    console.log(fileId)
    if (fileId == "") {
        url = api.newFolder
    }

    let result = await proxy.request({
        url: url,
        params: {
            fileId,
            filePid: 0,
            folderName: fileNameReal
        }
    })

    if (!result) {
        return
    }

    tableData.value.list[index] = result.data
    editing.value = false

    isOk.value = false
}

const cancelNameEdit = (index) => {
    const fileData = tableData.value.list[index]

    // 如果存在这个文件存在的，说明此处是重命名操作，那么可以直接将编辑行关闭
    if (fileData.fileId) {
        fileData.showEdit = false
    } else {
        //如果不存在那么直接将本行删除
        tableData.value.list.splice(index,1)
    }

    //当前行状态为为编辑
    editing.value = false
}

const delFile = () => {
    proxy.confirm("你确定要删除文件吗？删除的文件可在10天内通过回收站还原", async () => {
        let result = await proxy.request({
            url: api.delFile,
            params: {
                fileId: selectedId.value
            }
        })

        if (!result) {
            return
        }

        loadFileList()
    })
}

// 分享逻辑
const shareDialog = reactive({
    show: false,
    buttons: [
        {
            text: '创建分享',
            type: 'primary',
            click: () => submitShare()
        }
    ]
})

const shareForm = reactive({
    validType: 1,
    codeType: 0,
    code: ''
})

const shareResult = reactive({
    shareId: '',
    code: '',
    shareUrl: ''
})

const openShare = () => {
    if (!selectedId.value) {
        proxy.message.warning('请选择需要分享的文件！')
        return
    }
    shareResult.shareId = ''
    shareResult.code = ''
    shareResult.shareUrl = ''
    shareForm.validType = 1
    shareForm.codeType = 0
    shareForm.code = ''
    shareDialog.buttons = [
        {
            text: '创建分享',
            type: 'primary',
            click: () => submitShare()
        }
    ]
    shareDialog.show = true
}

const submitShare = async () => {
    let params = {
        fileId: selectedId.value,
        validType: shareForm.validType,
        code: shareForm.codeType === 1 ? shareForm.code : ''
    }
    let result = await proxy.request({
        url: api.shareFile,
        params: params
    })
    if (!result) return
    shareResult.shareId = result.data.shareId
    shareResult.code = result.data.code
    shareResult.shareUrl = `${window.location.origin}/share/${result.data.shareId}`
    shareDialog.buttons = [
        {
            text: '复制链接及提取码',
            type: 'primary',
            click: () => copyShareResult()
        }
    ]
}

const copyShareResult = () => {
    const text = `链接: ${shareResult.shareUrl} 提取码: ${shareResult.code}`
    navigator.clipboard.writeText(text).then(() => {
        proxy.message.success('分享链接与提取码已复制！')
        shareDialog.show = false
    }).catch(() => {
        proxy.message.info(text)
    })
}

</script>

<style lang="scss">
.operation-section {
    margin-bottom: 10px;
}

.share-dialog-body {
    padding: 10px 0;

    .share-file-name {
        font-weight: 500;
        color: #303133;
    }
}

.share-result-body {
    padding: 15px 0;

    .share-success-tip {
        display: flex;
        align-items: center;
        color: #67c23a;
        font-weight: 600;
        font-size: 15px;
        margin-bottom: 15px;

        .tip-icon {
            font-size: 20px;
            margin-right: 6px;
        }
    }

    .share-info-block {
        background: #f8f9fb;
        border-radius: 8px;
        padding: 12px 14px;

        .info-row {
            display: flex;
            margin-bottom: 8px;
            font-size: 13px;

            &:last-child {
                margin-bottom: 0;
            }

            .info-label {
                color: #909399;
                width: 70px;
            }

            .info-val {
                color: #303133;
                word-break: break-all;

                &.code-highlight {
                    font-weight: 700;
                    color: #409eff;
                    font-size: 15px;
                }
            }
        }
    }
}

.file-list {
    background-color: #fff;
    border-radius: 8px;
    box-sizing: border-box;
    width: 100%;

    .file-content {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        .edit-panel{
            display: flex;
        }
    }

    // 强制应用表格容器高度
    .table-container {
        height: 100% !important;
    }

    // 确保表格体样式正确应用
    .el-table {
        &__body-wrapper {
            overflow-y: auto !important;

            &::-webkit-scrollbar {
                width: 6px;
            }

            &::-webkit-scrollbar-thumb {
                background: rgba(144, 147, 153, 0.3);
                border-radius: 3px;
            }
        }
    }
}
</style>
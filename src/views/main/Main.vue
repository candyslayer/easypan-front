<template>
    <div class="aether-main-explorer" @click="handleClickOutside">
        <!-- 1. 存储状态微提示横幅 (Linear-inspired Storage Micro Banner) -->
        <div class="storage-micro-banner" @click.stop="goToUser">
            <div class="banner-inner">
                <div class="banner-top">
                    <div class="banner-left">
                        <span class="material-symbols-outlined banner-icon">cloud</span>
                        <span class="banner-title">云空间容量</span>
                        <span class="banner-tag">标准版</span>
                    </div>
                    <button class="banner-upgrade-btn" @click.stop="goToUser">
                        <span>扩容升级</span>
                        <span class="material-symbols-outlined btn-arrow">arrow_forward</span>
                    </button>
                </div>

                <!-- 多段色彩存储量指示条 -->
                <div class="meter-bar-track">
                    <div class="meter-segment seg-doc" :style="{ width: storageSegments.doc + '%' }" title="文档"></div>
                    <div class="meter-segment seg-media" :style="{ width: storageSegments.media + '%' }" title="多媒体"></div>
                    <div class="meter-segment seg-other" :style="{ width: storageSegments.other + '%' }" title="其他"></div>
                </div>

                <div class="meter-meta">
                    <span class="meta-used">已用 {{ proxy.Utils.size2Str(spaceUse.useSpace) }} / {{ proxy.Utils.size2Str(spaceUse.totalSpace) }} ({{ storagePercentage }}%)</span>
                    <span class="meta-free">剩余 {{ proxy.Utils.size2Str(Math.max(0, spaceUse.totalSpace - spaceUse.useSpace)) }}</span>
                </div>
            </div>
        </div>

        <!-- 2. 面包屑路径导航条 (Breadcrumb Navigation Bar) -->
        <div class="breadcrumb-bar" @click.stop>
            <div class="breadcrumb-trail">
                <div class="trail-item" :class="{ 'is-active': currentFolder.fileId === 0 }" @click="goToFolder({ fileId: 0, fileName: '我的文件' }, -1)">
                    <span class="material-symbols-outlined home-icon">home</span>
                    <span class="trail-label">我的文件</span>
                </div>

                <template v-for="(folder, idx) in folderHistory" :key="folder.fileId || idx">
                    <span class="material-symbols-outlined trail-sep">chevron_right</span>
                    <div class="trail-item truncate" @click="goToFolder(folder, idx)">
                        <span class="trail-label">{{ folder.fileName }}</span>
                    </div>
                </template>

                <template v-if="currentFolder.fileId !== 0">
                    <span class="material-symbols-outlined trail-sep">chevron_right</span>
                    <div class="trail-item is-active current-badge truncate">
                        <span class="trail-label">{{ currentFolder.fileName }}</span>
                    </div>
                </template>
            </div>

            <!-- 上一级按钮 -->
            <button
                class="upward-btn"
                v-if="currentFolder.fileId !== 0"
                @click="backToParentFolder"
                title="返回上一级"
            >
                <span class="material-symbols-outlined btn-icon">arrow_upward</span>
                <span class="btn-text">上一级</span>
            </button>
        </div>

        <!-- 3. 搜索栏与视图控制行 (Omnibar Search & Controls) -->
        <div class="search-control-strip" @click.stop>
            <div class="omnibar-wrap">
                <span class="material-symbols-outlined search-icon">search</span>
                <input
                    v-model.trim="fileNameFuzzy"
                    type="text"
                    class="omnibar-input"
                    :placeholder="`搜索当前目录中的 ${tableData.totalCount || 0} 个项目...`"
                    @keyup.enter="handleSearch"
                    @input="handleSearchInput"
                />
                <button
                    v-if="fileNameFuzzy"
                    class="clear-search-btn"
                    @click="clearSearch"
                    title="清除搜索"
                >
                    <span class="material-symbols-outlined">close</span>
                </button>
                <span v-else class="search-hint-badge">Enter</span>
            </div>

            <!-- 次级状态栏：文件统计、排序指示、网格/列表切换 -->
            <div class="sub-filter-row">
                <div class="left-stat">
                    <span class="stat-count">{{ tableData.totalCount || 0 }} 个文件</span>
                    <span class="stat-dot">·</span>
                    <div class="sort-tag">
                        <span>修改时间</span>
                        <span class="material-symbols-outlined sort-icon">arrow_downward</span>
                    </div>
                </div>

                <div class="view-mode-toggle">
                    <button
                        class="toggle-btn"
                        :class="{ 'is-active': viewMode === 'grid' }"
                        @click="viewMode = 'grid'"
                        title="网格视图"
                    >
                        <span class="material-symbols-outlined">grid_view</span>
                    </button>
                    <button
                        class="toggle-btn"
                        :class="{ 'is-active': viewMode === 'list' }"
                        @click="viewMode = 'list'"
                        title="列表视图"
                    >
                        <span class="material-symbols-outlined">format_list_bulleted</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- 4. 快捷操作胶囊横向滚动栏 (Quick Action Pill Scroll Bar) -->
        <div class="quick-action-bar" @click.stop>
            <!-- 上传文件 (高亮 Primary 胶囊) -->
            <el-upload
                :show-file-list="false"
                :with-credentials="true"
                :multiple="true"
                :http-request="addFile"
                :auto-upload="true"
                :accept="fileAccept"
                class="upload-wrapper"
            >
                <button class="action-pill primary-pill">
                    <span class="material-symbols-outlined">upload</span>
                    <span>上传文件</span>
                </button>
            </el-upload>

            <!-- 新建文件夹 -->
            <button class="action-pill outline-pill" @click="newFolder" v-if="isOk">
                <span class="material-symbols-outlined text-amber">create_new_folder</span>
                <span>新建文件夹</span>
            </button>
            <button class="action-pill success-pill" @click="saveNameEdit" v-else>
                <span class="material-symbols-outlined">check</span>
                <span>保存目录</span>
            </button>

            <!-- 刷新列表 -->
            <button class="action-pill outline-pill" @click="loadFileList" title="刷新文件列表">
                <span class="material-symbols-outlined text-slate">refresh</span>
                <span>刷新</span>
            </button>
        </div>

        <!-- 5. 视图展示区域 (网格视图 Grid View) -->
        <div class="grid-canvas" v-show="viewMode === 'grid'" @click.stop>
            <div class="grid-container" v-if="tableData?.list && tableData.list.length > 0">
                <div
                    v-for="(row, idx) in tableData.list"
                    :key="row.fileId || idx"
                    class="aether-grid-card"
                    :class="{
                        'is-selected': selectedId === row.fileId,
                        'is-folder': row.folderType === 1
                    }"
                    @click.stop="handleCardClick(row)"
                    @dblclick.stop="handleNameClick(row)"
                >
                    <!-- 选中勾选徽章 -->
                    <div class="card-check-badge" v-if="selectedId === row.fileId">
                        <span class="material-symbols-outlined">check</span>
                    </div>

                    <!-- 顶部：类型图标与更多菜单按钮 -->
                    <div class="card-header">
                        <!-- 缩略图模式 (图片 / 视频且已转码成功) -->
                        <div
                            v-if="(row.fileType === 3 || row.fileType === 1) && row.status === 2 && row.fileCover"
                            class="card-thumbnail-wrap"
                        >
                            <img :src="proxy.globalInfo.imageUrl + row.fileCover" class="card-thumb-img" loading="lazy" />
                            <span class="thumb-tag" v-if="row.fileType === 1">视频</span>
                            <span class="thumb-tag" v-else>图片</span>
                            <div class="video-play-hint" v-if="row.fileType === 1">
                                <span class="material-symbols-outlined fill-icon">play_arrow</span>
                            </div>
                        </div>

                        <!-- 语义化文件/文件夹类型高清图标 -->
                        <div v-else class="card-file-icon">
                            <Icon v-if="row.folderType === 1" :fileType="0" :width="42"></Icon>
                            <Icon v-else :fileType="row.fileType" :width="42"></Icon>
                        </div>

                        <!-- 独立操作按钮 (触发底部抽屉) -->
                        <button
                            class="card-more-btn"
                            @click.stop="openContextMenu(row, $event)"
                            title="更多操作"
                        >
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>

                    <!-- 中间：文件名与编辑态 -->
                    <div class="card-body">
                        <!-- 正常文件名 -->
                        <div
                            v-if="!row.showEdit"
                            class="card-title truncate"
                            :title="row.fileName"
                            @click.stop="handleNameClick(row)"
                        >
                            {{ row.fileName }}
                        </div>

                        <!-- 内联编辑框 (新建 / 重命名) -->
                        <div v-else class="card-edit-box" @click.stop>
                            <el-input
                                v-model.trim="row.fileNameReal"
                                ref="editNameRef"
                                size="small"
                                @keyup.enter="saveNameEdit"
                            >
                                <template #suffix>{{ row.fileSuffix }}</template>
                            </el-input>
                            <div class="edit-btn-row">
                                <el-button size="small" type="primary" link @click.stop="saveNameEdit">确定</el-button>
                                <el-button size="small" link @click.stop="cancelEdit(row, idx)">取消</el-button>
                            </div>
                        </div>

                        <!-- 转码状态标识 -->
                        <div v-if="row.status === 0" class="transcode-tag transcode-ing">转码中</div>
                        <div v-if="row.status === 1" class="transcode-tag transcode-fail">转码失败</div>

                        <!-- 副信息行：大小 · 修改时间 -->
                        <div class="card-meta">
                            <span class="meta-size" v-if="row.fileSize">{{ proxy.Utils.size2Str(row.fileSize) }}</span>
                            <span class="meta-size" v-else-if="row.folderType === 1">文件夹</span>
                            <span class="meta-dot">·</span>
                            <span class="meta-date">{{ formatDate(row.lastUpdateTime) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 空状态 -->
            <div class="empty-state" v-else>
                <div class="empty-icon-wrap">
                    <span class="material-symbols-outlined">folder_open</span>
                </div>
                <div class="empty-title">当前文件夹为空</div>
                <div class="empty-desc">点击上方“上传文件”或“新建文件夹”开始整理内容</div>
            </div>
        </div>

        <!-- 6. 视图展示区域 (列表视图 List View) -->
        <div class="list-canvas" v-show="viewMode === 'list'" @click.stop>
            <div class="list-container" v-if="tableData?.list && tableData.list.length > 0">
                <div
                    v-for="(row, idx) in tableData.list"
                    :key="row.fileId || idx"
                    class="aether-list-row"
                    :class="{ 'is-selected': selectedId === row.fileId }"
                    @click.stop="handleRowClick(row, $event)"
                >
                    <!-- 左侧：类型图标 / 缩略图 -->
                    <div class="row-icon-box">
                        <div
                            v-if="(row.fileType === 3 || row.fileType === 1) && row.status === 2 && row.fileCover"
                            class="row-thumb-wrap"
                        >
                            <img :src="proxy.globalInfo.imageUrl + row.fileCover" class="row-thumb-img" loading="lazy" />
                        </div>
                        <div v-else class="row-file-icon">
                            <Icon v-if="row.folderType === 1" :fileType="0" :width="38"></Icon>
                            <Icon v-else :fileType="row.fileType" :width="38"></Icon>
                        </div>

                        <!-- 选中时标记圈 -->
                        <span v-if="selectedId === row.fileId" class="selected-dot">
                            <span class="material-symbols-outlined">check</span>
                        </span>
                    </div>

                    <!-- 中间：文件名与副信息 -->
                    <div class="row-content">
                        <div v-if="!row.showEdit" class="row-title truncate" :title="row.fileName" @click.stop="handleNameClick(row)">
                            {{ row.fileName }}
                        </div>

                        <div v-else class="row-edit-box" @click.stop>
                            <el-input
                                v-model.trim="row.fileNameReal"
                                ref="editNameRef"
                                size="small"
                                @keyup.enter="saveNameEdit"
                            >
                                <template #suffix>{{ row.fileSuffix }}</template>
                            </el-input>
                            <el-button size="small" type="primary" link @click.stop="saveNameEdit">确定</el-button>
                        </div>

                        <div class="row-sub-meta">
                            <span class="meta-size" v-if="row.fileSize">{{ proxy.Utils.size2Str(row.fileSize) }}</span>
                            <span class="meta-size" v-else-if="row.folderType === 1">文件夹</span>
                            <span class="meta-dot">·</span>
                            <span class="meta-date">{{ formatDate(row.lastUpdateTime) }}</span>
                            <span v-if="row.status === 0" class="transcode-tag transcode-ing">转码中</span>
                            <span v-if="row.status === 1" class="transcode-tag transcode-fail">转码失败</span>
                        </div>
                    </div>

                    <!-- 右侧：更多菜单按钮 -->
                    <div class="row-right-actions">
                        <button
                            class="row-more-btn"
                            @click.stop="openContextMenu(row, $event)"
                            title="更多选项"
                        >
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 列表视图空状态 -->
            <div class="empty-state" v-else>
                <div class="empty-icon-wrap">
                    <span class="material-symbols-outlined">folder_open</span>
                </div>
                <div class="empty-title">当前文件夹为空</div>
                <div class="empty-desc">点击上方“上传文件”或“新建文件夹”开始整理内容</div>
            </div>
        </div>

        <!-- 7. 统一优雅分页器 -->
        <div class="pagination-footer" v-if="tableData?.totalCount > 0">
            <el-pagination
                v-model:current-page="tableData.pageNo"
                v-model:page-size="tableData.pageSize"
                :page-sizes="[15, 30, 50]"
                :layout="isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
                :total="tableData.totalCount || 0"
                :pager-count="isMobile ? 5 : 7"
                :small="isMobile"
                @current-change="handlePageChange"
                @size-change="handlePageSizeChange"
            />
        </div>

        <!-- 8. Aether Drive 底部交互抽屉面板 (Bottom Action Drawer Sheet, matching _2/code.html) -->
        <transition name="drawer-fade">
            <div class="aether-drawer-overlay" v-show="drawerVisible" @click="closeContextMenu">
                <transition name="drawer-slide">
                    <div class="aether-drawer-sheet" v-show="drawerVisible" @click.stop>
                        <!-- 顶部手柄指示条 -->
                        <div class="drawer-drag-handle"></div>

                        <!-- 文件信息预览卡片 -->
                        <div class="drawer-file-header" v-if="drawerItem">
                            <div class="header-left">
                                <div class="drawer-icon-wrap">
                                    <Icon
                                        v-if="drawerItem.folderType === 1"
                                        :fileType="0"
                                        :width="44"
                                    ></Icon>
                                    <Icon
                                        v-else
                                        :cover="(drawerItem.fileType === 3 || drawerItem.fileType === 1) && drawerItem.status === 2 ? drawerItem.fileCover : ''"
                                        :fileType="drawerItem.fileType"
                                        :width="44"
                                    ></Icon>
                                </div>
                                <div class="header-info min-w-0">
                                    <div class="drawer-file-name truncate">{{ drawerItem.fileName }}</div>
                                    <div class="drawer-file-meta">
                                        <span>{{ drawerItem.fileSize ? proxy.Utils.size2Str(drawerItem.fileSize) : '文件夹' }}</span>
                                        <span>•</span>
                                        <span>{{ formatDate(drawerItem.lastUpdateTime) }}</span>
                                    </div>
                                </div>
                            </div>
                            <button class="drawer-close-btn" @click="closeContextMenu" title="关闭">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <!-- 4 格核心操作区 (Top Ergonomic Quick Row) -->
                        <div class="drawer-quick-grid">
                            <!-- 打开预览 -->
                            <button class="quick-btn-card" @click="triggerDrawerAction('preview')">
                                <div class="quick-icon-circle bg-blue-tint">
                                    <span class="material-symbols-outlined">visibility</span>
                                </div>
                                <span class="quick-btn-label">打开预览</span>
                            </button>

                            <!-- 下载文件 -->
                            <button class="quick-btn-card" @click="triggerDrawerAction('download')">
                                <div class="quick-icon-circle bg-blue-tint">
                                    <span class="material-symbols-outlined">download</span>
                                </div>
                                <span class="quick-btn-label">下载文件</span>
                            </button>

                            <!-- 共享外链 -->
                            <button class="quick-btn-card" @click="triggerDrawerAction('share')">
                                <div class="quick-icon-circle bg-indigo-tint">
                                    <span class="material-symbols-outlined">share</span>
                                </div>
                                <span class="quick-btn-label">共享外链</span>
                            </button>

                            <!-- 重命名 -->
                            <button class="quick-btn-card" @click="triggerDrawerAction('rename')">
                                <div class="quick-icon-circle bg-amber-tint">
                                    <span class="material-symbols-outlined">drive_file_rename_outline</span>
                                </div>
                                <span class="quick-btn-label">重命名</span>
                            </button>
                        </div>

                        <!-- 列表操作组 -->
                        <div class="drawer-action-list">
                            <!-- 查看详细属性 -->
                            <div class="action-list-item" @click="triggerDrawerAction('detail')">
                                <div class="item-left">
                                    <span class="material-symbols-outlined item-icon">info</span>
                                    <span class="item-text">查看详细信息</span>
                                </div>
                                <span class="material-symbols-outlined item-arrow">chevron_right</span>
                            </div>
                        </div>

                        <!-- 危险操作：移入回收站 -->
                        <div class="drawer-danger-box">
                            <button class="danger-action-btn" @click="triggerDrawerAction('delete')">
                                <span class="material-symbols-outlined">delete</span>
                                <span>移入回收站</span>
                            </button>
                        </div>
                    </div>
                </transition>
            </div>
        </transition>

        <!-- 9. 预览组件与弹窗 -->
        <Preview ref="previewRef" @click.stop></Preview>

        <!-- 10. 分享弹窗 -->
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
                        <span class="share-file-name">{{ drawerItem?.fileName || currentSelectedRow?.fileName }}</span>
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
                    <span class="material-symbols-outlined tip-icon">check_circle</span>
                    <span>分享链接已生成！</span>
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
    </div>
</template>

<script setup>
import {
    ElButton,
    ElUpload,
    ElInput,
    ElRadioGroup,
    ElRadio,
    ElForm,
    ElFormItem,
    ElPagination
} from 'element-plus';
import Icon from '@/components/Icon.vue';
import Preview from '@/components/preview/Preview.vue';
import Dialog from '@/components/Dialog.vue';
import { ref, reactive, computed, getCurrentInstance, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CategoryInfo from '@/js/CategoryInfo';

const { proxy } = getCurrentInstance();
const route = useRoute();
const router = useRouter();

const isMobile = ref(window.innerWidth <= 768);

const api = {
    loadFileList: "/file/loadFileList",
    createDownloadUrl: "/file/createDownloadUrl",
    download: "/api/file/download",
    rename: "/file/rename",
    newFolder: "/file/newFolder",
    delFile: "/file/delFile",
    shareFile: "/share/shareFile",
    getUserSpace: "/getUserSpace"
};

const previewRef = ref();
const viewMode = ref('grid'); // 默认网格磁贴视图，现代且直观

const emit = defineEmits(['addFile']);
const addFile = async (fileData) => {
    emit("addFile", { file: fileData.file, filePid: currentFolder.value.fileId });
};

const category = ref('all');
const fileAccept = computed(() => {
    const categoryItem = CategoryInfo[category.value];
    return categoryItem ? categoryItem.accept : "*";
});

// 云空间容量状态
const spaceUse = ref({
    totalSpace: 1,
    useSpace: 0
});

const storagePercentage = computed(() => {
    if (!spaceUse.value.totalSpace) return 0;
    const rate = Math.round((spaceUse.value.useSpace / spaceUse.value.totalSpace) * 100);
    return Math.min(rate, 100);
});

const storageSegments = computed(() => {
    const pct = storagePercentage.value;
    const doc = Math.min(Math.round(pct * 0.5), pct);
    const media = Math.min(Math.round(pct * 0.35), pct - doc);
    const other = Math.max(0, pct - doc - media);
    return { doc, media, other };
});

const getUserSpace = async () => {
    try {
        let result = await proxy.request({
            url: api.getUserSpace
        });
        if (result?.data) {
            spaceUse.value = result.data;
        }
    } catch (e) {
        // fail silently
    }
};

const goToUser = () => {
    router.push('/user');
};

// 选中的文件行
const currentSelectedRow = ref(null);
const selectedId = ref(null);

const selectedItem = computed(() => {
    if (!selectedId.value || !tableData.value?.list) return null;
    return tableData.value.list.find(item => item.fileId === selectedId.value) || null;
});

const clearRowSelection = () => {
    selectedId.value = null;
    currentSelectedRow.value = null;
    if (tableData.value?.list) {
        tableData.value.list.forEach(item => {
            item.selected = false;
        });
    }
};

// 表格列表数据
const tableData = ref({
    list: [],
    pageNo: 1,
    pageSize: 15,
    totalCount: 0,
    pageTotal: 1
});

const editing = ref(false);
const isOk = ref(true);
const currenntEditIndex = ref(-1);
const editNameRef = ref();

// 目录层级导航历史
const folderHistory = ref([]);
const currentFolder = ref({
    fileId: 0,
    fileName: '根目录'
});

const goToFolder = (target, index) => {
    if (index === -1) {
        // 回到根目录
        folderHistory.value = [];
        currentFolder.value = { fileId: 0, fileName: '根目录' };
    } else {
        folderHistory.value = folderHistory.value.slice(0, index);
        currentFolder.value = target;
    }
    clearRowSelection();
    loadFileList();
};

const backToParentFolder = () => {
    if (folderHistory.value.length > 0) {
        const prev = folderHistory.value.pop();
        currentFolder.value = prev;
    } else {
        currentFolder.value = { fileId: 0, fileName: '根目录' };
    }
    clearRowSelection();
    loadFileList();
};

// 抽屉状态 (Context Action Drawer)
const drawerVisible = ref(false);
const drawerItem = ref(null);

const openContextMenu = (row, event) => {
    event?.stopPropagation();
    drawerItem.value = row;
    selectedId.value = row.fileId;
    currentSelectedRow.value = row;
    drawerVisible.value = true;
};

const closeContextMenu = () => {
    drawerVisible.value = false;
};

// 抽屉快捷操作响应
const triggerDrawerAction = (action) => {
    const item = drawerItem.value;
    if (!item) return;
    closeContextMenu();

    if (action === 'preview') {
        preview(item);
    } else if (action === 'download') {
        hadleDownload(item);
    } else if (action === 'share') {
        selectedId.value = item.fileId;
        currentSelectedRow.value = item;
        openShare();
    } else if (action === 'rename') {
        startRenameRow(item);
    } else if (action === 'detail') {
        proxy.message.info(`文件：${item.fileName} | 大小：${proxy.Utils.size2Str(item.fileSize)}`);
    } else if (action === 'delete') {
        selectedId.value = item.fileId;
        delFile();
    }
};

// 行点击事件
const handleRowClick = (row, event) => {
    event?.stopPropagation();
    if (selectedId.value === row.fileId) {
        clearRowSelection();
    } else {
        selectedId.value = row.fileId;
        currentSelectedRow.value = row;
    }
};

const handleCardClick = (row) => {
    if (selectedId.value === row.fileId) {
        clearRowSelection();
    } else {
        selectedId.value = row.fileId;
        currentSelectedRow.value = row;
    }
};

const handleNameClick = (row) => {
    if (row.folderType === 1) {
        // 进入文件夹
        folderHistory.value.push({ ...currentFolder.value });
        currentFolder.value = {
            fileId: row.fileId,
            fileName: row.fileName
        };
        clearRowSelection();
        loadFileList();
        return;
    }
    preview(row);
};

// 搜索逻辑
const fileNameFuzzy = ref('');

const handleSearch = () => {
    tableData.value.pageNo = 1;
    loadFileList();
};

const handleSearchInput = () => {
    if (!fileNameFuzzy.value) {
        loadFileList();
    }
};

const clearSearch = () => {
    fileNameFuzzy.value = '';
    loadFileList();
};

// 获取文件图标与色彩标识
const getFileIconMeta = (row) => {
    if (row.folderType === 1) {
        return { icon: 'folder', containerClass: 'folder-avatar' };
    }
    const type = row.fileType;
    switch (type) {
        case 1: // 视频
            return { icon: 'movie', containerClass: 'video-avatar' };
        case 2: // 音频
            return { icon: 'graphic_eq', containerClass: 'audio-avatar' };
        case 3: // 图片
            return { icon: 'image', containerClass: 'image-avatar' };
        case 4: // PDF
            return { icon: 'picture_as_pdf', containerClass: 'pdf-avatar' };
        case 5: // Word
            return { icon: 'description', containerClass: 'word-avatar' };
        case 6: // Excel
            return { icon: 'table_chart', containerClass: 'excel-avatar' };
        case 7: // 文本
            return { icon: 'article', containerClass: 'txt-avatar' };
        case 8: // 程序代码
            return { icon: 'code', containerClass: 'code-avatar' };
        case 9: // 压缩包
            return { icon: 'folder_zip', containerClass: 'zip-avatar' };
        default:
            return { icon: 'insert_drive_file', containerClass: 'default-avatar' };
    }
};

const loadFileList = async () => {
    let params = {
        pageNo: tableData.value.pageNo || 1,
        pageSize: tableData.value.pageSize || 15,
        fileNameFuzzy: fileNameFuzzy.value,
        category: category.value,
        filePid: currentFolder.value.fileId
    };

    if (params.category !== "all") {
        delete params.filePid;
    }

    let result = await proxy.request({
        url: api.loadFileList,
        showLoading: true,
        params: params
    });

    if (!result) return;
    tableData.value = result.data;
};

const handlePageChange = (page) => {
    tableData.value.pageNo = page;
    clearRowSelection();
    loadFileList();
};

const handlePageSizeChange = (size) => {
    tableData.value.pageSize = size;
    tableData.value.pageNo = 1;
    clearRowSelection();
    loadFileList();
};

const preview = (data) => {
    if (data.status != 2) {
        proxy.message?.warning("文件未完成转码，暂无法预览");
        return;
    }
    previewRef.value.showPreview(data, 0);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (window.innerWidth <= 768) {
        return proxy.Utils.formatDate(date, 'yyyy-MM-dd');
    }
    return proxy.Utils.formatDate(date, 'yyyy-MM-dd HH:mm');
};

const handleClickOutside = (event) => {
    const targetEl = event.target;
    if (
        !targetEl.closest('.grid-container') &&
        !targetEl.closest('.list-container') &&
        !targetEl.closest('.aether-drawer-sheet') &&
        !targetEl.closest('.quick-action-bar')
    ) {
        clearRowSelection();
    }
};

const handleResize = () => {
    isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
    window.addEventListener('resize', handleResize);
    document.addEventListener('click', handleClickOutside);
    getUserSpace();
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('click', handleClickOutside);
});

const hadleDownload = async (targetRow) => {
    const fileId = targetRow?.fileId || selectedId.value;
    if (!fileId) return;
    let result = await proxy.request({
        url: api.createDownloadUrl + "?fileId=" + fileId
    });

    if (!result) return;
    window.location.href = api.download + "/" + result.data;
};

// 新建文件夹
const newFolder = () => {
    if (editing.value) return;

    editing.value = true;
    currenntEditIndex.value = 0;

    tableData.value.list.unshift({
        showEdit: true,
        fileType: 0,
        folderType: 1,
        fileId: "",
        fileNameReal: "新建文件夹",
        filePid: currentFolder.value.fileId
    });

    isOk.value = false;
    nextTick(() => {
        if (editNameRef.value?.focus) {
            editNameRef.value.focus();
        }
    });
};

const startRenameRow = (row) => {
    row.showEdit = true;
    row.fileNameReal = row.fileName;
    editing.value = true;
    currenntEditIndex.value = tableData.value.list.indexOf(row);
    isOk.value = false;
    nextTick(() => {
        if (editNameRef.value?.focus) {
            editNameRef.value.focus();
        }
    });
};

const cancelEdit = (row, index) => {
    if (row.fileId === "") {
        tableData.value.list.splice(index, 1);
    } else {
        row.showEdit = false;
    }
    editing.value = false;
    isOk.value = true;
};

// 保存文件名 (新建或重命名)
const saveNameEdit = async () => {
    const index = currenntEditIndex.value;
    const item = tableData.value.list[index];
    if (!item) return;

    const { fileId, fileNameReal } = item;
    if (!fileNameReal || fileNameReal.trim() === "" || fileNameReal.indexOf("/") !== -1) {
        proxy.message.warning("文件名不能为空且不能含有斜杠");
        return;
    }

    let url = api.rename;
    if (fileId === "") {
        url = api.newFolder;
    }

    let result = await proxy.request({
        url: url,
        params: {
            fileId,
            filePid: currentFolder.value.fileId || 0,
            folderName: fileNameReal
        }
    });

    if (!result) return;

    tableData.value.list[index] = result.data;
    editing.value = false;
    isOk.value = true;
    clearRowSelection();
    loadFileList();
};

const delFile = () => {
    if (!selectedId.value) return;
    proxy.confirm("你确定要删除文件吗？删除的文件可在10天内通过回收站还原", async () => {
        let result = await proxy.request({
            url: api.delFile,
            params: {
                fileId: selectedId.value
            }
        });

        if (!result) return;
        clearRowSelection();
        loadFileList();
        getUserSpace();
    });
};

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
});

const shareForm = reactive({
    validType: 1,
    codeType: 0,
    code: ''
});

const shareResult = reactive({
    shareId: '',
    code: '',
    shareUrl: ''
});

const openShare = () => {
    if (!selectedId.value) {
        proxy.message.warning('请选择需要分享的文件！');
        return;
    }
    shareResult.shareId = '';
    shareResult.code = '';
    shareResult.shareUrl = '';
    shareForm.validType = 1;
    shareForm.codeType = 0;
    shareForm.code = '';
    shareDialog.buttons = [
        {
            text: '创建分享',
            type: 'primary',
            click: () => submitShare()
        }
    ];
    shareDialog.show = true;
};

const submitShare = async () => {
    let params = {
        fileId: selectedId.value,
        validType: shareForm.validType,
        code: shareForm.codeType === 1 ? shareForm.code : ''
    };
    let result = await proxy.request({
        url: api.shareFile,
        params: params
    });
    if (!result) return;
    shareResult.shareId = result.data.shareId;
    shareResult.code = result.data.code;
    shareResult.shareUrl = `${window.location.origin}/share/${result.data.shareId}`;
    shareDialog.buttons = [
        {
            text: '复制链接及提取码',
            type: 'primary',
            click: () => copyShareResult()
        }
    ];
};

const copyShareResult = () => {
    const text = `链接: ${shareResult.shareUrl} 提取码: ${shareResult.code}`;
    navigator.clipboard.writeText(text).then(() => {
        proxy.message.success('分享链接与提取码已复制！');
        shareDialog.show = false;
    }).catch(() => {
        proxy.message.info(text);
    });
};

// 监听路由分类变化并重新加载列表
watch(
    () => route.params.category,
    (newVal) => {
        category.value = newVal || 'all';
        if (tableData.value?.pageNo) {
            tableData.value.pageNo = 1;
        }
        folderHistory.value = [];
        currentFolder.value = { fileId: 0, fileName: '根目录' };
        clearRowSelection();
        loadFileList();
    },
    { immediate: true }
);
</script>

<style lang="scss" scoped>
.aether-main-explorer {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding-bottom: 24px;
    box-sizing: border-box;

    // 1. 存储微横幅
    .storage-micro-banner {
        padding: 4px 12px 10px;

        .banner-inner {
            background: #eff4ff;
            border-radius: 12px;
            padding: 10px 14px;
            box-shadow: 0 1px 3px rgba(11, 28, 48, 0.04);
            display: flex;
            flex-direction: column;
            gap: 6px;
            cursor: pointer;
            transition: background 0.2s;

            &:hover {
                background: #e5eeff;
            }
        }

        .banner-top {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .banner-left {
                display: flex;
                align-items: center;
                gap: 6px;

                .banner-icon {
                    color: #004ac6;
                    font-size: 18px;
                }

                .banner-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #0b1c30;
                }

                .banner-tag {
                    background: #dae2fd;
                    color: #5c647a;
                    font-size: 10px;
                    font-weight: 600;
                    padding: 1px 6px;
                    border-radius: 9999px;
                }
            }

            .banner-upgrade-btn {
                border: none;
                background: transparent;
                color: #004ac6;
                font-size: 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 2px;
                cursor: pointer;
                padding: 0;

                .btn-arrow {
                    font-size: 14px;
                }

                &:hover {
                    text-decoration: underline;
                }
            }
        }

        .meter-bar-track {
            height: 6px;
            width: 100%;
            background: #d3e4fe;
            border-radius: 9999px;
            overflow: hidden;
            display: flex;
            margin-top: 2px;

            .meter-segment {
                height: 100%;
                transition: width 0.3s ease;

                &.seg-doc {
                    background: #004ac6;
                }

                &.seg-media {
                    background: #10b981;
                }

                &.seg-other {
                    background: #f59e0b;
                }
            }
        }

        .meter-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 11px;
            color: #434655;

            .meta-free {
                color: #737686;
            }
        }
    }

    // 2. 面包屑导航条
    .breadcrumb-bar {
        padding: 4px 12px 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;

        .breadcrumb-trail {
            display: flex;
            align-items: center;
            gap: 6px;
            overflow-x: auto;
            scrollbar-width: none;
            min-width: 0;

            &::-webkit-scrollbar {
                display: none;
            }

            .trail-item {
                display: flex;
                align-items: center;
                gap: 4px;
                color: #434655;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                flex-shrink: 0;
                transition: color 0.15s;

                .home-icon {
                    font-size: 18px;
                }

                &:hover {
                    color: #004ac6;
                }

                &.is-active {
                    color: #0b1c30;
                    font-weight: 600;
                }

                &.current-badge {
                    background: #e5eeff;
                    padding: 2px 8px;
                    border-radius: 6px;
                    max-width: 120px;
                }
            }

            .trail-sep {
                color: #737686;
                font-size: 14px;
                flex-shrink: 0;
            }
        }

        .upward-btn {
            height: 30px;
            padding: 0 10px;
            border-radius: 8px;
            background: #e5eeff;
            border: none;
            color: #434655;
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            flex-shrink: 0;
            transition: all 0.15s;

            .btn-icon {
                font-size: 15px;
            }

            &:hover {
                background: #dce9ff;
                color: #004ac6;
            }

            &:active {
                transform: scale(0.96);
            }
        }
    }

    // 3. 搜索与控制条
    .search-control-strip {
        padding: 4px 12px 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .omnibar-wrap {
            position: relative;
            width: 100%;
            display: flex;
            align-items: center;

            .search-icon {
                position: absolute;
                left: 12px;
                font-size: 18px;
                color: #737686;
                pointer-events: none;
            }

            .omnibar-input {
                width: 100%;
                height: 38px;
                padding: 0 40px 0 38px;
                background: #ffffff;
                border: 1px solid #dce9ff;
                border-radius: 12px;
                color: #0b1c30;
                font-size: 13px;
                box-shadow: 0 1px 3px rgba(11, 28, 48, 0.04);
                outline: none;
                transition: all 0.2s;

                &::placeholder {
                    color: #737686;
                }

                &:focus {
                    border-color: #004ac6;
                    box-shadow: 0 0 0 3px rgba(0, 74, 198, 0.12);
                }
            }

            .clear-search-btn {
                position: absolute;
                right: 10px;
                background: transparent;
                border: none;
                color: #737686;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2px;

                span {
                    font-size: 16px;
                }

                &:hover {
                    color: #0b1c30;
                }
            }

            .search-hint-badge {
                position: absolute;
                right: 10px;
                background: #e5eeff;
                color: #434655;
                font-size: 10px;
                font-family: 'JetBrains Mono', monospace;
                padding: 2px 6px;
                border-radius: 4px;
                pointer-events: none;
            }
        }

        .sub-filter-row {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .left-stat {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;

                .stat-count {
                    font-weight: 600;
                    color: #0b1c30;
                }

                .stat-dot {
                    color: #737686;
                }

                .sort-tag {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    color: #434655;
                    font-weight: 500;

                    .sort-icon {
                        font-size: 14px;
                    }
                }
            }

            .view-mode-toggle {
                display: flex;
                align-items: center;
                background: #e5eeff;
                padding: 2px;
                border-radius: 8px;
                gap: 2px;

                .toggle-btn {
                    width: 28px;
                    height: 26px;
                    border: none;
                    background: transparent;
                    border-radius: 6px;
                    color: #434655;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.15s;

                    span {
                        font-size: 16px;
                    }

                    &.is-active {
                        background: #ffffff;
                        color: #004ac6;
                        box-shadow: 0 1px 3px rgba(11, 28, 48, 0.08);
                    }
                }
            }
        }
    }

    // 4. 快捷操作胶囊条
    .quick-action-bar {
        padding: 4px 12px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        overflow-x: auto;
        scrollbar-width: none;

        &::-webkit-scrollbar {
            display: none;
        }

        .upload-wrapper {
            display: inline-flex;
            flex-shrink: 0;
        }

        .action-pill {
            height: 34px;
            padding: 0 14px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
            flex-shrink: 0;

            span.material-symbols-outlined {
                font-size: 17px;
            }

            &.primary-pill {
                background: #004ac6;
                color: #ffffff;
                border: none;
                box-shadow: 0 2px 8px rgba(0, 74, 198, 0.25);

                &:hover {
                    background: #2563eb;
                }

                &:active {
                    transform: scale(0.96);
                }
            }

            &.outline-pill {
                background: #ffffff;
                color: #0b1c30;
                border: 1px solid #dce9ff;
                box-shadow: 0 1px 3px rgba(11, 28, 48, 0.04);

                .text-amber {
                    color: #784b00;
                }

                .text-slate {
                    color: #565e74;
                }

                &:hover {
                    background: #eff4ff;
                }

                &:active {
                    transform: scale(0.96);
                }
            }

            &.success-pill {
                background: #10b981;
                color: #ffffff;
                border: none;

                &:hover {
                    background: #059669;
                }
            }
        }
    }

    // 5. 网格磁贴视图 (2 Columns Grid)
    .grid-canvas {
        padding: 0 12px;

        .grid-container {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;

            @media (min-width: 900px) {
                grid-template-columns: repeat(4, minmax(0, 1fr));
            }

            @media (min-width: 1200px) {
                grid-template-columns: repeat(5, minmax(0, 1fr));
            }
        }

        .aether-grid-card {
            background: #ffffff;
            border-radius: 14px;
            padding: 12px;
            box-shadow: 0 1px 4px rgba(11, 28, 48, 0.04);
            border: 1px solid #e5eeff;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            cursor: pointer;
            user-select: none;
            transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);

            &:hover {
                box-shadow: 0 4px 14px rgba(11, 28, 48, 0.08);
                border-color: #cbdbf5;
            }

            &:active {
                transform: scale(0.985);
            }

            &.is-selected {
                background: linear-gradient(135deg, #ffffff 0%, #eff4ff 100%);
                border-color: #004ac6;
                box-shadow: 0 0 0 1.5px #004ac6, 0 4px 12px rgba(0, 74, 198, 0.12);
            }

            .card-check-badge {
                position: absolute;
                top: 8px;
                left: 8px;
                width: 20px;
                height: 20px;
                background: #004ac6;
                color: #ffffff;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 1px 4px rgba(0, 74, 198, 0.3);
                z-index: 5;

                span {
                    font-size: 13px;
                    font-weight: bold;
                }
            }

            .card-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                width: 100%;
                margin-bottom: 8px;

                .card-more-btn {
                    width: 28px;
                    height: 28px;
                    border: none;
                    background: transparent;
                    border-radius: 6px;
                    color: #737686;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    margin: -4px -4px 0 0;
                    transition: all 0.15s;

                    span {
                        font-size: 18px;
                    }

                    &:hover {
                        background: #eff4ff;
                        color: #0b1c30;
                    }
                }

                .card-file-icon {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                }
            }

            .card-thumbnail-wrap {
                position: relative;
                width: 100%;
                height: 84px;
                border-radius: 10px;
                overflow: hidden;
                background: #e5eeff;
                display: flex;
                align-items: center;
                justify-content: center;

                .card-thumb-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .thumb-tag {
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    background: rgba(11, 28, 48, 0.7);
                    color: #ffffff;
                    font-size: 9px;
                    font-weight: 600;
                    padding: 2px 5px;
                    border-radius: 4px;
                    backdrop-filter: blur(4px);
                }

                .video-play-hint {
                    position: absolute;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(11, 28, 48, 0.75);
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(4px);

                    span {
                        font-size: 18px;
                        margin-left: 2px;
                    }
                }
            }

            .card-body {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-top: 4px;

                .card-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #0b1c30;
                    line-height: 1.35;

                    &:hover {
                        color: #004ac6;
                    }
                }

                .card-edit-box {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 4px;

                    .edit-btn-row {
                        display: flex;
                        gap: 8px;
                    }
                }

                .card-meta {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    color: #737686;

                    .meta-dot {
                        color: #c3c6d7;
                    }
                }
            }
        }
    }

    // 6. 列表视图 (List View)
    .list-canvas {
        padding: 0 12px;

        .list-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .aether-list-row {
            background: #ffffff;
            border-radius: 12px;
            padding: 10px 12px;
            box-shadow: 0 1px 3px rgba(11, 28, 48, 0.03);
            border: 1px solid #e5eeff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            cursor: pointer;
            transition: all 0.15s;

            &:hover {
                background: #eff4ff;
                border-color: #dce9ff;
            }

            &.is-selected {
                background: #eff4ff;
                border-color: #004ac6;
                box-shadow: 0 0 0 1px #004ac6;
            }

            .row-icon-box {
                position: relative;
                flex-shrink: 0;

                .row-file-icon {
                    width: 38px;
                    height: 38px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .selected-dot {
                    position: absolute;
                    top: -4px;
                    left: -4px;
                    width: 16px;
                    height: 16px;
                    background: #004ac6;
                    color: #ffffff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;

                    span {
                        font-size: 11px;
                    }
                }
            }

            .row-thumb-wrap {
                width: 38px;
                height: 38px;
                border-radius: 10px;
                overflow: hidden;
                background: #e5eeff;

                .row-thumb-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }

            .row-content {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;

                .row-title {
                    font-size: 13px;
                    font-weight: 500;
                    color: #0b1c30;

                    &:hover {
                        color: #004ac6;
                        font-weight: 600;
                    }
                }

                .row-sub-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    color: #737686;
                }
            }

            .row-right-actions {
                flex-shrink: 0;

                .row-more-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: none;
                    background: transparent;
                    color: #737686;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;

                    span {
                        font-size: 18px;
                    }

                    &:hover {
                        background: #dce9ff;
                        color: #0b1c30;
                    }
                }
            }
        }
    }

    // 图标容器样式
    .icon-avatar {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        span {
            font-size: 22px;
        }

        &.list-avatar {
            width: 36px;
            height: 36px;
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

    // 转码标签
    .transcode-tag {
        display: inline-block;
        font-size: 10px;
        padding: 1px 5px;
        border-radius: 4px;
        font-weight: 600;

        &.transcode-ing {
            background: #fef3c7;
            color: #b45309;
        }

        &.transcode-fail {
            background: #fee2e2;
            color: #dc2626;
        }
    }

    // 空状态
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 16px;
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

    // 分页器容器
    .pagination-footer {
        display: flex;
        justify-content: center;
        padding: 18px 12px 6px;
    }

    // 8. 底部交互抽屉面板 (Context Action Sheet Drawer)
    .aether-drawer-overlay {
        position: fixed;
        inset: 0;
        background: rgba(11, 28, 48, 0.45);
        backdrop-filter: blur(4px);
        z-index: 999;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    }

    .aether-drawer-sheet {
        background: #ffffff;
        border-radius: 24px 24px 0 0;
        padding: 12px 16px 32px;
        box-shadow: 0 -4px 24px rgba(11, 28, 48, 0.16);
        display: flex;
        flex-direction: column;
        gap: 14px;
        max-height: 80vh;
        overflow-y: auto;

        .drawer-drag-handle {
            width: 36px;
            height: 4px;
            border-radius: 9999px;
            background: #c3c6d7;
            margin: 0 auto 4px;
        }

        .drawer-file-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #eff4ff;
            padding: 12px 14px;
            border-radius: 16px;
            gap: 10px;

            .header-left {
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 0;
                flex: 1;

                .drawer-icon-wrap {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;

                    span {
                        font-size: 24px;
                    }
                }

                .header-info {
                    .drawer-file-name {
                        font-size: 14px;
                        font-weight: 600;
                        color: #0b1c30;
                    }

                    .drawer-file-meta {
                        font-size: 11px;
                        color: #565e74;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        margin-top: 2px;
                    }
                }
            }

            .drawer-close-btn {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: #e5eeff;
                border: none;
                color: #565e74;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                flex-shrink: 0;

                span {
                    font-size: 16px;
                }

                &:hover {
                    background: #dce9ff;
                    color: #0b1c30;
                }
            }
        }

        .drawer-quick-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            text-align: center;

            .quick-btn-card {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: 10px 4px;
                border-radius: 12px;
                background: #eff4ff;
                border: none;
                cursor: pointer;
                transition: all 0.15s;

                &:hover {
                    background: #e5eeff;
                }

                &:active {
                    transform: scale(0.95);
                }

                .quick-icon-circle {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;

                    span {
                        font-size: 20px;
                    }

                    &.bg-blue-tint {
                        background: #dbe1ff;
                        color: #004ac6;
                    }

                    &.bg-indigo-tint {
                        background: #dae2fd;
                        color: #565e74;
                    }

                    &.bg-amber-tint {
                        background: #ffddb8;
                        color: #784b00;
                    }
                }

                .quick-btn-label {
                    font-size: 11px;
                    font-weight: 500;
                    color: #0b1c30;
                }
            }
        }

        .drawer-action-list {
            background: #eff4ff;
            border-radius: 14px;
            overflow: hidden;

            .action-list-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 14px;
                cursor: pointer;
                transition: background 0.15s;

                &:hover {
                    background: #e5eeff;
                }

                .item-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;

                    .item-icon {
                        font-size: 20px;
                        color: #434655;
                    }

                    .item-text {
                        font-size: 13px;
                        font-weight: 500;
                        color: #0b1c30;
                    }
                }

                .item-arrow {
                    font-size: 16px;
                    color: #737686;
                }
            }
        }

        .drawer-danger-box {
            .danger-action-btn {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 14px;
                border-radius: 14px;
                background: #ffdad6;
                color: #ba1a1a;
                border: none;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.15s;

                span.material-symbols-outlined {
                    font-size: 20px;
                }

                &:hover {
                    background: #ffb4ab;
                }

                &:active {
                    transform: scale(0.98);
                }
            }
        }
    }

    // 抽屉动画
    .drawer-fade-enter-active,
    .drawer-fade-leave-active {
        transition: opacity 0.25s ease;
    }

    .drawer-fade-enter-from,
    .drawer-fade-leave-to {
        opacity: 0;
    }

    .drawer-slide-enter-active,
    .drawer-slide-leave-active {
        transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1);
    }

    .drawer-slide-enter-from,
    .drawer-slide-leave-to {
        transform: translateY(100%);
    }

    // 分享弹窗内容样式
    .share-file-name {
        font-weight: 600;
        color: #004ac6;
    }

    .share-result-body {
        padding: 8px 0;

        .share-success-tip {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #10b981;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;

            .tip-icon {
                font-size: 20px;
            }
        }

        .share-info-block {
            background: #eff4ff;
            padding: 12px;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;

            .info-row {
                display: flex;
                font-size: 13px;

                .info-label {
                    color: #565e74;
                    flex-shrink: 0;
                }

                .info-val {
                    color: #0b1c30;
                    word-break: break-all;

                    &.code-highlight {
                        color: #004ac6;
                        font-weight: 700;
                        font-family: 'JetBrains Mono', monospace;
                    }
                }
            }
        }
    }
}
</style>
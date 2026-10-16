<template>
    <div class="table-container">
        <ElTable ref="dataTable" :data="dataSource?.list || []" :height="tableHeight" :stripe="false" :border="false"
            @row-click="handleRowClick" @selection-change="handleSelectionChange" :header-cell-style="headerStyle"
            :cell-style="cellStyle" :row-class-name="tableRowClassName">
            <!-- selection选择框 -->
            <ElTableColumn v-if="options.selectType && options.selectType == 'checkbox'" type="selection" width="36"
                align="center">
            </ElTableColumn>

            <!-- 序号 -->
            <el-table-column v-if="options.showIndex" label="序号" type="index" align="center" width="50"></el-table-column>

            <template v-for="(column, index) in columns">
                <!-- 如果数据列中有插槽， 将其改造成插槽 -->
                <template v-if="column.scopedSlots">
                    <el-table-column :key="index" :prop="column.prop" :label="column.label"
                        :align="column.align || 'left'" :width="getColumnWidth(column)" :min-width="column.minWidth">
                        <template #default="scope">
                            <slot :name="column.scopedSlots" :index="scope.$index" :row="scope.row">
                            </slot>
                        </template>
                    </el-table-column>
                </template>
                <!-- 如果不是插槽，就正常操作 -->
                <template v-else>
                    <el-table-column :key="index" :prop="column.prop" :label="column.label"
                        :align="column.align || 'left'" :width="getColumnWidth(column)" :min-width="column.minWidth" :fixed="column.fixed">
                    </el-table-column>
                </template>
            </template>
        </ElTable>

        <div class="pagination" v-if="showPagination && (dataSource?.totalCount > 0)">
            <ElPagination
                v-model:current-page="dataSource.pageNo"
                v-model:page-size="dataSource.pageSize"
                :layout="layout"
                :total="dataSource?.totalCount || 0"
                :page-sizes="[10, 15, 30, 50]"
                @current-change="handlePageNoChange"
                @size-change="handlePageSizeChange"
                :small="isMobile"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElTable, ElTableColumn, ElPagination } from 'element-plus';

const props = defineProps({
    dataSource: {
        type: Object,
        default: () => ({
            list: [],
            totalCount: 0,
            pageSize: 15,
            pageNo: 1,
            pageTotal: 1
        })
    },
    showPagination: {
        type: Boolean,
        default: true
    },
    showPageSize: {
        type: Boolean,
        default: true
    },
    options: {
        type: Object,
        default: () => ({
            extHeight: 0,
            showIndex: false
        })
    },
    columns: Array,
    fetch: Function,
    initFetch: {
        type: Boolean,
        default: true
    }
})

// 将选中行传递给父组件
const emit = defineEmits(['rowSelected', 'rowClick'])

const dataTable = ref()

// 判断是否为移动设备
const isMobile = ref(window.innerWidth <= 768);

// 计算当前表格的高度
const tableHeight = ref(props.options?.tableHeight ? props.options.tableHeight : (window.innerHeight - 280 - (props.options?.extHeight || 0)))

const layout = computed(() => {
    if (isMobile.value) {
        return 'total, prev, pager, next'
    }
    return `total, ${props.showPageSize ? 'sizes,' : ''} prev, pager, next, jumper`
})

const init = () => {
    if (props.initFetch && props.fetch) {
        props.fetch()
    }
}

init()

// 设置选中
const selectCurrentRow = (rowKey, rowValue) => {
    let row = props.dataSource?.list?.find(item => item[rowKey] === rowValue)
    if (row && dataTable.value) {
        dataTable.value.setCurrentRow(row)
    }
}

// 清除选中
const clearSelection = () => {
    dataTable.value?.clearSelection()
}

defineExpose({ selectCurrentRow, clearSelection })

// 行点击
const handleRowClick = (row) => {
    emit('rowClick', row)
}

// 行选中（多行）
const handleSelectionChange = (val) => {
    emit('rowSelected', val)
}

// 页大小切换
const handlePageSizeChange = (size) => {
    if (!props.dataSource) return;
    if (size !== props.dataSource.pageSize) {
        props.dataSource.pageSize = size;
        props.dataSource.pageNo = 1;
        if (props.fetch) {
            props.fetch();
        }
    }
}

// 页码切换
const handlePageNoChange = (page) => {
    if (!props.dataSource) return;
    props.dataSource.pageNo = page;
    if (props.fetch) {
        props.fetch();
    }
}

// 监听窗口大小变化
const handleResize = () => {
    isMobile.value = window.innerWidth <= 768;
    updateTableHeight();
};

// 正确处理列宽，避免在移动端将列宽放大撑爆屏幕
const getColumnWidth = (column) => {
    if (!column.width) return undefined;
    if (isMobile.value) {
        // 移动端根据比例适当缩减固定列宽，确保不溢出
        const width = parseInt(column.width);
        if (isNaN(width)) return undefined;
        return Math.min(width, Math.floor(window.innerWidth * 0.3)) + 'px';
    }
    return column.width;
};

// 单元格样式
const cellStyle = computed(() => ({
    padding: isMobile.value ? '6px 4px' : '10px 12px',
    fontSize: isMobile.value ? '13px' : '14px',
    borderBottom: '1px solid #f2f3f5',
    color: '#1f2329',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
}))

// 表头样式
const headerStyle = computed(() => ({
    background: '#f7f8fa',
    color: '#4e5969',
    fontWeight: '600',
    fontSize: isMobile.value ? '12px' : '13px',
    padding: isMobile.value ? '6px 4px' : '10px 12px',
    borderBottom: '1px solid #e5e6eb',
    height: isMobile.value ? '36px' : '44px',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
}))

// 更新表格高度
const updateTableHeight = () => {
    if (props.options?.tableHeight) {
        tableHeight.value = props.options.tableHeight;
        return;
    }
    const ext = props.options?.extHeight || 0;
    if (isMobile.value) {
        tableHeight.value = window.innerHeight - 240 - ext;
    } else {
        tableHeight.value = window.innerHeight - 230 - ext;
    }
};

const tableRowClassName = () => {
    return 'file-row';
};

onMounted(() => {
    window.addEventListener('resize', handleResize);
    updateTableHeight();
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});
</script>

<style lang="scss">
.table-container {
    width: 100%;
    height: 100%;
    position: relative;

    .el-table {
        width: 100%;

        .el-table__body-wrapper {
            overflow-y: auto;
            overflow-x: hidden;
        }

        --el-table-border-color: transparent;
        background: transparent;

        .file-row {
            transition: background-color 0.15s ease;

            &:hover > td.el-table__cell {
                background-color: #f7f9fc !important;
            }

            td.el-table__cell {
                border-bottom: 1px solid #f0f2f5;
            }
        }

        &::before {
            display: none;
        }

        .el-table__header-wrapper .el-table__header {
            border: none;
        }

        th.el-table__cell .cell,
        td.el-table__cell .cell {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 0 4px;
        }
    }

    .pagination {
        flex-shrink: 0;
        padding: 12px 0 6px;
        display: flex;
        justify-content: center;
        background: transparent;

        @media screen and (max-width: 768px) {
            padding: 8px 0;

            .el-pagination {
                font-size: 12px;
            }
        }
    }
}
</style>
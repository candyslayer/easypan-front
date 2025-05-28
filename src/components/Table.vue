<template>
    <div class="table-container">
        <ElTable ref="dataTable" :data="dataSource?.list || []" :height="tableHeight" :stripe="false" :border="false"
            @row-click="handleRowClick" @selection-change="handleSelectionChange" :header-cell-style="headerStyle"
            :cell-style="cellStyle" :row-class-name="tableRowClassName">
            <!-- selection选择框 -->
            <ElTableColumn v-if="options.selectType && options.selectType == 'checkbox'" type="selection" width="18"
                align="center">
            </ElTableColumn>

            <!-- 序号 -->
            <el-table-column v-if="options.showIndex" label="序号" type="index" align="center"></el-table-column>

            <template v-for="(column, index) in columns">
                <!-- 如果数据列中有插槽， 将其改造成插槽 -->
                <template v-if="column.scopedSlots">
                    <el-table-column :key="index" :prop="column.prop" :label="column.label"
                        :align="column.align || 'left'" :width="getColumnWidth(column)">
                        <template #default="scope">
                            <slot :name="column.scopedSlots" :index="scope.$index" :row="scope.row">
                            </slot>
                        </template>
                    </el-table-column>
                </template>
                <!-- 如果不是插槽，就正常操作 -->
                <template v-else>
                    <el-table-column :key="index" :prop="column.prop" :label="column.label"
                        :align="column.align || 'left'" :width="getColumnWidth(column)" :fixed="column.fixed">
                    </el-table-column>
                </template>
            </template>

        </ElTable>

        <div class="pagination" v-if="showPagination">
            <ElPagination v-if="dataSource?.pageTotal > 1" :layout="layout" :total="dataSource?.totalCount || 0"
                :page-sizes="[10, 15, 30, 50]" :page-size="dataSource?.pageSize || 10"
                @current-change="handlePageNoChange" @size-change="handlePageSizeChange"
                :current-page.sync="dataSource?.pageNo" :small="isMobile">
            </ElPagination>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElTable, ElTableColumn, ElPagination, textProps } from 'element-plus';

const props = defineProps({
    dataSource: {
        type: Object,
        default: () => ({
            list: [],
            totalCount: 0,    // 确保与后端返回的属性名一致
            pageSize: 15,
            pageNo: 1,        // 使用 pageNo 而不是 pageNum
            pageTotal: 1      // 添加总页数
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
        default: {
            extHeight: 0,
            showIndex: false
        }
    },
    columns: Array,
    fetch: Function,
    initFetch: {
        type: Boolean,
        default: true
    }
})

//将选中行传递给父组件
const emit = defineEmits(['rowSelected', 'rowClick'])

const dataTable = ref()

//计算当前表格的宽度实现内部移动
const tableHeight = ref(props.options.tableHeight ? props.options.tableHeight : window.innerHeight - 350 - props.options.extHeight)

const layout = computed(() => {
    return `total, ${props.showPageSize ? 'sizes' : ''}, prev, pager, next, jumper`
})

const init = () => {
    if (props.initFetch && props.fetch) {
        props.fetch()
    }
}

init()

//设置选中
const selectCurrentRow = (rowKey, rowValue) => {
    let row = props.dataSource.list.find(item => item[rowKey] === rowValue)
    dataTable.value.setCurrentRow(row)
}

//清除选中
const clearSelection = () => {
    dataTable.value.clearSelection()
}

defineExpose({ selectCurrentRow, clearSelection })

//行点击
const handleRowClick = (row) => {
    emit('rowClick', row)
}

//行选中（多行）
const handleSelectionChange = (val) => {
    emit('rowSelected', val)
}

//页大小切换
const handlePageSizeChange = (size) => {
    if (!props.dataSource) return;

    if (size !== props.dataSource.pageSize) {
        props.dataSource.pageSize = size;
        props.dataSource.pageNo = 1;  // 切换页大小时重置为第一页
        if (props.fetch) {
            props.fetch();
        }
    }
}

//页码切换
const handlePageNoChange = (page) => {
    console.log(page)
    props.dataSource.pageNo = page

    props.fetch()
}

// 判断是否为移动设备
const isMobile = ref(window.innerWidth <= 768);

// 获取屏幕放大比例
const getScreenScale = () => {
    const baseWidth = 330; // 基准屏幕宽度
    const currentWidth = window.innerWidth;
    if (currentWidth >= baseWidth) {
        return (currentWidth / baseWidth); // 返回放大比例
    }
    return 1; // 小于基准宽度返回1
};

// 监听窗口大小变化
const handleResize = () => {
    isMobile.value = window.innerWidth <= 768;
    updateTableHeight();
};

// 添加处理列宽的函数
const getColumnWidth = (column) => {
    const scale = getScreenScale();
    if (scale > 1) {
        const width = parseInt(column.width);
        // 根据比例计算新的宽度，并限制最大值
        return Math.min(Math.floor(width * scale), width * 2) + 'px';
    }
    return column.width;
};

// 修改现有的 cellStyle
const cellStyle = computed(() => ({
    padding: isMobile.value ? '3px' : '8px',
    fontSize: isMobile.value ? '13px' : '15px',
    borderBottom: 'none',
    whiteSpace: 'nowrap',  // 防止换行
    overflow: 'hidden',    // 超出隐藏
    textOverflow: 'ellipsis', // 显示省略号
}))

// 修改现有的 headerStyle
const headerStyle = computed(() => ({
    background: 'transparent',
    color: '#666',
    fontWeight: '500',
    padding: isMobile.value ? '0 4px' : '8px', // 移动端减少内边距
    borderBottom: 'none',
    height: isMobile.value ? '28px' : '32px',
    userSelect: 'none',
    whiteSpace: 'nowrap',  // 防止换行
    overflow: 'hidden',    // 超出隐藏
    textOverflow: 'ellipsis', // 显示省略号
    textAlign: 'center'
}))

// 更新表格高度
const updateTableHeight = () => {
    if (isMobile.value) {
        // 移动端计算高度：视口高度 - 头部导航 - 菜单区域 - 操作区域 - 底部导航 - 边距
        tableHeight.value = window.innerHeight - 280;
    } else {
        // PC端计算高度：视口高度 - 头部导航 - 菜单区域 - 操作区域 - 边距
        tableHeight.value = window.innerHeight - 60 - 70 - 60 - 40;
    }
};

// 添加行样式
const tableRowClassName = ({ row, rowIndex }) => {
    return 'file-row';
};

// 生命周期钩子
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
    position: relative;  // 改回使用相对定位

    .el-table {
        width: 100%;
        
        // 让表格体部分滚动，注意权重
        .el-table__body-wrapper {
            overflow-y: auto;
            overflow-x: hidden;
        }

        // 基础样式
        --el-table-border-color: transparent;
        background: transparent;
        
        // 移动端适配
        @media screen and (max-width: 768px) {
            font-size: 13px;

            .el-table__cell {
                padding: 6px 4px;
            }
        }

        // 表格行样式
        .file-row {
            border-radius: 8px;
            margin: 4px 0;
            transition: background-color 0.2s;

            &:hover {
                background-color: var(--el-fill-color-light);
            }

            td {
                border: none;
                transition: background-color 0.2s;
            }
        }

        // 去除表格边框
        &::before {
            display: none;
        }

        // 表头样式优化
        .el-table__header-wrapper {
            .el-table__header {
                border: none;
            }
        }

        // 添加表头样式
        th.el-table__cell {
            .cell {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }

        // 添加单元格样式
        td.el-table__cell {
            .cell {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }

        // 移动端特殊处理
        @media screen and (max-width: 768px) {
            th.el-table__cell {
                padding: 0 4px !important;

                .cell {
                    padding: 0 !important;
                }
            }

            td.el-table__cell {
                padding: 4px !important;

                .cell {
                    padding: 0 !important;
                    line-height: 45px;
                }
            }
        }
    }

    // 分页器样式优化
    .pagination {
        flex-shrink: 0; // 防止分页器被压缩
        padding: 16px 0;
        display: flex;
        justify-content: center;
        background: var(--el-bg-color);
        margin-top: 10px;

        @media screen and (max-width: 768px) {
            padding: 8px 0;

            .el-pagination {
                font-size: 12px;
                transform: scale(0.9);

                .el-pagination__sizes {
                    display: none;
                }
            }
        }
    }
}
</style>
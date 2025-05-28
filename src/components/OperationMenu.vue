<template>
    <div class="operation-menu">
        <div class="button-wrapper">
            <div class="button-container" :class="{ 'collapsed': showMore }">
                <!-- 动态显示的按钮 -->
                <el-button 
                    v-for="item in currentOperations" 
                    :key="item.name"
                    :type="item.type"
                    size="small"
                    class="oper-btn"
                    circle
                >
                    <slot :name="item.name">
                        <span :class="['icon-font', item.icon]"></span>
                    </slot>
                </el-button>
                
                <!-- 更多/返回按钮 -->
                <el-button 
                    type="info"
                    size="small"
                    class="oper-btn toggle-btn"
                    :class="{ 'is-more': !showMore }"
                    @click="toggleMore"
                    circle
                >
                    <span class="icon-font dripicons-dots-3"></span>
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, defineProps } from 'vue';
import { ElButton } from 'element-plus';

const emit = defineEmits(['loadFileList'])

// 定义 props
const props = defineProps({
    operations: {
        type: Array,
        required: true,
        default: () => [
            { name: '上传', icon: 'dripicons-upload', type: 'primary' },
            { name: '下载', icon: 'dripicons-download', type: 'success'},
            { name: '删除', icon: 'dripicons-trash', type: 'danger'},
            { name: '分享', icon: 'dripicons-direction', type: 'warning' },
            { name: '新建文件夹', icon: 'dripicons-folder', type: 'info'}
        ]
    }
});

const showMore = ref(false);

// 根据状态显示不同的按钮
const currentOperations = computed(() => 
    showMore.value ? props.operations.slice(2) : props.operations.slice(0, 2)
);

const toggleMore = () => {
    showMore.value = !showMore.value;
};
</script>

<style lang="scss" scoped>
.operation-menu {
    padding: 5px 5px;
    overflow: hidden;
    
    .button-wrapper {
        position: relative;
    }

    .button-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: flex-end;
        
        .oper-btn {
            transform: translateX(0) scale(1);  // 初始状态
            opacity: 1;
            
            &.toggle-btn {
                order: 2;
                transition: order 0s;
            }

            &:not(.toggle-btn) {
                order: 1;
            }

            .icon-font {
                font-size: 13px;  // 调整图标大小
                vertical-align: middle;
            }

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
        }

        &.collapsed {
            .toggle-btn {
                order: 0;
            }
            
            .oper-btn:not(.toggle-btn) {
                order: 1;
                animation: springIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                
                @for $i from 1 through 5 {
                    &:nth-child(#{$i}) {
                        animation-delay: #{$i * 0.08}s;
                    }
                }
            }
        }

        &:not(.collapsed) .oper-btn:not(.toggle-btn) {
            animation: springOut 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            
            @for $i from 1 through 5 {
                &:nth-child(#{$i}) {
                    animation-delay: #{($i - 1) * 0.08}s;
                }
            }
        }
    }
}

@keyframes springIn {
    0% {
        transform: translateX(50px) scale(0.8);
    }
    50% {
        transform: translateX(-10px) scale(1.1);
    }
    100% {
        transform: translateX(0) scale(1);
    }
}

@keyframes springOut {
    0% {
        transform: translateX(0) scale(1);
    }
    50% {
        transform: translateX(-10px) scale(1.1);
    }
    100% {
        transform: translateX(-50px) scale(0.8);
    }
}
</style>
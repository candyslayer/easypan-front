<template>
    <div class="window" v-if="show">
        <div class="window-mask" v-if="show" @click="close"></div>
        <div class="close" @click="close">
            <span class="dripicons-cross"></span>
        </div>
        <div class="window-content" :style="{
            top: '0px',
            left: windowContentLeft + 'px',
            width: windowContentWidth + 'px',
        }">
            <div class="title">
                {{ title }}
            </div>
            <div class="content-body" :style="{ 'align-items': align }">
                <slot></slot>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";

const props = defineProps({
    show: {
        type: Boolean,
    },
    width: {
        type: Number,
        default: 1000,
    },
    title: {
        type: String,
    },
    align: {
        type: String,
        default: "top",
    },
});

const windowWidth = ref(window.innerWidth);
const windowContentWidth = computed(() => {
    // 移动端宽度占满屏幕
    if (windowWidth.value <= 768) {
        return windowWidth.value;
    }
    // PC端保持原有逻辑
    return props.width > windowWidth.value ? windowWidth.value : props.width;
});

const windowContentLeft = computed(() => {
    // 移动端靠左对齐
    if (windowWidth.value <= 768) {
        return 0;
    }
    // PC端保持居中
    let left = windowWidth.value - props.width;
    return left < 0 ? 0 : left / 2;
});

const emit = defineEmits(["close"]);
const close = () => {
    emit("close");
};

const resizeWindow = () => {
    windowWidth.value = window.innerWidth;
};

onMounted(() => {
    window.addEventListener("resize", resizeWindow);
});

onUnmounted(() => {
    window.removeEventListener("resize", resizeWindow);
});
</script>

<style lang="scss">
.window {
    .window-mask {
        top: 0px;
        left: 0px;
        width: 100%;
        height: calc(100vh);
        z-index: 200;
        opacity: 0.5;
        background: #000;
        position: fixed;
    }

    .close {
        z-index: 202;
        cursor: pointer;
        position: absolute;
        top: 40px;
        right: 30px;
        width: 44px;
        height: 44px;
        border-radius: 22px;
        background: #606266;
        display: flex;
        justify-content: center;
        align-items: center;

        .dripicons-cross {
            font-size: 16px;
            color: #fff;
        }

        // 修改关闭按钮样式，适配移动端
        @media screen and (max-width: 768px) {
            top: 6px;           // 调整位置更靠上
            right: 6px;         // 调整位置更靠右
            width: 24px;        // 减小尺寸
            height: 24px;
            border-radius: 12px;
            background: transparent;  // 移除背景色
            padding-top: 15px;

            .dripicons-cross {
                font-size: 14px;
                color: #666;    // 改变图标颜色
            }
        }
    }

    .window-content {
        top: 0px;
        z-index: 201;
        position: absolute;
        background: #fff;

        .title {
            text-align: center;
            line-height: 40px;
            border-bottom: 1px solid #ddd;
            font-weight: bold;

            // 修改标题样式，适配移动端
            @media screen and (max-width: 768px) {
                padding-top: 25px;      // 添加顶部内边距
                line-height: 36px;     // 减小行高
                font-size: 13px;       // 设置字体大小为13px
                font-weight: normal;    // 移除粗体
                background: transparent; // 移除背景色
                border-bottom: none;    // 移除底部边框
            }
        }

        .content-body {
            height: calc(100vh - 41px);
            display: flex;
            overflow: auto;

            // 修改内容区域样式，适配移动端
            @media screen and (max-width: 768px) {
                height: calc(100vh - 51px);
                padding: 10px;
                box-sizing: border-box;
            }

            // 添加滚动条样式优化
            &::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }

            &::-webkit-scrollbar-thumb {
                background: #ccc;
                border-radius: 3px;
            }

            &::-webkit-scrollbar-track {
                background: #f1f1f1;
            }
        }

        // 添加移动端手势支持
        @media screen and (max-width: 768px) {
            touch-action: pan-y pinch-zoom;
            -webkit-overflow-scrolling: touch;
        }
    }

    // 移动端下移除背景色
    @media screen and (max-width: 768px) {
        .window-mask {
            background: rgba(0, 0, 0, 0.3); // 降低遮罩层透明度
        }

        .window-content {
            background: transparent;    // 移除内容区域背景色
        }
    }
}
</style>
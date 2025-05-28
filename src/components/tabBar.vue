<template>
    <div class="tab-bar">
        <ElTabs v-model="activePick" tab-position="bottom">
            <ElTabPane 
                v-for="(tab, index) in tabConfig" 
                :key="index"
                :label="tab.label" 
                :name="tab.name"
            >
                <template #label>
                    <span :class="['icon-font', tab.icon]"></span>
                    <span class="tab-label">{{ tab.label }}</span>
                </template>
            </ElTabPane>
        </ElTabs>
    </div>
</template>

<script setup>
import { ElTabs, ElTabPane } from 'element-plus';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const activePick = ref('home');

// 标签页配置
const tabConfig = [
    {
        label: '主页',
        name: 'home',
        icon: 'dripicons-home',
        path: '/main/home'
    },
    {
        label: '传输列表',
        name: 'transfer',
        icon: 'dripicons-network-3',
        path: '/main/transfer'
    },
    {
        label: '分享',
        name: 'share',
        icon: 'dripicons-direction',
        path: '/main/share'
    },
    {
        label: '回收站',
        name: 'recycle',
        icon: 'dripicons-trash',
        path: '/main/recycle'
    },
    {
        label: '用户',
        name: 'user',
        icon: 'dripicons-user',
        path: '/main/user'
    }
];

// 监听标签页变化并进行路由跳转
// watch(activePick, (newVal) => {
//     const tab = tabConfig.find(item => item.name === newVal);
//     if (tab) {
//         router.push(tab.path);
//     }
// });
</script>

<style lang="scss">
.tab-bar {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .el-tabs__item {
        font-size: 20px;
        color: #626aef;
        flex-direction: column;

        .tab-label {
            font-size: 10px;
        }

        &.is-active {
            color: #414372;
            /* 活动状态颜色 */
        }

        &:hover {
            color: #414372;
            /* 悬停状态颜色 */
        }
    }

    .el-tabs__active-bar {
        background-color: #414372;
    }
}
</style>
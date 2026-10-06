<template>
    <div class="app-framework">
        <div class="app-header">
            <!-- TopMenu 内容 -->
            <div class="nav-bar" v-if="navShow">
                <div class="user-switch">
                    <span v-if="userInfo.isAdmin" class="user-role is-admin">
                        <span class="dripicons-shield" style="margin-right: 4px;"></span>管理员
                    </span>
                    <span v-else class="user-role">
                        EasyPan 网盘
                    </span>
                </div>

                <div class="profile-section">
                    <div class="upload-icon" @click="router.push('/transfer')">
                        <div class="network-icon" title="传输列表"><span class="dripicons-network-2"></span></div>
                    </div>

                    <div @click="router.push('/user')" style="cursor: pointer;">
                        <Avatar :user-id="userInfo.userId" :size="35"></Avatar>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="isMainRoute" class="menu-section">
            <FileMenu></FileMenu>

        </div>

        <div class="content-section">
            <Transfer v-show="isTransferShow" ref="transferInstance"></Transfer>
            <router-view v-slot="{Component}">
                <transition name="fade-slide" mode="out-in">
                    <component v-if="!isTransferRoute" :is="Component" ref="routerViewRef" @addFile="addFile"></component>
                </transition>
            </router-view>
        </div>

        <div class="footer-bar">
            <!-- TabBar 内容 -->
            <div class="tab-navigation">
                <ElTabs v-model="activePick" tab-position="bottom" @tab-change="onChange">
                    <ElTabPane v-for="(tab, index) in tabConfig" :key="index" :label="tab.label" :name="tab.name">
                        <template #label>
                            <span :class="['icon-class', tab.icon]"></span>
                            <span class="tab-text">{{ tab.label }}</span>
                        </template>
                    </ElTabPane>
                </ElTabs>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, getCurrentInstance, provide, ref, watch } from 'vue';
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon, ElTabs, ElTabPane } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import Avatar from '../components/Avatar.vue';
import FileMenu from '../components/FileMenu.vue';
import Transfer from './transfer/Transfer.vue';
import { useRouter, useRoute, RouterView } from 'vue-router';

const { proxy } = getCurrentInstance()
const router = useRouter();
const route = useRoute();

const routerViewRef = ref()
const transferInstance = ref(null)

const userInfo = computed(() => proxy.vueCookies.get('userInfo') || {})

const addFile = (data) => {
    const { file, filePid } = data;
    transferInstance.value.addFile(file, filePid)
}

const activePick = ref('main/all');
const tabConfig = [
    { label: '主页', name: 'main/all', icon: 'dripicons-home', path: '/main/home' },
    { label: '传输列表', name: 'transfer', icon: 'dripicons-network-3', path: '/main/transfer' },
    { label: '分享', name: 'myshare', icon: 'dripicons-direction', path: '/main/share' },
    { label: '回收站', name: 'recycle', icon: 'dripicons-trash', path: '/main/recycle' },
    { label: '用户', name: 'user', icon: 'dripicons-user', path: '/main/user' }
];

const navShow = ref(true)

watch(
    () => route.path,
    (newPath) => {
        if (newPath.includes('user')) {
            activePick.value = 'user'
            navShow.value = false
        } else if (newPath.includes('recycle')) {
            activePick.value = 'recycle'
            navShow.value = true
        } else if (newPath.includes('share') || newPath.includes('myshare')) {
            activePick.value = 'myshare'
            navShow.value = true
        } else if (newPath.includes('transfer')) {
            activePick.value = 'transfer'
            navShow.value = true
        } else if (newPath.includes('main')) {
            activePick.value = 'main/all'
            navShow.value = true
        }
    },
    { immediate: true }
)

const onChange = (name) => {
    if (name === "user") {
        navShow.value = false
    } else {
        navShow.value = true
    }
    router.push(`/${name}`)
}

const isTransferRoute = computed(() => {
    return route.path.includes('transfer')
})

const isTransferShow = computed(() => isTransferRoute.value);

const isMainRoute = computed(() => {
    return route.path.includes('main')
})
</script>

<style lang="scss">
.app-framework {
    display: flex;
    flex-direction: column;

    .app-header {
        width: 100%;
        background-color: #fff;
    }

    .nav-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        box-sizing: border-box;

        .user-switch {
            .user-role {
                font-size: 15px;
                color: #626aef;
                font-weight: 600;

                &.is-admin {
                    color: #e6a23c;
                    display: flex;
                    align-items: center;
                }
            }
        }

        .profile-section {
            display: flex;
            justify-content: flex-end;
            align-items: center;

            .network-icon {
                font-size: 15px;
                margin-right: 15px;
                color: rgb(114, 105, 120);
                cursor: pointer;
            }
        }
    }

    .menu-section {
        width: 100%;
        border-radius: 8px;
        padding: 10px;
        margin: 10px 0;
        box-sizing: border-box;
    }

    .operation-section {
        margin: 5px;
    }

    .content-section {
        flex: 1;
        overflow-y: auto;
        padding-bottom: 60px;
    }

    .footer-bar {
        width: 100%;
        position: fixed;
        bottom: 0;
        left: 0;
        background-color: #fff;
        z-index: 10;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
        border-top: 1px solid #ebeef5;
    }

    .tab-navigation {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        .el-tabs__item {
            font-size: 20px;
            color: #8c8fae;
            flex-direction: column;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            user-select: none;
            padding: 4px 18px !important;

            .icon-class {
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                display: inline-block;
            }

            .tab-text {
                font-size: 11px;
                font-weight: 500;
                margin-top: 3px;
                transition: color 0.2s;
            }

            &.is-active {
                color: #409eff;

                .icon-class {
                    animation: tabBounce 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
                    transform: translateY(-2px) scale(1.15);
                    color: #409eff;
                }

                .tab-text {
                    font-weight: 600;
                    color: #409eff;
                }
            }

            &:hover {
                color: #409eff;
            }
        }

        .el-tabs__active-bar {
            background-color: #409eff;
            height: 3px;
            border-radius: 3px;
        }
    }
}
</style>
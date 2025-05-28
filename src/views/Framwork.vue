<template>
    <div class="app-framework">
        <div class="app-header">
            <!-- TopMenu 内容 -->
            <div class="nav-bar"  v-if="navShow">
                <div class="user-switch">
                    <ElDropdown>
                        <span class="user-role">管理员
                            <ElIcon>
                                <ArrowDown />
                            </ElIcon>
                        </span>
                        <template #dropdown>
                            <ElDropdownMenu>
                                <ElDropdownItem>
                                    <span class="user-role">切换到用户</span>
                                </ElDropdownItem>
                            </ElDropdownMenu>
                        </template>
                    </ElDropdown>
                </div>

                <div class="profile-section">
                    <div class="upload-icon">
                        <div class="network-icon"><span class="dripicons-network-2"></span></div>
                    </div>

                    <div>
                        <Avatar :user-id="proxy.vueCookies.get('userInfo').userId" :size="35"></Avatar>
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
                <component v-if="!isTransferRoute" :is="Component" ref="routerViewRef" @addFile="addFile"></component>
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
import { computed, getCurrentInstance, provide, ref } from 'vue';
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon, ElTabs, ElTabPane } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import Avatar from '../components/Avatar.vue';
import FileMenu from '../components/FileMenu.vue';
import Transfer from './transfer/Transfer.vue';
import { useRouter,useRoute,RouterView } from 'vue-router';

const { proxy } = getCurrentInstance()
const router = useRouter();
const route = useRoute();

const routerViewRef = ref()

const transferInstance = ref(null)

const addFile = (data) => {
    const { file, filePid } = data;

    console.log(transferInstance.value)

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

const navShow=ref(true)

const onChange = (name) => {
    if (name == "user") {
        navShow.value = false
    } else {
        navShow.value = true
    }

    router.push(`${'/' + name}`)
}

const isTransferRoute = computed(() => {
    return route.path.includes('transfer')
})

// 控制 Transfer 组件的显示/隐藏
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
    }

    .footer-bar {
        width: 100%;
        position: fixed;
        bottom: 0;
        left: 0;
        background-color: #fff;
        z-index: 1;
    }

    .tab-navigation {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        .el-tabs__item {
            font-size: 20px;
            color: #626aef;
            flex-direction: column;

            .tab-text {
                font-size: 10px;
            }

            &.is-active {
                color: #414372;
            }

            &:hover {
                color: #414372;
            }
        }

        .el-tabs__active-bar {
            background-color: #414372;
        }
    }
}
</style>
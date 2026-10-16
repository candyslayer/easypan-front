<template>
    <div class="app-framework">
        <header class="app-header" v-if="navShow">
            <div class="nav-bar">
                <!-- 品牌与标题区 -->
                <div class="brand-zone" @click="router.push('/main/all')">
                    <div class="brand-logo-icon">
                        <span class="material-symbols-outlined cloud-icon">cloud</span>
                    </div>
                    <div class="brand-text-col">
                        <span class="brand-title">EasyPan</span>
                        <span class="brand-subtitle">Files</span>
                    </div>
                    <span v-if="userInfo.isAdmin" class="admin-badge">管理员</span>
                </div>

                <!-- 右侧操作区 -->
                <div class="header-actions">
                    <!-- 传输任务入口 -->
                    <button class="header-icon-btn" @click="router.push('/transfer')" title="传输中心">
                        <span class="material-symbols-outlined">sync</span>
                    </button>

                    <!-- 用户头像/个人中心 -->
                    <div class="user-avatar-wrap" @click="router.push('/user')" title="个人中心">
                        <Avatar :user-id="userInfo.userId" :size="32"></Avatar>
                    </div>
                </div>
            </div>
        </header>

        <div v-if="isMainRoute" class="menu-section">
            <FileMenu></FileMenu>
        </div>

        <div class="content-section">
            <Transfer v-show="isTransferShow" ref="transferInstance"></Transfer>
            <router-view v-slot="{Component}">
                <transition name="fade-slide" mode="out-in">
                    <component v-if="!isTransferRoute" :is="Component" :key="route.fullPath" ref="routerViewRef" @addFile="addFile"></component>
                </transition>
            </router-view>
        </div>

        <div class="footer-bar">
            <!-- Aether Drive 风格底部导航栏 (Bottom Navigation Bar) -->
            <nav class="aether-bottom-nav">
                <div
                    v-for="(tab, index) in tabConfig"
                    :key="index"
                    class="nav-tab-item"
                    :class="{ 'is-active': activePick === tab.name }"
                    @click="onChange(tab.name)"
                >
                    <div class="nav-icon-box">
                        <span class="material-symbols-outlined nav-icon">{{ tab.icon }}</span>
                    </div>
                    <span class="nav-label">{{ tab.label }}</span>
                </div>
            </nav>
        </div>
    </div>
</template>

<script setup>
import { computed, getCurrentInstance, provide, ref, watch } from 'vue';
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
    { label: '我的文件', name: 'main/all', icon: 'folder', path: '/main/home' },
    { label: '传输', name: 'transfer', icon: 'sync', path: '/main/transfer' },
    { label: '共享', name: 'myshare', icon: 'group', path: '/main/share' },
    { label: '回收站', name: 'recycle', icon: 'delete', path: '/main/recycle' },
    { label: '我的', name: 'user', icon: 'person', path: '/main/user' }
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
    min-height: 100vh;
    background-color: #f8f9ff;
    color: #0b1c30;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

    .app-header {
        width: 100%;
        background-color: rgba(248, 249, 255, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(220, 233, 255, 0.6);
        position: sticky;
        top: 0;
        z-index: 50;
        box-shadow: 0 1px 6px rgba(11, 28, 48, 0.03);
    }

    .nav-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 16px;
        box-sizing: border-box;
        height: 56px;

        .brand-zone {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            user-select: none;

            .brand-logo-icon {
                width: 32px;
                height: 32px;
                border-radius: 10px;
                background: linear-gradient(135deg, #2563eb, #004ac6);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                box-shadow: 0 2px 8px rgba(37, 99, 235, 0.28);

                .cloud-icon {
                    font-size: 20px;
                }
            }

            .brand-text-col {
                display: flex;
                flex-direction: column;
                line-height: 1.1;

                .brand-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #0b1c30;
                    letter-spacing: -0.02em;
                }

                .brand-subtitle {
                    font-size: 11px;
                    font-weight: 500;
                    color: #565e74;
                }
            }

            .admin-badge {
                font-size: 11px;
                padding: 2px 8px;
                border-radius: 9999px;
                background: #ffddb8;
                color: #784b00;
                font-weight: 600;
                margin-left: 4px;
            }
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 8px;

            .header-icon-btn {
                width: 36px;
                height: 36px;
                border-radius: 10px;
                border: none;
                background: transparent;
                color: #434655;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.18s ease;

                .material-symbols-outlined {
                    font-size: 21px;
                }

                &:hover {
                    background: #e5eeff;
                    color: #004ac6;
                }

                &:active {
                    transform: scale(0.94);
                }
            }

            .user-avatar-wrap {
                cursor: pointer;
                margin-left: 2px;
                transition: transform 0.18s;

                &:hover {
                    transform: scale(1.05);
                }
            }
        }
    }

    .menu-section {
        width: 100%;
        padding: 4px 12px 0;
        box-sizing: border-box;
    }

    .content-section {
        flex: 1;
        overflow-y: auto;
        padding: 0 12px calc(80px + env(safe-area-inset-bottom, 12px));
        box-sizing: border-box;

        @media screen and (min-width: 769px) {
            padding: 0 20px 88px;
        }
    }

    .footer-bar {
        width: 100%;
        position: fixed;
        bottom: 0;
        left: 0;
        background-color: rgba(248, 249, 255, 0.88);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        z-index: 50;
        box-shadow: 0 -2px 12px rgba(11, 28, 48, 0.04);
        border-top: 1px solid rgba(220, 233, 255, 0.7);
        padding-bottom: env(safe-area-inset-bottom, 4px);
    }

    .aether-bottom-nav {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-around;
        height: 56px;
        margin: 0;
        padding: 0 6px;
        box-sizing: border-box;

        .nav-tab-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            user-select: none;
            padding: 4px 0;
            color: #565e74;
            transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);

            .nav-icon-box {
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;

                .nav-icon {
                    font-size: 22px;
                    line-height: 1;
                    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s;
                }
            }

            .nav-label {
                font-size: 11px;
                font-weight: 500;
                margin-top: 2px;
                line-height: 1.2;
                letter-spacing: -0.01em;
                transition: color 0.2s, font-weight 0.2s;
            }

            &:active {
                opacity: 0.7;
            }

            &.is-active {
                color: #004ac6;

                .nav-icon {
                    transform: scale(1.12);
                    color: #004ac6;
                    font-variation-settings: 'FILL' 1;
                }

                .nav-label {
                    font-weight: 600;
                    color: #004ac6;
                }
            }
        }
    }
}
</style>
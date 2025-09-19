<template>
    <div class="user-page">
        <!-- 背景装饰 -->
        <div class="bg-layer"></div>

        <!-- 内容容器 -->
        <div class="user-layout">
            <!-- 个人信息卡片 -->
            <section class="card user-profile" aria-labelledby="profileTitle">
                <h2 id="profileTitle" class="visually-hidden">用户信息</h2>
                <div class="avatar-wrap">
                    <Avatar :user-id="userInfo?.userId" :size="80" />
                    <div class="user-meta">
                        <p class="nickname" :title="userInfo?.nickName">{{ userInfo?.nickName || '未登录' }}</p>
                        <p class="uid" v-if="userInfo?.userId">ID：{{ userInfo.userId }}</p>
                    </div>
                </div>
                <div class="quick-actions">
                    <button class="qa-btn" @click="activeItem = 'info'" :class="{ active: activeItem==='info' }" aria-label="修改头像">
                        <i class="iconfont icon-user"></i>
                        <span>修改头像</span>
                    </button>
                    <button class="qa-btn" @click="activeItem = 'password'" :class="{ active: activeItem==='password' }" aria-label="修改密码">
                        <i class="iconfont icon-password"></i>
                        <span>修改密码</span>
                    </button>
                    <button class="qa-btn" @click="activeItem = 'logout'" :class="{ active: activeItem==='logout' }" aria-label="退出登录">
                        <i class="iconfont icon-logout"></i>
                        <span>退出登录</span>
                    </button>
                </div>
            </section>

            <!-- 存储空间卡片 -->
            <section class="card storage-card" aria-labelledby="storageTitle">
                <h2 id="storageTitle" class="card-title">
                    <i class="iconfont icon-storage"></i>
                    <span>存储空间</span>
                </h2>

                <div v-if="spaceLoading" class="skeleton-wrapper">
                    <div class="skeleton circle"></div>
                    <div class="skeleton line"></div>
                    <div class="skeleton line short"></div>
                </div>
                <div v-else class="progress-wrapper">
                    <ElProgress type="dashboard" :percentage="percentValue" :color="progressColor">
                        <template #default="{ percentage }">
                            <div class="progress-info">
                                <p class="progress-text main">已使用 {{ percentage }}%</p>
                                <p class="progress-text">总空间：{{ proxy.Utils.size2Str(spaceUse.totalSpace) }}</p>
                                <p class="progress-text">已用：{{ proxy.Utils.size2Str(spaceUse.useSpace) }}</p>
                                <p class="progress-text remain" v-if="spaceUse.totalSpace">剩余：{{ proxy.Utils.size2Str(remainSpace) }}</p>
                            </div>
                        </template>
                    </ElProgress>
                    <div class="linear-bar" role="progressbar" :aria-valuenow="percentValue" aria-valuemin="0" aria-valuemax="100">
                        <div class="bar-track">
                            <div class="bar-fill" :style="{ width: percentValue + '%' , background: progressGradient }"></div>
                        </div>
                        <div class="bar-desc">
                            <span>使用 {{ percentValue }}%</span>
                            <span>{{ proxy.Utils.size2Str(spaceUse.useSpace) }} / {{ proxy.Utils.size2Str(spaceUse.totalSpace) }}</span>
                        </div>
                    </div>
                </div>

                <p v-if="!spaceLoading && !spaceUse.totalSpace" class="empty-tip">暂无空间信息</p>
            </section>
        </div>
    </div>
</template>

<script setup>
import { ElProgress } from 'element-plus'
import Avatar from '@/components/Avatar.vue'
import { getCurrentInstance, onMounted, ref, computed } from 'vue'

const { proxy } = getCurrentInstance()

// API 映射
const api = { getUserSpace: '/getUserSpace' }

// 用户空间使用数据
const spaceUse = ref({ totalSpace: 0, useSpace: 0 })
const spaceLoading = ref(true)

// 用户信息（兼容未设置的情况）
const userInfo = computed(() => {
    try {
        return proxy.vueCookies.get('userInfo') || null
    } catch (e) {
        return null
    }
})

// 获取空间信息
const getUserSpace = async () => {
    spaceLoading.value = true
    let result = await proxy.request({ url: api.getUserSpace })
    if (result && result.data) {
        spaceUse.value = result.data
    }
    spaceLoading.value = false
}

onMounted(() => {
    getUserSpace()
})

// 当前选中操作项
const activeItem = ref('')

// 使用百分比（安全除零）
const percentValue = computed(() => {
    const total = spaceUse.value.totalSpace
    const used = spaceUse.value.useSpace
    if (!total || total <= 0) return 0
    return Math.min(100, Math.ceil((used / total) * 100))
})

// 剩余空间
const remainSpace = computed(() => {
    return Math.max(0, spaceUse.value.totalSpace - spaceUse.value.useSpace)
})

// 颜色（环形）
const progressColor = computed(() => {
    const p = percentValue.value
    if (p < 50) return '#67C23A'
    if (p < 80) return '#E6A23C'
    return '#F56C6C'
})

// 线性渐变条颜色
const progressGradient = computed(() => {
    const p = percentValue.value
    if (p < 50) {
        return 'linear-gradient(90deg,#67C23A,#95d475)'
    } else if (p < 80) {
        return 'linear-gradient(90deg,#E6A23C,#f3d19e)'
    } else {
        return 'linear-gradient(90deg,#F56C6C,#fab6b6)'
    }
})

</script>

<style lang="scss">
/* 可复用的隐藏文本（无障碍） */
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    border: 0;
}

.user-page {
    position: relative;
    min-height: calc(100vh - 60px);
    padding: clamp(1rem, 2vw, 2rem) clamp(1rem, 3vw, 3rem);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    background: radial-gradient(circle at 20% 20%, #e8f3ff, #f7f9fc 60%);
    overflow: hidden;
}

.user-page .bg-layer::before,
.user-page .bg-layer::after {
    content: '';
    position: absolute;
    width: 380px;
    height: 380px;
    background: linear-gradient(135deg, rgba(64,158,255,0.25), rgba(103,194,58,0.2));
    filter: blur(80px);
    border-radius: 50%;
    animation: float 12s ease-in-out infinite;
    pointer-events: none;
}

.user-page .bg-layer::after {
    top: auto;
    bottom: -120px;
    right: -120px;
    background: linear-gradient(135deg, rgba(230,162,60,0.2), rgba(245,108,108,0.25));
    animation-duration: 16s;
}

@keyframes float {
    0%,100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-30px) scale(1.05); }
}

.user-layout {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 420px));
    gap: clamp(1rem, 2vw, 2rem);
    width: 100%;
    max-width: 1040px;
}

.card {
    --card-bg: rgba(255,255,255,0.66);
    backdrop-filter: saturate(180%) blur(22px);
    -webkit-backdrop-filter: saturate(180%) blur(22px);
    background: var(--card-bg);
    border: 1px solid rgba(255,255,255,0.4);
    border-radius: 20px;
    padding: 26px 28px 30px;
    box-shadow: 0 6px 24px -8px rgba(31,45,61,0.12),0 2px 6px rgba(31,45,61,0.08);
    position: relative;
    overflow: hidden;
    transition: box-shadow .4s, transform .35s;
}

.card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0));
    pointer-events: none;
}

.card:hover {
    box-shadow: 0 10px 32px -8px rgba(31,45,61,0.18),0 4px 12px rgba(31,45,61,0.12);
    transform: translateY(-4px);
}

.user-profile {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
}

.avatar-wrap {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding-bottom: 1.2rem;
    border-bottom: 1px dashed rgba(0,0,0,0.08);
}

.user-meta .nickname {
    font-size: 1.35rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: #2c3e50;
    margin: 0 0 .4rem;
}

.user-meta .uid {
    font-size: .78rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #909399;
    margin: 0;
}

.quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit,minmax(110px,1fr));
    gap: .75rem;
}

.qa-btn {
    --c-default: #4a5568;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .35rem;
    padding: .9rem .7rem .85rem;
    border: 1px solid rgba(0,0,0,0.06);
    background: linear-gradient(145deg,#ffffff,rgba(255,255,255,0.55));
    border-radius: 14px;
    font-size: .75rem;
    color: var(--c-default);
    cursor: pointer;
    transition: .35s;
    overflow: hidden;
}

.qa-btn .iconfont { font-size: 1.35rem; line-height: 1; }

.qa-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 30% 20%, rgba(64,158,255,0.18), transparent 70%);
    opacity: 0;
    transition: .45s;
}

.qa-btn:hover { box-shadow: 0 4px 16px -4px rgba(0,0,0,0.12); transform: translateY(-3px); }
.qa-btn:hover::after { opacity: 1; }
.qa-btn:active { transform: translateY(-1px) scale(.97); }
.qa-btn.active { border-color: #409eff; color: #409eff; background: linear-gradient(145deg,#ffffff,#eaf5ff); }

.storage-card .card-title { display:flex; align-items:center; gap:.5rem; font-size:1rem; font-weight:600; margin:0 0 1rem; color:#2c3e50; }
.storage-card .card-title .iconfont { font-size:1.25rem; }

/* Skeleton */
.skeleton-wrapper { display:flex; flex-direction:column; align-items:center; gap:.9rem; padding:1rem 0 1.5rem; }
.skeleton { position:relative; background: linear-gradient(100deg,#f2f3f5 20%,#e5e9f2 40%,#f2f3f5 60%); background-size:200% 100%; animation: skeleton 1.2s ease-in-out infinite; border-radius:8px; }
.skeleton.circle { width:180px; height:180px; border-radius:50%; }
.skeleton.line { height:16px; width:70%; }
.skeleton.line.short { width:46%; }
@keyframes skeleton { 0% { background-position: 200% 0;} 100% { background-position: -200% 0;} }

.progress-wrapper { display:flex; flex-direction:column; align-items:center; gap:1.2rem; }

.progress-info { text-align:center; }
.progress-info .progress-text { margin:.3rem 0; font-size:.8rem; color:#606266; }
.progress-info .progress-text.main { font-size:1rem; font-weight:600; color:#303133; }
.progress-info .progress-text.remain { color:#409eff; font-weight:500; }

/* 线性进度条 */
.linear-bar { width:100%; display:flex; flex-direction:column; gap:.55rem; }
.bar-track { position:relative; width:100%; height:12px; background:rgba(0,0,0,0.06); border-radius:10px; overflow:hidden; }
.bar-fill { position:absolute; inset:0 0 0 0; height:100%; width:0; border-radius:inherit; transition:width .8s cubic-bezier(.4,0,.2,1), background .4s; }
.bar-desc { display:flex; justify-content:space-between; font-size:.72rem; color:#606266; letter-spacing:.5px; }

.empty-tip { margin-top:1rem; font-size:.75rem; letter-spacing:.5px; text-align:center; color:#909399; }

/* 响应式 */
@media (max-width: 860px) {
    .user-layout { grid-template-columns: 1fr; }
    .user-page { padding: 1.2rem 1rem 2.5rem; }
    .card { padding: 22px 22px 26px; }
    .avatar-wrap { flex-direction: row; }
}

@media (max-width: 480px) {
    .quick-actions { grid-template-columns: repeat(3,1fr); }
    .qa-btn { padding:.75rem .5rem; font-size:.68rem; }
    .qa-btn .iconfont { font-size:1.15rem; }
}

/* 暗色模式（可根据需要再细调） */
@media (prefers-color-scheme: dark) {
    .user-page { background: radial-gradient(circle at 20% 20%, #1f2d3d, #0f1214 70%); }
    .card { --card-bg: rgba(30,35,42,0.66); border-color: rgba(255,255,255,0.08); box-shadow: 0 4px 18px -4px rgba(0,0,0,0.6); }
    .user-meta .nickname { color:#eef2f7; }
    .user-meta .uid { color:#9ca3af; }
    .qa-btn { background: linear-gradient(145deg,rgba(55,65,81,0.9),rgba(55,65,81,0.55)); border-color: rgba(255,255,255,0.08); color:#e5e7eb; }
    .qa-btn.active { background: linear-gradient(145deg,#2d8cf0,#2469b7); color:#fff; border-color: #2d8cf0; }
    .progress-info .progress-text { color:#d1d5db; }
    .progress-info .progress-text.main { color:#fff; }
    .bar-track { background: rgba(255,255,255,0.12); }
    .bar-desc { color:#cbd5e1; }
    .empty-tip { color:#9ca3af; }
}
</style>
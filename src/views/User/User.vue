<template>
    <div class="user">
        <div class="avatar">
            <div>
                <Avatar :user-id="proxy.vueCookies.get('userInfo').userId" :size="60"></Avatar>
                <span>{{ proxy.vueCookies.get('userInfo').nickName }}</span>
            </div>
        </div>

        <div class="user-list">
            <div class="user-list-item" :class="{ active: activeItem === 'info' }" @click="activeItem = 'info'">
                <i class="iconfont icon-user"></i>
                <span>修改头像</span>
            </div>
            <div class="user-list-item" :class="{ active: activeItem === 'password' }" @click="activeItem = 'password'">
                <i class="iconfont icon-password"></i>
                <span>修改密码</span>
            </div>
            <div class="user-list-item" :class="{ active: activeItem === 'logout' }" @click="activeItem = 'logout'">
                <i class="iconfont icon-logout"></i>
                <span>退出登录</span>
            </div>
            <div class="user-list-item storage-info">
                <div class="storage-title">
                    <i class="iconfont icon-storage"></i>
                    <span class="storage-text">存储空间</span>
                </div>
                <ElProgress type="dashboard" :percentage="Math.ceil((spaceUse.useSpace / spaceUse.totalSpace) * 100)"
                    :color="progressColor">
                    <template #default="{ percentage }">
                        <div class="progress-info">
                            <p class="progress-text">已使用 {{ percentage }}%</p>
                            <p class="progress-text">总空间 {{ proxy.Utils.size2Str(spaceUse.totalSpace) }}</p>
                            <p class="progress-text">已用 {{ proxy.Utils.size2Str(spaceUse.useSpace) }}</p>
                        </div>
                    </template>
                </ElProgress>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ElProgress } from 'element-plus';
import Avatar from '@/components/Avatar.vue';
import { getCurrentInstance, onMounted, ref, computed } from 'vue';

const { proxy } = getCurrentInstance()

const api = {
    getUserSpace: "/getUserSpace"
}

const spaceUse = ref({
    totalSpace: 0,
    useSpace: 0
})

const getUserSpace = async () => {

    let result = await proxy.request({
        url: api.getUserSpace
    })

    if (!result) {
        return
    }

    spaceUse.value = result.data
}

onMounted(() => {
    getUserSpace()
})

const activeItem = ref('')

// 根据使用比例动态设置进度条颜色
const progressColor = computed(() => {
    const percentage = Math.ceil((spaceUse.value.useSpace / spaceUse.value.totalSpace) * 100)
    if (percentage < 50) return '#67C23A'
    if (percentage < 80) return '#E6A23C'
    return '#F56C6C'
})

</script>

<style lang="scss">
.user {
    .avatar{
        display: flex;
        justify-content: center;
        background-color: #fff;
    }
    .user-list {
        display: flex;
        flex-direction: column;
        font-size: 14px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
        padding: 20px;
        max-width: 500px;
        margin: 0 auto;

        .user-list-item {
            padding: 15px;
            border-bottom: 1px solid #ebeef5;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            
            &:hover {
                background-color: #f5f7fa;
            }

            &.active {
                color: #409EFF;
                background-color: #ecf5ff;
            }

            .iconfont {
                margin-right: 10px;
                font-size: 18px;
            }

            &.storage-info {
                cursor: default;
                flex-direction: column;
                align-items: center;
                border-bottom: none;

                &:hover {
                    background-color: transparent;
                }

                .storage-title {
                    width: 100%;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                }

                .progress-info {
                    text-align: center;
                    
                    .progress-text {
                        font-size: 14px;
                        color: #606266;
                        margin: 5px 0;
                        
                        &:first-child {
                            font-size: 16px;
                            color: #303133;
                            font-weight: 500;
                        }
                    }
                }
            }
        }
    }
}

// 适配移动端
@media screen and (max-width: 768px) {
    .user {
        .user-list {
            margin: 0px;
            padding: 0px;
            
            .user-list-item {
                padding: 12px;
                
                .iconfont {
                    font-size: 16px;
                }
            }
        }
    }
}
</style>
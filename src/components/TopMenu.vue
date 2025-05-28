<template>
    <div class="top-menu">
        <div class="admin-switch">
            <ElDropdown>
                <span class="user">管理员
                    <ElIcon>
                        <ArrowDown />
                    </ElIcon>
                </span>
                <template #dropdown>
                    <ElDropdownMenu>
                        <ElDropdownItem>
                            <span class="user">切换到用户</span>
                        </ElDropdownItem>
                    </ElDropdownMenu>
                </template>
            </ElDropdown>
        </div>

        <div class="avatar-upload">
            <div class="upload-area">
                <div class="transfer"><span class="dripicons-network-2"></span></div>
            </div>

            <div>
                <Avatar :size="35"></Avatar>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon, ElButton } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import { getCurrentInstance } from 'vue';
import Avatar from '../../components/Avatar.vue';

const { proxy } = getCurrentInstance()

</script>

<style lang="scss">
.top-menu {
    display: flex;
    justify-content: space-between; // 保持不变
    align-items: center; // 添加垂直居中
    width: 100%;

    .admin-switch {

        // 左侧元素样式
        .user {
            font-size: 15px;
            color: #626aef;
        }
    }

    .avatar-upload {
        // 移除 flex: 1，因为不需要占据剩余空间
        display: flex;
        justify-content: flex-end; // 改为 flex-end
        align-items: center;

        .transfer {
            font-size: 15px;
            margin-right: 15px;
            color: rgb(114, 105, 120);
        }

    }

}
</style>
<template>
    <div class="avatar" :style="{ width: size + 'px', height: size + 'px', borderRadius: size / 2 + 'px' }">
        <ElImage v-if="userId" :style="{ width: 100 + '%', height: 100 + '%' }"
            :src="proxy.globalInfo.avatarUrl + userId" fit="cover" loading="lazy"></ElImage>

        <div class="no-login" v-else>未登录</div>
    </div>
</template>

<script setup>
import { ElImage } from 'element-plus';
import { getCurrentInstance } from 'vue';

const { proxy } = getCurrentInstance()

const props = defineProps({
    size: {
        type: Number,
        default: 50
    },
    userId: {
        type: String,
    },
    addLink: {
        type: String
    }


})
</script>

<style lang="scss">
.avatar {
    display: flex;
    overflow: hidden;
    align-items: center;
    background-color: #f0f0f0;

    .no-login {
        width: 100%;
        font-size: 10px;
        text-align: center;
    }
}
</style>

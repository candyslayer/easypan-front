<template>
    <div>
        <ElDialog :model-value="show" :show-close="showChose" :title="title" :top="top" :draggable="true"
            :close-on-click-modal="false" :width="width" @close="close">
            <div class="dialog-body">
                <slot></slot>
            </div>

            <template v-if="(buttons != null && buttons.length > 0) || showCancel">
                <div class="dialog-footer">
                    <el-button link @click="close" v-if="showCancel">取消</el-button>
                    <el-button v-for="btn in buttons" :type="btn.type" @click="btn.click">
                        {{ btn.text }}
                    </el-button>
                </div>
            </template>
            
        </ElDialog>
    </div>
</template>

<script setup>
import { ElDialog } from 'element-plus';

const emit=defineEmits()

const props = defineProps({
    show: {
        type: Boolean,
        default:false
    },
    title: {
        type: String,
    },
    showChose: {
        type: Boolean,
        default:true
    },
    width: {
        type: String,
        default: "30%"
    },
    buttons: {
        type:Array
    },
    showCancel: {
        type: Boolean,
        default:true
    },
    top: {
        type: String,
        default:"50%"
    }
})


const close = () => {
    emit("close")
}
</script>

<style lang="scss">

</style>
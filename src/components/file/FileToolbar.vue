<template>
  <div class="file-toolbar">
    <div class="toolbar-left">
      <slot name="upload" />
      <slot name="create" />
      <slot name="action" />
    </div>

    <div class="toolbar-right">
      <el-button-group>
        <el-button :type="viewMode === 'list' ? 'primary' : 'default'" @click="$emit('change-view','list')">列表</el-button>
        <el-button :type="viewMode === 'card' ? 'primary' : 'default'" @click="$emit('change-view','card')">卡片</el-button>
      </el-button-group>
    </div>
  </div>
</template>

<script setup>
defineProps({
  viewMode: {
    type: String,
    default: 'list'
  }
})

defineEmits(['change-view'])
</script>

<style scoped>
.file-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 12px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>

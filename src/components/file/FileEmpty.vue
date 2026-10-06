<template>
  <div class="file-empty">
    <div class="icon">☁️</div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '暂无文件'
  },
  description: {
    type: String,
    default: '上传你的第一个文件吧'
  }
})
</script>

<style scoped>
.file-empty {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #909399;
}

.icon {
  font-size: 48px;
  margin-bottom: 16px;
}

h3 {
  margin: 0 0 8px;
}
</style>

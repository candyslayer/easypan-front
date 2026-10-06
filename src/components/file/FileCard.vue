<template>
  <div class="file-card" @dblclick="$emit('open', file)">
    <div class="preview">
      <slot name="icon">
        <span class="default-icon">📄</span>
      </slot>
    </div>
    <div class="name" :title="file.fileName">{{ file.fileName }}</div>
    <div class="meta">{{ file.fileSizeText || '' }}</div>
    <div class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  file: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['open'])
</script>

<style scoped>
.file-card {
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  cursor: pointer;
  transition: .2s;
}

.file-card:hover {
  transform: translateY(-2px);
}

.preview {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.default-icon {
  font-size: 42px;
}

.name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.meta {
  color: #909399;
  font-size: 13px;
  margin-top: 8px;
}
</style>

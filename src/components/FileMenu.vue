<template>
  <div class="aether-category-bar">
    <div class="category-scroll-container">
      <div
        v-for="item in categories"
        :key="item.category"
        class="category-pill"
        :class="{ 'is-active': currentCategory === item.category }"
        @click="switchCategory(item.category)"
      >
        <span class="material-symbols-outlined pill-icon">{{ item.icon }}</span>
        <span class="pill-name">{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const categories = [
  { name: '全部', category: 'all', icon: 'grid_view' },
  { name: '视频', category: 'video', icon: 'movie' },
  { name: '音频', category: 'music', icon: 'graphic_eq' },
  { name: '图片', category: 'image', icon: 'image' },
  { name: '文档', category: 'doc', icon: 'description' },
  { name: '其他', category: 'others', icon: 'more_horiz' }
];

const currentCategory = computed(() => {
  return route.params.category || 'all';
});

const switchCategory = (categoryKey) => {
  if (currentCategory.value === categoryKey) return;
  router.push(`/main/${categoryKey}`);
};
</script>

<style lang="scss" scoped>
.aether-category-bar {
  width: 100%;
  padding: 6px 12px 10px;
  box-sizing: border-box;

  .category-scroll-container {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    padding: 2px 0;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .category-pill {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 9999px;
    background: #ffffff;
    color: #434655;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
    border: 1px solid #e5eeff;
    box-shadow: 0 1px 3px rgba(11, 28, 48, 0.04);
    transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    flex-shrink: 0;

    .pill-icon {
      font-size: 16px;
      margin-right: 6px;
      line-height: 1;
      color: #737686;
      transition: color 0.2s;
    }

    .pill-name {
      line-height: 1;
      letter-spacing: -0.01em;
    }

    &:hover {
      background: #eff4ff;
      color: #0b1c30;
      border-color: #dce9ff;

      .pill-icon {
        color: #004ac6;
      }
    }

    &:active {
      transform: scale(0.96);
    }

    &.is-active {
      background: #004ac6;
      border-color: #004ac6;
      color: #ffffff;
      box-shadow: 0 3px 10px rgba(0, 74, 198, 0.28);
      font-weight: 600;

      .pill-icon {
        color: #ffffff;
      }
    }
  }
}
</style>
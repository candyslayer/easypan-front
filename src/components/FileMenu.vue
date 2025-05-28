<!-- filepath: /c:/Users/lengt/code/vue/easypan-front/src/views/component/FileMenu.vue -->
<template>
  <div class="file-menu">
    <el-tag type="info" @click="toggleMenu" class="menu-tag" :closable="false" :disable-transitions="true">
      <span v-if="!menuVisible">分类</span>
      <el-icon v-else class="fold-icon">
        <ArrowRight />
      </el-icon>
    </el-tag>
    <transition-group name="menu-item">
      <el-tag v-for="(item, idx) in categories" :key="idx" :type="getTagType(idx)" class="menu-tag menu-item"
        :closable="false" :disable-transitions="true" v-show="visibleIndices.includes(idx)" @click="selectCategory(idx)"
        :class="{ 
          'is-active': activeCategory === idx
        }" :style="{ 
          '--rotation': `${getRotation(idx)}deg`,
          'transform': `rotate(${getRotation(idx)}deg)`
        }">
        <span :class="['icon-font', item.icon]"></span>
        <span class="tag-text">{{ item.name }}</span>
      </el-tag>
    </transition-group>

    <div v-if="!menuVisible" class="search">
      <ElInput placeholder="搜索文件..." clearable>
        <template #suffix>
          <span class="dripicons-search"></span>
        </template>
      </ElInput>
    </div>
    
  </div>


</template>

<script setup>
import { ref } from 'vue';
import { ElTag, ElIcon,ElInput } from 'element-plus';
import { ArrowRight } from '@element-plus/icons-vue';

const menuVisible = ref(false);
const activeCategory = ref(null);
const visibleIndices = ref([]);

// 合并标签配置
const categories = ref([
  { 
    name: '视频', 
    type: 'success',
    icon: 'dripicons-media-play'  // 视频播放图标
  },
  { 
    name: '音频', 
    type: 'warning',
    icon: 'dripicons-media-loop'  // 音频循环图标
  },
  { 
    name: '图片', 
    type: 'danger',
    icon: 'dripicons-photo'  // 图片图标
  },
  { 
    name: '文档', 
    type: 'info',
    icon: 'dripicons-document'  // 文档图标
  },
  { 
    name: '其他', 
    type: 'primary',
    icon: 'dripicons-dots-3'  // 更多图标
  }
]);

// 获取标签类型
const getTagType = (index) => {
  return categories.value[index].type;
};

// 获取旋转角度
const getRotation = (index) => {
  return (index % 2 === 0) ? -3 : 3; // 交替旋转±3度
};

const toggleMenu = () => {
  if (!menuVisible.value) {
    // 展开菜单
    menuVisible.value = true;
    visibleIndices.value = [];
    categories.value.forEach((_, idx) => {
      setTimeout(() => {
        visibleIndices.value = [...visibleIndices.value, idx];
      }, idx * 50);
    });
  } else {
    // 收起菜单
    const maxIdx = categories.value.length - 1;
    categories.value.forEach((_, idx) => {
      setTimeout(() => {
        const indexToRemove = maxIdx - idx;
        visibleIndices.value = visibleIndices.value.filter(i => i !== indexToRemove);
      }, idx * 50);
    });
    setTimeout(() => {
      menuVisible.value = false;
      visibleIndices.value = [];
    }, categories.value.length * 50);
  }
};

const selectCategory = (index) => {
  activeCategory.value = index;
};
</script>

<style lang="scss">
.file-menu {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  position: relative;
  padding: 5px;
  border-radius: 20px;

  width: 100%;

  .menu-tag {
    margin: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 16px;
    padding: 0 12px;
    display: inline-flex;  // 添加这行
    align-items: center;   // 添加这行
    
    .fold-icon {
      transform: rotate(90deg);
      transition: transform 0.3s ease;
    }

    .icon-font {
      margin-right: 5px;
      font-size: 14px;
      display: inline-block;  // 添加这行
      line-height: 1;        // 添加这行
    }

    .tag-text {
      display: inline-block;  // 添加这行
      line-height: 1;        // 添加这行
    }
  }

  .menu-item {
    // 移除初始的 opacity: 0
    transition: all 0.3s ease;
    
    // 当显示时的样式
    &[v-show]:not([style*="display: none"]) {
      transform: translateX(0) rotate(var(--rotation));
    }

    &:hover {
      transform: translateX(0) rotate(0deg) scale(1.05);
    }
  }

  .is-active {
    transform: translateX(0) rotate(0deg) scale(1.05) !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .search{
    flex: 1;
    padding: 0px 10px;
  }
}


// 修改过渡动画样式
.menu-item-enter-active,
.menu-item-leave-active {
  transition: all 0.3s ease;
}

.menu-item-enter-from,
.menu-item-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.menu-item-enter-to,
.menu-item-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
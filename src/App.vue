
<template>
  <ElConfigProvider :locale="locale" :message="config">
    <RouterView />
  </ElConfigProvider>
</template>
<script setup>
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { reactive } from 'vue';
import { RouterView } from 'vue-router'
import { ElConfigProvider } from 'element-plus';

const locale = zhCn

const config = reactive({
  max: 1
})
</script>
<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

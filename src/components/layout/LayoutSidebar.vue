<template>
  <aside class="layout-sidebar">
    <div class="brand">EasyPan</div>
    <nav>
      <div v-for="item in menus" :key="item.label" class="menu-item" @click="router.push(item.path)">
        <span>{{ item.icon }}</span>
        {{ item.label }}
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const menus = [
  {label:'我的文件', icon:'📁', path:'/main/home'},
  {label:'传输列表', icon:'⬆️', path:'/main/transfer'},
  {label:'分享', icon:'🔗', path:'/main/share'},
  {label:'回收站', icon:'🗑️', path:'/main/recycle'},
]
</script>

<style scoped>
.layout-sidebar{width:220px;background:#fff;height:100%;padding:24px 16px;box-sizing:border-box;border-right:1px solid #eee}
.brand{font-size:24px;font-weight:700;margin-bottom:30px;color:#409eff}
.menu-item{padding:12px;border-radius:10px;cursor:pointer;color:#606266;display:flex;gap:12px}
.menu-item:hover{background:#f2f6fc;color:#409eff}
</style>
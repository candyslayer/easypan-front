<template>
  <aside class="sidebar">
    <nav>
      <div v-for="item in menus" :key="item.label" class="menu-item" @click="router.push(item.path)">
        <span>{{item.icon}}</span>{{item.label}}
      </div>
    </nav>
  </aside>
</template>
<script setup>
import {useRouter} from 'vue-router'
const router=useRouter()
const menus=[
 {label:'我的文件',icon:'📁',path:'/main/home'},
 {label:'最近访问',icon:'🕒',path:'/main/recent'},
 {label:'传输列表',icon:'⬆️',path:'/main/transfer'},
 {label:'我的分享',icon:'🔗',path:'/main/share'},
 {label:'回收站',icon:'🗑️',path:'/main/recycle'}
]
</script>
<style scoped>
.sidebar{width:220px;background:#fff;padding:20px 14px;border-right:1px solid #ebeef5}
.menu-item{padding:13px 16px;border-radius:12px;display:flex;gap:12px;cursor:pointer;color:#606266;margin-bottom:6px}
.menu-item:hover{background:#ecf5ff;color:#409eff}
</style>
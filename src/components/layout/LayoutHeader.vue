<template>
  <header class="header">
    <div class="brand"><span class="logo">☁</span><span>EasyPan</span></div>
    <el-input class="search" placeholder="搜索文件、图片、视频" clearable />
    <div class="actions"><el-button text>通知</el-button><el-avatar :size="36">U</el-avatar></div>
  </header>
</template>

<style scoped>
.header{height:64px;background:#fff;display:flex;align-items:center;padding:0 24px;border-bottom:1px solid #ebeef5;gap:32px}
.brand{display:flex;align-items:center;font-size:20px;font-weight:700;min-width:150px}.logo{font-size:28px;margin-right:8px}
.search{max-width:560px}.actions{margin-left:auto;display:flex;align-items:center;gap:12px}
</style>
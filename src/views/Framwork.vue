<template>
  <div class="app-framework">
    <LayoutHeader v-if="navShow" />
    <div class="layout-body">
      <LayoutSidebar v-if="isMainRoute" />
      <main class="content-section">
        <Transfer v-show="isTransferShow" ref="transferInstance" />
        <router-view v-slot="{ Component }">
          <component v-if="!isTransferRoute" :is="Component" @addFile="addFile" />
        </router-view>
      </main>
    </div>
    <LayoutFooter />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import LayoutHeader from '../components/layout/LayoutHeader.vue'
import LayoutSidebar from '../components/layout/LayoutSidebar.vue'
import LayoutFooter from '../components/layout/LayoutFooter.vue'
import Transfer from './transfer/Transfer.vue'

const route = useRoute()
const transferInstance = ref(null)
const navShow = ref(true)

const addFile = ({file,filePid}) => {
  transferInstance.value?.addFile(file,filePid)
}

const isTransferRoute = computed(()=>route.path.includes('transfer'))
const isTransferShow = computed(()=>isTransferRoute.value)
const isMainRoute = computed(()=>route.path.includes('main'))
</script>

<style scoped>
.app-framework{height:100vh;display:flex;flex-direction:column;background:#f5f7fa}
.layout-body{display:flex;flex:1;overflow:hidden}
.content-section{flex:1;padding:20px;overflow:auto}
@media(max-width:768px){
.layout-body{display:block}
.content-section{padding:12px}
}
</style>

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'
import '@/assets/base.scss'
import '@/assets/iconfont/webfont.css'
import VueCookies from "vue-cookies"
import request from './utils/Reuest'
import message from './utils/Message'
import Verify from './utils/Verify'
import Utils from './utils/Utils'

const app = createApp(App)

app.config.globalProperties.globalInfo = {
    avatarUrl: "/api/getAvatar/",
    imageUrl:"/api/file/getImage/"
}

app.config.globalProperties.verify = Verify
app.config.globalProperties.request = request
app.config.globalProperties.message = message
app.config.globalProperties.vueCookies = VueCookies
app.config.globalProperties.Utils = Utils

app.use(router)

app.mount('#app')

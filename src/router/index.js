import { createRouter, createWebHistory } from 'vue-router'
import VueCookies from 'vue-cookies'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      children: []
    },
    {
      path: '/',
      name: 'Framework',
      component: () => import('@/views/Framwork.vue'),
      children: [
        {
          path: '/',
          redirect: '/main/all'
        },
        {
          path: '/main/:category',
          name: '首页',
          meta: {
            needLogin: true,
            menuCode: 'main'
          },
          component: () => import('@/views/main/Main.vue')
        },
        {
          path: '/transfer',
          name: '传输列表',
          meta: {
            needLogin: true
          },
          component: () => import('@/views/transfer/Transfer.vue')
        },
        {
          path: '/myshare',
          name: '我的分享',
          meta: {
            needLogin: true
          },
          component: () => import('@/views/share/Share.vue')
        },
        {
          path: '/recycle',
          name: '回收站',
          meta: {
            needLogin: true
          },
          component: () => import('@/views/recycle/Recycle.vue')
        },
        {
          path: '/user',
          name: '用户',
          meta: {
            needLogin: true
          },
          component: () => import('@/views/User/User.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const userInfo = VueCookies.get("userInfo")

  if (to.meta.needLogin && !userInfo) {
    next('/login')
  } else {
    next()
  }
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '总览', icon: 'DataLine' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { title: '订单管理', icon: 'Document' }
      },
      {
        path: 'cabinets',
        name: 'Cabinets',
        component: () => import('@/views/Cabinets.vue'),
        meta: { title: '智能柜管理', icon: 'Grid' }
      },
      {
        path: 'posts',
        name: 'Posts',
        component: () => import('@/views/Posts.vue'),
        meta: { title: '社区管理', icon: 'ChatDotRound' }
      },
      {
        path: 'warnings',
        name: 'Warnings',
        component: () => import('@/views/Warnings.vue'),
        meta: { title: '失窃警告', icon: 'Warning' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 智能柜管理系统` : '智能柜管理系统'
  
  const userStore = useUserStore()
  
  if (to.path !== '/login' && !userStore.token) {
    next('/login')
  } else {
    next()
  }
})

export default router

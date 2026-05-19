<template>
  <div class="main-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="logo">
        <div class="logo-icon">
          <el-icon :size="18"><Grid /></el-icon>
        </div>
        <span v-show="!isCollapsed" class="logo-text">智能柜管理</span>
      </div>
      
      <nav class="nav-menu">
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapsed"
          background-color="transparent"
          text-color="rgba(0, 0, 0, 0.6)"
          active-text-color="#FFFFFF"
          router
          :collapse-transition="false"
        >
          <el-menu-item
            v-for="item in menuItems"
            :key="item.path"
            :index="item.path"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </el-menu>
      </nav>
      
      <!-- Collapse button -->
      <div class="collapse-btn" @click="isCollapsed = !isCollapsed">
        <el-icon :size="16">
          <Fold v-if="!isCollapsed" />
          <Expand v-else />
        </el-icon>
      </div>
    </aside>
    
    <!-- Main content -->
    <main class="main-content">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <h1 class="page-title">{{ currentTitle }}</h1>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="26" :src="getAvatarUrl(userStore.userInfo?.avatar)" class="user-avatar" />
              <span class="username">{{ userStore.userInfo?.nickname || '管理员' }}</span>
              <el-icon :size="12"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      
      <!-- Content area -->
      <div class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getAvatarUrl } from '@/utils/image'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapsed = ref(false)

const menuItems = [
  { path: '/dashboard', title: '总览', icon: 'DataLine' },
  { path: '/users', title: '用户管理', icon: 'User' },
  { path: '/orders', title: '订单管理', icon: 'Document' },
  { path: '/cabinets', title: '智能柜管理', icon: 'Grid' },
  { path: '/posts', title: '社区管理', icon: 'ChatDotRound' },
  { path: '/warnings', title: '失窃警告', icon: 'Warning' }
]

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  height: 100vh;
  background-color: var(--bg-primary);
}

.sidebar {
  width: 220px;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  z-index: 100;
  
  &.collapsed {
    width: 64px;
    
    .logo-text {
      display: none;
    }
  }
}

.logo {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  border-bottom: 1px solid var(--sidebar-border);
  
  .logo-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
  
  .logo-text {
    margin-left: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
  }
}

.nav-menu {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
  
  :deep(.el-menu) {
    border-right: none;
    
    .el-menu-item {
      height: 36px;
      line-height: 36px;
      margin: 2px 8px;
      border-radius: var(--radius-sm);
      font-size: 14px;
      font-weight: 400;
      color: var(--sidebar-text);
      
      &.is-active {
        background: var(--sidebar-active) !important;
        color: var(--sidebar-text-active) !important;
        font-weight: 500;
        
        .el-icon {
          color: #fff !important;
        }
      }
      
      &:hover {
        background: var(--sidebar-hover);
        color: var(--text-primary);
      }
      
      .el-icon {
        margin-right: 8px;
        font-size: 16px;
        color: var(--sidebar-text);
      }
    }
  }
}

.collapse-btn {
  padding: 10px;
  text-align: center;
  cursor: pointer;
  color: var(--text-tertiary);
  border-top: 1px solid var(--sidebar-border);
  transition: all var(--transition-fast);
  
  &:hover {
    color: var(--text-primary);
    background: var(--sidebar-hover);
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.header {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--separator);
  z-index: 10;
}

.header-left {
  .page-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--bg-tertiary);
  }
  
  .user-avatar {
    border: none;
  }
  
  .username {
    margin: 0 6px 0 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.15s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

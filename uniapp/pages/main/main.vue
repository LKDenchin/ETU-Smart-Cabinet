<template>
	<view class="main-container">
		<!-- Tab内容区域 -->
		<view class="tab-content">
			<!-- 首页 -->
			<index-page v-show="activeTab === 0" ref="indexPage"></index-page>
			
			<!-- 附近 -->
			<nearby-page v-show="activeTab === 1" ref="nearbyPage"></nearby-page>
			
			<!-- 社区 -->
			<community-page v-show="activeTab === 2" ref="communityPage"></community-page>
			
			<!-- 订单 -->
			<orders-page v-show="activeTab === 3" ref="ordersPage"></orders-page>
			
			<!-- 我的 -->
			<profile-page v-show="activeTab === 4" ref="profilePage"></profile-page>
		</view>
		
		<!-- 自定义底栏 - 固定不动 -->
		<custom-tabbar :active-tab="activeTab" @change="handleTabChange" />
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import IndexPage from '../index/index.vue'
import NearbyPage from '../nearby/nearby.vue'
import OrdersPage from '../orders/orders.vue'
import CommunityPage from '../community/community.vue'
import ProfilePage from '../profile/profile.vue'
import CustomTabbar from '@/components/custom-tabbar/custom-tabbar.vue'

const activeTab = ref(0)
const indexPage = ref(null)
const nearbyPage = ref(null)
const ordersPage = ref(null)
const communityPage = ref(null)
const profilePage = ref(null)

// 切换Tab
const handleTabChange = (index) => {
	if (index === activeTab.value) return
	activeTab.value = index
}

// 获取URL参数设置初始Tab
const initTab = () => {
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1]
	if (currentPage && currentPage.$page) {
		const options = currentPage.$page.options
		if (options && options.tab) {
			const tabIndex = parseInt(options.tab)
			if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 4) {
				activeTab.value = tabIndex
			}
		}
	}
}

onMounted(() => {
	initTab()
	// 隐藏原生tabbar
	uni.hideTabBar({
		animation: false
	})
})

onShow(() => {
	// 确保原生tabbar隐藏
	uni.hideTabBar({
		animation: false
	})
})
</script>

<style lang="scss" scoped>
.main-container {
	min-height: 100vh;
	background: #FFFFFF;
}

.tab-content {
	min-height: calc(100vh - 180rpx);
}
</style>
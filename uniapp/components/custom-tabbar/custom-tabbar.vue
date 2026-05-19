<template>
	<view class="custom-tabbar">
		<!-- Tab项 -->
		<view 
			class="tab-item" 
			v-for="(item, index) in tabList" 
			:key="index"
			@click="switchTab(index)"
		>
			<image 
				class="tab-icon" 
				:src="activeTab === index ? item.selectedIconPath : item.iconPath" 
				mode="aspectFit"
			></image>
			<text class="tab-text" :class="{ active: activeTab === index }">{{ item.text }}</text>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
	activeTab: {
		type: Number,
		default: 0
	}
})

const emit = defineEmits(['change'])

const tabList = ref([
	{
		pagePath: '/pages/main/main',
		text: '首页',
		iconPath: '/static/tabbar/home.png',
		selectedIconPath: '/static/tabbar/home-active.png'
	},
	{
		pagePath: '/pages/main/main',
		text: '附近',
		iconPath: '/static/tabbar/nearby.png',
		selectedIconPath: '/static/tabbar/nearby-active.png'
	},
	{
		pagePath: '/pages/community/community',
		text: '社区',
		iconPath: '/static/tabbar/tip.png',
		selectedIconPath: '/static/tabbar/tip-active.png'
	},
	{
		pagePath: '/pages/main/main',
		text: '订单',
		iconPath: '/static/tabbar/order.png',
		selectedIconPath: '/static/tabbar/order-active.png'
	},
	{
		pagePath: '/pages/main/main',
		text: '我的',
		iconPath: '/static/tabbar/profile.png',
		selectedIconPath: '/static/tabbar/profile-active.png'
	}
])

// 切换Tab
const switchTab = (index) => {
	if (index === props.activeTab) return
	
	// 发送切换事件给父组件
	emit('change', index)
}
</script>

<style lang="scss" scoped>
/* ==================== 颜色变量 ==================== */
$primary: #A5D63F;
$primary-light: #E8F5E9;
$primary-dark: #8BC34A;

$background: #FFFFFF;
$on-background: #2C3E50;
$on-surface-variant: #9CA3AF;

/* ==================== 自定义Tabbar容器 ==================== */
.custom-tabbar {
	position: fixed;
	bottom: 40rpx;
	left: 24rpx;
	right: 24rpx;
	height: 120rpx;
	background: rgba(255, 255, 255, 0.12);
	backdrop-filter: blur(10rpx);
	-webkit-backdrop-filter: blur(10rpx);
	border-radius: 60rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.6);
	box-shadow: 
		0 8rpx 32rpx rgba(0, 0, 0, 0.06),
		0 2rpx 8rpx rgba(0, 0, 0, 0.04),
		inset 0 2rpx 4rpx rgba(255, 255, 255, 0.2),
		inset 0 -1rpx 2rpx rgba(0, 0, 0, 0.02);
	display: flex;
	align-items: center;
	justify-content: space-around;
	padding: 0 10rpx;
	z-index: 9999;
	
	/* 顶部高光 - 模拟玻璃边缘反射 */
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 8%;
		right: 8%;
		height: 2rpx;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.6) 30%,
			rgba(255, 255, 255, 0.9) 50%,
			rgba(255, 255, 255, 0.6) 70%,
			transparent 100%
		);
		border-radius: 60rpx 60rpx 0 0;
		pointer-events: none;
	}
	
	/* 底部反射 */
	&::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 8%;
		right: 8%;
		height: 2rpx;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.3) 30%,
			rgba(255, 255, 255, 0.5) 50%,
			rgba(255, 255, 255, 0.3) 70%,
			transparent 100%
		);
		border-radius: 0 0 60rpx 60rpx;
		pointer-events: none;
	}
}
/* ==================== Tab项 ==================== */
.tab-item {
	flex: 1;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
	z-index: 1;
	padding: 10rpx;
	transition: all 0.3s ease;
	
	.tab-icon {
		width: 48rpx;
		height: 48rpx;
		margin-bottom: 4rpx;
		transition: all 0.3s ease;
	}
	
	.tab-text {
		font-size: 20rpx;
		color: $on-surface-variant;
		font-weight: 500;
		letter-spacing: 0.5rpx;
		transition: all 0.3s ease;
		
		&.active {
			color: $primary-dark;
			font-weight: 600;
		}
	}
}
</style>
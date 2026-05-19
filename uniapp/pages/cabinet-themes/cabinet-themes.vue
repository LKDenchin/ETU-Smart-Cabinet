<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">智能柜主题</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 主题网格 -->
			<view class="theme-grid">
				<view
					class="theme-card"
					v-for="theme in themes"
					:key="theme.id"
					@click="viewThemeDetail(theme)"
				>
					<view class="theme-preview" :style="{ background: theme.preview }"></view>
					<text class="theme-name">{{ theme.name }}</text>
					<text class="theme-author">{{ theme.author }}</text>
					<text class="theme-price">{{ theme.price }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const statusBarHeight = ref(0)

// 智能柜主题数据
const themes = ref([
	{
		id: 1,
		name: '简约白',
		author: '官方',
		preview: '#FFFFFF',
		price: '免费'
	},
	{
		id: 2,
		name: '商务黑',
		author: '官方',
		preview: '#2C3E50',
		price: '免费'
	},
	{
		id: 3,
		name: '清新绿',
		author: '设计师',
		preview: '#A5D63F',
		price: '免费'
	},
	{
		id: 4,
		name: '科技蓝',
		author: '官方',
		preview: '#3498DB',
		price: '免费'
	},
	{
		id: 5,
		name: '活力红',
		author: '设计师',
		preview: '#E74C3C',
		price: '免费'
	},
	{
		id: 6,
		name: '优雅紫',
		author: '设计师',
		preview: '#9B59B6',
		price: '免费'
	}
])

onLoad(() => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44
})

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 查看主题详情
const viewThemeDetail = (theme) => {
	uni.navigateTo({
		url: `/pages/cabinet-theme-detail/cabinet-theme-detail?id=${theme.id}`
	})
}
</script>

<style lang="scss" scoped>
/* ==================== 颜色变量 ==================== */
$primary: #FF6700;
$primary-light: #FFF0E6;
$primary-dark: #E65C00;

$background: #FFFFFF;
$surface: #F7F7F7;

$on-background: #333333;
$on-surface: #666666;
$on-surface-variant: #999999;

$outline: #EEEEEE;
$outline-light: #F5F5F5;

$shadow-sm: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
$shadow-md: 0 8rpx 20rpx rgba(0, 0, 0, 0.08);

/* ==================== 间距变量 ==================== */
$spacing-1: 8rpx;
$spacing-2: 16rpx;
$spacing-3: 24rpx;
$spacing-4: 32rpx;

/* ==================== 圆角变量 ==================== */
$radius-lg: 16rpx;
$radius-xl: 20rpx;
$radius-2xl: 24rpx;

/* ==================== 字体变量 ==================== */
$font-size-sm: 24rpx;
$font-size-base: 28rpx;
$font-size-lg: 32rpx;

/* ==================== 容器 ==================== */
.container {
	min-height: 100vh;
	background: $background;
}

/* ==================== 导航栏 ==================== */
.navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: #FFFFFF;
	border-bottom: 1rpx solid $outline;
}

.nav-content {
	height: 88rpx;
	display: flex;
	align-items: center;
	padding: 0 $spacing-3;
}

.nav-back {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: $surface;
	transition: all 0.2s ease;

	&:active {
		background: $outline-light;
		transform: translateY(2rpx);
	}

	.back-icon {
		font-size: 48rpx;
		color: $on-background;
	}
}

.nav-title {
	flex: 1;
	text-align: center;
	font-size: $font-size-lg;
	font-weight: 600;
	color: $on-background;
}

.nav-placeholder {
	width: 64rpx;
}

/* ==================== 主内容区 ==================== */
.content {
	padding: $spacing-3;
	padding-bottom: 100rpx;
	width: 100%;
	max-width: 100%;
	overflow-x: hidden;
	box-sizing: border-box;
}

/* ==================== 主题网格 ==================== */
.theme-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $spacing-2;
	width: 100%;
	box-sizing: border-box;
}

@media screen and (max-width: 600rpx) {
	.theme-grid {
		grid-template-columns: 1fr;
	}
}

.theme-card {
	background: $surface;
	border-radius: $radius-xl;
	padding: $spacing-3;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-1;
	transition: all 0.2s ease;
	width: 100%;
	box-sizing: border-box;

	&:active {
		transform: scale(0.97);
	}
}

.theme-preview {
	width: 160rpx;
	height: 160rpx;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;
	border: 2rpx solid $outline;
}

.theme-name {
	font-size: $font-size-base;
	color: $on-background;
	font-weight: 600;
	text-align: center;
}

.theme-author {
	font-size: $font-size-sm;
	color: $on-surface-variant;
}

.theme-price {
	font-size: $font-size-sm;
	color: $primary;
	font-weight: 600;
}
</style>
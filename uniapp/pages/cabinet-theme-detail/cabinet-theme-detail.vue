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
			<!-- 主题预览 -->
			<view class="theme-preview-large" :style="{ background: currentTheme.preview }">
				<view class="preview-overlay">
					<text class="preview-title">{{ currentTheme.name }}</text>
					<text class="preview-author">作者：{{ currentTheme.author }}</text>
				</view>
			</view>

			<!-- 主题信息 -->
			<view class="theme-info">
				<view class="info-row">
					<text class="info-label">风格</text>
					<text class="info-value">{{ currentTheme.style }}</text>
				</view>
				<view class="info-row">
					<text class="info-label">适用场景</text>
					<text class="info-value">{{ currentTheme.scene }}</text>
				</view>
				<view class="info-row">
					<text class="info-label">价格</text>
					<text class="info-value" :style="{ color: currentTheme.price === '免费' ? '#E74C3C' : '#333333' }">{{ currentTheme.price }}</text>
				</view>
			</view>

			<!-- 主题描述 -->
			<view class="theme-description">
				<text class="desc-title">主题介绍</text>
				<text class="desc-text">{{ currentTheme.description }}</text>
			</view>

			<!-- 定制按钮 -->
			<button class="customize-btn" @click="goToCustomize">定制</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const statusBarHeight = ref(0)
const themeId = ref(0)

// 所有主题数据
const allThemes = [
	{
		id: 1,
		name: '简约白',
		author: '官方',
		preview: '#FFFFFF',
		style: '现代简约',
		scene: '社区、写字楼',
		price: '免费',
		description: '纯净的白色设计，简洁大方。适合追求简约风格的使用场景，干净清爽，易于清洁。'
	},
	{
		id: 2,
		name: '商务黑',
		author: '官方',
		preview: '#2C3E50',
		style: '商务专业',
		scene: '商务大厦、酒店',
		price: '免费',
		description: '沉稳大气的黑色设计，彰显专业气质。适合商务场景，给人可靠、专业的印象。'
	},
	{
		id: 3,
		name: '清新绿',
		author: '设计师',
		preview: '#A5D63F',
		style: '自然清新',
		scene: '社区、公园',
		price: '免费',
		description: '充满生机的绿色设计，贴近自然。适合社区和公园等场所，给人舒适、环保的感觉。'
	},
	{
		id: 4,
		name: '科技蓝',
		author: '官方',
		preview: '#3498DB',
		style: '科技现代',
		scene: '科技园、创新中心',
		price: '免费',
		description: '富有科技感的蓝色设计，现代时尚。适合科技园区和创新中心，体现科技感和创新精神。'
	},
	{
		id: 5,
		name: '活力红',
		author: '设计师',
		preview: '#E74C3C',
		style: '热情活力',
		scene: '商业中心、购物中心',
		price: '免费',
		description: '热情洋溢的红色设计，充满活力。适合商业中心和购物中心，吸引眼球，提升品牌形象。'
	},
	{
		id: 6,
		name: '优雅紫',
		author: '设计师',
		preview: '#9B59B6',
		style: '优雅时尚',
		scene: '高端社区、精品酒店',
		price: '免费',
		description: '优雅高贵的紫色设计，充满品味。适合高端社区和精品酒店，彰显品质和格调。'
	}
]

// 当前主题
const currentTheme = computed(() => {
	return allThemes.find(t => t.id === themeId.value) || allThemes[0]
})

onLoad((options) => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44

	if (options && options.id) {
		themeId.value = parseInt(options.id)
	}
})

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 去定制
const goToCustomize = () => {
	uni.navigateTo({
		url: `/pages/cabinet-customize/cabinet-customize?themeId=${themeId.value}`
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
	padding-bottom: 150rpx;
	width: 100%;
	max-width: 100%;
	overflow-x: hidden;
	box-sizing: border-box;
}

/* ==================== 主题预览 ==================== */
.theme-preview-large {
	height: 400rpx;
	border-radius: $radius-xl;
	position: relative;
	overflow: hidden;
	width: 100%;
	box-sizing: border-box;
}

@media screen and (max-width: 600rpx) {
	.theme-preview-large {
		height: 300rpx;
	}
}

.preview-overlay {
	text-align: center;
}

.preview-title {
	display: block;
	font-size: $font-size-lg;
	font-weight: 600;
	color: #FFFFFF;
	margin-bottom: $spacing-1;
}

.preview-author {
	display: block;
	font-size: $font-size-sm;
	color: rgba(255, 255, 255, 0.9);
}

/* ==================== 主题信息 ==================== */
.theme-info {
	background: $surface;
	border-radius: $radius-xl;
	padding: $spacing-3;
	margin-bottom: $spacing-3;
	width: 100%;
	box-sizing: border-box;
}

.info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: $spacing-2 0;
	border-bottom: 1rpx solid $outline;
	width: 100%;
	box-sizing: border-box;

	&:last-child {
		border-bottom: none;
	}
}

.info-label {
	font-size: $font-size-base;
	color: $on-surface;
	width: 160rpx;
	flex-shrink: 0;
}

.info-value {
	font-size: $font-size-base;
	color: $on-background;
	font-weight: 600;
	text-align: right;
	flex: 1;
	word-break: break-word;
	word-wrap: break-word;
}

/* ==================== 主题描述 ==================== */
.theme-description {
	background: $surface;
	border-radius: $radius-xl;
	padding: $spacing-3;
	margin-bottom: $spacing-4;
	width: 100%;
	box-sizing: border-box;
}

.desc-title {
	display: block;
	font-size: $font-size-base;
	font-weight: 600;
	color: $on-background;
	margin-bottom: $spacing-2;
}

.desc-text {
	display: block;
	font-size: $font-size-base;
	color: $on-surface;
	line-height: 1.6;
	word-break: break-word;
	word-wrap: break-word;
}

/* ==================== 定制按钮 ==================== */
.customize-btn {
	width: 100%;
	height: 88rpx;
	background: $primary;
	border-radius: $radius-xl;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: $font-size-lg;
	font-weight: 600;
	color: #FFFFFF;
	transition: all 0.2s ease;

	&:active {
		background: $primary-dark;
		transform: scale(0.98);
	}
}
</style>
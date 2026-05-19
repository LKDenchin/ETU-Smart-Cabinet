<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">主题详情</text>
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
					<text class="info-label">下载量</text>
					<text class="info-value">{{ currentTheme.downloadCount }}</text>
				</view>
				<view class="info-row">
					<text class="info-label">评分</text>
					<text class="info-value">{{ currentTheme.rating }} ⭐</text>
				</view>
				<view class="info-row">
					<text class="info-label">大小</text>
					<text class="info-value">2.5 MB</text>
				</view>
				<view class="info-row">
					<text class="info-label">更新时间</text>
					<text class="info-value">2024-01-15</text>
				</view>
			</view>

			<!-- 主题描述 -->
			<view class="theme-description">
				<text class="desc-title">主题介绍</text>
				<text class="desc-text">{{ currentTheme.description }}</text>
			</view>

			<!-- 预览截图 -->
			<view class="theme-screenshots">
				<text class="desc-title">预览截图</text>
				<scroll-view class="screenshots-scroll" scroll-x>
					<view class="screenshot-item" v-for="i in 4" :key="i">
						<view class="screenshot-placeholder" :style="{ background: currentTheme.preview }"></view>
					</view>
				</scroll-view>
			</view>

			<!-- 应用按钮 -->
			<button class="apply-btn" @click="applyTheme">应用主题</button>
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
		name: '默认绿色',
		author: '官方',
		preview: 'linear-gradient(135deg, #A5D63F 0%, #8BC34A 100%)',
		downloadCount: '1.2万',
		rating: '4.8',
		description: '清新自然的绿色主题，给人带来舒适的视觉体验。适合日常使用，长时间使用也不易疲劳。'
	},
	{
		id: 2,
		name: '科技蓝',
		author: '官方',
		preview: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
		downloadCount: '2.3万',
		rating: '4.9',
		description: '现代科技感的蓝色主题，专业且沉稳。适合商务场景和科技爱好者使用。'
	},
	{
		id: 3,
		name: '紫色梦幻',
		author: '设计师',
		preview: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
		downloadCount: '8562',
		rating: '4.7',
		description: '优雅梦幻的紫色主题，充满神秘感。适合追求个性和品味的用户。'
	},
	{
		id: 4,
		name: '活力橙',
		author: '官方',
		preview: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
		downloadCount: '1.5万',
		rating: '4.8',
		description: '热情活力的橙色主题，充满正能量。适合年轻人和追求活力的用户。'
	},
	{
		id: 5,
		name: '暗夜黑',
		author: '官方',
		preview: 'linear-gradient(135deg, #34495E 0%, #2C3E50 100%)',
		downloadCount: '3.1万',
		rating: '4.9',
		description: '专业沉稳的黑色主题，护眼且高级。适合夜间使用和追求专业感的用户。'
	},
	{
		id: 6,
		name: '粉嫩粉',
		author: '设计师',
		preview: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
		downloadCount: '4321',
		rating: '4.6',
		description: '温柔可爱的粉色主题，充满少女心。适合女性用户和喜欢可爱风格的用户。'
	},
	{
		id: 7,
		name: '清新绿',
		author: '设计师',
		preview: 'linear-gradient(135deg, #2ECC71 0%, #27AE60 100%)',
		downloadCount: '6789',
		rating: '4.7',
		description: '生机勃勃的绿色主题，充满活力。适合喜欢自然和健康的用户。'
	},
	{
		id: 8,
		name: '天空蓝',
		author: '设计师',
		preview: 'linear-gradient(135deg, #87CEEB 0%, #00BFFF 100%)',
		downloadCount: '5432',
		rating: '4.6',
		description: '清新明亮的蓝色主题，如天空般纯净。适合追求清新感觉的用户。'
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

// 应用主题
const applyTheme = () => {
	// 保存主题配置
	uni.setStorageSync('appTheme', currentTheme.value.id)

	uni.showToast({
		title: '主题已应用',
		icon: 'success'
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
	border-radius: $radius-2xl;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: $spacing-4;
	box-shadow: $shadow-md;
	position: relative;
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
	margin-bottom: $spacing-3;
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

/* ==================== 预览截图 ==================== */
.theme-screenshots {
	background: $surface;
	border-radius: $radius-xl;
	padding: $spacing-3;
	margin-bottom: $spacing-4;
}

.screenshots-scroll {
	white-space: nowrap;
	margin-top: $spacing-2;
}

.screenshot-item {
	display: inline-block;
	width: 300rpx;
	height: 400rpx;
	margin-right: $spacing-2;
}

.screenshot-placeholder {
	width: 100%;
	height: 100%;
	border-radius: $radius-lg;
}

/* ==================== 应用按钮 ==================== */
.apply-btn {
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
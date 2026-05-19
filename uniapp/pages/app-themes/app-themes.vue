<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">APP主题</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 搜索栏 -->
			<view class="search-bar">
				<image class="search-icon" src="/static/icons/icon-search.png" mode="aspectFit"></image>
				<input
					class="search-input"
					type="text"
					placeholder="搜索主题..."
					placeholder-class="search-placeholder"
				/>
			</view>

			<!-- 分类标签（分类、推荐、官方、排行） -->
			<view class="category-tabs">
				<view
					class="tab-item"
					:class="{ active: activeTab === 'category' }"
					@click="switchTab('category')"
				>
					<text class="tab-text">分类</text>
				</view>
				<view
					class="tab-item"
					:class="{ active: activeTab === 'recommended' }"
					@click="switchTab('recommended')"
				>
					<text class="tab-text">推荐</text>
				</view>
				<view
					class="tab-item"
					:class="{ active: activeTab === 'official' }"
					@click="switchTab('official')"
				>
					<text class="tab-text">官方</text>
				</view>
				<view
					class="tab-item"
					:class="{ active: activeTab === 'ranking' }"
					@click="switchTab('ranking')"
				>
					<text class="tab-text">排行</text>
				</view>
			</view>

			<!-- 主题网格（小米主题商店风格） -->
			<view class="theme-grid">
				<view
					class="theme-card"
					v-for="theme in currentThemes"
					:key="theme.id"
					@click="viewThemeDetail(theme)"
				>
					<!-- 主题预览图 -->
					<view class="theme-preview">
						<image class="theme-preview-image" :src="theme.preview" mode="aspectFill"></image>
						<!-- 模拟锁屏界面 -->
						<view class="preview-statusbar">
							<text class="status-time">{{ formatTime(theme.previewTime) }}</text>
						</view>
						<view class="preview-lockscreen">
							<text class="lock-time">12:00</text>
						</view>
						<!-- 排行榜序号 -->
						<view class="ranking-badge" v-if="activeTab === 'ranking' && theme.ranking <= 3">
							<text class="ranking-number">{{ theme.ranking }}</text>
						</view>
						<!-- 官方标识 -->
						<view class="official-badge" v-if="theme.isOfficial">
							<text class="official-text">官方</text>
						</view>
					</view>
					<!-- 主题信息 -->
					<view class="theme-info">
						<text class="theme-name">{{ theme.name }}</text>
						<text class="theme-meta">{{ theme.author }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const statusBarHeight = ref(0)
const activeTab = ref('recommended')

// 所有主题数据
const allThemes = ref([
	{
		id: 1,
		name: '默认绿色',
		author: '官方',
		preview: '/static/theme-preview/theme-1.png',
		previewTime: new Date(),
		downloads: 12580,
		isOfficial: true,
		ranking: 3,
		category: 'natural'
	},
	{
		id: 2,
		name: '科技蓝',
		author: '官方',
		preview: '/static/theme-preview/theme-2.png',
		previewTime: new Date(),
		downloads: 23450,
		isOfficial: true,
		ranking: 2,
		category: 'tech'
	},
	{
		id: 3,
		name: '紫色梦幻',
		author: '设计师',
		preview: '/static/theme-preview/theme-3.png',
		previewTime: new Date(),
		downloads: 8920,
		isOfficial: false,
		ranking: 6,
		category: 'fantasy'
	},
	{
		id: 4,
		name: '活力橙',
		author: '官方',
		preview: '/static/theme-preview/theme-4.png',
		previewTime: new Date(),
		downloads: 15670,
		isOfficial: true,
		ranking: 5,
		category: 'vibrant'
	},
	{
		id: 5,
		name: '暗夜黑',
		author: '官方',
		preview: '/static/theme-preview/theme-5.png',
		previewTime: new Date(),
		downloads: 34580,
		isOfficial: true,
		ranking: 1,
		category: 'dark'
	},
	{
		id: 6,
		name: '樱花粉',
		author: '设计师',
		preview: '/static/theme-preview/theme-6.png',
		previewTime: new Date(),
		downloads: 6780,
		isOfficial: false,
		ranking: 7,
		category: 'natural'
	},
	{
		id: 7,
		name: '清新蓝',
		author: '设计师',
		preview: '/static/theme-preview/theme-7.png',
		previewTime: new Date(),
		downloads: 11230,
		isOfficial: false,
		ranking: 4,
		category: 'natural'
	},
	{
		id: 8,
		name: '星空紫',
		author: '设计师',
		preview: '/static/theme-preview/theme-8.png',
		previewTime: new Date(),
		downloads: 9450,
		isOfficial: false,
		ranking: 8,
		category: 'fantasy'
	}
])

// 根据当前标签页筛选主题
const currentThemes = computed(() => {
	if (activeTab.value === 'recommended') {
		return allThemes.value.filter(t => t.downloads > 10000)
	} else if (activeTab.value === 'official') {
		return allThemes.value.filter(t => t.isOfficial)
	} else if (activeTab.value === 'ranking') {
		return [...allThemes.value].sort((a, b) => a.ranking - b.ranking)
	} else {
		return allThemes.value
	}
})

onLoad(() => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44
})

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 切换标签页
const switchTab = (tab) => {
	activeTab.value = tab
}

// 查看主题详情
const viewThemeDetail = (theme) => {
	uni.navigateTo({
		url: `/pages/app-theme-detail/app-theme-detail?id=${theme.id}`
	})
}

// 格式化时间
const formatTime = (date) => {
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')
	return `${hours}:${minutes}`
}
</script>

<style lang="scss" scoped>
/* ==================== 颜色变量 - 原有绿色系配色方案 ==================== */
$primary: #A5D63F;           /* 主色：绿色 */
$primary-light: #E8F5E9;     /* 浅绿色 */
$primary-dark: #8BC34A;      /* 深绿色 */
$primary-btn: #2ECC71;       /* 按钮绿色 */

$background: #FAFAFA;        /* 背景：极浅灰 */
$surface: #FFFFFF;           /* 表面：纯白 */
$surface-variant: #F3F4F6;   /* 表面变体 */

$on-background: #1A1A1A;     /* 主要文字：深灰黑 */
$on-surface: #4B5563;        /* 次要文字：中灰 */
$on-surface-variant: #9CA3AF;/* 三级文字：浅灰 */

$outline: #E5E7EB;           /* 边框：浅灰 */
$outline-light: #F5F5F5;     /* 浅边框 */

$shadow-sm: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
$shadow-md: 0 8rpx 20rpx rgba(0, 0, 0, 0.08);

/* ==================== 间距变量 ==================== */
$spacing-1: 8rpx;
$spacing-2: 16rpx;
$spacing-3: 24rpx;
$spacing-4: 32rpx;

/* ==================== 圆角变量 ==================== */
$radius-sm: 8rpx;
$radius-md: 12rpx;
$radius-lg: 16rpx;
$radius-xl: 20rpx;
$radius-2xl: 24rpx;

/* ==================== 字体变量 ==================== */
$font-size-xs: 22rpx;
$font-size-sm: 24rpx;
$font-size-base: 28rpx;
$font-size-lg: 32rpx;

/* ==================== 响应式断点 ==================== */
@media screen and (max-width: 750rpx) {
	$spacing-3: 20rpx;
	$spacing-4: 24rpx;
	$font-size-base: 26rpx;
	$font-size-lg: 30rpx;
}

@media screen and (max-width: 600rpx) {
	$spacing-3: 18rpx;
	$spacing-4: 20rpx;
	$font-size-base: 24rpx;
	$font-size-lg: 28rpx;
	
	.category-tabs {
		.tab-item {
			font-size: $font-size-sm;
		}
	}
	
	.theme-grid {
		grid-template-columns: 1fr;
	}
}

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
		transform: scale(0.95);
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
	padding-bottom: 160rpx;
	width: 100%;
	max-width: 100%;
	overflow-x: hidden;
	box-sizing: border-box;
}

/* ==================== 搜索栏 ==================== */
.search-bar {
	display: flex;
	align-items: center;
	gap: $spacing-2;
	background: $surface-variant;
	border-radius: $radius-xl;
	padding: $spacing-2 $spacing-3;
	margin-bottom: $spacing-3;
}

.search-icon {
	width: 32rpx;
	height: 32rpx;
}

.search-input {
	flex: 1;
	height: 60rpx;
	font-size: $font-size-base;
	color: $on-background;
}

.search-placeholder {
	color: $on-surface-variant;
}

/* ==================== 分类标签 ==================== */
.category-tabs {
	display: flex;
	gap: $spacing-2;
	margin-bottom: $spacing-3;
}

.tab-item {
	flex: 1;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: $surface;
	border-radius: $radius-lg;
	border: 2rpx solid transparent;
	transition: all 0.2s ease;

	&:active {
		transform: scale(0.98);
	}

	&.active {
		background: $primary-light;
		border-color: $primary;
	}

	.tab-text {
		font-size: $font-size-base;
		color: $on-background;
		font-weight: 500;
	}
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
	overflow: hidden;
	box-shadow: $shadow-sm;
	transition: all 0.2s ease;
	width: 100%;
	box-sizing: border-box;

	&:active {
		transform: scale(0.97);
		box-shadow: $shadow-md;
	}
}

/* ==================== 主题预览 ==================== */
.theme-preview {
	width: 100%;
	aspect-ratio: 3 / 4;
	position: relative;
	overflow: hidden;
	background: $surface-variant;
}

.theme-preview-image {
	width: 100%;
	height: 100%;
}

.preview-statusbar {
	position: absolute;
	top: $spacing-2;
	left: $spacing-2;
	right: $spacing-2;
	display: flex;
	justify-content: center;
}

.status-time {
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.9);
	font-weight: 600;
}

.preview-lockscreen {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.lock-time {
	font-size: 80rpx;
	color: rgba(255, 255, 255, 0.95);
	font-weight: 700;
	letter-spacing: 4rpx;
}

/* ==================== 徽章 ==================== */
.ranking-badge {
	position: absolute;
	top: $spacing-2;
	left: $spacing-2;
	width: 48rpx;
	height: 48rpx;
	background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 12rpx rgba(255, 215, 0, 0.4);
}

.ranking-number {
	font-size: $font-size-base;
	color: #FFFFFF;
	font-weight: 700;
}

.official-badge {
	position: absolute;
	top: $spacing-2;
	right: $spacing-2;
	padding: $spacing-1 $spacing-2;
	background: rgba(255, 255, 255, 0.95);
	border-radius: $radius-md;
	backdrop-filter: blur(10rpx);
	-webkit-backdrop-filter: blur(10rpx);
}

.official-text {
	font-size: $font-size-xs;
	color: $primary-dark;
	font-weight: 700;
}

/* ==================== 主题信息 ==================== */
.theme-info {
	padding: $spacing-2;
}

.theme-name {
	display: block;
	font-size: $font-size-base;
	font-weight: 600;
	color: $on-background;
	margin-bottom: $spacing-1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.theme-meta {
	display: block;
	font-size: $font-size-sm;
	color: $on-surface-variant;
}
</style>
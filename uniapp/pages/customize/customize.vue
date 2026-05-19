<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">定制</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 两个大圆角按钮 -->
			<view class="category-buttons">
				<view class="category-btn app-btn" @click="goToAppThemes">
					<image class="btn-icon" src="/static/icons/icon-app-theme.png" mode="aspectFit"></image>
					<text class="btn-text">APP主题</text>
					<text class="btn-desc">个性化您的APP界面</text>
				</view>
				<view class="category-btn cabinet-btn" @click="goToCabinetCustomize">
					<image class="btn-icon" src="/static/icons/icon-cabinet.png" mode="aspectFit"></image>
					<text class="btn-text">定制智能柜</text>
					<text class="btn-desc">打造专属您的智能柜</text>
				</view>
			</view>

			<!-- 精选APP主题（小米主题商店风格） -->
			<view class="featured-section">
				<view class="section-header">
					<view class="section-icon-wrapper">
						<image class="section-icon" src="/static/icons/icon-star.png" mode="aspectFit"></image>
					</view>
					<text class="section-title">精选主题</text>
					<view class="more-btn" @click="goToAppThemes">
						<text class="more-text">更多</text>
						<text class="more-icon">›</text>
					</view>
				</view>

				<!-- 主题网格（2列宫格，3:4比例） -->
				<view class="theme-grid">
					<view
						class="theme-card"
						v-for="theme in featuredThemes"
						:key="theme.id"
						@click="viewThemeDetail(theme)"
					>
						<!-- 主题预览图 -->
						<view class="theme-preview" :style="{ background: theme.preview }">
							<!-- 模拟锁屏界面 -->
							<view class="preview-statusbar">
								<text class="status-time">{{ formatTime(theme.previewTime) }}</text>
							</view>
							<view class="preview-lockscreen">
								<text class="lock-time">12:00</text>
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
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const statusBarHeight = ref(0)

// 精选APP主题（小米主题商店风格）
const featuredThemes = ref([
	{
		id: 1,
		name: '默认绿色',
		author: '官方',
		preview: 'linear-gradient(135deg, #A5D63F 0%, #8BC34A 100%)',
		previewTime: new Date(),
		downloads: 12580,
		isOfficial: true
	},
	{
		id: 2,
		name: '科技蓝',
		author: '官方',
		preview: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
		previewTime: new Date(),
		downloads: 23450,
		isOfficial: true
	},
	{
		id: 3,
		name: '紫色梦幻',
		author: '设计师',
		preview: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
		previewTime: new Date(),
		downloads: 8920,
		isOfficial: false
	},
	{
		id: 4,
		name: '活力橙',
		author: '官方',
		preview: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
		previewTime: new Date(),
		downloads: 15670,
		isOfficial: true
	},
	{
		id: 5,
		name: '暗夜黑',
		author: '官方',
		preview: 'linear-gradient(135deg, #2C3E50 0%, #1A252F 100%)',
		previewTime: new Date(),
		downloads: 34580,
		isOfficial: true
	},
	{
		id: 6,
		name: '樱花粉',
		author: '设计师',
		preview: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
		previewTime: new Date(),
		downloads: 6780,
		isOfficial: false
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

// 去APP主题
const goToAppThemes = () => {
	uni.navigateTo({
		url: '/pages/app-themes/app-themes'
	})
}

// 去定制智能柜
const goToCabinetCustomize = () => {
	uni.navigateTo({
		url: '/pages/cabinet-customize-new/cabinet-customize-new'
	})
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
$radius-lg: 16rpx;
$radius-xl: 20rpx;
$radius-2xl: 24rpx;

/* ==================== 字体变量 ==================== */
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
	
	.category-buttons {
		flex-direction: column;
		height: auto;
	}
	
	.category-btn {
		height: 180rpx;
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

/* ==================== 分类按钮 ==================== */
.category-buttons {
	display: flex;
	gap: $spacing-3;
	margin-bottom: $spacing-4;
}

.category-btn {
	flex: 1;
	height: 200rpx;
	border-radius: $radius-2xl;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: $spacing-2;
	transition: all 0.2s ease;
	box-shadow: $shadow-sm;

	&:active {
		transform: scale(0.98);
		box-shadow: $shadow-md;
	}

	.btn-icon {
		width: 64rpx;
		height: 64rpx;
	}

	.btn-text {
		font-size: $font-size-lg;
		font-weight: 600;
		color: #FFFFFF;
	}

	.btn-desc {
		font-size: $font-size-sm;
		color: rgba(255, 255, 255, 0.9);
	}
}

	.app-btn {
		background: $primary-btn;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

		&:active {
			background: $primary-dark;
			transform: scale(0.95);
		}
	}

	.cabinet-btn {
		background: #4A90E2;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

		&:active {
			background: #357ABD;
			transform: scale(0.95);
		}
	}
/* ==================== 精选主题 ==================== */
.featured-section {
	margin-top: $spacing-2;
}

.section-header {
	display: flex;
	align-items: center;
	gap: $spacing-2;
	margin-bottom: $spacing-3;
}

.section-icon-wrapper {
	width: 48rpx;
	height: 48rpx;
	background: $primary-light;
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	justify-content: center;
}

.section-icon {
	width: 28rpx;
	height: 28rpx;
}

.section-title {
	flex: 1;
	font-size: $font-size-lg;
	font-weight: 600;
	color: $on-background;
}

.more-btn {
	display: flex;
	align-items: center;
	gap: $spacing-1;
}

.more-text {
	font-size: $font-size-sm;
	color: $on-surface;
}

.more-icon {
	font-size: $font-size-base;
	color: $on-surface;
}

/* ==================== 主题网格（小米主题商店风格） ==================== */
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

/* 主题预览图 */
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
	object-fit: cover;
	display: block;
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

/* 主题信息 */
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
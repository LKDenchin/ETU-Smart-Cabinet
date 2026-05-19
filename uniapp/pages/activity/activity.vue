<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">←</text>
				</view>
				<text class="nav-title">活动区</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 轮播推荐 -->
			<view class="banner-section">
				<swiper
					class="banner-swiper"
					:indicator-dots="true"
					:autoplay="true"
					:interval="3000"
					:circular="true"
					indicator-color="rgba(255,255,255,0.5)"
					indicator-active-color="#FFFFFF"
				>
					<swiper-item v-for="(banner, index) in banners" :key="index" @click="handleBannerClick(banner)">
						<view class="banner-item">
							<image class="banner-image" :src="banner.image" mode="aspectFill"></image>
							<view class="banner-overlay">
								<text class="banner-title">{{ banner.title }}</text>
								<text class="banner-desc">{{ banner.desc }}</text>
							</view>
						</view>
					</swiper-item>
				</swiper>
			</view>

			<!-- 活动列表（仿照讨论区样式） -->
			<view class="activities-section">
				<view class="section-header">
					<view class="section-icon-wrapper">
						<image class="section-icon" src="/static/icons/icon-activity.png" mode="aspectFit"></image>
					</view>
					<text class="section-title">官方活动</text>
					<text class="section-count">{{ activities.length }}个</text>
				</view>

				<view class="waterfall-container">
					<view class="waterfall-column">
										<view
											class="activity-card"
											v-for="(activity, index) in leftColumnActivities"
											:key="activity.id"
											@click="viewActivityDetail(activity)"
										>
											<!-- 管理员删除按钮 -->
											<view class="admin-delete-btn" v-if="isAdmin" @click.stop="deleteActivity(activity)">
												<text class="admin-delete-icon">×</text>
											</view>
											<!-- 内容 -->
											<view class="activity-content">
												<text class="activity-title">{{ activity.theme }}</text>
												<text class="activity-text">{{ activity.content }}</text>
											</view>
					
											<!-- 底部信息 -->
											<view class="activity-footer">
												<view class="organizer-info">
													<image class="organizer-avatar" :src="getAvatarUrl(activity.avatar)" mode="aspectFill"></image>
													<text class="organizer-name">{{ activity.nickname || '管理员' }}</text>
												</view>								<view class="activity-stats">
									<view class="stat-item">
										<image class="stat-icon" src="/static/icons/icon-like.png" mode="aspectFit"></image>
										<text class="stat-count">{{ activity.likeCount || 0 }}</text>
									</view>
								</view>
							</view>

							<!-- 状态标签 -->
							<view class="status-badge" :class="'status-' + activity.status">
								<text class="status-text">{{ getStatusText(activity.status) }}</text>
							</view>
						</view>
					</view>

					<view class="waterfall-column">
										<view
											class="activity-card"
											v-for="(activity, index) in rightColumnActivities"
											:key="activity.id"
											@click="viewActivityDetail(activity)"
										>
											<!-- 管理员删除按钮 -->
											<view class="admin-delete-btn" v-if="isAdmin" @click.stop="deleteActivity(activity)">
												<text class="admin-delete-icon">×</text>
											</view>
											<!-- 内容 -->
											<view class="activity-content">
												<text class="activity-title">{{ activity.theme }}</text>
												<text class="activity-text">{{ activity.content }}</text>
											</view>
					
											<!-- 底部信息 -->
											<view class="activity-footer">
												<view class="organizer-info">
													<image class="organizer-avatar" :src="getAvatarUrl(activity.avatar)" mode="aspectFill"></image>
													<text class="organizer-name">{{ activity.nickname || '管理员' }}</text>
												</view>								<view class="activity-stats">
									<view class="stat-item">
										<image class="stat-icon" src="/static/icons/icon-like.png" mode="aspectFit"></image>
										<text class="stat-count">{{ activity.likeCount || 0 }}</text>
									</view>
								</view>
							</view>

							<!-- 状态标签 -->
							<view class="status-badge" :class="'status-' + activity.status">
								<text class="status-text">{{ getStatusText(activity.status) }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { postApi, getAvatarUrl } from '../../utils/request.js'

const statusBarHeight = ref(0)
const isLoading = ref(false)

// 轮播图数据
const banners = ref([
	{
		id: 1,
		title: '智能柜体验周',
		desc: '免费体验，赢取好礼',
		image: '/static/icons/icon-1.png'
	},
	{
		id: 2,
		title: 'NFC功能推广',
		desc: '碰一碰，取件更快',
		image: '/static/icons/icon-2.png'
	},
	{
		id: 3,
		title: '社区活动月',
		desc: '分享体验，获取积分',
		image: '/static/icons/icon-3.png'
	}
])

// 活动列表（官方公布）
const activities = ref([])

// 瀑布流分列
const leftColumnActivities = computed(() => {
	return activities.value.filter((_, index) => index % 2 === 0)
})

const rightColumnActivities = computed(() => {
	return activities.value.filter((_, index) => index % 2 === 1)
})

onLoad(() => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44

	loadData()
})

// 页面显示时重新加载（从详情页返回时刷新数据）
onShow(() => {
	loadData()
})

// 加载数据
const loadData = async () => {
	if (isLoading.value) return
	isLoading.value = true

	try {
		// 从服务器获取活动帖子
		const serverActivities = await postApi.getPosts('activity')
		console.log('服务器返回的活动:', serverActivities)
		console.log('活动数量:', serverActivities ? serverActivities.length : 0)
		activities.value = serverActivities || []
	} catch (error) {
		console.error('加载活动失败:', error)
		// 加载失败时，使用本地缓存
		const localPosts = uni.getStorageSync('communityPosts') || []
		const activityLocal = localPosts.filter(p => p.category === 'activity')
		activities.value = activityLocal
	} finally {
		isLoading.value = false
	}
}

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 处理轮播图点击
const handleBannerClick = (banner) => {
	uni.showModal({
		title: banner.title,
		content: banner.desc,
		showCancel: false
	})
}

// 查看活动详情
const viewActivityDetail = (activity) => {
	// 传递完整的活动数据和分类信息，让详情页自己加载评论
	uni.navigateTo({
		url: `/pages/post-detail/post-detail?data=${encodeURIComponent(JSON.stringify({
			...activity,
			category: 'activity',
			activityTheme: activity.theme || activity.activityTheme,
			status: activity.status || 'pending'
		}))}`
	})
}

// 管理员判断
const isAdmin = computed(() => {
	const userInfo = uni.getStorageSync('userInfo')
	return userInfo && userInfo.isAdmin
})

// 删除活动（管理员功能）
const deleteActivity = async (activity) => {
	if (!isAdmin.value) return

	uni.showModal({
		title: '确认删除',
		content: `确定要删除这个活动吗？`,
		success: async (res) => {
			if (res.confirm) {
				try {
					await postApi.deletePost(activity.id)
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					})
					// 刷新列表
					loadData()
				} catch (error) {
					console.error('删除失败:', error)
					uni.showToast({
						title: '删除失败',
						icon: 'none'
					})
				}
			}
		}
	})
}

// 获取状态文本
const getStatusText = (status) => {
	const texts = {
		upcoming: '即将开始',
		ongoing: '进行中',
		ended: '已结束'
	}
	return texts[status] || '未知'
}
</script>

<style lang="scss" scoped>
@import "~@/uni.scss";

/* ==================== 现代UI设计 - 颜色变量 ==================== */
/* 主色系 - 现代柔和配色 */
$primary: #5E72E4;           /* 主色：科技蓝 */
$primary-light: #F5F7FF;     /* 浅蓝 */
$primary-dark: #4550C1;      /* 深蓝 */
$primary-btn: #5E72E4;       /* 按钮蓝 */

/* 成功色系 */
$success: #10B981;           /* 成功绿 */
$success-light: #F0FDF4;     /* 浅绿 */
$success-dark: #059669;      /* 深绿 */

/* 警告色系 */
$warning: #F59E0B;           /* 警告黄 */
$warning-light: #FFFBEB;     /* 浅黄 */
$warning-dark: #D97706;      /* 深黄 */

/* 错误色系 */
$error: #EF4444;             /* 错误红 */
$error-light: #FEF2F2;       /* 浅红 */
$error-dark: #DC2626;        /* 深红 */

/* 中性色系 */
$background: #FFFFFF;        /* 背景 */
$surface: #F8FAFC;           /* 表面 */
$surface-variant: #F1F5F9;   /* 表面变体 */

$on-background: #1E293B;     /* 主要文字 */
$on-surface: #475569;        /* 次要文字 */
$on-surface-variant: #64748B;/* 三级文字 */
$on-surface-disabled: #94A3B8;/* 禁用文字 */

$outline: #E2E8F0;           /* 边框 */
$outline-light: #E7ECEF;     /* 浅边框 */
$outline-dark: #CBD5E1;      /* 深边框 */

/* 阴影 - 现代阴影系统 */
$shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.06);
$shadow-md: 0 4px 8px 0 rgba(0, 0, 0, 0.07);
$shadow-lg: 0 8px 16px 0 rgba(0, 0, 0, 0.08);
$shadow-xl: 0 16px 24px 0 rgba(0, 0, 0, 0.09);

/* ==================== 间距变量（8px网格） ==================== */
$spacing-1: 8rpx;
$spacing-2: 16rpx;
$spacing-3: 24rpx;
$spacing-4: 32rpx;
$spacing-5: 40rpx;
$spacing-6: 48rpx;

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
$font-size-xl: 36rpx;



/* ==================== 响应式断点 ==================== */
@media screen and (max-width: 750rpx) {
	$spacing-3: 20rpx;
	$spacing-4: 24rpx;
	$font-size-base: 26rpx;
	$font-size-lg: 30rpx;
	$font-size-xl: 34rpx;
}

@media screen and (max-width: 600rpx) {
	$spacing-3: 18rpx;
	$spacing-4: 20rpx;
	$font-size-base: 24rpx;
	$font-size-lg: 28rpx;
	$font-size-xl: 32rpx;
}

/* ==================== 容器 ==================== */
.container {
	min-height: 100vh;
	background: linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%);
}

/* ==================== 导航栏 ==================== */
.navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(20rpx);
	border-bottom: 1rpx solid $outline-light;
	box-shadow: $shadow-sm;
}

.nav-content {
	height: 88rpx;
	display: flex;
	align-items: center;
	padding: 0 $spacing-6;
}

.nav-back {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: $radius-lg;
	background: $surface;
	transition: all 0.2s ease;

	&:active {
		background: $outline-light;
		transform: scale(0.95);
	}

	.back-icon {
		font-size: 36rpx;
		color: $on-background;
		font-weight: 600;
	}
}

.nav-title {
	flex: 1;
	text-align: center;
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $on-background;
}

.nav-placeholder {
	width: 48rpx;
}

/* ==================== 主内容区 ==================== */
.content {
	padding: $spacing-4;
	padding-bottom: 160rpx;
	width: 100%;
	max-width: 100%;
	overflow-x: hidden;
	box-sizing: border-box;
}

/* ==================== 轮播图 ==================== */
.banner-section {
	margin-bottom: $spacing-4;
}

.banner-swiper {
	border-radius: $radius-xl;
	overflow: hidden;
	box-shadow: $shadow-md;
}

.banner-item {
	position: relative;
	width: 100%;
	height: 360rpx;
}

.banner-image {
	width: 100%;
	height: 100%;
}

.banner-overlay {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	padding: $spacing-4;
	background: rgba(0, 0, 0, 0.7);
}

.banner-title {
	display: block;
	font-size: $font-size-lg;
	font-weight: 700;
	color: #FFFFFF;
	margin-bottom: $spacing-1;
}

.banner-desc {
	display: block;
	font-size: $font-size-sm;
	color: rgba(255, 255, 255, 0.9);
}

/* ==================== 活动区块 ==================== */
.activities-section {
	display: flex;
	flex-direction: column;
	gap: $spacing-3;
}

.section-header {
	display: flex;
	align-items: center;
	gap: $spacing-2;
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
	font-size: $font-size-base;
	font-weight: 700;
	color: $on-background;
}

.section-count {
	font-size: $font-size-sm;
	color: $on-surface-variant;
}

/* ==================== 瀀布流容器 ==================== */
.waterfall-container {
	display: flex;
	gap: $spacing-3;
	width: 100%;
	overflow: visible;
	box-sizing: border-box;
}

.waterfall-column {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-3;
	min-width: 0;
	box-sizing: border-box;
}

@media screen and (max-width: 600rpx) {
	.waterfall-container {
		flex-direction: column;
	}
	
	.waterfall-column {
		min-width: 100%;
	}
}

/* ==================== 活动卡片 ==================== */
.activity-card {
	background: $surface;
	border-radius: $radius-xl;
	overflow: hidden;
	box-shadow: $shadow-sm;
	position: relative;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	width: 100%;
	box-sizing: border-box;

	&:active {
		transform: scale(0.98);
		box-shadow: $shadow-md;
	}
}

/* 管理员删除按钮 */
.admin-delete-btn {
	position: absolute;
	top: 10rpx;
	right: 10rpx;
	width: 48rpx;
	height: 48rpx;
	background: rgba(239, 68, 68, 0.9);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
	box-shadow: 0 2rpx 8rpx rgba(239, 68, 68, 0.4);

	&:active {
		transform: scale(0.9);
	}
}

.admin-delete-icon {
	font-size: 36rpx;
	color: #fff;
	font-weight: 300;
	line-height: 1;
}

.activity-image {
	width: 100%;
	min-height: 280rpx;
	max-height: 420rpx;
	background: $surface-variant;
	object-fit: cover;
	display: block;
}

.activity-content {
	padding: $spacing-3;
	box-sizing: border-box;
}

.activity-title {
	display: block;
	font-size: $font-size-base;
	font-weight: 700;
	color: $on-background;
	line-height: 1.4;
	margin-bottom: $spacing-2;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
	word-break: break-word;
	word-wrap: break-word;
}

.activity-text {
	display: block;
	font-size: $font-size-sm;
	color: $on-surface;
	line-height: 1.5;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 3;
	overflow: hidden;
	word-break: break-word;
	word-wrap: break-word;
}

.activity-footer {
	padding: $spacing-2 $spacing-3;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
}

.organizer-info {
	display: flex;
	align-items: center;
	gap: $spacing-2;
	flex: 1;
	min-width: 0;
}

.organizer-avatar {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: $surface-variant;
	flex-shrink: 0;
}

.organizer-name {
	font-size: $font-size-sm;
	color: $on-surface;
	max-width: 120rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: 500;
}

.activity-stats {
	display: flex;
	align-items: center;
	gap: $spacing-2;
}

.stat-item {
	display: flex;
	align-items: center;
	gap: $spacing-1;
}

.stat-icon {
	width: 24rpx;
	height: 24rpx;
}

.stat-count {
	font-size: $font-size-sm;
	color: $on-surface;
	font-weight: 500;
}

/* ==================== 状态标签 ==================== */
.status-badge {
	position: absolute;
	top: $spacing-2;
	right: $spacing-2;
	padding: $spacing-1 $spacing-2;
	border-radius: $radius-md;
	font-size: $font-size-xs;
	backdrop-filter: blur(10rpx);
	-webkit-backdrop-filter: blur(10rpx);

	&.status-upcoming {
		background: rgba(165, 214, 63, 0.9);
	}

	&.status-ongoing {
		background: rgba(46, 204, 113, 0.9);
	}

	&.status-ended {
		background: rgba(153, 153, 153, 0.9);
	}

	.status-text {
		color: #FFFFFF;
		font-weight: 600;
	}
}
</style>
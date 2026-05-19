<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">讨论区</text>
				<text class="placeholder"></text>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: navbarHeight + 'px' }">
			<!-- 介绍卡片 -->
			<view class="intro-card">
				<view class="intro-icon-wrapper">
					<image class="intro-icon" src="/static/icons/icon-discussion.png" mode="aspectFit"></image>
				</view>
				<view class="intro-content">
					<text class="intro-title">讨论区</text>
					<text class="intro-desc">分享你的想法，与大家交流互动</text>
				</view>
			</view>

			<!-- 瀀布流帖子列表（小红书风格） -->
			<view class="waterfall-container">
				<view class="waterfall-column">
										<view class="post-card"
											v-for="(post, index) in leftColumnPosts"
											:key="post.id"
											@click="viewPostDetail(post)"
										>
											<!-- 管理员删除按钮 -->
											<view class="admin-delete-btn" v-if="isAdmin" @click.stop="deletePost(post)">
												<text class="admin-delete-icon">×</text>
											</view>
											<!-- 内容 -->
											<view class="post-content">
												<text class="post-title">{{ post.title || '讨论' }}</text>
												<text class="post-text">{{ post.content }}</text>
											</view>
					
											<!-- 底部信息 -->
					
																	<view class="post-footer">
					
																		<view class="user-info">
					
																			<image class="user-avatar" :src="getAvatarUrl(post.avatar)" mode="aspectFill"></image>
					
																			<text class="user-name">{{ post.nickname || '用户' }}</text>
					
																		</view>
					
																		<view class="post-stats">
					
																			<view class="stat-item">
					
																				<image class="stat-icon" src="/static/icons/icon-like.png" mode="aspectFit"></image>
					
																				<text class="stat-count">{{ post.likeCount || 0 }}</text>
					
																			</view>
					
																		</view>
					
																	</view>										</view>
				</view>

				<view class="waterfall-column">
					<view
						class="post-card"
						v-for="(post, index) in rightColumnPosts"
						:key="post.id"
						@click="viewPostDetail(post)"
					>
						<!-- 管理员删除按钮 -->
						<view class="admin-delete-btn" v-if="isAdmin" @click.stop="deletePost(post)">
							<text class="admin-delete-icon">×</text>
						</view>
						<!-- 内容 -->
						<view class="post-content">
							<text class="post-title">{{ post.title || '讨论' }}</text>
							<text class="post-text">{{ post.content }}</text>
						</view>

						<!-- 底部信息 -->
						<view class="post-footer">
							<view class="user-info">
								<image class="user-avatar" :src="getAvatarUrl(post.avatar)" mode="aspectFill"></image>
								<text class="user-name">{{ post.nickname || '用户' }}</text>
							</view>
							<view class="post-stats">
								<view class="stat-item">
									<image class="stat-icon" src="/static/icons/icon-like.png" mode="aspectFit"></image>
									<text class="stat-count">{{ post.likeCount || 0 }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 浮动发帖按钮 -->
		<view class="fab" @click="goToPublish">
			<image class="fab-icon" src="/static/icons/icon-publish.png" mode="aspectFit"></image>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { postApi, getAvatarUrl } from '../../utils/request.js'

const statusBarHeight = ref(0)
const posts = ref([])
const isLoading = ref(false)

// 管理员检查
const isAdmin = computed(() => {
	const userInfo = uni.getStorageSync('userInfo')
	return userInfo && userInfo.isAdmin
})

// 加载帖子
const loadPosts = async () => {
	if (isLoading.value) return
	isLoading.value = true

	console.log('=== 开始加载讨论区帖子 ===')
	console.log('平台:', uni.getSystemInfoSync().platform)

	try {
		// 从服务器获取讨论区帖子
		const result = await postApi.getPosts('discussion')
		console.log('服务器返回的原始数据:', result)
		console.log('数据类型:', typeof result)
		console.log('是否为数组:', Array.isArray(result))
		
		// 确保是数组
		const serverPosts = Array.isArray(result) ? result : []
		
		console.log('处理后的帖子数量:', serverPosts.length)
		
		if (serverPosts.length > 0) {
			console.log('第一个帖子:', JSON.stringify(serverPosts[0]))
		}
		
		posts.value = serverPosts
		console.log('设置后的posts.value:', posts.value)
		console.log('posts.value.length:', posts.value.length)
	} catch (error) {
		console.error('加载帖子失败:', error)
		console.error('错误详情:', JSON.stringify(error))
		// 加载失败时，使用本地缓存
		const localPosts = uni.getStorageSync('communityPosts') || []
		const discussionLocal = localPosts.filter(p => p.category === 'discussion')
		posts.value = discussionLocal
	} finally {
		isLoading.value = false
	}
}

// 瀑布流分列
const leftColumnPosts = computed(() => {
	return posts.value.filter((_, index) => index % 2 === 0)
})

const rightColumnPosts = computed(() => {
	return posts.value.filter((_, index) => index % 2 === 1)
})

onLoad(() => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44

	// 加载帖子数据
	loadPosts()
})

// 页面显示时重新加载（从详情页返回时刷新点赞数等数据）
onShow(() => {
	loadPosts()
})

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 去发帖
const goToPublish = () => {
	uni.navigateTo({
		url: '/pages/publish-post/publish-post?category=discussion'
	})
}

// 删除帖子（管理员）
const deletePost = async (post) => {
	try {
		const res = await uni.showModal({
			title: '确认删除',
			content: '确定要删除这条帖子吗？'
		})
		
		if (res.confirm) {
			await postApi.deletePost(post.id)
			uni.showToast({
				title: '删除成功',
				icon: 'success'
			})
			loadPosts()
		}
	} catch (error) {
		console.error('删除失败:', error)
		uni.showToast({
			title: '删除失败',
			icon: 'none'
		})
	}
}

// 查看帖子详情
const viewPostDetail = (post) => {
	// 传递完整的帖子数据和分类信息，让详情页自己加载评论
	uni.navigateTo({
		url: `/pages/post-detail/post-detail?data=${encodeURIComponent(JSON.stringify({
			...post,
			category: 'discussion',
			status: post.status || 'pending'
		}))}`
	})
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

/* 背景色系 */
$background: #FAFAFA;        /* 背景白 */
$surface: #FFFFFF;           /* 表面白 */
$surface-variant: #F5F5F5;   /* 变体表面色 */

/* 文字色系 */
$on-background: #1F2937;     /* 主文字 */
$on-surface: #6B7280;        /* 次要文字 */
$on-surface-light: #9CA3AF;  /* 浅色文字 */

/* 边框色系 */
$outline: #E5E7EB;           /* 边框 */
$outline-light: #F3F4F6;     /* 浅边框 */

/* 阴影色系 */
$shadow-xs: 0 2rpx 4rpx rgba(0, 0, 0, 0.04);
$shadow-sm: 0 4rpx 8rpx rgba(0, 0, 0, 0.06);
$shadow-md: 0 8rpx 16rpx rgba(0, 0, 0, 0.08);

/* 间距变量 */
$spacing-1: 8rpx;
$spacing-2: 16rpx;
$spacing-3: 24rpx;
$spacing-4: 32rpx;
$spacing-5: 40rpx;

/* 圆角变量 */
$radius-md: 12rpx;
$radius-lg: 16rpx;
$radius-xl: 24rpx;
$radius-2xl: 32rpx;

/* 字体变量 */
$font-size-sm: 24rpx;
$font-size-base: 28rpx;
$font-size-lg: 32rpx;

/* 布局容器 */
.container {
	min-height: 100vh;
	background: $background;
	position: relative;
}

/* ==================== 导航栏 ==================== */
.navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: $surface;
	box-shadow: $shadow-xs;
}

.nav-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	padding: 0 32rpx;
}

.nav-back {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: $radius-md;
	
	&:active {
		background: $surface-variant;
	}
}

.back-icon {
	font-size: 60rpx;
	color: $on-background;
	line-height: 1;
	font-weight: 300;
}

.nav-title {
	flex: 1;
	text-align: center;
	font-size: $font-size-lg;
	font-weight: 600;
	color: $on-background;
}

.placeholder {
	width: 60rpx;
}

/* ==================== 主内容区 ==================== */
.content {
	padding-top: calc(88rpx + var(--status-bar-height, 0));
	padding-bottom: 120rpx;
}

/* ==================== 介绍卡片 ==================== */
.intro-card {
	background: linear-gradient(135deg, $primary-light 0%, #E0E7FF 100%);
	margin: $spacing-3;
	padding: $spacing-4;
	border-radius: $radius-xl;
	display: flex;
	align-items: center;
	gap: $spacing-3;
	box-shadow: $shadow-sm;
}

.intro-icon-wrapper {
	width: 80rpx;
	height: 80rpx;
	background: $surface;
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: $shadow-xs;
}

.intro-icon {
	width: 48rpx;
	height: 48rpx;
}

.intro-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-1;
}

.intro-title {
	font-size: $font-size-lg;
	font-weight: 600;
	color: $primary-dark;
}

.intro-desc {
	font-size: $font-size-sm;
	color: $on-surface;
}

/* ==================== 瀑布流布局 ==================== */
.waterfall-container {
	display: flex;
	gap: $spacing-2;
	padding: 0 $spacing-3;
}

.waterfall-column {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-2;
}

/* ==================== 帖子卡片（小红书风格） ==================== */
.post-card {
	background: $surface;
	border-radius: $radius-xl;
	overflow: hidden;
	box-shadow: $shadow-sm;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	width: 100%;
	box-sizing: border-box;
	position: relative;

	&:active {
		transform: scale(0.98);
		box-shadow: $shadow-md;
	}
}

.post-content {
	padding: $spacing-3;
	box-sizing: border-box;
}

.post-title {
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
}

.post-text {
	display: block;
	font-size: $font-size-sm;
	color: $on-surface;
	line-height: 1.6;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 4;
	overflow: hidden;
}

.post-footer {
	padding: $spacing-2 $spacing-3;
	background: $surface-variant;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: $spacing-2;
}

.user-info {
	display: flex;
	align-items: center;
	gap: $spacing-2;
	flex: 1;
	min-width: 0;
}

.user-avatar {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	flex-shrink: 0;
}

.user-name {
	font-size: $font-size-sm;
	color: $on-surface;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1;
}

.post-stats {
	display: flex;
	align-items: center;
	gap: $spacing-1;
	flex-shrink: 0;
}

.stat-item {
	display: flex;
	align-items: center;
	gap: $spacing-1;
}

.stat-icon {
	width: 32rpx;
	height: 32rpx;
	opacity: 0.8;
}

.stat-count {
	font-size: $font-size-sm;
	color: $on-surface;
}

/* ==================== 管理员删除按钮 ==================== */
.admin-delete-btn {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	width: 48rpx;
	height: 48rpx;
	background: rgba(255, 0, 0, 0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
}

.admin-delete-icon {
	font-size: 48rpx;
	color: #FF0000;
	line-height: 1;
	font-weight: 300;
}

/* ==================== 浮动发帖按钮 ==================== */
.fab {
	position: fixed;
	bottom: 120rpx;
	right: $spacing-4;
	width: 112rpx;
	height: 112rpx;
	background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
	border-radius: 50%;
	box-shadow: $shadow-md;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 50;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		transform: scale(0.95);
		box-shadow: $shadow-sm;
	}
}

.fab-icon {
	width: 56rpx;
	height: 56rpx;
}
</style>
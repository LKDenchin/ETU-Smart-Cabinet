<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<text class="nav-title">社区</text>
				<view class="nav-actions">
					<view class="search-btn">
						<image class="search-icon" src="/static/icons/icon-search.png" mode="aspectFit"></image>
					</view>
				</view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 分类按钮组 -->
			<view class="category-grid">
				<view class="category-card" @click="goToDiscussion">
					<view class="category-icon-wrapper discussion">
						<image class="category-icon" src="/static/icons/icon-discussion.png" mode="aspectFit"></image>
					</view>
					<text class="category-title">讨论</text>
					<text class="category-desc">分享想法</text>
				</view>
				<view class="category-card" @click="goToFeedback">
					<view class="category-icon-wrapper feedback">
						<image class="category-icon" src="/static/icons/icon-feedback.png" mode="aspectFit"></image>
					</view>
					<text class="category-title">反馈</text>
					<text class="category-desc">建议意见</text>
				</view>
				<view class="category-card" @click="goToActivity">
					<view class="category-icon-wrapper activity">
						<image class="category-icon" src="/static/icons/icon-activity.png" mode="aspectFit"></image>
					</view>
					<text class="category-title">活动</text>
					<text class="category-desc">官方公告</text>
				</view>
				<view class="category-card" @click="goToCustomize">
					<view class="category-icon-wrapper customize">
						<image class="category-icon" src="/static/icons/icon-customize.png" mode="aspectFit"></image>
					</view>
					<text class="category-title">定制</text>
					<text class="category-desc">个性主题</text>
				</view>
			</view>

			<!-- 快捷发帖栏 -->
			<view class="post-input-bar" @click="goToPublish">
				<view class="input-wrapper">
					<text class="input-placeholder">分享你的精彩时刻...</text>
				</view>
				<view class="post-btn">
					<image class="post-icon" src="/static/icons/icon-publish.png" mode="aspectFit"></image>
				</view>
			</view>

			<!-- 精选内容标题 -->
			<view class="section-header">
				<text class="section-title">精选内容</text>
				<view class="refresh-btn" @click="refreshPosts">
					<image class="refresh-icon" src="/static/icons/icon-refresh.png" mode="aspectFit"></image>
				</view>
			</view>

			<!-- 瀑布流内容 -->
			<view class="waterfall-container">
				<view class="waterfall-column">
					<view
						class="post-card"
						v-for="(post, index) in leftColumnPosts"
						:key="post.id"
						@click="viewPostDetail(post)"
					>
						<!-- 内容 -->
						<view class="post-content">
							<text class="post-text">{{ post.content }}</text>
						</view>

						<!-- 底部信息 -->
						<view class="post-footer">
							<view class="user-info">
								<image class="user-avatar" :src="getAvatarUrl(post.avatar)" mode="aspectFill"></image>
								<text class="user-name">{{ post.nickname || '用户' }}</text>
							</view>
							<view class="post-right">
								<view class="official-badge" v-if="post.isOfficial">官方</view>
								<text class="post-time">{{ formatTime(post.createTime) }}</text>
							</view>
						</view>

						<!-- 互动数据 -->
						<view class="post-stats">
							<view class="stat-item">
								<image class="stat-icon" src="/static/icons/icon-like.png" mode="aspectFit"></image>
								<text class="stat-count">{{ post.likeCount || 0 }}</text>
							</view>
							<view class="stat-item">
								<image class="stat-icon" src="/static/icons/icon-comment.png" mode="aspectFit"></image>
								<text class="stat-count">{{ post.commentCount || 0 }}</text>
							</view>
						</view>

						<!-- 分区标签 -->
						<view class="post-tag" :class="'tag-' + post.category">{{ getCategoryName(post.category) }}</view>
					</view>
				</view>

				<view class="waterfall-column">
					<view
						class="post-card"
						v-for="(post, index) in rightColumnPosts"
						:key="post.id"
						@click="viewPostDetail(post)"
					>
						<!-- 内容 -->
						<view class="post-content">
							<text class="post-text">{{ post.content }}</text>
						</view>

						<!-- 底部信息 -->
						<view class="post-footer">
							<view class="user-info">
								<image class="user-avatar" :src="getAvatarUrl(post.avatar)" mode="aspectFill"></image>
								<text class="user-name">{{ post.nickname || '用户' }}</text>
							</view>
							<view class="post-right">
								<view class="official-badge" v-if="post.isOfficial">官方</view>
								<text class="post-time">{{ formatTime(post.createTime) }}</text>
							</view>
						</view>

						<!-- 互动数据 -->
						<view class="post-stats">
							<view class="stat-item">
								<image class="stat-icon" src="/static/icons/icon-like.png" mode="aspectFit"></image>
								<text class="stat-count">{{ post.likeCount || 0 }}</text>
							</view>
							<view class="stat-item">
								<image class="stat-icon" src="/static/icons/icon-comment.png" mode="aspectFit"></image>
								<text class="stat-count">{{ post.commentCount || 0 }}</text>
							</view>
						</view>

						<!-- 分区标签 -->
						<view class="post-tag" :class="'tag-' + post.category">{{ getCategoryName(post.category) }}</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { postApi, getAvatarUrl } from '../../utils/request.js'

const statusBarHeight = ref(0)
const posts = ref([])
const isLoading = ref(false)

// 瀑布流分列
const leftColumnPosts = computed(() => {
	return posts.value.filter((_, index) => index % 2 === 0)
})

const rightColumnPosts = computed(() => {
	return posts.value.filter((_, index) => index % 2 === 1)
})

// 加载帖子
const loadPosts = async () => {
	if (isLoading.value) return
	isLoading.value = true

	try {
		const serverPosts = await postApi.getPosts()
		posts.value = serverPosts || []

		// 检查是否有刚发布的帖子
		const justPublished = uni.getStorageSync('justPublishedPost')
		if (justPublished) {
			// 避免重复添加
			const exists = posts.value.some(p => p.id === justPublished.id)
			if (!exists) {
				posts.value.unshift(justPublished)
			}
		}
	} catch (error) {
		console.error('加载帖子失败:', error)
		// 加载失败时，使用本地缓存
		const localPosts = uni.getStorageSync('communityPosts') || []
		posts.value = localPosts
	} finally {
		isLoading.value = false
	}
}

const handleNewPost = (newPost) => {
	// 避免重复添加
	const exists = posts.value.some(p => p.id === newPost.id)
	if (!exists) {
		posts.value.unshift(newPost)
	}
	uni.setStorageSync('justPublishedPost', newPost)
}

const handlePostStatusUpdate = (eventData) => {
	console.log('社区页面收到帖子状态更新事件:', eventData)
	// 更新本地帖子列表中的状态
	const postIndex = posts.value.findIndex(p => p.id === eventData.postId)
	if (postIndex !== -1) {
		posts.value[postIndex].status = eventData.status
		console.log(`已更新帖子 ${eventData.postId} 的状态为 ${eventData.status}`)
	}
}

onLoad(() => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44

	loadPosts()

	uni.$on('newPostPublished', handleNewPost)
	uni.$on('postStatusUpdated', handlePostStatusUpdate)
})

onUnmounted(() => {
	uni.$off('newPostPublished', handleNewPost)
	uni.$off('postStatusUpdated', handlePostStatusUpdate)
})

onShow(() => {
	uni.removeStorageSync('justPublishedPost')
	// 从详情页返回时刷新帖子
	loadPosts()
})

onMounted(() => {
	// 页面显示时刷新帖子
	loadPosts()
})

const goToDiscussion = () => {
	uni.navigateTo({
		url: '/pages/discussion/discussion'
	})
}

const goToFeedback = () => {
	uni.navigateTo({
		url: '/pages/feedback/feedback'
	})
}

const goToActivity = () => {
	uni.navigateTo({
		url: '/pages/activity/activity'
	})
}

const goToCustomize = () => {
	uni.navigateTo({
		url: '/pages/customize/customize'
	})
}

const goToPublish = () => {
	uni.navigateTo({
		url: '/pages/publish-post/publish-post'
	})
}

const refreshPosts = () => {
	uni.showToast({
		title: '刷新成功',
		icon: 'success'
	})
}

const viewPostDetail = (post) => {
	uni.navigateTo({
		url: `/pages/post-detail/post-detail?id=${post.id}`
	})
}

const getCategoryName = (category) => {
	const names = {
		discussion: '讨论',
		feedback: '反馈',
		activity: '活动',
		customize: '定制'
	}
	return names[category] || ''
}

const formatTime = (time) => {
	const date = new Date(time)
	const now = new Date()
	const diff = now - date
	const hours = Math.floor(diff / (1000 * 60 * 60))

	if (hours < 1) return '刚刚'
	if (hours < 24) return `${hours}小时前`
	if (hours < 48) return '昨天'
	return `${Math.floor(hours / 24)}天前`
}
</script>

<style lang="scss" scoped>
/* ==================== 颜色变量 - 原有绿色系配色方案 ==================== */
$primary: #A5D63F;           /* 主色：绿色 */
$primary-light: #E8F5E9;     /* 浅绿色 */
$primary-dark: #8BC34A;      /* 深绿色 */
$primary-btn: #2ECC71;       /* 按钮绿色 */

$secondary: #F39C12;         /* 辅色：橙色 */

$background: #FAFAFA;        /* 背景：极浅灰 */
$surface: #FFFFFF;           /* 表面：纯白 */
$surface-variant: #F3F4F6;   /* 表面变体 */

$on-background: #1A1A1A;     /* 主要文字：深灰黑 */
$on-surface: #4B5563;        /* 次要文字：中灰 */
$on-surface-variant: #9CA3AF;/* 三级文字：浅灰 */

$outline: #E5E7EB;           /* 边框：浅灰 */
$outline-light: #F9FAFB;     /* 浅边框 */

$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

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
	
	.category-grid {
		grid-template-columns: repeat(2, 1fr);
		gap: $spacing-2;
	}
	
	.size-input-grid {
		grid-template-columns: repeat(2, 1fr);
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
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(20rpx);
	-webkit-backdrop-filter: blur(20rpx);
	border-bottom: 1rpx solid $outline;
}

.nav-content {
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 $spacing-4;
}

.nav-title {
	font-size: $font-size-xl;
	font-weight: 700;
	color: $on-background;
}

.nav-actions {
	display: flex;
	align-items: center;
	gap: $spacing-2;
}

.search-btn {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: $surface-variant;
	border-radius: $radius-lg;
	transition: all 0.2s ease;

	&:active {
		background: $outline;
		transform: scale(0.95);
	}

	.search-icon {
		width: 32rpx;
		height: 32rpx;
	}
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

/* ==================== 分类网格 ==================== */
.category-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: $spacing-3;
	margin-bottom: $spacing-4;
	box-sizing: border-box;
	width: 100%;
}

@media screen and (max-width: 600rpx) {
	.category-grid {
		grid-template-columns: repeat(2, 1fr);
		gap: $spacing-2;
	}
}

.category-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-2;
	padding: $spacing-3;
	background: $surface;
	border-radius: $radius-xl;
	box-shadow: $shadow-sm;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		transform: scale(0.95);
		box-shadow: $shadow-md;
	}
}

.category-icon-wrapper {
	width: 80rpx;
	height: 80rpx;
	border-radius: $radius-xl;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;

	&.discussion {
		background: $primary-light;
	}

	&.feedback {
		background: #FFF3CD;
	}

	&.activity {
		background: #F8D7DA;
	}

	&.customize {
		background: #D1ECF1;
	}
}

.category-icon {
	width: 40rpx;
	height: 40rpx;
}

.category-title {
	font-size: $font-size-sm;
	color: $on-background;
	font-weight: 600;
}

.category-desc {
	font-size: $font-size-xs;
	color: $on-surface-variant;
}

/* ==================== 快捷发帖栏 ==================== */
.post-input-bar {
	display: flex;
	align-items: center;
	gap: $spacing-2;
	background: $surface;
	border-radius: $radius-xl;
	padding: $spacing-3;
	margin-bottom: $spacing-4;
	box-shadow: $shadow-sm;
	border: 2rpx solid $outline;
	transition: all 0.2s ease;

	&:active {
		background: $surface-variant;
		transform: scale(0.99);
	}

	.input-wrapper {
		flex: 1;
		height: 60rpx;
		display: flex;
		align-items: center;
	}

	.input-placeholder {
		font-size: $font-size-base;
		color: $on-surface-variant;
	}

	.post-btn {
		width: 64rpx;
		height: 64rpx;
		background: $primary-btn;
		border-radius: $radius-lg;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: $shadow-md;
		transition: all 0.2s ease;

		&:active {
			transform: scale(0.95);
		}

		.post-icon {
			width: 32rpx;
			height: 32rpx;
		}
	}
}

/* ==================== 区块头部 ==================== */
.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: $spacing-3;
}

.section-title {
	font-size: $font-size-lg;
	font-weight: 700;
	color: $on-background;
}

.refresh-btn {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: $surface-variant;
	border-radius: $radius-lg;
	transition: all 0.2s ease;

	&:active {
		background: $outline;
		transform: scale(0.95);
	}

	.refresh-icon {
		width: 24rpx;
		height: 24rpx;
	}
}

/* ==================== 瀑布流容器 ==================== */
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

/* ==================== 帖子卡片 ==================== */
.post-card {
	background: $surface;
	border-radius: $radius-xl;
	overflow: hidden;
	box-shadow: $shadow-sm;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	width: 100%;
	box-sizing: border-box;

	&:active {
		transform: scale(0.98);
		box-shadow: $shadow-md;
	}
}

.post-content {
	padding: $spacing-3;
	box-sizing: border-box;
}

.post-text {
	font-size: $font-size-base;
	color: $on-background;
	line-height: 1.6;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 4;
	overflow: hidden;
	word-break: break-word;
	word-wrap: break-word;
}

.post-images {
	padding: 0 $spacing-3;
	margin-bottom: $spacing-3;
	box-sizing: border-box;
}

.images-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: $spacing-1;
	width: 100%;
	box-sizing: border-box;
}

@media screen and (max-width: 600rpx) {
	.images-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

.post-image {
	width: 100%;
	height: 120rpx;
	background: $surface-variant;
	border-radius: $radius-md;
	object-fit: cover;
	display: block;
}

.post-image-full {
	width: 100%;
	min-height: 200rpx;
	max-height: 300rpx;
	background: $surface-variant;
	object-fit: cover;
	display: block;
}

.post-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $spacing-2 $spacing-3;
	box-sizing: border-box;
}

.user-info {
	display: flex;
	align-items: center;
	gap: $spacing-2;
	flex: 1;
	min-width: 0;
}

.user-avatar {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: $surface-variant;
	flex-shrink: 0;
}

.user-name {
	font-size: $font-size-sm;
	color: $on-surface;
	font-weight: 500;
	max-width: 120rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.post-right {
	display: flex;
	align-items: center;
	gap: $spacing-2;
	flex-shrink: 0;
}

.post-time {
	font-size: $font-size-xs;
	color: $on-surface-variant;
}

.official-badge {
	padding: 2rpx 8rpx;
	background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
	border-radius: 12rpx;
	font-size: 20rpx;
	color: #FFFFFF;
	font-weight: 600;
	border: 1rpx solid rgba(255, 107, 107, 0.3);
}

.post-stats {
	display: flex;
	gap: $spacing-3;
	padding: $spacing-2 $spacing-3;
	border-top: 1rpx solid $outline-light;
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

/* ==================== 分区标签 ==================== */
.post-tag {
	position: absolute;
	top: $spacing-2;
	right: $spacing-2;
	padding: $spacing-1 $spacing-2;
	border-radius: $radius-md;
	font-size: $font-size-xs;
	font-weight: 600;
	
	&.tag-discussion {
		background: $primary-light;
		color: $primary-dark;
	}
	
	&.tag-feedback {
		background: #FFF3CD;
		color: #856404;
	}
	
	&.tag-activity {
		background: #F8D7DA;
		color: #721C24;
	}
	
	&.tag-customize {
		background: #D1ECF1;
		color: #0C5460;
	}
}
</style>
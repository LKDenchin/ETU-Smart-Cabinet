<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">←</text>
				</view>
				<text class="nav-title">反馈区</text>
				<view class="nav-actions">
					<view class="filter-btn">
						<image class="filter-icon" src="/static/icons/icon-filter.png" mode="aspectFit"></image>
					</view>
				</view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 快捷反馈类型 -->
			<view class="quick-feedback-section">
				<view class="section-header">
					<view class="section-icon-wrapper">
						<image class="section-icon" src="/static/icons/icon-feedback.png" mode="aspectFit"></image>
					</view>
					<text class="section-title">快捷反馈</text>
				</view>
				<view class="feedback-types">
					<view class="feedback-type-card" @click="quickFeedback('bug')">
						<view class="type-icon-wrapper bug">
							<image class="type-icon" src="/static/icons/icon-bug.png" mode="aspectFit"></image>
						</view>
						<text class="type-title">Bug反馈</text>
					</view>
					<view class="feedback-type-card" @click="quickFeedback('feature')">
						<view class="type-icon-wrapper feature">
							<image class="type-icon" src="/static/icons/icon-feature.png" mode="aspectFit"></image>
						</view>
						<text class="type-title">功能建议</text>
					</view>
					<view class="feedback-type-card" @click="quickFeedback('ui')">
						<view class="type-icon-wrapper ui">
							<image class="type-icon" src="/static/icons/icon-ui.png" mode="aspectFit"></image>
						</view>
						<text class="type-title">UI建议</text>
					</view>
					<view class="feedback-type-card" @click="quickFeedback('other')">
						<view class="type-icon-wrapper other">
							<image class="type-icon" src="/static/icons/icon-other.png" mode="aspectFit"></image>
						</view>
						<text class="type-title">其他</text>
					</view>
				</view>
			</view>

			<!-- 反馈列表标题 -->
			<view class="list-header">
				<text class="list-title">我的反馈</text>
				<text class="list-count">{{ feedbackList.length }}条</text>
			</view>

			<!-- 反馈列表 -->
			<view class="feedback-list">
				<view
					class="feedback-card"
					v-for="feedback in feedbackList"
					:key="feedback.id"
					@click="viewFeedbackDetail(feedback)"
				>
					<!-- 管理员删除按钮 -->
					<view class="admin-delete-btn" v-if="isAdmin" @click.stop="deleteFeedback(feedback)">
						<text class="admin-delete-icon">×</text>
					</view>
					<!-- 反馈类型和进度 -->
					<view class="card-header">
						<view class="type-badge" :class="'type-' + feedback.type">
							<text class="type-text">{{ getTypeText(feedback.type) }}</text>
						</view>
						<view class="progress-indicator">
							<view class="progress-dots">
								<view 
									class="progress-dot" 
									:class="{ active: isStepActive(feedback.status, 1), completed: isStepCompleted(feedback.status, 1) }"
								></view>
								<view 
									class="progress-line" 
									:class="{ active: isStepCompleted(feedback.status, 1) }"
								></view>
								<view 
									class="progress-dot" 
									:class="{ active: isStepActive(feedback.status, 2), completed: isStepCompleted(feedback.status, 2) }"
								></view>
								<view 
									class="progress-line" 
									:class="{ active: isStepCompleted(feedback.status, 2) }"
								></view>
								<view 
									class="progress-dot" 
									:class="{ active: isStepActive(feedback.status, 3), completed: isStepCompleted(feedback.status, 3) }"
								></view>
							</view>
							<text class="status-label">{{ getStatusText(feedback.status) }}</text>
						</view>
					</view>

					<!-- 反馈内容 -->
					<view class="card-content">
						<text class="feedback-content">{{ feedback.content }}</text>
						<view class="reply-section" v-if="feedback.reply">
							<text class="reply-label">官方回复：</text>
							<text class="reply-text">{{ feedback.reply }}</text>
						</view>
					</view>

					<!-- 底部信息 -->
					<view class="card-footer">
						<view class="user-info">
							<image class="user-avatar" :src="getAvatarUrl(feedback.avatar)" mode="aspectFill"></image>
							<text class="user-name">{{ feedback.nickname || '用户' }}</text>
						</view>
						<text class="feedback-time">{{ formatTime(feedback.createTime) }}</text>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view class="empty-state" v-if="feedbackList.length === 0">
				<image class="empty-icon" src="/static/icons/icon-empty.png" mode="aspectFit"></image>
				<text class="empty-text">暂无反馈记录</text>
				<text class="empty-hint">点击上方按钮开始反馈</text>
			</view>
		</view>

		<!-- 浮动发帖按钮 -->
		<view class="fab" @click="goToPublish">
			<image class="fab-icon" src="/static/icons/icon-publish.png" mode="aspectFit"></image>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { postApi, getAvatarUrl } from '../../utils/request.js'

const statusBarHeight = ref(0)
const isLoading = ref(false)

// 反馈列表
const feedbackList = ref([])

onLoad(() => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44

	loadData()

	// 监听帖子状态更新事件
	uni.$on('postStatusUpdated', handlePostStatusUpdate)
})

// 页面卸载时移除事件监听
onUnmounted(() => {
	uni.$off('postStatusUpdated', handlePostStatusUpdate)
})

// 处理帖子状态更新事件
const handlePostStatusUpdate = (eventData) => {
	console.log('收到帖子状态更新事件:', eventData)
	// 刷新反馈列表
	loadData()
}

// 页面显示时重新加载（从详情页返回时刷新数据）
onShow(() => {
	loadData()
})

// 加载数据
const loadData = async () => {
	if (isLoading.value) return
	isLoading.value = true

	console.log('=== 开始加载反馈 ===')

	try {
		// 从服务器获取反馈帖子
		const serverFeedbacks = await postApi.getPosts('feedback')
		console.log('服务器返回的反馈:', serverFeedbacks)
		console.log('反馈数量:', serverFeedbacks ? serverFeedbacks.length : 0)

		// 详细输出每个反馈的状态
		if (serverFeedbacks && serverFeedbacks.length > 0) {
			serverFeedbacks.forEach((feedback, index) => {
				console.log(`反馈[${index}] - id: ${feedback.id}, status: ${feedback.status}, content: ${feedback.content.substring(0, 30)}...`);
			});
		}

		feedbackList.value = serverFeedbacks || []
	} catch (error) {
		console.error('加载反馈失败:', error)
		// 加载失败时，使用本地缓存
		const localFeedbacks = uni.getStorageSync('communityPosts') || []
		const feedbackLocal = localFeedbacks.filter(p => p.category === 'feedback')
		feedbackList.value = feedbackLocal
	} finally {
		isLoading.value = false
	}
}

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 快捷反馈
const quickFeedback = (type) => {
	uni.navigateTo({
		url: `/pages/publish-post/publish-post?category=feedback&feedbackType=${type}`
	})
}

// 去发帖
const goToPublish = () => {
	uni.navigateTo({
		url: '/pages/publish-post/publish-post?category=feedback'
	})
}

// 查看反馈详情
const viewFeedbackDetail = (feedback) => {
	// 传递完整的反馈数据和分类信息，让详情页自己加载评论
	uni.navigateTo({
		url: `/pages/post-detail/post-detail?data=${encodeURIComponent(JSON.stringify({
			...feedback,
			category: 'feedback',
			status: feedback.status || 'pending',
			activityTheme: feedback.activityTheme || ''
		}))}`
	})
}

// 管理员判断
const isAdmin = computed(() => {
	const userInfo = uni.getStorageSync('userInfo')
	return userInfo && userInfo.isAdmin
})

// 删除反馈（管理员功能）
const deleteFeedback = async (feedback) => {
	if (!isAdmin.value) return

	uni.showModal({
		title: '确认删除',
		content: `确定要删除这条反馈吗？`,
		success: async (res) => {
			if (res.confirm) {
				try {
					await postApi.deletePost(feedback.id)
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

// 判断步骤是否激活
const isStepActive = (status, step) => {
	const stepMap = {
		pending: 1,
		processing: 2,
		solved: 3
	}
	return stepMap[status] >= step
}

// 判断步骤是否完成
const isStepCompleted = (status, step) => {
	const stepMap = {
		pending: 1,
		processing: 2,
		solved: 3
	}
	return stepMap[status] > step
}

// 获取状态文本
const getStatusText = (status) => {
	const texts = {
		pending: '已提出',
		processing: '已立项',
		solved: '已解决'
	}
	return texts[status] || '已提出' // 默认显示"已提出"
}

// 获取类型文本
const getTypeText = (type) => {
	const texts = {
		bug: 'Bug反馈',
		feature: '功能建议',
		ui: 'UI建议',
		other: '其他'
	}
	return texts[type] || '其他'
}

// 格式化时间
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

/* 进度条红色 */
$progress-red: #EF4444;      /* 进度条红 */

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
	
	.feedback-types {
		grid-template-columns: repeat(2, 1fr);
	}
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
	justify-content: space-between;
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

.nav-actions {
	display: flex;
	align-items: center;
	gap: $spacing-3;
}

.filter-btn {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: $surface;
	border-radius: $radius-lg;
	transition: all 0.2s ease;
	box-shadow: $shadow-sm;

	&:active {
		background: $outline-light;
		transform: scale(0.95);
	}

	.filter-icon {
		width: 24rpx;
		height: 24rpx;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
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

/* ==================== 快捷反馈区块 ==================== */
.quick-feedback-section {
	margin-bottom: $spacing-5;
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
	font-size: $font-size-base;
	font-weight: 700;
	color: $on-background;
}

.feedback-types {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: $spacing-2;
}

.feedback-type-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-2;
	padding: $spacing-3;
	background: $surface;
	border-radius: $radius-xl;
	border: 2rpx solid $outline;
	box-shadow: $shadow-sm;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		transform: scale(0.95);
		border-color: $primary;
	}
}

.type-icon-wrapper {
	width: 64rpx;
	height: 64rpx;
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	justify-content: center;

	&.bug {
		background: #FEE2E2;
	}

	&.feature {
		background: #FEF3C7;
	}

	&.ui {
		background: #D1FAE5;
	}

	&.other {
		background: #E5E7EB;
	}
}

.type-icon {
	width: 32rpx;
	height: 32rpx;
}

.type-title {
	font-size: $font-size-sm;
	color: $on-background;
	font-weight: 600;
}

/* ==================== 列表头部 ==================== */
.list-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: $spacing-3;
}

.list-title {
	font-size: $font-size-base;
	font-weight: 700;
	color: $on-background;
}

.list-count {
	font-size: $font-size-sm;
	color: $on-surface-variant;
}

/* ==================== 反馈列表 ==================== */
.feedback-list {
	display: flex;
	flex-direction: column;
	gap: $spacing-3;
}

.feedback-card {
	background: $surface;
	border-radius: $radius-xl;
	padding: $spacing-4;
	border: 2rpx solid $outline;
	box-shadow: $shadow-sm;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;

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

/* ==================== 卡片头部 ==================== */
.card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: $spacing-3;
	gap: $spacing-2;
}

.type-badge {
	padding: $spacing-1 $spacing-2;
	border-radius: $radius-md;

	&.type-bug {
		background: #FEE2E2;
	}

	&.type-feature {
		background: #FEF3C7;
	}

	&.type-ui {
		background: #D1FAE5;
	}

	&.type-other {
		background: #E5E7EB;
	}

	.type-text {
		font-size: $font-size-xs;
		color: $on-background;
		font-weight: 600;
	}
}

.progress-indicator {
	flex: 1;
	display: flex;
	align-items: center;
	gap: $spacing-1;
}

.progress-dots {
	display: flex;
	align-items: center;
	gap: $spacing-1;
}

.progress-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: $outline-light;
	transition: all 0.3s ease;

	&.active {
		background: $primary;
	}

	&.completed {
		background: $progress-red;
	}
}

.progress-line {
	width: 16rpx;
	height: 4rpx;
	background: $outline-light;
	border-radius: 2rpx;
	transition: all 0.3s ease;

	&.active {
		background: $primary;
	}
}

.status-label {
	font-size: $font-size-xs;
	color: $on-surface-variant;
	font-weight: 500;
	margin-left: $spacing-1;
}

/* ==================== 卡片内容 ==================== */
.card-content {
	margin-bottom: $spacing-3;
}

.feedback-content {
	font-size: $font-size-base;
	color: $on-background;
	line-height: 1.6;
	display: block;
	margin-bottom: $spacing-2;
}

.reply-section {
	background: $primary-light;
	border-radius: $radius-lg;
	padding: $spacing-3;
	border-left: 4rpx solid $primary;
}

.reply-label {
	font-size: $font-size-sm;
	color: $primary-dark;
	font-weight: 600;
	display: block;
	margin-bottom: $spacing-1;
}

.reply-text {
	font-size: $font-size-sm;
	color: $on-background;
	line-height: 1.5;
}

/* ==================== 卡片底部 ==================== */
.card-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: $spacing-3;
	border-top: 1rpx solid $outline-light;
}

.user-info {
	display: flex;
	align-items: center;
	gap: $spacing-2;
}

.user-avatar {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: $surface-variant;
}

.user-name {
	font-size: $font-size-sm;
	color: $on-surface;
	font-weight: 500;
}

.feedback-time {
	font-size: $font-size-xs;
	color: $on-surface-variant;
}

/* ==================== 空状态 ==================== */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-6 0;
}

.empty-icon {
	width: 120rpx;
	height: 120rpx;
	margin-bottom: $spacing-3;
}

.empty-text {
	font-size: $font-size-lg;
	color: $on-background;
	font-weight: 600;
	margin-bottom: $spacing-2;
}

.empty-hint {
	font-size: $font-size-sm;
	color: $on-surface-variant;
}

/* ==================== 浮动按钮 ==================== */
.fab {
	position: fixed;
	bottom: 180rpx;
	right: $spacing-4;
	width: 112rpx;
	height: 112rpx;
	background: $primary;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: $shadow-lg;
	z-index: 99;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		transform: scale(0.95);
	}

	.fab-icon {
		width: 48rpx;
		height: 48rpx;
	}
}
</style>
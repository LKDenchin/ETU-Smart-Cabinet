<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">帖子详情</text>
				<view class="nav-actions">
					<view class="action-btn delete-btn" v-if="isAuthor || isAdmin" @click="deletePost">
						<text class="delete-text">删除</text>
					</view>
					<view class="action-btn" @click="toggleLike">
						<image class="action-icon" :src="isLiked ? '/static/icons/icon-like.png' : '/static/icons/icon-like-empty.png'" mode="aspectFit"></image>
					</view>
				</view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: (statusBarHeight + 88) + 'px' }">
			<!-- 反馈进度条（仅反馈类型显示） -->
			<view class="feedback-progress" v-if="post.category === 'feedback'">
				<view class="progress-bar">
					<view class="progress-line"></view>
					<view class="progress-fill" :style="{ width: getProgressWidth() + '%' }"></view>
				</view>
				<view class="progress-nodes">
					<view 
						class="progress-node" 
						:class="{ active: getProgressStep() >= 1, completed: getProgressStep() > 1 }"
					>
						<text class="node-number">1</text>
						<text class="node-text">已提出</text>
					</view>
					<view 
						class="progress-node" 
						:class="{ active: getProgressStep() >= 2, completed: getProgressStep() > 2 }"
					>
						<text class="node-number">2</text>
						<text class="node-text">已立项</text>
					</view>
					<view 
						class="progress-node" 
						:class="{ active: getProgressStep() >= 3, completed: getProgressStep() > 3 }"
					>
						<text class="node-number">3</text>
						<text class="node-text">已解决</text>
					</view>
				</view>
			</view>

			<!-- 管理员操作面板（仅管理员可见） -->
			<view class="admin-panel" v-if="isAdmin && post.category === 'feedback'">
				<text class="admin-panel-title">管理员操作</text>
				<view class="status-selector">
					<view 
						class="status-btn" 
						:class="{ active: post.status === 'pending' }"
						@click="changePostStatus('pending')"
					>
						<text class="status-text">已提出</text>
					</view>
					<view 
						class="status-btn" 
						:class="{ active: post.status === 'processing' }"
						@click="changePostStatus('processing')"
					>
						<text class="status-text">已立项</text>
					</view>
					<view 
						class="status-btn" 
						:class="{ active: post.status === 'solved' }"
						@click="changePostStatus('solved')"
					>
						<text class="status-text">已解决</text>
					</view>
				</view>
			</view>

			<!-- 帖子内容卡片 -->
			<view class="post-card">
				<!-- 用户信息 -->
				<view class="user-header">
					<image class="user-avatar" :src="displayAvatarUrl" mode="aspectFill"></image>
					<view class="user-info">
						<text class="user-name">{{ post.nickname || '用户' }}</text>
						<text class="post-time">{{ formatTime(post.createTime) }}</text>
					</view>
					<view class="post-right-tags">
						<view class="official-badge" v-if="post.isOfficial">官方</view>
						<view class="post-tag" v-if="post.category">{{ getCategoryName(post.category) }}</view>
					</view>
				</view>

				<!-- 帖子内容 -->
				<text class="post-content">{{ post.content }}</text>

				<!-- 活动主题（如果有） -->
				<view class="activity-theme" v-if="post.activityTheme">
					<text class="theme-label">活动主题：</text>
					<text class="theme-text">{{ post.activityTheme }}</text>
				</view>

				<!-- 统计信息 -->
				<view class="post-stats">
					<view class="stat-item" @click="toggleLike">
						<image class="stat-icon" :src="isLiked ? '/static/icons/icon-like.png' : '/static/icons/icon-like-empty.png'" mode="aspectFit"></image>
						<text class="stat-count">{{ post.likeCount || 0 }}</text>
					</view>
					<view class="stat-item">
						<image class="stat-icon" src="/static/icons/icon-comment.png" mode="aspectFit"></image>
						<text class="stat-count">{{ post.commentCount || 0 }}</text>
					</view>
					<view class="stat-item">
						<text class="stat-icon">👁️</text>
						<text class="stat-count">{{ post.viewCount || 0 }}</text>
					</view>
				</view>
			</view>

			<!-- 分隔线 -->
			<view class="divider"></view>

			<!-- 评论区 -->
			<view class="comments-section">
				<text class="section-title">评论 ({{ post.commentCount || 0 }})</text>
				<view class="comments-list" v-if="post.comments && post.comments.length > 0">
									<view class="comment-item" v-for="comment in post.comments" :key="comment.id" :class="{ 'official-reply': comment.isOfficialReply }">
										<image class="comment-avatar" :src="getCommentAvatarUrl(comment)" mode="aspectFill"></image>
										<view class="comment-content">
											<text class="comment-name">
												{{ comment.nickname || '用户' }}
												<text class="official-badge" v-if="comment.isOfficialReply">官方回复</text>
											</text>
											<text class="comment-text">{{ comment.content }}</text>
											<text class="comment-time">{{ formatTime(comment.createTime) }}</text>
										</view>
									</view>
								</view>
								<view class="empty-comments" v-else>
									<text class="empty-text">暂无评论，快来抢沙发吧~</text>
								</view>
							</view>		</view>

		<!-- 底部评论输入 -->
		<view class="comment-input-bar" :style="{ paddingBottom: (bottomSafeArea + 20) + 'px' }">
			<view class="input-wrapper">
				<input
					class="comment-input"
					v-model="commentText"
					type="text"
					placeholder="说点什么..."
					placeholder-class="input-placeholder"
					confirm-type="send"
					@confirm="sendComment"
				/>
			</view>
			<button class="send-btn" @click="sendComment" :disabled="!commentText.trim()">
				<text class="btn-text">发送</text>
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { postApi, getAvatarUrl } from '../../utils/request.js'

const statusBarHeight = ref(0)
const bottomSafeArea = ref(0)
const postId = ref(0)
const isLiked = ref(false)
const commentText = ref('')

// 计算实际显示的头像URL
const displayAvatarUrl = computed(() => {
  if (!post.value) return '/static/default-avatar.png'
  return getAvatarUrl(post.value.avatar)
})

// 获取评论头像的函数
const getCommentAvatarUrl = (comment) => {
  return getAvatarUrl(comment.avatar)
}

// 帖子数据
const post = ref({
	id: 0,
	content: '',
	images: [],
	image: '',
	category: '',
	activityTheme: '',
	nickname: '',
	avatar: '',
	likeCount: 0,
	commentCount: 0,
	viewCount: 0,
	createTime: '',
	comments: [],
	status: 'pending', // 反馈状态：pending(已提出), processing(已立项), solved(已解决)
	user_id: null // 帖子作者ID
})

// 检查当前用户是否是帖子作者
const isAuthor = computed(() => {
	const userInfo = uni.getStorageSync('userInfo')
	// 兼容两种字段命名：user_id 和 userId
	const postUserId = post.value.user_id || post.value.userId
	return userInfo && userInfo.id && postUserId && userInfo.id === postUserId
})

// 检查当前用户是否是管理员
const isAdmin = computed(() => {
	const userInfo = uni.getStorageSync('userInfo')
	return userInfo && userInfo.isAdmin
})

// 管理员修改帖子状态
const changePostStatus = async (newStatus) => {
	if (!isAdmin.value) return

	uni.showModal({
		title: '确认修改',
		content: `确认将反馈状态修改为：${getStatusText(newStatus)}？`,
		success: async (res) => {
			if (res.confirm) {
				try {
					uni.showLoading({
						title: '修改中...'
					})

					await postApi.updatePostStatus(postId.value, newStatus)
					post.value.status = newStatus

					// 发射全局事件，通知其他页面刷新数据
					uni.$emit('postStatusUpdated', {
						postId: postId.value,
						status: newStatus,
						category: post.value.category
					})

					uni.hideLoading()
					uni.showToast({
						title: '修改成功',
						icon: 'success'
					})
				} catch (error) {
					uni.hideLoading()
					console.error('修改状态失败:', error)
					uni.showToast({
						title: '修改失败',
						icon: 'none'
					})
				}
			}
		}
	})
}

// 获取反馈状态文本
const getStatusText = (status) => {
	const texts = {
		pending: '已提出',
		processing: '已立项',
		solved: '已解决'
	}
	return texts[status] || '已提出'
}

// 模拟帖子数据
const samplePosts = [
	{
		id: 1,
		content: '今天用智能柜取件体验超好，速度很快！',
		image: '',
		category: 'discussion',
		nickname: '小王',
		avatar: '/static/default-avatar.png',
		likeCount: 23,
		commentCount: 5,
		viewCount: 128,
		createTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		status: 'pending',
		comments: [
			{ id: 1, content: '确实很快，我也很喜欢', nickname: '小明', avatar: '/static/default-avatar.png', createTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
			{ id: 2, content: '界面也很友好', nickname: '小红', avatar: '/static/default-avatar.png', createTime: new Date(Date.now() - 30 * 60 * 1000).toISOString() }
		]
	},
	{
		id: 2,
		content: '建议增加夜间模式，晚上取件时界面太亮了',
		image: '',
		category: 'feedback',
		nickname: '匿名用户',
		avatar: '/static/default-avatar.png',
		likeCount: 45,
		commentCount: 12,
		viewCount: 256,
		createTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
		status: 'processing',
		comments: [
			{ id: 1, content: '官方回复：感谢建议，已立项开发', nickname: '官方', avatar: '/static/logo.png', createTime: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() }
		]
	},
	{
		id: 3,
		content: '本周末智能柜体验活动，欢迎大家参加！',
		image: '/static/icons/icon-1.png',
		category: 'activity',
		activityTheme: '智能柜体验周',
		nickname: '官方活动',
		avatar: '/static/logo.png',
		likeCount: 128,
		commentCount: 32,
		viewCount: 512,
		createTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		comments: []
	},
	{
		id: 4,
		content: '定制了一个很漂亮的绿色主题，超喜欢！',
		image: '/static/icons/icon-2.png',
		category: 'customize',
		nickname: '设计爱好者',
		avatar: '/static/default-avatar.png',
		likeCount: 67,
		commentCount: 8,
		viewCount: 189,
		createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
		comments: [
			{ id: 1, content: '主题确实不错', nickname: '用户A', avatar: '/static/default-avatar.png', createTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
		]
	},
	{
		id: 5,
		content: '智能柜的NFC功能太方便了，一键取件',
		image: '',
		category: 'discussion',
		nickname: '科技达人',
		avatar: '/static/default-avatar.png',
		likeCount: 89,
		commentCount: 15,
		viewCount: 234,
		createTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
		comments: []
	},
	{
		id: 6,
		content: '希望增加更多柜体颜色选择',
		image: '',
		category: 'feedback',
		nickname: '色彩控',
		avatar: '/static/default-avatar.png',
		likeCount: 34,
		commentCount: 7,
		viewCount: 145,
		createTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		status: 'solved',
		comments: [
			{ id: 1, content: '官方回复：已添加多种颜色选项', nickname: '官方', avatar: '/static/logo.png', createTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
		]
	},
	{
		id: 7,
		content: 'NFC功能推广活动正式上线，分享体验可获得积分奖励！',
		image: '/static/icons/icon-charging.png',
		category: 'activity',
		activityTheme: 'NFC功能推广',
		nickname: '运营团队',
		avatar: '/static/logo.png',
		likeCount: 89,
		commentCount: 21,
		viewCount: 378,
		createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		comments: []
	},
	{
		id: 8,
		content: '定制了商务黑色主题，看起来很专业',
		image: '/static/icons/icon-info.png',
		category: 'customize',
		nickname: '商务人士',
		avatar: '/static/default-avatar.png',
		likeCount: 56,
		commentCount: 4,
		viewCount: 112,
		createTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
		comments: []
	}
]

// 加载帖子详情
const loadPostDetail = async (id) => {
	try {
		// 从服务器获取帖子详情（这里需要添加单独获取帖子详情的接口）
		const posts = await postApi.getPosts()
		const foundPost = posts.find(p => p.id === parseInt(id))

		if (foundPost) {
			post.value = {
				...foundPost,
				images: foundPost.images || [],
				status: foundPost.status || 'pending'
			}
			console.log('从服务器加载帖子详情')
			console.log('帖子ID:', post.value.id)
			console.log('帖子昵称:', post.value.nickname)
			console.log('帖子头像:', post.value.avatar)
			// 加载评论和点赞状态
			await loadComments()
			await checkLikeStatus()
		} else {
			// 从本地存储获取帖子（用于显示刚发布的帖子）
			const localPosts = uni.getStorageSync('communityPosts') || []
			const localPost = localPosts.find(p => p.id === parseInt(id))
			if (localPost) {
				post.value = { ...localPost, comments: localPost.comments || [] }
			} else {
				post.value = {
					id: parseInt(id),
					content: '帖子不存在',
					images: [],
					nickname: '未知用户',
					avatar: '/static/default-avatar.png',
					likeCount: 0,
					commentCount: 0,
					createTime: new Date().toISOString(),
					comments: []
				}
			}
		}
	} catch (error) {
		console.error('加载帖子详情失败:', error)
		uni.showToast({
			title: '加载失败',
			icon: 'none'
		})
	}
}

// 加载评论列表
const loadComments = async () => {
	try {
		const comments = await postApi.getComments(postId.value)
		post.value.comments = comments || []
	} catch (error) {
		console.error('加载评论失败:', error)
	}
}

// 检查点赞状态
const checkLikeStatus = async () => {
	try {
		const result = await postApi.checkLiked(postId.value)
		isLiked.value = result.liked || false
	} catch (error) {
		console.error('检查点赞状态失败:', error)
	}
}

onLoad(async (options) => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44
	bottomSafeArea.value = systemInfo.safeAreaInsets?.bottom || 0

	if (options && options.data) {
		// 优先使用传递的完整帖子数据
		const postData = JSON.parse(decodeURIComponent(options.data))
		post.value = { 
			...postData, 
			comments: [], // 清空评论，重新从服务器加载
			status: postData.status || 'pending'
		}
		postId.value = postData.id
		console.log('=== 帖子详情加载数据 ===')
		console.log('帖子ID:', postData.id)
		console.log('帖子作者ID:', postData.userId)
		console.log('帖子头像(原始):', postData.avatar)
		console.log('当前用户ID:', uni.getStorageSync('userInfo')?.id)
		console.log('当前用户头像:', uni.getStorageSync('userInfo')?.avatar)
		console.log('计算后的头像URL:', getPostAvatarUrl(postData.avatar, postData.userId))
		// 加载评论和点赞状态
		await loadComments()
		await checkLikeStatus()
	} else if (options && options.id) {
		// 兼容旧版本，仅使用id加载
		postId.value = parseInt(options.id)
		await loadPostDetail(postId.value)
	}
})

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 切换点赞
const toggleLike = async () => {
	try {
		const result = await postApi.toggleLike(postId.value)
		if (result.liked !== undefined) {
			isLiked.value = result.liked
			post.value.likeCount += result.liked ? 1 : -1
		}
	} catch (error) {
		console.error('点赞失败:', error)
		uni.showToast({
			title: '操作失败',
			icon: 'none'
		})
	}
}

// 预览图片
const previewImage = (index) => {
	const images = post.value.images || (post.value.image ? [post.value.image] : [])
	if (images.length > 0) {
		uni.previewImage({
			urls: images,
			current: index
		})
	}
}

// 发送评论
const sendComment = async () => {
	if (!commentText.value.trim()) return

	uni.showLoading({
		title: '发送中...'
	})

	try {
		const newComment = await postApi.createComment(postId.value, commentText.value)
		if (!post.value.comments) {
			post.value.comments = []
		}
		post.value.comments.unshift(newComment)
		post.value.commentCount++

		uni.hideLoading()
		uni.showToast({
			title: '评论成功',
			icon: 'success'
		})

		commentText.value = ''
	} catch (error) {
		uni.hideLoading()
		console.error('评论失败:', error)
		uni.showToast({
			title: '评论失败',
			icon: 'none'
		})
	}
}

// 删除帖子
const deletePost = async () => {
	uni.showModal({
		title: '确认删除',
		content: '确定要删除这条帖子吗？',
		success: async (res) => {
			if (res.confirm) {
				try {
					uni.showLoading({
						title: '删除中...'
					})

					await postApi.deletePost(postId.value)

					uni.hideLoading()
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					})

					// 返回上一页
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} catch (error) {
					uni.hideLoading()
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

// 获取分区名称
const getCategoryName = (category) => {
	const names = {
		discussion: '讨论',
		feedback: '反馈',
		activity: '活动',
		customize: '定制'
	}
	return names[category] || ''
}

// 格式化时间
const formatTime = (time) => {
	const date = new Date(time)
	const now = new Date()
	const diff = now - date
	const hours = Math.floor(diff / (1000 * 60 * 60))
	const days = Math.floor(hours / 24)

	if (hours < 1) return '刚刚'
	if (hours < 24) return `${hours}小时前`
	if (days < 7) return `${days}天前`
	return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

// 获取反馈进度步骤（1=已提出, 2=已立项, 3=已解决）
const getProgressStep = () => {
	const statusMap = {
		pending: 1,
		processing: 2,
		solved: 3
	}
	return statusMap[post.value.status] || 1
}

// 获取进度条宽度百分比
const getProgressWidth = () => {
	const step = getProgressStep()
	return step * 33.33 // 3个节点，每个约33.33%
}

// 获取图片网格样式
const getImageGridClass = (count) => {
	if (count === 1) return 'single'
	if (count === 2 || count === 4) return 'grid-2'
	return 'grid-3'
}
</script>

<style lang="scss" scoped>
/* ==================== 现代UI设计 - 颜色变量 ==================== */
/* 主色系 - 现代柔和配色 */
$primary: #5E72E4;           /* 主色：科技蓝 */
$primary-light: #F5F7FF;     /* 浅蓝 */
$primary-dark: #4550C1;      /* 深蓝 */

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
$spacing-1: 4rpx;
$spacing-2: 8rpx;
$spacing-3: 12rpx;
$spacing-4: 16rpx;
$spacing-5: 20rpx;
$spacing-6: 24rpx;
$spacing-7: 28rpx;
$spacing-8: 32rpx;
$spacing-9: 36rpx;
$spacing-10: 40rpx;
$spacing-11: 44rpx;
$spacing-12: 48rpx;

/* ==================== 圆角变量 ==================== */
$radius-sm: 6rpx;
$radius-md: 8rpx;
$radius-lg: 12rpx;
$radius-xl: 16rpx;
$radius-2xl: 20rpx;
$radius-3xl: 24rpx;
$radius-full: 9999rpx;

/* ==================== 字体变量 ==================== */
$font-size-xs: 24rpx;
$font-size-sm: 26rpx;
$font-size-base: 28rpx;
$font-size-lg: 32rpx;
$font-size-xl: 36rpx;
$font-size-2xl: 40rpx;
$font-size-3xl: 44rpx;

/* ==================== 字重变量 ==================== */
$font-weight-light: 300;
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

/* ==================== 容器 ==================== */
.container {
	min-height: 100vh;
	background: $background;
	padding-bottom: 20rpx;
}

/* ==================== 导航栏 ==================== */
.navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background: $background;
	border-bottom: 1rpx solid $outline;
	box-shadow: $shadow-sm;
}

.nav-content {
	height: 96rpx;
	display: flex;
	align-items: center;
	padding: 0 $spacing-6;
}

.nav-back {
	width: 56rpx;
	height: 56rpx;
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
		font-size: 40rpx;
		color: $on-background;
		font-weight: 600;
	}
}

.nav-title {
	flex: 1;
	text-align: center;
	font-size: $font-size-xl;
	font-weight: $font-weight-semibold;
	color: $on-background;
}

.nav-actions {
	display: flex;
	align-items: center;
	gap: $spacing-3;
}

.action-btn {
	width: 56rpx;
	height: 56rpx;
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

	.action-icon {
		width: 28rpx;
		height: 28rpx;
	}

	&.delete-btn {
		width: auto;
		height: 56rpx;
		padding: 0 $spacing-4;
		background: #FEE2E2;

		.delete-text {
			font-size: $font-size-base;
			color: #DC2626;
			font-weight: 500;
		}

		&:active {
			background: #FECACA;
		}
	}
}

/* ==================== 主内容区 ==================== */
.content {
	padding: $spacing-6;
	padding-bottom: 150rpx;
	width: 100%;
	max-width: 100%;
	overflow-x: hidden;
	box-sizing: border-box;
}

/* ==================== 帖子卡片 ==================== */
.post-card {
	background: $background;
	border-radius: $radius-2xl;
	padding: $spacing-6;
	box-shadow: $shadow-sm;
	border: 1rpx solid $outline-light;
	transition: all 0.2s ease;
}

.post-card:active {
	box-shadow: $shadow-md;
}

/* ==================== 反馈进度条 ==================== */
.feedback-progress {
	background: $primary-light;
	border-radius: $radius-2xl;
	padding: $spacing-5;
	margin-bottom: $spacing-6;
	border: 1rpx solid rgba(94, 114, 228, 0.1);
}

.progress-bar {
	position: relative;
	height: 4rpx;
	background: $outline-light;
	border-radius: 2rpx;
	margin-bottom: $spacing-4;
	overflow: hidden;
}

.progress-line {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: $primary-light;
}

.progress-fill {
	position: relative;
	height: 100%;
	background: $primary;
	border-radius: 2rpx;
	transition: width 0.3s ease;
}

.progress-nodes {
	display: flex;
	justify-content: space-between;
	align-items: center;
	position: relative;
}

.progress-nodes::before {
	content: '';
	position: absolute;
	top: -12rpx;
	left: 12rpx;
	right: 12rpx;
	height: 1rpx;
	background: $outline-light;
}

.progress-node {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-2;
	position: relative;
	z-index: 1;
}

.node-number {
	width: 36rpx;
	height: 36rpx;
	border-radius: $radius-full;
	background: $outline-light;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: $font-size-xs;
	color: $on-surface-variant;
	font-weight: $font-weight-semibold;
	border: 2rpx solid $background;
	transition: all 0.3s ease;
}

.progress-node.active .node-number {
	background: $primary;
	color: #FFFFFF;
	border-color: $primary;
}

.progress-node.completed .node-number {
	background: $success;
	color: #FFFFFF;
	border-color: $success;
}

.node-text {
	font-size: $font-size-xs;
	color: $on-surface-variant;
	font-weight: $font-weight-medium;
	transition: color 0.3s ease;
}

.progress-node.active .node-text {
	color: $primary;
	font-weight: $font-weight-semibold;
}

.progress-node.completed .node-text {
	color: $success;
	font-weight: $font-weight-semibold;
}

/* ==================== 管理员操作面板 ==================== */
.admin-panel {
	background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
	border-radius: $radius-xl;
	padding: $spacing-4;
	margin-bottom: $spacing-6;
	border: 2rpx solid #FCA5A5;

	.admin-panel-title {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: #DC2626;
		display: block;
		margin-bottom: $spacing-3;
	}

	.status-selector {
		display: flex;
		gap: $spacing-2;
	}

	.status-btn {
		flex: 1;
		padding: $spacing-3;
		background: #FFFFFF;
		border-radius: $radius-md;
		border: 2rpx solid $outline;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;

		&:active {
			background: $surface;
			transform: scale(0.98);
		}

		&.active {
			background: #DC2626;
			border-color: #DC2626;

			.status-text {
				color: #FFFFFF;
			}
		}

		.status-text {
			font-size: $font-size-sm;
			color: $on-surface;
			font-weight: $font-weight-medium;
		}
	}
}

/* ==================== 用户信息 ==================== */
.user-header {
	display: flex;
	align-items: center;
	gap: $spacing-4;
	margin-bottom: $spacing-5;
}

.user-avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: $radius-full;
	background: $surface;
	border: 2rpx solid $outline-light;
}

.user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-2;
}

.user-name {
	font-size: $font-size-lg;
	color: $on-background;
	font-weight: $font-weight-semibold;
}

.post-time {
	font-size: $font-size-sm;
	color: $on-surface-variant;
	font-weight: $font-weight-medium;
}

.post-right-tags {
	display: flex;
	gap: $spacing-2;
	align-items: center;
}

.post-tag {
	padding: $spacing-3 $spacing-5;
	background: $primary-light;
	border-radius: $radius-full;
	font-size: $font-size-xs;
	color: $primary-dark;
	font-weight: $font-weight-semibold;
	border: 1rpx solid rgba(94, 114, 228, 0.2);
}

.official-badge {
	padding: $spacing-2 $spacing-4;
	background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
	border-radius: $radius-full;
	font-size: $font-size-xs;
	color: #FFFFFF;
	font-weight: $font-weight-bold;
	border: 1rpx solid rgba(255, 107, 107, 0.3);
}

/* ==================== 帖子内容 ==================== */
.post-content {
	display: block;
	font-size: $font-size-lg;
	color: $on-background;
	line-height: 1.6;
	margin-bottom: $spacing-5;
	word-break: break-word;
	word-wrap: break-word;
}

/* ==================== 图片网格（宫格缩略图） ==================== */
.images-grid {
	display: grid;
	gap: $spacing-3;
	margin-top: $spacing-5;
	width: 100%;
	box-sizing: border-box;
}

.image-item {
	position: relative;
	border-radius: $radius-xl;
	overflow: hidden;
	background: $surface;
	flex-shrink: 0;
	transition: all 0.2s ease;
}

.image-item:active {
	transform: scale(0.98);
}

/* 单张图片 - 自适应宽度，最大80% */
.image-item.single {
	max-width: 80%;
	margin: 0 auto;
}

/* 两张图片 - 并排 */
.image-item.grid-2 {
	aspect-ratio: 1;
}

/* 多张图片 - 宫格布局 */
.image-item.grid-3 {
	aspect-ratio: 1;
}

.post-image {
	width: 100%;
	height: 100%;
	display: block;
	object-fit: cover;
}

/* ==================== 响应式断点 ==================== */
@media screen and (max-width: 750rpx) {
	.images-grid {
		grid-template-columns: repeat(3, 1fr);
	}
	
	.image-item.single {
		grid-column: span 3;
		max-width: 70%;
	}
}

@media screen and (max-width: 600rpx) {
	.images-grid {
		grid-template-columns: repeat(2, 1fr);
		gap: $spacing-2;
	}
	
	.image-item.single {
		grid-column: span 2;
		max-width: 100%;
	}
	
	.image-item.grid-3 {
		grid-column: span 1;
	}
}

@media screen and (max-width: 400rpx) {
	.images-grid {
		grid-template-columns: 1fr;
	}
	
	.image-item.single {
		grid-column: span 1;
		max-width: 100%;
	}
}

.image-mask {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.4);
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	transition: opacity 0.2s ease;
}

.image-item:active .image-mask {
	opacity: 1;
}

.more-count {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: #FFFFFF;
}

.activity-theme {
	background: $primary-light;
	border-radius: $radius-xl;
	padding: $spacing-4;
	margin-bottom: $spacing-5;
	display: flex;
	align-items: center;
	gap: $spacing-3;
	border-left: 4rpx solid $primary;
}

.theme-label {
	font-size: $font-size-base;
	color: $primary-dark;
	font-weight: $font-weight-semibold;
}

.theme-text {
	font-size: $font-size-base;
	color: $on-background;
	flex: 1;
	font-weight: $font-weight-medium;
}

.post-stats {
	display: flex;
	gap: $spacing-5;
	padding: $spacing-5 0;
	border-top: 1rpx solid $outline-light;
}

.stat-item {
	display: flex;
	align-items: center;
	gap: $spacing-2;
	cursor: pointer;
	transition: all 0.2s ease;
	min-width: 80rpx;

	&:active {
		transform: scale(0.95);
	}
}

.stat-icon {
	width: 40rpx;
	height: 40rpx;
}

.stat-count {
	font-size: $font-size-base;
	color: $on-surface;
	font-weight: $font-weight-medium;
}

/* ==================== 分隔线 ==================== */
.divider {
	height: 1rpx;
	background: $outline-light;
	margin: $spacing-5 0;
}

/* ==================== 评论区 ==================== */
.comments-section {
	margin-top: $spacing-5;
}

.section-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $on-background;
	display: block;
	margin-bottom: $spacing-5;
}

.comments-list {
	display: flex;
	flex-direction: column;
	gap: $spacing-4;
}

.comment-item {
	display: flex;
	gap: $spacing-3;
	padding: $spacing-4;
	background: $surface;
	border-radius: $radius-xl;
	border: 1rpx solid $outline-light;
}

.comment-avatar {
	width: 56rpx;
	height: 56rpx;
	border-radius: $radius-full;
	background: $surface;
	border: 2rpx solid $outline-light;
	flex-shrink: 0;
}

.comment-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-2;
}

.comment-name {
	font-size: $font-size-base;
	color: $on-background;
	font-weight: $font-weight-semibold;
}

.comment-text {
	font-size: $font-size-base;
	color: $on-surface;
	line-height: 1.5;
	word-break: break-word;
	word-wrap: break-word;
}

.comment-time {
	font-size: $font-size-xs;
	color: $on-surface-variant;
	font-weight: $font-weight-medium;
}

.official-badge {
	font-size: $font-size-xs;
	color: #FFFFFF;
	background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
	padding: $spacing-1 $spacing-2;
	border-radius: $radius-sm;
	margin-left: $spacing-2;
	font-weight: $font-weight-semibold;
	border: 1rpx solid rgba(255, 255, 255, 0.3);
}

.comment-item.official-reply {
	background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
	border: 1rpx solid #FCD34D;
	padding: $spacing-4;
}

.empty-comments {
	text-align: center;
	padding: $spacing-8 0;
}

.empty-text {
	font-size: $font-size-base;
	color: $on-surface-variant;
	font-weight: $font-weight-medium;
}

/* ==================== 评论输入 ==================== */
.comment-input-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: $background;
	border-top: 1rpx solid $outline;
	padding: $spacing-4 $spacing-6;
	display: flex;
	align-items: center;
	gap: $spacing-3;
	z-index: 100;
	box-sizing: border-box;
}

.input-wrapper {
	flex: 1;
	background: $surface;
	border-radius: $radius-xl;
	padding: 0 $spacing-4;
	border: 2rpx solid $outline-light;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	&:focus-within {
		border-color: $primary;
		background: #FFFFFF;
		box-shadow: 0 0 0 3rpx rgba(94, 114, 228, 0.1);
	}
}

.comment-input {
	width: 100%;
	height: 72rpx;
	font-size: $font-size-base;
	color: $on-background;
	line-height: 1.5;
}

.input-placeholder {
	color: $on-surface-variant;
}

.send-btn {
	height: 72rpx;
	padding: 0 $spacing-6;
	background: $primary;
	border-radius: $radius-xl;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: $shadow-sm;

	&:active:not([disabled]) {
		background: $primary-dark;
		transform: scale(0.95);
		box-shadow: $shadow-xs;
	}

	&[disabled] {
		background: $outline-light;
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-text {
		font-size: $font-size-lg;
		color: #FFFFFF;
		font-weight: $font-weight-semibold;
	}
}
</style>
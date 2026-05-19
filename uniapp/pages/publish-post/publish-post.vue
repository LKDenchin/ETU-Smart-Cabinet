<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">发帖</text>
				<button class="publish-btn" @click="publish" :disabled="!canPublish">
					<text class="btn-text">发送</text>
				</button>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 内容输入 -->
			<view class="input-section">
				<textarea
					class="content-input"
					v-model="formData.content"
					placeholder="分享你的想法..."
					placeholder-class="input-placeholder"
					maxlength="500"
				></textarea>
				<text class="char-count">{{ formData.content.length }}/500</text>
			</view>

			<!-- 选择分区 -->
			<view class="section">
				<text class="section-title">发布分区</text>
				<view class="category-selector">
					<view
						class="category-item"
						:class="{ active: formData.category === 'discussion' }"
						@click="selectCategory('discussion')"
					>
						<text class="category-icon">💬</text>
						<text class="category-text">讨论</text>
					</view>
					<view
						class="category-item"
						:class="{ active: formData.category === 'feedback' }"
						@click="selectCategory('feedback')"
					>
						<text class="category-icon">📝</text>
						<text class="category-text">反馈</text>
					</view>
					<view
						class="category-item"
						:class="{ active: formData.category === 'activity', disabled: !isAdmin }"
						@click="selectCategory('activity')"
					>
						<text class="category-icon">🎉</text>
						<text class="category-text">活动</text>
						<text class="admin-badge" v-if="isAdmin">管理员</text>
					</view>
					<view
						class="category-item disabled"
					>
						<text class="category-icon">🎨</text>
						<text class="category-text">定制</text>
						<text class="disabled-badge">查看</text>
					</view>
				</view>
			</view>

			<!-- 活动主题（可选） -->
			<view class="section" v-if="formData.category === 'activity'">
				<text class="section-title">活动主题（可选）</text>
				<view class="input-wrapper">
					<input
						class="activity-input"
						v-model="formData.activityTheme"
						type="text"
						placeholder="输入活动主题"
						placeholder-class="input-placeholder"
						maxlength="50"
					/>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { postApi } from '../../utils/request.js'

const statusBarHeight = ref(0)

// 表单数据
const formData = ref({
	content: '',
	images: [],
	category: 'discussion',
	activityTheme: ''
})

// 检查是否是管理员
const isAdmin = computed(() => {
	const userInfo = uni.getStorageSync('userInfo')
	return userInfo && userInfo.isAdmin
})

// 是否可以发布
const canPublish = computed(() => {
	return formData.value.content.trim().length > 0 && formData.value.category
})

onLoad((options) => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44

	// 检查登录状态
	const userInfo = uni.getStorageSync('userInfo')
	const token = uni.getStorageSync('token')
	
	if (!userInfo || !token) {
		uni.showToast({
			title: '请先登录',
			icon: 'none'
		})
		setTimeout(() => {
			uni.reLaunch({
				url: '/pages/login/login'
			})
		}, 1000)
		return
	}

	// 检查是否允许发帖（活动和定制分区仅管理员可发帖）
	if (options && options.category) {
		// 定制分区不支持发帖（仅用于展示）
		if (options.category === 'customize') {
			uni.showToast({
				title: '该分区不支持发帖',
				icon: 'none'
			})
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
			return
		}

		// 活动分区仅管理员可发帖
		if (options.category === 'activity' && !isAdmin.value) {
			uni.showToast({
				title: '仅管理员可发布活动',
				icon: 'none'
			})
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
			return
		}

		formData.value.category = options.category
	}
})

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 选择图片
const chooseImage = () => {
	uni.chooseImage({
		count: 9 - formData.value.images.length,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: (res) => {
			formData.value.images = [...formData.value.images, ...res.tempFilePaths]
		}
	})
}

// 删除图片
const removeImage = (index) => {
	formData.value.images.splice(index, 1)
}

// 选择分区
const selectCategory = (category) => {
	// 活动分区仅管理员可选择
	if (category === 'activity' && !isAdmin.value) {
		uni.showToast({
			title: '仅管理员可发布活动',
			icon: 'none'
		})
		return
	}

	formData.value.category = category
	if (category !== 'activity') {
		formData.value.activityTheme = ''
	}
}

// 发布
const publish = async () => {
	if (!canPublish.value) return

	console.log('=== 开始发布帖子 ===')
	console.log('formData:', formData.value)

	// 检查登录状态
	const userInfo = uni.getStorageSync('userInfo')
	const token = uni.getStorageSync('token')
	
	console.log('当前用户信息:', userInfo)
	console.log('当前token:', token ? '存在' : '不存在')

	if (!userInfo || !token) {
		uni.showToast({
			title: '请先登录',
			icon: 'none'
		})
		return
	}

	uni.showLoading({
		title: '发布中...'
	})

	try {
		// 调用服务器接口创建帖子
		const newPost = await postApi.createPost({
			content: formData.value.content,
			images: formData.value.images,
			category: formData.value.category,
			title: formData.value.activityTheme || ''
		})

		console.log('发布成功，返回数据:', newPost)

		uni.hideLoading()

		// 发送新帖子事件
		uni.$emit('newPostPublished', newPost)

		// 标记刚发帖
		uni.setStorageSync('justPublishedPost', newPost)

		// 显示成功提示
		uni.showToast({
			title: '发布成功',
			icon: 'success'
		})

		// 返回社区页面
		setTimeout(() => {
			uni.navigateBack()
		}, 1500)
	} catch (error) {
		uni.hideLoading()
		console.error('发布失败:', error)
		uni.showToast({
			title: '发布失败，请重试',
			icon: 'none'
		})
	}
}
</script>

<style lang="scss" scoped>
/* ==================== 颜色变量 ==================== */
$primary: #A5D63F;
$primary-light: #E8F5E9;
$primary-dark: #8BC34A;

$background: #FFFFFF;
$surface: #F5F7FA;
$surface-variant: #F0F2F5;

$on-background: #2C3E50;
$on-surface: #5A6A7A;
$on-surface-variant: #9CA3AF;

$outline: #E5E7EB;
$outline-light: #F3F4F6;

$shadow-sm: 0 4rpx 8rpx rgba(0, 0, 0, 0.06);
$shadow-md: 0 8rpx 16rpx rgba(0, 0, 0, 0.08);

/* ==================== 间距变量 ==================== */
$spacing-1: 8rpx;
$spacing-2: 16rpx;
$spacing-3: 24rpx;
$spacing-4: 32rpx;
$spacing-5: 40rpx;

/* ==================== 圆角变量 ==================== */
$radius-md: 12rpx;
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
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(20rpx);
	-webkit-backdrop-filter: blur(20rpx);
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
	box-shadow: 0 4rpx 30rpx rgba(0, 0, 0, 0.08);
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
		background: $surface-variant;
		transform: translateY(2rpx);
	}

	.back-icon {
		font-size: 48rpx;
		color: $on-surface;
	}
}

.nav-title {
	flex: 1;
	text-align: center;
	font-size: $font-size-lg;
	font-weight: 600;
	color: $on-background;
}

.publish-btn {
	height: 64rpx;
	padding: 0 $spacing-4;
	background: $primary;
	border-radius: 50rpx;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;

	&:active:not([disabled]) {
		background: $primary-dark;
		transform: scale(0.95);
	}

	&[disabled] {
		background: $surface-variant;
		opacity: 0.5;
	}

	.btn-text {
		font-size: $font-size-base;
		font-weight: 600;
		color: #FFFFFF;
	}
}

/* ==================== 主内容区 ==================== */
.content {
	padding: $spacing-3;
}

/* ==================== 内容输入 ==================== */
.input-section {
	position: relative;
	margin-bottom: $spacing-4;
}

.content-input {
	width: 100%;
	min-height: 300rpx;
	padding: $spacing-3;
	background: $surface;
	border-radius: $radius-xl;
	border: 2rpx solid $outline;
	font-size: $font-size-base;
	color: $on-background;
	line-height: 1.6;
	transition: all 0.2s ease;

	&:focus {
		border-color: $primary;
		background: $background;
	}
}

.input-placeholder {
	color: $on-surface-variant;
}

.char-count {
	position: absolute;
	bottom: $spacing-2;
	right: $spacing-3;
	font-size: $font-size-sm;
	color: $on-surface-variant;
}

/* ==================== 通用区块 ==================== */
.section {
	margin-bottom: $spacing-4;
}

.section-title {
	font-size: $font-size-base;
	font-weight: 600;
	color: $on-background;
	display: block;
	margin-bottom: $spacing-2;
}

/* ==================== 图片上传 ==================== */
.image-uploader {
	display: flex;
	flex-wrap: wrap;
	gap: $spacing-2;
}

.image-item {
	position: relative;
	width: 200rpx;
	height: 200rpx;
	border-radius: $radius-lg;
	overflow: hidden;
}

.uploaded-image {
	width: 100%;
	height: 100%;
}

.delete-btn {
	position: absolute;
	top: $spacing-1;
	right: $spacing-1;
	width: 48rpx;
	height: 48rpx;
	background: rgba(0, 0, 0, 0.6);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	backdrop-filter: blur(10rpx);
	-webkit-backdrop-filter: blur(10rpx);
}

.delete-icon {
	font-size: 36rpx;
	color: #FFFFFF;
	line-height: 1;
}

.add-image-btn {
	width: 200rpx;
	height: 200rpx;
	background: $surface;
	border: 2rpx dashed $outline;
	border-radius: $radius-lg;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: $spacing-1;
	transition: all 0.2s ease;

	&:active {
		background: $surface-variant;
		border-color: $primary;
	}

	.add-icon {
		font-size: 48rpx;
		color: $primary;
		line-height: 1;
	}

	.add-text {
		font-size: $font-size-sm;
		color: $on-surface-variant;
	}
}

/* ==================== 分区选择 ==================== */
.category-selector {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: $spacing-2;
}

.category-item {
	background: $surface;
	border: 2rpx solid $outline;
	border-radius: $radius-lg;
	padding: $spacing-3 $spacing-2;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-1;
	transition: all 0.2s ease;
	position: relative;

	&:active:not(.disabled) {
		transform: scale(0.95);
	}

	&.active {
		background: $primary-light;
		border-color: $primary;
	}

	&.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.category-icon {
		font-size: 40rpx;
		line-height: 1;
	}

	.category-text {
		font-size: $font-size-sm;
		color: $on-surface;
		font-weight: 500;

		.category-item.active & {
			color: $primary-dark;
			font-weight: 600;
		}
	}

	.disabled-badge {
		position: absolute;
		top: $spacing-1;
		right: $spacing-1;
		background: rgba(0, 0, 0, 0.6);
		color: #FFFFFF;
		font-size: 18rpx;
		padding: 2rpx 6rpx;
		border-radius: 4rpx;
		font-weight: 600;
	}

	// 禁用状态
	&.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	// 管理员徽章
	.admin-badge {
		position: absolute;
		top: $spacing-1;
		right: $spacing-1;
		background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
		color: #FFFFFF;
		font-size: 18rpx;
		padding: 2rpx 6rpx;
		border-radius: 4rpx;
		font-weight: 600;
	}
}

/* ==================== 活动主题输入 ==================== */
.input-wrapper {
	background: $surface;
	border-radius: $radius-lg;
	border: 2rpx solid $outline;
	transition: all 0.2s ease;

	&:focus-within {
		border-color: $primary;
		background: $background;
	}
}

.activity-input {
	width: 100%;
	height: 88rpx;
	padding: 0 $spacing-3;
	font-size: $font-size-base;
	color: $on-background;
}
</style>
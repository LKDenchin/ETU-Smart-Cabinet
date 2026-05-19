<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">定制详情</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 加载状态 -->
			<view class="loading-state" v-if="isLoading">
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 空状态 -->
			<view class="empty-state" v-else-if="!order.id">
				<text class="empty-text">订单不存在</text>
			</view>

			<!-- 订单详情 -->
			<template v-else>
			<!-- 状态卡片 -->
			<view class="status-card">
				<view class="status-header">
					<text class="status-title">定制状态</text>
					<view class="status-badge" :class="'status-' + order.status">
						<text class="status-text">{{ getStatusText(order.status) }}</text>
					</view>
				</view>

				<!-- 进度条 -->
				<view class="progress-section">
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: getProgressWidth() + '%' }"></view>
					</view>
					<view class="progress-steps">
						<view
							class="step-item"
							:class="{ active: getProgressStep() >= 1, completed: getProgressStep() > 1 }"
						>
							<view class="step-circle">
								<text class="step-number">1</text>
							</view>
							<text class="step-label">处理中</text>
						</view>
						<view
							class="step-item"
							:class="{ active: getProgressStep() >= 2, completed: getProgressStep() > 2 }"
						>
							<view class="step-circle">
								<text class="step-number">2</text>
							</view>
							<text class="step-label">安装中</text>
						</view>
						<view
							class="step-item"
							:class="{ active: getProgressStep() >= 3, completed: getProgressStep() > 3 }"
						>
							<view class="step-circle">
								<text class="step-number">3</text>
							</view>
							<text class="step-label">已完成</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 定制类型 -->
			<view class="info-card">
				<text class="card-title">定制类型</text>
				<text class="card-value">{{ order.type }}</text>
			</view>

			<!-- 柜体信息 -->
			<view class="info-card">
				<text class="card-title">柜体信息</text>
				<view class="info-content">
					<view class="info-item" v-if="order.extraLargeCount > 0">
						<text class="info-label">超大格</text>
						<text class="info-value">{{ order.extraLargeCount }}个</text>
					</view>
					<view class="info-item" v-if="order.largeCount > 0">
						<text class="info-label">大格</text>
						<text class="info-value">{{ order.largeCount }}个</text>
					</view>
					<view class="info-item" v-if="order.mediumCount > 0">
						<text class="info-label">中格</text>
						<text class="info-value">{{ order.mediumCount }}个</text>
					</view>
					<view class="info-item" v-if="order.smallCount > 0">
						<text class="info-label">小格</text>
						<text class="info-value">{{ order.smallCount }}个</text>
					</view>
					<view class="info-item">
						<text class="info-label">布局</text>
						<text class="info-value">{{ order.rows }}行 × {{ order.columns }}列</text>
					</view>
					<view class="info-item">
						<text class="info-label">总数</text>
						<text class="info-value">{{ order.totalCount }}个</text>
					</view>
				</view>
			</view>

			<!-- 主题信息 -->
			<view class="info-card" v-if="order.theme || order.color || order.led">
				<text class="card-title">定制主题</text>
				<view class="info-content">
					<view class="info-item" v-if="order.theme">
						<text class="info-label">主题</text>
						<text class="info-value">{{ order.theme }}</text>
					</view>
					<view class="info-item" v-if="order.color">
						<text class="info-label">颜色</text>
						<text class="info-value">{{ order.color }}</text>
					</view>
					<view class="info-item" v-if="order.led">
						<text class="info-label">LED</text>
						<text class="info-value">{{ order.led }}</text>
					</view>
				</view>
			</view>

			<!-- 附加组件 -->
			<view class="info-card" v-if="order.components && order.components.length > 0">
				<text class="card-title">附加组件</text>
				<view class="components-list">
					<view class="component-tag" v-for="component in order.components" :key="component">
						<text class="component-text">{{ getComponentText(component) }}</text>
					</view>
				</view>
			</view>

			<!-- 收货地址 -->
			<view class="info-card">
				<text class="card-title">收货地址</text>
				<text class="card-value multiline">{{ order.address }}</text>
			</view>

			<!-- 预计安装时间 -->
			<view class="info-card highlight">
				<text class="card-title">📅 预计安装时间</text>
				<text class="card-value date-value">{{ formatInstallDate(order.installDate) }}</text>
			</view>

			<!-- 订单信息 -->
			<view class="info-card">
				<text class="card-title">订单信息</text>
				<view class="info-content">
					<view class="info-item">
						<text class="info-label">订单编号</text>
						<text class="info-value">{{ order.id }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">下单时间</text>
						<text class="info-value">{{ formatTime(order.createTime) }}</text>
					</view>
				</view>
			</view>
			</template>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { cabinetApi } from '../../utils/request.js'

const statusBarHeight = ref(0)
const orderId = ref(0)
const order = ref({})
const isLoading = ref(false)

onLoad((options) => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44

	if (options && options.id) {
		orderId.value = parseInt(options.id)
		loadOrderDetail()
	}
})

// 加载订单详情
const loadOrderDetail = async () => {
	if (isLoading.value) return
	isLoading.value = true

	try {
		uni.showLoading({
			title: '加载中...'
		})

		const foundOrder = await cabinetApi.getCabinetOrderDetail(orderId.value)

		if (foundOrder) {
			order.value = foundOrder
			console.log('订单详情:', foundOrder)
		} else {
			uni.showToast({
				title: '订单不存在',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('加载订单详情失败:', error)
		uni.showToast({
			title: '加载失败',
			icon: 'none'
		})
	} finally {
		uni.hideLoading()
		isLoading.value = false
	}
}

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 获取状态文本
const getStatusText = (status) => {
	const texts = {
		processing: '处理中',
		installing: '安装中',
		completed: '已完成'
	}
	return texts[status] || '未知'
}

// 获取进度步骤
const getProgressStep = () => {
	const stepMap = {
		processing: 1,
		installing: 2,
		completed: 3
	}
	return stepMap[order.value.status] || 1
}

// 获取进度宽度
const getProgressWidth = () => {
	const step = getProgressStep()
	return (step / 3) * 100
}

// 获取组件文本
const getComponentText = (component) => {
	const componentMap = {
		camera: '摄像头',
		led: 'LED屏幕',
		qr: '扫码模块',
		nfc: 'NFC模块'
	}
	return componentMap[component] || component
}

// 格式化安装日期
const formatInstallDate = (date) => {
	if (!date) return '待定'
	const d = new Date(date)
	const year = d.getFullYear()
	const month = (d.getMonth() + 1).toString().padStart(2, '0')
	const day = d.getDate().toString().padStart(2, '0')
	return `${year}年${month}月${day}日`
}

// 格式化时间
const formatTime = (time) => {
	const date = new Date(time)
	const year = date.getFullYear()
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const day = date.getDate().toString().padStart(2, '0')
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')
	return `${year}-${month}-${day} ${hours}:${minutes}`
}
</script>

<style lang="scss" scoped>
/* ==================== 颜色变量 ==================== */
$primary: #A5D63F;
$primary-light: #E8F5E9;
$primary-dark: #8BC34A;

$background: #FFFFFF;
$surface: #F5F7FA;

$on-background: #2C3E50;
$on-surface: #5A6A7A;
$on-surface-variant: #9CA3AF;

$outline: #E5E7EB;
$outline-light: #F3F4F6;

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
}

/* ==================== 容器 ==================== */
.container {
	min-height: 100vh;
	background: $background;
}

/* ==================== 加载状态 ==================== */
.loading-state {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 200rpx 0;

	.loading-text {
		font-size: $font-size-base;
		color: $on-surface-variant;
	}
}

/* ==================== 空状态 ==================== */
.empty-state {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 200rpx 0;

	.empty-text {
		font-size: $font-size-base;
		color: $on-surface-variant;
	}
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
	padding-bottom: 100rpx;
	width: 100%;
	max-width: 100%;
	overflow-x: hidden;
	box-sizing: border-box;
}

/* ==================== 状态卡片 ==================== */
.status-card {
	background: linear-gradient(135deg, $primary-light 0%, rgba(165, 214, 63, 0.3) 100%);
	border-radius: $radius-xl;
	padding: $spacing-4;
	margin-bottom: $spacing-3;
}

.status-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: $spacing-3;
}

.status-title {
	font-size: $font-size-lg;
	font-weight: 600;
	color: $on-background;
}

.status-badge {
	padding: $spacing-1 $spacing-2;
	border-radius: $radius-lg;

	&.status-processing {
		background: #FFF3E0;
	}

	&.status-installing {
		background: #E3F2FD;
	}

	&.status-completed {
		background: #E8F5E9;
	}

	.status-text {
		font-size: $font-size-sm;
		font-weight: 600;
		color: $on-background;
	}
}

/* ==================== 进度条 ==================== */
.progress-section {
	margin-top: $spacing-3;
}

.progress-bar {
	height: 8rpx;
	background: rgba(255, 255, 255, 0.5);
	border-radius: 4rpx;
	overflow: hidden;
	margin-bottom: $spacing-3;
}

.progress-fill {
	height: 100%;
	background: linear-gradient(90deg, $primary 0%, $primary-dark 100%);
	transition: width 0.3s ease;
}

.progress-steps {
	display: flex;
	justify-content: space-between;
}

.step-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-1;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 24rpx;
		left: 50%;
		width: 100%;
		height: 2rpx;
		background: rgba(255, 255, 255, 0.3);
	}

	&:last-child::before {
		display: none;
	}
}

.step-circle {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1;
	border: 4rpx solid $primary-light;
	transition: all 0.3s ease;

	.step-number {
		font-size: $font-size-sm;
		font-weight: 600;
		color: $on-surface;
	}
}

.step-item.active .step-circle {
	background: $primary;
	border-color: $primary;

	.step-number {
		color: #FFFFFF;
	}
}

.step-item.completed .step-circle {
	background: $primary-dark;
	border-color: $primary-dark;

	.step-number {
		color: #FFFFFF;
	}
}

.step-label {
	font-size: $font-size-sm;
	color: $on-surface;
	font-weight: 500;
}

.step-item.active .step-label {
	color: $primary-dark;
	font-weight: 600;
}

.step-item.completed .step-label {
	color: $primary-dark;
	font-weight: 600;
}

/* ==================== 信息卡片 ==================== */
.info-card {
	background: $surface;
	border-radius: $radius-xl;
	padding: $spacing-3;
	margin-bottom: $spacing-3;
	border: 2rpx solid $outline;

	&.highlight {
		background: linear-gradient(135deg, rgba(165, 214, 63, 0.1) 0%, rgba(139, 195, 74, 0.05) 100%);
		border-color: $primary;
	}
}

.card-title {
	font-size: $font-size-base;
	font-weight: 600;
	color: $on-background;
	display: block;
	margin-bottom: $spacing-2;
}

.card-value {
	font-size: $font-size-base;
	color: $on-surface;
	line-height: 1.6;

	&.multiline {
		white-space: pre-wrap;
	}

	&.date-value {
		font-size: $font-size-lg;
		font-weight: 600;
		color: $primary-dark;
	}
}

.info-content {
	display: flex;
	flex-direction: column;
	gap: $spacing-2;
}

.info-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.info-label {
	font-size: $font-size-sm;
	color: $on-surface;
}

.info-value {
	font-size: $font-size-base;
	color: $on-background;
	font-weight: 500;
	flex: 1;
	text-align: right;
}

.uploaded-preview {
	width: 120rpx;
	height: 120rpx;
	border-radius: $radius-lg;
}

/* ==================== 组件列表 ==================== */
.components-list {
	display: flex;
	flex-wrap: wrap;
	gap: $spacing-2;
}

.component-tag {
	padding: $spacing-1 $spacing-2;
	background: $primary-light;
	border-radius: $radius-lg;
	border: 1rpx solid $primary;
}

.component-text {
	font-size: $font-size-sm;
	color: $primary-dark;
	font-weight: 600;
}
</style>
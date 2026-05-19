<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">我的定制</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 空状态 -->
			<view class="empty-state" v-if="customizationOrders.length === 0">
				<image class="empty-icon" src="/static/icons/icon-empty-customization.png" mode="aspectFit"></image>
				<text class="empty-text">暂无定制订单</text>
				<text class="empty-hint">点击下方按钮开始定制</text>
				<button class="start-btn" @click="goToCustomize">开始定制</button>
			</view>

			<!-- 订单列表 -->
			<view class="orders-list" v-else>
				<view
					class="order-card"
					v-for="order in customizationOrders"
					:key="order.id"
					@click="viewOrderDetail(order)"
				>
					<!-- 订单头部 -->
					<view class="order-header">
						<text class="order-type">{{ order.type }}</text>
						<view class="order-status" :class="'status-' + order.status">
							<text class="status-text">{{ getStatusText(order.status) }}</text>
						</view>
					</view>

					<!-- 订单内容 -->
					<view class="order-content">
						<!-- 尺寸信息 -->
						<view class="info-row">
							<text class="info-label">尺寸</text>
							<text class="info-value">{{ getSizeText(order.size) }}</text>
						</view>
						<!-- 数量信息 -->
						<view class="info-row">
							<text class="info-label">数量</text>
							<text class="info-value">{{ order.rows }}行 × {{ order.columns }}列</text>
						</view>
						<!-- 主题信息 -->
						<view class="info-row">
							<text class="info-label">主题</text>
							<text class="info-value">{{ order.themeSource === 'community' ? '社区选择' : '自己上传' }}</text>
						</view>
						<!-- 组件信息 -->
						<view class="info-row" v-if="order.components && order.components.length > 0">
							<text class="info-label">组件</text>
							<text class="info-value">{{ getComponentsText(order.components) }}</text>
						</view>
						<!-- 预计安装时间 -->
						<view class="info-row">
							<text class="info-label">预计安装</text>
							<text class="info-value">{{ formatInstallDate(order.installDate) }}</text>
						</view>
					</view>

					<!-- 订单底部 -->
					<view class="order-footer">
						<text class="order-time">{{ formatTime(order.createTime) }}</text>
						<text class="view-detail">查看详情 ›</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部定制按钮 -->
		<view class="bottom-action" v-if="customizationOrders.length > 0">
			<button class="add-btn" @click="goToCustomize">
				<image class="add-icon" src="/static/icons/icon-add.png" mode="aspectFit"></image>
				<text class="add-text">新增定制</text>
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { cabinetApi } from '../../utils/request.js'

const statusBarHeight = ref(0)
const customizationOrders = ref([])

onLoad(() => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44
})

onShow(() => {
	loadOrders()
})

// 加载订单
const loadOrders = async () => {
	try {
		const orders = await cabinetApi.getCabinetOrders()
		customizationOrders.value = orders || []
	} catch (error) {
		console.error('加载订单失败:', error)
		// 加载失败时，使用本地缓存
		const localOrders = uni.getStorageSync('cabinetOrders') || []
		customizationOrders.value = localOrders
	}
}

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 去定制
const goToCustomize = () => {
	uni.navigateTo({
		url: '/pages/cabinet-customize-new/cabinet-customize-new'
	})
}

// 查看订单详情
const viewOrderDetail = (order) => {
	uni.navigateTo({
		url: `/pages/customization-detail/customization-detail?id=${order.id}`
	})
}

// 获取状态文本
const getStatusText = (status) => {
	const texts = {
		processing: '处理中',
		production: '生产中',
		delivery: '配送中',
		installed: '已安装',
		completed: '已完成'
	}
	return texts[status] || '未知'
}

// 获取尺寸文本
const getSizeText = (size) => {
	const texts = {
		extraLarge: '超大（12个）',
		large: '大（8个）',
		medium: '中（6个）',
		small: '小（4个）'
	}
	return texts[size] || size
}

// 获取组件文本
const getComponentsText = (components) => {
	const texts = {
		camera: '摄像头',
		led: 'LED',
		qr: '扫码',
		nfc: 'NFC'
	}
	return components.map(c => texts[c] || c).join('、')
}

// 格式化安装日期
const formatInstallDate = (dateStr) => {
	if (!dateStr) return '待定'
	const date = new Date(dateStr)
	const month = date.getMonth() + 1
	const day = date.getDate()
	return `${month}月${day}日`
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
$outline-light: #F9FAFB;     /* 浅边框 */

$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* ==================== 间距变量 ==================== */
$spacing-1: 8rpx;
$spacing-2: 16rpx;
$spacing-3: 24rpx;
$spacing-4: 32rpx;
$spacing-5: 40rpx;

/* ==================== 圆角变量 ==================== */
$radius-sm: 8rpx;
$radius-md: 12rpx;
$radius-lg: 16rpx;
$radius-xl: 20rpx;

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
	background: $surface;
	border-bottom: 1rpx solid $outline;
}

.nav-content {
	height: 88rpx;
	display: flex;
	align-items: center;
	padding: 0 $spacing-4;
}

.nav-back {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: $radius-lg;
	background: $surface-variant;
	transition: all 0.2s ease;

	&:active {
		background: $outline;
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
	font-size: $font-size-lg;
	font-weight: 600;
	color: $on-background;
}

.nav-placeholder {
	width: 64rpx;
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

/* ==================== 空状态 ==================== */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $spacing-5 0;
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
	margin-bottom: $spacing-4;
}

	.start-btn {
		width: 240rpx;
		height: 80rpx;
		background: $primary-btn;
		border-radius: $radius-xl;
		border: none;
		color: #FFFFFF;
		font-size: $font-size-base;
		font-weight: 600;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4rpx 12rpx rgba(165, 214, 63, 0.3);

		&:active {
			background: $primary-dark;
			transform: scale(0.95);
			box-shadow: 0 2rpx 6rpx rgba(165, 214, 63, 0.2);
		}
	}
/* ==================== 订单列表 ==================== */
.orders-list {
	display: flex;
	flex-direction: column;
	gap: $spacing-3;
}

.order-card {
	background: $surface;
	border-radius: $radius-xl;
	padding: $spacing-4;
	box-shadow: $shadow-sm;
	transition: all 0.2s ease;

	&:active {
		transform: scale(0.98);
		box-shadow: $shadow-md;
	}
}

/* ==================== 订单头部 ==================== */
.order-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: $spacing-3;
	padding-bottom: $spacing-3;
	border-bottom: 1rpx solid $outline-light;
}

.order-type {
	font-size: $font-size-base;
	color: $on-background;
	font-weight: 600;
}

.order-status {
	padding: $spacing-1 $spacing-3;
	border-radius: $radius-lg;
	font-size: $font-size-xs;
	font-weight: 600;

	&.status-processing {
		background: #E3F2FD;
		color: #1976D2;
	}

	&.status-production {
		background: #FFF3E0;
		color: #F57C00;
	}

	&.status-delivery {
		background: #E8F5E9;
		color: $primary-dark;
	}

	&.status-installed {
		background: #F3E5F5;
		color: #7B1FA2;
	}

	&.status-completed {
		background: #E8F5E9;
		color: #2E7D32;
	}
}

/* ==================== 订单内容 ==================== */
.order-content {
	margin-bottom: $spacing-3;
}

.info-row {
	display: flex;
	align-items: center;
	margin-bottom: $spacing-2;

	&:last-child {
		margin-bottom: 0;
	}
}

.info-label {
	width: 140rpx;
	font-size: $font-size-sm;
	color: $on-surface;
	font-weight: 500;
}

.info-value {
	flex: 1;
	font-size: $font-size-sm;
	color: $on-background;
	text-align: right;
}

/* ==================== 订单底部 ==================== */
.order-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: $spacing-3;
	border-top: 1rpx solid $outline-light;
}

.order-time {
	font-size: $font-size-xs;
	color: $on-surface-variant;
}

.view-detail {
	font-size: $font-size-sm;
	color: $primary;
	font-weight: 600;
}

/* ==================== 底部按钮 ==================== */
.bottom-action {
	position: fixed;
	bottom: 40rpx;
	left: $spacing-4;
	right: $spacing-4;
}

.add-btn {
	width: 100%;
	height: 96rpx;
	background: linear-gradient(135deg, $primary-btn 0%, $primary-dark 100%);
	border-radius: $radius-xl;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $spacing-2;
	box-shadow: $shadow-lg;
}

.add-icon {
	width: 32rpx;
	height: 32rpx;
}

.add-text {
	font-size: $font-size-lg;
	color: #FFFFFF;
	font-weight: 600;
}
</style>
<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<text class="nav-title">我的订单</text>
				<text class="placeholder"></text>
			</view>
		</view>
		
		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: navbarHeight + 'px' }">
			<!-- 订单状态切换 -->
			<view class="status-tabs">
				<view 
					class="tab-item" 
					:class="{ active: activeTab === 'store' }"
					@click="activeTab = 'store'"
				>
					<text class="tab-text">存件</text>
					<view class="tab-badge" v-if="storeCount > 0">
						<text class="badge-text">{{ storeCount }}</text>
					</view>
				</view>
				<view 
					class="tab-item" 
					:class="{ active: activeTab === 'pickup' }"
					@click="activeTab = 'pickup'"
				>
					<text class="tab-text">取件</text>
					<view class="tab-badge" v-if="pickupCount > 0">
						<text class="badge-text">{{ pickupCount }}</text>
					</view>
				</view>
			</view>
			
			<!-- 订单列表 -->
			<view class="order-list">
				<!-- 存件订单 -->
				<view v-if="activeTab === 'store'">
					<view
						class="order-card"
						:class="{ active: !order.pickedUp }"
						v-for="order in storeOrders"
						:key="order.id"
						v-memo="[order.id, order.pickedUp]"
						@click="viewOrderDetail(order)"
					>
						<view class="order-header">
							<view class="order-title-box">
								<text class="order-cabinet">{{ order.cabinetName || '未知智能柜' }}</text>
								<view class="order-status" :class="order.pickedUp ? 'completed' : 'active'">
									<text class="status-text">{{ order.pickedUp ? '已取出' : '在柜中' }}</text>
								</view>
							</view>
							<view class="order-cell-info">
								<text class="cell-number">{{ order.cellNumber }}号</text>
							</view>
						</view>
						<view class="order-info">
							<view class="info-row">
								<text class="info-label">取件码</text>
								<text class="info-value code-text">{{ order.pickupCode }}</text>
							</view>
							<view class="info-row">
								<text class="info-label">存件时间</text>
								<text class="info-value">{{ formatTime(order.createTime) }}</text>
							</view>
							<view class="info-row" v-if="order.pickupTime">
								<text class="info-label">取件时间</text>
								<text class="info-value">{{ formatTime(order.pickupTime) }}</text>
							</view>
						</view>
					</view>
					
					<!-- 空状态 -->
					<view v-if="storeOrders.length === 0" class="empty-state">
						<image class="empty-icon" src="/static/icons/icon-order.png" mode="aspectFit" lazy-load></image>
						<text class="empty-text">暂无存件记录</text>
						<button class="empty-btn" @click="goToStore">去存件</button>
					</view>
				</view>
				
				<!-- 取件订单 -->
				<view v-if="activeTab === 'pickup'">
					<view
						class="order-card completed"
						v-for="order in pickupOrders"
						:key="order.id"
						v-memo="[order.id]"
						@click="viewOrderDetail(order)"
					>
						<view class="order-header">
							<view class="order-title-box">
								<text class="order-cabinet">{{ order.cabinetName || '未知智能柜' }}</text>
								<view class="order-status">
									<text class="status-text">已完成</text>
								</view>
							</view>
						</view>
						<view class="order-info">
							<view class="info-row">
								<text class="info-label">取件码</text>
								<text class="info-value code-text">{{ order.pickupCode }}</text>
							</view>
							<view class="info-row">
								<text class="info-label">取件时间</text>
								<text class="info-value">{{ formatTime(order.createTime) }}</text>
							</view>
						</view>
					</view>
					
					<!-- 空状态 -->
					<view v-if="pickupOrders.length === 0" class="empty-state">
						<image class="empty-icon" src="/static/icons/icon-battery.png" mode="aspectFit" lazy-load></image>
						<text class="empty-text">暂无取件记录</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { orderApi } from '../../utils/request.js'

// 响应式数据
const statusBarHeight = ref(0)
const navbarHeight = ref(0)
const activeTab = ref('store')
const orders = ref([])

// 计算属性
const storeOrders = computed(() => {
	return orders.value.filter(order => order.type === 'store')
})

const pickupOrders = computed(() => {
	return orders.value.filter(order => order.type === 'pickup')
})

const storeCount = computed(() => {
	return storeOrders.value.length
})

const pickupCount = computed(() => {
	return pickupOrders.value.length
})

onLoad(() => {
	// 获取状态栏高度
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44
	navbarHeight.value = statusBarHeight.value + 88
})

// 加载订单数据
const loadOrders = async () => {
	try {
		const serverOrders = await orderApi.getMyOrders()

		// 转换服务器返回的数据格式
		orders.value = serverOrders.map(order => {
			const formatted = {
				id: order.id,
				type: order.type,
				cabinetName: order.cabinet_name,
				cellNumber: order.cell_number,
				pickupCode: order.pickup_code,
				createTime: order.create_time,
				pickupTime: order.pickup_time,
				pickedUp: order.picked_up,
				sceneType: order.scene_type
			}

			// 如果有收件人信息，添加到格式化数据中
			if (order.recipientInfo) {
				formatted.recipientInfo = order.recipientInfo
			}

			return formatted
		})
	} catch (error) {
		console.error('加载订单失败:', error)
		// 如果服务器请求失败，使用本地缓存数据
		const history = uni.getStorageSync('history') || []
		orders.value = history.sort((a, b) => {
			return new Date(b.createTime) - new Date(a.createTime)
		})
	}
}

onShow(() => {
	loadOrders()
	// 隐藏原生tabbar
	uni.hideTabBar({
		animation: false
	})
})

// 格式化时间
const formatTime = (timeString) => {
	if (!timeString) return '-'
	const date = new Date(timeString)
	const year = date.getFullYear()
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const day = date.getDate().toString().padStart(2, '0')
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')
	
	return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 查看订单详情
const viewOrderDetail = (order) => {
	uni.showModal({
		title: order.type === 'store' ? '存件详情' : '取件详情',
		content: `
智能柜: ${order.cabinetName || '-'}
格子号: ${order.cellNumber || '-'}号
取件码: ${order.pickupCode || '-'}
操作时间: ${formatTime(order.createTime)}
取件时间: ${formatTime(order.pickupTime)}
状态: ${order.type === 'store' ? (order.pickedUp ? '已取出' : '在柜中') : '已完成'}
		`.trim(),
		showCancel: false
	})
}

// 去存件
const goToStore = () => {
	uni.switchTab({
		url: '/pages/index/index'
	})
}
</script>

<style lang="scss" scoped>
/* ==================== 颜色变量 ==================== */
$primary: #A5D63F;
$primary-light: #E8F5E9;
$primary-dark: #8BC34A;
$primary-faded: rgba(165, 214, 63, 0.12);

$background: #FFFFFF;
$surface: #F5F7FA;
$surface-variant: #F0F2F5;

$on-background: #2C3E50;
$on-surface: #5A6A7A;
$on-surface-variant: #9CA3AF;
$on-surface-light: #BDC3C7;

$outline: #E5E7EB;
$outline-light: #F3F4F6;

$accent-red: #FF6B6B;
$accent-blue: #4A90E2;
$accent-orange: #FFA500;
$accent-teal: #00B894;

$shadow-xs: 0 2rpx 4rpx rgba(0, 0, 0, 0.04);
$shadow-sm: 0 4rpx 8rpx rgba(0, 0, 0, 0.06);
$shadow-md: 0 8rpx 16rpx rgba(0, 0, 0, 0.08);
$shadow-lg: 0 16rpx 32rpx rgba(0, 0, 0, 0.10);

/* ==================== 间距变量 ==================== */
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
$font-size-2xl: 42rpx;

$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

/* ==================== 响应式断点 ==================== */
@media screen and (max-width: 750rpx) {
	$spacing-4: 24rpx;
	$font-size-base: 26rpx;
	$font-size-lg: 30rpx;
	$font-size-xl: 34rpx;
}

@media screen and (max-width: 600rpx) {
	$spacing-4: 20rpx;
	$font-size-base: 24rpx;
	$font-size-lg: 28rpx;
	$font-size-xl: 32rpx;
}

/* ==================== 容器 ==================== */
.container {
	min-height: 100vh;
	background: $background;
}

/* ==================== 导航栏 ==================== */
.navbar {
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(20rpx);
	-webkit-backdrop-filter: blur(20rpx);
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 1000;
	box-shadow: 0 4rpx 30rpx rgba(0, 0, 0, 0.08);
}

.nav-content {
	padding: $spacing-2 $spacing-4;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.nav-title {
	font-size: $font-size-xl;
	font-weight: $font-weight-semibold;
	color: $on-background;
	line-height: 1.5;
}

.placeholder {
	width: 48rpx;
	height: 48rpx;
}

/* ==================== 主内容区 ==================== */
.content {
	padding: $spacing-3 $spacing-4;
}

/* ==================== 状态切换 ==================== */
.status-tabs {
	display: flex;
	background: $surface;
	border-radius: $radius-2xl;
	padding: $spacing-1;
	margin-bottom: $spacing-4;
	border: 2rpx solid $outline;
	box-shadow: $shadow-sm;
}

.tab-item {
	flex: 1;
	text-align: center;
	padding: $spacing-2;
	font-size: $font-size-base;
	color: $on-surface;
	border-radius: $radius-xl;
	transition: all 0.2s ease-out;
	position: relative;

	&:active {
		transform: translateY(2rpx);
	}

	&.active {
		background: $primary-light;
		color: $primary-dark;
		font-weight: $font-weight-semibold;
		border: 2rpx solid $primary;
		box-shadow: $shadow-xs;
	}

	.tab-text {
		font-size: $font-size-base;
		line-height: 1.5;
	}

	.tab-badge {
		position: absolute;
		top: $spacing-1;
		right: $spacing-4;
		background: $primary;
		border-radius: 50%;
		padding: 2rpx $spacing-2;
		min-width: 32rpx;
		height: 32rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2rpx 4rpx rgba(165, 214, 63, 0.3);

		.badge-text {
			font-size: $font-size-xs;
			color: #FFFFFF;
			font-weight: $font-weight-bold;
			line-height: 1.5;
		}
	}
}

/* ==================== 订单列表 ==================== */
.order-list {
	min-height: 60vh;
	padding-bottom: 180rpx;
	width: 100%;
	box-sizing: border-box;
}

.order-card {
	background: $surface;
	border-radius: $radius-2xl;
	padding: $spacing-4;
	margin-bottom: $spacing-3;
	border: 2rpx solid $outline;
	transition: all 0.2s ease-out;
	box-shadow: $shadow-sm;
	width: 100%;
	box-sizing: border-box;

	&.active {
		background: $primary-light;
		border: 2rpx solid $primary;

		&:active {
			transform: translateY(2rpx);
			box-shadow: $shadow-md;
		}
	}

	&.completed {
		.order-header {
			margin-bottom: $spacing-3;
		}
	}
}

.order-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $spacing-4;

	.order-title-box {
		flex: 1;
		display: flex;
		align-items: center;
		gap: $spacing-2;
		min-width: 0;

		.order-cabinet {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $on-background;
		line-height: 1.5;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

		.order-status {
			display: flex;
			align-items: center;
			padding: $spacing-1 $spacing-2;
			border-radius: $radius-lg;
			flex-shrink: 0;

			.status-text {
				font-size: $font-size-sm;
				font-weight: $font-weight-semibold;
				color: $primary-dark;
				line-height: 1.5;
			}

			&.completed {
				.status-text {
					color: $on-surface-variant;
				}
			}
		}
	}

	.order-cell-info {
		.cell-number {
			font-size: $font-size-base;
			color: $primary-dark;
			font-weight: $font-weight-semibold;
			line-height: 1.5;
		}
	}
}

.order-info {
	margin-bottom: $spacing-4;

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-2;

		&:last-child {
			margin-bottom: 0;
		}

		.info-label {
			font-size: $font-size-sm;
			color: $on-surface-variant;
			line-height: 1.5;
		}

		.info-value {
			font-size: $font-size-sm;
			color: $on-background;
			font-weight: $font-weight-medium;
			line-height: 1.5;

			&.code-text {
				color: $primary-dark;
				font-family: monospace;
				font-weight: $font-weight-bold;
				letter-spacing: 2rpx;
			}
		}
	}
}

/* ==================== 空状态 ==================== */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 0;

	.empty-icon {
		font-size: 120rpx;
		margin-bottom: $spacing-4;
		opacity: 0.4;
		width: 1em;
		height: 1em;
	}

	.empty-text {
		font-size: $font-size-base;
		color: $on-surface-variant;
		margin-bottom: $spacing-6;
		line-height: 1.5;
	}

	.empty-btn {
		height: 80rpx;
		background: $primary-light;
		border: 2rpx solid $primary;
		color: $primary-dark;
		border-radius: $radius-lg;
		padding: 0 $spacing-6;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		line-height: 1.5;
		transition: all 0.2s ease-out;
		box-shadow: $shadow-xs;
		display: flex;
		align-items: center;
		justify-content: center;

		&:active {
			transform: translateY(2rpx);
			box-shadow: $shadow-sm;
		}
	}
}
</style>
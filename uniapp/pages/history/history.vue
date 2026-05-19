<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="back-btn" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">历史记录</text>
				<view class="placeholder"></view>
			</view>
		</view>
		
		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: navbarHeight + 'px' }">
			<!-- 记录类型切换 -->
			<view class="type-tabs">
				<view 
					class="tab-item" 
					:class="{ active: activeTab === 'all' }"
					@click="activeTab = 'all'"
				>
					<text class="tab-text">全部</text>
				</view>
				<view 
					class="tab-item" 
					:class="{ active: activeTab === 'store' }"
					@click="activeTab = 'store'"
				>
					<text class="tab-text">存件</text>
				</view>
				<view 
					class="tab-item" 
					:class="{ active: activeTab === 'pickup' }"
					@click="activeTab = 'pickup'"
				>
					<text class="tab-text">取件</text>
				</view>
			</view>
			
			<!-- 记录列表 -->
			<view class="record-list">
				<view
					class="record-card"
					v-for="record in filteredRecords"
					:key="record.id"
				>
					<view class="record-header">
						<view class="record-type">
							<image class="type-icon" :src="record.type === 'store' ? '/static/icons/icon-order.png' : '/static/icons/icon-check.png'" mode="aspectFit"></image>
							<text class="type-text">{{ record.type === 'store' ? '存件' : '取件' }}</text>
						</view>
						<view class="record-status" :class="getStatusClass(record)">
							<text class="status-text">{{ getStatusText(record) }}</text>
						</view>
					</view>
					
					<view class="record-info">
						<view class="info-row">
							<text class="info-label">场景类型</text>
							<text class="info-value">{{ record.sceneType === 'delivery' ? '外卖柜' : '储物柜' }}</text>
						</view>
						<view class="info-row" v-if="record.type === 'store'">
							<text class="info-label">取件码</text>
							<text class="info-value code-value">{{ record.pickupCode }}</text>
						</view>
						<view class="info-row">
							<text class="info-label">操作时间</text>
							<text class="info-value">{{ formatTime(record.createTime) }}</text>
						</view>
						<view class="info-row" v-if="record.type === 'store' && record.pickedUp">
							<text class="info-label">取件时间</text>
							<text class="info-value">{{ formatTime(record.pickupTime) }}</text>
						</view>
					</view>
				</view>
				
				<!-- 空状态 -->
				<view v-if="filteredRecords.length === 0" class="empty-state">
					<image class="empty-icon" src="/static/icons/icon-empty.png" mode="aspectFit"></image>
					<text class="empty-text">暂无记录</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

// 响应式数据
const statusBarHeight = ref(0)
const navbarHeight = ref(0)
const activeTab = ref('all')
const records = ref([])

// 计算属性
const filteredRecords = computed(() => {
	if (activeTab.value === 'all') {
		return records.value
	} else if (activeTab.value === 'store') {
		return records.value.filter(r => r.type === 'store')
	} else {
		return records.value.filter(r => r.type === 'pickup')
	}
})

onLoad(() => {
	// 获取状态栏高度
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44
	navbarHeight.value = statusBarHeight.value + 88
})

onShow(() => {
	loadRecords()
})

// 加载记录
const loadRecords = () => {
	const history = uni.getStorageSync('history') || []
	// 按时间倒序排列
	records.value = history.sort((a, b) => {
		return new Date(b.createTime) - new Date(a.createTime)
	})
}

// 获取状态样式类
const getStatusClass = (record) => {
	if (record.type === 'store') {
		return record.pickedUp ? 'picked-up' : 'in-cabinet'
	} else {
		return 'completed'
	}
}

// 获取状态文本
const getStatusText = (record) => {
	if (record.type === 'store') {
		return record.pickedUp ? '已取出' : '在柜中'
	} else {
		return '已完成'
	}
}

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

// 返回上一页
const goBack = () => {
	uni.navigateBack()
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

.back-btn {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: $surface;
	transition: all 0.2s ease-out;

	&:active {
		background: $surface-variant;
		transform: translateY(2rpx);
	}

	.back-icon {
		font-size: 48rpx;
		color: $on-surface;
		font-weight: $font-weight-normal;
	}
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
	padding: $spacing-4;
}

/* ==================== 类型切换 ==================== */
.type-tabs {
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

	&:active {
		transform: translateY(2rpx);
	}

	&.active {
		background: $background;
		color: $primary-dark;
		font-weight: $font-weight-semibold;
		border: 2rpx solid $primary-light;
		box-shadow: $shadow-xs;
	}

	.tab-text {
		font-size: $font-size-base;
		line-height: 1.5;
	}
}

/* ==================== 记录列表 ==================== */
.record-list {
	min-height: 60vh;
}

.record-card {
	background: $surface;
	border-radius: $radius-2xl;
	padding: $spacing-4;
	margin-bottom: $spacing-3;
	border: 2rpx solid $outline;
	transition: all 0.2s ease-out;
	box-shadow: $shadow-sm;

	&:active {
		transform: translateY(2rpx);
		box-shadow: $shadow-md;
	}
}

.record-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $spacing-3;

	.record-type {
		display: flex;
		align-items: center;
		gap: $spacing-2;

		.type-icon {
			width: 36rpx;
			height: 36rpx;
		}

		.type-text {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $on-background;
		line-height: 1.5;
	}
	}

	.record-status {
		padding: $spacing-1 $spacing-2;
		border-radius: $radius-lg;

		.status-text {
			font-size: $font-size-sm;
			font-weight: $font-weight-medium;
			line-height: 1.5;
		}

		&.in-cabinet {
			background: $primary-light;
			color: $primary-dark;
			border: 1rpx solid $primary;
		}

		&.picked-up {
			background: $surface-variant;
			color: $on-surface-variant;
			border: 1rpx solid $outline;
		}

		&.completed {
			background: $primary-light;
			color: $primary-dark;
			border: 1rpx solid $primary;
		}
	}
}

.record-info {
	display: flex;
	flex-direction: column;
	gap: $spacing-2;

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: $spacing-1 0;

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

			&.code-value {
				font-family: monospace;
				font-size: $font-size-lg;
				color: $primary-dark;
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
		width: 120rpx;
		height: 120rpx;
		margin-bottom: $spacing-3;
		opacity: 0.4;
	}

	.empty-text {
		font-size: $font-size-base;
		color: $on-surface-variant;
		line-height: 1.5;
	}
}
</style>
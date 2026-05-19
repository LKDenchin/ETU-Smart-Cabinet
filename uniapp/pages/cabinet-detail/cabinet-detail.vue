<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">智能柜详情</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 加载状态 -->
			<view v-if="!cabinetInfo" class="loading-state">
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 智能柜信息卡片 -->
			<view v-else class="cabinet-info-card">
							<view class="cabinet-header">
								<image class="cabinet-icon" src="/static/icons/icon-charging1.png" mode="aspectFit"></image>
								<view class="cabinet-title-group">
									<text class="cabinet-name">{{ cabinetInfo.name }}</text>
									<text class="cabinet-address">{{ cabinetInfo.address }}</text>
								</view>
								<view class="nav-button" @click="openNavigation">
									<image class="nav-icon" src="/static/icons/icon-map.png" mode="aspectFit"></image>
								</view>
							</view>
				<view class="cabinet-stats">
					<view class="stat-item">
						<text class="stat-label">距离</text>
						<text class="stat-value">{{ cabinetInfo.distance }}</text>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-item">
						<text class="stat-label">可用</text>
						<text class="stat-value">{{ availableCount }}/{{ cabinetInfo.total }}</text>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-item">
						<text class="stat-label">占用</text>
						<text class="stat-value">{{ occupiedCount }}</text>
					</view>
				</view>
				<!-- 柜子大小概览 -->
				<view class="size-overview">
					<view class="size-item">
						<text class="size-label">超大</text>
						<text class="size-count">{{ cabinetInfo.sizes?.extraLarge || 0 }}</text>
					</view>
					<view class="size-item">
						<text class="size-label">大</text>
						<text class="size-count">{{ cabinetInfo.sizes?.large || 0 }}</text>
					</view>
					<view class="size-item">
						<text class="size-label">中</text>
						<text class="size-count">{{ cabinetInfo.sizes?.medium || 0 }}</text>
					</view>
					<view class="size-item">
						<text class="size-label">小</text>
						<text class="size-count">{{ cabinetInfo.sizes?.small || 0 }}</text>
					</view>
				</view>
			</view>

			<!-- 状态图例 -->
			<view class="legend-section">
				<view class="legend-item">
					<view class="legend-dot available"></view>
					<text class="legend-text">可用</text>
				</view>
				<view class="legend-item">
					<view class="legend-dot occupied"></view>
					<text class="legend-text">占用</text>
				</view>
				<view class="legend-item">
					<view class="legend-dot stolen"></view>
					<text class="legend-text">失窃</text>
				</view>
				<view class="legend-item">
					<view class="legend-dot fault"></view>
					<text class="legend-text">故障</text>
				</view>
			</view>

			<!-- 柜子网格 -->
			<view class="grid-section">
				<text class="section-title">柜子位置</text>
				<view class="cabinet-grid">
					<view
						v-for="row in 5"
						:key="row"
						class="grid-row"
					>
						<view class="row-label">
							<text class="row-size">{{ getRowSize(row) }}</text>
							<text class="row-number">{{ row }}行</text>
						</view>
						<view
																						v-for="col in 4"
																						:key="`${row}-${col}`"
																						class="grid-cell"
																						:class="{
																							'available': getCellStatus(row, col) === 'available',
																							'occupied': getCellStatus(row, col) === 'occupied',
																							'stolen': getCellStatus(row, col) === 'stolen',
																							'fault': getCellStatus(row, col) === 'fault',
																							'selected': selectedCell.row === row && selectedCell.col === col
																						}"
																						@click="selectCell(row, col)"
																					>
																						<text class="cell-number">{{ row }}-{{ col }}</text>
																						<view class="cell-status-icon" v-if="getCellStatus(row, col) !== 'available'">
																							<text class="status-icon-text" v-if="getCellStatus(row, col) === 'occupied'">占用</text>
																							<text class="status-icon-text" v-else-if="getCellStatus(row, col) === 'stolen'">失窃</text>
																							<text class="status-icon-text" v-else>故障</text>
																						</view>
																					</view>					</view>
				</view>
			</view>

			<!-- 已选择信息 -->
			<view class="selected-info" v-if="selectedCell.row">
				<view class="info-card">
					<image class="info-icon" src="/static/icons/icon-check.png" mode="aspectFit"></image>
					<view class="info-content">
						<text class="info-title">已选择位置</text>
						<text class="info-detail">{{ selectedCell.row }}行 {{ selectedCell.col }}列</text>
					</view>
				</view>
			</view>

			<!-- 开始存件按钮 -->
			<view class="action-section">
				<button class="start-store-btn" @click="goToStore" :disabled="!selectedCell.row">
					<text class="btn-text">开始存件</text>
				</button>
				<text class="action-hint">请选择可用的柜子位置</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { cabinetApi } from '../../utils/request.js'

const statusBarHeight = ref(0)
const cabinetInfo = ref(null)
const selectedCell = ref({ row: null, col: null })

// 柜子状态数据（模拟）
const cellStatus = ref({})

// 智能柜列表数据（与cabinet-select保持一致）
const cabinetsList = [
	{
		id: 1,
		name: '天河城1号柜',
		address: '天河区天河路208号天河城B1层',
		distance: '300m',
		distanceValue: 0.3,
		available: 12,
		total: 20,
		type: 'delivery',
		latitude: 23.1370,
		longitude: 113.3260,
		sizes: {
			extraLarge: 4,
			large: 4,
			medium: 8,
			small: 4
		}
	},
	{
		id: 2,
		name: '天河城2号柜',
		address: '天河区天河路208号天河城B1层',
		distance: '300m',
		distanceValue: 0.3,
		available: 8,
		total: 20,
		type: 'storage',
		latitude: 23.1371,
		longitude: 113.3261,
		sizes: {
			extraLarge: 3,
			large: 5,
			medium: 6,
			small: 6
		}
	},
	{
		id: 3,
		name: '正佳广场1号柜',
		address: '天河区天河路228号正佳广场1F',
		distance: '500m',
		distanceValue: 0.5,
		available: 5,
		total: 22,
		type: 'delivery',
		latitude: 23.1360,
		longitude: 113.3240,
		sizes: {
			extraLarge: 5,
			large: 6,
			medium: 6,
			small: 5
		}
	},
	{
		id: 4,
		name: '正佳广场2号柜',
		address: '天河区天河路228号正佳广场1F',
		distance: '500m',
		distanceValue: 0.5,
		available: 15,
		total: 22,
		type: 'storage',
		latitude: 23.1361,
		longitude: 113.3241,
		sizes: {
			extraLarge: 4,
			large: 4,
			medium: 8,
			small: 6
		}
	},
	{
		id: 5,
		name: '太古汇1号柜',
		address: '天河区天河路383号太古汇B2层',
		distance: '800m',
		distanceValue: 0.8,
		available: 18,
		total: 20,
		type: 'delivery',
		latitude: 23.1390,
		longitude: 113.3200,
		sizes: {
			extraLarge: 2,
			large: 4,
			medium: 8,
			small: 6
		}
	},
	{
		id: 6,
		name: '万菱汇1号柜',
		address: '天河区天河路230-232号万菱汇1F',
		distance: '1.2km',
		distanceValue: 1.2,
		available: 8,
		total: 20,
		type: 'storage',
		latitude: 23.1380,
		longitude: 113.3230,
		sizes: {
			extraLarge: 3,
			large: 5,
			medium: 6,
			small: 6
		}
	},
	{
		id: 7,
		name: '花城汇1号柜',
		address: '天河区花城大道87号花城汇B1层',
		distance: '1.5km',
		distanceValue: 1.5,
		available: 0,
		total: 18,
		type: 'delivery',
		latitude: 23.1350,
		longitude: 113.3210,
		sizes: {
			extraLarge: 2,
			large: 4,
			medium: 6,
			small: 6
		}
	},
	{
		id: 8,
		name: '天环广场1号柜',
		address: '天河区天河路218号天环广场B2层',
		distance: '1.8km',
		distanceValue: 1.8,
		available: 10,
		total: 20,
		type: 'storage',
		latitude: 23.1375,
		longitude: 113.3225,
		sizes: {
			extraLarge: 3,
			large: 5,
			medium: 6,
			small: 6
		}
	}
]

// 根据ID获取智能柜完整信息
const getCabinetById = (id) => {
	return cabinetsList.find(c => c.id === id)
}

// 计算可用数量
const availableCount = computed(() => {
	if (!cabinetInfo.value) return 0
	let count = 0
	for (let row = 1; row <= 5; row++) {
		for (let col = 1; col <= 4; col++) {
			if (getCellStatus(row, col) === 'available') {
				count++
			}
		}
	}
	return count
})

// 计算占用数量
const occupiedCount = computed(() => {
	if (!cabinetInfo.value) return 0
	let count = 0
	for (let row = 1; row <= 5; row++) {
		for (let col = 1; col <= 4; col++) {
			const status = getCellStatus(row, col)
			if (status === 'occupied' || status === 'pending_pickup') {
				count++
			}
		}
	}
	return count
})

// 获取柜子状态
const getCellStatus = (row, col) => {
	const key = `${row}-${col}`
	return cellStatus.value[key] || 'available'
}

// 获取行的大小
const getRowSize = (row) => {
	// 每一行对应一种大小：第1行超大，第2行大，第3行中，第4行中，第5行小
	const sizes = ['', '超大', '大', '中', '中', '小']
	return sizes[row] || ''
}

// 初始化柜子状态
const initCellStatus = (cells) => {
	if (!cells || Object.keys(cells).length === 0) {
		// 如果没有格子数据，使用默认的空状态
		cellStatus.value = {}
		return
	}
	// 使用从服务器获取的真实格子状态数据
	cellStatus.value = { ...cells }
}

onLoad(async () => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44

	// 获取选中的智能柜信息
	let cabinet = uni.getStorageSync('selectedCabinet')
	if (cabinet) {
		try {
			// 从服务器获取最新的柜子状态
			const serverCabinet = await cabinetApi.getCabinetDetail(cabinet.id)

			// 更新本地柜子信息
			cabinet = {
				...cabinet,
				available: serverCabinet.available,
				total: serverCabinet.total,
				sizes: serverCabinet.sizes,
				cells: serverCabinet.cells
			}

			// 更新存储的智能柜信息
			uni.setStorageSync('selectedCabinet', cabinet)
		} catch (error) {
			console.error('获取柜子详情失败:', error)
			// 如果服务器请求失败，使用本地缓存数据
		}

		cabinetInfo.value = cabinet
		initCellStatus(cabinet.cells)
	} else {
		// 如果没有选中智能柜，返回选择页面
		uni.redirectTo({
			url: '/pages/cabinet-select/cabinet-select'
		})
	}
})

// 刷新柜子状态
const refreshCabinetStatus = async () => {
	let cabinet = uni.getStorageSync('selectedCabinet')
	if (cabinet && cabinetInfo.value) {
		try {
			// 从服务器获取最新的柜子状态
			const serverCabinet = await cabinetApi.getCabinetDetail(cabinet.id)

			// 更新本地柜子信息
			cabinet = {
				...cabinet,
				available: serverCabinet.available,
				total: serverCabinet.total,
				sizes: serverCabinet.sizes,
				cells: serverCabinet.cells
			}

			// 更新存储的智能柜信息
			uni.setStorageSync('selectedCabinet', cabinet)
			cabinetInfo.value = cabinet
			initCellStatus(cabinet.cells)
		} catch (error) {
			console.error('刷新柜子详情失败:', error)
		}
	}
}

onShow(() => {
	// 每次显示页面时刷新柜子状态
	refreshCabinetStatus()
})

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 选择柜子
const selectCell = (row, col) => {
	const status = getCellStatus(row, col)
	if (status === 'fault') {
		uni.showToast({
			title: '该柜子故障，无法使用',
			icon: 'none'
		})
		return
	}

	if (status === 'occupied') {
		uni.showToast({
			title: '该柜子已被占用',
			icon: 'none'
		})
		return
	}

	if (status === 'stolen') {
		uni.showToast({
			title: '该柜子物品已失窃，请联系管理员',
			icon: 'none'
		})
		return
	}

	// 切换选择状态
	if (selectedCell.value.row === row && selectedCell.value.col === col) {
		selectedCell.value = { row: null, col: null }
	} else {
		selectedCell.value = { row, col }
	}
}

// 跳转到存件页面
const goToStore = () => {
	if (!selectedCell.value.row) {
		uni.showToast({
			title: '请先选择柜子位置',
			icon: 'none'
		})
		return
	}

	// 保存选择的柜子位置
	uni.setStorageSync('selectedCell', selectedCell.value)

	// 跳转到存件信息填写页面
	uni.navigateTo({
		url: '/pages/store/store'
	})
}

// 打开地图导航
const openNavigation = () => {
	if (!cabinetInfo.value) {
		uni.showToast({
			title: '智能柜信息不完整',
			icon: 'none'
		})
		return
	}

	// 检查是否有经纬度信息
	if (!cabinetInfo.value.latitude || !cabinetInfo.value.longitude) {
		uni.showModal({
			title: '导航提示',
			content: '该智能柜暂无位置信息，请重新选择智能柜以获取完整信息',
			showCancel: true,
			cancelText: '取消',
			confirmText: '重新选择',
			success: (res) => {
				if (res.confirm) {
					uni.redirectTo({
						url: '/pages/cabinet-select/cabinet-select'
					})
				}
			}
		})
		return
	}

	// 使用uni-app内置地图API打开导航
	uni.openLocation({
		latitude: parseFloat(cabinetInfo.value.latitude),
		longitude: parseFloat(cabinetInfo.value.longitude),
		name: cabinetInfo.value.name,
		address: cabinetInfo.value.address,
		scale: 18
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
	transition: all 0.2s ease-out;

	&:active {
		background: $surface-variant;
		transform: translateY(2rpx);
	}

	.back-icon {
		font-size: 48rpx;
		color: $on-surface;
		line-height: 1;
		font-weight: $font-weight-normal;
	}
}

.nav-title {
	flex: 1;
	text-align: center;
	font-size: $font-size-xl;
	font-weight: $font-weight-semibold;
	color: $on-background;
	line-height: 1.5;
}

.nav-placeholder {
	width: 64rpx;
}

/* ==================== 主内容区 ==================== */
.content {
	padding: $spacing-3;
}

/* ==================== 智能柜信息卡片 ==================== */
.cabinet-info-card {
	background: $primary;
	border-radius: $radius-2xl;
	padding: $spacing-4 $spacing-3;
	margin-bottom: $spacing-3;
	position: relative;
	overflow: hidden;
	box-shadow: $shadow-md;

	.cabinet-header {
		display: flex;
		align-items: center;
		gap: $spacing-2;
		margin-bottom: $spacing-3;
		position: relative;
		z-index: 1;

		.cabinet-icon {
			width: 56rpx;
			height: 56rpx;
			background: rgba(255, 255, 255, 0.2);
			border-radius: $radius-lg;
			padding: $spacing-1;
		}

		.cabinet-title-group {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: $spacing-1;

			.cabinet-name {
				font-size: $font-size-xl;
				font-weight: $font-weight-bold;
				color: #FFFFFF;
				line-height: 1.5;
			}

			.cabinet-address {
				font-size: $font-size-sm;
				color: rgba(255, 255, 255, 0.9);
				line-height: 1.5;
			}
		}

		.nav-button {
			width: 72rpx;
			height: 72rpx;
			background: rgba(255, 255, 255, 0.25);
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			border: 2rpx solid rgba(255, 255, 255, 0.4);
			transition: all 0.2s ease-out;
			backdrop-filter: blur(10rpx);
			flex-shrink: 0;

			&:active {
				background: rgba(255, 255, 255, 0.35);
				transform: scale(0.95);
			}

			.nav-icon {
				width: 40rpx;
				height: 40rpx;
			}
		}
	}

	.cabinet-stats {
		display: flex;
		align-items: center;
		position: relative;
		z-index: 1;

		.stat-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 6rpx;

			.stat-label {
				font-size: $font-size-sm;
				color: rgba(255, 255, 255, 0.8);
				font-weight: $font-weight-normal;
				line-height: 1.5;
			}

			.stat-value {
				font-size: $font-size-lg;
				color: #FFFFFF;
				font-weight: $font-weight-bold;
				line-height: 1.5;
			}
		}

		.stat-divider {
			width: 2rpx;
			height: 40rpx;
			background: rgba(255, 255, 255, 0.3);
			margin: 0 $spacing-3;
		}
	}

	.size-overview {
		display: flex;
		justify-content: space-around;
		align-items: center;
		margin-top: $spacing-4;
		padding: $spacing-4;
		border-top: 1rpx solid rgba(255, 255, 255, 0.2);

		.size-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8rpx;
			padding: $spacing-2 $spacing-3;
			background: rgba(255, 255, 255, 0.1);
			border-radius: $radius-md;
			border: 1rpx solid rgba(255, 255, 255, 0.2);
			min-width: 80rpx;
			transition: all 0.2s ease;

			&:active {
				background: rgba(255, 255, 255, 0.15);
				transform: translateY(-2rpx);
			}

			.size-label {
				font-size: $font-size-base;
				color: rgba(255, 255, 255, 0.9);
				font-weight: $font-weight-medium;
				letter-spacing: 0.5rpx;
			}

			.size-count {
				font-size: $font-size-2xl;
				color: #FFFFFF;
				font-weight: $font-weight-bold;
				text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
				line-height: 1.2;
			}
		}
	}
}

/* ==================== 状态图例 ==================== */
.legend-section {
	display: flex;
	justify-content: center;
	gap: $spacing-4;
	margin-bottom: $spacing-3;
	padding: $spacing-2 $spacing-3;
	background: $background;
	border-radius: $radius-lg;
	border: 2rpx solid $outline;
	box-shadow: $shadow-xs;

	.legend-item {
		display: flex;
		align-items: center;
		gap: $spacing-1;

		.legend-dot {
			width: 16rpx;
			height: 16rpx;
			border-radius: 50%;

			&.available {
				background: $background;
				border: 2rpx solid $primary;
				box-shadow: 0 2rpx 4rpx rgba(165, 214, 63, 0.3);
			}

			&.occupied {
				background: #FFF3E0; /* 浅橙色背景 */
				border: 2rpx solid $accent-orange;
				box-shadow: 0 2rpx 4rpx rgba(255, 165, 0, 0.3);
			}

			&.stolen {
				background: #FFE0B2; /* 深橙色背景 - 失窃警告 */
				border: 2rpx solid #FF6F00;
				box-shadow: 0 2rpx 4rpx rgba(255, 111, 0, 0.5);
				animation: pulse-warning 2s ease-in-out infinite;
			}

			&.fault {
				background: #FFEBEE; /* 浅红色背景 */
				border: 2rpx solid $accent-red;
				box-shadow: 0 2rpx 4rpx rgba(255, 107, 107, 0.3);
			}
		}

		.legend-text {
			font-size: $font-size-sm;
			color: $on-surface-variant;
			font-weight: $font-weight-normal;
			line-height: 1.5;
		}
	}
}

/* ==================== 柜子网格区域 ==================== */
.grid-section {
	margin-bottom: $spacing-3;

	.section-title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $on-background;
		display: block;
		margin-bottom: $spacing-2;
		line-height: 1.5;
	}

	.cabinet-grid {
		background: $background;
		border-radius: $radius-2xl;
		padding: $spacing-3;
		border: 2rpx solid $outline;
		box-shadow: $shadow-sm;

		.grid-row {
			display: flex;
			gap: $spacing-2;
			margin-bottom: $spacing-2;
			align-items: center;

			&:last-child {
				margin-bottom: 0;
			}
		}

		.row-label {
			width: 100rpx;
			height: 100rpx;
			background: linear-gradient(135deg, $primary-light, #F0F9FF);
			border-radius: $radius-lg;
			border: 2rpx solid $primary;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 4rpx;
			flex-shrink: 0;
			box-shadow: $shadow-sm;

			.row-size {
				font-size: $font-size-sm;
				color: $primary-dark;
				font-weight: $font-weight-semibold;
			}

			.row-number {
				font-size: $font-size-xs;
				color: $primary;
				font-weight: $font-weight-normal;
			}
		}

		.grid-cell {
			flex: 1;
			aspect-ratio: 1;
			background: $surface;
			border-radius: $radius-lg;
			border: 2rpx solid $outline;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: $spacing-1;
			position: relative;
			transition: all 0.2s ease-out;
			box-shadow: $shadow-xs;

			&.available {
				background: $background;
				border-color: $primary;

				&:active {
					transform: translateY(2rpx);
					box-shadow: $shadow-md;
				}

				&.selected {
					background: $primary;
					border-color: $primary;
					box-shadow: 0 4rpx 12rpx rgba(165, 214, 63, 0.4);

					.cell-number {
						color: #FFFFFF;
						font-weight: $font-weight-bold;
					}
				}
			}

			&.occupied {
				background: #FFF3E0; /* 浅橙色背景 */
				border-color: $accent-orange;
				opacity: 1;
			}

			&.stolen {
				background: #FFE0B2; /* 深橙色背景 - 失窃警告 */
				border-color: #FF6F00;
				opacity: 1;
				animation: pulse-warning 2s ease-in-out infinite;
			}

			&.fault {
				background: #FFEBEE; /* 浅红色背景 */
				border-color: $accent-red;
				opacity: 1;
			}

			.cell-number {
				font-size: $font-size-base;
				font-weight: $font-weight-semibold;
				color: $on-background;
				line-height: 1.5;
			}

			.cell-status-icon {
				.status-icon-text {
					font-size: $font-size-xs;
					color: $on-surface-variant;
					font-weight: $font-weight-normal;
					line-height: 1.5;
				}
			}
		}
	}
}

/* ==================== 已选择信息 ==================== */
.selected-info {
	margin-bottom: $spacing-3;

	.info-card {
		background: $primary-light;
		border-radius: $radius-lg;
		padding: $spacing-2 $spacing-3;
		display: flex;
		align-items: center;
		gap: $spacing-2;
		border: 2rpx solid $primary;
		box-shadow: $shadow-xs;

		.info-icon {
			width: 40rpx;
			height: 40rpx;
		}

		.info-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 4rpx;

			.info-title {
				font-size: $font-size-sm;
				color: $on-surface-variant;
				font-weight: $font-weight-normal;
				line-height: 1.5;
			}

			.info-detail {
				font-size: $font-size-lg;
				color: $primary-dark;
				font-weight: $font-weight-bold;
				line-height: 1.5;
			}
		}
	}
}

/* ==================== 操作区域 ==================== */
.action-section {
	padding-bottom: $spacing-3;

	.start-store-btn {
		width: 100%;
		height: 96rpx;
		background: $primary;
		border-radius: $radius-xl;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease-out;
		box-shadow: $shadow-sm;

		&:active:not([disabled]) {
			transform: translateY(2rpx);
			box-shadow: $shadow-md;
		}

		&[disabled] {
			background: $surface-variant;
			opacity: 0.5;
			box-shadow: none;
		}

		.btn-text {
			font-size: $font-size-lg;
			font-weight: $font-weight-semibold;
			color: #FFFFFF;
			line-height: 1.5;
		}
	}

	.action-hint {
		display: block;
		text-align: center;
		font-size: $font-size-sm;
		color: $on-surface-light;
		margin-top: $spacing-2;
		line-height: 1.5;
	}
}

/* ==================== 警告动画 ==================== */
@keyframes pulse-warning {
	0%, 100% {
		transform: scale(1);
		box-shadow: 0 2rpx 4rpx rgba(255, 111, 0, 0.3);
	}
	50% {
		transform: scale(1.05);
		box-shadow: 0 4rpx 12rpx rgba(255, 111, 0, 0.6);
	}
}
</style>
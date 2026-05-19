<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">选择智能柜</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 搜索栏 -->
			<view class="search-bar">
				<image class="search-icon" src="/static/icons/icon-search.png" mode="aspectFit"></image>
				<input
					class="search-input"
					v-model="searchKeyword"
					placeholder="搜索智能柜名称或地址"
					@confirm="handleSearch"
				/>
				<view class="clear-btn" v-if="searchKeyword" @click="clearSearch">
					<text class="clear-icon">×</text>
				</view>
			</view>

			<!-- 筛选栏 -->
			<view class="filter-bar">
				<view
					class="filter-item"
					:class="{ active: activeSort === 'distance' }"
					@click="changeSort('distance')"
				>
					<text class="filter-text">距离优先</text>
				</view>
				<view
					class="filter-item"
					:class="{ active: activeSort === 'available' }"
					@click="changeSort('available')"
				>
					<text class="filter-text">可用数量</text>
				</view>
			</view>

			<!-- 智能柜列表 -->
			<view class="cabinet-list">
				<view class="cabinet-card"
										v-for="cabinet in sortedCabinets"
										:key="cabinet.id"
										@click="selectCabinet(cabinet)"
									>
										<view class="cabinet-header">
											<view class="cabinet-title-group">
												<text class="cabinet-name">{{ cabinet.name }}</text>
												<view class="type-badge" :class="cabinet.type">
													<text class="type-text">{{ cabinet.type === 'delivery' ? '外卖柜' : '储物柜' }}</text>
												</view>
											</view>
											<view class="distance-badge">
												<image class="location-icon" src="/static/icons/icon-location.png" mode="aspectFit"></image>
												<text class="distance-text">{{ cabinet.distance }}</text>
											</view>
										</view>
				
										<text class="cabinet-address">{{ cabinet.address }}</text>
				
										<!-- 柜子大小概览 -->
										<view class="size-overview">
											<view class="size-item">
												<text class="size-label">超大</text>
												<text class="size-count">{{ cabinet.sizes?.extraLarge || 0 }}</text>
											</view>
											<view class="size-item">
												<text class="size-label">大</text>
												<text class="size-count">{{ cabinet.sizes?.large || 0 }}</text>
											</view>
											<view class="size-item">
												<text class="size-label">中</text>
												<text class="size-count">{{ cabinet.sizes?.medium || 0 }}</text>
											</view>
											<view class="size-item">
												<text class="size-label">小</text>
												<text class="size-count">{{ cabinet.sizes?.small || 0 }}</text>
											</view>
										</view>
				
										<view class="cabinet-stats">						<view class="stat-item available">
							<image class="stat-icon" src="/static/icons/icon-charging.png" mode="aspectFit"></image>
							<view class="stat-info">
								<text class="stat-label">可用</text>
								<text class="stat-value">{{ cabinet.available }}/{{ cabinet.total }}</text>
							</view>
						</view>
						<view class="stat-item status">
							<image class="stat-icon" src="/static/icons/icon-info.png" mode="aspectFit"></image>
							<view class="stat-info">
								<text class="stat-label">状态</text>
								<text class="stat-value" :class="cabinet.available > 0 ? 'online' : 'full'">
									{{ cabinet.available > 0 ? '正常' : '已满' }}
								</text>
							</view>
						</view>
					</view>

					<view class="cabinet-footer">
						<view class="arrow-button">
							<text class="arrow-text">选择此柜</text>
							<text class="arrow-icon">›</text>
						</view>
					</view>
				</view>

				<!-- 空状态 -->
				<view v-if="sortedCabinets.length === 0" class="empty-state">
					<image class="empty-icon" src="/static/icons/icon-empty.png" mode="aspectFit"></image>
					<text class="empty-text">未找到匹配的智能柜</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { cabinetApi } from '../../utils/request.js'

const statusBarHeight = ref(0)
const cabinets = ref([])
const activeSort = ref('distance')
const searchKeyword = ref('')

// 智能柜数据
const initCabinets = async () => {
	try {
		const serverCabinets = await cabinetApi.getCabinets()

		// 转换服务器返回的数据格式
		cabinets.value = serverCabinets.map(cabinet => ({
			id: cabinet.id,
			name: cabinet.name,
			address: cabinet.address,
			distance: cabinet.distance,
			distanceValue: cabinet.distance_value,
			available: cabinet.available,
			total: cabinet.total,
			type: cabinet.type,
			latitude: cabinet.latitude,
			longitude: cabinet.longitude,
			sizes: cabinet.sizes
		}))
	} catch (error) {
		console.error('加载智能柜失败:', error)
		// 如果服务器请求失败，使用本地缓存数据
		const cachedCabinets = uni.getStorageSync('cabinets')
		if (cachedCabinets) {
			cabinets.value = cachedCabinets
		} else {
			// 使用默认模拟数据
			cabinets.value = [
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
					sizes: { extraLarge: 4, large: 4, medium: 8, small: 4 }
				},
				{
					id: 2,
					name: '珠江新城2号柜',
					address: '天河区珠江新城花城大道85号',
					distance: '500m',
					distanceValue: 0.5,
					available: 8,
					total: 16,
					type: 'delivery',
					latitude: 23.117,
					longitude: 113.337,
					sizes: { extraLarge: 2, large: 4, medium: 6, small: 4 }
				},
				{
					id: 3,
					name: '体育中心3号柜',
					address: '天河区天河体育中心南门',
					distance: '800m',
					distanceValue: 0.8,
					available: 15,
					total: 24,
					type: 'storage',
					latitude: 23.135,
					longitude: 113.345,
					sizes: { extraLarge: 6, large: 6, medium: 8, small: 4 }
				},
				{
					id: 4,
					name: '太古汇4号柜',
					address: '天河区天河路383号太古汇B2层',
					distance: '1.2km',
					distanceValue: 1.2,
					available: 6,
					total: 12,
					type: 'delivery',
					latitude: 23.129,
					longitude: 113.318,
					sizes: { extraLarge: 2, large: 2, medium: 4, small: 4 }
				}
			]
		}
	}
}

// 计算属性
const sortedCabinets = computed(() => {
	let sorted = [...cabinets.value]

	// 先过滤已满的智能柜
	if (activeSort.value === 'available') {
		sorted = sorted.filter(c => c.available > 0)
	}

	// 排序
	switch (activeSort.value) {
		case 'distance':
			sorted.sort((a, b) => a.distanceValue - b.distanceValue)
			break
		case 'available':
			sorted.sort((a, b) => b.available - a.available)
			break
	}

	return sorted
})

onLoad(async () => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44
	await initCabinets()
})

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 搜索智能柜
const handleSearch = () => {
	if (!searchKeyword.value.trim()) {
		initCabinets()
		return
	}

	const results = cabinets.value.filter(c =>
		c.name.includes(searchKeyword.value) ||
		c.address.includes(searchKeyword.value)
	)

	if (results.length > 0) {
		cabinets.value = results
		uni.showToast({
			title: `找到${results.length}个智能柜`,
			icon: 'success'
		})
	} else {
		uni.showToast({
			title: '未找到相关智能柜',
			icon: 'none'
		})
	}
}

// 清除搜索
const clearSearch = () => {
	searchKeyword.value = ''
	initCabinets()
}

// 切换排序方式
const changeSort = (sortType) => {
	activeSort.value = sortType
}

// 选择智能柜
const selectCabinet = (cabinet) => {
	if (cabinet.available === 0) {
		uni.showToast({
			title: '该智能柜已满',
			icon: 'none'
		})
		return
	}

	// 保存选择的智能柜信息
	uni.setStorageSync('selectedCabinet', cabinet)
	// 跳转到智能柜详情页面
	uni.navigateTo({
		url: '/pages/cabinet-detail/cabinet-detail'
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

/* ==================== 搜索栏 ==================== */
.search-bar {
	background: $background;
	border-radius: $radius-lg;
	padding: $spacing-2 $spacing-3;
	margin-bottom: $spacing-3;
	display: flex;
	align-items: center;
	border: 2rpx solid $outline;
	box-shadow: $shadow-sm;
	transition: all 0.2s ease-out;

	&:focus-within {
		border-color: $primary;
		box-shadow: 0 4rpx 12rpx rgba(165, 214, 63, 0.15);
	}

	.search-icon {
		width: 36rpx;
		height: 36rpx;
		margin-right: $spacing-2;
	}

	.search-input {
		flex: 1;
		font-size: $font-size-base;
		color: $on-background;
		line-height: 1.5;
	}

	.clear-btn {
		width: 40rpx;
		height: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: $spacing-2;
		border-radius: 50%;
		background: $surface;
		transition: all 0.2s ease-out;

		&:active {
			background: $surface-variant;
			transform: translateY(2rpx);
		}

		.clear-icon {
			font-size: 40rpx;
			color: $on-surface-light;
			line-height: 1;
		}
	}
}

/* ==================== 筛选栏 ==================== */
.filter-bar {
	display: flex;
	gap: $spacing-2;
	margin-bottom: $spacing-3;

	.filter-item {
		flex: 1;
		background: $background;
		border-radius: 50rpx;
		padding: $spacing-1;
		text-align: center;
		border: 2rpx solid $outline;
		transition: all 0.2s ease-out;
		box-shadow: $shadow-xs;

		&:active {
			transform: translateY(2rpx);
		}

		&.active {
			background: $primary;
			border-color: $primary;
			box-shadow: 0 4rpx 12rpx rgba(165, 214, 63, 0.3);

			.filter-text {
				color: #FFFFFF;
			}
		}

		.filter-text {
			font-size: $font-size-sm;
			color: $on-surface;
			font-weight: $font-weight-semibold;
			line-height: 1.5;
		}
	}
}

/* ==================== 智能柜列表 ==================== */
.cabinet-list {
	min-height: 60vh;
	padding-bottom: $spacing-3;
}

.cabinet-card {
	background: $background;
	border-radius: $radius-2xl;
	padding: $spacing-3;
	margin-bottom: $spacing-2;
	border: 2rpx solid $outline;
	transition: all 0.2s ease-out;
	box-shadow: $shadow-sm;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: $primary;
		opacity: 0;
		transition: opacity 0.2s ease-out;
		border-radius: $radius-2xl $radius-2xl 0 0;
	}

	&:active {
		transform: translateY(2rpx);
		border-color: $primary;
		box-shadow: $shadow-md;

		&::before {
			opacity: 1;
		}
	}

	.cabinet-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: $spacing-2;

		.cabinet-title-group {
			flex: 1;
			display: flex;
			align-items: center;
			gap: $spacing-2;
			flex-wrap: wrap;

			.cabinet-name {
				font-size: $font-size-xl;
				font-weight: $font-weight-semibold;
				color: $on-background;
				line-height: 1.5;
			}

			.type-badge {
				padding: $spacing-1 $spacing-2;
				border-radius: 50rpx;
				font-size: $font-size-sm;
				font-weight: $font-weight-medium;

				&.delivery {
					background: $primary-light;
					color: $primary-dark;
					border: 1rpx solid $primary;
				}

				&.storage {
					background: $surface;
					color: $on-surface;
					border: 1rpx solid $outline;
				}

				.type-text {
					line-height: 1.5;
				}
			}
		}

		.distance-badge {
			display: flex;
			align-items: center;
			gap: $spacing-1;
			padding: $spacing-1 $spacing-2;
			border-radius: 50rpx;
			background: $surface;
			border: 2rpx solid $outline;

			.location-icon {
				width: 18rpx;
				height: 18rpx;
			}

			.distance-text {
				font-size: $font-size-sm;
				color: $primary;
				font-weight: $font-weight-semibold;
				line-height: 1.5;
			}
		}
	}

	.cabinet-address {
		font-size: $font-size-sm;
		color: $on-surface-variant;
		display: block;
		margin-bottom: $spacing-3;
		line-height: 1.5;
	}

	.size-overview {
		display: flex;
		justify-content: space-around;
		align-items: center;
		margin-bottom: $spacing-3;
		padding: $spacing-2 $spacing-3;
		background: $surface-variant;
		border-radius: $radius-md;
		border: 1rpx solid $outline;

		.size-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 4rpx;

			.size-label {
				font-size: $font-size-xs;
				color: $on-surface-variant;
				font-weight: $font-weight-normal;
			}

			.size-count {
				font-size: $font-size-base;
				color: $on-background;
				font-weight: $font-weight-semibold;
			}
		}
	}

	.cabinet-stats {
		display: flex;
		gap: $spacing-2;
		margin-bottom: $spacing-3;

		.stat-item {
			flex: 1;
			display: flex;
			align-items: center;
			gap: $spacing-2;
			padding: $spacing-2;
			border-radius: $radius-lg;
			background: $surface;
			border: 2rpx solid $outline;

			&.available {
				background: $primary-light;
				border-color: $primary;
			}

			.stat-icon {
				width: 20rpx;
				height: 20rpx;
			}

			.stat-info {
				display: flex;
				flex-direction: column;
				gap: 2rpx;

				.stat-label {
					font-size: $font-size-xs;
					color: $on-surface-variant;
					font-weight: $font-weight-normal;
					line-height: 1.2;
				}

				.stat-value {
					font-size: $font-size-sm;
					color: $on-background;
					font-weight: $font-weight-semibold;
					line-height: 1.2;

					&.online {
						color: $accent-teal;
					}

					&.full {
						color: $accent-red;
					}
				}
			}
		}
	}

	.cabinet-footer {
		.arrow-button {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: $spacing-2;
			background: $primary;
			border-radius: $radius-lg;
			transition: all 0.2s ease;

			&:active {
				background: $primary-dark;
			}

			.arrow-text {
				font-size: $font-size-sm;
				color: #FFFFFF;
				font-weight: $font-weight-medium;
				line-height: 1.5;
				margin-right: $spacing-1;
			}

			.arrow-icon {
				font-size: 24rpx;
				color: #FFFFFF;
				line-height: 1;
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
		color: $on-surface-light;
		line-height: 1.5;
	}
}
</style>
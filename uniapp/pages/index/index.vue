<template>
	<view class="container">
		<!-- 主内容区 -->
		<view class="content">
			<!-- 顶部打招呼区域 -->
			<view class="header">
				<view class="greeting-section">
					<text class="greeting">Hi, {{ userInfo.nickname || '欢迎' }}</text>
					<text class="app-title">欢迎使用易取宝</text>
				</view>
			</view>

			<!-- 快捷操作按钮 -->
			<view class="quick-actions">
				<view class="action-btn store-btn" @click="handleStore">
					<text class="action-label">存</text>
					<view class="action-icon">
						<!-- 预留图片位：存件图标 -->
						<image class="icon-placeholder" src="/static/icons/icon-order.png" mode="aspectFit"></image>
					</view>
				</view>
				<view class="action-btn pickup-btn" @click="handlePickup">
					<text class="action-label">取</text>
					<view class="action-icon">
						<!-- 预留图片位：取件图标 -->
						<image class="icon-placeholder" src="/static/icons/icon-check.png" mode="aspectFit"></image>
					</view>
				</view>
			</view>

			<!-- 统计信息 -->
			<view class="stats-section">
				<view class="stats-grid">
					<view class="stat-item">
						<text class="stat-number">{{ todayStoreCount }}</text>
						<text class="stat-label">今日存件</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{ todayPickupCount }}</text>
						<text class="stat-label">今日取件</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{ currentItems }}</text>
						<text class="stat-label">在柜数量</text>
					</view>
				</view>
			</view>

			<!-- 失窃警告 -->
				<view class="theft-warning-section" v-if="theftWarnings.length > 0">
					<view class="theft-warning-card" v-for="warning in theftWarnings.slice(0, 1)" :key="warning.id" @click="handleTheftWarning(warning)">
						<view class="warning-header">
							<view class="warning-icon-wrapper">
								<image class="warning-icon" src="/static/icons/icon-bug.png" mode="aspectFit"></image>
							</view>
							<view class="warning-title-wrapper">
								<text class="warning-title">{{ warning.status === 'confirmed' ? '失窃已确认' : '失窃警告' }}</text>
								<text class="warning-time">{{ formatTheftTime(warning.theftTime) }}</text>
							</view>
							<view class="warning-status-badge" :class="warning.status">
								<text class="status-badge-text">{{ warning.status === 'confirmed' ? '已确认' : '待处理' }}</text>
							</view>
						</view>
						<view class="warning-content">
							<view class="warning-info-row">
								<text class="info-label">智能柜</text>
								<text class="info-value">{{ warning.cabinetName }}</text>
							</view>
							<view class="warning-info-row">
								<text class="info-label">格位</text>
								<text class="info-value">{{ warning.cellNumber }}</text>
							</view>
							<view class="warning-info-row">
								<text class="info-label">存件人</text>
								<text class="info-value">{{ warning.senderNickname }} ({{ warning.senderPhone }})</text>
							</view>
							<view class="warning-info-row">
								<text class="info-label">取件人</text>
								<text class="info-value">{{ warning.recipientNickname }} ({{ warning.recipientPhone }})</text>
							</view>
							<view class="warning-info-row">
								<text class="info-label">订单编号</text>
								<text class="info-value code-text">{{ warning.orderId }}</text>
							</view>
						</view>
						<view class="warning-hint">
							<text class="hint-text">{{ warning.status === 'confirmed' ? '点击查看失窃事件处理状态' : '点击选择：意外取出 / 确认失窃' }}</text>
						</view>
					</view>
				</view>

			<!-- 滚动展示栏 -->
			<view class="scroll-banner">
				<swiper
					class="banner-swiper"
					:autoplay="true"
					:interval="3000"
					:duration="500"
					:circular="true"
					indicator-dots="false"
				>
					<swiper-item
						v-for="(item, index) in bannerList"
						:key="index"
					>
						<view class="banner-item" @click="handleBannerClick(item)">
							<view class="banner-image">
								<image class="banner-img" :src="item.image" mode="aspectFit" lazy-load></image>
							</view>
							<text class="banner-text">{{ item.text }}</text>
						</view>
					</swiper-item>
				</swiper>
			</view>

			<!-- 附近智能柜 -->
			<view class="nearby-section">
				<view class="section-header">
					<text class="section-title">附近智能柜</text>
					<view class="view-more" @click="goToNearby">
						<text class="view-more-text">查看更多</text>
						<text class="view-more-arrow">›</text>
					</view>
				</view>
				<view class="cabinet-list">
					<view
						class="cabinet-card"
						v-for="cabinet in nearbyCabinets"
						:key="cabinet.id"
						@click="selectCabinet(cabinet)"
					>
						<view class="cabinet-info">
							<view class="cabinet-header">
								<text class="cabinet-name">{{ cabinet.name }}</text>
								<view class="distance-badge">
									<image class="location-mini-icon" src="/static/icons/icon-location.png" mode="aspectFit"></image>
									<text class="distance-text">{{ cabinet.distance }}</text>
								</view>
							</view>
							<text class="cabinet-address">{{ cabinet.address }}</text>
							<view class="cabinet-stats">
								<view class="stat-tag available">
									<text class="stat-label">可用</text>
									<text class="stat-value">{{ cabinet.available }}/{{ cabinet.total }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { cabinetApi } from '../../utils/request.js'

const userInfo = ref({})
const sceneType = ref('delivery')

// 计算场景名称
const sceneName = computed(() => {
	return sceneType.value === 'delivery' ? '外卖柜' : '智能柜'
})

// 计算统计数据
const todayStoreCount = ref(0)
const todayPickupCount = ref(0)
const currentItems = ref(0)
// 失窃警告列表
const theftWarnings = ref([])
// 轮询失窃警告的定时器
let warningPollingTimer = null

// 加载统计数据
const loadStatistics = () => {
	const history = uni.getStorageSync('history') || []
	const today = new Date().toDateString()

	todayStoreCount.value = history.filter(item =>
		item.type === 'store' && new Date(item.createTime).toDateString() === today
	).length

	todayPickupCount.value = history.filter(item =>
		item.type === 'pickup' && new Date(item.createTime).toDateString() === today
	).length

	currentItems.value = history.filter(item =>
		item.type === 'store' && !item.pickedUp
	).length
}

// 加载失窃警告
const loadTheftWarnings = async () => {
	try {
		const warnings = await cabinetApi.getTheftWarnings()
		// 转换字段名：下划线命名 -> 驼峰命名
		theftWarnings.value = (warnings || []).map(w => ({
			id: w.id,
			orderId: w.order_id,
			cabinetName: w.cabinet_name,
			cellNumber: w.cell_number,
			senderPhone: w.sender_phone,
			senderNickname: w.sender_nickname,
			recipientPhone: w.recipient_phone,
			recipientNickname: w.recipient_nickname,
			theftTime: w.theft_time,
			status: w.status,
			resolvedTime: w.resolved_time,
			resolvedUserId: w.resolved_user_id
		}))
	} catch (error) {
		console.error('加载失窃警告失败:', error)
		theftWarnings.value = []
	}
}

// 开始轮询失窃警告
const startWarningPolling = () => {
	// 每15秒轮询一次，提高数据实时性
	warningPollingTimer = setInterval(() => {
		loadTheftWarnings()
	}, 15000)
}

// 处理失窃警告
const handleTheftWarning = async (warning) => {
	// 获取当前用户信息
	const userInfo = uni.getStorageSync('userInfo') || {}
	const currentPhone = userInfo.phone

	if (warning.status === 'confirmed') {
		// 已确认失窃，询问是否已解决
		uni.showModal({
			title: '失窃事件处理',
			content: '该失窃事件是否已解决？',
			confirmText: '已解决',
			cancelText: '未解决',
			success: async (res) => {
				if (res.confirm) {
					try {
						await cabinetApi.handleTheftWarning(warning.id, 'resolve')
						// 刷新警告列表
						await loadTheftWarnings()
						uni.showToast({
							title: '失窃事件已解决',
							icon: 'success'
						})
					} catch (error) {
						console.error('解决失窃事件失败:', error)
						uni.showToast({
							title: '操作失败',
							icon: 'none'
						})
					}
				}
			}
		})
	} else {
		// 未确认，询问是意外取出还是确认失窃
		// 判断当前用户是存件人还是取件人
		let userRole = ''
		if (currentPhone === warning.senderPhone) {
			userRole = '存件人'
		} else if (currentPhone === warning.recipientPhone) {
			userRole = '取件人'
		} else {
			userRole = '用户'
		}

		uni.showModal({
			title: '失窃警告处理',
			content: `检测到${warning.cabinetName}的物品可能失窃\n\n您是${userRole}，请选择处理方式：`,
			confirmText: '意外取出',
			cancelText: '确认失窃',
			success: async (res) => {
				if (res.confirm) {
					// 意外取出：解除警告
					try {
						await cabinetApi.handleTheftWarning(warning.id, 'dismiss')
						// 刷新警告列表
						await loadTheftWarnings()
						uni.showToast({
							title: '警告已解除',
							icon: 'success'
						})
					} catch (error) {
						console.error('解除失窃警告失败:', error)
						uni.showToast({
							title: '操作失败',
							icon: 'none'
						})
					}
				} else if (res.cancel) {
					// 确认失窃：保留警告
					try {
						await cabinetApi.handleTheftWarning(warning.id, 'confirm')
						// 刷新警告列表
						await loadTheftWarnings()
						uni.showToast({
							title: '已确认为失窃',
							icon: 'none'
						})
					} catch (error) {
						console.error('确认失窃失败:', error)
						uni.showToast({
							title: '操作失败',
							icon: 'none'
						})
					}
				}
			}
		})
	}
}

// 格式化失窃时间
const formatTheftTime = (timeString) => {
	if (!timeString) return ''
	const date = new Date(timeString)
	const now = new Date()
	const diff = now - date

	const hours = Math.floor(diff / (1000 * 60 * 60))
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

	if (hours > 0) {
		return `${hours}小时${minutes}分钟前`
	} else if (minutes > 0) {
		return `${minutes}分钟前`
	} else {
		return '刚刚'
	}
}

// 附近智能柜数据（ID与cabinet-select保持一致）
const nearbyCabinets = ref([
	{
		id: 1,
		name: '天河城1号柜',
		address: '天河区天河路208号天河城B1层',
		distance: '300m',
		available: 12,
		total: 20
	},
	{
		id: 3,
		name: '正佳广场1号柜',
		address: '天河区天河路228号正佳广场1F',
		distance: '500m',
		available: 5,
		total: 22
	},
	{
		id: 5,
		name: '太古汇1号柜',
		address: '天河区天河路383号太古汇B2层',
		distance: '800m',
		available: 18,
		total: 20
	}
])

// 滚动展示栏数据
const bannerList = ref([
	{
		id: 1,
		image: '/static/icons/icon-1.png',
		text: '明日方舟-终末地 限时联名开启！'
	},
	{
		id: 2,
		image: '/static/icons/icon-2.png',
		text: '关于 华南师范大学 智能柜投放计划 的通知'
	},
	{
		id: 3,
		image: '/static/icons/icon-3.png',
		text: '广告位招租'
	}
])

// 处理Banner点击
const handleBannerClick = (item) => {
	console.log('Banner clicked:', item)
}

onLoad(() => {
	userInfo.value = uni.getStorageSync('userInfo') || {}
	sceneType.value = uni.getStorageSync('sceneType') || 'delivery'

	// 加载失窃警告
	loadTheftWarnings()

	// 开始轮询失窃警告
	startWarningPolling()
})

onShow(() => {
	loadStatistics()
	// 刷新失窃警告
	loadTheftWarnings()
	// 隐藏原生tabbar
	uni.hideTabBar({
		animation: false
	})
})

onUnload(() => {
	// 清除轮询定时器
	if (warningPollingTimer) {
		clearInterval(warningPollingTimer)
		warningPollingTimer = null
	}
})

// 存件操作 - 先跳转到选择智能柜页面
const handleStore = () => {
	uni.navigateTo({
		url: '/pages/cabinet-select/cabinet-select'
	})
}

// 取件操作 - 跳转到取件页面
const handlePickup = () => {
	uni.navigateTo({
		url: '/pages/pickup/pickup'
	})
}

// 跳转到附近智能柜
const goToNearby = () => {
	uni.navigateTo({
		url: '/pages/cabinet-select/cabinet-select'
	})
}

// 选择智能柜
const selectCabinet = (cabinet) => {
	// 智能柜完整数据（用于补全信息）
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

	// 根据ID获取完整的智能柜数据
	const fullCabinet = cabinetsList.find(c => c.id === cabinet.id)
	if (fullCabinet) {
		cabinet = { ...cabinet, ...fullCabinet }
	}

	// 保存选中的智能柜信息
	uni.setStorageSync('selectedCabinet', cabinet)
	// 跳转到智能柜详情页面
	uni.navigateTo({
		url: '/pages/cabinet-detail/cabinet-detail'
	})
}
</script>

<style lang="scss" scoped>
/* ==================== 颜色变量 - 标准配色方案 ==================== */
/* 主色调 - 浅绿色 */
$primary: #A5D63F;           /* 主色：浅绿色 */
$primary-dark: #8BC34A;      /* 深绿色 */
$primary-light: #E8F5E9;     /* 浅绿背景 */
$primary-faded: rgba(165, 214, 63, 0.12); /* 淡化主色 */

/* 背景色系 */
$background: #FFFFFF;        /* 背景：白色 */
$surface: #F5F7FA;           /* 表面：浅灰蓝 */
$surface-variant: #F0F2F5;   /* 表面变体 */

/* 文字颜色 - 符合WCAG对比度标准 */
$on-background: #2C3E50;     /* 主要文字：深灰 */
$on-surface: #5A6A7A;        /* 次要文字：中灰 */
$on-surface-variant: #9CA3AF;/* 三级文字：浅灰 */
$on-surface-light: #BDC3C7;  /* 浅色文字 */

/* 边框色系 */
$outline: #E5E7EB;           /* 主要边框 */
$outline-light: #F3F4F6;     /* 浅边框 */

/* 点睛色 */
$accent-red: #FF6B6B;        /* 柔和红：警告、错误 */
$accent-blue: #4A90E2;       /* 蓝色：链接、信息 */
$accent-orange: #FFA500;     /* 橙色：提醒、注意 */
$accent-teal: #00B894;       /* 青色：成功状态 */

/* 阴影 */
$shadow-xs: 0 2rpx 4rpx rgba(0, 0, 0, 0.04);
$shadow-sm: 0 4rpx 8rpx rgba(0, 0, 0, 0.06);
$shadow-md: 0 8rpx 16rpx rgba(0, 0, 0, 0.08);
$shadow-lg: 0 16rpx 32rpx rgba(0, 0, 0, 0.10);

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
$font-size-2xl: 42rpx;

$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

/* ==================== 容器 ==================== */
.container {
	min-height: 100vh;
	background: $background;
	position: relative;
	overflow: hidden;

	/* 顶部柔和渐变装饰 */
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 480rpx;
		background: linear-gradient(180deg, rgba(165, 214, 63, 0.06) 0%, rgba(255, 255, 255, 0) 100%);
		border-radius: 0 0 80rpx 80rpx;
		z-index: 0;
	}

	/* 右上角几何装饰 - 圆形 */
	&::after {
		content: '';
		position: absolute;
		top: 120rpx;
		right: -60rpx;
		width: 200rpx;
		height: 200rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(165, 214, 63, 0.15) 0%, rgba(139, 195, 74, 0.08) 100%);
		z-index: 0;
	}
}

.content {
	padding: $spacing-4 $spacing-3;
	position: relative;
	z-index: 1;
}

/* ==================== 顶部打招呼区域 ==================== */
.header {
	margin-bottom: $spacing-6;
	padding-top: $spacing-2;

	.greeting-section {
		display: flex;
		flex-direction: column;
		gap: $spacing-2;

		.greeting {
			font-size: $font-size-lg;
			font-weight: $font-weight-normal;
			color: $on-surface-variant;
			line-height: 1.5;
			letter-spacing: 1rpx;
			opacity: 0.85;
		}

		.app-title {
			font-size: $font-size-2xl;
			font-weight: $font-weight-medium;
			color: $on-background;
			line-height: 1.3;
			letter-spacing: 2rpx;
		}
	}
}

/* ==================== 快捷操作按钮 ==================== */
.quick-actions {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: $spacing-3;
	margin-bottom: $spacing-4;
}

.action-btn {
	background: $surface;
	border-radius: $radius-2xl;
	padding: $spacing-5 $spacing-3;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-3;
	border: 1.5rpx solid $outline-light;
	transition: all 0.2s ease-out;
	position: relative;
	overflow: hidden;
	box-shadow: $shadow-sm;

	/* 毛玻璃背景装饰 */
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(165, 214, 63, 0.04) 0%, rgba(232, 245, 233, 0.02) 100%);
		transition: opacity 0.2s ease;
		border-radius: $radius-2xl;
	}

	&:active {
		transform: translateY(2rpx);
		border-color: $primary;
		box-shadow: $shadow-md;

		&::before {
			opacity: 1;
		}
	}

	&.store-btn {
		.action-label {
			color: $primary-dark;
		}

		.action-icon {
			.icon-placeholder {
				background: linear-gradient(135deg, rgba(165, 214, 63, 0.15) 0%, rgba(232, 245, 233, 0.1) 100%);
				border: 1.5rpx solid rgba(165, 214, 63, 0.2);
			}
		}
	}

	&.pickup-btn {
		.action-label {
			color: $accent-orange;
		}

		.action-icon {
			.icon-placeholder {
				background: linear-gradient(135deg, rgba(255, 165, 0, 0.15) 0%, rgba(255, 165, 0, 0.1) 100%);
				border: 1.5rpx solid rgba(255, 165, 0, 0.3);
			}
		}
	}

	.action-label {
		font-size: $font-size-2xl;
		font-weight: $font-weight-semibold;
		line-height: 1;
		position: relative;
		z-index: 1;
		letter-spacing: 2rpx;
	}

	.action-icon {
		width: 120rpx;
		height: 120rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		z-index: 1;

		.icon-placeholder {
			width: 100rpx;
			height: 100rpx;
			/* 占位符样式，实际使用时替换为图片 */
			border-radius: $radius-lg;
		}
	}
}

/* ==================== 统计区域 ==================== */
.stats-section {
	background: $surface;
	border-radius: $radius-2xl;
	padding: $spacing-4;
	margin-bottom: $spacing-4;
	border: 1.5rpx solid $outline-light;
	box-shadow: $shadow-sm;
	position: relative;
	overflow: hidden;

	/* 顶部极简线条装饰 */
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: linear-gradient(90deg, $primary 0%, $primary-light 100%);
		opacity: 0.6;
	}
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: $spacing-3;
	position: relative;
	z-index: 1;
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: $spacing-3;
	border-radius: $radius-lg;
	transition: all 0.2s ease-out;
	background: $surface-variant;

	&:active {
		transform: scale(0.98);
		background: $surface;
	}

	.stat-number {
		font-size: $font-size-2xl;
		font-weight: $font-weight-bold;
		color: $primary;
		margin-bottom: $spacing-1;
		line-height: 1.2;
	}

	.stat-label {
		font-size: $font-size-xs;
		color: $on-surface-variant;
		line-height: 1.4;
		font-weight: $font-weight-normal;
	}
}

/* ==================== 失窃警告 ==================== */
.theft-warning-section {
	margin-bottom: $spacing-4;
}

.theft-warning-card {
	background: linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 107, 107, 0.05) 100%);
	border-radius: $radius-2xl;
	padding: $spacing-4;
	margin-bottom: $spacing-3;
	border: 2rpx solid rgba(255, 107, 107, 0.3);
	box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.15);
	position: relative;
	overflow: hidden;

	/* 红色高斯模糊背景效果 */
	&::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255, 107, 107, 0.1) 0%, transparent 70%);
		animation: warning-pulse 3s ease-in-out infinite;
	}

	@keyframes warning-pulse {
		0%, 100% {
			opacity: 0.5;
			transform: scale(1);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.1);
		}
	}
}

.warning-header {
	display: flex;
	align-items: center;
	gap: $spacing-3;
	margin-bottom: $spacing-3;
	position: relative;
	z-index: 1;
}

.warning-icon-wrapper {
	width: 56rpx;
	height: 56rpx;
	background: rgba(255, 107, 107, 0.2);
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.warning-icon {
	width: 32rpx;
	height: 32rpx;
}

.warning-title-wrapper {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-1;
}

.warning-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	color: #FF6B6B;
	line-height: 1.5;
}

.warning-time {
	font-size: $font-size-sm;
	color: $accent-red;
	line-height: 1.5;
}

.warning-status-badge {
	padding: $spacing-1 $spacing-2;
	border-radius: $radius-md;
	flex-shrink: 0;
	
	&.active {
		background: rgba(255, 165, 0, 0.2);
		border: 2rpx solid $accent-orange;
	}
	
	&.confirmed {
		background: rgba(255, 107, 107, 0.2);
		border: 2rpx solid $accent-red;
	}

	.status-badge-text {
		font-size: $font-size-xs;
		font-weight: $font-weight-semibold;
		color: $accent-red;
		line-height: 1.5;
	}
}

.warning-content {
	background: rgba(255, 255, 255, 0.6);
	border-radius: $radius-lg;
	padding: $spacing-3;
	position: relative;
	z-index: 1;
	border: 1rpx solid rgba(255, 107, 107, 0.2);
	margin-bottom: $spacing-3;
}

.warning-hint {
	background: rgba(255, 107, 107, 0.1);
	border-radius: $radius-md;
	padding: $spacing-2;
	position: relative;
	z-index: 1;
	border: 1rpx solid rgba(255, 107, 107, 0.2);
	text-align: center;

	.hint-text {
		font-size: $font-size-sm;
		color: $accent-red;
		line-height: 1.5;
		font-weight: $font-weight-medium;
	}
}

.warning-info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: $spacing-1 0;

	&:not(:last-child) {
		border-bottom: 1rpx solid rgba(255, 107, 107, 0.1);
	}

	.info-label {
		font-size: $font-size-sm;
		color: $accent-red;
		line-height: 1.5;
	}

	.info-value {
		font-size: $font-size-sm;
		color: $on-background;
		font-weight: $font-weight-medium;
		line-height: 1.5;

		&.code-text {
			font-family: monospace;
			color: #FF6B6B;
		}
	}
}

/* ==================== 滚动展示栏 ==================== */
.scroll-banner {
	margin-bottom: $spacing-4;
}

.banner-swiper {
	width: 100%;
	height: 220rpx;
	border-radius: $radius-2xl;
	overflow: hidden;
}

.banner-item {
	width: 100%;
	height: 100%;
	background: $primary-light;
	border-radius: $radius-2xl;
	border: 1.5rpx solid $outline-light;
	box-shadow: $shadow-sm;
	display: flex;
	align-items: center;
	padding: 0 $spacing-4;
	transition: all 0.2s ease-out;
	position: relative;

	/* 背景装饰 */
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(165, 214, 63, 0.08) 0%, rgba(232, 245, 233, 0.04) 100%);
		transition: opacity 0.2s ease;
		border-radius: $radius-2xl;
	}

	&:active {
		transform: translateY(2rpx);
		border-color: $primary;
		box-shadow: $shadow-md;

		&::before {
			opacity: 1;
		}
	}
}

.banner-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: $spacing-4;
	flex-shrink: 0;
	overflow: hidden;
	background: transparent;
	position: relative;
	z-index: 1;

	.banner-img {
		width: 100%;
		height: 100%;
	}
}

.banner-text {
	flex: 1;
	font-size: $font-size-lg;
	color: $on-background;
	font-weight: $font-weight-semibold;
	line-height: 1.3;
	text-align: left;
	letter-spacing: 0.5rpx;
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	overflow: hidden;
	word-wrap: break-word;
}

/* ==================== 附近智能柜 ==================== */
.nearby-section {
	margin-bottom: $spacing-3;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $spacing-4;

	.section-title {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $on-background;
		letter-spacing: 1rpx;
	}

	.view-more {
		display: flex;
		align-items: center;
		gap: $spacing-1;
		padding: $spacing-1 $spacing-3;
		border-radius: 50rpx;
		background: $surface;
		border: 1.5rpx solid $outline-light;
		transition: all 0.2s ease-out;
		box-shadow: $shadow-xs;

		&:active {
			background: $surface-variant;
			transform: translateY(2rpx);
			box-shadow: $shadow-sm;
		}

		.view-more-text {
			font-size: $font-size-sm;
			color: $primary-dark;
			font-weight: $font-weight-semibold;
			letter-spacing: 0.5rpx;
			line-height: 1.5;
		}

		.view-more-arrow {
			font-size: $font-size-lg;
			color: $primary-dark;
			line-height: 1;
			font-weight: $font-weight-normal;
		}
	}
}

.cabinet-list {
	display: flex;
	flex-direction: column;
	gap: $spacing-3;
	padding-bottom: 180rpx;
}

.cabinet-card {
	background: $surface;
	border-radius: $radius-2xl;
	padding: $spacing-4;
	border: 1.5rpx solid $outline-light;
	transition: all 0.2s ease-out;
	position: relative;
	overflow: hidden;
	box-shadow: $shadow-sm;

	/* 左侧装饰条 */
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: 5rpx;
		background: linear-gradient(180deg, $primary 0%, $primary-dark 100%);
		opacity: 0;
		transition: opacity 0.2s ease;
		border-radius: $radius-2xl 0 0 $radius-2xl;
	}

	&:active {
		transform: translateY(2rpx);
		border-color: $primary;
		box-shadow: $shadow-md;

		&::before {
			opacity: 1;
		}
	}

	.cabinet-info {
		position: relative;
		z-index: 1;
	}

	.cabinet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-2;

		.cabinet-name {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $on-background;
		letter-spacing: 0.5rpx;
	}

		.distance-badge {
			display: flex;
			align-items: center;
			gap: $spacing-1;
			padding: $spacing-1 $spacing-3;
			border-radius: 50rpx;
			background: $surface-variant;
			border: 1rpx solid $outline;

			.location-mini-icon {
				width: 18rpx;
				height: 18rpx;
			}

			.distance-text {
				font-size: $font-size-xs;
				color: $accent-orange;
				font-weight: $font-weight-medium;
				letter-spacing: 0.5rpx;
			}
		}
	}

	.cabinet-address {
		font-size: $font-size-sm;
		color: $on-surface-variant;
		display: block;
		margin-bottom: $spacing-3;
		line-height: 1.6;
		padding-left: $spacing-1;
		font-weight: $font-weight-normal;
	}

	.cabinet-stats {
		display: flex;
		gap: $spacing-2;

		.stat-tag {
			display: flex;
			align-items: center;
			gap: $spacing-1;
			padding: $spacing-1 $spacing-3;
			border-radius: 50rpx;
			background: $surface-variant;
			border: 1rpx solid $outline;

			&.available {
				.stat-label {
					font-size: $font-size-xs;
					color: $on-surface-variant;
					font-weight: $font-weight-normal;
				}

				.stat-value {
					font-size: $font-size-sm;
					color: $primary-dark;
					font-weight: $font-weight-medium;
				}
			}
		}
	}
}
</style>
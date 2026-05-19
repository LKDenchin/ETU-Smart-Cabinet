<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="back-btn" @click="goBack">
					<text class="back-icon">←</text>
				</view>
				<text class="nav-title">设置</text>
				<view class="placeholder"></view>
			</view>
		</view>
		
		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: navbarHeight + 'px' }">
			<!-- 界面设置 -->
			<view class="settings-card">
				<view class="card-header">
					<text class="card-title">界面设置</text>
				</view>
				<view class="settings-item" @click="goToThemeSettings">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-ui.png" mode="aspectFit"></image>
						<text class="item-label">应用主题</text>
					</view>
					<text class="item-value">{{ currentTheme }}</text>
				</view>
				<view class="settings-item">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-dark.png" mode="aspectFit"></image>
						<text class="item-label">夜间模式</text>
					</view>
					<switch
						:checked="settings.darkMode"
						@change="onDarkModeChange"
						color="#A5D63F"
					/>
				</view>
			</view>

			<!-- 功能设置 -->
			<view class="settings-card">
				<view class="card-header">
					<text class="card-title">功能设置</text>
				</view>
				<view class="settings-item">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-nfc.png" mode="aspectFit"></image>
						<text class="item-label">NFC 碰一碰取件</text>
					</view>
					<switch
						:checked="settings.nfcPickup"
						@change="onNfcPickupChange"
						color="#A5D63F"
					/>
				</view>
				<view class="settings-item" @click="goToCabinetSettings">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-component.png" mode="aspectFit"></image>
						<text class="item-label">智能柜管理</text>
					</view>
					<text class="item-arrow">→</text>
				</view>
			</view>

			<!-- 通知设置 -->
			<view class="settings-card">
				<view class="card-header">
					<text class="card-title">通知设置</text>
				</view>
				<view class="settings-item">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-notification.png" mode="aspectFit"></image>
						<text class="item-label">存件提醒</text>
					</view>
					<switch
						:checked="settings.storeNotification"
						@change="onStoreNotificationChange"
						color="#A5D63F"
					/>
				</view>
				<view class="settings-item">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-notification.png" mode="aspectFit"></image>
						<text class="item-label">取件提醒</text>
					</view>
					<switch
						:checked="settings.pickupNotification"
						@change="onPickupNotificationChange"
						color="#A5D63F"
					/>
				</view>
				<view class="settings-item">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-info.png" mode="aspectFit"></image>
						<text class="item-label">营销通知</text>
					</view>
					<switch
						:checked="settings.marketingNotification"
						@change="onMarketingNotificationChange"
						color="#A5D63F"
					/>
				</view>
			</view>

			<!-- 隐私设置 -->
			<view class="settings-card">
				<view class="card-header">
					<text class="card-title">隐私设置</text>
				</view>
				<view class="settings-item">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-location1.png" mode="aspectFit"></image>
						<text class="item-label">位置信息</text>
					</view>
					<switch
						:checked="settings.locationPermission"
						@change="onLocationPermissionChange"
						color="#A5D63F"
					/>
				</view>
				<view class="settings-item">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-info1.png" mode="aspectFit"></image>
						<text class="item-label">使用统计</text>
					</view>
					<switch
						:checked="settings.analyticsPermission"
						@change="onAnalyticsPermissionChange"
						color="#A5D63F"
					/>
				</view>
			</view>

			<!-- 内容设置 -->
			<view class="settings-card">
				<view class="card-header">
					<text class="card-title">内容设置</text>
				</view>
				<view class="settings-item" @click="goToCommunitySettings">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-community.png" mode="aspectFit"></image>
						<text class="item-label">社区内容筛选</text>
					</view>
					<text class="item-arrow">→</text>
				</view>
				<view class="settings-item" @click="goToMyCustomizations">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-customize.png" mode="aspectFit"></image>
						<text class="item-label">我的定制</text>
					</view>
					<text class="item-arrow">→</text>
				</view>
			</view>

			<!-- 其他设置 -->
			<view class="settings-card">
				<view class="card-header">
					<text class="card-title">其他设置</text>
				</view>
				<view class="settings-item" @click="clearCache">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-trash.png" mode="aspectFit"></image>
						<text class="item-label">清除缓存</text>
					</view>
					<text class="item-value">{{ cacheSize }}</text>
				</view>
				<view class="settings-item" @click="checkUpdate">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-refresh.png" mode="aspectFit"></image>
						<text class="item-label">检查更新</text>
					</view>
					<text class="item-value">v1.0.0</text>
				</view>
				<view class="settings-item" @click="about">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-info.png" mode="aspectFit"></image>
						<text class="item-label">关于我们</text>
					</view>
					<text class="item-arrow">→</text>
				</view>
				<view class="settings-item" @click="checkAdminStatus">
					<view class="item-left">
						<image class="item-icon" src="/static/icons/icon-user.png" mode="aspectFit"></image>
						<text class="item-label">管理员状态测试</text>
					</view>
					<text class="item-arrow">→</text>
				</view>
			</view>

			<!-- 退出登录 -->
			<view class="logout-section">
				<button class="logout-btn" @click="logout">退出登录</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { userApi } from '../../utils/request.js'

// 响应式数据
const statusBarHeight = ref(0)
const navbarHeight = ref(0)
const currentTheme = ref('默认主题')
const cacheSize = ref('0 MB')
const settings = ref({
	darkMode: false,
	nfcPickup: true,
	storeNotification: true,
	pickupNotification: true,
	marketingNotification: false,
	locationPermission: true,
	analyticsPermission: true
})

onLoad(() => {
	// 获取状态栏高度
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44
	navbarHeight.value = statusBarHeight.value + 88

	// 计算缓存大小
	calculateCacheSize()
})

onShow(() => {
	loadSettings()
	loadCurrentTheme()
})

// 加载设置
const loadSettings = () => {
	const savedSettings = uni.getStorageSync('appSettings')
	if (savedSettings) {
		settings.value = { ...settings.value, ...savedSettings }
	}
}

// 加载当前主题
const loadCurrentTheme = () => {
	const theme = uni.getStorageSync('appTheme')
	if (theme) {
		currentTheme.value = theme.name || '默认主题'
	}
}

// 保存设置
const saveSettings = () => {
	uni.setStorageSync('appSettings', settings.value)
}

// 计算缓存大小
const calculateCacheSize = () => {
	// 模拟计算缓存大小
	const history = uni.getStorageSync('history') || []
	const customizations = uni.getStorageSync('customizations') || []
	const size = (history.length + customizations.length) * 0.1
	cacheSize.value = size.toFixed(1) + ' MB'
}

// 夜间模式开关
const onDarkModeChange = (e) => {
	settings.value.darkMode = e.detail.value
	saveSettings()

	if (settings.value.darkMode) {
		uni.showToast({
			title: '夜间模式已开启',
			icon: 'success'
		})
	} else {
		uni.showToast({
			title: '夜间模式已关闭',
			icon: 'success'
		})
	}
}

// NFC 取件开关
const onNfcPickupChange = (e) => {
	settings.value.nfcPickup = e.detail.value
	saveSettings()

	if (settings.value.nfcPickup) {
		uni.showToast({
			title: 'NFC 碰一碰取件已开启',
			icon: 'success'
		})
	} else {
		uni.showToast({
			title: 'NFC 碰一碰取件已关闭',
			icon: 'success'
		})
	}
}

// 存件提醒开关
const onStoreNotificationChange = (e) => {
	settings.value.storeNotification = e.detail.value
	saveSettings()
}

// 取件提醒开关
const onPickupNotificationChange = (e) => {
	settings.value.pickupNotification = e.detail.value
	saveSettings()
}

// 营销通知开关
const onMarketingNotificationChange = (e) => {
	settings.value.marketingNotification = e.detail.value
	saveSettings()
}

// 位置权限开关
const onLocationPermissionChange = (e) => {
	settings.value.locationPermission = e.detail.value
	saveSettings()
}

// 统计权限开关
const onAnalyticsPermissionChange = (e) => {
	settings.value.analyticsPermission = e.detail.value
	saveSettings()
}

// 跳转到主题设置
const goToThemeSettings = () => {
	uni.navigateTo({
		url: '/pages/app-themes/app-themes'
	})
}

// 跳转到智能柜管理
const goToCabinetSettings = () => {
	uni.navigateTo({
		url: '/pages/cabinet-themes/cabinet-themes'
	})
}

// 跳转到社区设置
const goToCommunitySettings = () => {
	uni.showActionSheet({
		itemList: ['讨论', '反馈', '活动', '精选'],
		success: (res) => {
			const pages = ['/pages/discussion/discussion', '/pages/feedback/feedback', '/pages/activity/activity', '/pages/community/community']
			uni.navigateTo({
				url: pages[res.tapIndex]
			})
		}
	})
}

// 跳转到我的定制
const goToMyCustomizations = () => {
	uni.navigateTo({
		url: '/pages/my-customizations/my-customizations'
	})
}

// 清除缓存
const clearCache = () => {
	uni.showModal({
		title: '确认清除',
		content: '确定要清除所有缓存数据吗？',
		success: (res) => {
			if (res.confirm) {
				// 保留用户信息和设置，清除其他数据
				const userInfo = uni.getStorageSync('userInfo')
				const appSettings = uni.getStorageSync('appSettings')
				const appTheme = uni.getStorageSync('appTheme')
				uni.clearStorageSync()
				uni.setStorageSync('userInfo', userInfo)
				uni.setStorageSync('appSettings', appSettings)
				uni.setStorageSync('appTheme', appTheme)
				uni.setStorageSync('history', [])

				// 重新计算缓存大小
				calculateCacheSize()

				uni.showToast({
					title: '清除成功',
					icon: 'success'
				})
			}
		}
	})
}

// 检查更新
const checkUpdate = () => {
	uni.showToast({
		title: '已是最新版本',
		icon: 'none'
	})
}

// 关于我们
const about = () => {
	uni.showModal({
		title: '关于我们',
		content: '易取宝管理系统 v1.0.0\n\n为用户提供便捷的外卖柜和智能柜服务。',
		showCancel: false
	})
}

// 测试管理员状态
const checkAdminStatus = async () => {
	try {
		uni.showLoading({
			title: '检查中...'
		})

		const debugInfo = await userApi.getDebugInfo()

		uni.hideLoading()

		uni.showModal({
			title: '管理员状态测试',
			content: `
用户信息：
手机号：${debugInfo.userInfo.phone}
昵称：${debugInfo.userInfo.nickname}
当前管理员：${debugInfo.userInfo.is_admin ? '是' : '否'}

管理员判断：
手机号全相同：${debugInfo.adminCheck.isAllSameDigits ? '是' : '否'}
昵称包含 lk/LK：${debugInfo.adminCheck.hasLKInNickname ? '是' : '否'}
应该是管理员：${debugInfo.adminCheck.shouldBeAdmin ? '是' : '否'}
当前是管理员：${debugInfo.adminCheck.currentIsAdmin ? '是' : '否'}

Token 信息：
isAdmin：${debugInfo.tokenInfo.isAdmin}
`.trim(),
			showCancel: false
		})
	} catch (error) {
		uni.hideLoading()
		console.error('检查管理员状态失败:', error)
		uni.showToast({
			title: '检查失败，请重试',
			icon: 'none'
		})
	}
}

// 退出登录
const logout = () => {
	uni.showModal({
		title: '确认退出',
		content: '确定要退出登录吗？',
		success: (res) => {
			if (res.confirm) {
				// 清除用户信息
				uni.removeStorageSync('userInfo')
				uni.removeStorageSync('sceneType')
				
				uni.showToast({
					title: '已退出登录',
					icon: 'success'
				})
				
				// 跳转到登录页面
				setTimeout(() => {
					uni.reLaunch({
						url: '/pages/login/login'
					})
				}, 1500)
			}
		}
	})
}

// 返回上一页
const goBack = () => {
	uni.navigateBack()
}
</script>

<style lang="scss" scoped>
/* ==================== 3.jpg精确设计规范 ==================== */
$primary: #A5D63F;
$primary-dark: #8BC34A;
$primary-light: #E8F5E9;

/* 3.jpg配色 */
$page-bg: #F5F5F5;
$card-bg: #FFFFFF;
$card-header-bg: #F5F5F5;
$text-primary: #000000;
$text-secondary: #999999;
$text-tertiary: #757575;
$icon-arrow: #CCCCCC;

/* 退出登录 */
$logout-text: #FF3B30;
$logout-active-bg: #FFE5E5;

/* 边框 */
$border-color: #F0F0F0;
$border-divider: #F0F0F0;

$shadow-xs: 0 2rpx 4rpx rgba(0, 0, 0, 0.04);
$shadow-sm: 0 4rpx 8rpx rgba(0, 0, 0, 0.06);
$shadow-md: 0 8rpx 16rpx rgba(0, 0, 0, 0.08);

$spacing-1: 8rpx;
$spacing-2: 16rpx;
$spacing-3: 24rpx;
$spacing-4: 32rpx;
$spacing-5: 40rpx;

/* 3.jpg圆角规范 */
$radius-card: 24rpx;
$radius-btn-std: 16rpx;
$radius-btn-lg: 20rpx;

/* 3.jpg字体规范 */
$font-size-xs: 22rpx;
$font-size-sm: 24rpx;
$font-size-base: 28rpx;
$font-size-lg: 32rpx;
$font-size-xl: 36rpx;
$font-size-2xl: 38rpx; /* 3.jpg导航栏标题 */

/* 3.jpg字重规范 */
$font-weight-normal: 400;  /* 正文 */
$font-weight-medium: 500;  /* 标签 */
$font-weight-semibold: 600; /* 标题、按钮 */

.container {
	min-height: 100vh;
	background: $page-bg; /* 3.jpg页面背景 */
}

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
	background: transparent; /* 3.jpg: 透明背景 */
	transition: all 0.2s ease-out;

	&:active {
		background: rgba(0, 0, 0, 0.05);
		transform: translateY(2rpx);
	}

	.back-icon {
		font-size: 48rpx;
		color: $text-primary; /* 3.jpg: #000000 */
		font-weight: 300;
	}}

.nav-title {
	font-size: $font-size-2xl; /* 3.jpg: 38rpx */
	font-weight: $font-weight-semibold;
	color: $text-primary; /* 3.jpg: #000000 */
	line-height: 1.5;
}

.placeholder {
	width: 48rpx;
	height: 48rpx;
}

.content {
	padding: $spacing-3 $spacing-4; /* 3.jpg: 左右20pt(40rpx) */
}

.settings-card {
	background: $card-bg;
	border-radius: $radius-card; /* 3.jpg: 24rpx */
	margin-bottom: $spacing-3; /* 3.jpg: 卡片间距32rpx */
	overflow: hidden;
	/* 3.jpg: 无阴影无边框 */
}

.card-header {
	padding: $spacing-3 $spacing-4; /* 3.jpg: 上下16pt(32rpx)左右20pt(40rpx) */
	background: $card-header-bg;
	border-bottom: 1rpx solid $border-divider;

	.card-title {
		font-size: $font-size-base;
		font-weight: $font-weight-normal; /* 3.jpg: 400 */
		color: $text-primary;
		line-height: 1.5;
	}
}

.settings-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	min-height: 112rpx; /* 3.jpg: 56pt(112rpx) */
	padding: $spacing-3 $spacing-4; /* 3.jpg: 上下12pt(24rpx)+16pt=28rpx，左右20pt(40rpx) */
	border-bottom: 1rpx solid $border-divider;
	transition: all 0.2s ease-out;

	&:last-child {
		border-bottom: none;
	}

	&:active {
		background: $card-header-bg; /* 3.jpg: #F5F5F5 */
	}

	.item-left {
		display: flex;
		align-items: center;
		gap: $spacing-2;
		flex: 1;

		.item-icon {
			width: 32rpx;
			height: 32rpx;
		}

		.item-label {
			font-size: $font-size-lg; /* 3.jpg: 32rpx */
			color: $text-primary; /* 3.jpg: #000000 */
			line-height: 1.5;
			font-weight: $font-weight-normal; /* 3.jpg: 400 */
		}
	}

	.item-arrow {
		font-size: 20rpx;
		color: $icon-arrow; /* 3.jpg: #CCCCCC */
		line-height: 1;
		font-weight: $font-weight-normal;
	}

	.item-value {
		font-size: $font-size-base; /* 3.jpg: 28rpx */
		color: $text-secondary; /* 3.jpg: #999999 */
		line-height: 1.5;
	}
}

.logout-section {
	margin-top: $spacing-4; /* 3.jpg: 退出登录前加24pt(48rpx)间距 */
}

.logout-btn {
	width: 100%;
	height: 80rpx;
	background: $card-bg; /* 3.jpg: 白色背景 */
	border: none;
	color: $logout-text; /* 3.jpg: #FF3B30 */
	border-radius: $radius-card; /* 3.jpg: 24rpx */
	padding: 0;
	font-size: $font-size-xl; /* 3.jpg: 36rpx */
	font-weight: $font-weight-semibold;
	line-height: 1.5;
	transition: all 0.2s ease-out;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	display: flex;
	align-items: center;
	justify-content: center;

	&:active {
		background: $logout-active-bg; /* 3.jpg: #FFE5E5 */
		transform: translateY(2rpx);
	}
}
</style>
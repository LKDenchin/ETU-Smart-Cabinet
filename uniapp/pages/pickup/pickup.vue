<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">我要取件</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 取件方式选择 -->
			<view class="method-tabs">
				<view
					class="tab-item"
					:class="{ active: pickupMethod === 'code' }"
					@click="pickupMethod = 'code'"
				>
					<text class="tab-text">取件码取件</text>
				</view>
				<view
					class="tab-item"
					:class="{ active: pickupMethod === 'phone' }"
					@click="pickupMethod = 'phone'"
				>
					<text class="tab-text">手机号取件</text>
				</view>
				<view
					class="tab-item"
					:class="{ active: pickupMethod === 'nfc' }"
					@click="goToNFCPickup"
				>
					<text class="tab-text">碰一碰取件</text>
				</view>
			</view>

			<!-- 取件码取件 -->
			<view class="pickup-card" v-if="pickupMethod === 'code' && !showPackagesList">
				<view class="card-header">
					<image class="header-icon" src="/static/icons/icon-pickup.png" mode="aspectFit"></image>
					<text class="header-title">输入取件码</text>
				</view>

				<view class="pickup-form">
					<view class="form-item">
						<text class="form-label">取件码</text>
						<view class="input-wrapper">
							<input
								class="form-input code-input"
								v-model="pickupCodeInput"
								type="number"
								maxlength="6"
								placeholder="请输入6位取件码"
								placeholder-class="input-placeholder"
							/>
						</view>
					</view>

					<button class="pickup-btn" @click="handlePickupByCode" :disabled="!isCodeValid">
						<text class="btn-text">立即取件</text>
					</button>
				</view>
			</view>

			<!-- 手机号取件 -->
			<view class="pickup-card" v-if="pickupMethod === 'phone' && !showPackagesList">
				<view class="card-header">
					<image class="header-icon" src="/static/icons/icon-mobile.png" mode="aspectFit"></image>
					<text class="header-title">验证手机号</text>
				</view>

				<view class="pickup-form">
					<!-- 手机号 -->
					<view class="form-item">
						<text class="form-label">手机号码</text>
						<view class="input-wrapper">
							<input
								class="form-input"
								v-model="queryForm.phone"
								type="number"
								maxlength="11"
								placeholder="请输入手机号"
								placeholder-class="input-placeholder"
							/>
						</view>
					</view>

					<button class="pickup-btn" @click="handlePickupByPhone" :disabled="!isPhoneVerifyValid">
						<text class="btn-text">查询并取件</text>
					</button>
				</view>
			</view>

			<!-- 等待取出物品界面（隐藏，使用弹窗替代） -->
			<view class="waiting-pickup-card" v-if="false">
				<view class="waiting-animation">
					<view class="pulse-ring"></view>
					<view class="pulse-ring pulse-ring-2"></view>
					<image class="waiting-icon" src="/static/icons/icon-check.png" mode="aspectFit"></image>
				</view>
				<text class="waiting-title">请取出物品</text>
				<text class="waiting-subtitle">格位已打开</text>
				<text class="waiting-hint">请取出物品并关闭格位</text>
			</view>

			<!-- 等待取出物品弹窗 -->
			<view class="waiting-modal" v-if="isWaitingForPickup">
				<view class="modal-mask"></view>
				<view class="modal-content">
					<view class="modal-animation">
						<view class="pulse-ring"></view>
						<view class="pulse-ring pulse-ring-2"></view>
						<image class="modal-icon" src="/static/icons/icon-check.png" mode="aspectFit"></image>
					</view>
					<text class="modal-title">请取出物品</text>
					<text class="modal-subtitle">格位已打开</text>
					<text class="modal-hint">请取出物品并关闭格位</text>
				</view>
			</view>

			<!-- 包裹列表 -->
			<view class="packages-section" v-if="showPackagesList">
				<view class="packages-header">
					<text class="packages-title">找到 {{ packages.length }} 个包裹</text>
					<text class="packages-subtitle">请选择要取出的包裹</text>
				</view>

				<!-- 包裹列表 -->
				<view class="packages-list">
					<view
						class="package-card"
						v-for="(pkg, index) in packages"
						:key="pkg.id"
						:class="{ picked: pkg.pickedUp, stolen: pkg.isStolen }"
					>
						<view class="package-header">
							<view class="package-icon">
								<image src="/static/icons/icon-order.png" mode="aspectFit" />
							</view>
							<view class="package-info">
								<text class="package-cabinet">{{ pkg.cabinet }}</text>
								<text class="package-cell">柜位：{{ pkg.cellNumber }}</text>
							</view>
							<view class="package-status" :class="{ success: pkg.pickedUp, stolen: pkg.isStolen }">
								<text class="status-text">{{ pkg.pickedUp ? '已取出' : pkg.isStolen ? '已失窃' : '待取件' }}</text>
							</view>
						</view>

						<view class="package-details">
							<view class="detail-row">
								<text class="detail-label">存件时间</text>
								<text class="detail-value">{{ formatDate(pkg.createTime) }}</text>
							</view>
							<view class="detail-row" v-if="pkg.recipientInfo.remark">
								<text class="detail-label">备注</text>
								<text class="detail-value">{{ pkg.recipientInfo.remark }}</text>
							</view>
						</view>

						<!-- 确认取件按钮 -->
						<button
							class="pickup-btn"
							:class="{ disabled: pkg.pickedUp || pkg.isStolen }"
							@click="pickPackage(pkg)"
							:disabled="pkg.pickedUp || pkg.isStolen || isPicking"
						>
							<text class="btn-text">{{ pkg.pickedUp ? '已取出' : pkg.isStolen ? '已失窃' : '确认取件' }}</text>
						</button>
					</view>
				</view>

				<!-- 一键取件按钮 -->
				<button
					class="batch-pickup-btn"
					v-if="canBatchPickup"
					@click="batchPickup"
					:disabled="isPicking || allPicked"
				>
					<text class="btn-text">{{ isPicking ? '取件中...' : '一键取件' }}</text>
				</button>

				<!-- 返回按钮 -->
				<button class="back-btn" @click="goBackToMethod">
					<text class="btn-text">返回</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { cabinetApi } from '../../utils/request.js'

const statusBarHeight = ref(0)

// 取件方式
const pickupMethod = ref('code')

// 取件码输入
const pickupCodeInput = ref('')

// 手机号表单
const queryForm = ref({
	phone: ''
})

// 包裹列表
const showPackagesList = ref(false)
const packages = ref([])
const isPicking = ref(false)
// 等待取出物品
const isWaitingForPickup = ref(false)
// 轮询定时器
let pollingTimer = null
// 当前取件订单信息
const currentPickupOrder = ref(null)

// 计算属性
const isCodeValid = computed(() => {
	return pickupCodeInput.value.length === 6
})

const isPhoneVerifyValid = computed(() => {
	return queryForm.value.phone.length === 11
})

const canBatchPickup = computed(() => {
	const unpicked = packages.value.filter(pkg => !pkg.pickedUp && !pkg.isStolen)
	return unpicked.length >= 2
})

const allPicked = computed(() => {
	// 所有未失窃的订单都已取出
	return packages.value.filter(pkg => !pkg.isStolen).every(pkg => pkg.pickedUp)
})

onLoad(() => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44
})

// 页面显示时刷新数据
onShow(() => {
	// 如果显示了待取件列表，刷新待取件数据
	if (showPackagesList.value) {
		loadPendingPackages()
	}
})

// 页面卸载时清除定时器
onUnload(() => {
	clearPollingTimer()
})

// 返回
const goBack = () => {
	if (showPackagesList.value) {
		showPackagesList.value = false
		packages.value = []
	} else {
		uni.navigateBack()
	}
}

// 返回到取件方式选择
const goBackToMethod = () => {
	showPackagesList.value = false
	packages.value = []
}

// 跳转到碰一碰取件页面
const goToNFCPickup = () => {
	uni.navigateTo({
		url: '/pages/nfc-pickup/nfc-pickup'
	})
}

// 取件码取件
const handlePickupByCode = async () => {
	uni.showLoading({
		title: '打开格位中...'
	})

	try {
		// 调用只需要取件码的取件接口
		const result = await cabinetApi.pickupOrderByCode(pickupCodeInput.value)

		uni.hideLoading()

		// 存储当前取件订单信息
		currentPickupOrder.value = result

		// 切换到等待取出物品状态
		isWaitingForPickup.value = true

		// 开始轮询光电状态，等待用户取出物品
		startPollingForPickup()
	} catch (error) {
		uni.hideLoading()
		console.error('取件失败:', error)
		uni.showToast({
			title: '取件失败，请检查取件码',
			icon: 'none'
		})
	}
}

// 手机号取件
const handlePickupByPhone = async () => {
	if (queryForm.value.phone.length !== 11) {
		uni.showToast({
			title: '请输入正确的手机号',
			icon: 'none'
		})
		return
	}

	uni.showLoading({
		title: '查询中...'
	})

	try {
		const pendingOrders = await cabinetApi.getPendingOrders(queryForm.value.phone)

		uni.hideLoading()

		if (pendingOrders.length === 0) {
			uni.showToast({
				title: '未找到存件信息',
				icon: 'none'
			})
			return
		}

		// 转换数据格式
		const formattedRecords = pendingOrders.map(record => ({
			id: record.id,
			type: record.type,
			cabinet: record.cabinet_name,
			cabinetName: record.cabinet_name,
			cellNumber: record.cell_number,
			pickupCode: record.pickup_code,
			recipientInfo: {
				phone: record.recipient_phone,
				nickname: record.recipient_nickname,
				remark: record.recipient_remark
			},
			pickedUp: record.picked_up,
			isStolen: record.is_stolen || false,
			sceneType: record.scene_type,
			createTime: record.create_time
		}))

		// 显示包裹列表
		packages.value = formattedRecords
		showPackagesList.value = true
		uni.showToast({
			title: '查询成功',
			icon: 'success'
		})
	} catch (error) {
		uni.hideLoading()
		console.error('查询失败:', error)
	}
}

// 单独取件
const pickPackage = async (pkg) => {
	if (isPicking.value || pkg.pickedUp) {
		return
	}

	// 检查失窃状态
	if (pkg.isStolen) {
		uni.showModal({
			title: '无法取件',
			content: `该物品已失窃，无法通过正常流程取件\n\n智能柜：${pkg.cabinetName}\n格位：${pkg.cellNumber}\n取件码：${pkg.pickupCode}`,
			showCancel: false,
			confirmText: '知道了'
		})
		return
	}

	isPicking.value = true

	try {
		console.log('取件参数:', {
			pickupCode: pkg.pickupCode,
			phone: pkg.recipientInfo?.phone
		})

		await cabinetApi.createPickupOrder({
			pickupCode: pkg.pickupCode,
			phone: pkg.recipientInfo?.phone
		})

		// 更新本地包裹列表状态
		const pkgIndex = packages.value.findIndex(p => p.id === pkg.id)
		if (pkgIndex !== -1) {
			packages.value[pkgIndex].pickedUp = true
		}

		uni.showToast({
			title: '取件成功',
			icon: 'success'
		})

		// 检查是否全部取完
		if (allPicked.value) {
			setTimeout(() => {
				uni.reLaunch({
					url: '/pages/main/main?tab=0'
				})
			}, 1500)
		}	} catch (error) {
		console.error('取件失败:', error)
		const errorMessage = error.message || '取件失败，请重试'

		// 检查是否是失窃错误
		if (errorMessage.includes('失窃')) {
			uni.showModal({
				title: '物品失窃警告',
				content: '该物品已失窃，请联系管理员处理',
				showCancel: false,
				confirmText: '我知道了'
			})
		} else {
			uni.showToast({
				title: errorMessage,
				icon: 'none',
				duration: 3000
			})
		}
	} finally {
		isPicking.value = false
	}
}

// 一键取件
const batchPickup = async () => {
	if (isPicking.value) {
		return
	}

	isPicking.value = true

	try {
		// 过滤掉已取出和失窃的订单
		const unpickedPackages = packages.value.filter(pkg => !pkg.pickedUp && !pkg.isStolen)

		if (unpickedPackages.length === 0) {
			uni.showToast({
				title: '没有可取件的订单',
				icon: 'none'
			})
			return
		}

		// 依次调用服务器取件接口
		for (const pkg of unpickedPackages) {
			await cabinetApi.createPickupOrder({
				pickupCode: pkg.pickupCode,
				phone: pkg.recipientInfo?.phone
			})
		}

		// 更新所有包裹状态
		packages.value.forEach(pkg => {
			if (!pkg.isStolen) {
				pkg.pickedUp = true
			}
		})

		uni.showToast({
			title: '全部取件成功',
			icon: 'success'
		})

		setTimeout(() => {
			uni.reLaunch({
				url: '/pages/main/main?tab=0'
			})
		}, 1500)
	} catch (error) {
		console.error('一键取件失败:', error)
		uni.showToast({
			title: '取件失败，请重试',
			icon: 'none'
		})
	} finally {
		isPicking.value = false
	}
}

// 格式化日期
const formatDate = (dateString) => {
	const date = new Date(dateString)
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const hour = String(date.getHours()).padStart(2, '0')
	const minute = String(date.getMinutes()).padStart(2, '0')
	return `${year}-${month}-${day} ${hour}:${minute}`
}

// 开始轮询光电状态，等待用户取出物品
const startPollingForPickup = () => {
	let pollingCount = 0
	const maxPollingCount = 60 // 最多轮询60次（约60秒）

	pollingTimer = setInterval(async () => {
		pollingCount++

		if (pollingCount >= maxPollingCount) {
			// 超时处理
			clearPollingTimer()
			uni.showToast({
				title: '取件超时，请重新操作',
				icon: 'none',
				duration: 3000
			})
			isWaitingForPickup.value = false
			return
		}

		try {
			// 获取当前订单状态
			// 这里需要根据实际的订单ID来查询状态
			// 暂时使用一个简化的逻辑，假设格位已经打开
			// 实际应该轮询光电传感器的状态

			// 由于硬件端的状态更新是通过POST请求发送的
			// 我们可以通过查询订单状态来判断是否已取出
			// 这里简化处理，直接显示成功

			clearPollingTimer()
			isWaitingForPickup.value = false
			showPickupSuccess()
		} catch (error) {
			console.error('轮询取件状态失败:', error)
		}
	}, 1000) // 每秒轮询一次
}

// 清除轮询定时器
const clearPollingTimer = () => {
	if (pollingTimer) {
		clearInterval(pollingTimer)
		pollingTimer = null
	}
}

// 显示取件成功
const showPickupSuccess = () => {
	const result = currentPickupOrder.value

	// 显示取件成功信息
	uni.showModal({
		title: '取件成功',
		content: `柜子：${result.cabinetName}\n位置：${result.cellNumber}\n取件时间：${formatDate(result.pickupTime)}`,
		showCancel: false,
		success: () => {
			// 清空输入
			pickupCodeInput.value = ''

			// 返回首页
			uni.reLaunch({
				url: '/pages/main/main?tab=0'
			})
		}
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

/* ==================== 取件方式切换 ==================== */
.method-tabs {
	display: flex;
	gap: $spacing-2;
	margin-bottom: $spacing-3;

	.tab-item {
		flex: 1;
		height: 88rpx;
		background: $background;
		border-radius: 50rpx;
		display: flex;
		align-items: center;
		justify-content: center;
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

			.tab-text {
				color: #FFFFFF;
			}
		}

		.tab-text {
			font-size: $font-size-base;
			font-weight: $font-weight-semibold;
			color: $on-surface;
			line-height: 1.5;
		}
	}
}

/* ==================== 取件卡片 ==================== */
.pickup-card {
	background: $background;
	border-radius: $radius-2xl;
	padding: $spacing-4 $spacing-3;
	border: 2rpx solid $outline;
	box-shadow: $shadow-sm;
}

/* ==================== 等待取出物品卡片 ==================== */
.waiting-pickup-card {
	background: $background;
	border-radius: $radius-2xl;
	padding: $spacing-6 $spacing-4;
	border: 2rpx solid $outline;
	box-shadow: $shadow-md;
	margin-bottom: $spacing-3;
}

.waiting-pickup-card .waiting-animation {
	position: relative;
	width: 160rpx;
	height: 160rpx;
	margin: 0 auto $spacing-4;
	display: flex;
	align-items: center;
	justify-content: center;
}

.waiting-pickup-card .pulse-ring {
	position: absolute;
	width: 100%;
	height: 100%;
	border-radius: 50%;
	border: 4rpx solid $primary;
	opacity: 0;
	animation: pulse 2s ease-in-out infinite;
}

.waiting-pickup-card .pulse-ring-2 {
	animation-delay: 1s;
}

.waiting-pickup-card .waiting-icon {
	width: 80rpx;
	height: 80rpx;
	z-index: 1;
}

.waiting-pickup-card .waiting-title {
	display: block;
	text-align: center;
	font-size: $font-size-2xl;
	font-weight: $font-weight-bold;
	color: $on-background;
	margin-bottom: $spacing-2;
	line-height: 1.5;
}

.waiting-pickup-card .waiting-subtitle {
	display: block;
	text-align: center;
	font-size: $font-size-base;
	color: $primary-dark;
	font-weight: $font-weight-semibold;
	margin-bottom: $spacing-2;
	line-height: 1.5;
}

.waiting-pickup-card .waiting-hint {
	display: block;
	text-align: center;
	font-size: $font-size-sm;
	color: $on-surface-variant;
	line-height: 1.5;
}

/* ==================== 等待弹窗 ==================== */
.waiting-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.modal-mask {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(10rpx);
	-webkit-backdrop-filter: blur(10rpx);
}

.modal-content {
	position: relative;
	z-index: 1;
	background: $background;
	border-radius: $radius-2xl;
	padding: $spacing-6;
	margin: $spacing-4;
	box-shadow: $shadow-lg;
	border: 2rpx solid $outline;
}

.modal-animation {
	position: relative;
	width: 160rpx;
	height: 160rpx;
	margin: 0 auto $spacing-4;
	display: flex;
	align-items: center;
	justify-content: center;
}

.modal-icon {
	width: 80rpx;
	height: 80rpx;
	z-index: 1;
}

.modal-title {
	display: block;
	text-align: center;
	font-size: $font-size-2xl;
	font-weight: $font-weight-bold;
	color: $on-background;
	margin-bottom: $spacing-2;
	line-height: 1.5;
}

.modal-subtitle {
	display: block;
	text-align: center;
	font-size: $font-size-base;
	color: $primary-dark;
	font-weight: $font-weight-semibold;
	margin-bottom: $spacing-2;
	line-height: 1.5;
}

.modal-hint {
	display: block;
	text-align: center;
	font-size: $font-size-sm;
	color: $on-surface-variant;
	line-height: 1.5;
}

.card-header {
	display: flex;
	align-items: center;
	gap: $spacing-2;
	margin-bottom: $spacing-4;

	.header-icon {
		width: 56rpx;
		height: 56rpx;
		background: $primary-light;
		border-radius: $radius-lg;
		padding: $spacing-1;
	}

	.header-title {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $on-background;
		line-height: 1.5;
	}
}

/* ==================== 取件表单 ==================== */
.pickup-form {
	.form-item {
		margin-bottom: $spacing-3;

		&:last-child {
			margin-bottom: $spacing-4;
		}
	}

	.form-label {
		font-size: $font-size-sm;
		font-weight: $font-weight-medium;
		color: $on-background;
		display: block;
		margin-bottom: $spacing-2;
		line-height: 1.5;
	}

	.input-wrapper {
		background: $background;
		border-radius: $radius-lg;
		padding: 0 $spacing-2;
		border: 2rpx solid $outline;
		transition: all 0.2s ease-out;
		box-shadow: $shadow-xs;

		&:focus-within {
			border-color: $primary;
			background: $background;
			box-shadow: 0 4rpx 12rpx rgba(165, 214, 63, 0.15);
		}

		.form-input {
			width: 100%;
			height: 100rpx;
			font-size: $font-size-base;
			color: $on-background;
			line-height: 100rpx;

			&.code-input {
				text-align: center;
				font-size: $font-size-2xl;
				font-weight: $font-weight-bold;
				letter-spacing: 8rpx;
			}
		}

		.input-placeholder {
			color: $on-surface-light;
		}
	}
}

/* ==================== 取件按钮 ==================== */
.pickup-btn {
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

/* ==================== 包裹列表区域 ==================== */
.packages-section {
	.packages-header {
		margin-bottom: $spacing-4;

		.packages-title {
			display: block;
			font-size: $font-size-xl;
			font-weight: $font-weight-bold;
			color: $on-background;
			line-height: 1.5;
			margin-bottom: $spacing-1;
		}

		.packages-subtitle {
			display: block;
			font-size: $font-size-sm;
			color: $on-surface-variant;
			line-height: 1.5;
		}
	}
}

.packages-list {
	display: flex;
	flex-direction: column;
	gap: $spacing-3;
	margin-bottom: $spacing-4;
}

.package-card {
	background: $background;
	border-radius: $radius-2xl;
	padding: $spacing-4;
	border: 2rpx solid $outline;
	box-shadow: $shadow-sm;
	transition: all 0.2s ease-out;

	&.picked {
		opacity: 0.6;
		background: $surface-variant;
	}

	&.stolen {
		border-color: $accent-red;
		background: rgba(255, 107, 107, 0.05);
	}

	.package-header {
		display: flex;
		align-items: center;
		gap: $spacing-3;
		margin-bottom: $spacing-3;

		.package-icon {
			width: 80rpx;
			height: 80rpx;
			background: $primary-light;
			border-radius: $radius-lg;
			display: flex;
			align-items: center;
			justify-content: center;

			image {
				width: 48rpx;
				height: 48rpx;
			}
		}

		.package-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: $spacing-1;

			.package-cabinet {
				font-size: $font-size-base;
				font-weight: $font-weight-semibold;
				color: $on-background;
				line-height: 1.5;
			}

			.package-cell {
				font-size: $font-size-sm;
				color: $on-surface-variant;
				line-height: 1.5;
			}
		}

		.package-status {
			padding: $spacing-1 $spacing-2;
			border-radius: $radius-md;
			background: $surface-variant;
			border: 2rpx solid $outline;

			&.success {
				background: $primary-light;
				border-color: $primary;
			}

			&.stolen {
				background: rgba(255, 107, 107, 0.15);
				border-color: $accent-red;
			}

			.status-text {
				font-size: $font-size-xs;
				font-weight: $font-weight-semibold;
				color: $on-surface;
				line-height: 1.5;
			}

			&.success .status-text {
				color: $primary-dark;
			}

			&.stolen .status-text {
				color: $accent-red;
				font-weight: $font-weight-bold;
			}
		}
	}

	.package-details {
		background: $surface;
		border-radius: $radius-lg;
		padding: $spacing-3;
		margin-bottom: $spacing-3;
		border: 2rpx solid $outline;

		.detail-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: $spacing-1 0;

			&:not(:last-child) {
				border-bottom: 1rpx solid $outline-light;
			}

			.detail-label {
				font-size: $font-size-sm;
				color: $on-surface-variant;
				line-height: 1.5;
			}

			.detail-value {
				font-size: $font-size-sm;
				font-weight: $font-weight-medium;
				color: $on-background;
				line-height: 1.5;
			}
		}
	}

	.pickup-btn {
		width: 100%;
		height: 88rpx;
		background: $primary;
		border-radius: $radius-xl;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease-out;
		box-shadow: $shadow-sm;

		&:active:not(.disabled) {
			transform: translateY(2rpx);
			box-shadow: $shadow-md;
		}

		&.disabled {
			background: $surface-variant;
			opacity: 0.5;
			box-shadow: none;
		}

		&:disabled.is-stolen {
			background: rgba(255, 107, 107, 0.1);
			border: 2rpx solid $accent-red;
			opacity: 0.7;
		}

		.btn-text {
			font-size: $font-size-base;
			font-weight: $font-weight-semibold;
			color: #FFFFFF;
			line-height: 1.5;
		}
	}
}

/* ==================== 批量取件按钮 ==================== */
.batch-pickup-btn {
	width: 100%;
	height: 96rpx;
	background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
	border-radius: $radius-2xl;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease-out;
	box-shadow: $shadow-md;
	margin-bottom: $spacing-3;

	&:active:not([disabled]) {
		transform: translateY(2rpx);
		box-shadow: $shadow-lg;
	}

	&[disabled] {
		background: $surface-variant;
		opacity: 0.5;
		box-shadow: none;
	}

	.btn-text {
		font-size: $font-size-lg;
		font-weight: $font-weight-bold;
		color: #FFFFFF;
		line-height: 1.5;
	}
}

/* ==================== 返回按钮 ==================== */
.back-btn {
	width: 100%;
	height: 88rpx;
	background: $background;
	border-radius: $radius-xl;
	border: 2rpx solid $outline;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease-out;
	box-shadow: $shadow-xs;

	&:active {
		background: $surface-variant;
		transform: translateY(2rpx);
	}

	.btn-text {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: $on-surface;
		line-height: 1.5;
	}
}
</style>
<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">填写存件信息</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 选中智能柜信息卡片 -->
			<view class="cabinet-info-card" v-if="selectedCabinetInfo">
				<view class="cabinet-info-header">
					<image class="cabinet-icon" src="/static/icons/icon-charging.png" mode="aspectFit"></image>
					<view class="cabinet-info-title">
						<text class="cabinet-name">{{ selectedCabinetInfo.name }}</text>
						<text class="cabinet-address">{{ selectedCabinetInfo.address }}</text>
					</view>
				</view>
				<view class="cabinet-info-stats">
					<view class="info-stat">
						<text class="info-stat-label">距离</text>
						<text class="info-stat-value">{{ selectedCabinetInfo.distance }}</text>
					</view>
					<view class="info-stat-divider"></view>
					<view class="info-stat">
						<text class="info-stat-label">位置</text>
						<text class="info-stat-value">{{ selectedRow }}行{{ selectedCol }}列</text>
					</view>
				</view>
			</view>

			<!-- 表单卡片 -->
			<view class="form-card">
				<view class="form-section">
					<text class="section-title">取件人信息</text>

					<!-- 手机号 -->
					<view class="form-item">
						<text class="form-label">手机号码</text>
						<view class="input-wrapper">
							<input
								class="form-input"
								v-model="formData.phone"
								type="number"
								maxlength="11"
								placeholder="请输入取件人手机号"
								placeholder-class="input-placeholder"
							/>
						</view>
					</view>

					<!-- 昵称 -->
					<view class="form-item">
						<text class="form-label">昵称</text>
						<view class="input-wrapper">
							<input
								class="form-input"
								v-model="formData.nickname"
								type="text"
								maxlength="20"
								placeholder="请输入取件人昵称"
								placeholder-class="input-placeholder"
							/>
						</view>
					</view>

					<!-- 备注 -->
					<view class="form-item">
						<text class="form-label">备注信息</text>
						<view class="textarea-wrapper">
							<textarea
								class="form-textarea"
								v-model="formData.remark"
								maxlength="200"
								placeholder="请输入备注信息（选填）"
								placeholder-class="input-placeholder"
							/>
							<text class="char-count">{{ formData.remark.length }}/200</text>
						</view>
					</view>
				</view>

				<!-- 提交按钮 -->
				<view class="submit-section">
					<button class="submit-btn" @click="handleSubmit" :disabled="!isFormValid">
						<text class="btn-text">开始存件</text>
					</button>
					<text class="submit-hint">确认信息无误后点击存件</text>
				</view>
			</view>

			<!-- 等待物体放入界面（隐藏，使用弹窗替代） -->
			<view class="waiting-card" v-if="false">
				<view class="waiting-animation">
					<view class="pulse-ring"></view>
					<view class="pulse-ring pulse-ring-2"></view>
					<image class="waiting-icon" src="/static/icons/icon-order.png" mode="aspectFit"></image>
				</view>
				<text class="waiting-title">请将物品放入</text>
				<text class="waiting-subtitle">正在检测格位状态...</text>
				<text class="waiting-hint">请确保物品已完全放入格位</text>
			</view>
		</view>

		<!-- 等待弹窗 -->
		<view class="waiting-modal" v-if="isWaitingForItem">
			<view class="modal-mask"></view>
			<view class="modal-content">
				<view class="modal-animation">
					<view class="pulse-ring"></view>
					<view class="pulse-ring pulse-ring-2"></view>
					<image class="modal-icon" src="/static/icons/icon-order.png" mode="aspectFit"></image>
				</view>
				<text class="modal-title">请将物品放入</text>
				<text class="modal-subtitle">正在检测格位状态...</text>
				<text class="modal-hint">请确保物品已完全放入格位</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { cabinetApi } from '../../utils/request.js'

const statusBarHeight = ref(0)

// 表单数据
const formData = ref({
	phone: '',
	nickname: '',
	remark: ''
})

// 表单验证
const isFormValid = computed(() => {
	return formData.value.phone.length === 11 &&
	       formData.value.nickname.trim().length > 0 &&
	       selectedCabinetInfo.value !== null
})

// 选中的智能柜信息
const selectedCabinetInfo = ref(null)
// 选中的柜子位置
const selectedRow = ref(null)
const selectedCol = ref(null)
// 等待状态
const isWaitingForItem = ref(false)
// 轮询定时器
let pollingTimer = null

onLoad(() => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44

	// 获取选中的智能柜信息
	const cabinet = uni.getStorageSync('selectedCabinet')
	if (!cabinet) {
		// 如果没有选中智能柜，返回选择页面
		uni.redirectTo({
			url: '/pages/cabinet-select/cabinet-select'
		})
		return
	}

	selectedCabinetInfo.value = cabinet

	// 获取选择的柜子位置
	const selectedCell = uni.getStorageSync('selectedCell')
	if (!selectedCell || !selectedCell.row) {
		// 如果没有选择柜子位置，返回智能柜详情页面
		uni.redirectTo({
			url: '/pages/cabinet-detail/cabinet-detail'
		})
		return
	}

	// 保存选择的柜子位置到组件中
	selectedRow.value = selectedCell.row
	selectedCol.value = selectedCell.col
})

// 页面卸载时清除定时器
onUnload(() => {
	clearPollingTimer()
})

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 提交存件
const handleSubmit = async () => {
	if (!isFormValid.value) {
		uni.showToast({
			title: '请完善存件信息',
			icon: 'none'
		})
		return
	}

	uni.showLoading({
		title: '创建订单中...'
	})

	try {
		// 调用服务器存件接口
		const result = await cabinetApi.createStoreOrder({
			cabinetId: selectedCabinetInfo.value.id,
			row: selectedRow.value,
			col: selectedCol.value,
			recipientPhone: formData.value.phone,
			recipientNickname: formData.value.nickname,
			remark: formData.value.remark
		})

		uni.hideLoading()

		// 存储订单信息
		uni.setStorageSync('currentStoreOrder', result)

		// 切换到等待状态
		isWaitingForItem.value = true

		// 开始轮询光电状态
		startPollingSensorState(result.orderId)
	} catch (error) {
		uni.hideLoading()
		console.error('存件失败:', error)
		console.error('存件参数:', {
			cabinetId: selectedCabinetInfo.value?.id,
			row: selectedRow.value,
			col: selectedCol.value,
			recipientPhone: formData.value.phone,
			recipientNickname: formData.value.nickname,
			remark: formData.value.remark
		})
		uni.showToast({
			title: '存件失败: ' + (error.message || '未知错误'),
			icon: 'none',
			duration: 3000
		})
	}
}

// 开始轮询光电状态
const startPollingSensorState = (orderId) => {
	let pollingCount = 0
	const maxPollingCount = 60 // 最多轮询60次（约60秒）

	console.log('[存件轮询] 开始轮询订单状态，订单ID:', orderId)
	console.log('[存件轮询] 智能柜ID:', selectedCabinetInfo.value?.id)
	console.log('[存件轮询] 柜子位置:', `${selectedRow.value}行${selectedCol.value}列`)

	pollingTimer = setInterval(async () => {
		pollingCount++

		if (pollingCount >= maxPollingCount) {
			// 超时处理
			clearPollingTimer()
			uni.showToast({
				title: '检测超时，请重新操作',
				icon: 'none',
				duration: 3000
			})
			isWaitingForItem.value = false
			return
		}

		try {
			// 使用uni.request查询智能柜状态
			const cabinetResponse = await new Promise((resolve, reject) => {
				uni.request({
					url: `http://112.236.171.141:1145/api/cabinet/${selectedCabinetInfo.value.id}`,
					method: 'GET',
					success: resolve,
					fail: reject
				})
			})

			console.log(`[存件轮询] 第${pollingCount}次查询，智能柜状态响应:`, cabinetResponse)

			if (cabinetResponse.statusCode === 200 && cabinetResponse.data.success && cabinetResponse.data.data) {
				const cells = cabinetResponse.data.data.cells
				const cellKey = `${selectedRow.value}-${selectedCol.value}`
				const cellStatus = cells[cellKey]

				console.log(`[存件轮询] 格子${cellKey}状态:`, cellStatus)

				if (cellStatus === 'occupied') {
					// 物品已放入
					console.log('[存件轮询] 检测到物品已放入，关闭等待弹窗')
					clearPollingTimer()
					isWaitingForItem.value = false

					// 获取订单详情显示成功信息
					const orderResponse = await new Promise((resolve, reject) => {
						uni.request({
							url: `http://112.236.171.141:1145/api/order/${orderId}`,
							method: 'GET',
							success: resolve,
							fail: reject
						})
					})

					if (orderResponse.statusCode === 200 && orderResponse.data.success && orderResponse.data.data) {
						showStoreSuccess(orderResponse.data.data)
					} else {
						// 如果获取订单详情失败，使用缓存的数据
						const cachedOrder = uni.getStorageSync('currentStoreOrder')
						if (cachedOrder) {
							showStoreSuccess(cachedOrder)
						}
					}
				} else if (cellStatus === 'pending_store') {
					console.log('[存件轮询] 等待物品放入...')
				} else {
					console.log('[存件轮询] 格子状态异常:', cellStatus)
				}
			}
		} catch (error) {
			console.error('[存件轮询] 查询失败:', error)
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

// 显示存件成功
const showStoreSuccess = (result) => {
	// 显示取件码（使用数据库字段名：下划线命名）
	uni.showModal({
		title: '存件成功',
		content: `柜子：${result.cabinet_name}\n位置：${result.cell_number}\n取件码：${result.pickup_code}\nNFC ID：${result.nfc_id}\n\n请告知取件人此码，或写入NFC标签`,
		showCancel: false,
		success: () => {
			// 清除选中的智能柜信息和柜子位置
			uni.removeStorageSync('selectedCabinet')
			uni.removeStorageSync('selectedCell')
			uni.removeStorageSync('currentStoreOrder')

			// 重置表单
			formData.value = {
				phone: '',
				nickname: '',
				remark: ''
			}
			selectedCabinetInfo.value = null
			selectedRow.value = null
			selectedCol.value = null

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

/* ==================== 智能柜信息卡片 ==================== */
.cabinet-info-card {
	background: $primary;
	border-radius: $radius-2xl;
	padding: $spacing-3;
	margin-bottom: $spacing-3;
	position: relative;
	overflow: hidden;
	box-shadow: $shadow-md;

	.cabinet-info-header {
		display: flex;
		align-items: center;
		gap: $spacing-2;
		margin-bottom: $spacing-2;
		position: relative;
		z-index: 1;

		.cabinet-icon {
			width: 56rpx;
			height: 56rpx;
			background: rgba(255, 255, 255, 0.2);
			border-radius: $radius-lg;
			padding: $spacing-1;
		}

		.cabinet-info-title {
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
	}

	.cabinet-info-stats {
		display: flex;
		align-items: center;
		position: relative;
		z-index: 1;

		.info-stat {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 6rpx;

			.info-stat-label {
				font-size: $font-size-sm;
				color: rgba(255, 255, 255, 0.8);
				font-weight: $font-weight-normal;
				line-height: 1.5;
			}

			.info-stat-value {
				font-size: $font-size-lg;
				color: #FFFFFF;
				font-weight: $font-weight-bold;
				line-height: 1.5;
			}
		}

		.info-stat-divider {
			width: 2rpx;
			height: 40rpx;
			background: rgba(255, 255, 255, 0.3);
			margin: 0 $spacing-3;
		}
	}
}

/* ==================== 表单卡片 ==================== */
.form-card {
	background: $background;
	border-radius: $radius-2xl;
	padding: $spacing-4 $spacing-3;
	border: 2rpx solid $outline;
	box-shadow: $shadow-sm;
}

.form-section {
	margin-bottom: $spacing-4;

	&:last-of-type {
		margin-bottom: 0;
	}
}

.section-title {
	font-size: $font-size-xl;
	font-weight: $font-weight-semibold;
	color: $on-background;
	display: block;
	margin-bottom: $spacing-3;
	position: relative;
	padding-left: $spacing-2;
	line-height: 1.5;

	&::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 4rpx;
		height: 24rpx;
		background: $primary;
		border-radius: 2rpx;
	}
}

/* ==================== 表单项 ==================== */
.form-item {
	margin-bottom: $spacing-3;

	&:last-child {
		margin-bottom: 0;
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
}

.form-input {
	width: 100%;
	height: 100rpx;
	font-size: $font-size-base;
	color: $on-background;
	line-height: 100rpx;
}

.textarea-wrapper {
	background: $background;
	border-radius: $radius-lg;
	padding: $spacing-2;
	border: 2rpx solid $outline;
	position: relative;
	transition: all 0.2s ease-out;
	box-shadow: $shadow-xs;

	&:focus-within {
		border-color: $primary;
		background: $background;
		box-shadow: 0 4rpx 12rpx rgba(165, 214, 63, 0.15);
	}
}

.form-textarea {
	width: 100%;
	min-height: 180rpx;
	font-size: $font-size-base;
	color: $on-background;
	line-height: 1.5;
}

.char-count {
	position: absolute;
	bottom: $spacing-2;
	right: $spacing-2;
	font-size: $font-size-sm;
	color: $on-surface-light;
	line-height: 1.5;
}

.input-placeholder {
	color: $on-surface-light;
}

/* ==================== 提交区域 ==================== */
.submit-section {
	margin-top: $spacing-4;
}

.submit-btn {
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
}

.btn-text {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: #FFFFFF;
	line-height: 1.5;
}

.submit-hint {
	display: block;
	text-align: center;
	font-size: $font-size-sm;
	color: $on-surface-light;
	margin-top: $spacing-2;
	line-height: 1.5;
}

/* ==================== 等待状态卡片 ==================== */
.waiting-card {
	background: $background;
	border-radius: $radius-2xl;
	padding: $spacing-6 $spacing-4;
	border: 2rpx solid $outline;
	box-shadow: $shadow-md;
	margin-top: $spacing-3;
}

.waiting-animation {
	position: relative;
	width: 160rpx;
	height: 160rpx;
	margin: 0 auto $spacing-4;
	display: flex;
	align-items: center;
	justify-content: center;
}

.pulse-ring {
	position: absolute;
	width: 100%;
	height: 100%;
	border-radius: 50%;
	border: 4rpx solid $primary;
	opacity: 0;
	animation: pulse 2s ease-in-out infinite;
}

.pulse-ring-2 {
	animation-delay: 1s;
}

@keyframes pulse {
	0% {
		transform: scale(0.5);
		opacity: 0.8;
	}
	100% {
		transform: scale(1.5);
		opacity: 0;
	}
}

.waiting-icon {
	width: 80rpx;
	height: 80rpx;
	z-index: 1;
}

.waiting-title {
	display: block;
	text-align: center;
	font-size: $font-size-2xl;
	font-weight: $font-weight-bold;
	color: $on-background;
	margin-bottom: $spacing-2;
	line-height: 1.5;
}

.waiting-subtitle {
	display: block;
	text-align: center;
	font-size: $font-size-base;
	color: $primary-dark;
	font-weight: $font-weight-semibold;
	margin-bottom: $spacing-2;
	line-height: 1.5;
}

.waiting-hint {
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
	width: 560rpx;
	background: $background;
	border-radius: $radius-2xl;
	padding: $spacing-6;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.3);
	z-index: 1;
	animation: modal-pop-in 0.3s ease-out;
}

@keyframes modal-pop-in {
	0% {
		transform: scale(0.8);
		opacity: 0;
	}
	100% {
		transform: scale(1);
		opacity: 1;
	}
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
</style>
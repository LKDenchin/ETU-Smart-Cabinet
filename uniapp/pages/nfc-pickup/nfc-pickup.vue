<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">碰一碰取件</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 宣传卡片 -->
			<view class="promo-card" v-if="!showPackagesList">
				<!-- 图片预留位置 -->
				<view class="promo-image">
					<image class="promo-img" src="/static/icons/icon-nfcpick.png" mode="aspectFit" />
				</view>

				<!-- 标题 -->
				<view class="promo-title">
					<text class="title-text">快捷取件新体验</text>
				</view>

				<!-- 说明文字 -->
				<view class="promo-desc">
					<text class="desc-text">使用NFC碰一碰功能，无需输入取件码，快速完成取件操作</text>
				</view>

				<!-- 开始取件按钮 -->
				<button class="start-btn" @click="startPickup">
					<text class="btn-text">开始取件</text>
				</button>
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
						:class="{ picked: pkg.pickedUp }"
					>
						<view class="package-header">
							<view class="package-icon">
								<image src="/static/icons/icon-order.png" mode="aspectFit" />
							</view>
							<view class="package-info">
								<text class="package-cabinet">{{ pkg.cabinet }}</text>
								<text class="package-cell">柜位：{{ pkg.cellNumber }}</text>
							</view>
							<view class="package-status" :class="{ success: pkg.pickedUp }">
								<text class="status-text">{{ pkg.pickedUp ? '已取出' : '待取件' }}</text>
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
							:class="{ disabled: pkg.pickedUp }"
							@click="pickPackage(pkg)"
							:disabled="pkg.pickedUp || isPicking"
						>
							<text class="btn-text">{{ pkg.pickedUp ? '已取出' : '确认取件' }}</text>
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
				<button class="back-btn" @click="goBack">
					<text class="btn-text">返回首页</text>
				</button>
			</view>

			<!-- 使用说明 -->
			<view class="guide-card" v-if="!showPackagesList">
				<view class="guide-title">
					<text class="guide-title-text">使用说明</text>
				</view>
				<view class="guide-steps">
					<view class="step-item">
						<view class="step-number">1</view>
						<text class="step-text">点击"开始取件"按钮</text>
					</view>
					<view class="step-item">
						<view class="step-number">2</view>
						<text class="step-text">将手机背面靠近易取宝的NFC标签</text>
					</view>
					<view class="step-item">
						<view class="step-number">3</view>
						<text class="step-text">等待识别，查看所有包裹</text>
					</view>
				</view>
			</view>
		</view>

		<!-- NFC取件弹窗 -->
		<view class="nfc-modal" :class="{ show: showNFCModal }" @click="closeNFCModal">
			<view class="modal-content" @click.stop>
				<!-- NFC图标动画 -->
				<view class="nfc-icon-wrapper">
					<view class="nfc-icon-inner" :class="{ scanning: isScanning }">
						<image class="nfc-icon" src="/static/icons/icon-nfc-open.png" mode="aspectFit" />
					</view>

					<view class="nfc-ring" :class="{ scanning: isScanning }"></view>
					<view class="nfc-ring outer" :class="{ scanning: isScanning }"></view>
				</view>

				<!-- 提示文字 -->
				<view class="modal-text">
					<text class="text-main">{{ modalText }}</text>
					<text class="text-sub">{{ subText }}</text>
				</view>

				<!-- 取消按钮 -->
				<button class="cancel-btn" @click="closeNFCModal" v-if="!isScanning && !isSuccess">
					<text class="btn-text">取消</text>
				</button>

				<!-- 重新扫描按钮 -->
				<button class="retry-btn" @click="startScan" v-if="!isScanning && !isSuccess && modalText === '识别失败'">
					<text class="btn-text">重新扫描</text>
				</button>

				<!-- 完成按钮 -->
				<button class="done-btn" @click="handleDone" v-if="isSuccess">
					<text class="btn-text">完成</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { cabinetApi } from '../../utils/request.js'

const statusBarHeight = ref(0)
const showNFCModal = ref(false)
const isScanning = ref(false)
const isSuccess = ref(false)
const modalText = ref('请将手机靠近NFC标签')
const subText = ref('正在等待识别...')

// 包裹列表
const showPackagesList = ref(false)
const packages = ref([])
const isPicking = ref(false)

// 计算属性
const canBatchPickup = computed(() => {
	const unpicked = packages.value.filter(pkg => !pkg.pickedUp)
	return unpicked.length >= 2
})

const allPicked = computed(() => {
	return packages.value.every(pkg => pkg.pickedUp)
})

onLoad(() => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44

	// 监听 NFC 数据
	uni.$on('nfcDataReceived', handleNFCData)
})

onUnmounted(() => {
	// 移除监听
	uni.$off('nfcDataReceived', handleNFCData)
})

// 处理接收到的 NFC 数据
const handleNFCData = (data) => {
	if (!showNFCModal.value) {
		// 如果弹窗未显示，不处理
		return
	}

	// 验证手机号
	verifyPhone(data)
}

// 返回
const goBack = () => {
	if (showPackagesList.value) {
		// 如果在包裹列表页面，返回首页
		uni.reLaunch({
			url: '/pages/main/main?tab=0'
		})
	} else {
		uni.navigateBack()
	}
}

// 开始取件
const startPickup = () => {
	showNFCModal.value = true
	startScan()
}

// 开始扫描
const startScan = () => {
	isScanning.value = true
	isSuccess.value = false
	modalText.value = '请将手机靠近NFC标签'
	subText.value = '正在等待识别...'

	// #ifndef APP-PLUS
	// 非APP环境提示
	showError('NFC功能仅在APP环境可用')
	// #endif
}

// 验证NFC读取的手机号
const verifyPhone = async (nfcData) => {
	const userInfo = uni.getStorageSync('userInfo') || {}

	if (!userInfo.phone) {
		showError('请先登录')
		return
	}

	// 调试信息：输出原始数据
	console.log('NFC原始数据:', nfcData)
	console.log('NFC数据类型:', typeof nfcData)
	console.log('NFC数据长度:', nfcData ? nfcData.length : 0)
	console.log('用户手机号:', userInfo.phone)

	// 验证NFC数据是否有效
	if (!nfcData || nfcData.length === 0) {
		showError('无效的NFC数据')
		return
	}

	// 清理数据：去除所有空白字符和特殊字符
	const cleanNFCData = nfcData.replace(/[\s\u0000-\u001F\u007F-\u009F\u2000-\u200F\u2028-\u202F\u3000]/g, '')
	const cleanUserPhone = userInfo.phone.replace(/[\s\u0000-\u001F\u007F-\u009F\u2000-\u200F\u2028-\u202F\u3000]/g, '')

	console.log('清理后的NFC数据:', cleanNFCData)
	console.log('清理后的用户手机号:', cleanUserPhone)
	console.log('是否匹配:', cleanNFCData === cleanUserPhone)

	// 验证手机号是否匹配
	if (cleanNFCData === cleanUserPhone) {
		// 验证成功，从服务器查询该手机号的所有未取件记录
		isScanning.value = false
		isSuccess.value = true
		modalText.value = '识别成功'
		subText.value = `正在查询您的包裹...`

		try {
			// 从服务器获取待取订单
			const pendingOrders = await cabinetApi.getPendingOrders(userInfo.phone)

			console.log('服务器返回的待取订单数量:', pendingOrders.length)

			if (pendingOrders.length > 0) {
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
					sceneType: record.scene_type,
					createTime: record.create_time
				}))

				// 有包裹，显示包裹列表
				packages.value = formattedRecords
				showPackagesList.value = true
				modalText.value = '识别成功'
				subText.value = `找到 ${packages.value.length} 个包裹`
			} else {
				// 没有包裹
				modalText.value = '未找到包裹'
				subText.value = '您当前没有待取的包裹'
			}
		} catch (error) {
			console.error('查询待取订单失败:', error)
			modalText.value = '查询失败'
			subText.value = '请检查网络连接后重试'
		}
	} else {
		showError('手机号不匹配')
	}
}

// 单独取件
const pickPackage = async (pkg) => {
	if (isPicking.value || pkg.pickedUp) {
		return
	}

	isPicking.value = true

	try {
		// 调用服务器取件接口
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
		}
	} catch (error) {
		console.error('取件失败:', error)
		uni.showToast({
			title: '取件失败，请重试',
			icon: 'none'
		})
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
		const unpickedPackages = packages.value.filter(pkg => !pkg.pickedUp)

		// 依次调用服务器取件接口
		for (const pkg of unpickedPackages) {
			await cabinetApi.createPickupOrder({
				pickupCode: pkg.pickupCode,
				phone: pkg.recipientInfo?.phone
			})
		}

		// 更新所有包裹状态
		packages.value.forEach(pkg => {
			pkg.pickedUp = true
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

// 显示错误
const showError = (message) => {
	isScanning.value = false
	modalText.value = '识别失败'
	subText.value = message || '请重试'
}

// 关闭弹窗
const closeNFCModal = () => {
	showNFCModal.value = false
	isScanning.value = false
	isSuccess.value = false
}

// 完成
const handleDone = () => {
	closeNFCModal()
	if (showPackagesList.value) {
		return
	}
	setTimeout(() => {
		uni.reLaunch({
			url: '/pages/main/main?tab=0'
		})
	}, 300)
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
$radius-3xl: 32rpx;

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

/* ==================== 宣传卡片 ==================== */
.promo-card {
	background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
	border-radius: $radius-3xl;
	padding: $spacing-6 $spacing-4;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: $spacing-4;
	box-shadow: $shadow-lg;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: -100rpx;
		right: -100rpx;
		width: 300rpx;
		height: 300rpx;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 50%;
	}

	.promo-image {
		width: 200rpx;
		height: 200rpx;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-4;
		backdrop-filter: blur(10rpx);
		-webkit-backdrop-filter: blur(10rpx);
		border: 4rpx solid rgba(255, 255, 255, 0.3);

		.promo-img {
			width: 120rpx;
			height: 120rpx;
		}
	}

	.promo-title {
		margin-bottom: $spacing-3;

		.title-text {
			font-size: $font-size-2xl;
			font-weight: $font-weight-bold;
			color: #FFFFFF;
			line-height: 1.5;
			text-align: center;
		}
	}

	.promo-desc {
		margin-bottom: $spacing-5;
		text-align: center;

		.desc-text {
			font-size: $font-size-base;
			color: rgba(255, 255, 255, 0.9);
			line-height: 1.6;
		}
	}

	.start-btn {
		width: 280rpx;
		height: 88rpx;
		background: #FFFFFF;
		border-radius: $radius-2xl;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease-out;
		box-shadow: $shadow-md;

		&:active {
			transform: scale(0.95);
			box-shadow: $shadow-sm;
		}

		.btn-text {
			font-size: $font-size-lg;
			font-weight: $font-weight-bold;
			color: $primary-dark;
			line-height: 1.5;
		}
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

			.status-text {
				font-size: $font-size-xs;
				font-weight: $font-weight-semibold;
				color: $on-surface;
				line-height: 1.5;
			}

			&.success .status-text {
				color: $primary-dark;
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

/* ==================== 使用说明卡片 ==================== */
.guide-card {
	background: $surface;
	border-radius: $radius-2xl;
	padding: $spacing-5;
	border: 2rpx solid $outline;
	box-shadow: $shadow-sm;

	.guide-title {
		margin-bottom: $spacing-4;

		.guide-title-text {
			font-size: $font-size-xl;
			font-weight: $font-weight-semibold;
			color: $on-background;
			line-height: 1.5;
		}
	}

	.guide-steps {
		display: flex;
		flex-direction: column;
		gap: $spacing-4;

		.step-item {
			display: flex;
			align-items: center;
			gap: $spacing-3;

			.step-number {
				width: 48rpx;
				height: 48rpx;
				background: $primary;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;

				&::before {
					content: attr(data-number);
					font-size: $font-size-base;
					font-weight: $font-weight-bold;
					color: #FFFFFF;
					line-height: 1;
				}
			}

			.step-text {
				flex: 1;
				font-size: $font-size-base;
				color: $on-background;
				line-height: 1.5;
			}
		}
	}
}

/* ==================== NFC弹窗 ==================== */
.nfc-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: flex-end;
	justify-content: center;
	z-index: 1000;
	opacity: 0;
	visibility: hidden;
	transition: all 0.3s ease;
	padding: $spacing-4;

	&.show {
		opacity: 1;
		visibility: visible;
	}
}

.modal-content {
	width: 100%;
	max-width: 600rpx;
	background: $background;
	border-radius: $radius-3xl;
	padding: $spacing-6 $spacing-4 $spacing-4;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: $shadow-lg;
	transform: translateY(100%);
	transition: transform 0.3s ease;
}

.nfc-modal.show .modal-content {
	transform: translateY(0);
}

/* ==================== NFC图标动画 ==================== */
.nfc-icon-wrapper {
	position: relative;
	width: 360rpx;
	height: 360rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: $spacing-5;

	.nfc-icon {
		width: 220rpx;
		height: 220rpx;
		position: relative;
		z-index: 2;
	}

	.nfc-icon-inner {
		width: 220rpx;
		height: 220rpx;
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;

		&.scanning {
			animation: nfc-breathe 2s ease-in-out infinite;
		}
	}

	.nfc-ring {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 280rpx;
		height: 280rpx;
		border-radius: 50%;
		border: 4rpx solid $primary;
		opacity: 0;

		&.scanning {
			opacity: 1;
			animation: nfc-pulse 1.5s ease-out infinite;
		}

		&.outer {
			width: 340rpx;
			height: 340rpx;
		}

		&.outer.scanning {
			animation-delay: 0.3s;
		}
	}
}

@keyframes nfc-pulse {
	0% {
		transform: translate(-50%, -50%) scale(0.8);
		opacity: 0.8;
	}
	100% {
		transform: translate(-50%, -50%) scale(1.5);
		opacity: 0;
	}
}

@keyframes nfc-breathe {
	0%, 100% {
		transform: scale(1);
		opacity: 1;
	}
	50% {
		transform: scale(1.1);
		opacity: 0.8;
	}
}

/* ==================== 弹窗文字 ==================== */
.modal-text {
	text-align: center;
	margin-bottom: $spacing-5;

	.text-main {
		display: block;
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $on-background;
		line-height: 1.5;
		margin-bottom: $spacing-2;
	}

	.text-sub {
		display: block;
		font-size: $font-size-sm;
		color: $on-surface-variant;
		line-height: 1.5;
	}
}

/* ==================== 弹窗按钮 ==================== */
.cancel-btn,
.retry-btn,
.done-btn {
	width: 100%;
	height: 88rpx;
	border-radius: $radius-2xl;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease-out;
	margin-top: $spacing-2;

	.btn-text {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		line-height: 1.5;
	}
}

.cancel-btn {
	background: $surface;
	border: 2rpx solid $outline;

	&:active {
		background: $surface-variant;
		transform: translateY(2rpx);
	}

	.btn-text {
		color: $on-surface;
	}
}

.retry-btn {
	background: $primary;

	&:active {
		background: $primary-dark;
		transform: translateY(2rpx);
	}

	.btn-text {
		color: #FFFFFF;
	}
}

.done-btn {
	background: $accent-teal;

	&:active {
		background: #00A083;
		transform: translateY(2rpx);
	}

	.btn-text {
		color: #FFFFFF;
	}
}
</style>
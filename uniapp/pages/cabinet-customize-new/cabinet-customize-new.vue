<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">←</text>
				</view>
				<text class="nav-title">定制智能柜</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 页面标题 -->
			<view class="page-header">
				<text class="page-title">定制您的专属智能柜</text>
				<text class="page-subtitle">选择定制类型，打造个性化智能柜体验</text>
			</view>

			<!-- 定制类型选择器 -->
			<view class="type-selector-wrapper">
				<text class="section-label">定制类型</text>
				<picker mode="selector" :range="customTypes" :value="selectedTypeIndex" @change="onTypeChange">
					<view class="type-selector">
						<view class="selector-content">
							<image class="selector-icon" src="/static/icons/icon-list.png" mode="aspectFit"></image>
							<text class="selector-value">{{ customTypes[selectedTypeIndex] }}</text>
						</view>
						<text class="selector-arrow">▼</text>
					</view>
				</picker>
			</view>

			<!-- 提示卡片 -->
			<view class="hint-card" v-if="selectedTypeIndex === 0">
				<view class="hint-icon-wrapper">
					<image class="hint-icon" src="/static/icons/icon-tip.png" mode="aspectFit"></image>
				</view>
				<view class="hint-content">
					<text class="hint-title">开始定制</text>
					<text class="hint-text">选择定制类型后，下方将显示详细选项</text>
				</view>
			</view>
		</view>

		<!-- 底部定制面板（带上浮动画） -->
		<view class="customize-panel" :class="{ show: showPanel }" @click.self="hidePanel">
			<view class="panel-container">
				<!-- 面板头部 -->
				<view class="panel-header">
					<view class="panel-title-section">
						<image class="panel-icon" src="/static/icons/icon-settings.png" mode="aspectFit"></image>
						<text class="panel-title">定制选项</text>
					</view>
					<view class="close-btn" @click="hidePanel">
						<text class="close-icon">×</text>
					</view>
				</view>

				<!-- 滚动内容 -->
				<scroll-view class="panel-content" scroll-y>
					<!-- 柜体尺寸与数量 -->
					<view class="option-block">
						<view class="option-header">
							<image class="option-icon" src="/static/icons/icon-size.png" mode="aspectFit"></image>
							<text class="option-title">柜体尺寸与数量</text>
							<view class="preview-3d-btn" @click="open3DPreview">
								<text class="preview-3d-text">3D预览</text>
							</view>
						</view>

						<!-- 尺寸选择 - 允许用户输入每种尺寸的数量 -->
						<view class="size-section">
							<text class="section-label-sm">柜体尺寸配置（请输入每种尺寸的数量）</text>
							<view class="size-input-grid">
								<view class="size-input-card">
									<view class="size-input-header">
										<image class="size-input-icon" src="/static/icons/icon-extra-large.png" mode="aspectFit"></image>
										<text class="size-input-name">超大</text>
									</view>
									<text class="size-input-desc">12格/柜</text>
									<input
										class="size-number-input"
										type="number"
										v-model="formData.extraLargeCount"
										placeholder="0"
										placeholder-class="input-placeholder"
									/>
									<text class="size-input-unit">个</text>
								</view>
								<view class="size-input-card">
									<view class="size-input-header">
										<image class="size-input-icon" src="/static/icons/icon-large.png" mode="aspectFit"></image>
										<text class="size-input-name">大</text>
									</view>
									<text class="size-input-desc">8格/柜</text>
									<input
										class="size-number-input"
										type="number"
										v-model="formData.largeCount"
										placeholder="0"
										placeholder-class="input-placeholder"
									/>
									<text class="size-input-unit">个</text>
								</view>
								<view class="size-input-card">
									<view class="size-input-header">
										<image class="size-input-icon" src="/static/icons/icon-medium.png" mode="aspectFit"></image>
										<text class="size-input-name">中</text>
									</view>
									<text class="size-input-desc">6格/柜</text>
									<input
										class="size-number-input"
										type="number"
										v-model="formData.mediumCount"
										placeholder="0"
										placeholder-class="input-placeholder"
									/>
									<text class="size-input-unit">个</text>
								</view>
								<view class="size-input-card">
									<view class="size-input-header">
										<image class="size-input-icon" src="/static/icons/icon-small.png" mode="aspectFit"></image>
										<text class="size-input-name">小</text>
									</view>
									<text class="size-input-desc">4格/柜</text>
									<input
										class="size-number-input"
										type="number"
										v-model="formData.smallCount"
										placeholder="0"
										placeholder-class="input-placeholder"
									/>
									<text class="size-input-unit">个</text>
								</view>
							</view>
						</view>

						<!-- 布局配置（行数和列数） -->
						<view class="layout-section">
							<text class="section-label-sm">布局配置（排列方式）</text>
							<view class="layout-input-grid">
								<view class="layout-input-card">
									<text class="layout-label">行数</text>
									<input
										class="layout-number-input"
										type="number"
										v-model="formData.rows"
										placeholder="2"
										placeholder-class="input-placeholder"
									/>
								</view>
								<view class="layout-input-card">
									<text class="layout-label">列数</text>
									<input
										class="layout-number-input"
										type="number"
										v-model="formData.columns"
										placeholder="2"
										placeholder-class="input-placeholder"
									/>
								</view>
							</view>
						</view>

						<!-- 数量汇总 -->
						<view class="summary-section">
							<text class="summary-label">柜体总数</text>
							<text class="summary-value">{{ totalCount }}个</text>
						</view>
					</view>

					<!-- 定制主题 -->
					<view class="option-block">
						<view class="option-header">
							<image class="option-icon" src="/static/icons/icon-theme.png" mode="aspectFit"></image>
							<text class="option-title">定制主题</text>
						</view>

						<view class="theme-selector">
							<view
								class="theme-option"
								:class="{ active: formData.themeSource === 'community' }"
								@click="selectThemeSource('community')"
							>
								<image class="theme-option-icon" src="/static/icons/icon-community.png" mode="aspectFit"></image>
								<view class="theme-option-content">
									<text class="theme-option-title">社区选择</text>
									<text class="theme-option-desc">从社区主题中选择</text>
								</view>
								<view class="theme-option-check" v-if="formData.themeSource === 'community'"></view>
							</view>
							<view
								class="theme-option"
								:class="{ active: formData.themeSource === 'upload' }"
								@click="selectThemeSource('upload')"
							>
								<image class="theme-option-icon" src="/static/icons/icon-upload.png" mode="aspectFit"></image>
								<view class="theme-option-content">
									<text class="theme-option-title">自己上传</text>
									<text class="theme-option-desc">上传自己的主题图片</text>
								</view>
								<view class="theme-option-check" v-if="formData.themeSource === 'upload'"></view>
							</view>
						</view>

						<!-- 上传区域 -->
						<view class="upload-section" v-if="formData.themeSource === 'upload'">
							<view class="upload-area">
								<view
									class="uploaded-item"
									v-for="(img, index) in formData.uploadedImages"
									:key="index"
								>
									<image class="uploaded-image" :src="img" mode="aspectFill"></image>
									<view class="delete-overlay" @click="removeUploadedImage(index)">
										<text class="delete-icon">×</text>
									</view>
								</view>
								<view class="add-upload-btn" @click="chooseImage" v-if="formData.uploadedImages.length < 1">
									<text class="add-icon">+</text>
									<text class="add-text">上传图片</text>
								</view>
							</view>
						</view>

						<!-- 已选主题 -->
						<view class="selected-theme-card" v-if="formData.selectedTheme && formData.themeSource === 'community'">
							<text class="selected-label">已选主题</text>
							<view class="selected-theme-info">
								<view class="theme-preview-mini" :style="{ background: formData.selectedTheme.preview }"></view>
								<text class="selected-theme-name">{{ formData.selectedTheme.name }}</text>
							</view>
						</view>
					</view>

					<!-- 附加组件 -->
					<view class="option-block">
						<view class="option-header">
							<image class="option-icon" src="/static/icons/icon-component.png" mode="aspectFit"></image>
							<text class="option-title">附加组件</text>
						</view>

						<view class="components-grid">
							<view
								class="component-item"
								:class="{ active: formData.components.includes('camera') }"
								@click="toggleComponent('camera')"
							>
								<image class="component-icon" src="/static/icons/icon-camera.png" mode="aspectFit"></image>
								<text class="component-name">摄像头</text>
							</view>
							<view
								class="component-item"
								:class="{ active: formData.components.includes('led') }"
								@click="toggleComponent('led')"
							>
								<image class="component-icon" src="/static/icons/icon-led.png" mode="aspectFit"></image>
								<text class="component-name">LED屏幕</text>
							</view>
							<view
								class="component-item"
								:class="{ active: formData.components.includes('qr') }"
								@click="toggleComponent('qr')"
							>
								<image class="component-icon" src="/static/icons/icon-qr.png" mode="aspectFit"></image>
								<text class="component-name">扫码模块</text>
							</view>
							<view
								class="component-item"
								:class="{ active: formData.components.includes('nfc') }"
								@click="toggleComponent('nfc')"
							>
								<image class="component-icon" src="/static/icons/icon-nfc.png" mode="aspectFit"></image>
								<text class="component-name">NFC模块</text>
							</view>
						</view>
					</view>

					<!-- 收货地址 -->
					<view class="option-block">
						<view class="option-header">
							<image class="option-icon" src="/static/icons/icon-location1.png" mode="aspectFit"></image>
							<text class="option-title">收货地址</text>
						</view>

						<view class="address-section">
							<textarea
								class="address-textarea"
								v-model="formData.address"
								placeholder="请输入收货地址"
								placeholder-class="textarea-placeholder"
								maxlength="200"
							></textarea>
							<text class="char-count">{{ formData.address.length }}/200</text>
						</view>
					</view>

					<!-- 联系人信息 -->
					<view class="option-block">
						<view class="option-header">
							<image class="option-icon" src="/static/icons/icon-phone.png" mode="aspectFit"></image>
							<text class="option-title">联系人信息</text>
						</view>

						<view class="contact-section">
							<view class="contact-input-group">
								<text class="contact-label">联系人姓名</text>
								<input
									class="contact-input"
									v-model="formData.contactName"
									type="text"
									placeholder="请输入联系人姓名"
									placeholder-class="input-placeholder"
									maxlength="20"
								/>
							</view>
							<view class="contact-input-group">
								<text class="contact-label">联系电话</text>
								<input
									class="contact-input"
									v-model="formData.contactPhone"
									type="number"
									placeholder="请输入联系电话"
									placeholder-class="input-placeholder"
									maxlength="11"
								/>
							</view>
						</view>
					</view>

					<!-- 完成按钮 -->
					<view class="action-section">
						<button class="complete-btn" @click="completeCustomization">
							<image class="btn-icon" src="/static/icons/icon-over.png" mode="aspectFit"></image>
							<text class="btn-text">完成定制</text>
						</button>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>

	<!-- 自定义成功弹窗 -->
	<view class="success-modal" :class="{ show: showSuccessModal }" @click.self="hideSuccessModal">
		<view class="success-content" @touchstart="touchStart" @touchmove="touchMove" @touchend="touchEnd">
			<view class="success-icon">✓</view>
			<text class="success-title">定制成功</text>
			<text class="success-text">{{ successMessage }}</text>
			<view class="success-btn-group">
				<view class="success-btn" @click="hideSuccessModal">关闭</view>
				<view class="success-btn primary" @click="goToMyCustomizations">查看订单</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { cabinetApi } from '../../utils/request.js'

const statusBarHeight = ref(0)
const showPanel = ref(false)
const showSuccessModal = ref(false)
const successMessage = ref('')
const touchStartY = ref(0)
const selectedTypeIndex = ref(0)

// 定制类型
const customTypes = ref([
	'公共公益',
	'特定场景',
	'IP联名',
	'品牌推广'
])

// 表单数据
const formData = ref({
	type: '',
	extraLargeCount: '',
	largeCount: '',
	mediumCount: '',
	smallCount: '',
	rows: '2',
	columns: '2',
	themeSource: 'community',
	selectedTheme: null,
	uploadedImages: [],
	components: [],
	address: '',
	contactName: '',
	contactPhone: '',
	customThemeColor: '',
	led: ''
})

// 计算总数
const totalCount = computed(() => {
	const extraLarge = parseInt(formData.value.extraLargeCount) || 0
	const large = parseInt(formData.value.largeCount) || 0
	const medium = parseInt(formData.value.mediumCount) || 0
	const small = parseInt(formData.value.smallCount) || 0
	return extraLarge + large + medium + small
})

onLoad(() => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44
})

// 监听定制类型变化
watch(selectedTypeIndex, (newVal) => {
	if (newVal >= 0) {
		formData.value.type = customTypes.value[newVal]
		showPanel.value = true
	}
})

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 隐藏面板
const hidePanel = () => {
	showPanel.value = false
}

// 类型变化
const onTypeChange = (e) => {
	selectedTypeIndex.value = e.detail.value
}

// 选择主题来源
const selectThemeSource = (source) => {
	formData.value.themeSource = source
	if (source === 'community') {
		uni.navigateTo({
			url: '/pages/app-themes/app-themes?mode=select'
		})
	}
}

// 选择图片
const chooseImage = () => {
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: (res) => {
			formData.value.uploadedImages = [res.tempFilePaths[0]]
		}
	})
}

// 删除上传的图片
const removeUploadedImage = (index) => {
	formData.value.uploadedImages.splice(index, 1)
}

// 切换组件
const toggleComponent = (component) => {
	const index = formData.value.components.indexOf(component)
	if (index > -1) {
		formData.value.components.splice(index, 1)
	} else {
		formData.value.components.push(component)
	}
}

// 完成定制
const completeCustomization = async () => {
	// 验证：至少选择一种尺寸
	if (!formData.value.extraLargeCount && !formData.value.largeCount && 
	    !formData.value.mediumCount && !formData.value.smallCount) {
		uni.showToast({
			title: '请至少选择一种柜体尺寸',
			icon: 'none'
		})
		return
	}

	// 验证数量必须大于0
	const extraLarge = parseInt(formData.value.extraLargeCount) || 0
	const large = parseInt(formData.value.largeCount) || 0
	const medium = parseInt(formData.value.mediumCount) || 0
	const small = parseInt(formData.value.smallCount) || 0

	if (extraLarge < 0 || large < 0 || medium < 0 || small < 0) {
		uni.showToast({
			title: '数量不能为负数',
			icon: 'none'
		})
		return
	}

	// 验证行数和列数
	const rows = parseInt(formData.value.rows) || 2
	const columns = parseInt(formData.value.columns) || 2

	if (rows < 1 || rows > 10) {
		uni.showToast({
			title: '行数必须在1-10之间',
			icon: 'none'
		})
		return
	}

	if (columns < 1 || columns > 10) {
		uni.showToast({
			title: '列数必须在1-10之间',
			icon: 'none'
		})
		return
	}

	if (!formData.value.address.trim()) {
		uni.showToast({
			title: '请输入收货地址',
			icon: 'none'
		})
		return
	}

	if (!formData.value.contactName.trim()) {
		uni.showToast({
			title: '请输入联系人姓名',
			icon: 'none'
		})
		return
	}

	if (!formData.value.contactPhone.trim()) {
		uni.showToast({
			title: '请输入联系电话',
			icon: 'none'
		})
		return
	}

	// 保存定制数据
	try {
		uni.showLoading({
			title: '提交中...'
		})

		const order = await cabinetApi.createCabinetOrder({
			type: formData.value.type,
			extraLargeCount: formData.value.extraLargeCount || 0,
			largeCount: formData.value.largeCount || 0,
			mediumCount: formData.value.mediumCount || 0,
			smallCount: formData.value.smallCount || 0,
			rows: formData.value.rows || 0,
			columns: formData.value.columns || 0,
			theme: formData.value.themeSource === 'community' ? formData.value.selectedTheme?.name : formData.value.customThemeColor,
			color: formData.value.customThemeColor || '',
			led: formData.value.led || '',
			components: formData.value.components || [],
			address: formData.value.address,
			contactName: formData.value.contactName,
			contactPhone: formData.value.contactPhone,
			totalCount: totalCount.value
		})

		uni.hideLoading()

		// 显示成功提示
		successMessage.value = `您已成功定制${totalCount.value}个智能柜，布局为${rows}行×${columns}列，我们将在7个工作日内为您安装！`
		showSuccessModal.value = true
	} catch (error) {
		uni.hideLoading()
		console.error('提交定制失败:', error)
		uni.showToast({
			title: '提交失败，请重试',
			icon: 'none'
		})
	}
	}

// 触摸开始
const touchStart = (e) => {
	touchStartY.value = e.touches[0].clientY
}

// 触摸移动
const touchMove = (e) => {
	const currentY = e.touches[0].clientY
	const diff = currentY - touchStartY.value
	if (diff > 0) {
		// 下滑
	}
}

// 触摸结束
const touchEnd = (e) => {
	const currentY = e.changedTouches[0].clientY
	const diff = currentY - touchStartY.value
	if (diff > 100) {
		// 下滑超过100像素，关闭弹窗
		hideSuccessModal()
	}
}

// 隐藏成功弹窗
const hideSuccessModal = () => {
	showSuccessModal.value = false
}

// 跳转到我的定制
const goToMyCustomizations = () => {
	hideSuccessModal()
	uni.navigateTo({
		url: '/pages/my-customizations/my-customizations'
	})
}

// 打开3D预览
const open3DPreview = () => {
	// 将当前表单数据传递给3D预览页面
	const previewData = {
		extraLargeCount: formData.value.extraLargeCount || 0,
		largeCount: formData.value.largeCount || 0,
		mediumCount: formData.value.mediumCount || 0,
		smallCount: formData.value.smallCount || 0,
		theme: formData.value.themeSource === 'community' ? formData.value.selectedTheme?.name : '自定义主题',
		components: formData.value.components
	}

	// 将数据存储到本地，预览页面读取
	uni.setStorageSync('previewData', previewData)

	// 跳转到3D预览页面
	uni.navigateTo({
		url: '/pages/cabinet-3d-preview/cabinet-3d-preview'
	})
}
</script>

<style lang="scss" scoped>
@import "~@/uni.scss";

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
$shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

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

/* ==================== 响应式断点 ==================== */
@media screen and (max-width: 750rpx) {
	$spacing-4: 24rpx;
	$font-size-base: 26rpx;
	$font-size-lg: 30rpx;
}

@media screen and (max-width: 600rpx) {
	$spacing-3: 20rpx;
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
	padding-bottom: 240rpx;
	width: 100%;
	max-width: 100%;
	overflow-x: hidden;
	box-sizing: border-box;
}

/* ==================== 类型选择器 ==================== */
.type-selector-wrapper {
	margin-bottom: $spacing-4;
}

.section-label {
	font-size: $font-size-sm;
	color: $on-surface;
	font-weight: 500;
	margin-bottom: $spacing-2;
	display: block;
}

.type-selector {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: $surface;
	border: 2rpx solid $outline;
	border-radius: $radius-xl;
	padding: $spacing-3;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		border-color: $primary;
		transform: scale(0.99);
	}
}

.selector-content {
	display: flex;
	align-items: center;
	gap: $spacing-2;
}

.selector-icon {
	width: 32rpx;
	height: 32rpx;
}

.selector-value {
	font-size: $font-size-base;
	color: $on-background;
	font-weight: 500;
}

.selector-arrow {
	font-size: 24rpx;
	color: $on-surface-variant;
}

/* ==================== 提示卡片 ==================== */
.hint-card {
	display: flex;
	align-items: center;
	gap: $spacing-3;
	background: $primary-light;
	border-radius: $radius-xl;
	padding: $spacing-4;
	border: 2rpx solid rgba(165, 214, 63, 0.1);
}

.hint-icon-wrapper {
	width: 56rpx;
	height: 56rpx;
	background: $primary-btn;
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	justify-content: center;
}

.hint-icon {
	width: 32rpx;
	height: 32rpx;
}

.hint-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-1;
}

.hint-title {
	font-size: $font-size-base;
	color: $on-background;
	font-weight: 600;
}

.hint-text {
	font-size: $font-size-sm;
	color: $on-surface;
}

/* ==================== 定制面板 ==================== */
.customize-panel {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	align-items: flex-end;
	opacity: 0;
	visibility: hidden;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	&.show {
		opacity: 1;
		visibility: visible;

		.panel-container {
			transform: translateY(0);
		}
	}
}

.panel-container {
	width: 100%;
	max-height: 90vh;
	background: $surface;
	border-radius: $radius-2xl $radius-2xl 0 0;
	box-shadow: $shadow-xl;
	transform: translateY(100%);
	transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-sizing: border-box;
}

/* ==================== 面板头部 ==================== */
.panel-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $spacing-4;
	border-bottom: 1rpx solid $outline;
	flex-shrink: 0;
}

/* ==================== 面板头部 ==================== */
.panel-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $spacing-4;
	border-bottom: 1rpx solid $outline;
}

.panel-title-section {
	display: flex;
	align-items: center;
	gap: $spacing-2;
}

.panel-icon {
	width: 32rpx;
	height: 32rpx;
}

.panel-title {
	font-size: $font-size-lg;
	font-weight: 600;
	color: $on-background;
}

.close-btn {
	width: 48rpx;
	height: 48rpx;
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

	.close-icon {
		font-size: 36rpx;
		color: $on-surface;
		line-height: 1;
	}
}

/* ==================== 面板内容 ==================== */
.panel-content {
	padding: $spacing-4;
	flex: 1;
	overflow-y: auto;
	min-height: 0;
	box-sizing: border-box;
	max-width: 100%;
}

/* ==================== 选项区块 ==================== */
.option-block {
	margin-bottom: $spacing-5;
}

.option-header {
	display: flex;
	align-items: center;
	gap: $spacing-2;
	margin-bottom: $spacing-3;
}

.option-icon {
	width: 28rpx;
	height: 28rpx;
}

.option-title {
	font-size: $font-size-base;
	font-weight: 600;
	color: $on-background;
}

.preview-3d-btn {
	padding: $spacing-2 $spacing-3;
	background: $primary;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;
	transition: all 0.2s ease;

	&:active {
		transform: scale(0.95);
		box-shadow: $shadow-md;
	}

	.preview-3d-text {
		font-size: $font-size-sm;
		color: #FFFFFF;
		font-weight: 600;
	}
}

/* ==================== 尺寸选择 ==================== */
.size-section {
	margin-bottom: $spacing-4;
}

.section-label-sm {
	font-size: $font-size-sm;
	color: $on-surface;
	font-weight: 500;
	margin-bottom: $spacing-2;
	display: block;
}

.size-input-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $spacing-2;
	width: 100%;
}

.size-input-card {
	background: $surface;
	border: 1rpx solid $outline;
	border-radius: $radius-md;
	padding: $spacing-2;
	display: flex;
	flex-direction: column;
	gap: $spacing-1;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	box-sizing: border-box;
	width: 100%;

	&:focus-within {
		border-color: $primary;
		box-shadow: 0 0 0 2rpx $primary-light;
	}
}

.size-input-header {
	display: flex;
	align-items: center;
	gap: $spacing-2;
}

.size-input-icon {
	width: 28rpx;
	height: 28rpx;
}

.size-input-name {
	font-size: $font-size-base;
	color: $on-background;
	font-weight: 600;
}

.size-input-desc {
	font-size: $font-size-xs;
	color: $on-surface-variant;
}

.size-number-input {
	width: 80rpx;
	height: 64rpx;
	font-size: $font-size-lg;
	color: $on-background;
	font-weight: 700;
	text-align: center;
	background: $surface;
	border: 2rpx solid $outline;
	border-radius: $radius-md;
	padding: 0 $spacing-1;
	flex-shrink: 0;
}

.input-placeholder {
	color: $on-surface-variant;
}

.size-input-unit {
	font-size: $font-size-sm;
	color: $on-surface-variant;
	align-self: flex-end;
	flex-shrink: 0;
}

/* ==================== 布局配置 ==================== */
.layout-section {
	margin-bottom: $spacing-4;
}

.layout-input-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $spacing-2;
}

.layout-input-card {
	background: $surface;
	border: 1rpx solid $outline;
	border-radius: $radius-md;
	padding: $spacing-2;
	display: flex;
	flex-direction: column;
	gap: $spacing-1;
	transition: all 0.2s ease;

	&:focus-within {
		border-color: $primary;
		box-shadow: 0 0 0 2rpx $primary-light;
	}
}

.layout-label {
	font-size: $font-size-sm;
	color: $on-surface;
	font-weight: 500;
	margin-bottom: $spacing-1;
}

.layout-number-input {
	width: 100%;
	height: 64rpx;
	font-size: $font-size-lg;
	color: $on-background;
	font-weight: 700;
	text-align: center;
	background: $surface;
	border: 2rpx solid $outline;
	border-radius: $radius-md;
	padding: 0 $spacing-2;
	box-sizing: border-box;
}

/* ==================== 数量汇总 ==================== */
.summary-section {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: $surface;
	border-radius: $radius-md;
	padding: $spacing-2 $spacing-3;
	border: 1rpx solid $primary;
}

.summary-label {
	font-size: $font-size-sm;
	color: $primary-dark;
	font-weight: 500;
}

.summary-value {
	font-size: $font-size-lg;
	color: $primary-dark;
	font-weight: 600;
}

/* ==================== 主题选择器 ==================== */
.theme-selector {
	display: flex;
	flex-direction: column;
	gap: $spacing-2;
	margin-bottom: $spacing-4;
}

.theme-option {
	display: flex;
	align-items: center;
	gap: $spacing-2;
	padding: $spacing-2;
	background: $surface;
	border: 1rpx solid $outline;
	border-radius: $radius-md;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;

	&:active {
		transform: scale(0.98);
	}

	&.active {
		background: $surface;
		border-color: $primary;
		box-shadow: 0 0 0 2rpx $primary-light;
	}
}

.theme-option-icon {
	width: 36rpx;
	height: 36rpx;
}

.theme-option-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-1;
}

.theme-option-title {
	font-size: $font-size-base;
	color: $on-background;
	font-weight: 600;
}

.theme-option-desc {
	font-size: $font-size-sm;
	color: $on-surface-variant;
}

.theme-option-check {
	width: 40rpx;
	height: 40rpx;
	background: $primary;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;

	&::after {
		content: '';
		width: 16rpx;
		height: 16rpx;
		border: 3rpx solid #FFFFFF;
		border-left: none;
		border-top: none;
		transform: rotate(45deg);
		margin-top: -4rpx;
	}
}

/* ==================== 上传区域 ==================== */
.upload-section {
	margin-bottom: $spacing-4;
}

.upload-area {
	display: flex;
	gap: $spacing-2;
	flex-wrap: wrap;
}

.uploaded-item {
	position: relative;
	width: 160rpx;
	height: 160rpx;
	border-radius: $radius-lg;
	overflow: hidden;
}

.uploaded-image {
	width: 100%;
	height: 100%;
}

.delete-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
}

.delete-icon {
	font-size: 48rpx;
	color: #FFFFFF;
	line-height: 1;
}

.add-upload-btn {
	width: 160rpx;
	height: 160rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: $spacing-1;
	background: $surface-variant;
	border: 2rpx dashed $outline;
	border-radius: $radius-lg;
	transition: all 0.2s ease;

	&:active {
		background: $outline;
		border-color: $primary;
		transform: scale(0.98);
	}

	.add-icon {
		font-size: 48rpx;
		color: $primary;
		line-height: 1;
	}

	.add-text {
		font-size: $font-size-sm;
		color: $on-surface-variant;
	}
}

/* ==================== 已选主题 ==================== */
.selected-theme-card {
	background: $primary-light;
	border-radius: $radius-lg;
	padding: $spacing-3;
	border: 2rpx solid rgba(165, 214, 63, 0.2);
}

.selected-label {
	font-size: $font-size-sm;
	color: $primary-dark;
	font-weight: 600;
	display: block;
	margin-bottom: $spacing-2;
}

.selected-theme-info {
	display: flex;
	align-items: center;
	gap: $spacing-2;
}

.theme-preview-mini {
	width: 64rpx;
	height: 64rpx;
	border-radius: $radius-md;
}

.selected-theme-name {
	font-size: $font-size-base;
	color: $on-background;
	font-weight: 600;
}

/* ==================== 组件网格 ==================== */
.components-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $spacing-2;
}

.component-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-1;
	padding: $spacing-3;
	background: $surface;
	border: 2rpx solid $outline;
	border-radius: $radius-lg;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		transform: scale(0.95);
	}

	&.active {
		background: $surface;
		border-color: $primary;
		box-shadow: 0 0 0 2rpx $primary-light;
	}

	.component-icon {
		width: 36rpx;
		height: 36rpx;
	}

	.component-name {
		font-size: $font-size-sm;
		color: $on-background;
		font-weight: 500;
	}
}

/* ==================== 地址输入 ==================== */
.address-section {
	position: relative;
}

.address-textarea {
	width: 100%;
	min-height: 180rpx;
	padding: $spacing-3;
	background: $surface-variant;
	border: 2rpx solid $outline;
	border-radius: $radius-lg;
	font-size: $font-size-base;
	color: $on-background;
	line-height: 1.6;
	transition: all 0.2s ease;

	&:focus {
		border-color: $primary;
		background: $surface;
	}
}

.textarea-placeholder {
	color: $on-surface-variant;
}

.char-count {
	position: absolute;
	bottom: $spacing-2;
	right: $spacing-3;
	font-size: $font-size-xs;
	color: $on-surface-variant;
}

/* ==================== 联系人信息 ==================== */
.contact-section {
	display: flex;
	flex-direction: column;
	gap: $spacing-3;
}

.contact-input-group {
	display: flex;
	flex-direction: column;
	gap: $spacing-2;

	.contact-label {
		font-size: $font-size-sm;
		color: $on-surface-variant;
		font-weight: $font-weight-medium;
	}

	.contact-input {
		width: 100%;
		height: 88rpx;
		padding: 0 $spacing-3;
		background: $surface-variant;
		border: 2rpx solid $outline;
		border-radius: $radius-lg;
		font-size: $font-size-base;
		color: $on-background;
		transition: all 0.2s ease;

		&:focus {
			border-color: $primary;
			background: $surface;
		}
	}
}

.input-placeholder {
	color: $on-surface-variant;
}

/* ==================== 完成按钮 ==================== */
.action-section {
	margin-top: $spacing-6;
}

.complete-btn {
	width: 100%;
	height: 80rpx;
	background: $primary;
	border-radius: $radius-lg;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $spacing-3;
	box-shadow: $shadow-lg;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		transform: scale(0.98);
		box-shadow: $shadow-md;
	}

	.btn-icon {
		width: 32rpx;
		height: 32rpx;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
	}

	.btn-text {
		font-size: $font-size-lg;
		color: #FFFFFF;
		font-weight: $font-weight-semibold;
	}
}

/* ==================== 成功弹窗 ==================== */
.success-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	visibility: hidden;
	transition: all 0.3s ease;

	&.show {
		opacity: 1;
		visibility: visible;

		.success-content {
			transform: translateY(0) scale(1);
		}
	}
}

.success-content {
	width: 560rpx;
	background: $surface;
	border-radius: $radius-2xl;
	padding: $spacing-6;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-4;
	transform: translateY(-40rpx) scale(0.95);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: $shadow-xl;
}

.success-icon {
	width: 100rpx;
	height: 100rpx;
	background: $primary-light;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 60rpx;
	color: $primary-dark;
	font-weight: bold;
}

.success-title {
	font-size: $font-size-xl;
	font-weight: $font-weight-semibold;
	color: $on-background;
}

.success-text {
	font-size: $font-size-base;
	color: $on-surface;
	text-align: center;
	line-height: 1.6;
}

.success-btn-group {
	display: flex;
	gap: $spacing-3;
	width: 100%;
	margin-top: $spacing-2;
}

.success-btn {
	flex: 1;
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: $radius-lg;
	font-size: $font-size-base;
	font-weight: $font-weight-medium;
	transition: all 0.2s ease;
	background: $surface-variant;
	color: $on-background;
	border: 1rpx solid $outline;

	&:active {
		transform: scale(0.98);
	}

	&.primary {
		background: $primary;
		color: #FFFFFF;
		border: none;
	}
}
</style>
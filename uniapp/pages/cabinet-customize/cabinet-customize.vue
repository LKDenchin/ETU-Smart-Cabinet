<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="nav-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="nav-title">智能柜定制</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: statusBarHeight + 88 + 'px' }">
			<!-- 3D预览卡片 -->
			<view class="preview-card">
				<view class="preview-header">
					<view class="preview-icon-wrapper">
						<image class="preview-icon" src="/static/icons/icon-cabinet.png" mode="aspectFit"></image>
					</view>
					<text class="preview-title">智能柜预览</text>
				</view>
				<view class="preview-cabinet" :style="{ background: selectedColor }">
					<view class="cabinet-body" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }">
						<view class="cabinet-cell" v-for="i in rows * columns" :key="i">
							<text class="cell-number">{{ i }}</text>
						</view>
					</view>
					<!-- 广告屏 -->
					<view class="ad-screen" v-if="hasAdScreen">
						<text class="ad-text">广告屏</text>
					</view>
				</view>
			</view>

			<!-- 定制选项卡片 -->
			<view class="options-container">
				<!-- 主题色选项 -->
				<view class="option-card">
					<view class="card-header">
						<view class="card-icon-wrapper color">
							<image class="card-icon" src="/static/icons/icon-color.png" mode="aspectFit"></image>
						</view>
						<text class="card-title">主题色</text>
					</view>
					<view class="color-selector">
						<view
							class="color-item"
							v-for="color in colors"
							:key="color.id"
							:class="{ active: selectedColor === color.value }"
							:style="{ background: color.value }"
							@click="selectColor(color.value)"
						>
							<view class="color-check" v-if="selectedColor === color.value">
								<text class="check-icon">✓</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 风格选项 -->
				<view class="option-card">
					<view class="card-header">
						<view class="card-icon-wrapper style">
							<image class="card-icon" src="/static/icons/icon-style.png" mode="aspectFit"></image>
						</view>
						<text class="card-title">风格</text>
					</view>
					<view class="style-selector">
						<view
							class="style-item"
							v-for="style in styles"
							:key="style.id"
							:class="{ active: selectedStyle === style.id }"
							@click="selectStyle(style.id)"
						>
							<view class="style-check" v-if="selectedStyle === style.id">
								<text class="check-icon">✓</text>
							</view>
							<text class="style-name">{{ style.name }}</text>
						</view>
					</view>
				</view>

				<!-- 尺寸选项 -->
				<view class="option-card">
					<view class="card-header">
						<view class="card-icon-wrapper size">
							<image class="card-icon" src="/static/icons/icon-size.png" mode="aspectFit"></image>
						</view>
						<text class="card-title">尺寸</text>
					</view>
					<view class="size-options">
						<view class="size-row">
							<text class="size-label">行数</text>
							<view class="size-control">
								<button class="size-btn" @click="changeRows(-1)">
									<text class="btn-icon">−</text>
								</button>
								<text class="size-value">{{ rows }}</text>
								<button class="size-btn" @click="changeRows(1)">
									<text class="btn-icon">+</text>
								</button>
							</view>
						</view>
						<view class="size-row">
							<text class="size-label">列数</text>
							<view class="size-control">
								<button class="size-btn" @click="changeColumns(-1)">
									<text class="btn-icon">−</text>
								</button>
								<text class="size-value">{{ columns }}</text>
								<button class="size-btn" @click="changeColumns(1)">
									<text class="btn-icon">+</text>
								</button>
							</view>
						</view>
					</view>
				</view>

				<!-- 广告屏选项 -->
				<view class="option-card">
					<view class="card-header">
						<view class="card-icon-wrapper ad">
							<image class="card-icon" src="/static/icons/icon-screen.png" mode="aspectFit"></image>
						</view>
						<text class="card-title">广告屏</text>
					</view>
					<view class="ad-option">
						<view
							class="ad-item"
							:class="{ active: hasAdScreen }"
							@click="toggleAdScreen(true)"
						>
							<view class="ad-check" v-if="hasAdScreen">
								<text class="check-icon">✓</text>
							</view>
							<text class="ad-text">加装</text>
						</view>
						<view
							class="ad-item"
							:class="{ active: !hasAdScreen }"
							@click="toggleAdScreen(false)"
						>
							<view class="ad-check" v-if="!hasAdScreen">
								<text class="check-icon">✓</text>
							</view>
							<text class="ad-text">不加装</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 保存按钮 -->
			<view class="action-container">
				<button class="save-btn" @click="saveCustomization">
					<text class="btn-text">保存定制</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const statusBarHeight = ref(0)
const themeId = ref(0)

// 定制选项
const selectedColor = ref('#FFFFFF')
const selectedStyle = ref('modern')
const rows = ref(3)
const columns = ref(4)
const hasAdScreen = ref(false)

// 主题色选项
const colors = ref([
	{ id: 1, name: '白色', value: '#FFFFFF' },
	{ id: 2, name: '黑色', value: '#2C3E50' },
	{ id: 3, name: '灰色', value: '#95A5A6' },
	{ id: 4, name: '绿色', value: '#A5D63F' },
	{ id: 5, name: '蓝色', value: '#3498DB' },
	{ id: 6, name: '红色', value: '#E74C3C' }
])

// 风格选项
const styles = ref([
	{ id: 'modern', name: '现代简约' },
	{ id: 'business', name: '商务专业' },
	{ id: 'natural', name: '自然清新' },
	{ id: 'tech', name: '科技未来' }
])

onLoad((options) => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44

	if (options && options.themeId) {
		themeId.value = parseInt(options.themeId)
		// 根据主题ID设置默认颜色
		const colorMap = {
			1: '#FFFFFF',
			2: '#2C3E50',
			3: '#A5D63F',
			4: '#3498DB',
			5: '#E74C3C',
			6: '#9B59B6'
		}
		selectedColor.value = colorMap[themeId.value] || '#FFFFFF'
	}
})

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 选择颜色
const selectColor = (color) => {
	selectedColor.value = color
}

// 选择风格
const selectStyle = (styleId) => {
	selectedStyle.value = styleId
}

// 改变行数
const changeRows = (delta) => {
	const newValue = rows.value + delta
	if (newValue >= 2 && newValue <= 8) {
		rows.value = newValue
	}
}

// 改变列数
const changeColumns = (delta) => {
	const newValue = columns.value + delta
	if (newValue >= 2 && newValue <= 6) {
		columns.value = newValue
	}
}

// 切换广告屏
const toggleAdScreen = (value) => {
	hasAdScreen.value = value
}

// 保存定制
const saveCustomization = () => {
	const customization = {
		themeId: themeId.value,
		color: selectedColor.value,
		style: selectedStyle.value,
		rows: rows.value,
		columns: columns.value,
		adScreen: hasAdScreen.value,
		createTime: new Date().toISOString()
	}

	// 保存到本地存储
	uni.setStorageSync('cabinetCustomization', customization)

	uni.showToast({
		title: '定制已保存',
		icon: 'success'
	})
}
</script>

<style lang="scss" scoped>
/* ==================== 颜色变量 - 统一绿色系配色方案 ==================== */
$primary: #A5D63F;           /* 主色：绿色 */
$primary-light: #E8F5E9;     /* 浅绿色 */
$primary-dark: #8BC34A;      /* 深绿色 */
$primary-surface: #F0F9E8;   /* 绿色表面 */

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
	$spacing-3: 20rpx;
	$spacing-4: 24rpx;
	$font-size-base: 26rpx;
	$font-size-lg: 30rpx;
	$font-size-xl: 34rpx;
}

@media screen and (max-width: 600rpx) {
	$spacing-3: 18rpx;
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
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

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
	font-weight: 700;
	color: $on-background;
}

.nav-placeholder {
	width: 64rpx;
}

/* ==================== 主内容区 ==================== */
.content {
	padding: $spacing-4;
	padding-bottom: 200rpx;
	width: 100%;
	max-width: 100%;
	overflow-x: hidden;
	box-sizing: border-box;
}

	/* ==================== 预览卡片 ==================== */
	.preview-card {
		background: $surface;
		border-radius: $radius-2xl;
		padding: $spacing-4;
		margin-bottom: $spacing-4;
		box-shadow: $shadow-md;
		border: 2rpx solid $outline;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 4rpx;
			background: $primary;
			opacity: 0.3;
		}

		&:active {
			transform: translateY(-4rpx);
			box-shadow: $shadow-lg;
		}
	}

	.preview-header {
		display: flex;
		align-items: center;
		gap: $spacing-2;
		margin-bottom: $spacing-3;
	}

	.preview-icon-wrapper {
		width: 56rpx;
		height: 56rpx;
		background: $primary-light;
		border-radius: $radius-lg;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: $shadow-sm;
	}

	.preview-icon {
		width: 32rpx;
		height: 32rpx;
	}

	.preview-title {
		font-size: $font-size-lg;
		font-weight: 700;
		color: $on-background;
		letter-spacing: 1rpx;
	}

	.preview-cabinet {
		background: #FFFFFF;
		border-radius: $radius-xl;
		overflow: hidden;
		box-shadow: $shadow-sm;
		border: 2rpx solid $outline;
		transition: all 0.3s ease;

		&:active {
			transform: scale(0.98);
		}
	}
.cabinet-body {
	padding: $spacing-3;
	display: grid;
	gap: $spacing-2;
}

.cabinet-cell {
	aspect-ratio: 1;
	background: $surface-variant;
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2rpx solid $outline-light;
	transition: all 0.2s ease;
}

.cell-number {
	font-size: $font-size-base;
	color: $on-surface-variant;
	font-weight: 600;
}

.ad-screen {
	height: 80rpx;
	background: $primary-surface;
	display: flex;
	align-items: center;
	justify-content: center;
	border-top: 2rpx solid $outline;
}

.ad-text {
	font-size: $font-size-sm;
	color: $primary-dark;
	font-weight: 600;
}

/* ==================== 选项容器 ==================== */
.options-container {
	display: flex;
	flex-direction: column;
	gap: $spacing-3;
	margin-bottom: $spacing-4;
}

/* ==================== 选项卡片 ==================== */
.option-card {
	background: $surface;
	border-radius: $radius-2xl;
	padding: $spacing-4;
	box-shadow: $shadow-sm;
	border: 2rpx solid $outline;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		transform: scale(0.99);
		box-shadow: $shadow-md;
	}
}

.card-header {
	display: flex;
	align-items: center;
	gap: $spacing-2;
	margin-bottom: $spacing-3;
}

.card-icon-wrapper {
	width: 48rpx;
	height: 48rpx;
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	justify-content: center;

	&.color {
		background: $primary-light;
	}

	&.style {
		background: $primary-light;
	}

	&.size {
		background: $primary-light;
	}

	&.ad {
		background: $primary-light;
	}
}

.card-icon {
	width: 28rpx;
	height: 28rpx;
}

.card-title {
	font-size: $font-size-base;
	font-weight: 700;
	color: $on-background;
}

/* ==================== 颜色选择器 ==================== */
.color-selector {
	display: flex;
	gap: $spacing-2;
	flex-wrap: wrap;
}

.color-item {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 3rpx solid $outline;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		transform: scale(0.95);
	}

	&.active {
		border-color: $primary;
		transform: scale(1.1);
		box-shadow: 0 0 0 4rpx $primary-light;
	}
}

.color-check {
	width: 24rpx;
	height: 24rpx;
	background: $primary;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.check-icon {
	font-size: 16rpx;
	color: #FFFFFF;
	font-weight: 700;
}

/* ==================== 风格选择器 ==================== */
.style-selector {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $spacing-2;
}

.style-item {
	background: $surface-variant;
	border: 2rpx solid $outline;
	border-radius: $radius-lg;
	padding: $spacing-3;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		transform: scale(0.95);
	}

	&.active {
		border-color: $primary;
		background: $primary-light;
	}
}

.style-check {
	position: absolute;
	top: $spacing-1;
	right: $spacing-1;
	width: 20rpx;
	height: 20rpx;
	background: $primary;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.style-name {
	font-size: $font-size-base;
	color: $on-background;
	font-weight: 600;
}

/* ==================== 尺寸选项 ==================== */
.size-options {
	display: flex;
	flex-direction: column;
	gap: $spacing-3;
}

.size-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.size-label {
	font-size: $font-size-base;
	color: $on-surface;
	font-weight: 500;
}

.size-control {
	display: flex;
	align-items: center;
	gap: $spacing-2;
}

.size-btn {
	width: 56rpx;
	height: 56rpx;
	background: $surface-variant;
	border: 2rpx solid $outline;
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		background: $primary-light;
		border-color: $primary;
		transform: scale(0.95);
	}

	.btn-icon {
		font-size: $font-size-xl;
		color: $on-background;
		font-weight: 600;
	}
}

.size-value {
	font-size: $font-size-lg;
	color: $on-background;
	font-weight: 700;
	width: 60rpx;
	text-align: center;
}

/* ==================== 广告屏选项 ==================== */
.ad-option {
	display: flex;
	gap: $spacing-2;
}

.ad-item {
	flex: 1;
	height: 80rpx;
	background: $surface-variant;
	border: 2rpx solid $outline;
	border-radius: $radius-lg;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		transform: scale(0.95);
	}

	&.active {
		border-color: $primary;
		background: $primary-light;
	}
}

.ad-check {
	position: absolute;
	top: $spacing-1;
	right: $spacing-1;
	width: 20rpx;
	height: 20rpx;
	background: $primary;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.ad-text {
	font-size: $font-size-base;
	color: $on-background;
	font-weight: 600;
}

/* ==================== 操作容器 ==================== */
.action-container {
	padding-top: $spacing-2;
}

	/* ==================== 保存按钮 ==================== */
	.save-btn {
		width: 100%;
		height: 96rpx;
		background: $primary;
		border-radius: $radius-xl;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: $shadow-md;
		position: relative;
		overflow: hidden;

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: -100%;
			width: 100%;
			height: 100%;
			background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
			transition: left 0.6s;
		}

		&:active {
			background: $primary-dark;
			transform: scale(0.98);
			box-shadow: $shadow-sm;

			&::before {
				left: 100%;
			}
		}

		.btn-text {
			font-size: $font-size-lg;
			color: #FFFFFF;
			font-weight: 700;
			letter-spacing: 2rpx;
		}
	}</style>
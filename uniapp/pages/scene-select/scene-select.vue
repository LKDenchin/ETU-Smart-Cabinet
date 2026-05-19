<template>
	<view class="container">
		<!-- 标题区域 -->
		<view class="header">
			<text class="title">请选择您的使用场景</text>
		</view>
		
		<!-- 场景选择按钮 -->
		<view class="scene-buttons">
			<view class="scene-card delivery-card" @click="selectScene('delivery')">
				<view class="card-image">
					<image class="image-icon" src="/static/icons/icon-order.png" mode="aspectFit"></image>
				</view>
				<view class="card-content">
					<text class="card-title">外卖柜</text>
					<text class="card-desc">外卖存取，便捷高效</text>
				</view>
			</view>

			<view class="scene-card storage-card" @click="selectScene('storage')">
				<view class="card-image">
					<image class="image-icon" src="/static/icons/icon-charging.png" mode="aspectFit"></image>
				</view>
				<view class="card-content">
					<text class="card-title">储物柜</text>
					<text class="card-desc">物品寄存，安全可靠</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'

const selectScene = (sceneType) => {
	// 保存选择的场景类型
	uni.setStorageSync('sceneType', sceneType)
	
	const sceneName = sceneType === 'delivery' ? '外卖柜' : '储物柜'
	
	uni.showToast({
		title: `已选择${sceneName}`,
		icon: 'success'
	})
	
	// 跳转到主页
	setTimeout(() => {
		uni.redirectTo({
			url: '/pages/index/index'
		})
	}, 1000)
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.container {
	min-height: 100vh;
	background: #FFFFFF;
	display: flex;
	flex-direction: column;
	padding: $spacing-4;
}

.header {
	text-align: center;
	margin-top: 120rpx;
	margin-bottom: 80rpx;

	.title {
		font-size: $font-size-2xl;
		font-weight: $font-weight-semibold;
		color: #2C3E50;
		line-height: 1.5;
	}
}

.scene-buttons {
	display: flex;
	flex-direction: column;
	gap: $spacing-4;
	flex: 1;
	justify-content: center;
	align-items: center;
}

.scene-card {
	width: 100%;
	max-width: 600rpx;
	height: 400rpx;
	border-radius: 32rpx;
	display: flex;
	align-items: center;
	padding: $spacing-4;
	background: #F5F7FA;
	border: 2rpx solid #E5E7EB;
	transition: all 0.2s ease-out;
	box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.08);

	&:active {
		transform: translateY(2rpx);
		box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.06);
	}

	&.delivery-card {
		background: linear-gradient(135deg, rgba(165, 214, 63, 0.1) 0%, rgba(139, 195, 74, 0.05) 100%);
		border-color: rgba(165, 214, 63, 0.3);

		&:active {
			background: linear-gradient(135deg, rgba(165, 214, 63, 0.15) 0%, rgba(139, 195, 74, 0.1) 100%);
		}
	}

	&.storage-card {
		background: linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(74, 144, 226, 0.05) 100%);
		border-color: rgba(74, 144, 226, 0.3);

		&:active {
			background: linear-gradient(135deg, rgba(74, 144, 226, 0.15) 0%, rgba(74, 144, 226, 0.1) 100%);
		}
	}
}

.card-image {
	width: 180rpx;
	height: 180rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: $spacing-4;
	flex-shrink: 0;

	.image-icon {
		width: 100rpx;
		height: 100rpx;
	}
}

.delivery-card .card-image {
	background: linear-gradient(135deg, #A5D63F 0%, #8BC34A 100%);
	box-shadow: 0 8rpx 24rpx rgba(165, 214, 63, 0.3);
}

.storage-card .card-image {
	background: linear-gradient(135deg, #4A90E2 0%, #5BA3F5 100%);
	box-shadow: 0 8rpx 24rpx rgba(74, 144, 226, 0.3);
}

.card-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-2;
}

.card-title {
	font-size: $font-size-xl;
	font-weight: $font-weight-semibold;
	color: #2C3E50;
	line-height: 1.5;
}

.card-desc {
	font-size: 28rpx;
	color: #5A6A7A;
	line-height: 1.5;
}
</style>
<template>
	<view class="login-container">
		<!-- 背景图片 -->
		<image class="background-image" src="/static/back.png" mode="aspectFill"></image>

		<!-- 主内容区 -->
		<view class="content-wrapper">
			<!-- 标题 -->
			<text class="title">欢迎使用易取宝</text>

			<!-- 登录表单 -->
			<view class="form-container">
				<!-- 昵称输入 -->
				<view class="input-group">
					<text class="input-label">昵称</text>
					<view class="input-wrapper">
						<image class="input-icon" src="/static/icons/icon-user.png" mode="aspectFit"></image>
						<input
							type="text"
							v-model="nickname"
							placeholder="请输入昵称"
							maxlength="20"
							class="modern-input"
						/>
					</view>
				</view>

				<!-- 手机号输入 -->
				<view class="input-group">
					<text class="input-label">手机号</text>
					<view class="input-wrapper">
						<image class="input-icon" src="/static/icons/icon-mobile.png" mode="aspectFit"></image>
						<input
							type="number"
							v-model="phone"
							placeholder="请输入手机号"
							maxlength="11"
							class="modern-input"
							@input="onPhoneInput"
						/>
					</view>
				</view>

				<!-- 密码输入 -->
				<view class="input-group">
					<text class="input-label">密码</text>
					<view class="input-wrapper">
						<image class="input-icon" src="/static/icons/icon-lock.png" mode="aspectFit"></image>
						<input
							type="password"
							v-model="password"
							placeholder="请输入密码"
							maxlength="20"
							class="modern-input"
						/>
					</view>
				</view>

				<!-- 登录按钮 -->
				<button
					class="login-btn"
					@click="handleLogin"
					:disabled="!canLogin"
				>
					登录
				</button>
			</view>

			<!-- 底部版权 -->
			<text class="copyright">Copyright © 2026 LKGeek Team. All rights reserved.</text>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { userApi } from '../../utils/request.js'

const phone = ref('')
const nickname = ref('')
const password = ref('')

onLoad(() => {
	// 检查是否已登录
	const userInfo = uni.getStorageSync('userInfo')
	if (userInfo && userInfo.token) {
		uni.reLaunch({
			url: '/pages/index/index'
		})
	}
})

const canLogin = computed(() => {
	return phone.value.length === 11
})

const onPhoneInput = (e) => {
	phone.value = e.detail.value.replace(/\D/g, '')
}

const handleLogin = async () => {
	if (!canLogin.value) return

	uni.showLoading({
		title: '登录中...'
	})

	try {
		// 调用服务器登录接口
		const result = await userApi.login(phone.value, password.value)

		// 保存 token
		uni.setStorageSync('token', result.token)

		// 如果用户设置了昵称，更新用户资料
		if (nickname.value) {
			try {
				await userApi.updateProfile({
					nickname: nickname.value
				})
				// 更新成功后重新获取用户信息
				result.nickname = nickname.value
			} catch (err) {
				console.error('更新用户资料失败:', err)
			}
		}

		// 保存用户信息
		uni.setStorageSync('userInfo', {
			id: result.id,
			phone: result.phone,
			nickname: result.nickname || nickname.value || result.nickname,
			avatar: result.avatar || '/static/default-avatar.png',
			isAdmin: result.isAdmin || false,
			token: result.token
		})

		// 初始化历史记录
		if (!uni.getStorageSync('history')) {
			uni.setStorageSync('history', [])
		}

		uni.hideLoading()
		uni.showToast({
			title: '登录成功',
			icon: 'success'
		})

		// 跳转到主页
		setTimeout(() => {
			uni.reLaunch({
				url: '/pages/main/main'
			})
		}, 1500)
	} catch (error) {
		uni.hideLoading()
		console.error('登录失败:', error)
	}
}
</script>

<style lang="scss" scoped>
.login-container {
	min-height: 100vh;
	position: relative;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.background-image {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
	opacity: 0.9;
}

.content-wrapper {
	width: 100%;
	height: 100%;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	padding: 0 40px;
	box-sizing: border-box;
	justify-content: flex-start;
}

.title {
	font-size: 32px;
	font-weight: 700;
	color: #003366;
	margin-top: 120px;
	text-align: left;
	margin-bottom: 60px;
}

.form-container {
	width: 100%;
	display: flex;
	flex-direction: column;
}

.input-group {
	width: 100%;
	margin-bottom: 24px;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.input-label {
	font-size: 14px;
	color: #999999;
	line-height: 1.4;
}

.input-wrapper {
	background: #FFFFFF;
	border-radius: 12px;
	padding: 0 16px;
	border: 1px solid #DCDCDC;
	height: 52px;
	display: flex;
	align-items: center;
	gap: 12px;
}

.input-icon {
	width: 20px;
	height: 20px;
	flex-shrink: 0;
	opacity: 0.6;
}

.modern-input {
	flex: 1;
	height: 100%;
	font-size: 16px;
	color: #222222;
	background: transparent;
	border: none;
	line-height: 1.4;

	&::placeholder {
		color: #BBBBBB;
		font-size: 16px;
	}
}

.login-btn {
	width: 100%;
	max-width: 310px;
	height: 52px;
	background: #A5D63F;
	color: #FFFFFF;
	border: none;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	font-weight: 700;
	letter-spacing: 4rpx;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
	transition: all 0.2s ease-out;
	line-height: 1;
	margin-top: 20px;
	align-self: center;

	&:disabled {
		background: #E0E0E0;
		color: #9E9E9E;
		box-shadow: none;
		opacity: 0.6;
	}

	&:not(:disabled):active {
		background: #8BC34A;
		transform: scale(0.98);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
	}
}

.copyright {
	font-size: 24rpx;
	color: #CCCCCC;
	text-align: center;
	margin-top: auto;
	padding: 40rpx 0 60rpx;
	line-height: 1.4;
}
</style>
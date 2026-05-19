<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<text class="nav-title">个人中心</text>
				<text class="placeholder"></text>
			</view>
		</view>
		
		<!-- 主内容区 -->
		<view class="content" :style="{ paddingTop: navbarHeight + 'px' }">
			<!-- 用户信息卡片 -->
			<view class="user-card">
				<view class="user-avatar" @click="editAvatar">
					<image class="avatar-image" :src="getAvatarUrl(userInfo.avatar)" mode="aspectFill"></image>
					<view class="avatar-badge">
						<image class="badge-icon" src="/static/icons/icon-edit.png" mode="aspectFit"></image>
					</view>
					<view class="avatar-overlay">
						<text class="avatar-overlay-text">更换头像</text>
					</view>
				</view>
				<view class="user-info">
					<view class="username-row">
						<text class="username">{{ userInfo.nickname || '用户' }}</text>
						<view class="edit-btn" @click="editNickname">
							<image class="edit-icon" src="/static/icons/icon-edit.png" mode="aspectFit"></image>
						</view>
					</view>
					<text class="phone">{{ formatPhone(userInfo.phone) }}</text>
				</view>
				<view class="user-stats">
					<view class="stat-item">
						<text class="stat-number">{{ totalStoreCount }}</text>
						<text class="stat-label">总存件</text>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-item">
						<text class="stat-number">{{ totalPickupCount }}</text>
						<text class="stat-label">总取件</text>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-item">
						<text class="stat-number">{{ currentItems }}</text>
						<text class="stat-label">在柜</text>
					</view>
				</view>
			</view>
			
			<!-- 快捷操作 -->
			<view class="quick-actions-section">
				<view class="section-title-wrapper">
					<text class="section-title">快捷功能</text>
				</view>
				<view class="quick-actions">
					<view class="action-item" @click="goToOrders">
						<view class="action-icon-wrapper">
							<image class="action-icon" src="/static/icons/icon-order1.png" mode="aspectFit"></image>
							<view class="action-badge" v-if="activeOrdersCount > 0">
								<text class="badge-dot"></text>
							</view>
						</view>
						<text class="action-label">我的订单</text>
					</view>
					<view class="action-item" @click="goToMyCustomizations">
						<view class="action-icon-wrapper">
							<image class="action-icon" src="/static/icons/icon-mysoc.png" mode="aspectFit"></image>
						</view>
						<text class="action-label">我的定制</text>
					</view>
					<view class="action-item" @click="goToSettings">
						<view class="action-icon-wrapper">
							<image class="action-icon" src="/static/icons/icon-settings.png" mode="aspectFit"></image>
						</view>
						<text class="action-label">设置</text>
					</view>
					<view class="action-item" @click="contactService">
						<view class="action-icon-wrapper">
							<image class="action-icon" src="/static/icons/icon-phone.png" mode="aspectFit"></image>
						</view>
						<text class="action-label">联系客服</text>
					</view>
				</view>
			</view>
			
			<!-- 功能菜单 -->
			<view class="menu-section">
				<view class="section-title-wrapper">
					<text class="section-title">更多功能</text>
				</view>
				<view class="menu-card">
					<view class="menu-item" @click="goToAbout">
						<image class="menu-icon" src="/static/icons/icon-info.png" mode="aspectFit"></image>
						<text class="menu-text">关于我们</text>
						<text class="menu-arrow">›</text>
					</view>
					<view class="menu-divider"></view>
					<view class="menu-item" @click="changePassword">
						<image class="menu-icon" src="/static/icons/icon-edit.png" mode="aspectFit"></image>
						<text class="menu-text">修改密码</text>
						<text class="menu-arrow">›</text>
					</view>
					<view class="menu-divider"></view>
					<view class="menu-item" @click="clearCache">
						<image class="menu-icon" src="/static/icons/icon-trash.png" mode="aspectFit"></image>
						<text class="menu-text">清除缓存</text>
						<text class="menu-arrow">›</text>
					</view>
				</view>
			</view>
			
			<!-- 退出登录 -->
			<view class="logout-card">
				<button class="logout-btn" @click="logout">退出登录</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { userApi, getAvatarUrl } from '../../utils/request.js'

// 响应式数据
const statusBarHeight = ref(0)
const navbarHeight = ref(0)
const userInfo = ref({})
const history = ref([])

// 计算属性
const totalStoreCount = computed(() => {
	return history.value.filter(item => item.type === 'store').length
})

const totalPickupCount = computed(() => {
	return history.value.filter(item => item.type === 'pickup').length
})

const currentItems = computed(() => {
	return history.value.filter(item => 
		item.type === 'store' && !item.pickedUp
	).length
})

const activeOrdersCount = computed(() => {
	return history.value.filter(item => 
		item.type === 'store' && !item.pickedUp
	).length
})

onLoad(() => {
	// 获取状态栏高度
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 44
	navbarHeight.value = statusBarHeight.value + 88
})

// 加载用户数据
const loadUserData = async () => {
	// 先使用本地存储的数据
	userInfo.value = uni.getStorageSync('userInfo') || {}
	
	// 尝试从服务器获取最新用户信息
	try {
		const result = await userApi.getUserInfo()
		if (result && result.success) {
			const latestUserInfo = {
				id: result.data.id,
				phone: result.data.phone,
				nickname: result.data.nickname,
				avatar: result.data.avatar,
				isAdmin: result.data.is_admin,
				createTime: result.data.create_time,
				token: userInfo.value.token
			}
			
			// 更新本地存储
			uni.setStorageSync('userInfo', latestUserInfo)
			// 更新本地状态
			userInfo.value = latestUserInfo
			
			// 检查管理员状态是否变化
			const storedUser = uni.getStorageSync('userInfo')
			if (storedUser.isAdmin !== latestUserInfo.isAdmin) {
				console.log('管理员状态已更新:', storedUser.isAdmin, '->', latestUserInfo.isAdmin)
			}
		}
	} catch (error) {
		console.error('获取最新用户信息失败:', error)
		// 请求失败时使用本地存储的数据
	}
}

// 加载历史记录
const loadHistory = () => {
	history.value = uni.getStorageSync('history') || []
}

onShow(() => {
	loadUserData()
	loadHistory()
	// 隐藏原生tabbar
	uni.hideTabBar({
		animation: false
	})
})

// 格式化手机号
const formatPhone = (phone) => {
	if (!phone) return ''
	return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 跳转到我的定制页面

const goToMyCustomizations = () => {

	uni.navigateTo({

		url: '/pages/my-customizations/my-customizations'

	})

}



// 跳转到订单页面

const goToOrders = () => {

	uni.reLaunch({

		url: '/pages/main/main?tab=3'

	})

}

// 跳转到设置页面
const goToSettings = () => {
	uni.navigateTo({
		url: '/pages/settings/settings'
	})
}

// 跳转到关于页面
const goToAbout = () => {
	uni.showToast({
		title: '关于我们',
		icon: 'none'
	})
}

// 修改昵称
const editNickname = async () => {
	uni.showModal({
		title: '修改昵称',
		editable: true,
		placeholderText: '请输入新昵称',
		content: userInfo.value.nickname || '',
		success: async (res) => {
			if (res.confirm && res.content && res.content.trim()) {
				const newNickname = res.content.trim()
				if (newNickname.length > 20) {
					uni.showToast({
						title: '昵称不能超过20个字符',
						icon: 'none'
					})
					return
				}
				
				try {
					uni.showLoading({
						title: '修改中...'
					})

					// 调用服务器接口更新昵称
					const result = await userApi.updateProfile({ nickname: newNickname })
					
					// 更新本地用户信息
					userInfo.value.nickname = newNickname
					userInfo.value.isAdmin = result.is_admin
					
					// 保存到本地存储
					uni.setStorageSync('userInfo', userInfo.value)
					
					uni.hideLoading()
					
					// 检查是否失去管理员权限
					if (userInfo.value.isAdmin === false) {
						uni.showToast({
							title: '昵称已修改，管理员权限已取消',
							icon: 'none',
							duration: 3000
						})
					} else {
						uni.showToast({
							title: '修改成功',
							icon: 'success'
						})
					}
					
					// 刷新用户数据
					loadUserData()
				} catch (error) {
					uni.hideLoading()
					console.error('修改昵称失败:', error)
					uni.showToast({
						title: '修改失败，请重试',
						icon: 'none'
					})
				}
			}
		}
	})
}

// 修改头像
const editAvatar = () => {
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: async (res) => {
			const tempFilePath = res.tempFilePaths[0]

			try {
				uni.showLoading({
					title: '上传中...'
				})

				// 上传头像到服务器
				const result = await userApi.uploadAvatar(tempFilePath)

				// 拼接完整的头像URL（服务器地址 + 相对路径）
				const serverBase = 'http://112.236.171.141:1145'
				const fullAvatarUrl = serverBase + result.avatarPath

				// 更新本地用户信息
				userInfo.value.avatar = fullAvatarUrl
				uni.setStorageSync('userInfo', userInfo.value)

				uni.hideLoading()
				uni.showToast({
					title: '头像更新成功',
					icon: 'success'
				})
			} catch (error) {
				uni.hideLoading()
				console.error('上传头像失败:', error)
				uni.showToast({
					title: error.message || '上传失败',
					icon: 'none'
				})
			}
		},
		fail: () => {
			uni.showToast({
				title: '选择头像失败',
				icon: 'none'
			})
		}
	})
}

// 清除缓存
const clearCache = () => {
	uni.showModal({
		title: '确认清除',
		content: '确定要清除所有缓存数据吗？',
		success: (res) => {
			if (res.confirm) {
				// 保留用户信息，清除其他数据
				const userInfo = uni.getStorageSync('userInfo')
				uni.clearStorageSync()
				uni.setStorageSync('userInfo', userInfo)
				
				uni.showToast({
					title: '清除成功',
					icon: 'success'
				})
				
				// 重新加载数据
				loadUserData()
				loadHistory()
			}
		}
	})
}

// 联系客服
const contactService = () => {
	uni.showActionSheet({
		itemList: ['电话客服', '在线客服'],
		success: (res) => {
			if (res.tapIndex === 0) {
				// 拨打客服电话
				uni.makePhoneCall({
					phoneNumber: '400-123-4567'
				})
			} else if (res.tapIndex === 1) {
				// 打开在线客服
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				})
			}
		}
	})
}

// 退出登录
const logout = () => {
	console.log('退出登录被点击')
	
	uni.showModal({
		title: '确认退出',
		content: '确定要退出登录吗？',
		success: (res) => {
			console.log('退出登录确认结果:', res)
			
			if (res.confirm) {
				// 清除用户信息
				uni.removeStorageSync('userInfo')
				uni.removeStorageSync('token')
				
				console.log('用户信息已清除')
				
				uni.showToast({
					title: '已退出登录',
					icon: 'success'
				})
				
				// 跳转到登录页面
				setTimeout(() => {
					console.log('准备跳转到登录页')
					uni.reLaunch({
						url: '/pages/login/login'
					})
				}, 1500)
			}
		}
	})
}

// 修改密码
const changePassword = () => {
	console.log('===== 开始修改密码流程 =====')
	
	// 检查是否已登录
	const token = uni.getStorageSync('token')
	console.log('当前token状态:', !!token)
	
	if (!token) {
		uni.showToast({
			title: '请先登录',
			icon: 'none'
		})
		setTimeout(() => {
			uni.reLaunch({
				url: '/pages/login/login'
			})
		}, 1000)
		return
	}
	
	uni.showModal({
		title: '修改密码',
		editable: true,
		placeholderText: '请输入新密码',
		success: (res) => {
			console.log('第一次密码弹窗结果:', JSON.stringify(res))
			console.log('confirm:', res.confirm, 'cancel:', res.cancel, 'content:', res.content, 'content类型:', typeof res.content)
			
			if (res.confirm) {
				const newPassword = res.content ? res.content.trim() : ''
				console.log('处理后的新密码:', newPassword, '长度:', newPassword.length)
				
				if (!newPassword) {
					uni.showToast({
						title: '密码不能为空',
						icon: 'none'
					})
					return
				}
				
				// 使用 setTimeout 延迟显示第二次确认弹窗
				console.log('延迟500ms显示第二次确认密码弹窗')
				setTimeout(() => {
					console.log('开始显示第二次确认密码弹窗')
					uni.showModal({
						title: '确认密码',
						editable: true,
						placeholderText: '请再次输入新密码',
						success: (confirmRes) => {
							console.log('第二次密码弹窗结果:', JSON.stringify(confirmRes))
							
							if (confirmRes.confirm) {
								const confirmPassword = confirmRes.content ? confirmRes.content.trim() : ''
								console.log('处理后的确认密码:', confirmPassword, '长度:', confirmPassword.length)
								
								if (!confirmPassword) {
									uni.showToast({
										title: '确认密码不能为空',
										icon: 'none'
									})
									return
								}
								
								if (newPassword !== confirmPassword) {
									uni.showToast({
										title: '两次密码不一致',
										icon: 'none'
									})
									return
								}
								
								// 执行修改密码
								console.log('密码验证通过，准备发送请求')
								uni.showLoading({
									title: '修改中...'
								})
								
								// 使用 uni.request 直接发送请求
								uni.request({
									url: 'http://112.236.171.141:1145/api/user/update-password',
									method: 'PUT',
									header: {
										'Content-Type': 'application/json',
										'Authorization': `Bearer ${token}`
									},
									data: {
										password: newPassword
									},
									success: (response) => {
										console.log('修改密码响应:', JSON.stringify(response))
										uni.hideLoading()
										
										if (response.data && response.data.success) {
											uni.showToast({
												title: '密码修改成功',
												icon: 'success'
											})
											
											// 立即清除登录状态并跳转
											console.log('清除登录状态并跳转')
											uni.removeStorageSync('userInfo')
											uni.removeStorageSync('token')
											uni.reLaunch({
												url: '/pages/login/login'
											})
										} else {
											uni.showToast({
												title: response.data?.message || '修改失败',
												icon: 'none'
											})
										}
									},
									fail: (error) => {
										console.error('修改密码请求失败:', JSON.stringify(error))
										uni.hideLoading()
										uni.showToast({
											title: '网络错误，请重试',
											icon: 'none'
										})
									}
								})
							} else {
								console.log('用户取消了确认密码')
							}
						},
						fail: (err) => {
							console.error('第二次弹窗失败:', JSON.stringify(err))
							uni.showToast({
								title: '弹窗显示失败',
								icon: 'none'
							})
						}
					})
				}, 500)
			} else {
				console.log('用户取消了第一次输入')
			}
		},
		fail: (err) => {
			console.error('第一次弹窗失败:', JSON.stringify(err))
		}
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
	padding-bottom: 180rpx;
	position: relative;
	overflow: hidden;

	/* 顶部柔和渐变装饰 */
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 520rpx;
		background: linear-gradient(180deg, rgba(165, 214, 63, 0.06) 0%, rgba(255, 255, 255, 0) 100%);
		border-radius: 0 0 100rpx 100rpx;
		z-index: 0;
	}

	/* 左上角几何装饰 - 方形 */
	&::after {
		content: '';
		position: absolute;
		top: 160rpx;
		left: -40rpx;
		width: 160rpx;
		height: 160rpx;
		border-radius: $radius-lg;
		background: linear-gradient(135deg, rgba(165, 214, 63, 0.12) 0%, rgba(139, 195, 74, 0.06) 100%);
		z-index: 0;
	}
}

/* ==================== 导航栏 ==================== */
.navbar {
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(12rpx);
	-webkit-backdrop-filter: blur(12rpx);
	border-bottom: 1.5rpx solid $outline-light;
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 1000;
}

.nav-content {
	padding: $spacing-1 $spacing-4;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.nav-title {
	font-size: $font-size-xl;
	font-weight: $font-weight-semibold;
	color: $on-background;
	line-height: 1.5;
}

.placeholder {
	width: 48rpx;
	height: 48rpx;
}

/* ==================== 主内容区 ==================== */
.content {
	padding: $spacing-4 $spacing-4;
	padding-top: $spacing-3;
	position: relative;
	z-index: 1;
}

/* ==================== 用户信息卡片 ==================== */
.user-card {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(12rpx);
	-webkit-backdrop-filter: blur(12rpx);
	border-radius: $radius-2xl;
	padding: $spacing-5;
	margin-bottom: $spacing-4;
	border: 1.5rpx solid $outline-light;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: $shadow-md;
	position: relative;
	overflow: hidden;

	/* 顶部极简线条装饰 */
	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: linear-gradient(90deg, $primary 0%, $primary-light 100%);
		opacity: 0.7;
	}
}

.user-avatar {
	width: 128rpx;
	height: 128rpx;
	border-radius: 50%;
	overflow: hidden;
	margin-bottom: $spacing-4;
	border: 3rpx solid $primary;
	position: relative;
	background: $surface;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: $shadow-sm;

	.avatar-image {
		width: 100%;
		height: 100%;
	}

	.avatar-badge {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 40rpx;
		height: 40rpx;
		background: $accent-blue;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 3rpx solid $surface;
		box-shadow: $shadow-xs;

		.badge-icon {
			font-size: 20rpx;
			width: 1em;
			height: 1em;
		}
	}

	.avatar-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.2s ease;

		.avatar-overlay-text {
			font-size: 20rpx;
			color: #FFFFFF;
			line-height: 1;
		}

		&:active {
			opacity: 1;
		}
	}
}

.user-info {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: $spacing-5;
	position: relative;
	z-index: 1;

	.username-row {
		display: flex;
		align-items: center;
		gap: $spacing-1;
		margin-bottom: $spacing-1;

		.username {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		color: $on-background;
		line-height: 1.5;
		letter-spacing: 1rpx;
	}

		.edit-btn {
			width: 44rpx;
			height: 44rpx;
			background: $surface;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			border: 1.5rpx solid $outline-light;
			transition: all 0.2s ease-out;
			box-shadow: $shadow-xs;

			&:active {
				transform: translateY(2rpx);
				background: $surface-variant;
				border-color: $primary;
			}

			.edit-icon {
				font-size: 20rpx;
				color: $primary-dark;
				width: 1em;
				height: 1em;
			}
		}
	}

	.phone {
		font-size: $font-size-sm;
		color: $on-surface-variant;
		line-height: 1.5;
		background: $surface-variant;
		padding: $spacing-1 $spacing-4;
		border-radius: 50rpx;
		font-weight: $font-weight-normal;
		border: 1rpx solid $outline;
	}
}

.user-stats {
	display: flex;
	align-items: center;
	width: 100%;
	justify-content: space-around;
	background: rgba(255, 255, 255, 0.8);
	border-radius: $radius-lg;
	padding: $spacing-4;
	box-shadow: $shadow-sm;
	border: 1rpx solid $outline-light;
	position: relative;
	z-index: 1;
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;

	.stat-number {
		font-size: $font-size-lg;
		font-weight: $font-weight-medium;
		color: $primary-dark;
		margin-bottom: $spacing-1;
		line-height: 1.4;
		letter-spacing: 1rpx;
	}

	.stat-label {
		font-size: $font-size-xs;
		color: $on-surface-variant;
		line-height: 1.5;
		font-weight: $font-weight-normal;
		letter-spacing: 0.5rpx;
	}
}

.stat-divider {
	width: 1rpx;
	height: 60rpx;
	background: $outline;
	opacity: 0.6;
}

/* ==================== 快捷操作 ==================== */
.quick-actions-section {
	margin-bottom: $spacing-4;
}

.section-title-wrapper {
	margin-bottom: $spacing-3;
	padding-left: $spacing-1;

	.section-title {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: $on-background;
		line-height: 1.5;
		letter-spacing: 0.5rpx;
	}
}

.quick-actions {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: $spacing-3;
}

.action-item {
	background: $surface;
	border-radius: $radius-lg;
	padding: $spacing-4 $spacing-2;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-2;
	border: 1.5rpx solid $outline-light;
	transition: all 0.2s ease-out;
	position: relative;
	overflow: hidden;
	box-shadow: $shadow-xs;

	/* 背景装饰 */
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(165, 214, 63, 0.03) 0%, rgba(232, 245, 233, 0.02) 100%);
		transition: opacity 0.2s ease;
	}

	&:active {
		transform: translateY(2rpx);
		box-shadow: $shadow-sm;

		&::before {
			opacity: 1;
		}
	}

	.action-icon-wrapper {
		position: relative;
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.action-icon {
		font-size: 44rpx;
		width: 1em;
		height: 1em;
		position: relative;
		z-index: 1;
	}

	.action-label {
		font-size: $font-size-xs;
		color: $on-background;
		font-weight: $font-weight-normal;
		line-height: 1.5;
		letter-spacing: 0.5rpx;
		position: relative;
		z-index: 1;
	}

	.action-badge {
		position: absolute;
		top: 0;
		right: 0;
		z-index: 1;

		.badge-dot {
			width: 14rpx;
			height: 14rpx;
			background: $accent-red;
			border-radius: 50%;
			box-shadow: 0 0 0 3rpx $surface;
		}
	}
}

/* ==================== 功能菜单 ==================== */
.menu-section {
	margin-bottom: $spacing-4;
}

.menu-card {
	background: $surface;
	border-radius: $radius-2xl;
	border: 1.5rpx solid $outline-light;
	box-shadow: $shadow-sm;
	overflow: hidden;
}

.menu-item {
	display: flex;
	align-items: center;
	padding: $spacing-4 $spacing-5;
	transition: all 0.2s ease-out;
	position: relative;
	overflow: hidden;

	/* 左侧装饰条 */
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: 4rpx;
		background: linear-gradient(180deg, $primary 0%, $primary-light 100%);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	&:active {
		background: $surface-variant;

		&::before {
			opacity: 1;
		}
	}

	.menu-icon {
		font-size: 40rpx;
		margin-right: $spacing-3;
		width: 1em;
		height: 1em;
	}

	.menu-text {
		flex: 1;
		font-size: $font-size-base;
		color: $on-background;
		line-height: 1.5;
		font-weight: $font-weight-normal;
		letter-spacing: 0.5rpx;
	}

	.menu-arrow {
		font-size: $font-size-lg;
		color: $on-surface-light;
		line-height: 1.5;
		font-weight: $font-weight-normal;
	}
}

.menu-divider {
	height: 1rpx;
	background: $outline;
	margin-left: 96rpx;
	opacity: 0.6;
}

/* ==================== 退出登录 ==================== */
.logout-card {
	background: $surface;
	border-radius: $radius-2xl;
	border: 1.5rpx solid $outline-light;
	box-shadow: $shadow-sm;
	overflow: hidden;
}

.logout-btn {
	width: 100%;
	height: 80rpx;
	background: $surface;
	border: 2rpx solid $outline;
	color: #F44336;
	border-radius: $radius-lg;
	padding: 0;
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	line-height: 1.5;
	transition: all 0.2s ease-out;
	box-shadow: $shadow-xs;
	display: flex;
	align-items: center;
	justify-content: center;

	&:active {
		background: #EF9A9A;
		border-color: #F44336;
		transform: translateY(2rpx);
		box-shadow: $shadow-sm;
	}
}
</style>
<script>
	// NFC 相关变量
	let nfcAdapter = null
	let main = null
	let pendingIntent = null
	let intentFiltersArray = []
	let techListsArray = []
	let NfcAdapter = null
	let isNFCEnabled = false

	export default {
		onLaunch: function() {
			console.log('App Launch')

			// 隐藏原生tabbar
			uni.hideTabBar({
				animation: false
			})

			// 检查登录状态
			const userInfo = uni.getStorageSync('userInfo')
			if (!userInfo || !userInfo.token) {
				// 如果未登录，跳转到登录页
				uni.reLaunch({
					url: '/pages/login/login'
				})
			} else {
				// 如果已登录，跳转到主页
				uni.switchTab({
					url: '/pages/main/main'
				})
			}

			// 初始化应用数据
			this.initAppData()

			// 初始化 NFC
			// #ifdef APP-PLUS
			this.initNFC()
			// #endif
		},
		onShow: function() {
			// 确保原生tabbar隐藏
			uni.hideTabBar({
				animation: false
			})

			// #ifdef APP-PLUS
			if (isNFCEnabled && nfcAdapter && main) {
				try {
					nfcAdapter.enableForegroundDispatch(main, pendingIntent, intentFiltersArray, techListsArray)
				} catch (e) {
					console.error('启用 NFC 前台分发失败:', e)
				}
			}
			// #endif
		},
		onHide: function() {
			// #ifdef APP-PLUS
			if (isNFCEnabled && nfcAdapter && main) {
				try {
					nfcAdapter.disableForegroundDispatch(main)
				} catch (e) {
					console.error('禁用 NFC 前台分发失败:', e)
				}
			}
			// #endif
		},
		methods: {
			// 初始化应用数据
			initAppData() {
				// 初始化历史记录数据（如果不存在）
				if (!uni.getStorageSync('history')) {
					uni.setStorageSync('history', [])
				}

				// 初始化设置数据（如果不存在）
				if (!uni.getStorageSync('notificationSettings')) {
					uni.setStorageSync('notificationSettings', {
						storeReminder: true,
						pickupReminder: true,
						marketing: false
					})
				}
			},

			// #ifdef APP-PLUS
			// 初始化 NFC
			initNFC() {
				try {
					// 导入必要的 Android 类
					const Intent = plus.android.importClass('android.content.Intent')
					const PendingIntent = plus.android.importClass('android.app.PendingIntent')
					const IntentFilter = plus.android.importClass('android.content.IntentFilter')
					NfcAdapter = plus.android.importClass('android.nfc.NfcAdapter')

					main = plus.android.runtimeMainActivity()
					nfcAdapter = NfcAdapter.getDefaultAdapter(main)

					if (!nfcAdapter) {
						console.log('设备不支持 NFC')
						return
					}

					if (!nfcAdapter.isEnabled()) {
						console.log('NFC 功能未开启')
						return
					}

					isNFCEnabled = true

					// 创建 PendingIntent
					const intent = new Intent(main, main.getClass())
					intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
					pendingIntent = PendingIntent.getActivity(main, 0, intent, 0)

					// 创建 IntentFilters
					const ndef = new IntentFilter(NfcAdapter.ACTION_NDEF_DISCOVERED)
					ndef.addDataType('*/*')

					const tag = new IntentFilter(NfcAdapter.ACTION_TAG_DISCOVERED)
					const tech = new IntentFilter(NfcAdapter.ACTION_TECH_DISCOVERED)

					intentFiltersArray = [ndef, tag, tech]

					// 创建技术列表
					techListsArray = [
						['android.nfc.tech.Ndef'],
						['android.nfc.tech.IsoDep'],
						['android.nfc.tech.NfcA'],
						['android.nfc.tech.NfcB'],
						['android.nfc.tech.NfcF'],
						['android.nfc.tech.NfcV'],
						['android.nfc.tech.NdefFormatable'],
						['android.nfc.tech.MifareClassic'],
						['android.nfc.tech.MifareUltralight']
					]

					// 监听 NFC 标签事件
					plus.globalEvent.addEventListener('newintent', this.handleNFCIntent)

					// 启用前台分发
					nfcAdapter.enableForegroundDispatch(main, pendingIntent, intentFiltersArray, techListsArray)
					console.log('NFC 监听已启动')
				} catch (e) {
					console.error('NFC 初始化失败:', e)
					isNFCEnabled = false
				}
			},

			// 处理 NFC 标签事件
			handleNFCIntent() {
				try {
					const intent = main.getIntent()
					const action = intent.getAction()

					if (NfcAdapter.ACTION_NDEF_DISCOVERED === action ||
						NfcAdapter.ACTION_TAG_DISCOVERED === action ||
						NfcAdapter.ACTION_TECH_DISCOVERED === action) {

						// 读取 NFC 标签数据
						const data = this.readNFCData(intent)

						if (data) {
							// 通过全局事件通知页面
							uni.$emit('nfcDataReceived', data)
						}
					}
				} catch (e) {
					console.error('处理 NFC 事件失败:', e)
				}
			},

			// 读取 NFC 数据
			readNFCData(intent) {
				try {
					const Ndef = plus.android.importClass('android.nfc.tech.Ndef')
					const NdefMessage = plus.android.importClass('android.nfc.NdefMessage')

					const tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG)
					const ndef = Ndef.get(tag)

					if (ndef) {
						// 读取 NDEF 数据
						const ndefMessage = ndef.getCachedNdefMessage()

						if (ndefMessage) {
							const records = plus.android.invoke(ndefMessage, 'getRecords')
							console.log('NDEF记录数量:', records.length)

							if (records && records.length > 0) {
								const record = records[0]
								const payload = plus.android.invoke(record, 'getPayload')
								console.log('Payload长度:', payload.length)
								console.log('Payload原始字节:', this.bytesToHexString(payload))

								if (payload && payload.length > 0) {
									// 检查是否为文本记录
									const tnf = plus.android.invoke(record, 'getTnf')
									console.log('TNF类型:', tnf)
									
									if (tnf === 1) { // TNF_WELL_KNOWN
										// 解析 NDEF 文本记录
										// 第一个字节是状态字节
										const statusByte = payload[0] & 0xFF
										console.log('状态字节:', statusByte)

										// 状态字节的低6位是语言代码长度
										const langCodeLength = statusByte & 0x3F
										console.log('语言代码长度:', langCodeLength)

										// 跳过状态字节和语言代码
										const textStart = 1 + langCodeLength
										console.log('文本起始位置:', textStart)

										if (payload.length > textStart) {
											// 提取文本内容
											const textBytes = payload.slice(textStart)
											console.log('文本字节:', this.bytesToHexString(textBytes))
											const text = plus.android.newObject('java.lang.String', textBytes, 'UTF-8').toString()
											console.log('解析后的文本:', text)
											return text
										}
									} else {
										// 对于非文本记录，直接尝试读取payload作为字符串
										try {
											const text = plus.android.newObject('java.lang.String', payload, 'UTF-8').toString()
											console.log('直接解析UTF-8文本:', text)
											return text
										} catch (e) {
											// 如果UTF-8解码失败，尝试ASCII
											const text = plus.android.newObject('java.lang.String', payload, 'US-ASCII').toString()
											console.log('直接解析ASCII文本:', text)
											return text
										}
									}
								}
							}
						}
					}

					// 如果没有 NDEF 数据，尝试直接读取标签内存（适用于MifareUltralight/NTAG）
					try {
						const MifareUltralight = plus.android.importClass('android.nfc.tech.MifareUltralight')
						const mifare = MifareUltralight.get(tag)
						
						if (mifare) {
							mifare.connect()
							try {
								// 读取页面4开始的数据（跳过UID和CC）
								const pages = mifare.readPages(4)
								console.log('MifareUltralight读取数据长度:', pages.length)
								if (pages && pages.length > 0) {
									// 读取所有字节，直到遇到空字符
									let idBytes = []
									for (let i = 0; i < pages.length; i++) {
										if (pages[i] === 0) break
										idBytes.push(pages[i])
									}
									console.log('MifareUltralight原始字节:', this.bytesToHexString(idBytes))
									const id = plus.android.newObject('java.lang.String', idBytes, 'UTF-8').toString()
									console.log('MifareUltralight解析结果:', id)
									return id
								}
							} finally {
								mifare.close()
							}
						}
					} catch (e) {
						console.log('MifareUltralight读取失败，尝试其他方式:', e)
					}

					// 如果没有 NDEF 数据，尝试读取标签 ID
					const id = plus.android.invoke(tag, 'getId')
					if (id) {
						const hexId = this.bytesToHexString(id)
						console.log('标签ID:', hexId)
						return hexId
					}

					return null
				} catch (e) {
					console.error('读取 NFC 数据失败:', e)
					return null
				}
			},

			// 字节数组转十六进制字符串
			bytesToHexString(bytes) {
				let hex = ''
				for (let i = 0; i < bytes.length; i++) {
					let value = bytes[i]
					if (value < 0) {
						value = 256 + value
					}
					const hexValue = value.toString(16)
					hex += (hexValue.length === 1 ? '0' : '') + hexValue
				}
				return hex.toUpperCase()
			}
			// #endif
		}
	}
</script>

<style>
	/* 全局样式 - 浅色主题 */
	page {
		background-color: #FFFFFF;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
		color: #1A1A1A;
		min-height: 100vh;
		transition: all 0.3s ease;
	}
	
	/* 页面切换动画 */
	.fade-enter-active, .fade-leave-active {
		transition: opacity 0.3s ease;
	}
	
	.fade-enter-from, .fade-leave-to {
		opacity: 0;
	}
	
	.slide-enter-active, .slide-leave-active {
		transition: transform 0.3s ease;
	}
	
	.slide-enter-from {
		transform: translateX(100%);
	}
	
	.slide-leave-to {
		transform: translateX(-100%);
	}
	
	/* 全局动画类 */
	.fade-in {
		animation: fadeIn 0.3s ease-in-out;
	}
	
	.fade-out {
		animation: fadeOut 0.3s ease-in-out;
	}
	
	.slide-up {
		animation: slideUp 0.3s ease-in-out;
	}
	
	.slide-down {
		animation: slideDown 0.3s ease-in-out;
	}
	
	.scale-in {
		animation: scaleIn 0.3s ease-in-out;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	@keyframes fadeOut {
		from { opacity: 1; }
		to { opacity: 0; }
	}
	
	@keyframes slideUp {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
	}zhuy
	
	@keyframes slideDown {
		from { transform: translateY(-100%); }
		to { transform: translateY(0); }
	}
	
	@keyframes scaleIn {
		from { transform: scale(0.8); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
	
	/* 通用样式 */
	.container {
		min-height: 100vh;
	}
	
	/* 卡片样式 */
	.card {
		background: #F8F9FA;
		border-radius: 20rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	}
	
	/* 按钮样式 */
	.btn {
		border-radius: 16rpx;
		font-weight: 500;
		transition: all 0.3s ease;
	}
	
	.btn-primary {
		background: #2ECC71;
		color: #ffffff;
	}
	
	.btn-secondary {
		background: transparent;
		color: #2ECC71;
		border: 2rpx solid #2ECC71;
	}
	
	.btn-tertiary {
		background: #F8F9FA;
		color: #1A1A1A;
		border: 1rpx solid #EEEEEE;
	}
	
	.btn-danger {
		background: #E74C3C;
		color: #ffffff;
	}
	
	/* 文本样式 */
	.text-primary {
		color: #2ECC71;
	}
	
	.text-success {
		color: #2ECC71;
	}
	
	.text-warning {
		color: #F39C12;
	}
	
	.text-danger {
		color: #E74C3C;
	}
	
	.text-muted {
		color: #CCCCCC;
	}
	
	/* 边距样式 */
	.mt-20 { margin-top: 20rpx; }
	.mt-30 { margin-top: 30rpx; }
	.mb-20 { margin-bottom: 20rpx; }
	.mb-30 { margin-bottom: 30rpx; }
	.p-20 { padding: 20rpx; }
	.p-30 { padding: 30rpx; }
	
	/* 布局样式 */
	.flex {
		display: flex;
	}
	
	.flex-column {
		flex-direction: column;
	}
	
	.align-center {
		align-items: center;
	}
	
	.justify-center {
		justify-content: center;
	}
	
	.justify-between {
		justify-content: space-between;
	}
	
	.flex-1 {
		flex: 1;
	}
	
	/* 文本对齐 */
	.text-center {
		text-align: center;
	}
	
	.text-left {
		text-align: left;
	}
	
	.text-right {
		text-align: right;
	}
</style>
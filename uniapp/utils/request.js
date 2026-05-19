/**
 * 网络请求封装工具
 * 统一处理 API 请求，支持自动添加 token 和错误处理
 */

// 服务器地址配置 - 根据实际情况修改
const BASE_URL = 'http://112.236.171.141:1145/api';
const SERVER_BASE = 'http://112.236.171.141:1145';

/**
 * 获取完整的头像URL
 * 如果是相对路径，则拼接服务器地址
 * @param {string} avatarPath - 头像路径（可以是相对路径或完整URL）
 * @returns {string} 完整的头像URL
 */
export function getAvatarUrl(avatarPath) {
  if (!avatarPath) {
    return '/static/default-avatar.png';
  }
  // 如果已经是完整URL，直接返回
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  // 如果是相对路径，拼接服务器地址
  if (avatarPath.startsWith('/uploads/') || avatarPath.startsWith('/static/')) {
    return SERVER_BASE + avatarPath;
  }
  // 其他情况，假设是相对路径
  return SERVER_BASE + '/' + avatarPath;
}

/**
 * 统一请求方法
 * @param {string} url - 接口路径（不包含 BASE_URL）
 * @param {object} options - 请求配置
 * @param {string} options.method - 请求方法（GET/POST/PUT/DELETE）
 * @param {object} options.data - 请求数据
 * @param {boolean} options.needAuth - 是否需要认证（默认 true）
 * @returns {Promise} 返回 Promise 对象
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const { method = 'GET', data = {}, needAuth = true } = options;

    // 获取 token
    const token = uni.getStorageSync('token');

    // 构建请求头
    const header = {
      'Content-Type': 'application/json'
    };

    // 如果需要认证且存在 token，添加到请求头
    if (needAuth && token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    // 构建请求 URL
    let requestUrl = BASE_URL + url;

    // GET 请求将参数拼接到 URL（不使用 URLSearchParams，兼容安卓）
    if (method === 'GET' && Object.keys(data).length > 0) {
      const paramParts = [];
      for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
          paramParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`);
        }
      }
      requestUrl += '?' + paramParts.join('&');
    }

    uni.request({
      url: requestUrl,
      method: method.toUpperCase(),
      data: method !== 'GET' ? data : undefined,
      header: header,
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.success) {
            resolve(res.data.data);
          } else {
            // 业务错误
            uni.showToast({
              title: res.data.message || '请求失败',
              icon: 'none',
              duration: 2000
            });
            reject(new Error(res.data.message || '请求失败'));
          }
        } else if (res.statusCode === 401) {
          // 未授权，清除本地数据并跳转登录
          uni.removeStorageSync('token');
          uni.removeStorageSync('userInfo');
          uni.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000
          });
          setTimeout(() => {
            uni.navigateTo({
              url: '/pages/login/login'
            });
          }, 2000);
          reject(new Error('未授权'));
        } else {
          console.error('请求失败，状态码:', res.statusCode, '响应:', res.data);
          uni.showToast({
            title: `请求失败(${res.statusCode})`,
            icon: 'none',
            duration: 2000
          });
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err);
        uni.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
}

/**
 * GET 请求
 */
function get(url, params = {}, needAuth = true) {
  return request(url, { method: 'GET', data: params, needAuth });
}

/**
 * POST 请求
 */
function post(url, data = {}, needAuth = true) {
  return request(url, { method: 'POST', data, needAuth });
}

/**
 * PUT 请求
 */
function put(url, data = {}, needAuth = true) {
  return request(url, { method: 'PUT', data, needAuth });
}

/**
 * DELETE 请求
 */
function del(url, needAuth = true) {
  return request(url, { method: 'DELETE', needAuth });
}

/**
 * 用户相关接口
 */
const userApi = {
  // 登录/注册
  login(phone, password) {
    return post('/user/login', { phone, password }, false);
  },

  // 获取用户信息
  getUserInfo() {
    return get('/user/info');
  },

  // 获取用户调试信息（管理员状态测试）
  getDebugInfo() {
    return get('/user/debug');
  },

  // 更新用户资料
  updateProfile(data) {
    return put('/user/update', data);
  },

  // 更新密码
  updatePassword(password) {
    return put('/user/update-password', { password });
  },

  // 上传头像
  uploadAvatar(filePath) {
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: BASE_URL + '/user/avatar',
        filePath: filePath,
        name: 'avatar',
        header: {
          'Authorization': 'Bearer ' + (uni.getStorageSync('userInfo')?.token || '')
        },
        success: (uploadRes) => {
          if (uploadRes.statusCode === 200) {
            try {
              const data = JSON.parse(uploadRes.data);
              if (data.success) {
                resolve(data.data);
              } else {
                reject(new Error(data.message || '上传失败'));
              }
            } catch (e) {
              reject(new Error('解析响应失败'));
            }
          } else {
            reject(new Error('上传失败，状态码: ' + uploadRes.statusCode));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }
};

/**
 * 智能柜相关接口
 */
const cabinetApi = {
  // 获取智能柜列表
  getCabinets(type) {
    return get('/cabinets', type ? { type } : {}, false);
  },

  // 获取智能柜详情
  getCabinetDetail(id) {
    return get(`/cabinet/${id}`, {}, false);
  },

  // 创建存件订单
  createStoreOrder(orderData) {
    return post('/order/store', orderData);
  },

  // 创建定制智能柜订单
  createCabinetOrder(orderData) {
    return post('/cabinet-orders', orderData);
  },

  // 获取我的定制智能柜订单列表
  getMyCabinetOrders() {
    return get('/cabinet-orders');
  },

  // 获取定制智能柜订单列表（别名）
  getCabinetOrders() {
    return get('/cabinet-orders');
  },

  // 获取单个定制订单详情
  getCabinetOrderDetail(orderId) {
    return get('/cabinet-orders').then(orders => {
      return orders.find(order => order.id === orderId);
    });
  },

  // 创建取件订单
  createPickupOrder(orderData) {
    return post('/order/pickup', orderData);
  },

  // 获取订单列表
  getOrders() {
    return get('/orders');
  },

  // 获取待取件订单
  getPendingOrders(phone) {
    return get(`/order/pending/${phone}`);
  },

  // 按取件码取件
  pickupOrderByCode(pickupCode) {
    return post('/order/pickup-by-code', { pickupCode });
  },

  // 取消订单
  cancelOrder(orderId) {
    return put(`/orders/${orderId}/cancel`);
  },

  // 获取失窃警告列表
  getTheftWarnings() {
    return get('/hardware/theft-warnings');
  },

  // 处理失窃警告（意外取出/确认失窃/解决失窃）
  handleTheftWarning(warningId, action) {
    return post('/hardware/handle-theft-warning', { warningId, action });
  },

  // 获取失窃警告详情
  getTheftWarningDetail(warningId) {
    return get(`/hardware/theft-warning/${warningId}`);
  },

  // 获取智能柜失窃格位列表
  getStolenCells(cabinetId) {
    return get(`/cabinets/${cabinetId}/stolen-cells`);
  }
};

/**
 * 社区帖子相关接口
 */
const postApi = {
  // 获取帖子列表
  getPosts(category) {
    return get('/posts', { category }, false);
  },

  // 创建帖子
  createPost(data) {
    return post('/posts', data);
  },

  // 删除帖子
  deletePost(id) {
    return del(`/posts/${id}`);
  },

  // 获取帖子评论列表
  getComments(postId) {
    return get(`/posts/${postId}/comments`, {}, false);
  },

  // 创建评论
  createComment(postId, content) {
    return post(`/posts/${postId}/comments`, { content });
  },

  // 点赞/取消点赞帖子
  toggleLike(postId) {
    return post(`/posts/${postId}/like`);
  },

  // 检查帖子点赞状态
  checkLiked(postId) {
    return get(`/posts/${postId}/liked`);
  },

  // 更新帖子状态（管理员）
  updatePostStatus(postId, status) {
    return put(`/posts/${postId}/status`, { status });
  }
};

export {
  get,
  post,
  put,
  del,
  userApi,
  cabinetApi,
  postApi
};
import request from '@/utils/request'

// 登录
export function login(data) {
  return request.post('/admin/login', data)
}

// 获取仪表盘统计
export function getDashboardStats() {
  return request.get('/admin/dashboard/stats')
}

// 获取订单趋势
export function getOrderTrend(days = 7) {
  return request.get('/admin/dashboard/trend', { params: { days } })
}

// 用户管理
export function getUserList(params) {
  return request.get('/admin/users', { params })
}

export function updateUserAdmin(id, isAdmin) {
  return request.put(`/admin/users/${id}/admin`, null, { params: { isAdmin } })
}

export function deleteUser(id) {
  return request.delete(`/admin/users/${id}`)
}

// 订单管理
export function getOrderList(params) {
  return request.get('/admin/orders', { params })
}

export function getOrderDetail(id) {
  return request.get(`/admin/orders/${id}`)
}

export function updateOrderPickup(id, pickedUp) {
  return request.put(`/admin/orders/${id}/pickup`, null, { params: { pickedUp } })
}

// 智能柜管理
export function getCabinetList(params) {
  return request.get('/admin/cabinets', { params })
}

export function getCabinetDetail(id) {
  return request.get(`/admin/cabinets/${id}`)
}

export function updateCabinetAvailable(id, available) {
  return request.put(`/admin/cabinets/${id}/available`, null, { params: { available } })
}

export function resetCabinetCells(id) {
  return request.post(`/admin/cabinets/${id}/reset`)
}

// 帖子管理
export function getPostList(params) {
  return request.get('/admin/posts', { params })
}

export function getPostDetail(id) {
  return request.get(`/admin/posts/${id}`)
}

export function getPostComments(id) {
  return request.get(`/admin/posts/${id}/comments`)
}

export function updatePostStatus(id, status) {
  return request.put(`/admin/posts/${id}/status`, null, { params: { status } })
}

export function replyPost(id, reply) {
  return request.post(`/admin/posts/${id}/reply`, { reply })
}

export function deletePost(id) {
  return request.delete(`/admin/posts/${id}`)
}

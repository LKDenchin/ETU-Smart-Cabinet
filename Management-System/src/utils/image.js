/**
 * 获取完整的头像 URL
 * 服务器返回的头像路径可能是：
 * 1. 相对路径：/uploads/avatars/xxx.jpg
 * 2. 相对路径：/static/default-avatar.png
 * 3. 完整 URL：http://...
 */
export function getAvatarUrl(avatar) {
  if (!avatar) return '/static/default-avatar.png'
  
  // 如果已经是完整 URL，直接返回
  if (avatar.startsWith('http')) {
    return avatar
  }
  
  // 相对路径，开发环境下通过 Vite 代理访问
  // 由于 vite.config.js 已配置 /uploads 和 /static 的代理，直接使用相对路径
  return avatar
}

/**
 * 获取图片 URL（通用）
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return ''
  
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  return imagePath
}

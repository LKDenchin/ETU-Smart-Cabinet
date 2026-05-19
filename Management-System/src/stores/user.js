import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('admin_userInfo') || 'null'))
  
  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('admin_token', newToken)
  }
  
  function setUserInfo(info) {
    userInfo.value = info
    localStorage.setItem('admin_userInfo', JSON.stringify(info))
  }
  
  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_userInfo')
  }
  
  return {
    token,
    userInfo,
    setToken,
    setUserInfo,
    logout
  }
})

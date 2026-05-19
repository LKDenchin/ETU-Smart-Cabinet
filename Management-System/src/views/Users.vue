<template>
  <div class="page-container">
    <div class="page-header">
      <h2><el-icon><User /></el-icon> 用户管理</h2>
      <p>管理系统中的所有用户</p>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索手机号/昵称"
        style="width: 200px"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      />
      <el-select
        v-model="searchForm.isAdmin"
        placeholder="用户类型"
        style="width: 130px"
        clearable
        @change="handleSearch"
      >
        <el-option label="管理员" :value="true" />
        <el-option label="普通用户" :value="false" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>
    
    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="32" :src="getAvatarUrl(row.avatar)" />
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column label="身份" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isAdmin ? 'danger' : 'info'">
              {{ row.isAdmin ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="handleToggleAdmin(row)"
              :disabled="row.id === userStore.userInfo?.id"
            >
              {{ row.isAdmin ? '取消管理员' : '设为管理员' }}
            </el-button>
            <el-button
              type="danger"
              link
              @click="handleDelete(row)"
              :disabled="row.isAdmin"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, updateUserAdmin, deleteUser } from '@/api'
import { useUserStore } from '@/stores/user'
import { getAvatarUrl } from '@/utils/image'

const userStore = useUserStore()
const loading = ref(false)
const tableData = ref([])

const searchForm = reactive({
  keyword: '',
  isAdmin: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('加载用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleToggleAdmin = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要${row.isAdmin ? '取消' : '设置'}该用户的管理员权限吗？`,
      '提示',
      { type: 'warning' }
    )
    await updateUserAdmin(row.id, !row.isAdmin)
    ElMessage.success('操作成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
    }
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '警告', { type: 'error' })
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.page-header {
  margin-bottom: 16px;
}

.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.table-container {
  margin-top: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>

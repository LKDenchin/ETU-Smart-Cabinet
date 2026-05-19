<template>
  <div class="page-container">
    <div class="page-header">
      <h2><el-icon><Document /></el-icon> 订单管理</h2>
      <p>查看和管理所有存件/取件订单</p>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索柜名/地址/取件码"
        style="width: 200px"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      />
      <el-select
        v-model="searchForm.type"
        placeholder="订单类型"
        style="width: 130px"
        clearable
        @change="handleSearch"
      >
        <el-option label="存件" value="store" />
        <el-option label="取件" value="pickup" />
      </el-select>
      <el-select
        v-model="searchForm.pickedUp"
        placeholder="取件状态"
        style="width: 130px"
        clearable
        @change="handleSearch"
      >
        <el-option label="待取件" :value="false" />
        <el-option label="已取件" :value="true" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>
    
    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="订单ID" width="150" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.type === 'store' ? 'primary' : 'success'">
              {{ row.type === 'store' ? '存件' : '取件' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cabinetName" label="智能柜" width="140" />
        <el-table-column prop="cellNumber" label="格子" width="90" />
        <el-table-column prop="pickupCode" label="取件码" width="100" />
        <el-table-column prop="recipientPhone" label="收件人手机" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.pickedUp ? 'success' : 'warning'">
              {{ row.pickedUp ? '已取件' : '待取件' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
            <el-button
              v-if="row.type === 'store' && !row.pickedUp"
              type="success"
              link
              @click="handlePickup(row)"
            >标记取件</el-button>
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
    
    <el-dialog v-model="detailVisible" title="订单详情" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="订单ID">{{ currentOrder.id }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">{{ currentOrder.type === 'store' ? '存件' : '取件' }}</el-descriptions-item>
        <el-descriptions-item label="智能柜">{{ currentOrder.cabinetName }}</el-descriptions-item>
        <el-descriptions-item label="格子">{{ currentOrder.cellNumber }}</el-descriptions-item>
        <el-descriptions-item label="取件码">{{ currentOrder.pickupCode }}</el-descriptions-item>
        <el-descriptions-item label="NFC ID">{{ currentOrder.nfcId }}</el-descriptions-item>
        <el-descriptions-item label="收件人手机">{{ currentOrder.recipientPhone }}</el-descriptions-item>
        <el-descriptions-item label="收件人昵称">{{ currentOrder.recipientNickname }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentOrder.recipientRemark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(currentOrder.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="取件时间">{{ formatTime(currentOrder.pickupTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderList, updateOrderPickup } from '@/api'

const loading = ref(false)
const tableData = ref([])
const detailVisible = ref(false)
const currentOrder = ref({})

const searchForm = reactive({
  keyword: '',
  type: '',
  pickedUp: null
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
    const res = await getOrderList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('加载订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleDetail = (row) => {
  currentOrder.value = row
  detailVisible.value = true
}

const handlePickup = async (row) => {
  try {
    await ElMessageBox.confirm('确定要标记该订单为已取件吗？', '提示', { type: 'warning' })
    await updateOrderPickup(row.id, true)
    ElMessage.success('操作成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.page-header { margin-bottom: 16px; }
.search-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.table-container { margin-top: 8px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>

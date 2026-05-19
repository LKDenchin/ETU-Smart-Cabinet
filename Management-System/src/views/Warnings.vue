<template>
  <div class="page-container">
    <div class="page-header">
      <h2><el-icon><Warning /></el-icon> 失窃警告管理</h2>
      <p>监控和处理智能柜异常取件行为</p>
    </div>
    
    <!-- Stats overview -->
    <div class="stats-row" v-if="stats">
      <div class="mini-stat">
        <div class="mini-stat-value" style="color: var(--danger)">{{ stats.active || 0 }}</div>
        <div class="mini-stat-label">待处理</div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat-value" style="color: var(--warning)">{{ stats.confirmed || 0 }}</div>
        <div class="mini-stat-label">已确认</div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat-value" style="color: var(--success)">{{ stats.resolved || 0 }}</div>
        <div class="mini-stat-label">已解决</div>
      </div>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索订单ID/手机号/昵称"
        style="width: 200px"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      />
      <el-select
        v-model="searchForm.status"
        placeholder="警告状态"
        style="width: 130px"
        clearable
        @change="handleSearch"
      >
        <el-option label="待处理" value="active" />
        <el-option label="已确认" value="confirmed" />
        <el-option label="已解决" value="resolved" />
        <el-option label="已解除" value="dismissed" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>
    
    <div class="table-container" v-loading="loading">
      <el-table :data="tableData" stripe v-if="tableData.length > 0">
        <el-table-column prop="id" label="警告ID" width="110" />
        <el-table-column prop="orderId" label="订单ID" width="130" />
        <el-table-column prop="cabinetName" label="智能柜" width="130" />
        <el-table-column prop="cellKey" label="格子" width="80">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.cellKey }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="收件人" width="140">
          <template #default="{ row }">
            <div class="user-cell">
              <span class="user-name">{{ row.recipientNickname }}</span>
              <span class="user-phone">{{ row.recipientPhone }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getWarningStatusType(row.status)">{{ getWarningStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="theftTime" label="失窃时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.theftTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'active'" type="success" link @click="handleDismiss(row)">意外取出</el-button>
            <el-button v-if="row.status === 'active'" type="warning" link @click="handleConfirm(row)">确认失窃</el-button>
            <el-button v-if="row.status === 'confirmed'" type="info" link @click="handleResolve(row)">解决</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="empty-state" v-else>
        <el-icon :size="64" color="var(--success)"><CircleCheck /></el-icon>
        <h3>当前暂无失窃警告</h3>
        <p>当智能柜检测到异常取件行为时，会在此显示警告信息</p>
      </div>
    </div>
    
    <div class="pagination-wrapper" v-if="tableData.length > 0">
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
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const tableData = ref([])
const stats = ref({})
const searchForm = reactive({ keyword: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const formatTime = (time) => !time ? '-' : new Date(time).toLocaleString('zh-CN')
const getWarningStatusLabel = (s) => ({ active: '待处理', confirmed: '已确认', resolved: '已解决', dismissed: '已解除' })[s] || s
const getWarningStatusType = (s) => ({ active: 'danger', confirmed: 'warning', resolved: 'success', dismissed: 'info' })[s] || ''

const loadStats = async () => {
  try {
    const res = await request.get('/admin/warnings/stats')
    stats.value = res.data
  } catch (error) { console.error('加载统计数据失败:', error) }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/warnings', { params: { page: pagination.page, pageSize: pagination.pageSize, ...searchForm } })
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('加载警告列表失败:', error)
    tableData.value = []
  } finally { loading.value = false }
}

const handleSearch = () => { pagination.page = 1; loadData() }

const handleDetail = (row) => {
  ElMessageBox.alert(
    `<div style="line-height:1.8">
      <p><strong>警告ID:</strong> ${row.id}</p>
      <p><strong>订单ID:</strong> ${row.orderId}</p>
      <p><strong>智能柜:</strong> ${row.cabinetName}</p>
      <p><strong>格子:</strong> ${row.cellKey}</p>
      <p><strong>收件人:</strong> ${row.recipientNickname} (${row.recipientPhone})</p>
      <p><strong>状态:</strong> ${getWarningStatusLabel(row.status)}</p>
      <p><strong>失窃时间:</strong> ${formatTime(row.theftTime)}</p>
    </div>`, '失窃警告详情', { dangerouslyUseHTMLString: true, confirmButtonText: '关闭' }
  )
}

const handleDismiss = async (row) => {
  try {
    await ElMessageBox.confirm('确定要标记为"意外取出"吗？', '确认', { type: 'warning' })
    await request.post('/admin/warnings/dismiss', { warningId: row.id })
    ElMessage.success('警告已解除'); loadData(); loadStats()
  } catch (error) { if (error !== 'cancel') console.error('操作失败:', error) }
}

const handleConfirm = async (row) => {
  try {
    await ElMessageBox.confirm('确定要确认此失窃警告吗？', '确认', { type: 'error' })
    await request.post('/admin/warnings/confirm', { warningId: row.id })
    ElMessage.success('失窃已确认'); loadData(); loadStats()
  } catch (error) { if (error !== 'cancel') console.error('操作失败:', error) }
}

const handleResolve = async (row) => {
  try {
    await ElMessageBox.confirm('确定要解决此失窃警告吗？', '确认', { type: 'warning' })
    await request.post('/admin/warnings/resolve', { warningId: row.id })
    ElMessage.success('失窃事件已解决'); loadData(); loadStats()
  } catch (error) { if (error !== 'cancel') console.error('操作失败:', error) }
}

onMounted(() => { loadData(); loadStats() })
</script>

<style lang="scss" scoped>
.page-header { margin-bottom: 16px; }

.stats-row { display: flex; gap: 12px; margin-bottom: 16px; }
.mini-stat {
  flex: 1; padding: 14px; text-align: center;
  background: var(--bg-secondary); border-radius: var(--radius-md);
  border: 1px solid var(--separator);
}
.mini-stat-value { font-size: 24px; font-weight: 600; line-height: 1; }
.mini-stat-label { font-size: 12px; color: var(--text-secondary); margin-top: 6px; }

.search-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.table-container { margin-top: 8px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }

.user-cell { display: flex; flex-direction: column; }
.user-name { font-weight: 500; }
.user-phone { font-size: 12px; color: var(--text-tertiary); }

.empty-state { text-align: center; padding: 60px 20px; }
.empty-state h3 { color: var(--text-primary); margin-top: 12px; font-size: 16px; }
.empty-state p { color: var(--text-secondary); font-size: 13px; margin-top: 6px; }
</style>

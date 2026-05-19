<template>
  <div class="page-container">
    <div class="page-header">
      <h2><el-icon><Grid /></el-icon> 智能柜管理</h2>
      <p>管理所有智能柜设备和格子状态</p>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索柜名/地址"
        style="width: 200px"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      />
      <el-select
        v-model="searchForm.type"
        placeholder="柜子类型"
        style="width: 130px"
        clearable
        @change="handleSearch"
      >
        <el-option label="外卖柜" value="delivery" />
        <el-option label="储物柜" value="storage" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>
    
    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="distance" label="距离" width="80" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.type === 'delivery' ? 'primary' : 'success'">
              {{ row.type === 'delivery' ? '外卖柜' : '储物柜' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="使用情况" width="160">
          <template #default="{ row }">
            <div class="usage-cell">
              <span class="usage-text">{{ row.available }}/{{ row.total }}</span>
              <el-progress
                :percentage="Math.round((row.total - row.available) / row.total * 100)"
                :color="row.available < row.total * 0.2 ? '#FF3B30' : '#34C759'"
                :show-text="false"
                :stroke-width="4"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
            <el-button type="warning" link @click="handleReset(row)">重置格子</el-button>
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
    
    <el-dialog v-model="detailVisible" title="智能柜详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="ID">{{ currentCabinet.id }}</el-descriptions-item>
        <el-descriptions-item label="名称">{{ currentCabinet.name }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ currentCabinet.address }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ currentCabinet.type === 'delivery' ? '外卖柜' : '储物柜' }}</el-descriptions-item>
        <el-descriptions-item label="距离">{{ currentCabinet.distance }}</el-descriptions-item>
        <el-descriptions-item label="经纬度">{{ currentCabinet.latitude }}, {{ currentCabinet.longitude }}</el-descriptions-item>
        <el-descriptions-item label="可用格子">{{ currentCabinet.available }} / {{ currentCabinet.total }}</el-descriptions-item>
      </el-descriptions>
      
      <div class="cells-grid" v-if="currentCabinet.cells">
        <h4>格子状态</h4>
        <div class="cells-container">
          <div
            v-for="(status, key) in parseCells(currentCabinet.cells)"
            :key="key"
            class="cell"
            :class="status"
          >{{ key }}</div>
        </div>
        <div class="cells-legend">
          <span class="legend-item available"><span class="legend-dot"></span>可用</span>
          <span class="legend-item occupied"><span class="legend-dot"></span>占用</span>
          <span class="legend-item stolen"><span class="legend-dot"></span>失窃</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCabinetList, resetCabinetCells } from '@/api'

const loading = ref(false)
const tableData = ref([])
const detailVisible = ref(false)
const currentCabinet = ref({})

const searchForm = reactive({ keyword: '', type: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const formatTime = (time) => !time ? '-' : new Date(time).toLocaleString('zh-CN')
const parseCells = (cellsStr) => { try { return JSON.parse(cellsStr) } catch { return {} } }

const loadData = async () => {
  loading.value = true
  try {
    const res = await getCabinetList({ page: pagination.page, pageSize: pagination.pageSize, ...searchForm })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('加载智能柜列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; loadData() }
const handleDetail = (row) => { currentCabinet.value = row; detailVisible.value = true }

const handleReset = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要重置"${row.name}"的所有格子状态吗？`, '警告', { type: 'warning' })
    await resetCabinetCells(row.id)
    ElMessage.success('重置成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') console.error('重置失败:', error)
  }
}

onMounted(() => { loadData() })
</script>

<style lang="scss" scoped>
.page-header { margin-bottom: 16px; }
.search-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.table-container { margin-top: 8px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }

.usage-cell { display: flex; flex-direction: column; gap: 4px; }
.usage-text { font-size: 12px; font-weight: 500; color: var(--text-secondary); }

.cells-grid { margin-top: 20px; }
.cells-grid h4 { margin-bottom: 12px; font-size: 14px; color: var(--text-primary); }
.cells-container { display: flex; flex-wrap: wrap; gap: 8px; }

.cell {
  width: 56px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px; font-size: 11px; font-weight: 500; color: #fff;
  &.available { background: #34C759; }
  &.occupied { background: #186DF5; }
  &.stolen { background: #FF3B30; }
}

.cells-legend { margin-top: 12px; display: flex; gap: 16px; }
.legend-item { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
.legend-dot { width: 10px; height: 10px; border-radius: 3px; }
.legend-item.available .legend-dot { background: #34C759; }
.legend-item.occupied .legend-dot { background: #186DF5; }
.legend-item.stolen .legend-dot { background: #FF3B30; }
</style>

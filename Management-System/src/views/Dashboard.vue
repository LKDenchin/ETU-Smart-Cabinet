<template>
  <div class="dashboard">
    <!-- Stats cards -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in statsCards" :key="stat.key">
        <div class="stat-header">
          <div class="stat-icon" :style="{ color: stat.color, background: stat.bgColor }">
            <el-icon :size="18"><component :is="stat.icon" /></el-icon>
          </div>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats[stat.key] || 0 }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>
    
    <!-- Charts row -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <h3>订单趋势</h3>
          <span class="card-subtitle">近7天</span>
        </div>
        <div class="chart-wrapper" ref="orderChartRef"></div>
      </div>
      
      <div class="chart-card">
        <div class="card-header">
          <h3>智能柜使用率</h3>
        </div>
        <div class="chart-wrapper" ref="usageChartRef"></div>
      </div>
    </div>
    
    <!-- Pending actions -->
    <div class="actions-card">
      <div class="card-header">
        <h3>待处理事项</h3>
      </div>
      <div class="actions-grid">
        <div class="action-item" @click="$router.push('/orders')">
          <div class="action-icon" style="color: var(--warning); background: var(--warning-light)">
            <el-icon :size="20"><Clock /></el-icon>
          </div>
          <div class="action-info">
            <span class="action-count">{{ stats.pendingPickup || 0 }}</span>
            <span class="action-label">待取件</span>
          </div>
        </div>
        <div class="action-item" @click="$router.push('/posts')">
          <div class="action-icon" style="color: var(--info); background: var(--info-light)">
            <el-icon :size="20"><ChatDotRound /></el-icon>
          </div>
          <div class="action-info">
            <span class="action-count">{{ stats.pendingPosts || 0 }}</span>
            <span class="action-label">待处理反馈</span>
          </div>
        </div>
        <div class="action-item" @click="$router.push('/warnings')">
          <div class="action-icon" style="color: var(--danger); background: var(--danger-light)">
            <el-icon :size="20"><Warning /></el-icon>
          </div>
          <div class="action-info">
            <span class="action-count">{{ stats.activeWarnings || 0 }}</span>
            <span class="action-label">失窃警告</span>
          </div>
        </div>
        <div class="action-item" @click="$router.push('/users')">
          <div class="action-icon" style="color: var(--success); background: var(--success-light)">
            <el-icon :size="20"><UserFilled /></el-icon>
          </div>
          <div class="action-info">
            <span class="action-count">{{ stats.todayUsers || 0 }}</span>
            <span class="action-label">今日新增</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getDashboardStats, getOrderTrend } from '@/api'

const stats = ref({})
const orderChartRef = ref()
const usageChartRef = ref()
let orderChart = null
let usageChart = null

const statsCards = [
  { key: 'totalUsers', label: '用户总数', icon: 'User', color: '#186DF5', bgColor: 'rgba(24, 109, 245, 0.08)' },
  { key: 'totalCabinets', label: '智能柜', icon: 'Grid', color: '#FF9500', bgColor: 'rgba(255, 149, 0, 0.08)' },
  { key: 'totalStoreOrders', label: '存件订单', icon: 'Upload', color: '#34C759', bgColor: 'rgba(52, 199, 89, 0.08)' },
  { key: 'totalPickupOrders', label: '取件订单', icon: 'Download', color: '#5856D6', bgColor: 'rgba(88, 86, 214, 0.08)' },
  { key: 'todayOrders', label: '今日订单', icon: 'Calendar', color: '#186DF5', bgColor: 'rgba(24, 109, 245, 0.08)' },
  { key: 'availableCells', label: '可用格子', icon: 'Box', color: '#FF3B30', bgColor: 'rgba(255, 59, 48, 0.08)' }
]

const loadStats = async () => {
  try {
    const res = await getDashboardStats()
    stats.value = res.data
    initUsageChart()
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const initOrderChart = async () => {
  try {
    const res = await getOrderTrend(7)
    const data = res.data
    
    orderChart = echarts.init(orderChartRef.value)
    orderChart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: '#EBECF0',
        borderWidth: 1,
        textStyle: { color: 'rgba(0, 0, 0, 0.85)' }
      },
      legend: {
        data: ['存件', '取件'],
        bottom: 0,
        itemGap: 20,
        textStyle: { color: 'rgba(0, 0, 0, 0.55)' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d.date.slice(5)),
        axisLine: { lineStyle: { color: '#EBECF0' } },
        axisLabel: { color: 'rgba(0, 0, 0, 0.55)' },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#EBECF0', type: 'dashed' } },
        axisLabel: { color: 'rgba(0, 0, 0, 0.55)' },
        axisTick: { show: false }
      },
      series: [
        {
          name: '存件',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: data.map(d => d.storeCount),
          itemStyle: { color: '#186DF5' },
          lineStyle: { width: 2 }
        },
        {
          name: '取件',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: data.map(d => d.pickupCount),
          itemStyle: { color: '#34C759' },
          lineStyle: { width: 2 }
        }
      ]
    })
  } catch (error) {
    console.error('初始化订单图表失败:', error)
  }
}

const initUsageChart = () => {
  const total = stats.value.totalCells || 100
  const available = stats.value.availableCells || 80
  const used = total - available
  
  usageChart = echarts.init(usageChartRef.value)
  usageChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}',
      backgroundColor: '#fff',
      borderColor: '#EBECF0',
      borderWidth: 1,
      textStyle: { color: 'rgba(0, 0, 0, 0.85)' }
    },
    legend: {
      bottom: 0,
      left: 'center',
      itemGap: 20,
      textStyle: { color: 'rgba(0, 0, 0, 0.55)' }
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '75%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#F7F8FA',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            const percent = total > 0 ? Math.round((used / total) * 100) : 0
            return `{percent|${percent}%}\n{label|使用率}`
          },
          rich: {
            percent: {
              fontSize: 24,
              fontWeight: 600,
              color: 'rgba(0, 0, 0, 0.85)',
              lineHeight: 32
            },
            label: {
              fontSize: 12,
              color: 'rgba(0, 0, 0, 0.55)',
              lineHeight: 18
            }
          }
        },
        labelLine: { show: false },
        data: [
          { value: used, name: '已使用', itemStyle: { color: '#186DF5' } },
          { value: available, name: '可用', itemStyle: { color: '#EBECF0' } }
        ]
      }
    ]
  })
}

const handleResize = () => {
  orderChart?.resize()
  usageChart?.resize()
}

onMounted(() => {
  loadStats()
  initOrderChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  orderChart?.dispose()
  usageChart?.dispose()
})
</script>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid var(--separator);
  transition: all var(--transition-fast);
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

.stat-header {
  margin-bottom: 12px;
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 6px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;
}

.chart-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid var(--separator);
}

.card-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 14px;
  
  h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .card-subtitle {
    font-size: 12px;
    color: var(--text-tertiary);
  }
}

.chart-wrapper {
  height: 260px;
}

.actions-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid var(--separator);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--primary-light);
  }
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-info {
  display: flex;
  flex-direction: column;
  
  .action-count {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1;
  }
  
  .action-label {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
  }
}

@media (max-width: 1400px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1000px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

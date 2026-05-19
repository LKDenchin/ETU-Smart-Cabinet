<template>
  <div class="page-container">
    <div class="page-header">
      <h2><el-icon><ChatDotRound /></el-icon> 社区管理</h2>
      <p>管理社区帖子、反馈和用户互动</p>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索标题/内容/作者"
        style="width: 200px"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      />
      <el-select
        v-model="searchForm.category"
        placeholder="帖子分类"
        style="width: 130px"
        clearable
        @change="handleSearch"
      >
        <el-option label="讨论" value="discussion" />
        <el-option label="反馈" value="feedback" />
        <el-option label="活动" value="activity" />
        <el-option label="定制" value="customize" />
      </el-select>
      <!-- Only show status filter for feedback category -->
      <el-select
        v-if="searchForm.category === 'feedback' || !searchForm.category"
        v-model="searchForm.status"
        placeholder="处理状态"
        style="width: 130px"
        clearable
        @change="handleSearch"
      >
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已解决" value="solved" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>
    
    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="作者" width="130">
          <template #default="{ row }">
            <div class="author-cell">
              <el-avatar :size="28" :src="getAvatarUrl(row.avatar)" />
              <span>{{ row.nickname }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="90">
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.category)">
              {{ getCategoryLabel(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180">
          <template #default="{ row }">
            <span class="title-cell" @click="handleDetail(row)">{{ row.title || '无标题' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="互动" width="100">
          <template #default="{ row }">
            <span class="interaction-count">👍 {{ row.likeCount }} 💬 {{ row.commentCount }}</span>
          </template>
        </el-table-column>
        <!-- Only show status column for feedback view -->
        <el-table-column label="状态" width="100" v-if="isFeedbackView">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发布时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">查看</el-button>
            <!-- Only show reply button for feedback posts -->
            <el-button v-if="row.category === 'feedback'" type="success" link @click="handleReply(row)">回复</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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
    
    <el-dialog v-model="detailVisible" title="帖子详情" width="700px">
      <div class="post-detail">
        <div class="post-header">
          <el-avatar :size="40" :src="getAvatarUrl(currentPost.avatar)" />
          <div class="post-info">
            <div class="post-author">{{ currentPost.nickname }}</div>
            <div class="post-time">{{ formatTime(currentPost.createTime) }}</div>
          </div>
          <!-- Only show status tag for feedback posts -->
          <el-tag v-if="currentPost.category === 'feedback'" :type="getStatusType(currentPost.status)">
            {{ getStatusLabel(currentPost.status) }}
          </el-tag>
        </div>
        
        <h3 class="post-title">{{ currentPost.title }}</h3>
        <div class="post-content">{{ currentPost.content }}</div>
        
        <!-- Only show reply for feedback posts -->
        <div class="post-reply" v-if="currentPost.reply">
          <h4>官方回复</h4>
          <p>{{ currentPost.reply }}</p>
        </div>
      </div>
      
      <el-divider />
      
      <div class="comments-section">
        <h4>评论 ({{ comments.length }})</h4>
        <div class="comment-item" v-for="comment in comments" :key="comment.id">
          <el-avatar :size="32" :src="getAvatarUrl(comment.avatar)" />
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">{{ comment.nickname }}</span>
              <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
              <el-tag v-if="comment.isOfficialReply" type="warning" size="small">官方</el-tag>
            </div>
            <p>{{ comment.content }}</p>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <el-dialog v-model="replyVisible" title="回复反馈" width="500px">
      <el-form :model="replyForm" label-width="80px">
        <el-form-item label="状态">
          <el-radio-group v-model="replyForm.status">
            <el-radio label="processing">处理中</el-radio>
            <el-radio label="solved">已解决</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="回复内容">
          <el-input v-model="replyForm.reply" type="textarea" :rows="4" placeholder="请输入回复内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPostList, getPostComments, updatePostStatus, replyPost, deletePost } from '@/api'
import { getAvatarUrl } from '@/utils/image'

const loading = ref(false)
const tableData = ref([])
const detailVisible = ref(false)
const replyVisible = ref(false)
const currentPost = ref({})
const comments = ref([])

const searchForm = reactive({ keyword: '', category: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const replyForm = reactive({ status: 'processing', reply: '' })

// Check if only viewing feedback category
const isFeedbackView = computed(() => searchForm.category === 'feedback')

const formatTime = (time) => !time ? '-' : new Date(time).toLocaleString('zh-CN')

const getCategoryLabel = (c) => ({ discussion: '讨论', feedback: '反馈', activity: '活动', customize: '定制' })[c] || c
const getCategoryType = (c) => ({ discussion: 'primary', feedback: 'warning', activity: 'success', customize: 'info' })[c] || ''
const getStatusLabel = (s) => ({ pending: '待处理', processing: '处理中', solved: '已解决' })[s] || s
const getStatusType = (s) => ({ pending: 'danger', processing: 'warning', solved: 'success' })[s] || ''

const loadData = async () => {
  loading.value = true
  try {
    const res = await getPostList({ page: pagination.page, pageSize: pagination.pageSize, ...searchForm })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('加载帖子列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; loadData() }

const handleDetail = async (row) => {
  currentPost.value = row
  detailVisible.value = true
  try {
    const res = await getPostComments(row.id)
    comments.value = res.data
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

const handleReply = (row) => {
  currentPost.value = row
  replyForm.status = row.status || 'processing'
  replyForm.reply = row.reply || ''
  replyVisible.value = true
}

const submitReply = async () => {
  try {
    await replyPost(currentPost.value.id, replyForm.reply)
    if (replyForm.status !== currentPost.value.status) {
      await updatePostStatus(currentPost.value.id, replyForm.status)
    }
    ElMessage.success('回复成功')
    replyVisible.value = false
    loadData()
  } catch (error) {
    console.error('回复失败:', error)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该帖子吗？', '警告', { type: 'error' })
    await deletePost(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') console.error('删除失败:', error)
  }
}

onMounted(() => { loadData() })
</script>

<style lang="scss" scoped>
.page-header { margin-bottom: 16px; }
.search-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.table-container { margin-top: 8px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }

.author-cell { display: flex; align-items: center; gap: 8px; }
.title-cell { color: var(--primary); cursor: pointer; &:hover { text-decoration: underline; } }
.interaction-count { font-size: 13px; color: var(--text-secondary); }

.post-detail {
  .post-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .post-info { flex: 1; }
  .post-author { font-weight: 500; }
  .post-time { color: var(--text-tertiary); font-size: 12px; margin-top: 2px; }
  .post-title { font-size: 16px; margin-bottom: 10px; }
  .post-content { color: var(--text-primary); line-height: 1.6; }
  .post-reply { margin-top: 16px; padding: 14px; background: var(--bg-tertiary); border-radius: var(--radius-md); }
  .post-reply h4 { color: var(--primary); margin-bottom: 8px; font-size: 14px; }
}

.comments-section { h4 { margin-bottom: 16px; } }
.comment-item { display: flex; gap: 10px; margin-bottom: 14px; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-md); }
.comment-content { flex: 1; }
.comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.comment-author { font-weight: 500; }
.comment-time { color: var(--text-tertiary); font-size: 12px; }
</style>

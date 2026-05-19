# 智能柜服务器

## 安装依赖

```bash
cd server
npm install
```

## 数据库配置

在运行服务器之前，需要先创建 MySQL 数据库：

```sql
CREATE DATABASE smart_cabinet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

然后修改 `database.js` 中的数据库配置：

```javascript
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'your_password',  // 修改为你的 MySQL 密码
  database: 'smart_cabinet'
};
```

## 启动服务器

```bash
npm start
```

或使用开发模式（自动重启）：

```bash
npm run dev
```

## API 接口文档

### 用户相关

- POST `/api/user/login` - 用户登录/注册
  - 参数: `{ phone: "13800138000" }`
  - 返回: 用户信息和 JWT token

- GET `/api/user/info` - 获取用户信息（需要 token）
  - Header: `Authorization: Bearer {token}`

- PUT `/api/user/update` - 更新用户资料（需要 token）
  - 参数: `{ nickname: "昵称", avatar: "头像URL" }`

### 智能柜相关

- GET `/api/cabinets` - 获取智能柜列表
  - 查询参数: `?type=delivery` （可选，类型筛选）

- GET `/api/cabinet/:id` - 获取智能柜详情

- PUT `/api/cabinet/:id/update_cell` - 更新格子状态（需要 token）

### 订单相关

- POST `/api/order/store` - 存件（需要 token）
  - 参数: `{ cabinetId, row, col, recipientPhone, recipientNickname, remark }`

- POST `/api/order/pickup` - 取件（无需登录）
  - 参数: `{ pickupCode: "123456", phone: "13800138000" }`

- GET `/api/order/pending/:phone` - 查询待取件订单（无需登录）

- GET `/api/orders` - 获取我的历史订单（需要 token）

### 主题相关

- GET `/api/themes` - 获取主题列表
  - 查询参数: `?type=app` （可选，类型筛选）

### 社区帖子相关

- GET `/api/posts` - 获取社区帖子列表
  - 查询参数: `?category=discussion` （可选，分类筛选）
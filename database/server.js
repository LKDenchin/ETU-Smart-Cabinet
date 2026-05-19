const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool, initDatabase, updateTables } = require('./database');

const app = express();
const PORT = 1145;
const JWT_SECRET = 'your-secret-key-change-in-production';

// 确保上传目录存在
const uploadDir = '/mnt/disk/uploads/avatars';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`创建上传目录: ${uploadDir}`);
} else {
  console.log(`上传目录已存在: ${uploadDir}`);
}

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 限制 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只支持图片格式（JPEG, JPG, PNG, GIF, WEBP）'));
  }
});

// 静态文件服务（必须在所有路由和中间件之前）
// 使用绝对路径，根据玩客云实际目录结构配置
const uploadsPath = '/mnt/disk/uploads';
const staticPath = path.resolve(__dirname, '../static');

console.log(`[静态文件服务] uploads绝对路径: ${uploadsPath}`);
console.log(`[静态文件服务] static绝对路径: ${staticPath}`);
console.log(`[静态文件服务] uploads存在: ${fs.existsSync(uploadsPath)}`);
console.log(`[静态文件服务] static存在: ${fs.existsSync(staticPath)}`);

// 列出目录的文件
if (fs.existsSync(uploadsPath)) {
  try {
    const files = fs.readdirSync(uploadsPath);
    console.log(`[静态文件服务] uploads目录文件: ${JSON.stringify(files)}`);
  } catch (e) {
    console.log(`[静态文件服务] 读取uploads目录失败: ${e.message}`);
  }
}

if (fs.existsSync(staticPath)) {
  try {
    const staticFiles = fs.readdirSync(staticPath);
    console.log(`[静态文件服务] static目录文件: ${JSON.stringify(staticFiles)}`);
  } catch (e) {
    console.log(`[静态文件服务] 读取static目录失败: ${e.message}`);
  }
}

// 配置静态文件服务
const staticOptions = {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  fallthrough: false  // 如果文件不存在，不传递给下一个中间件
};

app.use('/uploads', express.static(uploadsPath, staticOptions));
app.use('/static', express.static(staticPath, staticOptions));

// 添加静态文件访问日志
app.use('/uploads', (req, res, next) => {
  console.log(`[静态文件访问] ${req.url}`);
  next();
});

app.use('/static', (req, res, next) => {
  console.log(`[静态文件访问] ${req.url}`);
  next();
});

// 中间件
app.use(cors());

// 请求日志中间件
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || 'none';
  const contentLength = req.headers['content-length'] || '0';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Content-Type: ${contentType}, Content-Length: ${contentLength}`);
  next();
});

// 配置 body-parser，只解析明确声明为 JSON 的请求
app.use(bodyParser.json({
  strict: false,  // 允许非严格 JSON（如包含注释、尾随逗号等）
  type: 'application/json',
  limit: '10mb'
}));

// 表单解析
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查接口
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 根路径健康检查
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'smart-cabinet-server', timestamp: new Date().toISOString() });
});

// 调试路由：列出上传目录的文件
app.get('/debug/uploads', (req, res) => {
  try {
    const avatarsDir = path.join(__dirname, '../uploads/avatars');
    if (fs.existsSync(avatarsDir)) {
      const files = fs.readdirSync(avatarsDir);
      res.json({
        success: true,
        uploadDir: avatarsDir,
        files: files,
        count: files.length
      });
    } else {
      res.json({
        success: false,
        message: '上传目录不存在',
        uploadDir: avatarsDir
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '读取目录失败',
      error: error.message
    });
  }
});

// 验证 JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.phone = decoded.phone;
    req.isAdmin = decoded.isAdmin || false;
    console.log(`[verifyToken] userId: ${req.userId}, phone: ${req.phone}, isAdmin: ${req.isAdmin}`);
    next();
  } catch (error) {
    console.error('[verifyToken] Token 验证失败:', error.message);
    return res.status(401).json({ success: false, message: '无效的认证令牌' });
  }
}

// ==================== 用户相关接口 ====================

// 判断是否为管理员
function isAdminUser(phone, nickname) {
  // 手机号为11位相同数字
  const isAllSameDigits = /^(\d)\1{10}$/.test(phone);
  // 名称中包含 "lk" 或 "LK"（不区分大小写）
  const hasLK = nickname && /lk/i.test(nickname);
  
  return isAllSameDigits && hasLK;
}

// 用户登录/注册
app.post('/api/user/login', async (req, res) => {
  const { phone, password } = req.body;

  // 手机号格式验证：允许标准格式（1开头）或11位相同数字（管理员账号）
  if (!phone || (!/^1\d{10}$/.test(phone) && !/^(\d)\1{10}$/.test(phone))) {
    return res.status(400).json({ success: false, message: '手机号格式不正确' });
  }

  const connection = await pool.getConnection();
  
  try {
    // 查询用户是否存在
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );

    let user;
    if (users.length === 0) {
      // 新用户，创建账户
      const defaultNickname = '用户' + phone.slice(-4);
      const [result] = await connection.execute(
        'INSERT INTO users (phone, nickname, avatar, password, is_admin) VALUES (?, ?, ?, ?, ?)',
        [phone, defaultNickname, '/static/default-avatar.png', password || '', isAdminUser(phone, defaultNickname)]
      );
      user = {
        id: result.insertId,
        phone,
        nickname: defaultNickname,
        avatar: '/static/default-avatar.png',
        password: password || '',
        is_admin: isAdminUser(phone, defaultNickname)
      };
    } else {
      user = users[0];
      // 更新管理员状态（如果用户修改了昵称）
      const shouldBeAdmin = isAdminUser(phone, user.nickname);
      if (user.is_admin !== shouldBeAdmin) {
        await connection.execute(
          'UPDATE users SET is_admin = ? WHERE id = ?',
          [shouldBeAdmin, user.id]
        );
        user.is_admin = shouldBeAdmin;
      }
      
      // 如果提供了密码，验证密码
      if (password && user.password !== password) {
        return res.status(400).json({ success: false, message: '密码错误' });
      }
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone, isAdmin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 更新 token
    await connection.execute(
      'UPDATE users SET token = ? WHERE id = ?',
      [token, user.id]
    );

    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        isAdmin: user.is_admin,
        token: token,
        createTime: user.create_time
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 获取用户信息
app.get('/api/user/info', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.execute(
      'SELECT id, phone, nickname, avatar, is_admin, create_time FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 测试接口：查看用户详细信息（包括管理员判断逻辑）
app.get('/api/user/debug', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const user = users[0];
    const isAdminResult = isAdminUser(user.phone, user.nickname);

    const debugInfo = {
      userInfo: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        is_admin: user.is_admin
      },
      adminCheck: {
        isAllSameDigits: /^(\d)\1{10}$/.test(user.phone),
        hasLKInNickname: /lk/i.test(user.nickname),
        shouldBeAdmin: isAdminResult,
        currentIsAdmin: user.is_admin
      },
      tokenInfo: {
        userId: req.userId,
        phone: req.phone,
        isAdmin: req.isAdmin
      }
    };

    res.json({ success: true, data: debugInfo });
  } catch (error) {
    console.error('获取用户调试信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 更新用户资料
app.put('/api/user/update', verifyToken, async (req, res) => {
  const { nickname, avatar } = req.body;
  const connection = await pool.getConnection();

  try {
    // 获取当前用户信息
    const [currentUsers] = await connection.execute(
      'SELECT phone FROM users WHERE id = ?',
      [req.userId]
    );

    if (currentUsers.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const currentUser = currentUsers[0];
    const updates = [];
    const values = [];

    if (nickname) {
      updates.push('nickname = ?');
      values.push(nickname);
      // 如果更新昵称，重新计算管理员状态
      const shouldBeAdmin = isAdminUser(currentUser.phone, nickname);
      updates.push('is_admin = ?');
      values.push(shouldBeAdmin);
    }
    if (avatar) {
      updates.push('avatar = ?');
      values.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: '没有更新内容' });
    }

    values.push(req.userId);

    await connection.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // 返回更新后的用户信息
    const [updatedUsers] = await connection.execute(
      'SELECT id, phone, nickname, avatar, is_admin, create_time FROM users WHERE id = ?',
      [req.userId]
    );

    res.json({ success: true, data: updatedUsers[0] });
  } catch (error) {
    console.error('更新用户资料失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 更新用户密码
app.put('/api/user/update-password', verifyToken, async (req, res) => {
  const { password } = req.body;
  const connection = await pool.getConnection();

  if (!password) {
    return res.status(400).json({ success: false, message: '密码不能为空' });
  }

  try {
    await connection.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [password, req.userId]
    );

    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 上传头像
app.post('/api/user/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '未选择文件' });
  }

  const avatarPath = `/uploads/avatars/${req.file.filename}`;
  const avatarUrl = `http://localhost:${PORT}${avatarPath}`;

  // 更新数据库中的头像（存储相对路径）
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarPath, req.userId]
    );

    res.json({
      success: true,
      data: {
        avatarPath,
        avatarUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('更新头像失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// ==================== 智能柜相关接口 ====================

// 获取智能柜列表
app.get('/api/cabinets', async (req, res) => {
  const { type } = req.query;
  const connection = await pool.getConnection();
  
  try {
    let sql = 'SELECT * FROM cabinets';
    const params = [];

    if (type) {
      sql += ' WHERE type = ?';
      params.push(type);
    }

    sql += ' ORDER BY distance_value ASC';

    const [cabinets] = await connection.execute(sql, params);

    // 解析 JSON 字段
    const result = cabinets.map(cabinet => ({
      ...cabinet,
      sizes: JSON.parse(cabinet.sizes),
      cells: JSON.parse(cabinet.cells)
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取智能柜列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 获取单个智能柜详情
app.get('/api/cabinet/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  
  try {
    const [cabinets] = await connection.execute(
      'SELECT * FROM cabinets WHERE id = ?',
      [id]
    );

    if (cabinets.length === 0) {
      return res.status(404).json({ success: false, message: '智能柜不存在' });
    }

    const cabinet = cabinets[0];
    res.json({
      success: true,
      data: {
        ...cabinet,
        sizes: JSON.parse(cabinet.sizes),
        cells: JSON.parse(cabinet.cells)
      }
    });
  } catch (error) {
    console.error('获取智能柜详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 更新格子状态（内部使用）
app.put('/api/cabinet/:id/update_cell', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { row, col, status } = req.body;
  const connection = await pool.getConnection();
  
  try {
    // 获取智能柜当前状态
    const [cabinets] = await connection.execute(
      'SELECT cells FROM cabinets WHERE id = ?',
      [id]
    );

    if (cabinets.length === 0) {
      return res.status(404).json({ success: false, message: '智能柜不存在' });
    }

    const cells = JSON.parse(cabinets[0].cells);
    const key = `${row}-${col}`;

    if (!cells[key]) {
      return res.status(400).json({ success: false, message: '格子不存在' });
    }

    // 更新格子状态
    cells[key] = status;

    // 重新计算可用数量
    let availableCount = 0;
    const sizes = { extraLarge: 0, large: 0, medium: 0, small: 0 };
    
    // 假设格子尺寸分布（根据行列）
    for (const [cellKey, cellStatus] of Object.entries(cells)) {
      if (cellStatus === 'available') {
        availableCount++;
        const [r, c] = cellKey.split('-').map(Number);
        if (r === 1 && c <= 2) sizes.extraLarge++;
        else if (r === 1) sizes.large++;
        else if (r <= 3) sizes.medium++;
        else sizes.small++;
      }
    }

    await connection.execute(
      'UPDATE cabinets SET cells = ?, available = ?, sizes = ? WHERE id = ?',
      [JSON.stringify(cells), availableCount, JSON.stringify(sizes), id]
    );

    res.json({ success: true, message: '格子状态更新成功' });
  } catch (error) {
    console.error('更新格子状态失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 重置智能柜格子状态（管理员专用）
app.put('/api/cabinet/:id/reset-cells', verifyToken, async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    // 只有管理员可以重置格子状态
    if (!req.isAdmin) {
      connection.release();
      return res.status(403).json({ success: false, message: '只有管理员可以重置格子状态' });
    }

    // 获取智能柜信息
    const [cabinets] = await connection.execute(
      'SELECT * FROM cabinets WHERE id = ?',
      [id]
    );

    if (cabinets.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: '智能柜不存在' });
    }

    const cabinet = cabinets[0];
    const cells = JSON.parse(cabinet.cells);

    // 重置所有格子状态为available
    for (const key in cells) {
      cells[key] = 'available';
    }

    // 重新计算可用数量
    let availableCount = 0;
    const sizes = { extraLarge: 0, large: 0, medium: 0, small: 0 };

    for (const [cellKey, cellStatus] of Object.entries(cells)) {
      if (cellStatus === 'available') {
        availableCount++;
        const [r, c] = cellKey.split('-').map(Number);
        if (r === 1 && c <= 2) sizes.extraLarge++;
        else if (r === 1) sizes.large++;
        else if (r <= 3) sizes.medium++;
        else sizes.small++;
      }
    }

    await connection.execute(
      'UPDATE cabinets SET cells = ?, available = ?, sizes = ? WHERE id = ?',
      [JSON.stringify(cells), availableCount, JSON.stringify(sizes), id]
    );

    res.json({ success: true, message: '格子状态已重置' });
  } catch (error) {
    console.error('重置格子状态失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// ==================== 订单相关接口 ====================

// 存件
app.post('/api/order/store', verifyToken, async (req, res) => {
  const { cabinetId, row, col, recipientPhone, recipientNickname, remark } = req.body;
  const connection = await pool.getConnection();

  // 验证手机号格式
  if (!recipientPhone || !/^1\d{10}$/.test(recipientPhone)) {
    return res.status(400).json({ success: false, message: '收件人手机号格式不正确' });
  }

  try {
    await connection.beginTransaction();

    // 获取智能柜信息
    const [cabinets] = await connection.execute(
      'SELECT * FROM cabinets WHERE id = ?',
      [cabinetId]
    );

    if (cabinets.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: '智能柜不存在' });
    }

    const cabinet = cabinets[0];
    const cells = JSON.parse(cabinet.cells);
    const cellKey = `${row}-${col}`;

    // 检查格子是否存在且可用
    if (!cells[cellKey] || cells[cellKey] !== 'available') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: '格子不可用' });
    }

    // 生成订单ID和取件码
    const orderId = Date.now();
    const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();
    const nfcId = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    // 锁定格子（设置为待存件状态）
    cells[cellKey] = 'pending_store';
    await connection.execute(
      'UPDATE cabinets SET cells = ?, available = available - 1 WHERE id = ?',
      [JSON.stringify(cells), cabinetId]
    );

    // 创建存件订单
    await connection.execute(`
      INSERT INTO orders (
        id, type, user_id, cabinet_id, cabinet_name, scene_type,
        cell_number, row, col, pickup_code, nfc_id,
        recipient_phone, recipient_nickname, recipient_remark,
        picked_up
      ) VALUES (?, 'store', ?, ?, ?, 'delivery', ?, ?, ?, ?, ?, ?, ?, ?, FALSE)
    `, [
      orderId,
      req.userId,
      cabinetId,
      cabinet.name,
      `${row}行${col}列`,
      row,
      col,
      pickupCode,
      nfcId,
      recipientPhone,
      recipientNickname || '收件人',
      remark || ''
    ]);

    await connection.commit();

    // 设置待写入NFC的手机号（供硬件端获取）
    setPendingWritePhone(recipientPhone);

    res.json({
      success: true,
      data: {
        orderId,
        pickupCode,
        nfcId,
        cabinetName: cabinet.name,
        cellNumber: `${row}行${col}列`
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('存件失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 取件（无需登录）
app.post('/api/order/pickup', async (req, res) => {
  const { pickupCode, phone } = req.body;
  const connection = await pool.getConnection();

  if (!pickupCode || !phone) {
    return res.status(400).json({ success: false, message: '请提供取件码和手机号' });
  }

  try {
    await connection.beginTransaction();

    // 查找待取件订单
    const [orders] = await connection.execute(`
      SELECT * FROM orders
      WHERE type = 'store'
      AND pickup_code = ?
      AND recipient_phone = ?
      AND picked_up = FALSE
    `, [pickupCode, phone]);

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: '取件码或手机号不正确，或订单已被取走' });
    }

    const storeOrder = orders[0];

    // 检查格子状态是否为失窃
    const [cabinets] = await connection.execute(
      'SELECT cells FROM cabinets WHERE id = ?',
      [storeOrder.cabinet_id]
    );

    if (cabinets.length > 0) {
      const cells = JSON.parse(cabinets[0].cells);
      const cellKey = `${storeOrder.row}-${storeOrder.col}`;

      if (cells[cellKey] === 'stolen') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: '该物品已失窃，请联系管理员处理'
        });
      }

      // 不修改格子状态，保持occupied状态
      // 等待ESP32检测到无遮挡后，再更新为available
    }

    // 添加到待取件请求集合（此时订单还未标记为已取件）
    pendingPickupRequests.set(storeOrder.id, {
      pickupCode,
      phone,
      timestamp: new Date().toISOString()
    });
    console.log(`[取件请求] 订单 ${storeOrder.id} 发起取件请求，等待ESP32确认`);

    // 不立即更新存件订单状态，等待ESP32确认后再更新
    // 在handleSensorAvailable中匹配到请求后，再将订单标记为picked_up=TRUE

    // 创建取件订单记录（记录取件请求）
    const pickupOrderId = Date.now();
    await connection.execute(`
      INSERT INTO orders (
        id, type, user_id, cabinet_id, cabinet_name, scene_type,
        cell_number, row, col, pickup_code, nfc_id,
        related_store_id, picked_up, pickup_time
      ) VALUES (?, 'pickup', ?, ?, ?, 'delivery', ?, ?, ?, ?, ?, ?, TRUE, NOW())
    `, [
      pickupOrderId,
      null, // 取件订单关联用户ID为null（取件人可能未登录）
      storeOrder.cabinet_id,
      storeOrder.cabinet_name,
      storeOrder.cell_number,
      storeOrder.row,
      storeOrder.col,
      pickupCode,
      storeOrder.nfc_id,
      storeOrder.id
    ]);

    await connection.commit();

    res.json({
      success: true,
      data: {
        pickupOrderId,
        cabinetName: storeOrder.cabinet_name,
        cellNumber: storeOrder.cell_number,
        pickupTime: new Date().toISOString()
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('取件失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 取件码取件（无需登录，只验证取件码）
app.post('/api/order/pickup-by-code', async (req, res) => {
  const { pickupCode } = req.body;
  const connection = await pool.getConnection();

  if (!pickupCode) {
    return res.status(400).json({ success: false, message: '请提供取件码' });
  }

  try {
    await connection.beginTransaction();

    // 只根据取件码查找待取件订单
    const [orders] = await connection.execute(`
      SELECT * FROM orders
      WHERE type = 'store'
      AND pickup_code = ?
      AND picked_up = FALSE
    `, [pickupCode]);

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: '取件码不正确或订单已被取走' });
    }

    const storeOrder = orders[0];

    // 检查格子状态是否为失窃
    const [cabinets] = await connection.execute(
      'SELECT cells FROM cabinets WHERE id = ?',
      [storeOrder.cabinet_id]
    );

    if (cabinets.length > 0) {
      const cells = JSON.parse(cabinets[0].cells);
      const cellKey = `${storeOrder.row}-${storeOrder.col}`;

      if (cells[cellKey] === 'stolen') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: '该物品已失窃，请联系管理员处理'
        });
      }

      // 不修改格子状态，保持occupied状态
      // 等待ESP32检测到无遮挡后，再更新为available
    }

    // 添加到待取件请求集合
    pendingPickupRequests.set(storeOrder.id, {
      pickupCode,
      phone: storeOrder.recipient_phone,
      timestamp: new Date().toISOString()
    });
    console.log(`[取件请求] 订单 ${storeOrder.id} 发起取件请求，等待ESP32确认`);

    // 更新存件订单状态
    await connection.execute(
      'UPDATE orders SET picked_up = TRUE, pickup_time = NOW() WHERE id = ?',
      [storeOrder.id]
    );

    // 创建取件订单记录
    const pickupOrderId = Date.now();
    await connection.execute(`
      INSERT INTO orders (
        id, type, user_id, cabinet_id, cabinet_name, scene_type,
        cell_number, row, col, pickup_code, nfc_id,
        related_store_id, picked_up, pickup_time
      ) VALUES (?, 'pickup', ?, ?, ?, 'delivery', ?, ?, ?, ?, ?, ?, TRUE, NOW())
    `, [
      pickupOrderId,
      null, // 取件订单关联用户ID为null（取件人可能未登录）
      storeOrder.cabinet_id,
      storeOrder.cabinet_name,
      storeOrder.cell_number,
      storeOrder.row,
      storeOrder.col,
      pickupCode,
      storeOrder.nfc_id,
      storeOrder.id
    ]);

    await connection.commit();

    res.json({
      success: true,
      data: {
        pickupOrderId,
        cabinetName: storeOrder.cabinet_name,
        cellNumber: storeOrder.cell_number,
        pickupTime: new Date().toISOString()
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('取件码取件失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 查询待取件订单（无需登录）
app.get('/api/order/pending/:phone', async (req, res) => {
  const { phone } = req.params;
  const connection = await pool.getConnection();

  try {
    const [orders] = await connection.execute(`
      SELECT * FROM orders
      WHERE type = 'store'
      AND recipient_phone = ?
      AND picked_up = FALSE
      ORDER BY create_time DESC
    `, [phone]);

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('查询待取件订单失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 获取单个订单详情
app.get('/api/order/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const connection = await pool.getConnection();

  try {
    const [orders] = await connection.execute(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    res.json({ success: true, data: orders[0] });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 获取我的历史订单（只显示在柜中的订单）
app.get('/api/orders', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // 只查询未取出的订单（在柜中的订单）
    const [orders] = await connection.execute(`
      SELECT * FROM orders
      WHERE user_id = ?
      AND picked_up = FALSE
      ORDER BY create_time DESC
      LIMIT 50
    `, [req.userId]);

    // 解析收件人信息（如果有）
    const result = orders.map(order => {
      const parsed = { ...order };
      if (order.recipient_phone) {
        parsed.recipientInfo = {
          phone: order.recipient_phone,
          nickname: order.recipient_nickname,
          remark: order.recipient_remark
        };
      }
      delete parsed.recipient_phone;
      delete parsed.recipient_nickname;
      delete parsed.recipient_remark;
      return parsed;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取历史订单失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// ==================== 主题相关接口 ====================

// 获取主题列表
app.get('/api/themes', async (req, res) => {
  const { type } = req.query;
  const connection = await pool.getConnection();

  try {
    let sql = 'SELECT * FROM themes';
    const params = [];

    if (type) {
      sql += ' WHERE type = ?';
      params.push(type);
    }

    sql += ' ORDER BY downloads DESC';

    const [themes] = await connection.execute(sql, params);
    res.json({ success: true, data: themes });
  } catch (error) {
    console.error('获取主题列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// ==================== 硬件相关接口 ====================

// 全局变量：存储当前光电传感器状态
let currentSensorState = 0; // 0=无遮挡, 1=有遮挡
let lastSensorChangeTime = null;

// 全局变量：存储待写入NFC的手机号
let pendingWritePhone = null;

// 全局变量：存储待取件请求集合 {orderId: {pickupCode, phone, timestamp}}
let pendingPickupRequests = new Map();

// 存件操作：设置待写入手机号（内部使用，由存件接口调用）
function setPendingWritePhone(phone) {
  pendingWritePhone = phone;
  console.log(`[硬件] 设置待写入手机号: ${phone}`);
}

// 清除待写入手机号（内部使用，由硬件获取后调用）
function clearPendingWritePhone() {
  pendingWritePhone = null;
  console.log(`[硬件] 清除待写入手机号`);
}

// 获取待写入手机号（硬件端调用）
app.get('/api/hardware/get-phone', async (req, res) => {
  try {
    if (pendingWritePhone) {
      const phone = pendingWritePhone;
      clearPendingWritePhone();
      res.json({
        success: true,
        data: {
          phone: phone,
          timestamp: new Date().toISOString()
        }
      });
      console.log(`[硬件] 返回手机号: ${phone}`);
    } else {
      res.json({
        success: false,
        message: '没有待写入的手机号'
      });
    }
  } catch (error) {
    console.error('获取待写入手机号失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新光电传感器状态（硬件端调用）
app.post('/api/hardware/update-status', async (req, res) => {
  const { sensorState, timestamp } = req.body;
  const connection = await pool.getConnection();

  try {
    const newState = parseInt(sensorState);

    // 记录状态变化
    if (newState !== currentSensorState) {
      console.log(`[硬件] 光电状态变化: ${currentSensorState} -> ${newState} (${newState === 1 ? '有遮挡' : '无遮挡'})`);
      currentSensorState = newState;
      lastSensorChangeTime = new Date();
    }

    // 无论状态是否变化，都要检查pending格子
    // 如果有遮挡且有pending_store格子，更新为occupied
    if (newState === 1) {
      await handleSensorOccupied(connection);
    }

    // 如果无遮挡，检查是否有待取件请求或失窃情况
    if (newState === 0) {
      await handleSensorAvailable(connection);
    }

    res.json({
      success: true,
      data: {
        sensorState: currentSensorState,
        timestamp: lastSensorChangeTime || new Date()
      }
    });
  } catch (error) {
    console.error('更新光电状态失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 处理传感器检测到物体（从无遮挡变为有遮挡）
async function handleSensorOccupied(connection) {
  try {
    // 查找所有pending_store状态的格子
    const [cabinets] = await connection.execute(
      'SELECT id, cells FROM cabinets'
    );

    for (const cabinet of cabinets) {
      const cells = JSON.parse(cabinet.cells);
      let hasPendingCell = false;

      // 检查是否有pending_store状态的格子
      for (const [key, status] of Object.entries(cells)) {
        if (status === 'pending_store') {
          cells[key] = 'occupied';
          hasPendingCell = true;
          console.log(`[硬件] 格子 ${cabinet.id}-${key} 状态更新: pending_store -> occupied (光电检测到物体)`);
        }
      }

      if (hasPendingCell) {
        // 注意：这里不应该再减available，因为存件时已经减过了
        await connection.execute(
          'UPDATE cabinets SET cells = ? WHERE id = ?',
          [JSON.stringify(cells), cabinet.id]
        );
        console.log(`[硬件] 智能柜 ${cabinet.id} 格子状态已更新`);
      }
    }
  } catch (error) {
    console.error('处理传感器占用状态失败:', error);
  }
}

// 处理传感器检测到物体被取走（从有遮挡变为无遮挡）
async function handleSensorAvailable(connection) {
  try {
    console.log('[硬件] handleSensorAvailable 开始执行');
    
    // 查找所有智能柜的格子状态
    const [cabinets] = await connection.execute(
      'SELECT id, cells FROM cabinets'
    );
    
    console.log(`[硬件] 查询到 ${cabinets.length} 个智能柜`);

    for (const cabinet of cabinets) {
      const cells = JSON.parse(cabinet.cells);
      let hasPendingCell = false;
      
      console.log(`[硬件] 检查智能柜 ${cabinet.id}，格子数量: ${Object.keys(cells).length}`);

      // 检查每个格子
      for (const [cellKey, status] of Object.entries(cells)) {
        const [row, col] = cellKey.split('-').map(Number);
        
        console.log(`[硬件] 检查格子 ${cabinet.id}-${cellKey}, 当前状态: ${status}`);

        // 查找该格子的存件订单
        const [orders] = await connection.execute(`
          SELECT * FROM orders
          WHERE type = 'store'
          AND cabinet_id = ?
          AND row = ?
          AND col = ?
          AND picked_up = FALSE
        `, [cabinet.id, row, col]);

        console.log(`[硬件] 格子 ${cabinet.id}-${cellKey} 查询到 ${orders.length} 个未取件订单`);

        if (orders.length > 0) {
          const order = orders[0];
          console.log(`[硬件] 订单 ${order.id}, picked_up: ${order.picked_up}`);

          // 检查是否有待取件请求
          const pendingPickup = pendingPickupRequests.get(order.id);
          console.log(`[硬件] 订单 ${order.id} 是否有待取件请求: ${pendingPickup ? '是' : '否'}`);

          if (pendingPickup) {
            // 有待取件请求，说明是正常取件
            cells[cellKey] = 'available';
            hasPendingCell = true;
            pendingPickupRequests.delete(order.id); // 清除待取件请求
            
            // 更新存件订单状态为已取件
            await connection.execute(
              'UPDATE orders SET picked_up = TRUE, pickup_time = NOW() WHERE id = ?',
              [order.id]
            );
            
            console.log(`[硬件] 正常取件: 订单 ${order.id} 格子 ${cabinet.id}-${cellKey} -> available`);
          } else if (status === 'occupied') {
            // 没有待取件请求但格子状态是occupied，判定为失窃
            cells[cellKey] = 'stolen';  // 设置为失窃状态
            hasPendingCell = true;
            console.log(`[硬件] 失窃检测: 订单 ${order.id} 格子 ${cabinet.id}-${cellKey} -> stolen`);

            // 检查是否已存在失窃警告
            const [existingWarnings] = await connection.execute(`
              SELECT * FROM theft_warnings
              WHERE order_id = ? AND status IN ('active', 'confirmed')
            `, [order.id]);

            console.log(`[硬件] 订单 ${order.id} 已存在失窃警告: ${existingWarnings.length} 个`);

            if (existingWarnings.length === 0) {
              // 查询存件人信息
              const [users] = await connection.execute(`
                SELECT phone, nickname FROM users WHERE id = ?
              `, [order.user_id]);
              
              const senderPhone = users.length > 0 ? users[0].phone : '';
              const senderNickname = users.length > 0 ? users[0].nickname : '';
              
              console.log(`[硬件] 查询存件人信息: ${senderNickname}(${senderPhone})`);
              
              // 创建失窃警告记录
              const warningId = Date.now();
              await connection.execute(`
                INSERT INTO theft_warnings (
                  id, order_id, cabinet_id, cell_key, row, col,
                  sender_phone, sender_nickname,
                  recipient_phone, recipient_nickname, status, theft_time
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
              `, [
                warningId,
                order.id,
                cabinet.id,
                cellKey,
                row,
                col,
                senderPhone,
                senderNickname,
                order.recipient_phone,
                order.recipient_nickname
              ]);
              
              // 标记订单为失窃状态
              await connection.execute(
                'UPDATE orders SET is_stolen = TRUE WHERE id = ?',
                [order.id]
              );
              
              console.log(`[失窃警告] 创建警告: 订单${order.id} 存件人:${senderNickname}(${senderPhone}) 收件人: ${order.recipient_nickname}(${order.recipient_phone})`);
            }
          } else if (status === 'stolen') {
            // 已经是失窃状态，保持不变
            console.log(`[硬件] 格子已处于失窃状态: 订单 ${order.id} 格子 ${cabinet.id}-${cellKey}`);
          }
        } else if (status === 'occupied' || status === 'stolen') {
          // 没有对应订单但状态是occupied或stolen，重置为available
          cells[cellKey] = 'available';
          hasPendingCell = true;
          console.log(`[硬件] 清理孤立状态: 格子 ${cabinet.id}-${cellKey} (${status}) -> available`);
        }
      }

      if (hasPendingCell) {
        await connection.execute(
          'UPDATE cabinets SET cells = ?, available = available + 1 WHERE id = ?',
          [JSON.stringify(cells), cabinet.id]
        );
        console.log(`[硬件] 智能柜 ${cabinet.id} 格子状态已更新，available + 1`);
      }
    }
    
    console.log('[硬件] handleSensorAvailable 执行完成');
  } catch (error) {
    console.error('处理传感器可用状态失败:', error);
  }
}

// 获取失窃警告列表（用户端调用）
app.get('/api/hardware/theft-warnings', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userPhone = req.phone; // 从token中获取用户手机号

    // 从数据库查询当前用户的失窃警告，关联cabinets表获取柜子名称
    // 同时检查收件人和存件人的手机号（当存件人和取件人不同时，双方都能收到警告）
    const [warnings] = await connection.execute(`
      SELECT 
        tw.*,
        c.name as cabinet_name,
        CONCAT(tw.row, '行', tw.col, '列') as cell_number
      FROM theft_warnings tw
      INNER JOIN cabinets c ON tw.cabinet_id = c.id
      WHERE (tw.recipient_phone = ? OR tw.sender_phone = ?)
      AND tw.status IN ('active', 'confirmed')
      ORDER BY tw.theft_time DESC
    `, [userPhone, userPhone]);

    res.json({
      success: true,
      data: warnings
    });
  } catch (error) {
    console.error('获取失窃警告失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 处理失窃警告（意外取出/确认失窃）
app.post('/api/hardware/handle-theft-warning', verifyToken, async (req, res) => {
  const { warningId, action } = req.body; // action: 'dismiss' | 'confirm' | 'resolve'
  const connection = await pool.getConnection();

  try {
    if (!warningId || !action) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    // 查询警告信息
    const [warnings] = await connection.execute(`
      SELECT * FROM theft_warnings WHERE id = ?
    `, [warningId]);

    if (warnings.length === 0) {
      return res.status(404).json({ success: false, message: '警告不存在' });
    }

    const warning = warnings[0];

    if (action === 'dismiss') {
      // 意外取出：解除警告，恢复格位状态为可用，更新订单状态
      await connection.beginTransaction();

      // 更新警告状态
      await connection.execute(`
        UPDATE theft_warnings SET status = 'dismissed', resolved_time = NOW(), resolved_user_id = ? WHERE id = ?
      `, [req.userId, warningId]);

      // 恢复格位状态为可用
      const [cabinets] = await connection.execute(
        'SELECT cells FROM cabinets WHERE id = ?',
        [warning.cabinet_id]
      );

      if (cabinets.length > 0) {
        const cells = JSON.parse(cabinets[0].cells);
        const cellKey = warning.cell_key;

        if (cells[cellKey]) {
          cells[cellKey] = 'available';
          await connection.execute(
            'UPDATE cabinets SET cells = ?, available = available + 1 WHERE id = ?',
            [JSON.stringify(cells), warning.cabinet_id]
          );
          console.log(`[失窃警告] 意外取出：格位${cellKey}恢复为available`);
        }
      }

      // 更新订单状态：标记为已取出（实际是意外取出，但视为完成）
      await connection.execute(`
        UPDATE orders SET picked_up = TRUE, pickup_time = NOW() WHERE id = ?
      `, [warning.order_id]);
      console.log(`[失窃警告] 订单${warning.order_id}标记为已完成（意外取出）`);

      await connection.commit();
      res.json({ success: true, message: '警告已解除，格位已恢复为可用状态' });

    } else if (action === 'confirm') {
      // 确认失窃：更新警告状态为confirmed，标记订单为失窃
      await connection.execute(`
        UPDATE theft_warnings SET status = 'confirmed' WHERE id = ?
      `, [warningId]);

      // 标记订单为失窃
      await connection.execute(`
        UPDATE orders SET is_stolen = TRUE WHERE id = ?
      `, [warning.order_id]);
      console.log(`[失窃警告] 订单${warning.order_id}标记为失窃状态`);

      res.json({ success: true, message: '已确认为失窃，警告将保留' });

    } else if (action === 'resolve') {
      // 解决失窃：取消警告，恢复格位状态为可用，更新订单状态
      await connection.beginTransaction();

      // 更新警告状态
      await connection.execute(`
        UPDATE theft_warnings SET status = 'resolved', resolved_time = NOW(), resolved_user_id = ? WHERE id = ?
      `, [req.userId, warningId]);

      // 恢复格位状态为可用
      const [cabinets] = await connection.execute(
        'SELECT cells FROM cabinets WHERE id = ?',
        [warning.cabinet_id]
      );

      if (cabinets.length > 0) {
        const cells = JSON.parse(cabinets[0].cells);
        const cellKey = warning.cell_key;

        if (cells[cellKey]) {
          cells[cellKey] = 'available';
          await connection.execute(
            'UPDATE cabinets SET cells = ?, available = available + 1 WHERE id = ?',
            [JSON.stringify(cells), warning.cabinet_id]
          );
          console.log(`[失窃警告] 失窃已解决：格位${cellKey}恢复为available`);
        }
      }

      // 更新订单状态：标记为已取出
      await connection.execute(`
        UPDATE orders SET picked_up = TRUE, pickup_time = NOW() WHERE id = ?
      `, [warning.order_id]);
      console.log(`[失窃警告] 订单${warning.order_id}标记为已完成（失窃已解决）`);

      await connection.commit();
      res.json({ success: true, message: '失窃事件已解决，格位已恢复为可用状态' });

    } else {
      return res.status(400).json({ success: false, message: '无效的操作' });
    }
  } catch (error) {
    await connection.rollback();
    console.error('处理失窃警告失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 获取失窃警告详情
app.get('/api/hardware/theft-warning/:id', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const warningId = req.params.id;

    const [warnings] = await connection.execute(`
      SELECT tw.*, c.name as cabinet_name
      FROM theft_warnings tw
      LEFT JOIN cabinets c ON tw.cabinet_id = c.id
      WHERE tw.id = ?
    `, [warningId]);

    if (warnings.length === 0) {
      return res.status(404).json({ success: false, message: '警告不存在' });
    }

    res.json({ success: true, data: warnings[0] });
  } catch (error) {
    console.error('获取失窃警告详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 获取智能柜失窃格位列表（所有用户可见）
app.get('/api/cabinets/:id/stolen-cells', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const cabinetId = req.params.id;

    const [cabinets] = await connection.execute(
      'SELECT cells FROM cabinets WHERE id = ?',
      [cabinetId]
    );

    if (cabinets.length === 0) {
      return res.status(404).json({ success: false, message: '智能柜不存在' });
    }

    const cells = JSON.parse(cabinets[0].cells);
    const stolenCells = [];

    // 查找失窃格位的详细信息
    for (const [cellKey, status] of Object.entries(cells)) {
      if (status === 'stolen') {
        const [row, col] = cellKey.split('-').map(Number);
        const [warnings] = await connection.execute(`
          SELECT tw.*, o.pickup_code
          FROM theft_warnings tw
          LEFT JOIN orders o ON tw.order_id = o.id
          WHERE tw.cabinet_id = ? AND tw.row = ? AND tw.col = ?
          AND tw.status IN ('active', 'confirmed')
        `, [cabinetId, row, col]);

        if (warnings.length > 0) {
          stolenCells.push({
            cellKey,
            row,
            col,
            status,
            ...warnings[0]
          });
        }
      }
    }

    res.json({ success: true, data: stolenCells });
  } catch (error) {
    console.error('获取失窃格位列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// ==================== 社区帖子相关接口 ====================

// 获取社区帖子列表
app.get('/api/posts', async (req, res) => {
  const { category } = req.query;
  const connection = await pool.getConnection();

  console.log(`[getPosts] 获取帖子列表 - category: ${category || 'all'}`);

  try {
    // 使用 JOIN 获取帖子和作者的最新头像和昵称
    let sql = `
      SELECT 
        p.*,
        u.avatar as current_avatar,
        u.nickname as current_nickname
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
    `;
    const params = [];

    if (category) {
      sql += ' WHERE p.category = ?';
      params.push(category);
    }

    sql += ' ORDER BY p.create_time DESC LIMIT 50';

    const [posts] = await connection.execute(sql, params);

    // 解析 images 字段并转换为驼峰命名
    const result = posts.map(post => {
      const formatted = {
        id: post.id,
        userId: post.user_id,
        // 使用用户表中的最新昵称和头像
        nickname: post.current_nickname || post.nickname || '用户',
        avatar: post.current_avatar || post.avatar || '/static/default-avatar.png',
        category: post.category,
        title: post.title,
        content: post.content,
        images: post.images ? JSON.parse(post.images) : [],
        image: post.image,
        likeCount: post.like_count,
        commentCount: post.comment_count,
        createTime: post.create_time,
        updateTime: post.update_time,
        activityTheme: post.activity_theme,
        status: post.status,
        isOfficial: post.is_official || false
      };

      // 输出反馈帖子的状态用于调试
      if (post.category === 'feedback') {
        console.log(`[getPosts] 反馈帖子 - id: ${post.id}, status: ${post.status}, content: ${post.content.substring(0, 20)}...`);
      }

      return formatted;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取帖子列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 创建帖子
app.post('/api/posts', verifyToken, async (req, res) => {
  const { content, images, category, title } = req.body;
  const connection = await pool.getConnection();

  if (!content || !category) {
    return res.status(400).json({ success: false, message: '内容和分区不能为空' });
  }

  try {
    // 获取用户信息
    const [users] = await connection.execute(
      'SELECT nickname, avatar FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const user = users[0];

    // 检查权限：活动分区仅管理员可发布，定制分区不允许发布
    if (category === 'activity' && !req.isAdmin) {
      return res.status(403).json({ success: false, message: '仅管理员可发布活动内容' });
    }

    if (category === 'customize') {
      return res.status(403).json({ success: false, message: '该分区不支持发帖' });
    }

    // 创建帖子
    // 判断是否为官方帖子（管理员发布的活动帖子）
    const isOfficial = category === 'activity' && req.isAdmin;

    const [result] = await connection.execute(`
      INSERT INTO posts (
        user_id, nickname, avatar, category, title, content, images,
        like_count, comment_count, is_official
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
    `, [
      req.userId,
      user.nickname,
      user.avatar,
      category,
      title || '',
      content,
      images ? JSON.stringify(images) : JSON.stringify([]),
      isOfficial
    ]);

    // 获取新创建的帖子
    const [newPosts] = await connection.execute(
      'SELECT * FROM posts WHERE id = ?',
      [result.insertId]
    );

    const newPost = newPosts[0];
    newPost.images = newPost.images ? JSON.parse(newPost.images) : [];

    res.json({
      success: true,
      data: newPost
    });
  } catch (error) {
    console.error('创建帖子失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 创建智能柜定制订单
app.post('/api/cabinet-orders', verifyToken, async (req, res) => {
  const {
    type,
    extraLargeCount,
    largeCount,
    mediumCount,
    smallCount,
    rows,
    columns,
    theme,
    color,
    led,
    components,
    address,
    contactName,
    contactPhone,
    totalCount
  } = req.body;

  const connection = await pool.getConnection();

  if (!type || !address || !contactName || !contactPhone) {
    return res.status(400).json({ success: false, message: '必填信息不能为空' });
  }

  try {
    // 计算安装日期（7个工作日后）
    const installDate = new Date();
    installDate.setDate(installDate.getDate() + 7);

    // 生成订单ID
    const orderId = Date.now();

    // 创建定制订单
    await connection.execute(`
      INSERT INTO cabinet_orders (
        id, user_id, type, extra_large_count, large_count, medium_count, small_count,
        \`rows\`, \`columns\`, theme, color, led, components, address,
        contact_name, contact_phone, total_count, status, install_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?)
    `, [
      orderId,
      req.userId,
      type,
      extraLargeCount || 0,
      largeCount || 0,
      mediumCount || 0,
      smallCount || 0,
      rows || 0,
      columns || 0,
      theme || '',
      color || '',
      led || '',
      components ? JSON.stringify(components) : JSON.stringify([]),
      address,
      contactName,
      contactPhone,
      totalCount || 0,
      installDate
    ]);

    // 获取新创建的订单
    const [orders] = await connection.execute(
      'SELECT * FROM cabinet_orders WHERE id = ?',
      [orderId]
    );

    const order = orders[0];

    // 转换为驼峰命名
    const formattedOrder = {
      id: order.id,
      userId: order.user_id,
      type: order.type,
      extraLargeCount: order.extra_large_count,
      largeCount: order.large_count,
      mediumCount: order.medium_count,
      smallCount: order.small_count,
      rows: order.rows,
      columns: order.columns,
      theme: order.theme,
      color: order.color,
      led: order.led,
      components: order.components ? JSON.parse(order.components) : [],
      address: order.address,
      contactName: order.contact_name,
      contactPhone: order.contact_phone,
      totalCount: order.total_count,
      status: order.status,
      installDate: order.install_date,
      createTime: order.create_time,
      updateTime: order.update_time
    };

    res.json({
      success: true,
      data: formattedOrder
    });
  } catch (error) {
    console.error('创建定制订单失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 获取用户的定制订单列表
app.get('/api/cabinet-orders', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const [orders] = await connection.execute(`
      SELECT * FROM cabinet_orders
      WHERE user_id = ?
      ORDER BY create_time DESC
      LIMIT 50
    `, [req.userId]);

    // 解析字段并转换为驼峰命名
    const result = orders.map(order => ({
      id: order.id,
      userId: order.user_id,
      type: order.type,
      extraLargeCount: order.extra_large_count,
      largeCount: order.large_count,
      mediumCount: order.medium_count,
      smallCount: order.small_count,
      rows: order.rows,
      columns: order.columns,
      theme: order.theme,
      color: order.color,
      led: order.led,
      components: order.components ? JSON.parse(order.components) : [],
      address: order.address,
      contactName: order.contact_name,
      contactPhone: order.contact_phone,
      totalCount: order.total_count,
      status: order.status,
      installDate: order.install_date,
      createTime: order.create_time,
      updateTime: order.update_time
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取定制订单列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// ==================== 帖子相关接口（删除、评论、点赞） ====================

// 删除帖子（只有作者或管理员可以删除）
app.delete('/api/posts/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    // 检查帖子是否存在
    const [posts] = await connection.execute(
      'SELECT user_id FROM posts WHERE id = ?',
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    // 检查是否为作者或管理员
    if (posts[0].user_id !== req.userId && !req.isAdmin) {
      return res.status(403).json({ success: false, message: '无权删除此帖子' });
    }

    // 删除帖子（由于外键约束，相关的评论和点赞会自动删除）
    await connection.execute('DELETE FROM posts WHERE id = ?', [id]);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除帖子失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 获取帖子评论列表
app.get('/api/posts/:id/comments', async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    // 使用 JOIN 获取评论和评论者的最新昵称和头像
    const [comments] = await connection.execute(`
      SELECT 
        c.*,
        u.nickname as current_nickname,
        u.avatar as current_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.create_time ASC
    `, [id]);

    // 转换为驼峰命名
    const result = comments.map(comment => ({
      id: comment.id,
      postId: comment.post_id,
      userId: comment.user_id,
      // 使用用户表中的最新昵称和头像
      nickname: comment.current_nickname || comment.nickname || '用户',
      avatar: comment.current_avatar || comment.avatar || '/static/default-avatar.png',
      content: comment.content,
      isOfficialReply: comment.is_official_reply || false,
      createTime: comment.create_time
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 创建评论
app.post('/api/posts/:id/comments', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const connection = await pool.getConnection();

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: '评论内容不能为空' });
  }

  try {
    // 检查帖子是否存在
    const [posts] = await connection.execute(
      'SELECT id FROM posts WHERE id = ?',
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    // 获取用户信息
    const [users] = await connection.execute(
      'SELECT nickname, avatar FROM users WHERE id = ?',
      [req.userId]
    );

    const user = users[0];
    const isOfficialReply = req.isAdmin; // 管理员的回复被识别为官方回复

    // 创建评论
    const [result] = await connection.execute(`
      INSERT INTO comments (post_id, user_id, nickname, avatar, content, is_official_reply)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, req.userId, user.nickname, user.avatar, content, isOfficialReply]);

    // 更新帖子的评论数
    await connection.execute(
      'UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?',
      [id]
    );

    // 获取新创建的评论
    const [newComments] = await connection.execute(
      'SELECT * FROM comments WHERE id = ?',
      [result.insertId]
    );

    res.json({ success: true, data: newComments[0] });
  } catch (error) {
    console.error('创建评论失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 点赞/取消点赞帖子
app.post('/api/posts/:id/like', verifyToken, async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    // 检查帖子是否存在
    const [posts] = await connection.execute(
      'SELECT id FROM posts WHERE id = ?',
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    // 检查是否已点赞
    const [likes] = await connection.execute(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
      [id, req.userId]
    );

    await connection.beginTransaction();

    if (likes.length > 0) {
      // 已点赞，取消点赞
      await connection.execute(
        'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
        [id, req.userId]
      );
      await connection.execute(
        'UPDATE posts SET like_count = like_count - 1 WHERE id = ?',
        [id]
      );
      await connection.commit();
      res.json({ success: true, data: { liked: false }, message: '取消点赞' });
    } else {
      // 未点赞，添加点赞
      await connection.execute(
        'INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)',
        [id, req.userId]
      );
      await connection.execute(
        'UPDATE posts SET like_count = like_count + 1 WHERE id = ?',
        [id]
      );
      await connection.commit();
      res.json({ success: true, data: { liked: true }, message: '点赞成功' });
    }
  } catch (error) {
    await connection.rollback();
    console.error('点赞操作失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 检查用户是否已点赞帖子
app.get('/api/posts/:id/liked', verifyToken, async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    const [likes] = await connection.execute(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
      [id, req.userId]
    );

    res.json({ success: true, data: { liked: likes.length > 0 } });
  } catch (error) {
    console.error('检查点赞状态失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 管理员修改帖子状态（仅管理员）
app.put('/api/posts/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const connection = await pool.getConnection();

  console.log(`[updatePostStatus] 尝试更新帖子状态 - postId: ${id}, status: ${status}, userId: ${req.userId}, isAdmin: ${req.isAdmin}`);

  if (!req.isAdmin) {
    console.log(`[updatePostStatus] 权限不足 - userId: ${req.userId}, phone: ${req.phone}`);
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }

  if (!status || !['pending', 'processing', 'solved'].includes(status)) {
    return res.status(400).json({ success: false, message: '无效的状态值' });
  }

  try {
    // 检查帖子是否存在
    const [posts] = await connection.execute(
      'SELECT id FROM posts WHERE id = ?',
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    // 更新帖子状态
    await connection.execute(
      'UPDATE posts SET status = ? WHERE id = ?',
      [status, id]
    );

    console.log(`[updatePostStatus] 状态更新成功 - postId: ${id}, newStatus: ${status}`);
    res.json({ success: true, message: '状态更新成功', data: { status } });
  } catch (error) {
    console.error('更新帖子状态失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 404 处理（必须在所有路由之后）
app.use((req, res) => {
  console.warn('未找到路由:', req.method, req.url);
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.url,
    method: req.method
  });
});

// 全局错误处理中间件（必须在所有路由之后）
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  
  // 处理 JSON 解析错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON 解析错误:', {
      url: req.url,
      method: req.method,
      contentType: req.headers['content-type'],
      body: req.body
    });
    return res.status(400).json({
      success: false,
      message: '请求体格式错误，请确保发送有效的 JSON 数据'
    });
  }
  
  // 处理其他错误
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

// 启动服务器
async function startServer() {
  try {
    await initDatabase();
    await updateTables();
    
    // 测试静态文件路径
    const testFile = path.join(staticPath, 'default-avatar.png');
    console.log(`[启动检查] 测试文件路径: ${testFile}`);
    console.log(`[启动检查] 测试文件存在: ${fs.existsSync(testFile)}`);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`智能柜服务器已启动，监听端口 ${PORT}`);
      console.log(`API 地址: http://localhost:${PORT}/api`);
      console.log(`测试静态文件: http://localhost:${PORT}/static/default-avatar.png`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
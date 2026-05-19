const mysql = require('mysql2/promise');

// 数据库配置 - 适配玩客云 MariaDB
const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'smart_cabinet',
  charset: 'utf8mb4',
  timezone: '+08:00',
  connectionLimit: 10,
  queueLimit: 0,
  waitForConnections: true,
  // MariaDB 兼容选项
  ssl: false,
  multipleStatements: false
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 初始化数据库表
async function initDatabase() {
  const connection = await pool.getConnection();
  
  try {
    // 创建用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        phone VARCHAR(11) UNIQUE NOT NULL,
        nickname VARCHAR(50),
        avatar VARCHAR(255),
        token VARCHAR(500),
        is_admin BOOLEAN DEFAULT FALSE,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建智能柜表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cabinets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        address VARCHAR(255),
        distance VARCHAR(50),
        distance_value DECIMAL(10,2),
        latitude DECIMAL(10,6),
        longitude DECIMAL(10,6),
        type ENUM('delivery', 'storage') DEFAULT 'delivery',
        available INT DEFAULT 0,
        total INT DEFAULT 0,
        sizes JSON,
        cells JSON,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建订单表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGINT PRIMARY KEY,
        type ENUM('store', 'pickup') NOT NULL,
        user_id INT,
        cabinet_id INT NOT NULL,
        cabinet_name VARCHAR(100),
        scene_type ENUM('delivery', 'storage') DEFAULT 'delivery',
        cell_number VARCHAR(50),
        row INT,
        col INT,
        pickup_code VARCHAR(6),
        nfc_id VARCHAR(10),
        recipient_phone VARCHAR(11),
        recipient_nickname VARCHAR(50),
        recipient_remark TEXT,
        related_store_id BIGINT,
        picked_up BOOLEAN DEFAULT FALSE,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        pickup_time DATETIME,
        INDEX idx_user_id (user_id),
        INDEX idx_recipient_phone (recipient_phone),
        INDEX idx_pickup_code (pickup_code),
        INDEX idx_cabinet_cell (cabinet_id, row, col),
        INDEX idx_create_time (create_time),
        FOREIGN KEY (cabinet_id) REFERENCES cabinets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建社区帖子表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        nickname VARCHAR(50),
        avatar VARCHAR(255),
        category ENUM('discussion', 'feedback', 'activity', 'customize') NOT NULL,
        title VARCHAR(200),
        content TEXT,
        images JSON,
        image VARCHAR(255),
        like_count INT DEFAULT 0,
        comment_count INT DEFAULT 0,
        status ENUM('pending', 'processing', 'solved') DEFAULT 'pending',
        reply TEXT,
        is_official BOOLEAN DEFAULT FALSE,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_create_time (create_time),
        INDEX idx_status (status),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建评论表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        nickname VARCHAR(50),
        avatar VARCHAR(255),
        content TEXT NOT NULL,
        is_official_reply BOOLEAN DEFAULT FALSE,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_post_id (post_id),
        INDEX idx_user_id (user_id),
        INDEX idx_create_time (create_time),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建点赞表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_post_user (post_id, user_id),
        INDEX idx_post_id (post_id),
        INDEX idx_user_id (user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建主题表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS themes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type ENUM('app', 'cabinet') NOT NULL,
        name VARCHAR(100) NOT NULL,
        author VARCHAR(50),
        preview VARCHAR(255),
        preview_time DATETIME,
        downloads INT DEFAULT 0,
        is_official BOOLEAN DEFAULT FALSE,
        ranking INT,
        category VARCHAR(50),
        price VARCHAR(20),
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建智能柜定制订单表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cabinet_orders (
        id BIGINT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        extra_large_count INT DEFAULT 0,
        large_count INT DEFAULT 0,
        medium_count INT DEFAULT 0,
        small_count INT DEFAULT 0,
        \`rows\` INT DEFAULT 0,
        \`columns\` INT DEFAULT 0,
        theme VARCHAR(100),
        color VARCHAR(50),
        led VARCHAR(50),
        components JSON,
        address VARCHAR(255),
        contact_name VARCHAR(50),
        contact_phone VARCHAR(20),
        total_count INT DEFAULT 0,
        status ENUM('processing', 'installing', 'completed') DEFAULT 'processing',
        install_date DATETIME,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_create_time (create_time),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 更新表结构 - 添加新字段（用于已存在的表）
    await updateTableSchema(connection);

    // 初始化智能柜数据（如果表为空）
    const [cabinets] = await connection.execute('SELECT COUNT(*) as count FROM cabinets');
    if (cabinets[0].count === 0) {
      await initCabinetData(connection);
    }

    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 更新表结构 - 添加新字段
async function updateTableSchema(connection) {
  const migrations = [
    { table: 'users', column: 'is_admin', definition: 'BOOLEAN DEFAULT FALSE' },
    { table: 'posts', column: 'status', definition: "ENUM('pending', 'processing', 'solved') DEFAULT 'pending'" },
    { table: 'posts', column: 'reply', definition: 'TEXT' },
    { table: 'posts', column: 'is_official', definition: 'BOOLEAN DEFAULT FALSE' },
    { table: 'comments', column: 'is_official_reply', definition: 'BOOLEAN DEFAULT FALSE' },
    { table: 'orders', column: 'is_stolen', definition: 'BOOLEAN DEFAULT FALSE' },
    { table: 'theft_warnings', column: 'sender_phone', definition: 'VARCHAR(11)' },
    { table: 'theft_warnings', column: 'sender_nickname', definition: 'VARCHAR(50)' }
  ];

  for (const migration of migrations) {
    try {
      // 检查列是否已存在
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'smart_cabinet'
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
      `, [migration.table, migration.column]);

      if (columns.length === 0) {
        // 列不存在，添加列
        await connection.execute(`
          ALTER TABLE ${migration.table}
          ADD COLUMN ${migration.column} ${migration.definition}
        `);
        console.log(`添加字段: ${migration.table}.${migration.column}`);
      }
    } catch (error) {
      // 忽略字段已存在的错误
      if (!error.message.includes('Duplicate column name')) {
        console.error(`更新表结构失败 (${migration.table}.${migration.column}):`, error.message);
      }
    }
  }

  // 创建失窃警告表
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS theft_warnings (
        id BIGINT PRIMARY KEY,
        order_id BIGINT NOT NULL,
        cabinet_id INT NOT NULL,
        cell_key VARCHAR(20) NOT NULL,
        row INT NOT NULL,
        col INT NOT NULL,
        recipient_phone VARCHAR(11),
        recipient_nickname VARCHAR(50),
        status ENUM('active', 'confirmed', 'resolved', 'dismissed') DEFAULT 'active',
        theft_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_time DATETIME,
        resolved_user_id INT,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id),
        INDEX idx_cabinet_id (cabinet_id),
        INDEX idx_status (status),
        INDEX idx_create_time (create_time),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (cabinet_id) REFERENCES cabinets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('失窃警告表创建成功');
  } catch (error) {
    console.error('创建失窃警告表失败:', error.message);
  }
}

// 初始化智能柜模拟数据
async function initCabinetData(connection) {
  const cabinetData = [
    {
      id: 1,
      name: '天河城1号柜',
      address: '天河区天河路208号天河城B1层',
      distance: '300m',
      distanceValue: 0.3,
      latitude: 23.137,
      longitude: 113.326,
      type: 'delivery',
      available: 20,
      total: 20,
      sizes: { extraLarge: 4, large: 4, medium: 8, small: 4 },
      cells: {
        '1-1': 'available', '1-2': 'available', '1-3': 'available', '1-4': 'available',
        '2-1': 'available', '2-2': 'available', '2-3': 'available', '2-4': 'available',
        '3-1': 'available', '3-2': 'available', '3-3': 'available', '3-4': 'available',
        '4-1': 'available', '4-2': 'available', '4-3': 'available', '4-4': 'available',
        '5-1': 'available', '5-2': 'available', '5-3': 'available', '5-4': 'available'
      }
    },
    {
      id: 2,
      name: '珠江新城2号柜',
      address: '天河区珠江新城花城大道85号',
      distance: '500m',
      distanceValue: 0.5,
      latitude: 23.117,
      longitude: 113.337,
      type: 'delivery',
      available: 16,
      total: 16,
      sizes: { extraLarge: 2, large: 4, medium: 6, small: 4 },
      cells: {
        '1-1': 'available', '1-2': 'available', '1-3': 'available', '1-4': 'available',
        '2-1': 'available', '2-2': 'available', '2-3': 'available', '2-4': 'available',
        '3-1': 'available', '3-2': 'available', '3-3': 'available', '3-4': 'available',
        '4-1': 'available', '4-2': 'available', '4-3': 'available', '4-4': 'available'
      }
    },
    {
      id: 3,
      name: '体育中心3号柜',
      address: '天河区天河体育中心南门',
      distance: '800m',
      distanceValue: 0.8,
      latitude: 23.135,
      longitude: 113.345,
      type: 'storage',
      available: 24,
      total: 24,
      sizes: { extraLarge: 6, large: 6, medium: 8, small: 4 },
      cells: {
        '1-1': 'available', '1-2': 'available', '1-3': 'available', '1-4': 'available',
        '1-5': 'available', '1-6': 'available',
        '2-1': 'available', '2-2': 'available', '2-3': 'available', '2-4': 'available',
        '2-5': 'available', '2-6': 'available',
        '3-1': 'available', '3-2': 'available', '3-3': 'available', '3-4': 'available',
        '3-5': 'available', '3-6': 'available',
        '4-1': 'available', '4-2': 'available', '4-3': 'available', '4-4': 'available',
        '4-5': 'available', '4-6': 'available'
      }
    },
    {
      id: 4,
      name: '太古汇4号柜',
      address: '天河区天河路383号太古汇B2层',
      distance: '1.2km',
      distanceValue: 1.2,
      latitude: 23.129,
      longitude: 113.318,
      type: 'delivery',
      available: 12,
      total: 12,
      sizes: { extraLarge: 2, large: 2, medium: 4, small: 4 },
      cells: {
        '1-1': 'available', '1-2': 'available', '1-3': 'available', '1-4': 'available',
        '2-1': 'available', '2-2': 'available', '2-3': 'available', '2-4': 'available',
        '3-1': 'available', '3-2': 'available', '3-3': 'available', '3-4': 'available'
      }
    }
  ];

  for (const cabinet of cabinetData) {
    await connection.execute(`
      INSERT INTO cabinets (id, name, address, distance, distance_value, latitude, longitude, type, available, total, sizes, cells)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cabinet.id,
      cabinet.name,
      cabinet.address,
      cabinet.distance,
      cabinet.distanceValue,
      cabinet.latitude,
      cabinet.longitude,
      cabinet.type,
      cabinet.available,
      cabinet.total,
      JSON.stringify(cabinet.sizes),
      JSON.stringify(cabinet.cells)
    ]);
  }

  // 初始化主题数据
  const themeData = [
    {
      id: 1, type: 'app', name: '默认绿色', author: '官方',
      preview: 'linear-gradient(135deg, #A5D63F 0%, #8BC34A 100%)',
      isOfficial: true, ranking: 3, category: 'natural', downloads: 12580
    },
    {
      id: 2, type: 'app', name: '科技蓝', author: '官方',
      preview: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
      isOfficial: true, ranking: 1, category: 'tech', downloads: 23450
    },
    {
      id: 3, type: 'app', name: '暗夜黑', author: '官方',
      preview: 'linear-gradient(135deg, #212121 0%, #424242 100%)',
      isOfficial: true, ranking: 2, category: 'dark', downloads: 18920
    },
    {
      id: 1, type: 'cabinet', name: '简约白', author: '官方',
      preview: '#FFFFFF', price: '免费'
    },
    {
      id: 2, type: 'cabinet', name: '活力橙', author: '官方',
      preview: '#FF9800', price: '免费'
    }
  ];

  for (const theme of themeData) {
    await connection.execute(`
      INSERT INTO themes (id, type, name, author, preview, is_official, ranking, category, price, downloads)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      theme.id,
      theme.type,
      theme.name,
      theme.author,
      theme.preview,
      theme.isOfficial !== undefined ? theme.isOfficial : false,
      theme.ranking !== undefined ? theme.ranking : null,
      theme.category !== undefined ? theme.category : null,
      theme.price !== undefined ? theme.price : null,
      theme.downloads !== undefined ? theme.downloads : 0
    ]);
  }

  console.log('智能柜和主题数据初始化完成');
}

// 更新表结构 - 为已存在的表添加新字段
async function updateTables() {
  const connection = await pool.getConnection();
  try {
    console.log('检查并更新表结构...');

    // 检查 users 表是否有 password 字段
    const [usersPassword] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password'
    `);
    if (usersPassword.length === 0) {
      await connection.execute(`ALTER TABLE users ADD COLUMN password TEXT`);
      console.log('已为 users 表添加 password 字段');
    }

    // 检查 users 表是否有 is_admin 字段
    const [usersColumns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_admin'
    `);
    if (usersColumns.length === 0) {
      await connection.execute(`ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE`);
      console.log('已为 users 表添加 is_admin 字段');
    }

    // 检查 posts 表是否有 status 字段
    const [postsStatus] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'status'
    `);
    if (postsStatus.length === 0) {
      await connection.execute(`ALTER TABLE posts ADD COLUMN status ENUM('pending', 'processing', 'solved') DEFAULT 'pending'`);
      console.log('已为 posts 表添加 status 字段');
    }

    // 检查 posts 表是否有 reply 字段
    const [postsReply] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'reply'
    `);
    if (postsReply.length === 0) {
      await connection.execute(`ALTER TABLE posts ADD COLUMN reply TEXT`);
      console.log('已为 posts 表添加 reply 字段');
    }

    // 检查 posts 表是否有 is_official 字段
    const [postsOfficial] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'is_official'
    `);
    if (postsOfficial.length === 0) {
      await connection.execute(`ALTER TABLE posts ADD COLUMN is_official BOOLEAN DEFAULT FALSE`);
      console.log('已为 posts 表添加 is_official 字段');
    }

    // 检查 comments 表是否有 is_official_reply 字段
    const [commentsOfficial] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'comments' AND COLUMN_NAME = 'is_official_reply'
    `);
    if (commentsOfficial.length === 0) {
      await connection.execute(`ALTER TABLE comments ADD COLUMN is_official_reply BOOLEAN DEFAULT FALSE`);
      console.log('已为 comments 表添加 is_official_reply 字段');
    }

    console.log('表结构更新完成');
  } catch (error) {
    console.error('更新表结构时出错:', error);
  } finally {
    connection.release();
  }
}

module.exports = { pool, initDatabase, updateTables };
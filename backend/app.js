const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');

// 导入路由
const userRoutes = require('./routes/user');
const indicatorRoutes = require('./routes/indicator');
const recordRoutes = require('./routes/record');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// 数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'health_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 将数据库池共享给路由
app.set('db', pool);

// API路由
app.use('/api/user', userRoutes);
app.use('/api/indicators', indicatorRoutes);
app.use('/api/records', recordRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: '服务正常', data: { time: new Date().toLocaleString() } });
});

// 前端路由 - 返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ code: 1, message: err.message || '服务器错误' });
});

app.listen(PORT, () => {
  console.log(`\n🏥 健康数据追踪助手后端服务已启动`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`📁 上传目录: ${path.join(__dirname, 'uploads')}\n`);
});

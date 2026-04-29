const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const JWT_SECRET = 'health-tracker-secret-key-2024';

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `record-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件'));
    }
  }
});

// 验证登录中间件
const authMiddleware = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.json({ code: 1, message: '请先登录' });
    }

    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.json({ code: 1, message: '登录已过期，请重新登录' });
  }
};

// 添加记录
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { indicator_id, value, note, measured_at } = req.body;

    if (!indicator_id || !value) {
      return res.json({ code: 1, message: '指标和数值不能为空' });
    }

    const db = req.app.get('db');

    // 检查指标是否存在
    const [indicators] = await db.query(
      'SELECT * FROM indicators WHERE id = ? AND (is_preset = 1 OR user_id = ?)',
      [indicator_id, req.userId]
    );

    if (indicators.length === 0) {
      return res.json({ code: 1, message: '指标不存在' });
    }

    // 图片路径
    const image = req.file ? `/uploads/${req.file.filename}` : '';

    // 创建记录
    const [result] = await db.query(
      `INSERT INTO records (user_id, indicator_id, value, note, image, measured_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        indicator_id,
        value,
        note || '',
        image,
        measured_at || new Date()
      ]
    );

    res.json({
      code: 0,
      message: '添加成功',
      data: {
        id: result.insertId,
        indicator_id,
        value,
        note,
        image,
        measured_at: measured_at || new Date()
      }
    });
  } catch (error) {
    console.error('Add record error:', error);
    res.json({ code: 1, message: '添加记录失败' });
  }
});

// 获取记录列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { indicator_id, start_date, end_date, page = 1, limit = 20 } = req.query;

    const db = req.app.get('db');
    let whereClause = 'WHERE r.user_id = ?';
    const params = [req.userId];

    if (indicator_id) {
      whereClause += ' AND r.indicator_id = ?';
      params.push(indicator_id);
    }

    if (start_date) {
      whereClause += ' AND r.measured_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND r.measured_at <= ?';
      params.push(end_date);
    }

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM records r ${whereClause}`,
      params
    );

    // 获取记录列表
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [records] = await db.query(
      `SELECT r.*, i.name as indicator_name, i.unit, i.color, i.normal_min, i.normal_max
       FROM records r
       LEFT JOIN indicators i ON r.indicator_id = i.id
       ${whereClause}
       ORDER BY r.measured_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      code: 0,
      message: '获取成功',
      data: {
        list: records,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get records error:', error);
    res.json({ code: 1, message: '获取记录失败' });
  }
});

// 获取统计数据
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { indicator_id, days = 30 } = req.query;

    const db = req.app.get('db');
    let whereClause = 'WHERE r.user_id = ?';
    const params = [req.userId];

    if (indicator_id) {
      whereClause += ' AND r.indicator_id = ?';
      params.push(indicator_id);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    whereClause += ' AND r.measured_at >= ?';
    params.push(startDate.toISOString().slice(0, 19).replace('T', ' '));

    // 基础统计
    const [stats] = await db.query(
      `SELECT
        r.indicator_id,
        i.name as indicator_name,
        i.unit,
        i.color,
        i.normal_min,
        i.normal_max,
        COUNT(*) as count,
        AVG(r.value) as avg_value,
        MIN(r.value) as min_value,
        MAX(r.value) as max_value
       FROM records r
       LEFT JOIN indicators i ON r.indicator_id = i.id
       ${whereClause}
       GROUP BY r.indicator_id, i.name, i.unit, i.color, i.normal_min, i.normal_max`,
      params
    );

    // 最新记录
    const [latestRecords] = await db.query(
      `SELECT r.*, i.name as indicator_name, i.unit, i.color, i.normal_min, i.normal_max
       FROM records r
       LEFT JOIN indicators i ON r.indicator_id = i.id
       WHERE r.user_id = ?${indicator_id ? ' AND r.indicator_id = ?' : ''}
       ORDER BY r.measured_at DESC
       LIMIT 10`,
      indicator_id ? [req.userId, indicator_id] : [req.userId]
    );

    // 趋势数据（最近30天，每天一个点）
    const [trendData] = await db.query(
      `SELECT
        DATE(r.measured_at) as date,
        r.indicator_id,
        i.name as indicator_name,
        i.unit,
        i.color,
        AVG(r.value) as avg_value
       FROM records r
       LEFT JOIN indicators i ON r.indicator_id = i.id
       ${whereClause}
       GROUP BY DATE(r.measured_at), r.indicator_id, i.name, i.unit, i.color
       ORDER BY date ASC`,
      params
    );

    res.json({
      code: 0,
      message: '获取成功',
      data: {
        stats,
        latestRecords,
        trendData
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.json({ code: 1, message: '获取统计失败' });
  }
});

// 删除记录
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.get('db');

    // 获取记录（检查所有权）
    const [records] = await db.query(
      'SELECT * FROM records WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (records.length === 0) {
      return res.json({ code: 1, message: '记录不存在' });
    }

    // 删除图片（如果存在）
    if (records[0].image) {
      const imagePath = path.join(__dirname, '..', records[0].image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // 删除记录
    await db.query('DELETE FROM records WHERE id = ?', [id]);

    res.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('Delete record error:', error);
    res.json({ code: 1, message: '删除记录失败' });
  }
});

module.exports = router;

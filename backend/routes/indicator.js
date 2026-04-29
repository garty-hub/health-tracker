const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'health-tracker-secret-key-2024';

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

// 获取指标列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = req.app.get('db');

    // 获取预设指标 + 用户自定义指标
    const [indicators] = await db.query(
      `SELECT * FROM indicators
       WHERE (is_preset = 1 AND user_id = 0) OR user_id = ?
       ORDER BY is_preset DESC, sort_order ASC`,
      [req.userId]
    );

    res.json({ code: 0, message: '获取成功', data: indicators });
  } catch (error) {
    console.error('Get indicators error:', error);
    res.json({ code: 1, message: '获取指标失败' });
  }
});

// 添加自定义指标
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, unit, normal_min, normal_max, color } = req.body;

    if (!name || !unit) {
      return res.json({ code: 1, message: '指标名称和单位不能为空' });
    }

    const db = req.app.get('db');

    // 检查是否已有同名指标
    const [existing] = await db.query(
      'SELECT id FROM indicators WHERE name = ? AND (user_id = 0 OR user_id = ?)',
      [name, req.userId]
    );

    if (existing.length > 0) {
      return res.json({ code: 1, message: '已存在同名指标' });
    }

    // 获取最大排序值
    const [maxSort] = await db.query(
      'SELECT MAX(sort_order) as max_sort FROM indicators WHERE user_id = ?',
      [req.userId]
    );
    const sortOrder = (maxSort[0].max_sort || 0) + 1;

    const [result] = await db.query(
      `INSERT INTO indicators (user_id, name, unit, normal_min, normal_max, color, is_preset, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [req.userId, name, unit, normal_min || null, normal_max || null, color || '#4A90D9', sortOrder]
    );

    res.json({
      code: 0,
      message: '添加成功',
      data: {
        id: result.insertId,
        name,
        unit,
        normal_min,
        normal_max,
        color: color || '#4A90D9',
        is_preset: 0
      }
    });
  } catch (error) {
    console.error('Add indicator error:', error);
    res.json({ code: 1, message: '添加指标失败' });
  }
});

// 更新指标
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, normal_min, normal_max, color } = req.body;

    const db = req.app.get('db');

    // 检查是否为用户自定义指标
    const [indicators] = await db.query(
      'SELECT * FROM indicators WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (indicators.length === 0) {
      return res.json({ code: 1, message: '指标不存在或无法修改' });
    }

    if (indicators[0].is_preset === 1) {
      return res.json({ code: 1, message: '预设指标无法修改' });
    }

    await db.query(
      `UPDATE indicators SET name = ?, unit = ?, normal_min = ?, normal_max = ?, color = ?
       WHERE id = ? AND user_id = ?`,
      [name, unit, normal_min, normal_max, color, id, req.userId]
    );

    res.json({ code: 0, message: '更新成功' });
  } catch (error) {
    console.error('Update indicator error:', error);
    res.json({ code: 1, message: '更新指标失败' });
  }
});

// 删除指标
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.get('db');

    // 检查是否为用户自定义指标
    const [indicators] = await db.query(
      'SELECT * FROM indicators WHERE id = ? AND user_id = ? AND is_preset = 0',
      [id, req.userId]
    );

    if (indicators.length === 0) {
      return res.json({ code: 1, message: '指标不存在或无法删除' });
    }

    // 删除指标（关联记录会保留，但无法再选这个指标）
    await db.query('DELETE FROM indicators WHERE id = ?', [id]);

    res.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('Delete indicator error:', error);
    res.json({ code: 1, message: '删除指标失败' });
  }
});

module.exports = router;

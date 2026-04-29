const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'health-tracker-secret-key-2024';

// 注册
router.post('/register', async (req, res) => {
  try {
    const { phone, password, nickname } = req.body;

    if (!phone || !password) {
      return res.json({ code: 1, message: '手机号和密码不能为空' });
    }

    const db = req.app.get('db');

    // 检查手机号是否已注册
    const [existing] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existing.length > 0) {
      return res.json({ code: 1, message: '该手机号已注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await db.query(
      'INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)',
      [phone, hashedPassword, nickname || '用户' + phone.slice(-4)]
    );

    // 生成Token
    const token = jwt.sign({ userId: result.insertId }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      code: 0,
      message: '注册成功',
      data: {
        token,
        user: {
          id: result.insertId,
          phone,
          nickname: nickname || '用户' + phone.slice(-4)
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.json({ code: 1, message: '注册失败：' + error.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.json({ code: 1, message: '手机号和密码不能为空' });
    }

    const db = req.app.get('db');

    // 查找用户
    const [users] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.json({ code: 1, message: '手机号或密码错误' });
    }

    const user = users[0];

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.json({ code: 1, message: '手机号或密码错误' });
    }

    // 生成Token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.json({ code: 1, message: '登录失败：' + error.message });
  }
});

// 获取用户信息
router.get('/info', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.json({ code: 1, message: '请先登录' });
    }

    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    const db = req.app.get('db');
    const [users] = await db.query(
      'SELECT id, phone, nickname, avatar, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.json({ code: 1, message: '用户不存在' });
    }

    res.json({ code: 0, message: '获取成功', data: users[0] });
  } catch (error) {
    console.error('Get info error:', error);
    res.json({ code: 1, message: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/update', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.json({ code: 1, message: '请先登录' });
    }

    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    const { nickname, avatar } = req.body;
    const db = req.app.get('db');

    await db.query(
      'UPDATE users SET nickname = ?, avatar = ? WHERE id = ?',
      [nickname || '', avatar || '', decoded.userId]
    );

    res.json({ code: 0, message: '更新成功' });
  } catch (error) {
    console.error('Update error:', error);
    res.json({ code: 1, message: '更新失败' });
  }
});

module.exports = router;

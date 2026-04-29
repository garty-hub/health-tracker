-- 健康数据追踪助手 - 数据库初始化脚本

CREATE DATABASE IF NOT EXISTS health_tracker DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE health_tracker;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号',
  nickname VARCHAR(50) DEFAULT '' COMMENT '昵称',
  avatar VARCHAR(255) DEFAULT '' COMMENT '头像URL',
  password VARCHAR(100) NOT NULL COMMENT '密码(加密)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 指标表（预设+自定义）
CREATE TABLE IF NOT EXISTS indicators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT 0 COMMENT '用户ID，0表示全局预设',
  name VARCHAR(50) NOT NULL COMMENT '指标名称',
  unit VARCHAR(10) NOT NULL COMMENT '单位',
  normal_min DECIMAL(10,2) DEFAULT NULL COMMENT '正常范围最小值',
  normal_max DECIMAL(10,2) DEFAULT NULL COMMENT '正常范围最大值',
  color VARCHAR(20) DEFAULT '#4A90D9' COMMENT '图表颜色',
  is_preset TINYINT DEFAULT 0 COMMENT '是否预设：1是 0否',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_preset (is_preset)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 健康记录表
CREATE TABLE IF NOT EXISTS records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  indicator_id INT NOT NULL COMMENT '指标ID',
  value DECIMAL(10,2) NOT NULL COMMENT '测量值',
  note VARCHAR(255) DEFAULT '' COMMENT '备注',
  image VARCHAR(255) DEFAULT '' COMMENT '照片路径',
  measured_at TIMESTAMP NOT NULL COMMENT '测量时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_indicator_id (indicator_id),
  INDEX idx_measured_at (measured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入预设指标
INSERT INTO indicators (name, unit, normal_min, normal_max, color, is_preset, sort_order) VALUES
('血压-高压', 'mmHg', 90, 140, '#4A90D9', 1, 1),
('血压-低压', 'mmHg', 60, 90, '#5B9BD5', 1, 2),
('总胆固醇', 'mmol/L', 0, 5.2, '#52C41A', 1, 3),
('甘油三酯', 'mmol/L', 0, 1.7, '#7FB800', 1, 4),
('体重', 'kg', 40, 90, '#FF6B6B', 1, 5),
('血糖', 'mmol/L', 3.9, 6.1, '#FAAD14', 1, 6),
('心率', '次/分', 60, 100, '#9B59B6', 1, 7);

-- 插入测试用户（密码123456的MD5）
INSERT INTO users (phone, nickname, password) VALUES
('13800138000', '测试用户', 'e10adc3949ba59abbe56e057f20f883e');

SELECT '数据库初始化完成！' AS result;
SHOW TABLES;

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS checkin_app DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE checkin_app;

-- 打卡记录表
CREATE TABLE IF NOT EXISTS checkins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  checkin_date DATE NOT NULL COMMENT '打卡日期',
  checkin_time DATETIME NOT NULL COMMENT '打卡时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_date (checkin_date),
  INDEX idx_time (checkin_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打卡记录表';

-- 系统设置表
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(50) UNIQUE NOT NULL COMMENT '设置键',
  setting_value TEXT COMMENT '设置值',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统设置表';

-- 插入默认设置
INSERT INTO settings (setting_key, setting_value) VALUES
('emergency_email', ''),
('email_send_time', '09:00')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

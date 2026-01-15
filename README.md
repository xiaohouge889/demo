# 移动端打卡应用

一个功能完整的移动端打卡应用，支持打卡记录、紧急联系人邮箱绑定和定时邮件发送功能。

## 功能特性

- ✅ **打卡功能**：记录每日打卡时间，查看打卡历史
- ✅ **紧急联系人绑定**：绑定紧急联系人邮箱地址
- ✅ **邮件发送**：自动发送打卡信息到紧急联系人
- ✅ **时间配置**：自定义邮件发送时间
- ✅ **MySQL数据库**：使用MySQL存储所有数据
- ✅ **RESTful API**：标准的前后端分离架构

## 技术栈

### 前端
- **框架**：React 18 + Vite
- **路由**：React Router
- **HTTP客户端**：Axios
- **日期处理**：Day.js

### 后端
- **框架**：Node.js + Express
- **数据库**：MySQL 8.0+
- **邮件服务**：Nodemailer
- **定时任务**：node-cron

## 快速开始

### 前置要求

- Node.js 18+ 
- MySQL 8.0+
- npm 或 yarn

### 1. 安装依赖

```bash
npm run install:all
```

### 2. 配置数据库

创建MySQL数据库，然后复制环境变量配置文件：

```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env` 文件，配置数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=checkin_app
```

### 3. 初始化数据库

运行数据库初始化脚本创建表结构：

```bash
cd backend
npm run init-db
```

或者手动执行 `backend/database/init.sql` 文件中的SQL语句。

### 4. 配置邮件服务（可选）

在 `backend/.env` 文件中配置邮件服务信息：

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**注意事项**：
- **Gmail**: 需要使用"应用专用密码"（不是普通密码）
- **QQ邮箱**: 需要使用授权码（在QQ邮箱设置中获取）
- **163邮箱**: 需要使用授权码
- **其他邮箱**: 设置 `EMAIL_SERVICE=custom` 并配置对应的 `SMTP_HOST` 和 `SMTP_PORT`

### 5. 启动开发服务器

在项目根目录运行：

```bash
npm run dev
```

- 前端将在 `http://localhost:5173` 运行
- 后端API将在 `http://localhost:3000` 运行

### 6. 访问应用

在浏览器中打开 `http://localhost:5173`

## 项目结构

```
项目根目录/
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   │   ├── Home.jsx     # 打卡首页
│   │   │   ├── History.jsx  # 历史记录
│   │   │   └── Settings.jsx # 设置页面
│   │   ├── components/      # 公共组件
│   │   │   └── Layout.jsx   # 布局组件
│   │   └── utils/           # 工具函数
│   │       └── api.js       # API封装
│   └── package.json
├── backend/                  # Node.js后端服务
│   ├── database/            # 数据库相关
│   │   ├── connection.js    # 数据库连接
│   │   ├── init.js          # 初始化脚本
│   │   └── init.sql         # SQL初始化文件
│   ├── routes/              # API路由
│   │   ├── checkin.js       # 打卡路由
│   │   ├── settings.js      # 设置路由
│   │   └── email.js         # 邮件路由
│   ├── services/            # 业务逻辑
│   │   ├── checkin.js       # 打卡服务
│   │   ├── settings.js      # 设置服务
│   │   ├── email.js         # 邮件服务
│   │   └── cron.js          # 定时任务
│   ├── config.js            # 配置文件
│   ├── server.js            # 服务器入口
│   ├── .env                 # 环境变量（需要创建）
│   └── package.json
└── README.md
```

## API接口文档

### 打卡相关

- `POST /api/checkin` - 创建打卡记录
- `GET /api/checkin/today` - 获取今日打卡记录
- `GET /api/checkin/history?limit=100` - 获取打卡历史
- `GET /api/checkin/stats/week` - 获取本周统计

### 设置相关

- `GET /api/settings` - 获取设置
- `POST /api/settings` - 更新设置

### 邮件相关

- `POST /api/email/test` - 发送测试邮件

### 健康检查

- `GET /api/health` - 服务健康状态

## 使用说明

1. **打卡**：在首页点击打卡按钮记录打卡时间
2. **绑定邮箱**：在设置页面绑定紧急联系人邮箱
3. **配置发送时间**：在设置页面配置邮件发送时间（24小时制）
4. **查看历史**：在历史记录页面查看所有打卡记录
5. **测试邮件**：在设置页面可以发送测试邮件验证配置

## 生产环境部署

### 构建前端

```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist` 目录。

### 运行后端

```bash
cd backend
npm start
```

### 环境变量

生产环境建议使用环境变量配置，不要将 `.env` 文件提交到版本控制。

## 数据库表结构

### checkins 表（打卡记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| checkin_date | DATE | 打卡日期 |
| checkin_time | DATETIME | 打卡时间 |
| created_at | TIMESTAMP | 创建时间 |

### settings 表（系统设置）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| setting_key | VARCHAR(50) | 设置键（唯一） |
| setting_value | TEXT | 设置值 |
| updated_at | TIMESTAMP | 更新时间 |

## 注意事项

- 需要配置有效的MySQL数据库
- 邮件发送功能需要配置有效的SMTP服务
- 建议在生产环境中使用环境变量存储敏感配置
- 确保数据库连接池配置合理（默认连接数：10）

## 许可证

MIT

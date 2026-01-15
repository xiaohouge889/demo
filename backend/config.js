import dotenv from 'dotenv'

dotenv.config()

// 数据库配置
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'checkin_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
}

// 邮件服务配置
export const emailConfig = {
  // 邮件服务提供商 (支持: 'gmail', 'qq', '163', 'outlook', 'yahoo', 'hotmail', 'custom')
  service: process.env.EMAIL_SERVICE || 'gmail',
  
  // SMTP配置（如果使用custom，需要填写以下完整信息）
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  
  // 发件人邮箱和密码/授权码
  user: process.env.EMAIL_USER || 'your-email@gmail.com',
  pass: process.env.EMAIL_PASS || 'your-app-password',
  
  // 发件人名称
  fromName: process.env.EMAIL_FROM_NAME || '打卡系统',
  
  // 邮件发送配置
  sendConfig: {
    timeout: parseInt(process.env.EMAIL_TIMEOUT || '60000'), // 60秒超时
    retryCount: parseInt(process.env.EMAIL_RETRY_COUNT || '3'), // 重试次数
    retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '10000'), // 重试延迟10秒
  },
  
  // 邮件服务提供商默认配置
  serviceDefaults: {
    gmail: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false
    },
    qq: {
      host: 'smtp.qq.com',
      port: 587,
      secure: false
    },
    163: {
      host: 'smtp.163.com',
      port: 465,
      secure: true
    },
    outlook: {
      host: 'smtp.office365.com',
      port: 587,
      secure: false
    },
    yahoo: {
      host: 'smtp.mail.yahoo.com',
      port: 587,
      secure: false
    },
    hotmail: {
      host: 'smtp.live.com',
      port: 587,
      secure: false
    }
  }
}

// 服务器配置
export const serverConfig = {
  port: parseInt(process.env.PORT || '3000'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}

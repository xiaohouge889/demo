import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { serverConfig } from './config.js'
import { testConnection } from './database/connection.js'
import checkInRoutes from './routes/checkin.js'
import settingsRoutes from './routes/settings.js'
import emailRoutes from './routes/email.js'
import { initializeCronJobs } from './services/cron.js'

const app = express()

// 中间件
app.use(cors({
  origin: serverConfig.corsOrigin,
  credentials: true
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// 路由
app.use('/api/checkin', checkInRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/email', emailRoutes)

// 健康检查
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection()
  res.json({ 
    status: 'ok', 
    message: '服务运行正常',
    database: dbConnected ? 'connected' : 'disconnected'
  })
})

// 启动服务器
const PORT = serverConfig.port
app.listen(PORT, async () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
  console.log(`API健康检查: http://localhost:${PORT}/api/health`)
  
  // 测试数据库连接
  try {
    const dbConnected = await testConnection()
    if (!dbConnected) {
      console.warn('⚠️  警告: 数据库未连接，部分功能可能无法使用')
      console.warn('   请配置数据库后重启服务器，或查看 README.md 了解配置方法')
    }
  } catch (error) {
    console.warn('⚠️  警告: 数据库连接测试失败')
    console.warn('   服务器已启动，但数据库相关功能将不可用')
  }
  
  // 初始化定时任务（即使数据库未连接也不阻止启动，静默处理）
  initializeCronJobs().catch(() => {
    // 静默处理错误，不输出日志
  })
})

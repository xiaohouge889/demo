import cron from 'node-cron'
import { settingsService } from './settings.js'
import { emailService } from './email.js'
import { checkInService } from './checkin.js'
import { testConnection } from '../database/connection.js'

let currentJob = null
let jobSettings = null
let lastRunTime = null
let lastRunStatus = null
let lastError = null

// 初始化定时任务
export async function initializeCronJobs() {
  console.log('初始化定时任务...')
  try {
    await updateCronJob()
    console.log('定时任务初始化完成')
  } catch (error) {
    console.warn('定时任务初始化失败:', error.message || error)
  }
}

// 更新定时任务
export async function updateCronJob() {
  console.log('更新定时任务...')
  
  // 停止当前任务
  if (currentJob) {
    console.log('停止当前定时任务...')
    currentJob.stop()
    currentJob = null
  }

  try {
    // 先检查数据库连接，如果未连接则静默返回
    const dbConnected = await testConnection()
    if (!dbConnected) {
      console.log('数据库未连接，定时任务未启动（需要配置数据库）')
      lastRunStatus = 'error'
      lastError = '数据库未连接'
      return
    }

    const settings = await settingsService.getSettings()
    jobSettings = settings
    
    if (!settings.email || !settings.sendTime) {
      console.log('未配置邮箱或发送时间，定时任务未启动')
      lastRunStatus = 'inactive'
      lastError = '未配置邮箱或发送时间'
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(settings.email)) {
      console.log('邮箱格式不正确，定时任务未启动')
      lastRunStatus = 'error'
      lastError = '邮箱格式不正确'
      return
    }

    // 创建cron表达式 (每小时执行一次)
    const cronExpression = '0 * * * *'

    console.log('设置邮件发送定时任务: 每小时检查一次是否超过24小时未打卡')
    console.log(`Cron表达式: ${cronExpression}`)

    // 创建新的定时任务
    currentJob = cron.schedule(cronExpression, async () => {
      await executeCronJob(settings)
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    })

    console.log('定时任务已启动')
    lastRunStatus = 'active'
    lastError = null
  } catch (error) {
    // 数据库连接失败时不阻止服务器启动
    if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('数据库未连接，定时任务未启动（需要配置数据库）')
      lastRunStatus = 'error'
      lastError = '数据库未连接'
    } else {
      console.error('更新定时任务失败:', error.message || error)
      lastRunStatus = 'error'
      lastError = error.message || '未知错误'
    }
  }
}

// 执行定时任务
async function executeCronJob(settings) {
  console.log(`执行定时任务: 检查是否超过24小时未打卡`)
  lastRunTime = new Date()
  lastRunStatus = 'running'
  
  try {
    // 验证数据库连接
    const dbConnected = await testConnection()
    if (!dbConnected) {
      throw new Error('数据库未连接')
    }
    
    // 检查是否超过24小时未打卡
    const isOverdue = await checkInService.isOverdue()
    if (!isOverdue) {
      console.log('未超过24小时未打卡，无需发送邮件')
      lastRunStatus = 'success'
      lastError = null
      return
    }
    
    // 验证邮件配置
    const emailTestResult = await emailService.testEmailConfig()
    if (!emailTestResult.success) {
      throw new Error(`邮件配置无效: ${emailTestResult.error}`)
    }
    
    // 发送邮件提醒
    console.log(`超过24小时未打卡，发送邮件提醒到 ${settings.email}`)
    await emailService.sendOverdueReminder(settings.email)
    
    console.log('定时任务执行成功')
    lastRunStatus = 'success'
    lastError = null
  } catch (error) {
    console.error('定时任务执行失败:', error)
    lastRunStatus = 'error'
    lastError = error.message || '未知错误'
  }
}

// 手动触发定时任务
export async function triggerCronJob() {
  console.log('手动触发定时任务...')
  
  try {
    if (!jobSettings || !jobSettings.email || !jobSettings.sendTime) {
      throw new Error('未配置邮箱或发送时间')
    }
    
    await executeCronJob(jobSettings)
    return { success: true, message: '定时任务已触发' }
  } catch (error) {
    console.error('手动触发定时任务失败:', error)
    return { success: false, message: error.message || '触发失败' }
  }
}

// 获取当前任务状态
export function getCronStatus() {
  return {
    running: currentJob ? currentJob.running : false,
    lastRunTime,
    lastRunStatus,
    lastError,
    settings: jobSettings,
    nextRunTime: currentJob ? getNextRunTime() : null
  }
}

// 获取下次运行时间
function getNextRunTime() {
  if (!currentJob || !jobSettings || !jobSettings.sendTime) {
    return null
  }
  
  // 计算下次运行时间
  const now = new Date()
  const [hours, minutes] = jobSettings.sendTime.split(':').map(Number)
  const nextRun = new Date(now)
  nextRun.setHours(hours, minutes, 0, 0)
  
  // 如果下次运行时间已过，则设置为明天
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1)
  }
  
  return nextRun
}

// 重启定时任务
export async function restartCronJob() {
  console.log('重启定时任务...')
  await updateCronJob()
  return getCronStatus()
}

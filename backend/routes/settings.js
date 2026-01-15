import express from 'express'
import { settingsService } from '../services/settings.js'
import { updateCronJob } from '../services/cron.js'

const router = express.Router()

// 获取设置
router.get('/', async (req, res) => {
  try {
    const settings = await settingsService.getSettings()
    res.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('获取设置失败:', error)
    res.status(500).json({
      success: false,
      message: '获取设置失败: ' + error.message
    })
  }
})

// 更新设置
router.post('/', async (req, res) => {
  try {
    const { email, sendTime } = req.body
    const settings = await settingsService.updateSettings({ email, sendTime })
    
    // 更新定时任务
    updateCronJob()
    
    res.json({
      success: true,
      data: settings,
      message: '设置保存成功'
    })
  } catch (error) {
    console.error('保存设置失败:', error)
    res.status(500).json({
      success: false,
      message: '保存设置失败: ' + error.message
    })
  }
})

// 获取SMTP配置
router.get('/smtp', async (req, res) => {
  try {
    const smtpConfig = await settingsService.getSmtpConfig()
    res.json({
      success: true,
      data: smtpConfig
    })
  } catch (error) {
    console.error('获取SMTP配置失败:', error)
    res.status(500).json({
      success: false,
      message: '获取SMTP配置失败: ' + error.message
    })
  }
})

// 更新SMTP配置
router.post('/smtp', async (req, res) => {
  try {
    const smtpConfig = await settingsService.updateSmtpConfig(req.body)
    res.json({
      success: true,
      data: smtpConfig,
      message: 'SMTP配置保存成功'
    })
  } catch (error) {
    console.error('保存SMTP配置失败:', error)
    res.status(500).json({
      success: false,
      message: '保存SMTP配置失败: ' + error.message
    })
  }
})

export default router

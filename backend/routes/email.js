import express from 'express'
import { emailService } from '../services/email.js'
import { settingsService } from '../services/settings.js'

const router = express.Router()

// 发送测试邮件
router.post('/test', async (req, res) => {
  try {
    const settings = await settingsService.getSettings()
    
    if (!settings.email) {
      return res.status(400).json({
        success: false,
        message: '未设置紧急联系人邮箱'
      })
    }

    await emailService.sendTestEmail(settings.email)
    
    res.json({
      success: true,
      message: '测试邮件发送成功'
    })
  } catch (error) {
    console.error('发送测试邮件失败:', error)
    res.status(500).json({
      success: false,
      message: '发送测试邮件失败: ' + error.message
    })
  }
})

export default router

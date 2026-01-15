import nodemailer from 'nodemailer'
import { emailConfig } from '../config.js'
import { checkInService } from './checkin.js'
import { settingsService } from './settings.js'

// 创建邮件传输器
async function createTransporter() {
  try {
    // 从数据库获取SMTP配置
    const smtpConfig = await settingsService.getSmtpConfig()
    console.log('使用从数据库获取的SMTP配置:', {
      service: smtpConfig.service,
      host: smtpConfig.host,
      port: smtpConfig.port,
      user: smtpConfig.user
    })
    
    // 使用真实的邮件传输器
    const useMockTransporter = false
    
    if (useMockTransporter) {
      console.log('使用模拟邮件传输器')
      return {
        sendMail: async (mailOptions) => {
          console.log('模拟发送邮件:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
          })
          return { messageId: 'simulated-' + Date.now() }
        },
        verify: async () => {
          console.log('模拟验证邮件配置')
          return true
        }
      }
    }
    
    if (smtpConfig.service === 'custom') {
      return nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        },
        timeout: emailConfig.sendConfig.timeout,
        tls: {
          // 允许使用自签名证书
          rejectUnauthorized: false
        }
      })
    } else if (smtpConfig.service === '163') {
      // 对于163邮箱，使用IP地址
      return nodemailer.createTransport({
        host: '220.197.33.205',
        port: 465,
        secure: true,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        },
        timeout: emailConfig.sendConfig.timeout,
        tls: {
          // 允许使用自签名证书，并且指定服务器名称以通过证书验证
          rejectUnauthorized: false,
          servername: 'smtp.163.com'
        }
      })
    } else if (smtpConfig.service === 'qq') {
      // 对于QQ邮箱，使用IP地址
      return nodemailer.createTransport({
        host: '183.57.48.110', // QQ邮箱SMTP服务器IP
        port: 465,
        secure: true,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        },
        timeout: emailConfig.sendConfig.timeout,
        tls: {
          // 允许使用自签名证书，并且指定服务器名称以通过证书验证
          rejectUnauthorized: false,
          servername: 'smtp.qq.com'
        }
      })
    } else {
      // 对于其他内置服务，只设置service和auth参数，使用nodemailer的内置配置
      return nodemailer.createTransport({
        service: smtpConfig.service,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        },
        timeout: emailConfig.sendConfig.timeout,
        tls: {
          // 允许使用自签名证书
          rejectUnauthorized: false
        }
      })
    }
  } catch (error) {
    console.error('获取SMTP配置失败，使用默认配置:', error)
    
    // 使用默认配置
    const config = emailConfig
    
    return nodemailer.createTransport({
      service: config.service,
      auth: {
        user: config.user,
        pass: config.pass
      },
      timeout: config.sendConfig.timeout,
      tls: {
        // 允许使用自签名证书
        rejectUnauthorized: false
      }
    })
  }
}

// 重试发送邮件的辅助函数
async function sendWithRetry(transporter, mailOptions, retryCount = 3, retryDelay = 10000) {
  let lastError
  
  for (let i = 0; i < retryCount; i++) {
    try {
      console.log(`发送邮件尝试 ${i + 1}/${retryCount}...`)
      const info = await transporter.sendMail(mailOptions)
      console.log(`邮件发送成功: ${info.messageId}`)
      return info
    } catch (error) {
      lastError = error
      console.warn(`邮件发送失败 (尝试 ${i + 1}/${retryCount}):`, error.message)
      
      if (i < retryCount - 1) {
        console.log(`等待 ${retryDelay}ms 后重试...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
  }
  
  console.error('邮件发送失败，已达到最大重试次数')
  
  // 直接抛出错误，不使用模拟成功
  throw lastError
}

export const emailService = {
  // 发送测试邮件
  async sendTestEmail(toEmail) {
    try {
      // 获取SMTP配置
      const smtpConfig = await settingsService.getSmtpConfig()
      const transporter = await createTransporter()
      
      const mailOptions = {
        from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
        to: toEmail,
        subject: '打卡系统 - 测试邮件',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">打卡系统测试邮件</h2>
            <p>这是一封测试邮件，如果您收到此邮件，说明邮件配置正确。</p>
            <p>您的紧急联系人邮箱已成功绑定，系统将按照您设置的时间自动发送打卡信息。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">此邮件由打卡系统自动发送</p>
          </div>
        `
      }

      const { retryCount, retryDelay } = emailConfig.sendConfig
      await sendWithRetry(transporter, mailOptions, retryCount, retryDelay)
      console.log(`测试邮件已成功发送到 ${toEmail}`)
      return { success: true, message: '测试邮件发送成功' }
    } catch (error) {
      console.error('发送测试邮件失败:', error)
      throw error
    }
  },

  // 发送打卡日报
  async sendDailyReport(toEmail) {
    try {
      const history = await checkInService.getHistory()
      
      // 获取最近7天的打卡记录
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentCheckIns = history.filter(item => {
        const itemDate = new Date(item.timestamp)
        return itemDate >= sevenDaysAgo
      })

      const checkInCount = recentCheckIns.length
      const todayCheckIn = recentCheckIns.find(item => {
        const itemDate = new Date(item.timestamp)
        const today = new Date()
        return itemDate.toDateString() === today.toDateString()
      })

      // 尝试发送邮件
      try {
        // 获取SMTP配置
        const smtpConfig = await settingsService.getSmtpConfig()
        const transporter = await createTransporter()
        
        const mailOptions = {
          from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
          to: toEmail,
          subject: `打卡日报 - ${new Date().toLocaleDateString('zh-CN')}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4a90e2;">打卡日报</h2>
              <div style="background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">今日状态</h3>
                <p style="font-size: 18px;">
                  ${todayCheckIn ? '✅ 今日已打卡' : '❌ 今日未打卡'}
                </p>
                ${todayCheckIn ? `<p>打卡时间: ${new Date(todayCheckIn.timestamp).toLocaleString('zh-CN')}</p>` : ''}
              </div>
              <div style="background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">最近7天统计</h3>
                <p style="font-size: 18px;">打卡次数: <strong>${checkInCount}</strong></p>
                <p>打卡率: <strong>${Math.round((checkInCount / 7) * 100)}%</strong></p>
              </div>
              ${recentCheckIns.length > 0 ? `
              <div style="margin: 20px 0;">
                <h3>最近打卡记录</h3>
                <table style="width: 100%; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <thead>
                    <tr style="background: #4a90e2; color: white;">
                      <th style="padding: 12px; text-align: left;">日期</th>
                      <th style="padding: 12px; text-align: left;">时间</th>
                      <th style="padding: 12px; text-align: left;">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentCheckIns.slice(0, 7).map(item => `
                      <tr style="border-bottom: 1px solid #eee; transition: background-color 0.2s;">
                        <td style="padding: 12px;">${new Date(item.timestamp).toLocaleDateString('zh-CN')}</td>
                        <td style="padding: 12px;">${new Date(item.timestamp).toLocaleTimeString('zh-CN')}</td>
                        <td style="padding: 12px;"><span style="color: green; font-weight: bold;">✓ 已打卡</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ` : ''}
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">此邮件由打卡系统自动发送</p>
            </div>
          `
        }

        const { retryCount, retryDelay } = emailConfig.sendConfig
        await sendWithRetry(transporter, mailOptions, retryCount, retryDelay)
        console.log(`打卡日报已发送到 ${toEmail}`)
        return true
      } catch (error) {
        console.error('发送打卡日报失败:', error)
        throw error
      }
    } catch (error) {
      console.error('发送打卡日报失败:', error)
      return false
    }
  },
  
  // 检查邮件配置是否有效
  async testEmailConfig() {
    try {
      const transporter = await createTransporter()
      const testResult = await transporter.verify()
      console.log('邮件配置验证成功:', testResult)
      return { success: true, message: '邮件配置验证成功' }
    } catch (error) {
      console.error('邮件配置验证失败:', error)
      
      return { 
        success: false, 
        message: '邮件配置验证失败',
        error: error.message
      }
    }
  },

  // 发送超过24小时未打卡的邮件提醒
  async sendOverdueReminder(toEmail) {
    try {
      // 获取SMTP配置
      const smtpConfig = await settingsService.getSmtpConfig()
      const transporter = await createTransporter()
      
      const mailOptions = {
        from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
        to: toEmail,
        subject: '打卡系统 - 未打卡提醒',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">打卡系统 - 未打卡提醒</h2>
            <p>⚠️ <strong>重要提醒：您已经超过24小时未打卡</strong></p>
            <p>请及时登录打卡系统进行打卡，以确保您的打卡记录完整。</p>
            <p>如果您已经打卡，请忽略此邮件。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">此邮件由打卡系统自动发送</p>
          </div>
        `
      }

      const { retryCount, retryDelay } = emailConfig.sendConfig
      await sendWithRetry(transporter, mailOptions, retryCount, retryDelay)
      console.log(`未打卡提醒邮件已成功发送到 ${toEmail}`)
      return { success: true, message: '未打卡提醒邮件发送成功' }
    } catch (error) {
      console.error('发送未打卡提醒邮件失败:', error)
      throw error
    }
  }
}

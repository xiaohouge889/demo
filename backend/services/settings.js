import { query, testConnection } from '../database/connection.js'

export const settingsService = {
  // 获取设置
  async getSettings() {
    // 如果数据库未连接，从内存中获取设置
    const dbConnected = await testConnection()
    if (!dbConnected) {
      return {
        email: this.memorySettings.emergency_email,
        sendTime: this.memorySettings.email_send_time
      }
    }

    try {
      const sql = `
        SELECT setting_key, setting_value
        FROM settings
        WHERE setting_key IN ('emergency_email', 'email_send_time')
      `
      
      const results = await query(sql)
      const settings = {
        email: this.memorySettings.emergency_email,
        sendTime: this.memorySettings.email_send_time
      }
      
      results.forEach(row => {
        if (row.setting_key === 'emergency_email') {
          settings.email = row.setting_value || ''
          // 更新内存中的设置
          this.memorySettings.emergency_email = settings.email
        } else if (row.setting_key === 'email_send_time') {
          settings.sendTime = row.setting_value || '09:00'
          // 更新内存中的设置
          this.memorySettings.email_send_time = settings.sendTime
        }
      })
      
      return settings
    } catch (error) {
      // 数据库查询失败时从内存中获取设置
      return {
        email: this.memorySettings.emergency_email,
        sendTime: this.memorySettings.email_send_time
      }
    }
  },



  // 获取SMTP配置
  async getSmtpConfig() {
    // 如果数据库未连接，从内存中获取设置
    const dbConnected = await testConnection()
    if (!dbConnected) {
      return {
        service: this.memorySettings.smtp_service,
        host: this.memorySettings.smtp_host,
        port: parseInt(this.memorySettings.smtp_port),
        secure: this.memorySettings.smtp_secure === 'true',
        user: this.memorySettings.smtp_user,
        pass: this.memorySettings.smtp_pass,
        fromName: this.memorySettings.smtp_from_name
      }
    }

    try {
      const sql = `
        SELECT setting_key, setting_value
        FROM settings
        WHERE setting_key IN (
          'smtp_service', 'smtp_host', 'smtp_port', 'smtp_secure', 
          'smtp_user', 'smtp_pass', 'smtp_from_name'
        )
      `
      
      const results = await query(sql)
      const config = {
        service: this.memorySettings.smtp_service,
        host: this.memorySettings.smtp_host,
        port: parseInt(this.memorySettings.smtp_port),
        secure: this.memorySettings.smtp_secure === 'true',
        user: this.memorySettings.smtp_user,
        pass: this.memorySettings.smtp_pass,
        fromName: this.memorySettings.smtp_from_name
      }
      
      results.forEach(row => {
        switch (row.setting_key) {
          case 'smtp_service':
            config.service = row.setting_value || 'gmail'
            // 更新内存中的设置
            this.memorySettings.smtp_service = config.service
            break
          case 'smtp_host':
            config.host = row.setting_value || 'smtp.gmail.com'
            // 更新内存中的设置
            this.memorySettings.smtp_host = config.host
            break
          case 'smtp_port':
            config.port = parseInt(row.setting_value) || 587
            // 更新内存中的设置
            this.memorySettings.smtp_port = config.port.toString()
            break
          case 'smtp_secure':
            config.secure = row.setting_value === 'true'
            // 更新内存中的设置
            this.memorySettings.smtp_secure = config.secure ? 'true' : 'false'
            break
          case 'smtp_user':
            config.user = row.setting_value || ''
            // 更新内存中的设置
            this.memorySettings.smtp_user = config.user
            break
          case 'smtp_pass':
            config.pass = row.setting_value || ''
            // 更新内存中的设置
            this.memorySettings.smtp_pass = config.pass
            break
          case 'smtp_from_name':
            config.fromName = row.setting_value || '打卡系统'
            // 更新内存中的设置
            this.memorySettings.smtp_from_name = config.fromName
            break
        }
      })
      
      return config
    } catch (error) {
      // 数据库查询失败时从内存中获取设置
      return {
        service: this.memorySettings.smtp_service,
        host: this.memorySettings.smtp_host,
        port: parseInt(this.memorySettings.smtp_port),
        secure: this.memorySettings.smtp_secure === 'true',
        user: this.memorySettings.smtp_user,
        pass: this.memorySettings.smtp_pass,
        fromName: this.memorySettings.smtp_from_name
      }
    }
  },

  // 内存中的设置缓存（当数据库连接失败时使用）
  memorySettings: {
    emergency_email: '',
    email_send_time: '09:00',
    smtp_service: 'gmail',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_secure: 'false',
    smtp_user: '',
    smtp_pass: '',
    smtp_from_name: '打卡系统'
  },

  // 更新设置
  async updateSettings(newSettings) {
    // 如果数据库未连接，保存到内存中
    const dbConnected = await testConnection()
    if (!dbConnected) {
      if (newSettings.email !== undefined) {
        this.memorySettings.emergency_email = newSettings.email
      }
      if (newSettings.sendTime !== undefined) {
        this.memorySettings.email_send_time = newSettings.sendTime
      }
      return {
        email: this.memorySettings.emergency_email,
        sendTime: this.memorySettings.email_send_time
      }
    }

    if (newSettings.email !== undefined) {
      await query(
        `INSERT INTO settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        ['emergency_email', newSettings.email, newSettings.email]
      )
    }
    
    if (newSettings.sendTime !== undefined) {
      await query(
        `INSERT INTO settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        ['email_send_time', newSettings.sendTime, newSettings.sendTime]
      )
    }
    
    return await this.getSettings()
  },

  // 更新SMTP配置
  async updateSmtpConfig(newConfig) {
    const settingsToUpdate = [
      { key: 'smtp_service', value: newConfig.service || 'gmail' },
      { key: 'smtp_host', value: newConfig.host || 'smtp.gmail.com' },
      { key: 'smtp_port', value: newConfig.port || 587 },
      { key: 'smtp_secure', value: newConfig.secure ? 'true' : 'false' },
      { key: 'smtp_user', value: newConfig.user || '' },
      { key: 'smtp_pass', value: newConfig.pass || '' },
      { key: 'smtp_from_name', value: newConfig.fromName || '打卡系统' }
    ]

    // 如果数据库未连接，保存到内存中
    const dbConnected = await testConnection()
    if (!dbConnected) {
      for (const setting of settingsToUpdate) {
        this.memorySettings[setting.key] = setting.value
      }
      return await this.getSmtpConfig()
    }

    for (const setting of settingsToUpdate) {
      await query(
        `INSERT INTO settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [setting.key, setting.value, setting.value]
      )
    }
    
    return await this.getSmtpConfig()
  }
}

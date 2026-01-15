import React, { useState, useEffect } from 'react'
import { getSettings, updateSettings, testEmail, getSmtpConfig, updateSmtpConfig } from '../utils/api'
import './Settings.css'

function Settings() {
  const [email, setEmail] = useState('')
  const [sendTime, setSendTime] = useState('09:00')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [syncStatus, setSyncStatus] = useState('')
  
  // SMTP配置状态
  const [smtpConfig, setSmtpConfig] = useState({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: '打卡系统'
  })
  const [showSmtpConfig, setShowSmtpConfig] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      // 先从本地存储加载设置（快速显示）
      const savedEmail = localStorage.getItem('emergency_email')
      const savedTime = localStorage.getItem('email_send_time')
      
      if (savedEmail) setEmail(savedEmail)
      if (savedTime) setSendTime(savedTime)

      // 然后从后端加载最新设置（同步数据）
      try {
        const response = await getSettings()
        // 确保正确处理API返回的数据格式
        const backendSettings = response.data || response
        if (backendSettings.email) setEmail(backendSettings.email)
        if (backendSettings.sendTime) setSendTime(backendSettings.sendTime)
        
        // 将后端设置同步到本地存储
        if (backendSettings.email) {
          localStorage.setItem('emergency_email', backendSettings.email)
        } else {
          localStorage.removeItem('emergency_email')
        }
        if (backendSettings.sendTime) {
          localStorage.setItem('email_send_time', backendSettings.sendTime)
        }
        
        setSyncStatus('已与服务器同步')
        setTimeout(() => setSyncStatus(''), 2000)
      } catch (err) {
        console.log('从后端加载设置失败，使用本地设置')
        setSyncStatus('使用本地设置')
        setTimeout(() => setSyncStatus(''), 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadSmtpConfig = async () => {
    setIsLoading(true)
    try {
      // 从后端加载SMTP配置
      try {
        const response = await getSmtpConfig()
        // 确保正确处理API返回的数据格式
        const config = response.data || response
        // 确保config对象包含所有必要的属性
        setSmtpConfig({
          service: config.service || 'gmail',
          host: config.host || 'smtp.gmail.com',
          port: config.port || 587,
          secure: config.secure || false,
          user: config.user || '',
          pass: config.pass || '',
          fromName: config.fromName || '打卡系统'
        })
        
        // 将配置同步到本地存储
        localStorage.setItem('smtp_config', JSON.stringify({
          service: config.service || 'gmail',
          host: config.host || 'smtp.gmail.com',
          port: config.port || 587,
          secure: config.secure || false,
          user: config.user || '',
          pass: config.pass || '',
          fromName: config.fromName || '打卡系统'
        }))
        
        setSyncStatus('SMTP配置已与服务器同步')
        setTimeout(() => setSyncStatus(''), 2000)
      } catch (err) {
        console.log('从后端加载SMTP配置失败，使用本地配置')
        
        // 尝试从本地存储加载
        const savedConfig = localStorage.getItem('smtp_config')
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig)
          // 确保parsedConfig对象包含所有必要的属性
          setSmtpConfig({
            service: parsedConfig.service || 'gmail',
            host: parsedConfig.host || 'smtp.gmail.com',
            port: parsedConfig.port || 587,
            secure: parsedConfig.secure || false,
            user: parsedConfig.user || '',
            pass: parsedConfig.pass || '',
            fromName: parsedConfig.fromName || '打卡系统'
          })
        }
        
        setSyncStatus('使用本地SMTP配置')
        setTimeout(() => setSyncStatus(''), 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
      showMessage('请输入有效的邮箱地址', 'error')
      return
    }

    // 验证时间格式
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(sendTime)) {
      showMessage('请输入有效的时间格式 (HH:mm)', 'error')
      return
    }

    setIsLoading(true)
    setSyncStatus('正在同步...')

    try {
      // 先保存到本地存储（确保本地数据最新）
      if (email) {
        localStorage.setItem('emergency_email', email)
      } else {
        localStorage.removeItem('emergency_email')
      }
      localStorage.setItem('email_send_time', sendTime)

      // 然后保存到后端
      await updateSettings({ email, sendTime })
      
      showMessage('设置保存成功！', 'success')
      setSyncStatus('已同步到服务器')
      setTimeout(() => setSyncStatus(''), 2000)
    } catch (error) {
      console.error('保存设置失败:', error)
      showMessage(`保存失败: ${error.message || '请检查网络连接'}`, 'error')
      setSyncStatus('同步失败，已保存到本地')
      setTimeout(() => setSyncStatus(''), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSmtpConfig = async () => {
    // 验证SMTP配置
    if (!smtpConfig.service) {
      showMessage('请选择邮件服务提供商', 'error')
      return
    }

    if (!smtpConfig.user) {
      showMessage('请输入发件人邮箱', 'error')
      return
    }

    if (!smtpConfig.pass) {
      showMessage('请输入邮箱密码/授权码', 'error')
      return
    }

    setIsLoading(true)
    setSyncStatus('正在同步SMTP配置...')

    try {
      // 先保存到本地存储（确保本地数据最新）
      localStorage.setItem('smtp_config', JSON.stringify(smtpConfig))

      // 然后保存到后端
      await updateSmtpConfig(smtpConfig)
      
      showMessage('SMTP配置保存成功！', 'success')
      setSyncStatus('SMTP配置已同步到服务器')
      setTimeout(() => setSyncStatus(''), 2000)
    } catch (error) {
      console.error('保存SMTP配置失败:', error)
      showMessage(`保存SMTP配置失败: ${error.message || '请检查网络连接'}`, 'error')
      setSyncStatus('同步失败，已保存到本地')
      setTimeout(() => setSyncStatus(''), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestEmail = async () => {
    if (!email) {
      showMessage('请先设置紧急联系人邮箱', 'error')
      return
    }

    setIsLoading(true)
    try {
      // 先保存设置到后端数据库，确保后端有最新的邮箱配置
      await updateSettings({ email, sendTime })
      // 然后发送测试邮件
      await testEmail()
      showMessage('测试邮件发送成功！请检查邮箱', 'success')
    } catch (error) {
      console.error('发送测试邮件失败:', error)
      showMessage(`发送测试邮件失败: ${error.message || '请检查邮件配置'}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const showMessage = (msg, type) => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 3000)
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>设置</h1>
        {syncStatus && (
          <div className="sync-status">{syncStatus}</div>
        )}
      </div>

      {message && (
        <div className={`settings-message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="settings-section">
        <h2 className="section-title">紧急联系人</h2>
        <div className="setting-item">
          <label className="setting-label">
            <span className="label-text">紧急联系人邮箱</span>
            <span className="label-hint">打卡信息将发送到此邮箱</span>
          </label>
          <input
            type="email"
            className="setting-input"
            placeholder="请输入邮箱地址，如：contact@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-title">邮件发送设置</h2>
        <div className="setting-item">
          <label className="setting-label">
            <span className="label-text">每日发送时间</span>
            <span className="label-hint">设置每日自动发送打卡邮件的时间（24小时制）</span>
          </label>
          <input
            type="time"
            className="setting-input"
            value={sendTime}
            onChange={(e) => setSendTime(e.target.value)}
          />
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-title">SMTP邮件服务器配置</h2>
        <button
          className="action-button secondary"
          onClick={() => setShowSmtpConfig(!showSmtpConfig)}
          disabled={isLoading}
        >
          {showSmtpConfig ? '隐藏配置' : '显示配置'}
        </button>
        
        {showSmtpConfig && (
          <div className="smtp-config-form">
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">邮件服务提供商</span>
                <span className="label-hint">选择您使用的邮件服务</span>
              </label>
              <select
                className="setting-input"
                value={smtpConfig.service}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, service: e.target.value })}
              >
                <option value="gmail">Gmail</option>
                <option value="qq">QQ邮箱</option>
                <option value="163">163邮箱</option>
                <option value="outlook">Outlook</option>
                <option value="yahoo">Yahoo</option>
                <option value="hotmail">Hotmail</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">SMTP主机</span>
                <span className="label-hint">SMTP服务器地址</span>
              </label>
              <input
                type="text"
                className="setting-input"
                placeholder="例如: smtp.gmail.com"
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
              />
            </div>
            
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">SMTP端口</span>
                <span className="label-hint">SMTP服务器端口</span>
              </label>
              <input
                type="number"
                className="setting-input"
                placeholder="例如: 587"
                value={smtpConfig.port}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) || 587 })}
              />
            </div>
            
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">使用SSL</span>
                <span className="label-hint">是否使用安全连接</span>
              </label>
              <input
                type="checkbox"
                className="setting-checkbox"
                checked={smtpConfig.secure}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
              />
            </div>
            
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">发件人邮箱</span>
                <span className="label-hint">用于发送邮件的邮箱地址</span>
              </label>
              <input
                type="email"
                className="setting-input"
                placeholder="例如: your-email@gmail.com"
                value={smtpConfig.user}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
              />
            </div>
            
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">邮箱密码/授权码</span>
                <span className="label-hint">用于登录SMTP服务器的密码或授权码</span>
              </label>
              <input
                type="password"
                className="setting-input"
                placeholder="请输入密码或授权码"
                value={smtpConfig.pass}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
              />
            </div>
            
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">发件人名称</span>
                <span className="label-hint">显示在邮件发件人字段中的名称</span>
              </label>
              <input
                type="text"
                className="setting-input"
                placeholder="例如: 打卡系统"
                value={smtpConfig.fromName}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
              />
            </div>
            
            <div className="smtp-config-actions">
              <button
                className="action-button primary"
                onClick={handleSaveSmtpConfig}
                disabled={isLoading}
              >
                {isLoading ? '保存中...' : '保存SMTP配置'}
              </button>
              <button
                className="action-button tertiary"
                onClick={loadSmtpConfig}
                disabled={isLoading}
              >
                同步SMTP配置
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="settings-actions">
        <button
          className="action-button primary"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? '保存中...' : '保存设置'}
        </button>
        <button
          className="action-button secondary"
          onClick={handleTestEmail}
          disabled={isLoading || !email}
        >
          发送测试邮件
        </button>
        <button
          className="action-button tertiary"
          onClick={loadSettings}
          disabled={isLoading}
        >
          同步设置
        </button>
      </div>

      <div className="settings-info">
        <h3 className="info-title">使用说明</h3>
        <ul className="info-list">
          <li><strong>打卡功能</strong>：点击首页的"打卡"按钮即可完成每日打卡，系统会自动记录打卡时间</li>
          <li><strong>邮件提醒</strong>：设置紧急联系人邮箱后，系统会每小时检查一次是否超过24小时未打卡，如超过则自动发送邮件提醒</li>
          <li><strong>SMTP配置</strong>：可根据您的邮件服务提供商配置对应的SMTP服务器，支持Gmail、QQ邮箱、163邮箱等主流邮件服务</li>
          <li><strong>测试邮件</strong>：通过"发送测试邮件"功能验证邮箱配置是否正确，确保邮件能够正常发送</li>
          <li><strong>数据安全</strong>：所有设置会同时保存到本地和服务器，确保数据安全可靠</li>
          <li><strong>健康检查</strong>：系统会定期检查数据库连接和邮件配置，确保各项功能正常运行</li>
        </ul>
      </div>
    </div>
  )
}

export default Settings

import React, { useState, useEffect } from 'react'
import { checkIn, getTodayCheckIn, getWeekStats } from '../utils/api'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import './Home.css'

dayjs.locale('zh-cn')

function Home() {
  const [todayCheckIn, setTodayCheckIn] = useState(null)
  const [weekCount, setWeekCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // 加载今日打卡状态
      const todayResponse = await getTodayCheckIn()
      if (todayResponse.success && todayResponse.data) {
        setTodayCheckIn(todayResponse.data)
      } else {
        setTodayCheckIn(null)
      }

      // 加载本周统计
      const statsResponse = await getWeekStats()
      if (statsResponse.success) {
        setWeekCount(statsResponse.data.count)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const handleCheckIn = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      const response = await checkIn()
      if (response.success) {
        setTodayCheckIn(response.data)
        setWeekCount(prev => prev + 1)
        setMessage('打卡成功！')
        
        setTimeout(() => {
          setMessage('')
        }, 3000)
      } else {
        setMessage(response.message || '打卡失败，请重试')
      }
    } catch (error) {
      console.error('打卡失败:', error)
      setMessage(error.message || '打卡失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="home">
      <div className="home-header">
        <h1>每日打卡</h1>
        <p className="current-date">{dayjs().format('YYYY年MM月DD日 dddd')}</p>
      </div>

      <div className="checkin-card">
        {todayCheckIn ? (
          <div className="checkin-success">
            <div className="success-icon">✅</div>
            <h2>今日已打卡</h2>
            <p className="checkin-time">
              打卡时间：{dayjs(todayCheckIn.time).format('HH:mm:ss')}
            </p>
            <p className="checkin-status">状态：已完成</p>
          </div>
        ) : (
          <div className="checkin-pending">
            <div className="pending-icon">⏰</div>
            <h2>今日未打卡</h2>
            <p className="checkin-hint">点击下方按钮完成打卡</p>
          </div>
        )}

        {message && (
          <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <button
          className="checkin-button"
          onClick={handleCheckIn}
          disabled={isLoading || todayCheckIn}
        >
          {isLoading ? '打卡中...' : todayCheckIn ? '今日已打卡' : '立即打卡'}
        </button>
      </div>

      <div className="stats-card">
        <h3>本周统计</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{weekCount}</div>
            <div className="stat-label">本周打卡</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{todayCheckIn ? '✓' : '✗'}</div>
            <div className="stat-label">今日状态</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

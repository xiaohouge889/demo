import React, { useState, useEffect } from 'react'
import { getCheckInHistory } from '../utils/api'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import './History.css'

dayjs.locale('zh-cn')

function History() {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setIsLoading(true)
      const response = await getCheckInHistory(100)
      if (response.success) {
        setHistory(response.data || [])
      }
    } catch (error) {
      console.error('加载历史失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="history">
      <div className="history-header">
        <h1>打卡历史</h1>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>暂无打卡记录</p>
          <p className="empty-hint">开始打卡后，记录会显示在这里</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-item-left">
                <div className="history-date">
                  {dayjs(item.date).format('YYYY年MM月DD日')}
                </div>
                <div className="history-time">
                  {dayjs(item.time).format('HH:mm:ss')}
                </div>
              </div>
              <div className="history-item-right">
                <div className="history-day">
                  {dayjs(item.date).format('dddd')}
                </div>
                <div className="history-status">
                  <span className="status-badge">✓ 已打卡</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default History

import { query } from '../database/connection.js'

export const checkInService = {
  // 创建打卡记录
  async createCheckIn() {
    const now = new Date()
    const checkinDate = now.toISOString().split('T')[0]
    const checkinTime = now.toISOString().slice(0, 19).replace('T', ' ')

    const sql = `
      INSERT INTO checkins (checkin_date, checkin_time)
      VALUES (?, ?)
    `
    
    const result = await query(sql, [checkinDate, checkinTime])
    
    return {
      id: result.insertId,
      date: checkinDate,
      time: checkinTime,
      timestamp: now.getTime()
    }
  },

  // 获取打卡历史
  async getHistory(limit = 100) {
    // 确保 limit 是整数（防止 SQL 注入）
    const limitNum = parseInt(limit) || 100
    const sql = `
      SELECT 
        id,
        checkin_date as date,
        checkin_time as time,
        UNIX_TIMESTAMP(checkin_time) * 1000 as timestamp
      FROM checkins
      ORDER BY checkin_time DESC
      LIMIT ${limitNum}
    `
    
    const results = await query(sql)
    return results.map(row => ({
      id: row.id,
      date: row.date.toISOString().split('T')[0],
      time: row.time.toISOString(),
      timestamp: parseInt(row.timestamp)
    }))
  },

  // 获取今日打卡记录
  async getTodayCheckIn() {
    const today = new Date().toISOString().split('T')[0]
    const sql = `
      SELECT 
        id,
        checkin_date as date,
        checkin_time as time,
        UNIX_TIMESTAMP(checkin_time) * 1000 as timestamp
      FROM checkins
      WHERE checkin_date = ?
      ORDER BY checkin_time DESC
      LIMIT 1
    `
    
    const results = await query(sql, [today])
    if (results.length === 0) {
      return null
    }
    
    const row = results[0]
    return {
      id: row.id,
      date: row.date.toISOString().split('T')[0],
      time: row.time.toISOString(),
      timestamp: parseInt(row.timestamp)
    }
  },

  // 获取本周打卡次数
  async getWeekCheckInCount() {
    const sql = `
      SELECT COUNT(*) as count
      FROM checkins
      WHERE YEARWEEK(checkin_date, 1) = YEARWEEK(CURDATE(), 1)
    `
    
    const results = await query(sql)
    return results[0].count
  },

  // 检查是否超过24小时未打卡
  async isOverdue() {
    const sql = `
      SELECT 
        checkin_time
      FROM checkins
      ORDER BY checkin_time DESC
      LIMIT 1
    `
    
    const results = await query(sql)
    if (results.length === 0) {
      // 没有打卡记录，视为未打卡
      return true
    }
    
    const lastCheckInTime = new Date(results[0].checkin_time)
    const now = new Date()
    const diffHours = (now - lastCheckInTime) / (1000 * 60 * 60)
    
    return diffHours > 24
  }
}

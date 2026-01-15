import express from 'express'
import { checkInService } from '../services/checkin.js'

const router = express.Router()

// 打卡
router.post('/', async (req, res) => {
  try {
    const checkInData = await checkInService.createCheckIn()
    res.json({
      success: true,
      data: checkInData,
      message: '打卡成功'
    })
  } catch (error) {
    console.error('打卡失败:', error)
    res.status(500).json({
      success: false,
      message: '打卡失败: ' + error.message
    })
  }
})

// 获取今日打卡
router.get('/today', async (req, res) => {
  try {
    const todayCheckIn = await checkInService.getTodayCheckIn()
    res.json({
      success: true,
      data: todayCheckIn
    })
  } catch (error) {
    if (error.code === 'ER_BAD_DB_ERROR') {
      res.status(500).json({
        success: false,
        message: '数据库未初始化，请运行: cd backend && npm run init-db'
      })
    } else {
      console.error('获取今日打卡失败:', error.message || error)
      res.status(500).json({
        success: false,
        message: '获取今日打卡失败: ' + error.message
      })
    }
  }
})

// 获取打卡历史
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100
    const history = await checkInService.getHistory(limit)
    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('获取历史失败:', error)
    res.status(500).json({
      success: false,
      message: '获取历史失败: ' + error.message
    })
  }
})

// 获取本周统计
router.get('/stats/week', async (req, res) => {
  try {
    const count = await checkInService.getWeekCheckInCount()
    res.json({
      success: true,
      data: { count }
    })
  } catch (error) {
    console.error('获取统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取统计失败: ' + error.message
    })
  }
})

export default router

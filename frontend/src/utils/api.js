import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加认证token等
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    // 统一处理响应数据
    return response.data
  },
  error => {
    console.error('API请求错误:', error)
    
    // 统一处理错误
    let errorMessage = '网络请求失败'
    let errorCode = 'NETWORK_ERROR'
    
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          errorMessage = data.message || '请求参数错误'
          errorCode = 'BAD_REQUEST'
          break
        case 401:
          errorMessage = '未授权，请重新登录'
          errorCode = 'UNAUTHORIZED'
          break
        case 403:
          errorMessage = '拒绝访问'
          errorCode = 'FORBIDDEN'
          break
        case 404:
          errorMessage = '请求的资源不存在'
          errorCode = 'NOT_FOUND'
          break
        case 500:
          errorMessage = data.message || '服务器内部错误'
          errorCode = 'INTERNAL_ERROR'
          break
        default:
          errorMessage = data.message || `请求失败 (${status})`
          errorCode = 'UNKNOWN_ERROR'
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = '服务器无响应，请检查网络连接'
      errorCode = 'NO_RESPONSE'
    } else {
      // 请求配置出错
      errorMessage = error.message || '请求配置错误'
      errorCode = 'CONFIG_ERROR'
    }
    
    // 创建标准化的错误对象
    const standardizedError = {
      message: errorMessage,
      code: errorCode,
      originalError: error
    }
    
    return Promise.reject(standardizedError)
  }
)

// 通用请求方法，带重试机制
async function requestWithRetry(config, retryCount = 2, retryDelay = 1000) {
  let lastError
  
  for (let i = 0; i <= retryCount; i++) {
    try {
      return await api(config)
    } catch (error) {
      lastError = error
      
      // 只对网络错误进行重试
      if (i < retryCount && (error.code === 'NETWORK_ERROR' || error.code === 'NO_RESPONSE')) {
        console.log(`请求失败，${retryDelay}ms后重试 (${i + 1}/${retryCount})...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      } else {
        throw error
      }
    }
  }
  
  throw lastError
}

// 打卡相关API
export const checkIn = async () => {
  return await requestWithRetry({ method: 'post', url: '/checkin' })
}

export const getTodayCheckIn = async () => {
  return await requestWithRetry({ method: 'get', url: '/checkin/today' })
}

export const getCheckInHistory = async (limit) => {
  return await requestWithRetry({ 
    method: 'get', 
    url: '/checkin/history', 
    params: { limit } 
  })
}

export const getWeekStats = async () => {
  return await requestWithRetry({ method: 'get', url: '/checkin/stats/week' })
}

// 设置相关API
export const getSettings = async () => {
  return await requestWithRetry({ method: 'get', url: '/settings' })
}

export const updateSettings = async (settings) => {
  return await requestWithRetry({ 
    method: 'post', 
    url: '/settings', 
    data: settings 
  })
}

// SMTP配置相关API
export const getSmtpConfig = async () => {
  return await requestWithRetry({ method: 'get', url: '/settings/smtp' })
}

export const updateSmtpConfig = async (config) => {
  return await requestWithRetry({ 
    method: 'post', 
    url: '/settings/smtp', 
    data: config 
  })
}

// 邮件测试
export const testEmail = async () => {
  return await requestWithRetry({ method: 'post', url: '/email/test' })
}

// 健康检查
export const healthCheck = async () => {
  return await requestWithRetry({ method: 'get', url: '/health' })
}

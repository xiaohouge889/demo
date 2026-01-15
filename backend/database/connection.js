import mysql from 'mysql2/promise'
import { dbConfig } from '../config.js'

// 创建连接池
const pool = mysql.createPool(dbConfig)

// 连接池状态
let poolStatus = {
  created: new Date(),
  lastChecked: null,
  isHealthy: false,
  errorCount: 0,
  totalQueries: 0,
  failedQueries: 0
}

// 测试数据库连接
export async function testConnection() {
  poolStatus.lastChecked = new Date()
  
  try {
    const connection = await pool.getConnection()
    connection.release()
    poolStatus.isHealthy = true
    poolStatus.errorCount = 0
    return true
  } catch (error) {
    poolStatus.isHealthy = false
    poolStatus.errorCount++
    console.warn('数据库连接测试失败:', error.message || error)
    return false
  }
}

// 执行查询（带重试机制）
export async function query(sql, params = [], retryCount = 2, retryDelay = 1000) {
  poolStatus.totalQueries++
  let lastError
  
  for (let i = 0; i <= retryCount; i++) {
    try {
      // 检查连接池状态
      if (!poolStatus.isHealthy && i === 0) {
        console.log('连接池状态异常，尝试重新连接...')
        const connected = await testConnection()
        if (!connected) {
          throw new Error('数据库连接失败')
        }
      }
      
      const [results] = await pool.execute(sql, params)
      return results
    } catch (error) {
      lastError = error
      
      // 只对临时连接错误进行重试
      if (i < retryCount && (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ETIMEDOUT')) {
        console.log(`数据库查询失败，${retryDelay}ms后重试 (${i + 1}/${retryCount})...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      } else {
        // 数据库不存在的错误已经在API层处理，这里不输出错误日志
        if (error.code === 'ER_BAD_DB_ERROR') {
          // 静默处理，由API层返回友好错误信息
        } else if (error.code !== 'ECONNREFUSED' && error.code !== 'ER_ACCESS_DENIED_ERROR') {
          // 其他错误才输出日志
          console.error('数据库查询错误:', {
            message: error.message || error,
            code: error.code,
            sql: sql.substring(0, 200) // 只输出前200个字符
          })
        }
        
        poolStatus.failedQueries++
        poolStatus.isHealthy = false
        throw error
      }
    }
  }
  
  throw lastError
}

// 获取连接（用于事务）
export async function getConnection() {
  try {
    // 检查连接池状态
    if (!poolStatus.isHealthy) {
      console.log('连接池状态异常，尝试重新连接...')
      await testConnection()
    }
    
    const connection = await pool.getConnection()
    return connection
  } catch (error) {
    console.error('获取数据库连接失败:', error)
    throw error
  }
}

// 执行事务
export async function transaction(callback) {
  let connection = null
  
  try {
    connection = await getConnection()
    await connection.beginTransaction()
    
    const result = await callback(connection)
    
    await connection.commit()
    return result
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error('事务回滚失败:', rollbackError)
      }
    }
    console.error('事务执行失败:', error)
    throw error
  } finally {
    if (connection) {
      try {
        connection.release()
      } catch (releaseError) {
        console.error('连接释放失败:', releaseError)
      }
    }
  }
}

// 获取连接池状态
export function getPoolStatus() {
  return {
    ...poolStatus,
    poolStats: {
      size: pool.poolSize,
      pendingConnections: pool._pendingConnections.length,
      connectionLimit: dbConfig.connectionLimit
    }
  }
}

// 定期检查连接池健康状态
async function checkPoolHealth() {
  await testConnection()
  console.log('连接池健康检查:', poolStatus.isHealthy ? '健康' : '异常')
}

// 每5分钟检查一次连接池健康状态
setInterval(checkPoolHealth, 5 * 60 * 1000)

// 初始化时检查连接池健康状态
testConnection().then(() => {
  console.log('数据库连接池初始化完成，状态:', poolStatus.isHealthy ? '健康' : '异常')
})

export default pool

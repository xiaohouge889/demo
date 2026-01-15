import mysql from 'mysql2/promise'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { dbConfig } from '../config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function initDatabase() {
  let connection
  
  try {
    // 连接到MySQL服务器（不指定数据库）
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    })

    console.log('已连接到MySQL服务器')

    // 读取SQL文件
    const sqlFile = join(__dirname, 'init.sql')
    const sql = readFileSync(sqlFile, 'utf-8')

    // 执行SQL语句
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement)
      }
    }

    console.log('数据库初始化成功！')
    console.log(`数据库名称: ${dbConfig.database}`)
    console.log('已创建表: checkins, settings')
  } catch (error) {
    console.error('数据库初始化失败:', error.message)
    throw error
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// 如果直接运行此文件，执行初始化
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase()
    .then(() => {
      console.log('初始化完成')
      process.exit(0)
    })
    .catch(error => {
      console.error('初始化失败:', error)
      process.exit(1)
    })
}

export { initDatabase }

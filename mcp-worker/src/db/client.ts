import mysql from 'mysql2/promise'
import 'dotenv/config'

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  idleTimeout: 30000,
})

export interface QueryResult<T> {
  rows: T[]
}

export async function query<T>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const [rows] = await pool.execute(text, params)
  return { rows: rows as T[] }
}

export { pool }

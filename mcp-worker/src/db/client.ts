import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
})

export interface QueryResult<T> {
  rows: T[]
}

export async function query<T>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const result = await pool.query(text, params)
  return { rows: result.rows as T[] }
}

export { pool }

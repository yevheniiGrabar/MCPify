import 'dotenv/config'
import Fastify from 'fastify'
import { handleMcpRequest } from './mcp/handler'

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

// Health check
fastify.get('/health', async (_request, reply) => {
  await reply.send({ status: 'ok', timestamp: new Date().toISOString() })
})

// MCP endpoint (stub)
fastify.get<{ Params: { token: string } }>(
  '/mcp/:token',
  async (request, reply) => {
    await handleMcpRequest(request, reply)
  }
)

// 404 handler
fastify.setNotFoundHandler((_request, reply) => {
  void reply.status(404).send({ error: 'Not found' })
})

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '0.0.0.0'

fastify.listen({ port, host }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`MCP Worker running at http://localhost:${port}`)
})

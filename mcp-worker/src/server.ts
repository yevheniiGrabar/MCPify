import 'dotenv/config'
import Fastify from 'fastify'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { getServiceByToken } from './db/queries.js'
import { createMcpServer } from './mcp/handler.js'
import { checkRateLimit } from './middleware/rateLimit.js'

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

// Health check
fastify.get('/health', async (_request, reply) => {
  await reply.send({ status: 'ok', timestamp: new Date().toISOString() })
})

// MCP Streamable HTTP endpoint — handles POST, GET (SSE), and DELETE
fastify.all<{ Params: { token: string } }>(
  '/mcp/:token',
  {
    config: {
      rawBody: true,
    },
  },
  async (request, reply) => {
    const { token } = request.params

    // Rate limit per token
    const rateCheck = checkRateLimit(token)
    if (!rateCheck.allowed) {
      return reply.status(429).send({
        error: 'Too many requests',
        retry_after_ms: rateCheck.retryAfterMs,
      })
    }

    // Validate service token
    const serviceData = await getServiceByToken(token)
    if (!serviceData) {
      return reply.status(404).send({ error: 'Service not found or inactive' })
    }

    // Create a new MCP server for this connection
    const callerIp = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? request.ip
      ?? undefined
    const callerUserAgent = request.headers['user-agent'] as string | undefined
    const mcpServer = await createMcpServer(serviceData, { ip: callerIp, userAgent: callerUserAgent })

    // Create stateless transport (one per request)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode
    })

    // Connect the server to the transport
    await mcpServer.connect(transport)

    // Delegate to the transport's request handler
    // We need to pass the raw Node.js req/res objects
    await transport.handleRequest(request.raw, reply.raw, request.body as unknown)

    // Mark reply as sent so Fastify doesn't try to send again
    reply.hijack()
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

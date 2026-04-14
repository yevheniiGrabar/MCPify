import type { FastifyReply, FastifyRequest } from 'fastify'

export async function handleMcpRequest(
  request: FastifyRequest<{ Params: { token: string } }>,
  reply: FastifyReply
): Promise<void> {
  // Stub: return empty tools list for now
  // Phase 1 will implement full MCP protocol
  const capabilities = {
    tools: [],
    meta: {
      token: request.params.token,
      message: 'MCP Worker stub — Phase 1 will implement full protocol',
    },
  }

  await reply.send(capabilities)
}

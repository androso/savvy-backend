import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'

const server: FastifyInstance = fastify({
  logger: true
} as FastifyServerOptions)

server.get('/', async (request, reply) => {
  return { hello: 'world' }
})

const start = async () => {
  try {
    await server.listen({ port: 3000 })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
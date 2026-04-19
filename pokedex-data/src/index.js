import { ApolloServer, gql } from 'apollo-server'
import { resolve, join } from 'path'
import { readFile } from 'fs/promises'
import getResolvers from './resolver.js'

async function readApi(apiPath) {
  const filePath = resolve(join('data', apiPath, 'index.json'))
  const content = await readFile(filePath, 'utf-8')
  const json = JSON.parse(content.toString())
  return json
}

async function readSchema() {
  const filePath = resolve('schema.graphql')
  const content = await readFile(filePath, 'utf-8')
  return content.toString()
}

function getApiPathFor(folder, id) {
  if (id !== undefined && id !== null) {
    return `/api/v2/${folder}/${id}`
  }
  return `/api/v2/${folder}/`
}

async function init() {
  const schema = await readSchema()
  const server = new ApolloServer({
    typeDefs: gql(schema),
    resolvers: getResolvers(readApi, getApiPathFor),
  })
  server.listen({ port: 6565 }).then(({ url }) => {
    console.info(`🚀  Server ready at ${url}`)
  })
}

init()

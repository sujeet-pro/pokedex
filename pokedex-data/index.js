const path = require('path')
const fsp = require('fs/promises')

const common = `
# Common
interface Connection {
  name: String!
  url: String!
}
interface ConnectionList {
  count: Int!
  results: [Connection!]!
}

# Entities
`

const getSchemaParts = entityName => `
# Entity: ${entityName}
type ${entityName} {
  id: Int!
  name: String!
}
type ${entityName}Connection implements Connection {
  name: String!
  url: String!
  details: ${entityName}
}
type ${entityName}List implements ConnectionList{
  count: Int!
  results: [${entityName}Connection!]!
}
`
const fileToEntityName = fileName =>
  fileName.replaceAll(/(^\w)|(-\w)/gi, x => x.replace('-', '').toUpperCase())
const dirPath = path.join(__dirname, 'data/api/v2')
async function init() {
  const files = await fsp.readdir(dirPath)
  const fromFile = files
    .filter(file => file !== 'index.json')
    .map(fileToEntityName)
    .map(getSchemaParts)
    .join('\n')
  const content = `${common}${fromFile}`
  console.log(content)
}
init()

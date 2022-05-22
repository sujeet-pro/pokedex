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

async function printSchemaSkeleton() {
  const files = await fsp.readdir(dirPath)
  const fromFile = files
    .filter(file => file !== 'index.json')
    .map(fileToEntityName)
    .map(getSchemaParts)
    .join('\n')
  const content = `${common}${fromFile}`
  console.log(content)
}

async function printQuerySkeleton() {
  const queryName = x => x[0].toLowerCase() + x.substring(1)
  const files = await fsp.readdir(dirPath)
  const folderTypeTuple = files
    .filter(file => file !== 'index.json')
    .map(x => [x, fileToEntityName(x)])

  const query = folderTypeTuple
    .map(
      ([folder, type]) =>
        `
  all${type}(filter: QueryFilterList): ${type}List
  ${queryName(type)}(url: String, id: Int): ${type}
  `,
    )
    .join('')
  // console.log(query)
  const js = folderTypeTuple
    .map(
      ([folder, type]) => `
  all${type}: getAll(getApiPathFor('${folder}')),
  ${queryName(type)}: getOne('${folder}'),
  `,
    )
    .join('')
  // console.log(js)

  const schemaExtJs = folderTypeTuple
    .map(
      ([folder, type]) => `
  ${type}Connection: {
    details: getConnection('${folder}'),
  },
  `,
    )
    .join('')
  console.log(schemaExtJs)
}
printQuerySkeleton()

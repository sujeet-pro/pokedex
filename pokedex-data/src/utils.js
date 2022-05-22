const cache = {}

/**
 *
 * @param {data: T} data
 * @returns {T}
 */
function sanitizeResponse(data) {
  if (Array.isArray(data)) {
    return data.map(u => sanitizeResponse(u))
  }
  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k.replaceAll('-', '_'), sanitizeResponse(v)]),
    )
  }
  return data
}

/**
 *
 * @param {(apiPath: string) => Promise<any>} fetcher
 * @param {string} apiPath
 * @returns {Promise<any>}
 */
async function getFromCachedApi(fetcher, apiPath) {
  if (!cache[apiPath]) {
    const content = await fetcher(apiPath)
    cache[apiPath] = sanitizeResponse(content)
  }
  return cache[apiPath]
}

export default function getResolverUtilMethods(getFromApi, getApiPathFor) {
  return {
    getAll(folderName) {
      return async function getAll(parent, args, context, info) {
        const apiPath = getApiPathFor(folderName)
        if (apiPath) {
          let data = await getFromCachedApi(getFromApi, apiPath)
          if (typeof args.filter?.eq === 'number') {
            const toEqUrl = getApiPathFor(folderName, args.filter.eq)
            const filtered = data?.results?.find(u => u.url === toEqUrl)
            return {
              count: filtered ? 1 : 0,
              results: filtered ? [filtered] : [],
            }
          } else if (Array.isArray(args?.filter?.in)) {
            const validUrl = new Set(args.filter.in.map(id => getApiPathFor(folderName, id)))
            const filtered = (data?.results || []).filter(u => validUrl.has(u.url))
            return {
              count: filtered.length,
              results: filtered,
            }
          }
          return data
        }
        return null
      }
    },
    getOne(folderName) {
      return async function getForOne(parent, args, context, info) {
        let apiPath = args.url
        if (!apiPath && typeof args.id === 'number') {
          apiPath = getApiPathFor(folderName, args.id)
        }
        if (apiPath) {
          const res = await getFromCachedApi(getFromApi, apiPath)
          return res
        }
        return null
      }
    },

    getConnection() {
      return async function getForConnection(parent, args, context, info) {
        if (parent.url) {
          const res = await getFromCachedApi(getFromApi, parent.url)
          return res
        }
        return null
      }
    },
    async getByUrl(url) {
      const res = getFromCachedApi(getFromApi, url)
      return res
    },
  }
}

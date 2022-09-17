import { PathFactory, defaultHandlers } from 'ldflex'
import FetchEngine from './FetchEngine'
import LanguageHandler from './LanguageHandler'
import PreloadHandler from './PreloadHandler'
import defaultIterationHandlers from '@ldflex/async-iteration-handlers'
import prefixes from './prefixes'

class ParentHandler {
  handle(pathData) {
    let node = pathData
    while (node.parent) node = node.parent
    return node
  }
}

class PathHandler {
  handle(pathData) {
     return pathData
  }
}

export const map = {
  handle: (pathData, path) => {
    return async (callback) => {
      const result = []
      
      const innerPredicates = []

      const tester = new Proxy({}, {
        get(target, property, receiver) {
          innerPredicates.push(property)
          return Reflect.get(target, property, receiver)
        }
      })

      callback(tester)

      await path.preload(innerPredicates)

      for await (const subPath of path) {
        result.push(callback(subPath))
      }

      return result  
    }
  }
}

const handlers = {
  ...defaultHandlers,
  ...defaultIterationHandlers,

  parent: new ParentHandler(),
  path: new PathHandler(),
  en: new LanguageHandler('en'),
  preload: new PreloadHandler(),
  map
}

export const path = async (iri: string, prefixes, vocab?: string, source?: string) => {
  if (!source) source = iri
  const queryEngine = new FetchEngine(source)
  const context = { '@context': { ...prefixes }}
  if (vocab) { context['@context']['@vocab'] = prefixes[vocab] }
  const path = new PathFactory({ queryEngine, handlers, context })
  return path.create({ subject: { termType: 'NamedNode', value: iri } })
}

export const get = (iri, vocab = 'foaf', source = null) => path(iri, prefixes, vocab, source)

import PathProxy from 'ldflex/src/PathProxy';
import JSONLDResolver from 'ldflex/src/JSONLDResolver';
import ComplexPathResolver from './ComplexPathResolver';
import defaultHandlers from 'ldflex/src/defaultHandlers';
import { ContextParser } from 'jsonld-context-parser';
import ContextProvider from 'ldflex/src/ContextProvider';
/**
 * A PathFactory creates paths with default settings.
 */

export default class PathFactory {

  private _settings: any
  private _data: any
  private _jsonldResolver: any
  private _pathProxy: any

  constructor(settings, data) {
    // Store settings and data
    this._settings = settings = { ...settings
    };
    this._data = data = { ...data
    }; // Prepare the handlers

    const handlers = settings.handlers || defaultHandlers;

    for (const key in handlers) handlers[key] = toHandler(handlers[key]);

    for (const key of Object.getOwnPropertySymbols(handlers)) handlers[key] = toHandler(handlers[key]); // Prepare the resolvers


    const resolvers = (settings.resolvers || []).map(toResolver);

    if (settings.context) {
      const contextProvider = new ContextProvider(settings.context);
      resolvers.push(new ComplexPathResolver(contextProvider));
      resolvers.push(this._jsonldResolver = new JSONLDResolver(contextProvider));
      settings.parsedContext = new ContextParser().parse(settings.context).then(_ref => {
        let {
          contextRaw
        } = _ref;
        return contextRaw;
      });
    } else {
      settings.context = settings.parsedContext = {};
    } // Instantiate PathProxy that will create the paths


    this._pathProxy = new PathProxy({
      handlers,
      resolvers
    }); // Remove PathProxy settings from the settings object

    delete settings.handlers;
    delete settings.resolvers;
  }
  /**
   * Creates a path with the given (optional) settings and data.
   */


  create() {
    let settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let data = arguments.length > 1 ? arguments[1] : undefined;
    // The settings parameter is optional
    if (!data) [data, settings] = [settings, null]; // Set data as subject if input as string

    if (typeof data === 'string') data = {
      subject: data
    }; // Apply defaults on data

    const _data = { ...this._data,
      ...data
    }; // Resolve string subjects to namedNodes

    if (typeof _data.subject === 'string') {
      if (this._jsonldResolver) _data.subject = this._jsonldResolver.lookupProperty(_data.subject);else throw new Error('Unable to resolve string subject - try providing a context to the PathFactory');
    } // Apply defaults on settings


    return this._pathProxy.createPath({ ...this._settings,
      ...settings
    }, _data);
  }

}
PathFactory.defaultHandlers = defaultHandlers;
/**
 * Converts a handler function into a handler object.
 */

export function toHandler(handle) {
  return typeof handle.handle === 'function' ? handle : {
    handle
  };
}
/**
 * Converts a resolver function into a catch-all resolver object.
 */

export function toResolver(resolve) {
  return typeof resolve.resolve === 'function' ? resolve : {
    supports,
    resolve
  };
} // Catch-all resolvers support everything

function supports() {
  return true;
}
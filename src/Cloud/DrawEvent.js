import { concat, union } from "lodash-es";
import { Utils } from "./utils";

export class DrawEvents {
  controller
  resolver
  constructor(manager) {
    this.manager = manager;
  }
  /** 
   * @param {Element|Element[]} el
   * @param {keyof GlobalEventHandlersEventMap|Array<keyof GlobalEventHandlersEventMap>} eventName
   * @param {{[K in keyof GlobalEventHandlersEventMap]:GlobalEventHandlersEventMap[K]}} handler
   * @return {Promise<MouseEvent|Event>}
   *   */
  update(el, eventName, handler = {}, caller) {
    /** @type {Element[]}*/
    this.clear()
    const els = concat(el);
    const mainNames = concat(eventName);
    const eventNames = union(Object.keys(handler), mainNames);
    const controller = new AbortController();
    const resolver = Utils.withResolvers();
    resolver.promise.catch(() => { })
    resolver.promise.finally(() => {
      this.controller = null
      this.resolver = null;
      controller.abort();
    })
    const fns = eventNames.map((name) => {
      const isMain = mainNames.indexOf(name) > -1
      return [
        name,
        /** @param {Event} e */
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          handler[name] && handler[name].call(caller, e);
          isMain && resolver.resolve(e);
        }]
    })
    for (const el of els)
      for (const [name, fn] of fns)
        el.addEventListener(name, fn, { signal: controller.signal, capture: true });
    this.controller = controller
    this.resolver = resolver
    return resolver.promise
  }
  clear() {
    this.resolver && this.resolver.reject('create event abort')
  }
}
const ATTRIBUTE_CHANGED_CALLBACK = 'attributeChangedCallback';
const CONNECTED_CALLBACK = 'connectedCallback';
const DISCONNECTED_CALLBACK = 'disconnectedCallback';

const observers = new WeakMap;
const privates = new WeakMap;

const attributeChangedCallback = (records, mo) => {
  const observed = observers.get(mo);
  for (let i = 0, {length} = records; i < length; i++) {
    const {target, attributeName, oldValue} = records[i];
    observed.get(target)[ATTRIBUTE_CHANGED_CALLBACK](
      target, attributeName, oldValue, target.getAttribute(attributeName)
    );
  }
};

const dropMutationObserver = mo => {
  mo.disconnect();
  observers.delete(mo);
};

const loopAndTrigger = (observed, nodes, method) => {
  for (let i = 0, {length} = nodes; i < length; i++) {
    if (observed.has(nodes[i])) {
      const handler = observed.get(nodes[i]);
      if (method in handler)
        handler[method](nodes[i]);
    }
  }
};

const loopRecords = (records, mo) => {
  const observed = observers.get(mo);
  for (let i = 0, {length} = records; i < length; i++) {
    loopAndTrigger(observed, records[i].addedNodes, CONNECTED_CALLBACK);
    loopAndTrigger(observed, records[i].removedNodes, DISCONNECTED_CALLBACK);
  }
};

export default class ElementObserver {
  /**
   * Create a new ElementObserver based on a specific handler.
   * @param {object} handler the context to use when
   *  `connectedCallback(element)`, `disconnectedCallback(element)`, or
   *  `attributeChangedCallback(element, name, old, value)` are invoked.
   */
  constructor(handler) {
    const m = new MutationObserver(loopRecords);
    const o = new Map;
    observers.set(m, o);
    privates.set(this, {
      h: handler,
      a: new Map,
      m, o
    });
  }

  /**
   * Like a MutationObserver, observe an element and, if already connected,
   * will trigger the `handler.connectedCallback(element)` right away.
   * @param {Element} element the DOM element to observe.
   * @param {object?} options an optional configuration for attributes.
   */
  observe(element, options) {
    const _ = privates.get(this);
    if (_.o.has(element))
      this.disconnect(element);
    if (!_.o.size) {
      _.m.observe(element.ownerDocument, {
        childList: true,
        subtree: true
      });
    }
    _.o.set(element, _.h);
    if (options && ATTRIBUTE_CHANGED_CALLBACK in _.h) {
      const {attributes, attributeFilter, attributeOldValue} = options;
      const mo = new MutationObserver(attributeChangedCallback);
      mo.observe(element, {attributes, attributeFilter, attributeOldValue});
      observers.set(mo, _.o);
      _.a.set(element, mo);
      for (let {attributes} = element, i = 0; i < attributes.length; i++) {
        const {name, value} = attributes[i];
        if (!attributeFilter || -1 < attributeFilter.indexOf(name))
          _.h[ATTRIBUTE_CHANGED_CALLBACK](element, name, null, value);
      }
    }
    if (element.isConnected && CONNECTED_CALLBACK in _.h)
      _.h[CONNECTED_CALLBACK](element);
  }

  /**
   * Like a MutationObserver, disconnect either all observed elements or,
   *  differently from the native API, a single element.
   * @param {Element?} element the specific element to disconnect, or nothing
   *  to clear all observed elements and their mutations.
   */
  disconnect(element) {
    const _ = privates.get(this);
    if (element) {
      if (_.o.has(element)) {
        if (_.a.has(element)) {
          dropMutationObserver(_.a.get(element));
          _.a.delete(element);
        }
        _.o.delete(element);
        if (_.o.size)
          return;
      }
    }
    else {
      _.a.forEach(dropMutationObserver);
      _.a.clear();
      _.o.clear();
    }
    _.m.disconnect();
  }
};

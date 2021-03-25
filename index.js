self.ElementObserver = (function (exports) {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  var ATTRIBUTE_CHANGED_CALLBACK = 'attributeChangedCallback';
  var CONNECTED_CALLBACK = 'connectedCallback';
  var DISCONNECTED_CALLBACK = 'connectedCallback';
  var observers = new WeakMap();
  var privates = new WeakMap();

  var attributeChangedCallback = function attributeChangedCallback(records, mo) {
    var observed = observers.get(mo);

    for (var i = 0, length = records.length; i < length; i++) {
      var _records$i = records[i],
          target = _records$i.target,
          attributeName = _records$i.attributeName,
          oldValue = _records$i.oldValue;
      observed.get(target)[ATTRIBUTE_CHANGED_CALLBACK](target, attributeName, oldValue, target.getAttribute(attributeName));
    }
  };

  var dropMutationObserver = function dropMutationObserver(mo) {
    mo.disconnect();
    observers["delete"](mo);
  };

  var loopAndTrigger = function loopAndTrigger(observed, nodes, method) {
    for (var i = 0, length = nodes.length; i < length; i++) {
      if (observed.has(nodes[i])) {
        var handler = observed.get(nodes[i]);
        if (method in handler) handler[method](nodes[i]);
      }
    }
  };

  var loopRecords = function loopRecords(records, mo) {
    var observed = observers.get(mo);

    for (var i = 0, length = records.length; i < length; i++) {
      loopAndTrigger(observed, records[i].addedNodes, CONNECTED_CALLBACK);
      loopAndTrigger(observed, records[i].removedNodes, DISCONNECTED_CALLBACK);
    }
  };

  var ElementObserver = /*#__PURE__*/function () {
    /**
     * 
     * @param {object} handler the context to use when
     *  `connectedCallback(element)`, `disconnectedCallback(element)`, or
     *  `attributeChangedCallback(element, name, old, value)` are invoked.
     */
    function ElementObserver(handler) {
      _classCallCheck(this, ElementObserver);

      var m = new MutationObserver(loopRecords);
      var o = new Map();
      observers.set(m, o);
      privates.set(this, {
        h: handler,
        a: new Map(),
        m: m,
        o: o
      });
    }
    /**
     * Like a MutationObserver, observe an element and, if already connected,
     * will trigger the `handler.connectedCallback(element)` right away.
     * @param {Element} element the DOM element to observe.
     * @param {object?} options an optional configuration for attributes.
     */


    _createClass(ElementObserver, [{
      key: "observe",
      value: function observe(element, options) {
        var _ = privates.get(this);

        if (_.o.has(element)) this.disconnect(element);

        if (!_.o.size) {
          _.m.observe(element.ownerDocument, {
            childList: true,
            subtree: true
          });
        }

        _.o.set(element, _.h);

        if (options && ATTRIBUTE_CHANGED_CALLBACK in _.h) {
          var attributes = options.attributes,
              attributeFilter = options.attributeFilter,
              attributeOldValue = options.attributeOldValue;
          var mo = new MutationObserver(attributeChangedCallback);
          mo.observe(element, {
            attributes: attributes,
            attributeFilter: attributeFilter,
            attributeOldValue: attributeOldValue
          });
          observers.set(mo, _.o);

          _.a.set(element, mo);

          for (var _attributes = element.attributes, i = 0; i < _attributes.length; i++) {
            var _attributes$i = _attributes[i],
                name = _attributes$i.name,
                value = _attributes$i.value;
            if (!attributeFilter || -1 < attributeFilter.indexOf(name)) _.h[ATTRIBUTE_CHANGED_CALLBACK](element, name, null, value);
          }
        }

        if (element.isConnected && CONNECTED_CALLBACK in _.h) _.h[CONNECTED_CALLBACK](element);
      }
      /**
       * Like a MutationObserver, disconnect either all observed elements or,
       *  differently from the native API, a single element.
       * @param {Element?} element the specific element to disconnect, or nothing
       *  to clear all observed elements and their mutations.
       */

    }, {
      key: "disconnect",
      value: function disconnect(element) {
        var _ = privates.get(this);

        if (element) {
          if (_.o.has(element)) {
            if (_.a.has(element)) {
              dropMutationObserver(_.a.get(element));

              _.a["delete"](element);
            }

            _.o["delete"](element);

            if (_.o.size) return;
          }
        } else {
          _.a.forEach(dropMutationObserver);

          _.a.clear();

          _.o.clear();
        }

        _.m.disconnect();
      }
    }]);

    return ElementObserver;
  }();

  return ElementObserver;

  return exports;

}({}));

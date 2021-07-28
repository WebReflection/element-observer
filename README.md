# ElementObserver

A *MutationObserver* inspired observer for *Custom Elements* like mutations on any DOM element.

```js
import ElementObserver from '@webreflection/element-observer';

const observer = new ElementObserver({
  // optional, used only if options for attributes are used
  attributeChangedCallback(element, name, oldValue, newValue) {
    // all observed attributes will be triggered right away if present,
    // when the element is observed, and *before* connectedCallback,
    // as it is for Custom Elements
  },

  // optional, used when the element is connected
  connectedCallback(element) {
    // if the element is already connected when observed, this is triggered.
  },

  // optional, used when the element is disconnected
  disconnectedCallback(element) {}
});

observer.observe(
  observedElement,
  // optional, if present is used to define attributes
  {
    // optional, if omitted will observe all attributes
    attributeFilter: ['only', 'these'],
    // optional, if omitted oldValue is always null
    attributeOldValue: true,
    // optional, if any of the previous properties are defined,
    // this is implicitly set as true
    attributes: true
  }
);

observer.disconnect(
  // optional, if an element is passed, only that element
  // stops being observed, otherwise all observed elements
  // will immediately stop being observed
  observedElement
);
```

See [MutationObserver.observe()](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe) to better understand attributes properties.

(function(root, attach) {
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core', 'hlf/hover-intent'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'), require('hlf/hover-intent'));
  } else {
    attach(hlf);
  }
})(this, function(hlf, hoverIntent) {
  hlf.tip = {
    debug: true,
    defaults: {
      autoDirection: true,
      cursorHeight: 12,
      defaultDirection: ['bottom', 'right'],
      doDispatchEvents: true,
      doFollow: true,
      doStem: true,
      snapToTrigger: true,
      snapToXAxis: false,
      snapToYAxis: false,
      tipTemplate({ containerClass }) {
        let stemHtml = '';
        if (this.doStem) {
          stemHtml = `<div class="${this.className('stem')}"></div>`;
        }
        return (
`<div class="${containerClass}">
  <div class="${this.className('inner')}">
    ${stemHtml}
    <div class="${this.className('content')}"></div>
  </div>
</div>`
        );
      },
      triggerContent: null,
      viewportElement: document.body,
    },
    toString(context) {
      switch (context) {
        case 'event': return 'hlftip';
        case 'data': return 'hlf-tip';
        case 'class': return 'tips';
        default: return 'hlf-tip';
      }
    },
  };
  class Tip {
    constructor(element, options, contextElement) {
    }
    init() {
    }
    deinit() {
    }
  }
  return hlf.createExtension({
    name: 'tip',
    namespace: hlf.tip,
    apiClass: Tip,
    asSharedInstance: true,
    autoBind: true,
    autoListen: true,
    baseMethodGroups: ['css', 'selection'],
    compactOptions: true,
  });
});

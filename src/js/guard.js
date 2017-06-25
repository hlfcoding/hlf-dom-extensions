(function() {
  'use strict';

  window.guard = {
    isNavigatorSupported: true
  };

  try {
    eval('({a})=>{}');
  } catch (e) {
    guard.isNavigatorSupported = false;
  }

  if (!CSS.supports || !CSS.supports('(--custom-property: 0)')) {
    guard.isNavigatorSupported = false;
  }

  if (!guard.isNavigatorSupported) {
    alert('To view, you must upgrade your browser!');

    document.addEventListener('readystatechange', function(_) {
      var body, element, head;
      if (document.readyState === 'loading') { return; }

      head = document.head;
      element = head.querySelector('script[src$="guard.js"]');
      while (element.nextElementSibling) {
        if (/link|script/.test(element.nextElementSibling.tagName.toLowerCase())) {
          head.removeChild(element.nextElementSibling);
        } else {
          element = element.nextElementSibling;
        }
      }

      body = document.body;
      while (body.firstChild) {
        body.removeChild(body.firstChild);
      }
    });
  }
}());

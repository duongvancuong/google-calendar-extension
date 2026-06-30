// src/selection.js — pure wrap-around index movement for the results list
(function () {
  'use strict';

  function move(index, delta, len) {
    if (!len || len <= 0) return 0;
    return (((index + delta) % len) + len) % len;
  }

  const Selection = { move };

  if (typeof module !== 'undefined') module.exports = Selection;
  else globalThis.Selection = Selection;
})();

// Liquid Glass look (css/glass.css). The setting is Auto, Full, Light or Off:
//   Full  - frosted panels with a real backdrop blur
//   Light - the same shapes and rims with a denser tint, no live blur (older or slower TVs)
//   Off   - the original flat look
// Auto picks Full when the browser can blur and keeps a smooth frame rate while it does,
// otherwise Light. The measurement runs once per TV and is remembered.
(function (A) {
  'use strict';

  var PROBE_KEY = 'lgtizen.glassprobe.v1';
  var PROBE_MS = 1500, MIN_FPS = 45;
  var MODES = [['auto', 'Automatic'], ['full', 'Full'], ['lite', 'Light'], ['off', 'Off']];
  var probing = false;

  function canBlur() {
    var css = window.CSS;
    if (!css || !css.supports) { return false; }
    return css.supports('backdrop-filter', 'blur(2px)') || css.supports('-webkit-backdrop-filter', 'blur(2px)');
  }

  function remembered() {
    try { return localStorage.getItem(PROBE_KEY); } catch (e) { return null; }
  }

  function remember(mode) {
    try { localStorage.setItem(PROBE_KEY, mode); } catch (e) { /* storage blocked: probe again next boot */ }
  }

  function setClasses(mode) {
    var body = document.body;
    body.classList.toggle('glass', mode !== 'off');
    body.classList.toggle('glass-full', mode === 'full');
    body.classList.toggle('glass-lite', mode === 'lite');
  }

  // Count frames for a moment with Full applied; keep it only if the TV keeps up.
  function probe(done) {
    var frames = 0, start = null;
    probing = true;
    setClasses('full');
    function frame(t) {
      if (start === null) { start = t; }
      frames++;
      if (t - start < PROBE_MS) { return window.requestAnimationFrame(frame); }
      probing = false;
      done(frames * 1000 / (t - start) >= MIN_FPS ? 'full' : 'lite');
    }
    window.requestAnimationFrame(frame);
  }

  function resolved(setting) {
    if (setting !== 'auto') { return setting; }
    if (!canBlur()) { return 'lite'; }
    return remembered();
  }

  A.glass = {
    MODES: MODES,
    apply: function () {
      var mode = resolved(A.settings.glass || 'auto');
      if (mode) { return setClasses(mode); }
      if (probing) { return; }
      probe(function (result) {
        remember(result);
        if ((A.settings.glass || 'auto') === 'auto') { setClasses(result); }
      });
    },
    // What Auto settled on, for the Settings label.
    current: function () {
      var b = document.body.classList;
      return b.contains('glass-full') ? 'full' : b.contains('glass-lite') ? 'lite' : 'off';
    }
  };
})(window.LiquidGlass);

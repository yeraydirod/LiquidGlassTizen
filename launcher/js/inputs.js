// TV inputs: every HDMI port like the TV's own Source list, named by the user or the TV,
// shown full screen inside the launcher.
(function (A) {
  'use strict';

  var tz = A.tizen, ICONS = A.tiles.ICONS;
  var inputs = A.inputs = { sources: [], watching: false };

  inputs.portName = function (s) { return s.type === 'TV' ? 'Live TV' : s.type + ' ' + s.number; };

  inputs.label = function (s) { return A.settings.inputNames[inputs.portName(s)] || s.editName || inputs.portName(s); };

  function iconFor(s, label) {
    if (s.type === 'TV') { return ICONS.tv; }
    var n = label.toLowerCase();
    if (/xbox|playstation|ps\d|switch|nintendo|game|console/.test(n)) { return ICONS.game; }
    if (/pc|computer|mac|laptop/.test(n)) { return ICONS.pc; }
    if (/cable|box|roku|fire|apple|shield|chromecast|blu|dvd|satellite/.test(n)) { return ICONS.box; }
    return ICONS.hdmi;
  }

  inputs.render = function () {
    var row = A.$('inputs');
    row.textContent = '';
    inputs.sources.forEach(function (s) {
      var label = inputs.label(s), port = inputs.portName(s);
      var tile = A.tiles.card(label, iconFor(s, label), function () { inputs.show(s); });
      if (label !== port && s.type !== 'TV') { tile.querySelector('.name').appendChild(A.el('div', 'sub', port)); }
      if (!s.connected) { tile.classList.add('off'); }
      row.appendChild(tile);
    });
    A.homeScreen.buildRows();
  };

  // Live TV first, then connected ports, then empty ones. Refreshes when something is plugged in.
  inputs.load = function () {
    if (!tz || !tz.systeminfo) {  // desktop browser preview
      inputs.sources = [
        { type: 'TV', number: 1, connected: true }, { type: 'HDMI', number: 1, editName: 'Xbox', connected: true },
        { type: 'HDMI', number: 2, connected: false }, { type: 'HDMI', number: 3, editName: 'PC', connected: false }
      ];
      return inputs.render();
    }
    try {
      tz.systeminfo.getPropertyValue('VIDEOSOURCE', function (info) {
        function tag(list, connected) {
          return (list || []).filter(function (s) { return s.type !== 'MEDIA'; }).map(function (s) {
            return { type: s.type, number: s.number, editName: s.editName, connected: connected, raw: s };
          });
        }
        inputs.sources = tag(info.connected, true).concat(tag(info.disconnected, false)).sort(function (a, b) {
          return (b.type === 'TV') - (a.type === 'TV') || (b.connected - a.connected) || a.number - b.number;
        });
        inputs.render();
      }, inputs.render);
    } catch (e) { inputs.render(); }
  };

  // ---- Live TV: always the antenna (TDT), never Samsung TV Plus -------------------
  // The tuner source resumes whatever channel ran last, which is often a TV Plus stream.
  // So before showing it, make sure an antenna channel is tuned: the last one watched
  // here, or else the first in the TV's scanned channel list.
  var antenna = [];

  function key(c) { return c.major + '.' + c.minor; }
  function isAntenna(c) {
    for (var i = 0; c && i < antenna.length; i++) { if (key(antenna[i]) === key(c)) { return true; } }
    return false;
  }

  function tuneAntenna(next) {
    var ch = tz.tvchannel, called = false;
    function done() { if (!called) { called = true; next(); } }
    if (!ch) { return done(); }
    try {
      ch.getChannelList(function (list) {
        antenna = list || [];
        var cur = null;
        try { cur = ch.getCurrentChannel('MAIN'); } catch (e) { /* none yet */ }
        if (!antenna.length || isAntenna(cur)) { return done(); }
        var want = isAntenna(A.settings.tvChannel) ? A.settings.tvChannel : antenna[0];
        ch.tune({ major: want.major, minor: want.minor },
          { onsuccess: done, onnosignal: done, onprograminforeceived: function () {} }, done, 'MAIN');
      }, done, 'ALL');
    } catch (e) { done(); }
  }

  function rememberChannel() {
    try {
      var cur = tz.tvchannel.getCurrentChannel('MAIN');
      if (isAntenna(cur)) { A.settings.tvChannel = { major: cur.major, minor: cur.minor }; A.settings.save(); }
    } catch (e) { /* no channel API */ }
  }

  inputs.channel = function (up) {
    try { tz.tvchannel[up ? 'tuneUp' : 'tuneDown']({ onsuccess: function () {}, onnosignal: function () {} }, null, 'ALL', 'MAIN'); } catch (e) { /* no channel API */ }
  };

  function setKeys(on) {
    try { tz.tvinputdevice[on ? 'registerKeyBatch' : 'unregisterKeyBatch'](['ChannelUp', 'ChannelDown']); } catch (e) { /* not supported */ }
  }

  inputs.show = function (s) {
    if (!tz || !tz.tvwindow) { return A.toast('Would switch to ' + inputs.label(s)); }
    try {
      tz.tvwindow.setSource(s.raw || s, function () {
        (s.type === 'TV' ? tuneAntenna : function (f) { f(); })(function () {
          tz.tvwindow.show(function () {
            inputs.watching = true;
            inputs.watchingTv = s.type === 'TV';
            if (inputs.watchingTv) { setKeys(true); }
          document.body.classList.add('tv');
          document.documentElement.style.background = 'transparent';
            window.Backgrounds.hide();
          }, function () { A.toast('Could not show ' + inputs.label(s)); }, ['0px', '0px', '1920px', '1080px'], 'MAIN');
        });
      }, function () { A.toast('Could not switch input'); }, 'MAIN');
    } catch (e) { A.toast('Could not switch input'); }
  };

  inputs.leave = function () {
    if (inputs.watchingTv) { rememberChannel(); setKeys(false); }
    inputs.watching = inputs.watchingTv = false;
    document.body.classList.remove('tv');
    A.applyBackground();
    try { tz.tvwindow.hide(function () {}, function () {}, 'MAIN'); } catch (e) { /* already hidden */ }
  };

  if (tz && tz.systeminfo) {
    try { tz.systeminfo.addPropertyValueChangeListener('VIDEOSOURCE', inputs.load); } catch (e) { /* not supported */ }
  }
})(window.LiquidGlass);

// Weather next to the clock: city from IP geolocation (ipapi.co), current conditions from
// Open-Meteo. Both are free and keyless. Refreshes every 20 minutes; the last reading is
// cached so the top bar isn't empty while offline.
window.Weather = (function () {
  'use strict';

  var CACHE = 'aerotizen.weather.v1';
  var REFRESH = 20 * 60 * 1000;

  // WMO weather codes -> simple icon shapes.
  var ICONS = {
    sun: '<circle cx="12" cy="12" r="4.5" fill="#ffd34d"/><g stroke="#ffd34d" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.5v2.5M12 19v2.5M2.5 12h2.5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></g>',
    partly: '<circle cx="9" cy="9" r="3.6" fill="#ffd34d"/><path fill="#e8ecf2" d="M8 19h9.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6 1.2A3 3 0 0 0 8 19z"/>',
    cloud: '<path fill="#d5dbe4" d="M7 19h11a4 4 0 0 0 .5-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 19z"/>',
    fog: '<g stroke="#c9cfd8" stroke-width="2" stroke-linecap="round"><path d="M4 9h16M6 13h12M4 17h16"/></g>',
    rain: '<path fill="#d5dbe4" d="M7 15h11a4 4 0 0 0 .5-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 15z"/><g stroke="#6cb6ff" stroke-width="1.8" stroke-linecap="round"><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/></g>',
    snow: '<path fill="#d5dbe4" d="M7 15h11a4 4 0 0 0 .5-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 15z"/><g fill="#fff"><circle cx="8" cy="19" r="1.2"/><circle cx="12" cy="20.5" r="1.2"/><circle cx="16" cy="19" r="1.2"/></g>',
    storm: '<path fill="#b9c0cc" d="M7 14h11a4 4 0 0 0 .5-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 14z"/><path fill="#ffd34d" d="M12.5 13l-3 5h2.5l-1.5 4.5 4.5-6h-2.6l1.6-3.5z"/>'
  };
  function icon(code) {
    if (code === 0 || code === 1) { return ICONS.sun; }
    if (code === 2) { return ICONS.partly; }
    if (code === 3) { return ICONS.cloud; }
    if (code === 45 || code === 48) { return ICONS.fog; }
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) { return ICONS.snow; }
    if (code >= 95) { return ICONS.storm; }
    if (code >= 51) { return ICONS.rain; }
    return ICONS.cloud;
  }

  function getJSON(url, cb) {
    var x = new XMLHttpRequest();
    x.open('GET', url); x.timeout = 8000;
    x.onload = function () { try { cb(x.status === 200 ? JSON.parse(x.responseText) : null); } catch (e) { cb(null); } };
    x.onerror = x.ontimeout = function () { cb(null); };
    x.send();
  }

  function render(w) {
    var el = document.getElementById('weather');
    if (!el || !w) { return; }
    el.innerHTML = '<svg viewBox="0 0 24 24">' + icon(w.code) + '</svg><b></b><span></span>';
    el.querySelector('b').textContent = Math.round(w.temp) + '°';
    el.querySelector('span').textContent = w.city || '';
    el.hidden = false;
  }

  var unitOf = function () { return 'auto'; };

  function refresh() {
    getJSON('https://ipapi.co/json/', function (geo) {
      if (!geo || geo.latitude === undefined) { return; }
      var pref = unitOf();
      var f = pref === 'F' || (pref === 'auto' && (geo.country_code === 'US' || geo.country_code === 'LR' || geo.country_code === 'MM'));
      getJSON('https://api.open-meteo.com/v1/forecast?latitude=' + geo.latitude + '&longitude=' + geo.longitude +
              '&current=temperature_2m,weather_code' + (f ? '&temperature_unit=fahrenheit' : ''), function (m) {
        if (!m || !m.current) { return; }
        var w = { temp: m.current.temperature_2m, code: m.current.weather_code, city: geo.city, unit: pref, at: Date.now() };
        try { localStorage.setItem(CACHE, JSON.stringify(w)); } catch (e) {}
        render(w);
      });
    });
  }

  function start(unitGetter) {
    if (unitGetter) { unitOf = unitGetter; }
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE)); } catch (e) {}
    if (cached) { render(cached); }
    if (!cached || cached.unit !== unitOf() || Date.now() - cached.at > REFRESH) { refresh(); }
    setInterval(refresh, REFRESH);
  }

  return { start: start, refresh: refresh };
})();

'use strict';
// Background watcher that makes the launcher behave like the TV's home screen.
//
// Hidden web apps are frozen on retail Samsung TVs, so this runs as a Tizen web service
// (Node.js runtime, started at boot). Every second it asks the TV's local API (port 8001)
// whether the launcher is on screen, and reclaims the screen when something it didn't
// choose covers it:
//   - Samsung Home at boot, or Home pressed on the launcher: the launcher is hidden but no
//     app was opened -> relaunch it.
//   - Home pressed inside an app the launcher opened: that app goes visible -> hidden while
//     the launcher is still hidden -> relaunch it.
//   - An app that starts on its own (a cast from a phone): it shows up as newly running ->
//     leave it alone and treat it like an app the launcher opened.
// Samsung's stock YouTube (Cobalt) always reports visible=false, so Home inside it can't be
// detected; Back still returns to the launcher.
// The launcher talks to this service over http://127.0.0.1:47791.

var http = require('http');

var SELF = 'LqGlass001.Home';
var PORT = 47791;
var state = {
  watched: null, seen: false, leaving: false,
  apps: [], running: {}, selfVisible: null, hiddenSince: 0, watchAt: 0, lastLaunch: 0, last: null
};

function get(path, cb) {
  var req = http.get({ host: '127.0.0.1', port: 8001, path: path, timeout: 1500 }, function (res) {
    var body = '';
    res.on('data', function (c) { body += c; });
    res.on('end', function () {
      var s = null; try { s = JSON.parse(body); } catch (e) {}
      cb(s && s.running !== undefined ? s : null);
    });
  });
  req.on('error', function () { cb(null); });
  req.on('timeout', function () { req.destroy(); });
}

function appStatus(id, cb) { get('/api/v2/applications/' + encodeURIComponent(id), cb); }

function snapshot(cb) {
  var out = {}, left = state.apps.length;
  if (!left) { return cb(out); }
  state.apps.forEach(function (id) {
    appStatus(id, function (s) {
      out[id] = !!(s && s.running);
      if (s && s.visible) { out.__visible = id; }
      if (--left === 0) { cb(out); }
    });
  });
}

function launchSelf(why) {
  // Rate-limited so a failing relaunch can't loop. The TV's local API ignores launch
  // requests from the TV itself, so this uses the Tizen application API.
  if (Date.now() - state.lastLaunch < 2000) { return; }
  state.lastLaunch = Date.now();
  state.watched = null;
  try {
    tizen.application.launch(SELF, function () { state.last = 'relaunched: ' + why; },
                             function (e) { state.last = 'relaunch failed: ' + (e && e.message); });
  } catch (e) {
    state.last = 'relaunch threw: ' + e.message;
  }
}

var busy = false;
function tick() {
  if (state.leaving || busy) { return; }
  busy = true;
  setTimeout(function () { busy = false; }, 2500);  // never stay stuck if a request hangs
  appStatus(SELF, function (me) {
    busy = false;
    if (!me) { return; }
    var now = Date.now();
    if (me.visible) {
      state.selfVisible = true; state.hiddenSince = 0; state.watched = null;
      if (now - (state.snapAt || 0) > 5000) { state.snapAt = now; snapshot(function (r) { state.running = r; }); }
      return;
    }
    if (state.selfVisible !== false) { state.hiddenSince = now; }
    state.selfVisible = false;

    if (state.watched) {
      appStatus(state.watched, function (s) {
        if (!s || !state.watched) { return; }
        if (s.visible) { state.seen = true; }
        else if (state.seen) { launchSelf('home pressed in ' + state.watched); }
      });
      return;
    }
    // Hidden and nothing opened by the launcher. Give the launcher a moment to report a
    // launch, then decide whether something legitimate started.
    // The launcher reports /watch before it opens an app, so a short grace is enough.
    if (now - state.hiddenSince < 250 || now - state.watchAt < 2500) { return; }
    snapshot(function (r) {
      if (r.__visible) {
        state.watched = r.__visible; state.seen = true; delete r.__visible; state.running = r;
        state.last = 'stand aside: ' + state.watched + ' is on screen';
        return;
      }
      for (var id in r) {
        if (r[id] && !state.running[id]) {
          state.watched = id; state.seen = false; state.running = r;
          state.last = 'stand aside: ' + id + ' started';
          return;
        }
      }
      state.running = r;
      launchSelf('covered without an app');
    });
  });
}

// App ids as Tizen and the TV's local API spell them: "org.tizen.netflix-app", "3201907018807",
// "abcdefghij.App". Anything else sent to the service is ignored.
var APP_ID = /^[\w.-]{1,128}$/;
var MAX_APPS = 1000;

function cleanId(id) { return typeof id === 'string' && APP_ID.test(id) ? id : null; }

function handle(pathname, q) {
  if (pathname === '/watch') {
    state.watched = cleanId(q.id); state.seen = false; state.leaving = false; state.watchAt = Date.now();
  } else if (pathname === '/apps') {
    state.apps = String(q.ids || '').split(',').filter(cleanId).slice(0, MAX_APPS);
  } else if (pathname === '/leave') {
    state.leaving = true; state.watched = null;
  } else if (pathname === '/home') {
    state.leaving = false; state.watched = null;
  }
}

module.exports.onStart = function () {
  var server = http.createServer(function (req, res) {
    var url = require('url').parse(req.url, true);
    if (req.method === 'GET') { handle(url.pathname, url.query); }
    // The launcher only needs the request to succeed. The internal state (installed and running
    // apps) is not echoed back, so other apps on the TV can't read it through this port.
    res.writeHead(req.method === 'GET' ? 200 : 405, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
  });
  server.listen(PORT, '127.0.0.1');
  setInterval(tick, 300);
  // Started at boot (on-boot="true"): open the launcher so the TV comes up on it.
  setTimeout(function () { launchSelf('boot'); }, 3000);
  return server;
};

// For tests only.
module.exports._state = state;
module.exports._handle = handle;

module.exports.onRequest = function () {};
module.exports.onExit = function () {};

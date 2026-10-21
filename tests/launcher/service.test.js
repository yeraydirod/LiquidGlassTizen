// Runs the TV background service in Node with a stand-in `tizen` global: `node --test tests/launcher`.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

global.tizen = { application: { launch: function () {} } };
const service = require('../../launcher/service/index.js');

function get(path) {
  return new Promise(function (resolve, reject) {
    http.get({ host: '127.0.0.1', port: 47791, path: path }, function (res) {
      let body = '';
      res.on('data', function (c) { body += c; });
      res.on('end', function () { resolve({ status: res.statusCode, headers: res.headers, body: body }); });
    }).on('error', reject);
  });
}

test('service answers without leaking its state', async function () {
  const server = service.onStart();
  await new Promise(function (r) { server.on('listening', r); });
  try {
    await get('/apps?ids=abcdefghij.App,org.tizen.netflix-app');
    const watch = await get('/watch?id=3201907018807');
    assert.strictEqual(watch.status, 200);
    assert.strictEqual(watch.body, '{"ok":true}');
    assert.strictEqual(watch.headers['access-control-allow-origin'], '*');
    assert.deepStrictEqual(service._state.apps, ['abcdefghij.App', 'org.tizen.netflix-app']);
    assert.strictEqual(service._state.watched, '3201907018807');

    await get('/watch?id=' + encodeURIComponent('x"><script>'));
    assert.strictEqual(service._state.watched, null);

    await get('/leave');
    assert.strictEqual(service._state.leaving, true);
    await get('/home');
    assert.strictEqual(service._state.leaving, false);
  } finally {
    server.close();
    setImmediate(function () { process.exit(0); });  // the service keeps timers running forever
  }
});

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.argv[2] || 'http://localhost:8123';
const profile = mkdtempSync(join(tmpdir(), 'inkward-chrome-'));
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--hide-scrollbars', '--window-size=1280,800', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws, id = 0;
const pending = new Map(), errors = [];
try {
  const endpoint = await new Promise((resolve, reject) => {
    let logs = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not open its debug endpoint')), 15000);
    chrome.stderr.on('data', data => {
      logs += data.toString();
      const match = logs.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  const host = new URL(endpoint).host;
  const target = await (await fetch(`http://${host}/json/new?about:blank`, { method: 'PUT' })).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const promise = pending.get(message.id); pending.delete(message.id);
      if (message.error) promise.reject(new Error(JSON.stringify(message.error))); else promise.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args);
    else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) errors.push(message.params.response.url);
  };
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const request = ++id; pending.set(request, { resolve, reject }); ws.send(JSON.stringify({ id: request, method, params }));
  });
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async expression => {
    for (let attempt = 0; attempt < 150; attempt++) {
      try { if (await evaluate(expression)) return; }
      catch (error) { if (!/Execution context was destroyed|Cannot find context|Inspected target navigated/.test(error.message)) throw error; }
      await pause(30);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  const key = async (code, keyValue) => {
    await call('Input.dispatchKeyEvent', { type: 'keyDown', code, key: keyValue });
    await pause(35);
    await call('Input.dispatchKeyEvent', { type: 'keyUp', code, key: keyValue });
  };
  const mouse = (type, x, y, button = 'left') => call('Input.dispatchMouseEvent', { type, x, y, button, buttons: type === 'mouseReleased' ? 0 : button === 'right' ? 2 : 1, clickCount: type === 'mouseMoved' ? 0 : 1 });
  // Observe labels drawn by the real animation frame, including ordinary play.
  const paintedLabels = () => evaluate(`(async () => {
    const ctx = document.querySelector('#game').getContext('2d'), original = ctx.fillText, labels = [];
    ctx.fillText = function(value, x, y, ...rest) {
      labels.push({ text: String(value), x, y, width: this.measureText(value).width, font: this.font, align: this.textAlign });
      return original.call(this, value, x, y, ...rest);
    };
    try { await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); }
    finally { ctx.fillText = original; }
    return labels;
  })()`);
  await call('Runtime.enable'); await call('Network.enable'); await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await call('Page.bringToFront');
  await call('Page.navigate', { url: base });
  await until('window.inkward?.state.mode === "title"');
  await mouse('mousePressed', 230, 470); await mouse('mouseReleased', 230, 470);
  await until('window.inkward.state.mode === "play"');
  const beforeX = await evaluate('window.inkward.state.monk.x');
  await call('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyD', key: 'd', windowsVirtualKeyCode: 68 });
  assert.ok(await evaluate('window.inkward.input.keys.has("KeyD")'), 'Browser receives the movement key');
  await until(`window.inkward.state.monk.x > ${beforeX + 20}`);
  await call('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyD', key: 'd' });
  const movement = await evaluate('({x:inkward.state.monk.x, mode:inkward.state.mode, keys:[...inkward.input.keys], time:inkward.state.runTime, hidden:document.hidden})');
  assert.ok(movement.x > beforeX + 20, `WASD moves the monk: ${JSON.stringify({ beforeX, ...movement })}`);
  await key('Space', ' '); await until('window.inkward.state.monk.dashCooldown > 0');
  await mouse('mousePressed', 700, 210);
  for (let y = 220; y <= 470; y += 10) { await mouse('mouseMoved', 700, y); await pause(5); }
  await mouse('mouseReleased', 700, 470); await pause(40);
  assert.ok(await evaluate('window.inkward.state.strokes.some(s => s.length > 200)'), 'Pointer input paints a real wall');
  assert.ok(await evaluate('window.inkward.state.ink') < 95, 'Painting spends ink');
  await until('window.inkward.state.enemies.length > 0');
  const enemy = await evaluate('({x:window.inkward.state.enemies[0].x,y:window.inkward.state.enemies[0].y})');
  const cx = Math.max(108, Math.min(880, enemy.x)), cy = Math.max(208, Math.min(614, enemy.y)), radius = 66;
  await mouse('mousePressed', cx + radius, cy);
  for (let i = 1; i <= 40; i++) { const a = i / 48 * Math.PI * 2; await mouse('mouseMoved', cx + Math.cos(a) * radius, cy + Math.sin(a) * radius); await pause(8); }
  const liveLoopLabels = await paintedLabels();
  assert.ok(liveLoopLabels.some(label => /^LOOP \d+% · CLOSE HERE$/.test(label.text)), 'An ordinary mouse loop draws its live closure decision');
  for (let i = 41; i <= 48; i++) { const a = i / 48 * Math.PI * 2; await mouse('mouseMoved', cx + Math.cos(a) * radius, cy + Math.sin(a) * radius); await pause(8); }
  await mouse('mouseReleased', cx + radius, cy); await pause(60);
  assert.ok(await evaluate('window.inkward.state.sealed') > 0, 'A real mouse loop seals a naturally spawned yokai');
  await mouse('mousePressed', 450, 350, 'right'); await mouse('mouseReleased', 450, 350, 'right');
  await until('window.inkward.state.splashCooldown > 0');
  await key('KeyQ', 'q'); await until('window.inkward.state.qCooldown > 0');
  await key('KeyE', 'e'); await until('window.inkward.state.eCooldown > 0');
  await key('KeyM', 'm'); await until('window.inkward.audio.muted');
  await key('KeyP', 'p'); await until('window.inkward.state.mode === "pause"');
  const pausedTime = await evaluate('window.inkward.state.runTime'); await pause(180);
  assert.equal(await evaluate('window.inkward.state.runTime'), pausedTime, 'Pause freezes simulation');
  await key('KeyP', 'p'); await until('window.inkward.state.mode === "play"');
  for (const scene of ['title', 'play', 'draft', 'end', 'winter', 'win']) {
    const expectedMode = { title: 'title', play: 'play', draft: 'draft', end: 'lose', winter: 'play', win: 'win' }[scene];
    await call('Page.navigate', { url: `${base}/?shot=${scene}&seed=1` });
    await until(`location.search === '?shot=${scene}&seed=1' && document.documentElement?.dataset.shotReady === 'true' && window.inkward?.state.mode === '${expectedMode}'`); await pause(80);
    const state = await evaluate('({ mode: inkward.state.mode, scroll: inkward.state.scroll, score: inkward.state.score, arts: inkward.state.arts.length, choices: inkward.state.draft.length, bonus: inkward.state.bonusDraft })');
    assert.equal(state.mode, expectedMode);
    if (scene === 'play') {
      const labels = await paintedLabels();
      for (const value of ['LOOP 85% · CLOSE HERE', 'WALL ERODING', 'BELL CHARGE 2.1s', 'OMEN 1 / 2 LOOPS']) {
        const label = labels.find(label => label.text === value);
        assert.ok(label, `Play renderer draws ${value}`);
        assert.ok(label.x - label.width / 2 >= 18 && label.x + label.width / 2 <= 996 && label.y >= 233 && label.y <= 694, `${value} fits the visible field below the boss HUD`);
      }
      assert.ok(!labels.some(label => /^(COMBO ×|WRATH \d|1 \/ 2 LOOPS$)/.test(label.text)), 'Tactical field removes duplicate HUD values');
      const arrowPixel = await evaluate(`(() => {
        const w = inkward.state.enemies.find(e => e.kind === 'oni').telegraph;
        const angle = Math.atan2(w.end.y - w.y, w.end.x - w.x);
        return Array.from(document.querySelector('#game').getContext('2d').getImageData(Math.round(w.end.x - Math.cos(angle) * 36), Math.round(w.end.y - Math.sin(angle) * 36), 1, 1).data);
      })()`);
      assert.ok(arrowPixel[0] > 160 && arrowPixel[1] < 100 && arrowPixel[2] < 100, 'Vermilion charge arrowhead remains visible over the shrine');
      console.log('Live tactics OK: closure progress, collision erosion, timed bell lane and boss omen; labels fit the field');
    }
    if (scene === 'draft') {
      assert.equal(state.scroll, 5, 'Draft shot stops after scroll 5');
      assert.equal(state.arts, 5, 'Draft shot shows five held arts');
      assert.equal(state.choices, 4, 'Earned omen displays its fourth choice');
      assert.equal(state.bonus, true, 'Scroll-five omen reward is live');
      const lacquer = await evaluate('(() => { const c = document.querySelector("#game").getContext("2d"); const p = (x, y) => Array.from(c.getImageData(x, y, 1, 1).data); return { backdrop: p(10, 10), card: p(55, 300), seal: p(184, 394) }; })()');
      console.log('Draft pixels', JSON.stringify(lacquer));
      assert.deepEqual(lacquer.backdrop, [8, 15, 25, 255], 'Draft covers the game scene with opaque lacquer');
      assert.ok(lacquer.card[0] < 50 && lacquer.card[2] < 70, 'Draft card uses a dark lacquer surface');
      assert.ok(Math.max(...lacquer.seal.slice(0, 3)) > 130, 'Draft art seal has a bright colored face');
    }
    const screenshot = await call('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    writeFileSync(`/tmp/ink-${scene}.jpg`, Buffer.from(screenshot.data, 'base64'));
    console.log(`Browser scene ${scene}: ${JSON.stringify(state)}`);
  }
  // In a normal run, the natural loss replay also exercises persistent best score and restart.
  await call('Page.navigate', { url: base }); await until('window.inkward?.state.mode === "title"');
  await evaluate(`(async () => { const { replayInput, createReplayPilot } = await import('./src/shots.js'); const { updateWorld, nextScroll } = await import('./src/world/update.js'); const { startRun } = await import('./src/world/state.js'); const s = inkward.state; const input = replayInput(); const pilot = createReplayPilot(); startRun(s); for (let i = 0; i < 12000 && s.mode !== 'lose'; i++) { if (s.runTime < 35) pilot(s, input); else { input.clearFrame(); input.keys.clear(); } updateWorld(s, input, 1/60); } })()`);
  await until('window.inkward.state.mode === "lose"'); await pause(60);
  const lossScore = await evaluate('window.inkward.state.score');
  await until(`Number(localStorage.getItem('inkward.best.v1')) >= ${lossScore}`);
  assert.ok(await evaluate('Number(localStorage.getItem("inkward.best.v1"))') >= lossScore, 'Best score persists');
  await key('KeyR', 'r'); await until('window.inkward.state.mode === "play"');
  assert.equal(await evaluate('window.inkward.state.bell.hp'), 12, 'Restart restores bell HP');
  assert.equal(await evaluate('window.inkward.state.score'), 0, 'Restart clears score');
  assert.deepEqual(errors, [], `Browser errors: ${JSON.stringify(errors)}`);
  console.log('Browser OK: title click, WASD, dash, real wall/loop and tactical call-outs, splash, Q/E, mute, pause, all scenes including the earned five-art draft, save and restart; zero console exceptions or failed resources');
} finally {
  ws?.close(); chrome.kill('SIGTERM');
  await new Promise(resolve => { if (chrome.exitCode !== null) resolve(); else chrome.once('exit', resolve); });
  rmSync(profile, { recursive: true, force: true });
}

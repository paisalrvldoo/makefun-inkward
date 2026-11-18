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
    await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    await call('Input.dispatchKeyEvent', { type: 'keyUp', code, key: keyValue });
  };
  const mouse = (type, x, y, button = 'left') => call('Input.dispatchMouseEvent', { type, x, y, button, buttons: type === 'mouseReleased' ? 0 : button === 'right' ? 2 : 1, clickCount: type === 'mouseMoved' ? 0 : 1 });
  // Observe labels drawn by the real animation frame, including ordinary play.
  const paintedLabels = () => evaluate(`(async () => {
    const ctx = document.querySelector('#game').getContext('2d'), original = ctx.fillText, originalFill = ctx.fillRect, labels = [];
    ctx.fillRect = function(x, y, width, height) {
      if (x <= 0 && y <= 0 && width >= 1280 && height >= 800 && this.globalAlpha === 1) labels.length = 0;
      return originalFill.call(this, x, y, width, height);
    };
    ctx.fillText = function(value, x, y, ...rest) {
      labels.push({ text: String(value), x, y, width: this.measureText(value).width, font: this.font, align: this.textAlign });
      return original.call(this, value, x, y, ...rest);
    };
    try { await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); }
    finally { ctx.fillText = original; ctx.fillRect = originalFill; }
    return labels;
  })()`);
  await call('Runtime.enable'); await call('Network.enable'); await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await call('Page.bringToFront');
  const checkPost = async () => {
    await until('inkward.post.active && inkward.post.frames > 0 && document.documentElement.dataset.renderer === "webgl2"');
    const samples = await evaluate(`new Promise(resolve => requestAnimationFrame(() => {
      const display = document.querySelector('#cinematic'), gl = display.getContext('webgl2');
      const source = document.querySelector('#game').getContext('2d');
      resolve([[100, 100], [640, 400], [1150, 700]].map(([x, y]) => {
        const pixel = new Uint8Array(4); gl.readPixels(x, 799 - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        return { source: Array.from(source.getImageData(x, y, 1, 1).data), display: Array.from(pixel) };
      }));
    }))`);
    for (const sample of samples) {
      assert.equal(sample.display[3], 255, 'Post display is opaque');
      assert.ok(sample.display.slice(0, 3).some(v => v > 0), 'Post display has rendered pixels');
      assert.ok(sample.display.slice(0, 3).every((v, i) => Math.abs(v - sample.source[i]) < 45), 'Post keeps source orientation and readable colors');
    }
    assert.ok(samples.some(s => s.display.some((v, i) => v !== s.source[i])), 'The screenshot display includes the actual post-process');
  };
  await call('Page.navigate', { url: `${base}/?shot=title&seed=1` });
  await until('window.inkward?.state.mode === "title" && document.documentElement.dataset.shotReady === "true"');
  await checkPost();
  await key('KeyG', 'g'); await until('!inkward.post.active && document.documentElement.dataset.renderer === "2d"');
  const plainTitle = await evaluate('document.querySelector("#game").toDataURL()');
  assert.equal(await evaluate('document.querySelector("#cinematic").style.display'), 'none', 'G reveals the original input canvas');
  await key('KeyG', 'g'); await checkPost();
  for (const failure of ['missing', 'shader', 'target', 'upload']) {
    const hook = await call('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(kind, ...args) {
        if (kind === 'webgl2' && '${failure}' === 'missing') return null;
        const context = original.call(this, kind, ...args);
        if (kind === 'webgl2' && context) {
          if ('${failure}' === 'shader') context.getShaderParameter = () => false;
          if ('${failure}' === 'target') context.checkFramebufferStatus = () => context.FRAMEBUFFER_UNSUPPORTED;
          if ('${failure}' === 'upload') context.texSubImage2D = () => { throw new Error('Injected upload failure'); };
        }
        return context;
      };
    })()` });
    await call('Page.navigate', { url: `${base}/?shot=title&seed=1&fallback=${failure}` });
    await until(`location.search.includes('fallback=${failure}') && window.inkward && document.documentElement.dataset.shotReady === 'true'`);
    assert.equal(await evaluate('inkward.post.active'), false, `${failure} falls back`);
    assert.equal(await evaluate('document.querySelector("#cinematic").style.display'), 'none');
    assert.equal(await evaluate('document.querySelector("#game").toDataURL()'), plainTitle, `${failure} preserves the exact plain 2D frame`);
    await call('Page.removeScriptToEvaluateOnNewDocument', { identifier: hook.identifier });
  }
  await call('Page.navigate', { url: `${base}/?shot=title&seed=1&restore=1` });
  await until('location.search.includes("restore=1") && window.inkward?.post.active');
  await checkPost();
  await evaluate('window.contextLoss = document.querySelector("#cinematic").getContext("webgl2").getExtension("WEBGL_lose_context"); contextLoss.loseContext()');
  await until('!inkward.post.available && document.documentElement.dataset.renderer === "2d"');
  await pause(120); await evaluate('contextLoss.restoreContext()'); await checkPost();
  console.log('Cinematic browser OK: processed pixels, G toggle, exact 2D fallback on missing WebGL/shader/target/upload failure, context loss and restoration');
  await call('Page.navigate', { url: base });
  await until('window.inkward?.state.mode === "title"');
  const initialSeed = await evaluate('inkward.state.seed');
  assert.ok((await paintedLabels()).some(label => label.text === 'SEED ' + String(initialSeed).padStart(10, '0')), 'Title displays its actual run seed');
  await key('KeyR', 'r'); await until(`inkward.state.mode === 'title' && inkward.state.seed !== ${initialSeed}`);
  const rerolledSeed = await evaluate('inkward.state.seed');
  await mouse('mousePressed', 168, 400); await mouse('mouseReleased', 168, 400);
  await until(`inkward.state.seed !== ${rerolledSeed}`);
  await call('Page.navigate', { url: `${base}/?seed=1` }); await until('window.inkward?.state.mode === "title" && inkward.state.seed === 1');
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
    await until('(() => { const p = document.querySelector("#game").getContext("2d").getImageData(10, 10, 1, 1).data; return p[3] === 255 && (p[0] || p[1] || p[2]); })()');
    await checkPost();
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
      const lacquer = await evaluate('(() => { const c = document.querySelector("#game").getContext("2d"); const p = (x, y) => Array.from(c.getImageData(x, y, 1, 1).data); return { backdrop: p(10, 10), card: p(55, 380), seal: p(166, 423) }; })()');
      console.log('Draft pixels', JSON.stringify(lacquer));
      assert.deepEqual(lacquer.backdrop, [8, 15, 25, 255], 'Draft covers the game scene with opaque lacquer');
      assert.ok(lacquer.card[0] < 50 && lacquer.card[2] < 80, 'Draft card uses a dark lacquer surface, including hover');
      assert.ok(Math.max(...lacquer.seal.slice(0, 3)) > 130, 'Draft art seal has a bright colored face');
      const labels = await paintedLabels();
      for (const value of ["PILGRIM'S PATH", 'SWARM ROAD', 'QUIET ROAD', 'CHOOSE SCROLL 6', 'CHOOSE A ROAD FIRST ↑']) {
        assert.ok(labels.some(label => label.text.includes(value)), `Draft presents ${value}`);
      }
      const cards = await evaluate('(async () => { const { draftRects } = await import("./src/screens/draft.js"); return draftRects(inkward.state); })()');
      for (const label of labels.filter(label => label.y >= 390 && label.y <= 674)) {
        const card = cards.find(rect => label.x >= rect.x && label.x <= rect.x + rect.w);
        assert.ok(card, `Draft label has a card: ${label.text}`);
        const left = label.x - (label.align === 'center' ? label.width / 2 : label.align === 'right' ? label.width : 0);
        assert.ok(left >= card.x + 10 && left + label.width <= card.x + card.w - 10, `Draft text fits its card: ${label.text}`);
      }
      const screenshot = await call('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
      writeFileSync('/tmp/ink-draft.jpg', Buffer.from(screenshot.data, 'base64'));
      await key('Digit1', '1');
      assert.equal(await evaluate('inkward.state.mode'), 'draft', 'Taking an art waits for a road');
      const health = await evaluate('inkward.state.bell.hp');
      await key('ArrowRight', 'ArrowRight'); await until('inkward.state.roadChoice === "quiet"');
      assert.equal(await evaluate('inkward.state.roadChoice'), 'quiet', 'Right selects Quiet road');
      await mouse('mousePressed', 618, 161); await mouse('mouseReleased', 618, 161); await until('inkward.state.roadChoice === "swarm"');
      assert.equal(await evaluate('inkward.state.roadChoice'), 'swarm', 'The next map node selects Swarm road');
      await mouse('mousePressed', 1060, 217); await mouse('mouseReleased', 1060, 217); await until('inkward.state.roadChoice === "quiet"');
      assert.equal(await evaluate('inkward.state.roadChoice'), 'quiet', 'The road card selects Quiet road');
      assert.equal(await evaluate('inkward.state.bell.hp'), health, 'Previewing roads does not apply healing');
      await key('Digit1', '1'); await until('inkward.state.mode === "play" && inkward.state.scroll === 6');
      assert.equal(await evaluate('inkward.state.route[5]'), 'quiet', 'Taking an art commits the walked road');
      assert.equal(await evaluate('inkward.state.bell.hp'), Math.min(12, health + 2), 'Entering Quiet road applies its healing');
      console.log('Path browser OK: node and road clicks, arrow choices, art gate, readable cards and real route transition');
    }
    if (scene !== 'draft') {
      const screenshot = await call('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
      writeFileSync(`/tmp/ink-${scene}.jpg`, Buffer.from(screenshot.data, 'base64'));
    }
    if (scene === 'win') {
      const labels = await paintedLabels();
      for (const value of ['THE BELL ENDURES', 'S', 'NEW BEST!', 'UNLOCKED', 'SEED 0000000001 / MONK', 'BEST RUN / MONK / A']) {
        assert.ok(labels.some(label => label.text === value), `Victory draws ${value}`);
      }
      assert.ok(labels.some(label => /^\+[\d,]+ VS PREVIOUS BEST$/.test(label.text)), 'Victory compares its score against the old record');
      const markers = await evaluate(`(() => {
        const s = inkward.state, max = Math.max(1000, ...s.scrollScores, ...s.previousBestRun.scrollScores);
        const ctx = document.querySelector('#game').getContext('2d');
        return s.previousBestRun.scrollScores.map((score, i) => {
          const x = 131 + i * 93, y = 568 - score / max * 94;
          const pixels = ctx.getImageData(Math.round(x) - 5, Math.round(y) - 5, 11, 11).data;
          let gold = 0;
          for (let p = 0; p < pixels.length; p += 4) if (pixels[p] > 200 && pixels[p + 1] > 170 && pixels[p + 2] < 190) gold++;
          return gold;
        });
      })()`);
      assert.ok(markers.every(count => count > 0), 'The visible ghost has a gold marker at every real previous scroll score');
    }
    console.log(`Browser scene ${scene}: ${JSON.stringify(state)}`);
  }
  for (const action of ['same-key', 'same-click', 'again-key', 'again-click', 'menu-key', 'menu-click']) {
    await call('Page.navigate', { url: `${base}/?shot=win&seed=1&verify=${action}` });
    await until(`location.search.includes('verify=${action}') && window.inkward?.state.mode === 'win' && document.documentElement.dataset.shotReady === 'true'`);
    if (action === 'same-key') await key('KeyS', 's');
    if (action === 'same-click') { await mouse('mousePressed', 650, 735); await mouse('mouseReleased', 650, 735); }
    if (action === 'again-key') await key('KeyR', 'r');
    if (action === 'again-click') { await mouse('mousePressed', 255, 735); await mouse('mouseReleased', 255, 735); }
    if (action === 'menu-key') await key('Escape', 'Escape');
    if (action === 'menu-click') { await mouse('mousePressed', 1030, 735); await mouse('mouseReleased', 1030, 735); }
    const expected = action.startsWith('menu') ? 'title' : 'play';
    await until(`inkward.state.mode === '${expected}'`);
    const run = await evaluate('({seed:inkward.state.seed, score:inkward.state.score, difficulty:inkward.state.difficulty, route:inkward.state.route})');
    assert.equal(run.score, 0); assert.equal(run.difficulty, 'monk');
    assert.deepEqual(run.route, ['shrine', null, null, null, null, null, null, null]);
    if (action.startsWith('again')) assert.notEqual(run.seed, 1, `${action} rolls a fresh seed`);
    else assert.equal(run.seed, 1, `${action} retains the finished seed`);
  }
  console.log('Victory controls OK: all three buttons and R/S/Esc, fresh and same seeds, reset route and saved comparison markers');
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
  await call('Page.navigate', { url: `${base}/?seed=1` }); await until('window.inkward?.state.mode === "title" && inkward.state.seed === 1');
  await evaluate(`(async () => {
    const { replayInput, createReplayPilot } = await import('./src/shots.js');
    const { updateWorld } = await import('./src/world/update.js');
    const { startRun } = await import('./src/world/state.js');
    const state = inkward.state, input = replayInput(), pilot = createReplayPilot({ branching: true });
    startRun(state);
    for (let frame = 0; frame < 54000 && !state.ended; frame++) { pilot(state, input); updateWorld(state, input, 1/60); }
  })()`);
  await until('inkward.state.mode === "win" && JSON.parse(localStorage.getItem("inkward.progress.v2"))?.wins === 1');
  const saved = await evaluate('JSON.parse(localStorage.getItem("inkward.progress.v2"))');
  assert.deepEqual(saved.unlocks, ['master', 'moonInk', 'afterglow', 'moonBell'], 'A real browser victory persists all four unlocks');
  assert.equal(saved.bestRun.seed, 1); assert.equal(saved.bestRun.scrollScores.length, 8);
  await key('Escape', 'Escape'); await until('inkward.state.mode === "title"');
  await key('KeyB', 'b'); await until('inkward.state.bell.skin === "moon"');
  await call('Page.navigate', { url: `${base}/?seed=1` });
  await until('window.inkward?.state.mode === "title" && inkward.state.bell.skin === "moon"');
  await key('Digit3', '3'); assert.equal(await evaluate('inkward.state.difficulty'), 'master', 'Victory makes Master selectable after a reload');
  await key('Enter', 'Enter'); await until('inkward.state.mode === "play"');
  assert.equal(await evaluate('inkward.state.bell.maxHp'), 10, 'Unlocked Master starts with its actual difficulty');
  assert.equal(await evaluate('inkward.state.previousBestRun.score'), saved.bestRun.score, 'New runs inherit the persisted score ghost');
  console.log('Persistence browser OK: real victory unlocks, best seed/chart, Moon Bell and Master survive reload');
  assert.deepEqual(errors, [], `Browser errors: ${JSON.stringify(errors)}`);
  console.log('Browser OK: input and live tactics, readable path/drafts, victory controls, seeds, ghost chart and persistent unlocks; zero console errors, exceptions or failed resources');
} finally {
  ws?.close(); chrome.kill('SIGTERM');
  await new Promise(resolve => { if (chrome.exitCode !== null) resolve(); else chrome.once('exit', resolve); });
  rmSync(profile, { recursive: true, force: true });
}

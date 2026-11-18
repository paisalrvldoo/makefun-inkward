import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function createBrowser() {
const profile = mkdtempSync(join(tmpdir(), 'inkward-chrome-'));
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--hide-scrollbars', '--window-size=1280,800', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws, id = 0;
const pending = new Map(), errors = [];
  async function close() {
    ws?.close(); chrome.kill('SIGTERM');
    await new Promise(resolve => { if (chrome.exitCode !== null) resolve(); else chrome.once('exit', resolve); });
    rmSync(profile, { recursive: true, force: true });
  }
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
  return { call, evaluate, until, key, mouse, paintedLabels, pause, errors, close };
} catch (error) { await close(); throw error; }
}

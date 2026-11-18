import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createBrowser } from './browser/harness.mjs';
import { checkScreenshot } from './browser/jpeg.mjs';

const base = process.argv[2] || 'http://localhost:8123';
const shots = JSON.parse(readFileSync(new URL('../shots.json', import.meta.url)));
const browser = await createBrowser(), { call, evaluate, until, errors } = browser;
try {
  await call('Runtime.enable'); await call('Network.enable'); await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await call('Page.bringToFront');
  for (const shot of shots) {
    await call('Page.navigate', { url: base + '/' + shot.query });
    await until(`location.search === ${JSON.stringify(shot.query)} && document.documentElement.dataset.shotReady === 'true' && window.inkward?.post.frames > 0`);
    await evaluate('document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))');
    let bytes, quality = 90;
    do {
      const capture = await call('Page.captureScreenshot', { format: 'jpeg', quality, captureBeyondViewport: false });
      bytes = Buffer.from(capture.data, 'base64');
      if (bytes.length <= 256 * 1024) break;
      quality -= 3;
    } while (quality >= 60);
    const dimensions = checkScreenshot(bytes);
    writeFileSync(new URL('../screenshots/' + shot.name, import.meta.url), bytes);
    Object.assign(shot, dimensions, { bytes: bytes.length, quality });
    console.log(`${shot.name}: ${dimensions.width}×${dimensions.height}, ${bytes.length} bytes, JPEG ${quality}`);
  }
  assert.deepEqual(errors, [], 'Capture has no browser errors');
  writeFileSync(new URL('../shots.json', import.meta.url), JSON.stringify(shots, null, 2) + '\n');
} finally { await browser.close(); }

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkScreenshot } from './browser/jpeg.mjs';

const root = dirname(fileURLToPath(new URL('../main.ts', import.meta.url)));
const workspace = mkdtempSync(join(tmpdir(), 'inkward-repro-'));
const outputs = ['first', 'second'].map(name => join(workspace, name));
for (const output of outputs) {
  const build = spawnSync(process.execPath, ['main.ts'], { cwd: root, env: { ...process.env, MAKEFUN_OUTPUT_DIR: output }, encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr || build.stdout);
}
function files(directory, base = directory) {
  return readdirSync(directory).sort().flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path, base) : [relative(base, path)];
  });
}
const first = files(outputs[0]), second = files(outputs[1]);
assert.deepEqual(first, second, 'Independent outputs contain exactly the same files');
const hash = createHash('sha256');
let bytes = 0;
for (const path of first) {
  const a = readFileSync(join(outputs[0], path)), b = readFileSync(join(outputs[1], path));
  assert.ok(a.equals(b), `${path} is byte-identical`);
  hash.update(path).update('\0').update(a); bytes += a.length;
}
const shots = JSON.parse(readFileSync(join(root, 'shots.json')));
assert.equal(shots.length, 4);
for (const shot of shots) {
  const data = readFileSync(join(outputs[0], 'screenshots', shot.name));
  assert.deepEqual(checkScreenshot(data), { width: shot.width, height: shot.height });
  assert.equal(data.length, shot.bytes, 'Screenshot metadata matches packaged bytes');
}
const report = {
  schema: 'inkward-verification/v1',
  method: 'Two independent MAKEFUN_OUTPUT_DIR builds; compare every path and every byte, including dossier.json and all four JPEGs.',
  files: first.length, bytes, sha256: hash.digest('hex'),
  screenshots: shots.map(({name, width, height, bytes}) => ({name, width, height, bytes})),
};
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n');
console.log(`Package OK: ${report.files} byte-identical files (${bytes} bytes); SHA-256 ${report.sha256}`);
console.log(`Both verified builds: ${outputs.join(' and ')}`);

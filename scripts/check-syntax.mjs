import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../game', import.meta.url));
function modules(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? modules(file) : /\.m?js$/.test(file) ? [file] : [];
  });
}
const files = modules(root);
for (const file of files) {
  const result = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: readFileSync(file), encoding: 'utf8' });
  if (result.status !== 0) { process.stderr.write(`${file}\n${result.stderr}`); process.exit(1); }
}
console.log(`Syntax OK: ${files.length} ES modules`);

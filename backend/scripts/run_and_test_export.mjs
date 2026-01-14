import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const outDir = path.join(ROOT, 'tmp');
if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'alumnos_test.xlsx');

function waitForHealth(url = 'http://127.0.0.1:4300/_health', retries = 30, delay = 500) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const check = async () => {
      try {
        const res = await fetch(url);
        if(res.ok) return resolve(true);
      } catch (e) {
        // ignore
      }
      tries++;
      if(tries >= retries) return reject(new Error('health check timeout'));
      setTimeout(check, delay);
    };
    check();
  });
}

async function run() {
  const child = spawn(process.execPath, ['app.mjs'], { cwd: ROOT, stdio: ['ignore','pipe','pipe'] });
  child.stdout.on('data', (d) => process.stdout.write(`[child stdout] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[child stderr] ${d}`));

  try {
    await waitForHealth();
    console.log('Server is healthy, requesting export...');
    const url = 'http://127.0.0.1:4300/api/alumnos/sections/1/students/export?teacherId=2&format=xlsx';
    const res = await fetch(url);
    console.log('status', res.status);
    console.log('content-type', res.headers.get('content-type'));
    console.log('content-disposition', res.headers.get('content-disposition'));
    if(!res.ok) throw new Error('export request failed');
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outFile, buf);
    console.log('Saved', outFile, 'size', buf.length);
    console.log('Head bytes:', buf.slice(0,8).toString('hex'));
  } catch (e) {
    console.error('Error during test:', e.message);
    process.exitCode = 1;
  } finally {
    try { child.kill('SIGTERM'); } catch (e) {}
  }
}

run();

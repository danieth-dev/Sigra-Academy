import { spawn } from 'child_process';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../');
const backendDir = path.join(repoRoot, 'backend');
const healthUrl = 'http://127.0.0.1:4300/_health';

function waitForHealth(url, timeoutMs = 30000, interval = 500){
    return new Promise((resolve, reject) => {
        const start = Date.now();
        (async function tick(){
            try{
                const req = http.get(url, (res)=>{
                    let data=''; res.on('data', d=>data+=d); res.on('end', ()=>{ if(res.statusCode===200 && String(data).trim().toLowerCase()==='ok') return resolve(true); });
                });
                req.on('error', ()=>{});
                req.setTimeout(1500, () => req.abort());
            }catch(e){}
            if(Date.now() - start >= timeoutMs) return resolve(false);
            await new Promise(r => setTimeout(r, interval));
            tick();
        })();
    });
}

async function tryStart(){
    console.log('Checking backend health...');
    const healthy = await waitForHealth(healthUrl, 1000, 200);
    if(healthy){
        console.log('Backend already healthy. No action needed.');
        return;
    }

    console.log('Starting backend via `pnpm run dev` if available, otherwise `node app.mjs`...');

    // Try pnpm (preferred)
    let child = null;
    // Check if pnpm is available first
    const { spawnSync } = await import('child_process');
    const check = spawnSync('pnpm', ['-v'], { cwd: repoRoot, env: process.env });
    if(check.status === 0){
        console.log('pnpm found. Starting backend with pnpm...');
        child = spawn('pnpm', ['--filter','backend','run','dev'], { cwd: repoRoot, env: process.env, stdio: ['ignore','pipe','pipe'] });
    } else {
        console.log('pnpm not found, falling back to node app.mjs');
        child = spawn(process.execPath, [path.join(backendDir,'app.mjs')], { cwd: backendDir, env: process.env, stdio: ['ignore','pipe','pipe'] });
    }

    child.stdout.on('data', d => process.stdout.write(`[backend] ${d}`));
    child.stderr.on('data', d => process.stderr.write(`[backend] ${d}`));

    const ok = await waitForHealth(healthUrl, 30000, 500);
    if(ok) console.log('Backend is healthy and reachable.');
    else console.warn('Backend did not become healthy within timeout. Check logs above.');

    // Keep process open so user can see logs; advise how to stop
    console.log('\nTip: to stop the backend, press Ctrl+C in this terminal.');
}

tryStart().catch(e => { console.error('Failed to start backend helper:', e); process.exit(1); });

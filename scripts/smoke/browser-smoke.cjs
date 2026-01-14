const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const WAIT = (ms) => new Promise(r => setTimeout(r, ms));

async function runPage(filePath, pageName){
    console.log(`\n--- Loading ${pageName} -> ${filePath}`);
    // Read the HTML and rewrite local relative resource paths to file:// URIs so jsdom can load them
    const { pathToFileURL } = require('url');
    let html = fs.readFileSync(filePath, 'utf-8');
    const baseDir = path.dirname(filePath);
    // css/ and /css/ -> file://<baseDir>/css/...
    html = html.replace(/href="\/?css\/([^"\s]+)"/g, (m, p1) => `href="${pathToFileURL(path.join(baseDir, 'css', p1)).href}"`);
    // js/ and /js/ -> file://<baseDir>/js/...
    html = html.replace(/src="\/?js\/([^"\s]+)"/g, (m, p1) => `src="${pathToFileURL(path.join(baseDir, 'js', p1)).href}"`);

    const dom = new JSDOM(html, {
        runScripts: 'dangerously',
        resources: 'usable',
        pretendToBeVisual: true,
        url: pathToFileURL(filePath).href
    });

    const win = dom.window;
    // Polyfill fetch inside the jsdom window if missing (allow apiFetch to use it)
    try{
        if(typeof win.fetch === 'undefined'){
            if(typeof global.fetch === 'function') win.fetch = global.fetch.bind(global);
            else win.fetch = require('node-fetch');
        }
    }catch(e){ /* ignore if node-fetch missing */ }

    const logs = [];

    // Capture console calls
    ['log','warn','error','info'].forEach(level => {
        const orig = win.console[level].bind(win.console);
        win.console[level] = (...args) => {
            logs.push({level, args});
            try{ orig(...args); }catch(e){}
        };
    });

    // Capture errors and unhandled rejections
    win.addEventListener('error', (e) => { logs.push({level:'error', args:["window.error", e.message, e.error && e.error.stack]}); });
    win.addEventListener('unhandledrejection', (e) => { logs.push({level:'error', args:["unhandledrejection", e.reason && e.reason.message || e.reason]}); });

    // Wait for scripts to run
    await WAIT(1500);

    // Try to call some key functions and record exceptions
    const actions = [];
    const pushAction = async (name, fn) => {
        try{
            await fn();
            actions.push({name, ok:true});
        }catch(err){
            actions.push({name, ok:false, error: (err && err.message) || String(err)});
        }
    };

    // Common actions: render calendar, open recent activities, render tasks, render attendance
    if(win.renderCalendarioVisual) await pushAction('renderCalendarioVisual', async () => win.renderCalendarioVisual());
    if(win.renderRecentActivities) await pushAction('renderRecentActivities', async () => win.renderRecentActivities());
    if(win.renderTareasPendientes) await pushAction('renderTareasPendientes', async () => win.renderTareasPendientes());
    if(win.renderAsistencia) await pushAction('renderAsistencia', async () => win.renderAsistencia());

    // Try calendar open helpers if present
    if(win.openActivityFromCalendar) await pushAction('openActivityFromCalendar(1)', async () => win.openActivityFromCalendar(1));
    if(win.openAttendanceFromCalendar) await pushAction('openAttendanceFromCalendar(1)', async () => win.openAttendanceFromCalendar(1));

    // Wait a bit for any async logs
    await WAIT(800);

    console.log(`\nConsole logs captured for ${pageName}:`);
    logs.forEach(l => console.log(`[${l.level}]`, ...l.args));

    console.log(`\nActions results for ${pageName}:`);
    actions.forEach(a => console.log(a.ok ? 'OK ' : 'FAIL', a.name, a.error ? ('-> ' + a.error) : ''));

    // Cleanup
    dom.window.close && dom.window.close();
}

const { spawn } = require('child_process');
const http = require('http');

async function httpGetRaw(url){
    return new Promise((resolve, reject)=>{
        try{
            const req = http.get(url, (res)=>{
                let data = '';
                res.on('data', d=> data += d);
                res.on('end', ()=> resolve({ statusCode: res.statusCode, body: data }));
            });
            req.on('error', reject);
            req.setTimeout(3000, () => { req.abort(); reject(new Error('timeout')); });
        }catch(err){ reject(err); }
    });
}

async function isHealthy(url){
    try{
        const r = await httpGetRaw(url);
        return r.statusCode === 200 && String(r.body).trim().toLowerCase() === 'ok';
    }catch(e){ return false; }
}

async function waitForHealth(url, timeoutMs = 20000, interval = 500){
    const start = Date.now();
    while(Date.now() - start < timeoutMs){
        if(await isHealthy(url)) return true;
        await WAIT(interval);
    }
    return false;
}

async function killProcess(child, timeoutMs = 5000){
    return new Promise((resolve) => {
        if(!child || child.killed) return resolve();
        let finished = false;
        const onExit = () => { if(!finished){ finished = true; resolve(); } };
        child.once('exit', onExit);
        try{ child.kill('SIGTERM'); }catch(e){}
        // Fallback to SIGKILL after timeout
        setTimeout(()=>{
            if(!finished){
                try{ child.kill('SIGKILL'); }catch(e){}
            }
        }, timeoutMs);
    });
}

async function trySpawn(cmd, args, cwd){
    return new Promise((resolve, reject)=>{
        let child;
        try{
            child = spawn(cmd, args, { cwd, env: Object.assign({}, process.env), stdio: ['ignore','pipe','pipe'] });
        }catch(err){ return reject(err); }
        child.stdout.on('data', d => process.stdout.write(`[backend] ${d}`));
        child.stderr.on('data', d => process.stderr.write(`[backend] ${d}`));

        // If process emits an 'error' or exits quickly, treat as failure
        const onError = (err) => {
            cleanup();
            reject(err || new Error('spawn failed'));
        };
        const onExit = (code, sig) => {
            cleanup();
            reject(new Error(`process exited early (code=${code}, sig=${sig})`));
        };

        const cleanup = () => {
            child.removeListener('error', onError);
            child.removeListener('exit', onExit);
            if(aliveTimer) clearTimeout(aliveTimer);
        };

        // If the process is still alive after grace period, consider it started
        const aliveTimer = setTimeout(()=>{
            child.removeListener('error', onError);
            child.removeListener('exit', onExit);
            resolve(child);
        }, 600);

        child.once('error', onError);
        child.once('exit', onExit);
    });
}

async function ensureBackendRunning(){
    const healthUrl = 'http://127.0.0.1:4300/_health';
    if(await isHealthy(healthUrl)) return { child: null, alreadyRunning: true };

    console.log('Starting backend via pnpm (preferred)...');
    const repoRoot = path.resolve(__dirname, '../..');
    let child = null;

    // Try pnpm first
    try{
        child = await trySpawn('pnpm', ['--filter','backend','run','dev'], repoRoot);
        const ok = await waitForHealth(healthUrl, 40000, 500);
        if(!ok){
            console.warn('pnpm start did not produce a healthy backend in time; killing and trying fallback');
            await killProcess(child);
            child = null;
        }else{
            console.log('Backend healthy (started via pnpm).');
            return { child, alreadyRunning: false };
        }
    }catch(err){
        if(child){ try{ await killProcess(child); }catch(e){} }
        // Continue to fallback
        console.warn('pnpm start failed, falling back to node app.mjs:', err.message);
    }

    // Fallback: start directly with node
    try{
        console.log('Starting backend via node backend/app.mjs (fallback)...');
        child = await trySpawn(process.execPath, [path.resolve(repoRoot, 'backend', 'app.mjs')], repoRoot);
        const ok = await waitForHealth(healthUrl, 30000, 500);
        if(!ok){
            await killProcess(child);
            throw new Error('Backend failed to become healthy within timeout (fallback)');
        }
        console.log('Backend healthy (started via node app.mjs).');
        return { child, alreadyRunning: false };
    }catch(err){
        if(child) try{ await killProcess(child); }catch(e){}
        throw new Error('Backend failed to start: ' + err.message);
    }
}

(async ()=>{
    let backendProc = null;
    let alreadyRunning = false;
    try{
        const studentPath = path.resolve(__dirname, '../../frontend/Modules/teaching-manager-IV/estudiante.html');
        const profPath = path.resolve(__dirname, '../../frontend/Modules/teaching-manager-IV/profesor.html');

        if(!fs.existsSync(studentPath)) throw new Error('estudiante.html not found: ' + studentPath);
        if(!fs.existsSync(profPath)) throw new Error('profesor.html not found: ' + profPath);

        // Ensure the backend server is running (start it if needed)
        const srv = await ensureBackendRunning();
        backendProc = srv.child;
        alreadyRunning = srv.alreadyRunning;

        await runPage(studentPath, 'Estudiante');
        await runPage(profPath, 'Profesor');

        console.log('\nSmoke tests finished.');
        // Graceful shutdown of spawned backend
        if(backendProc && !alreadyRunning){
            console.log('Stopping spawned backend...');
            backendProc.kill();
            await WAIT(400);
        }
        process.exit(0);
    }catch(e){
        console.error('Fatal error running smoke tests:', e);
        if(backendProc && !alreadyRunning){
            try{ backendProc.kill(); }catch(e){}
        }
        process.exit(2);
    }
})();
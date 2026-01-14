const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const WAIT = (ms) => new Promise(r => setTimeout(r, ms));

async function runPage(filePath, pageName){
    console.log(`\n--- Loading ${pageName} -> ${filePath}`);
    const dom = await JSDOM.fromFile(filePath, {
        runScripts: 'dangerously',
        resources: 'usable',
        pretendToBeVisual: true,
        url: 'http://localhost:4300/'
    });

    const win = dom.window;
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

(async ()=>{
    try{
        const studentPath = path.resolve(__dirname, '../../frontend/Modules/teaching-manager-IV/estudiante.html');
        const profPath = path.resolve(__dirname, '../../frontend/Modules/teaching-manager-IV/profesor.html');

        if(!fs.existsSync(studentPath)) throw new Error('estudiante.html not found: ' + studentPath);
        if(!fs.existsSync(profPath)) throw new Error('profesor.html not found: ' + profPath);

        await runPage(studentPath, 'Estudiante');
        await runPage(profPath, 'Profesor');

        console.log('\nSmoke tests finished.');
        process.exit(0);
    }catch(e){
        console.error('Fatal error running smoke tests:', e);
        process.exit(2);
    }
})();
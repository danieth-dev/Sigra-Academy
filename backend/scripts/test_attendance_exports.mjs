import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const API = 'http://127.0.0.1:4300/api';
const tmp = path.join(path.resolve('./backend'), 'tmp');
if(!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

function waitForHealth(url = 'http://127.0.0.1:4300/_health', retries = 60, delay = 500) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const check = async () => {
      try {
        const res = await fetch(url);
        if(res.ok) return resolve(true);
      } catch (e) {}
      tries++;
      if(tries >= retries) return reject(new Error('health check timeout'));
      setTimeout(check, delay);
    };
    check();
  });
}

async function run(){
  const scriptPath = fileURLToPath(import.meta.url);
  const scriptDir = path.dirname(scriptPath);
  const backendDir = path.resolve(scriptDir, '..');
  const appFile = path.resolve(backendDir, 'app.mjs');

  console.log('Starting backend for test:', appFile);
  const child = spawn(process.execPath, [appFile], { cwd: backendDir, stdio: ['ignore','pipe','pipe'] });
  child.stdout.on('data', d => process.stdout.write(`[child] ${d}`));
  child.stderr.on('data', d => process.stderr.write(`[child err] ${d}`));

  try{
    await waitForHealth();

    const teacherId = 2;
    const secRes = await fetch(`${API}/alumnos/teacher/${teacherId}/sections`);
    const secJson = await secRes.json();
    if(!secRes.ok) throw new Error('No sections');
    const section = secJson.sections && secJson.sections[0];
    if(!section) throw new Error('No section available');
    const sectionId = section.section_id;

    const sessionsRes = await fetch(`${API}/attendance/sections/${sectionId}/sessions`);
    const sessionsJson = await sessionsRes.json();
    if(!sessionsRes.ok) throw new Error('No sessions');
    const session = sessionsJson.sessions && sessionsJson.sessions[0];
    if(session){
      const sessionId = session.session_id;
      const url = `${API}/attendance/sessions/${sessionId}/export?format=xlsx`;
      const res = await fetch(url);
      console.log('/sessions export status', res.status, res.headers.get('content-type'));
      const buf = Buffer.from(await res.arrayBuffer());
      const out = path.join(tmp, `session_${sessionId}.xlsx`);
      fs.writeFileSync(out, buf);
      console.log('Saved', out, 'size', buf.length, 'head', buf.slice(0,8).toString('hex'));
    } else {
      console.log('No sessions to test session export.');
    }

    // Section report export
    const url2 = `${API}/attendance/sections/${sectionId}/report/export?format=xlsx`;
    const r2 = await fetch(url2);
    console.log('/sections report export status', r2.status, r2.headers.get('content-type'));
    const b2 = Buffer.from(await r2.arrayBuffer());
    const out2 = path.join(tmp, `section_${sectionId}_report.xlsx`);
    fs.writeFileSync(out2, b2);
    console.log('Saved', out2, 'size', b2.length, 'head', b2.slice(0,8).toString('hex'));

  }catch(e){ console.error('Error test exports', e); process.exit(1); }
  finally{ try{ child.kill('SIGTERM'); }catch(e){} }
  process.exit(0);
}

run();
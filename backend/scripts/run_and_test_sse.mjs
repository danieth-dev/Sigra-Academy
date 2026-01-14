import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  const metaUrl = import.meta.url;
  const scriptPath = fileURLToPath(metaUrl);
  const scriptDir = path.dirname(scriptPath);
  const backendDir = path.resolve(scriptDir, '..');
  const appFile = path.resolve(backendDir, 'app.mjs');

  console.log('metaUrl:', metaUrl);
  console.log('scriptPath:', JSON.stringify(scriptPath));
  console.log('scriptDir:', JSON.stringify(scriptDir));
  console.log('backendDir:', JSON.stringify(backendDir));
  console.log('appFile:', JSON.stringify(appFile));

  const child = spawn(process.execPath, [appFile], { cwd: backendDir, stdio: ['ignore','pipe','pipe'] });
  child.stdout.on('data', d => process.stdout.write(`[child] ${d}`));
  child.stderr.on('data', d => process.stderr.write(`[child err] ${d}`));

  try{
    await waitForHealth();
    console.log('Server up. Starting SSE test...');

    // choose teacher and student ids known in mocks
    const teacherId = 2;
    const studentId = 3; // Luis Ramírez

    // 1) get teacher assignments
    const secRes = await fetch(`http://127.0.0.1:4300/api/assignments/teacher/${teacherId}`);
    const secJson = await secRes.json();
    const assignment = secJson.assignments && secJson.assignments[0];
    if(!assignment) { console.log('No assignments found for teacher', teacherId); return; }
    const assignmentId = assignment.assignment_id;

    // 2) start SSE connection
    const sseUrl = `http://127.0.0.1:4300/api/notifications/stream?user_id=${studentId}`;
    const res = await fetch(sseUrl);
    if(!res.ok) throw new Error('SSE connection failed: ' + res.status);
    const reader = res.body.getReader();

    let sseAttendanceWeekly = false;
    let sseAttendanceDaily = false;
    let sseActivity = false;
    const decoder = new TextDecoder();

    // start reading in background (single reader handles all events)
    (async () => {
      let buf = '';
      while(true){
        const { value, done } = await reader.read();
        if(done) break;
        buf += decoder.decode(value, { stream: true });
        // parse simple SSE messages
        const parts = buf.split("\n\n");
        while(parts.length > 1){
          const msg = parts.shift();
          buf = parts.join('\n\n');
          if(msg.includes('event: attendance_created')){
            const m = msg.match(/data:\s*(\{[\s\S]*\})/m);
            if(m){
              try{
                const o = JSON.parse(m[1]);
                if(o && o.session && o.session.frequency === 'daily'){
                  console.log('Received attendance_created (daily) event:', m[1]);
                  sseAttendanceDaily = true;
                }else{
                  console.log('Received attendance_created (weekly) event:', m[1]);
                  sseAttendanceWeekly = true;
                }
              }catch(e){ console.log('Received attendance_created (unparsed):', m[1]); sseAttendanceWeekly = true; }
            }
          }
          if(msg.includes('event: activity_created')){
            const m = msg.match(/data:\s*(\{[\s\S]*\})/m);
            if(m){
              console.log('Received activity_created event:', m[1]);
              sseActivity = true;
            }
          }
        }
      }
    })();

    // 3) create a weekly session to trigger notification
    const now = new Date();
    const tomorrow = new Date(Date.now() + 24*3600*1000);
    const createRes = await fetch('http://127.0.0.1:4300/api/attendance/sessions', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ assignment_id: assignmentId, week_number: 99, open_date: now.toISOString(), close_date: tomorrow.toISOString(), created_by: teacherId, frequency: 'weekly' }) });
    const createJson = await createRes.json();
    console.log('Created weekly session response:', createRes.status, createJson);

    // wait up to 5 seconds for attendance SSE (weekly)
    const start = Date.now();
    while(Date.now() - start < 5000){ if(sseAttendanceWeekly) break; await new Promise(r => setTimeout(r, 200)); }
    if(sseAttendanceWeekly) console.log('SSE test successful: attendance_created received (weekly)'); else console.warn('SSE test failed: no attendance_created event received (weekly)');

    // 3b) create a DAILY session to trigger notification (the same reader will catch it)
    const createRes2 = await fetch('http://127.0.0.1:4300/api/attendance/sessions', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ assignment_id: assignmentId, open_date: now.toISOString(), close_date: tomorrow.toISOString(), created_by: teacherId, frequency: 'daily' }) });
    const createJson2 = await createRes2.json();
    console.log('Created DAILY session response:', createRes2.status, createJson2);

    const startDaily = Date.now();
    while(Date.now() - startDaily < 5000){ if(sseAttendanceDaily) break; await new Promise(r => setTimeout(r, 200)); }
    if(sseAttendanceDaily) console.log('SSE test successful: attendance_created received (daily)'); else console.warn('SSE test failed: no attendance_created event received (daily)');

    // 4) create an activity to trigger activity_created
    const due = new Date(Date.now() + 3*24*3600*1000);
    const actRes = await fetch('http://127.0.0.1:4300/api/assignments/activities', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ assignment_id: assignmentId, title: 'Prueba SSE', weight_percentage: 10, due_date: due.toISOString() }) });
    const actJson = await actRes.json();
    console.log('Created activity response:', actRes.status, actJson);

    // wait up to 5 seconds for activity SSE
    const start2 = Date.now();
    while(Date.now() - start2 < 5000){ if(sseActivity) break; await new Promise(r => setTimeout(r, 200)); }
    if(sseActivity) console.log('SSE test successful: activity_created received'); else console.warn('SSE test failed: no activity_created event received');

  }catch(e){ console.error('SSE test error', e); process.exitCode = 1; }
  finally{
    try{ if(reader && typeof reader.cancel === 'function') await reader.cancel(); }catch(e){}
    try{ child.kill('SIGTERM'); }catch(e){}
  }
}

run();

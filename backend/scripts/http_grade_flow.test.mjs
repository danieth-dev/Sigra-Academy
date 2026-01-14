import fs from 'fs';
import path from 'path';

async function run(){
  try{
    console.log('Grade flow test start');
    // 1) Create activity
    const createRes = await fetch('http://localhost:4300/api/assignments/activities', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment_id: 1, title: 'Grade Flow Activity', description: 'For tests', weight_percentage: 10, due_date: '2026-12-31' })
    });
    const createJson = await createRes.json();
    console.log('Create activity status', createRes.status);
    if(!createRes.ok) throw new Error('Create activity failed');
    const activityId = createJson.activity.activity_id;

    // 2) Create submission
    const uploadDir = path.resolve('uploads/submissions');
    fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, `grade_test_${Date.now()}.txt`);
    fs.writeFileSync(filePath, 'Grade test file');
    const fd = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    fd.append('file', blob, path.basename(filePath));
    fd.append('activity_id', String(activityId));
    fd.append('student_user_id', '3');
    const uploadRes = await fetch('http://localhost:4300/api/assignments/submissions', { method: 'POST', body: fd });
    const uploadJson = await uploadRes.json();
    console.log('Upload status', uploadRes.status);
    if(!uploadRes.ok) throw new Error('Upload failed');

    // 3) POST grade
    const gradeRes = await fetch('http://localhost:4300/api/grades-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activity_id: activityId, student_user_id: 3, score: 14 }) });
    const gradeJson = await gradeRes.json();
    console.log('Grade post status', gradeRes.status, gradeJson.message || '');
    if(!gradeRes.ok) throw new Error('Grade post failed');

    // 4) GET grades by activity (small delay to avoid race with DB replication/visibility)
    await new Promise(r => setTimeout(r, 250));
    const gres = await fetch(`http://localhost:4300/api/grades-log/activity/${activityId}`);
    const gjson = await gres.json();
    console.log('Get grades status', gres.status, gjson.message || '');
    if(!gres.ok) throw new Error('Get grades failed');
    const found = (gjson.grades || []).find(g => g.student_user_id == 3 && Number(g.score) === 14);
    if(!found) throw new Error('Grade not found or mismatch');
    console.log('Grade flow test completed successfully');
  }catch(e){
    console.error('Grade test error', e.message);
    process.exit(1);
  }
}
run();

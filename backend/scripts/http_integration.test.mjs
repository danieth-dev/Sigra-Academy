import fs from 'fs';
import path from 'path';

async function run(){
  try{
    console.log('HTTP integration test start');
    // 1) Create activity via API
    const createRes = await fetch('http://localhost:4300/api/assignments/activities', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment_id: 1, title: 'HTTP Integration Activity', description: 'Created via http test', weight_percentage: 5, due_date: '2026-01-30' })
    });
    const createJson = await createRes.json();
    console.log('Create activity status', createRes.status, createJson);
    if(!createRes.ok) throw new Error('Create activity failed');
    const activityId = createJson.activity.activity_id;

    // 2) Create a temp file in uploads
    const uploadDir = path.resolve('uploads/submissions');
    fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, `http_test_${Date.now()}.txt`);
    fs.writeFileSync(filePath, 'HTTP integration test file');

    // 3) Upload file via multipart/form-data
    const fd = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    fd.append('file', blob, path.basename(filePath));
    fd.append('activity_id', String(activityId));
    fd.append('student_user_id', '3');

    const uploadRes = await fetch('http://localhost:4300/api/assignments/submissions', { method: 'POST', body: fd });
    const uploadJson = await uploadRes.json();
    console.log('Upload status', uploadRes.status, uploadJson);
    if(!uploadRes.ok) throw new Error('Upload failed');
    const submissionId = uploadJson.submission.submission_id;

    // 4) Fetch submissions for activity
    const subsRes = await fetch(`http://localhost:4300/api/assignments/activity/${activityId}/submissions`);
    const subsJson = await subsRes.json();
    console.log('Submissions list:', subsRes.status, JSON.stringify(subsJson, null, 2));

    // 5) Cleanup: delete submission
    const delSubRes = await fetch(`http://localhost:4300/api/assignments/submissions/${submissionId}`, { method: 'DELETE' });
    console.log('Delete submission status', delSubRes.status, await delSubRes.json());

    // 6) Delete activity
    const delActRes = await fetch(`http://localhost:4300/api/assignments/activities/${activityId}`, { method: 'DELETE' });
    console.log('Delete activity status', delActRes.status, await delActRes.json());

    // remove temp file if still exists
    if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.log('HTTP integration test completed successfully');
  }catch(e){
    console.error('HTTP test error', e.message);
    process.exit(1);
  }
}

run();
import fs from 'fs';
import path from 'path';

async function run(){
  try{
    console.log('Delete-after-due-date test start');
    // 1) Create activity with past due_date
    const pastDate = '2020-01-01';
    const createRes = await fetch('http://localhost:4300/api/assignments/activities', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment_id: 1, title: 'Past Activity', description: 'Past due test', weight_percentage: 5, due_date: pastDate })
    });
    const createJson = await createRes.json();
    console.log('Create activity status', createRes.status, createJson);
    if(!createRes.ok) throw new Error('Create activity failed');
    const activityId = createJson.activity.activity_id;

    // 2) Create and upload a submission
    const uploadDir = path.resolve('uploads/submissions');
    fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, `past_test_${Date.now()}.txt`);
    fs.writeFileSync(filePath, 'Past due test file');

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

    // 3) Attempt to delete submission (should be denied due to past due_date)
    const delSubRes = await fetch(`http://localhost:4300/api/assignments/submissions/${submissionId}`, { method: 'DELETE' });
    const delSubJson = await delSubRes.json();
    console.log('Delete submission status', delSubRes.status, delSubJson);
    if(delSubRes.status === 200) throw new Error('Submission was deleted despite due date passed');
    if(delSubRes.status !== 400) throw new Error('Expected 400 when deleting after due date');

    // Cleanup: delete activity (force remove submissions first if any) - try to remove submission by DB cleanup if delete API denied
    // We'll attempt to delete the activity; if it fails due to submissions, log it and exit successfully because it's the expected behaviour
    const delActRes = await fetch(`http://localhost:4300/api/assignments/activities/${activityId}`, { method: 'DELETE' });
    console.log('Delete activity status', delActRes.status, await delActRes.json());

    // remove temp file if still exists
    if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.log('Delete-after-due-date test completed successfully');
  }catch(e){
    console.error('Test error', e.message);
    process.exit(1);
  }
}

run();

import fs from 'fs';
import path from 'path';
import { ActivitiesModel, SubmissionsModel } from '../src/modules/teaching-manager-IV/asignaciones/asignaciones.model.mjs';
import { db } from '../database/db.database.mjs';

async function ensureUploadFile(){
  const uploadDir = path.resolve('uploads/submissions');
  fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, `integration_test_${Date.now()}.txt`);
  fs.writeFileSync(filePath, 'integration test content');
  return filePath;
}

(async ()=>{
  try{
    console.log('Starting integration test...');
    // create activity under assignment_id 1
    const activityPayload = {
      assignment_id: 1,
      title: 'Integration Test Activity',
      description: 'Created by automated integration test',
      weight_percentage: 10,
      due_date: '2026-01-20'
    };
    const createAct = await ActivitiesModel.create(activityPayload);
    console.log('Create activity response:', createAct);
    if(createAct.error){
      console.error('Activity creation failed, aborting test');
      process.exit(1);
    }
    const activityId = createAct.activity.activity_id;

    // prepare dummy file
    const filePath = await ensureUploadFile();
    const relPath = '/uploads/submissions/' + path.basename(filePath);

    // create submission for student 3
    const submissionPayload = {
      activity_id: activityId,
      student_user_id: 3,
      file_path: relPath,
      comments: 'Integration test submission'
    };
    const createSub = await SubmissionsModel.create(submissionPayload);
    console.log('Create submission response:', createSub);
    if(createSub.error){
      console.error('Submission creation failed');
      process.exit(1);
    }

    // verify getByActivity
    const subs = await SubmissionsModel.getByActivity(activityId);
    console.log('Submissions for activity:', subs);

    // cleanup: delete submission record and file
    const createdId = createSub.submission.submission_id;
    const del = await SubmissionsModel.delete(createdId);
    console.log('Deleted submission:', del);

    // cleanup: delete activity
    const delAct = await ActivitiesModel.delete(activityId);
    console.log('Deleted activity:', delAct);

    console.log('Integration test completed successfully.');
    process.exit(0);
  }catch(e){
    console.error('Integration test error:', e);
    process.exit(1);
  }
})();
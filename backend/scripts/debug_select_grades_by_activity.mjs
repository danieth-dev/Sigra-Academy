import { db } from '../database/db.database.mjs';

(async ()=>{
  try{
    const activityId = 20;
    const [rows] = await db.query(
      `SELECT gl.grade_id, gl.student_user_id, CONCAT(u.first_name, ' ', u.last_name) AS student_name,
      gl.score, gl.feedback, a.title, s.section_name, su.subject_name FROM grades_log gl 
      JOIN users u ON gl.student_user_id = u.user_id
      JOIN activities a ON gl.activity_id = a.activity_id
      JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id
      JOIN sections s ON ta.section_id = s.section_id
      JOIN subjects su ON ta.subject_id = su.subject_id
      WHERE gl.activity_id = ?`, [activityId]
    );
    console.log('query rows:', rows);
    process.exit(0);
  }catch(e){ console.error('ERR', e); process.exit(1); }
})();
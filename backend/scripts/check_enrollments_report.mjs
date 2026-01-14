import { db } from '../database/db.database.mjs';

async function run(){
  try{
    const [rows] = await db.query(`SELECT u.user_id, CONCAT(u.first_name,' ',u.last_name) AS nombre, IFNULL(e.c,0) as enroll_count FROM users u JOIN roles r ON r.role_id = u.role_id LEFT JOIN (SELECT student_user_id, COUNT(*) as c FROM enrollments GROUP BY student_user_id) e ON e.student_user_id = u.user_id WHERE LOWER(r.role_name) IN ('estudiante','student')`);
    console.log('Total students:', rows.length);
    const lessThan5 = rows.filter(r => r.enroll_count < 5);
    console.log('Students with <5 enrollments:', lessThan5.length);
    console.table(lessThan5.slice(0,20));
  }catch(e){ console.error(e); process.exit(1); }
  process.exit(0);
}
run();
import { db } from '../database/db.database.mjs';

(async ()=>{
  try{
    const [rows] = await db.query('SELECT * FROM grades_log ORDER BY grade_id DESC LIMIT 10');
    console.log('grades_log recent:', rows);
    process.exit(0);
  }catch(e){
    console.error('ERR', e);
    process.exit(1);
  }
})();
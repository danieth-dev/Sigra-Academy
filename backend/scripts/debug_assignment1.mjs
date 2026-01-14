import { db } from '../database/db.database.mjs';

(async ()=>{
  try{
    const [rows] = await db.query('SELECT * FROM teacher_assignments WHERE assignment_id = 1');
    console.log('assignment 1:', rows);
    process.exit(0);
  }catch(e){
    console.error('ERR', e);
    process.exit(1);
  }
})();
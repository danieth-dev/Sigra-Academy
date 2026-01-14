import { db } from '../database/db.database.mjs';

(async ()=>{
  try{
    const [s] = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('attendance_sessions','attendance_records')`);
    console.log('found tables:', s.map(r => r.table_name ?? r.TABLE_NAME ?? Object.values(r)[0]));
    process.exit(0);
  }catch(e){
    console.error('error checking tables', e);
    process.exit(1);
  }
})();
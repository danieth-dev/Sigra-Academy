import { db } from '../database/db.database.mjs';

async function run(){
  try{
    const [cols] = await db.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teacher_assignments' AND COLUMN_NAME = 'professor_id'`);
    if(cols.length === 0){
      console.log('Column professor_id does not exist; nothing to do.');
      process.exit(0);
    }

    // Safe drop: ensure no code depends on it (we already reverted code). Drop column.
    await db.query(`ALTER TABLE teacher_assignments DROP COLUMN professor_id`);
    console.log('Column professor_id dropped from teacher_assignments.');
    // Remove index if present
    const [idx] = await db.query(`SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teacher_assignments' AND INDEX_NAME = 'idx_professor_id'`);
    if(idx.length > 0){
      await db.query(`ALTER TABLE teacher_assignments DROP INDEX idx_professor_id`);
      console.log('Index idx_professor_id dropped.');
    }

    process.exit(0);
  }catch(e){ console.error('Error removing column:', e.message || e); process.exit(1); }
}

run();
import { db } from '../database/db.database.mjs';

async function run(){
  try{
    // Add column if not exists (check INFORMATION_SCHEMA)
    const [cols] = await db.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teacher_assignments' AND COLUMN_NAME = 'professor_id'`);
    if(cols.length === 0){
      await db.query(`ALTER TABLE teacher_assignments ADD COLUMN professor_id INT NULL`);
      console.log('Column professor_id added.');
    } else {
      console.log('Column professor_id already exists.');
    }

    // Populate professor_id from professors table when user_id matches
    await db.query(`UPDATE teacher_assignments ta JOIN professors p ON p.user_id = ta.teacher_user_id SET ta.professor_id = p.professor_id WHERE ta.professor_id IS NULL`);

    // Add an index for faster lookups if missing
    const [idx] = await db.query(`SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teacher_assignments' AND INDEX_NAME = 'idx_professor_id'`);
    if(idx.length === 0){
      await db.query(`ALTER TABLE teacher_assignments ADD INDEX idx_professor_id (professor_id)`);
      console.log('Index idx_professor_id created.');
    } else {
      console.log('Index idx_professor_id already exists.');
    }

    console.log('Migration add_professor_id_to_teacher_assignments completed.');
    process.exit(0);
  }catch(e){ console.error('Error in migration:', e.message || e); process.exit(1); }
}

run();

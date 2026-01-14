import { db } from '../database/db.database.mjs';

(async ()=>{
    try{
        const [rows] = await db.query("SHOW COLUMNS FROM attendance_sessions LIKE 'frequency'");
        if(rows.length > 0){
            console.log('frequency column already exists on attendance_sessions');
            process.exit(0);
        }
        console.log('Adding frequency column to attendance_sessions (default: weekly)');
        await db.query(`ALTER TABLE attendance_sessions ADD COLUMN frequency ENUM('weekly','daily') NOT NULL DEFAULT 'weekly'`);
        console.log('Column added successfully');
        process.exit(0);
    }catch(err){
        console.error('Migration error:', err);
        process.exit(2);
    }
})();
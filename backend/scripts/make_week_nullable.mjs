import { db } from '../database/db.database.mjs';

(async ()=>{
    try{
        const [cols] = await db.query("SHOW COLUMNS FROM attendance_sessions LIKE 'week_number'");
        if(cols.length === 0){
            console.log('week_number column not present');
            process.exit(0);
        }
        if(cols[0].Null === 'YES'){
            console.log('week_number already nullable');
            process.exit(0);
        }
        console.log('Making week_number column nullable');
        await db.query('ALTER TABLE attendance_sessions MODIFY week_number INT NULL');
        console.log('week_number is now nullable');
        process.exit(0);
    }catch(err){
        console.error('Error updating week_number nullability:', err);
        process.exit(2);
    }
})();
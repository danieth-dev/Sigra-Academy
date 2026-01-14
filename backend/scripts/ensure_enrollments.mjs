import { db } from '../database/db.database.mjs';

// Usage: node scripts/ensure_enrollments.mjs [perStudent] [--dry-run]
const perStudent = Number(process.argv[2]) || 3;
const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-n');

async function run(){
  try{
    // Get role id for 'Estudiante' or 'student' (support different role naming)
    const [roles] = await db.query(`SELECT role_id FROM roles WHERE LOWER(role_name) IN ('estudiante','student') LIMIT 1`);
    const roleId = roles[0] ? roles[0].role_id : null;
    if(!roleId) {
      console.error('No se encontró rol Estudiante o student. Roles presentes:');
      const [allRoles] = await db.query(`SELECT role_id, role_name FROM roles`);
      console.table(allRoles);
      return process.exit(2);
    }

    const [students] = await db.query(`SELECT user_id FROM users WHERE role_id = ?`, [roleId]);
    const [sections] = await db.query(`SELECT section_id FROM sections`);
    if(sections.length === 0) return console.error('No se encontraron secciones en la BD.');

    let secIdx = 0;
    let planned = 0;
    for(const s of students){
      const userId = s.user_id;
      const [en] = await db.query(`SELECT COUNT(*) as c FROM enrollments WHERE student_user_id = ?`, [userId]);
      const current = en[0] ? en[0].c : 0;
      let toAssign = perStudent - current;
      while(toAssign > 0){
        const sectionId = sections[secIdx % sections.length].section_id;
        try{
          if(DRY_RUN){
            console.log(`DRY RUN: would assign student ${userId} -> section ${sectionId}`);
            planned++;
          } else {
            await db.query(`INSERT IGNORE INTO enrollments (student_user_id, section_id) VALUES (?, ?)`, [userId, sectionId]);
            console.log(`Asignado student ${userId} -> section ${sectionId}`);
          }
        }catch(e){ console.warn('Skip asignación', e.message); }
        secIdx++;
        toAssign--;
      }
    }

    if(DRY_RUN){
      console.log(`DRY RUN summary: ${planned} assignments would be created.`);
    }

    console.log('Proceso finalizado.');
    process.exit(0);
  }catch(e){ console.error('Error en ensure_enrollments', e); process.exit(1);} 
}

run();

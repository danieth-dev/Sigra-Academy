import { db } from '../database/db.database.mjs';

// Usage: node create_professors_table.mjs [--migrate-users]
const migrate = process.argv.includes('--migrate-users');

async function run(){
  try{
    await db.query(`
      CREATE TABLE IF NOT EXISTS professors (
        professor_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL, -- optional link to users table
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(200),
        bio TEXT,
        created_at DATETIME DEFAULT NOW(),
        updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
        UNIQUE KEY uq_professor_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Tabla professors creada (si no existía).');

    if(migrate){
      const [teachers] = await db.query(`SELECT u.user_id, u.first_name, u.last_name, u.email FROM users u JOIN roles r ON u.role_id = r.role_id WHERE LOWER(r.role_name) IN ('teacher','profesor')`);
      console.log('Profesores detectados en users:', teachers.length);
      for(const t of teachers){
        try{
          await db.query(`INSERT IGNORE INTO professors (user_id, first_name, last_name, email, created_at) VALUES (?, ?, ?, ?, NOW())`, [t.user_id, t.first_name, t.last_name, t.email]);
          console.log('Migrado:', t.first_name, t.last_name);
        }catch(e){ console.warn('Skip migrate', e.message); }
      }
    }

    process.exit(0);
  }catch(e){ console.error('Error creando tabla professors', e); process.exit(1); }
}

run();
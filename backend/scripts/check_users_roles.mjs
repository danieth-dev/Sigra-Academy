import { db } from '../database/db.database.mjs';

async function run(){
  try{
    const [roles] = await db.query(`SELECT role_id, role_name FROM roles`);
    console.log('Roles:', roles);
    const [users] = await db.query(`SELECT user_id, first_name, last_name, email, role_id FROM users`);
    console.log('Users:');
    users.forEach(u => console.log(u));

    // check students by name
    const targetNames = ['Jose Perez','Maria Gonzales','Luis Ramirez','Ana Santos'];
    for(const name of targetNames){
      const [r] = await db.query(`SELECT user_id, first_name, last_name, role_id FROM users WHERE CONCAT(first_name,' ', last_name) = ?`, [name]);
      console.log(name, r.length ? r[0] : 'Not found');
    }

    process.exit(0);
  }catch(e){ console.error('Error', e); process.exit(1);} }

run();
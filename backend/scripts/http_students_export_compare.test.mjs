import { Buffer } from 'buffer';

async function run(){
  try{
    const teacherId = 2;
    const secRes = await fetch(`http://localhost:4300/api/alumnos/teacher/${teacherId}/sections`);
    const secJson = await secRes.json();
    if(!secRes.ok) throw new Error('No sections');
    const section = secJson.sections && secJson.sections[0];
    if(!section) { console.log('No sections found, skipping.'); return; }
    const sectionId = section.section_id || section.assignment_id;

    const studentsRes = await fetch(`http://localhost:4300/api/alumnos/sections/${sectionId}/students?teacherId=${teacherId}&limit=100000`);
    const studentsJson = await studentsRes.json();
    if(!studentsRes.ok) throw new Error('students endpoint failed');
    const studentsCount = (studentsJson.students || []).length;
    console.log('Students endpoint count:', studentsCount, 'total reported:', studentsJson.total);

    const exportRes = await fetch(`http://localhost:4300/api/alumnos/sections/${sectionId}/students/export?teacherId=${teacherId}`);
    if(!exportRes.ok) throw new Error('export endpoint failed');
    const buf = await exportRes.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // Drop BOM if present
    let csv;
    if(bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF){
      csv = new TextDecoder('utf-8').decode(bytes.subarray(3));
    } else {
      csv = new TextDecoder('utf-8').decode(bytes);
    }
    const rows = csv.split(/\r?\n/).filter(r => r.trim() !== '');
    const header = rows.shift();
    console.log('Export CSV rows:', rows.length);

    if(rows.length !== studentsCount){
      throw new Error(`Mismatch: students endpoint ${studentsCount} vs CSV ${rows.length}`);
    }
    console.log('Export and students endpoint match.');
  }catch(e){
    console.error('Test failed:', e.message);
    process.exit(1);
  }
}
run();

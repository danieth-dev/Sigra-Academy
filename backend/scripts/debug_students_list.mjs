(async ()=>{
  try{
    const teacherId = 2;
    const sres = await fetch(`http://localhost:4300/api/alumnos/teacher/${teacherId}/sections`);
    const sjson = await sres.json();
    console.log('Sections:', sjson.sections?.length || 0);
    const section = sjson.sections && sjson.sections[0];
    if(!section){ console.log('No sections'); return; }
    const sectionId = section.section_id || section.assignment_id;

    const res1 = await fetch(`http://localhost:4300/api/alumnos/sections/${sectionId}/students?teacherId=${teacherId}`);
    const j1 = await res1.json();
    console.log('Default query status', res1.status, 'total reported:', j1.total, 'students length:', (j1.students || []).length);

    const res2 = await fetch(`http://localhost:4300/api/alumnos/sections/${sectionId}/students?teacherId=${teacherId}&limit=100000`);
    const j2 = await res2.json();
    console.log('Limit=100000 status', res2.status, 'total reported:', j2.total, 'students length:', (j2.students || []).length);

    const res3 = await fetch(`http://localhost:4300/api/alumnos/sections/${sectionId}/students/export?teacherId=${teacherId}`);
    console.log('/export status', res3.status, 'content-type', res3.headers.get('content-type'));
  }catch(e){ console.error('ERR', e); process.exit(1); }
})();

async function run(){
  try{
    console.log('HTTP export students test start');
    const teacherId = 2;
    // 1) Get sections for teacher
    const secRes = await fetch(`http://localhost:4300/api/alumnos/teacher/${teacherId}/sections`);
    const secJson = await secRes.json();
    console.log('Sections status', secRes.status, secJson.message || '');
    if(!secRes.ok) throw new Error('Failed to fetch sections');
    const sections = secJson.sections || [];
    if(sections.length === 0){ console.log('No sections found for teacher, skipping export test'); return; }
    const sectionId = sections[0].assignment_id ? sections[0].assignment_id : sections[0].section_id;

    // 2) Call export endpoint
    const url = `http://localhost:4300/api/alumnos/sections/${sectionId}/students/export?teacherId=${teacherId}`;
    const res = await fetch(url);
    console.log('Export status', res.status, 'content-type:', res.headers.get('content-type'));
    if(!res.ok){ const text = await res.text(); throw new Error('Export request failed: ' + text); }

    // 3) Validate BOM and header using raw bytes (some fetch implementations strip BOM when decoding to text)
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if(bytes.length === 0) throw new Error('Empty CSV');
    // BOM should be EF BB BF
    if(!(bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF)) throw new Error('Missing UTF-8 BOM at start of CSV');
    // Decode without BOM to check header
    const csv = new TextDecoder('utf-8').decode(bytes.subarray(3));
    const header = csv.split(/\r?\n/)[0];
    if(!/Secci/i.test(header)) throw new Error('CSV header does not include "Sección"');

    console.log('CSV header:', header);
    console.log('HTTP export students test completed successfully');
  }catch(e){
    console.error('HTTP export students test error', e.message);
    process.exit(1);
  }
}

run();

(async ()=>{
  try{
    const res = await fetch('http://localhost:4300/api/alumnos/sections/1/students/export?teacherId=2');
    const buf = await res.arrayBuffer();
    const a = new Uint8Array(buf);
    console.log('bytes:', Array.from(a.slice(0,6)));
    console.log('len', a.length);
  }catch(e){ console.error('ERR', e); process.exit(1);} 
})();

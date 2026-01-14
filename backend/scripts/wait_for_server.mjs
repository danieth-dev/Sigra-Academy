async function waitForHealth(url = 'http://127.0.0.1:4300/_health', retries = 20, delayMs = 500){
  for(let i=0;i<retries;i++){
    try{
      const r = await fetch(url, { method: 'GET', timeout: 3000 });
      if(r.ok){ console.log('Server healthy'); return true; }
      console.log('Health responded status', r.status);
    }catch(e){ console.log('Health check failed:', e.message || e); }
    await new Promise(r => setTimeout(r, delayMs));
  }
  throw new Error('Server did not become healthy in time');
}

(async ()=>{
  try{
    console.log('Waiting for server...');
    await waitForHealth();
    console.log('Ready');
  }catch(e){ console.error('Wait failed:', e.message); process.exit(1); }
})();

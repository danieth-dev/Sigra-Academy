async function run(){
  try{
    console.log('Activity weight test start');
    const createRes = await fetch('http://localhost:4300/api/assignments/activities', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment_id: 1, title: 'Weight Test Activity', description: 'Peso test', weight_percentage: 37.5, due_date: '2026-11-11' })
    });
    const createJson = await createRes.json();
    console.log('Create status', createRes.status);
    if(!createRes.ok) throw new Error('Create activity failed: ' + (createJson.error || JSON.stringify(createJson)));
    const activityId = createJson.activity.activity_id;

    const getRes = await fetch(`http://localhost:4300/api/assignments/activities/${activityId}`);
    const getJson = await getRes.json();
    if(!getRes.ok) throw new Error('Get activity failed');
    const weight = Number(getJson.activity.weight_percentage);
    if(Math.abs(weight - 37.5) > 0.001) throw new Error('Weight mismatch: expected 37.5 got ' + weight);
    console.log('Activity weight persisted:', weight);
    console.log('Activity weight test passed');
  }catch(e){ console.error('Test failed:', e.message); process.exit(1); }
}
run();
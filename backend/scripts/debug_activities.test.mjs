import { ActivitiesModel } from '../src/modules/teaching-manager-IV/asignaciones/asignaciones.model.mjs';

(async function(){
  try{
    console.log('Calling ActivitiesModel.getByAssignment(1)');
    const res = await ActivitiesModel.getByAssignment(1);
    console.log('Result:', res);
  }catch(e){
    console.error('Error while calling getByAssignment:', e);
    process.exit(1);
  }
})();
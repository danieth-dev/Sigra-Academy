import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// support both backend/uploads and project root uploads
const backendUploads = path.join(__dirname, '..', 'uploads');
const rootUploads = path.join(__dirname, '..', '..', 'uploads');
const candidates = [backendUploads, rootUploads];

const patterns = [
  /^grade_test/i,
  /^grade_flow_activity/i,
  /^test_/i
];

function removeMatchingFiles(dir){
  try{
    const subsDir = path.join(dir, 'submissions');
    const resDir = path.join(dir, 'resources');
    [subsDir, resDir].forEach(d => {
      try{
        const files = fs.readdirSync(d);
        files.forEach(f => {
          for(const p of patterns){
            if(p.test(f)){
              const fp = path.join(d, f);
              try{ fs.unlinkSync(fp); console.log('Removed', fp); }catch(e){ console.warn('Failed to remove', fp, e.message); }
              return;
            }
          }
        });
      }catch(e){ /* directory may not exist - ignore */ }
    });
  }catch(e){ console.warn('Directory not found or inaccessible:', dir); }
}

console.log('Cleaning uploads...');
candidates.forEach(c => removeMatchingFiles(c));
console.log('Done.');

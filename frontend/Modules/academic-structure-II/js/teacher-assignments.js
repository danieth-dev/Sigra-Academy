;(function () {
    // Follow the project's pattern: allow overriding `window.API_BASE` in the console,
    // probe the current origin and fall back to a local backend base.
    let API_BASE = window.API_BASE || 'http://localhost:5200';

    async function resolveApiBase() {
        const origin = window.location && window.location.origin ? window.location.origin : null;
        if (!origin || origin === 'null' || window.location.protocol === 'file:') return API_BASE;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 1000);
            const res = await fetch(`${origin}/api`, { method: 'GET', signal: controller.signal });
            clearTimeout(timeout);
            if (res.ok) return origin;
        } catch (err) {
            // ignore and fallback to configured API_BASE
        }
        return API_BASE;
    }

    function createTeacherCard(teacher, assignments = []){
        const container = document.createElement('div');
        container.className = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow';

        const inner = document.createElement('div');
        inner.className = 'flex items-center justify-between';

        const left = document.createElement('div');
        left.className = 'flex items-center space-x-4';

        const avatar = document.createElement('div');
        avatar.className = 'relative';
        avatar.innerHTML = `<div class="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-700">${(teacher.first_name?teacher.first_name[0]:'')+(teacher.last_name?teacher.last_name[0]:'')}</div>`;

        const info = document.createElement('div');
        const name = document.createElement('h3');
        name.className = 'text-sm font-bold text-gray-900 dark:text-white';
        name.textContent = teacher.first_name + ' ' + teacher.last_name;

        const meta = document.createElement('div');
        meta.className = 'text-xs text-gray-500 dark:text-gray-400 font-mono mt-1';
        const idSpan = document.createElement('span');
        idSpan.textContent = `ID: ${teacher.user_id}`;
        meta.appendChild(idSpan);
        if(assignments.length){
            const infoSubjects = document.createElement('div');
            infoSubjects.className = 'text-xs text-gray-600 dark:text-gray-300 mt-1';
            infoSubjects.textContent = assignments.map(a=>a.subject_name).filter((v,i,self)=>self.indexOf(v)===i).join(', ');
            info.appendChild(name);
            info.appendChild(meta);
            info.appendChild(infoSubjects);
        } else {
            info.appendChild(name);
            info.appendChild(meta);
        }

        left.appendChild(avatar);
        left.appendChild(info);

        const editBtn = document.createElement('button');
        editBtn.className = 'text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors';
        editBtn.innerHTML = '<span class="material-icons">edit</span>';

        inner.appendChild(left);
        inner.appendChild(editBtn);
        container.appendChild(inner);
        return container;
    }

    async function loadTeachersView(){
        const leftList = document.getElementById('leftList');
        const rightList = document.getElementById('rightList');
        const leftFooter = document.getElementById('leftFooter');

        if(!leftList || !rightList) return;
        leftList.innerHTML = '<p class="text-sm text-gray-500">Cargando profesores...</p>';
        rightList.innerHTML = '<p class="text-sm text-gray-500">Cargando asignaciones...</p>';

        try{
            const base = await resolveApiBase();
            const usersFetch = fetch(`${base}/api/auth/users`);
            const assignFetch = fetch(`${base}/api/auth/teacher-assignments`);
            const [usersResRaw, assignResRaw] = await Promise.all([usersFetch, assignFetch]);
            const usersRes = usersResRaw.ok ? await usersResRaw.json() : {};
            const assignRes = assignResRaw.ok ? await assignResRaw.json() : {};

            const users = usersRes.users || [];
            const assignments = assignRes.assignments || [];

            // Fetch global lists of subjects and sections to display on the right panel
            let subjects = [];
            let sections = [];
            try{
                const [subRes, secRes] = await Promise.all([
                    fetch(`${base}/api/subjects`),
                    fetch(`${base}/api/sections`)
                ]);
                const subJson = subRes.ok ? await subRes.json() : null;
                const secJson = secRes.ok ? await secRes.json() : null;
                subjects = subJson && (subJson.subjects || subJson) ? (subJson.subjects || subJson) : [];
                sections = secJson && (secJson.sections || secJson) ? (secJson.sections || secJson) : [];
            }catch(e){ console.warn('No se pudieron cargar subjects/sections', e); }

            // Agrupar asignaciones por teacher_user_id (usamos getAll de teacher-assignments)
            const map = new Map();
            assignments.forEach(a => {
                const id = Number(a.teacher_user_id);
                if(!map.has(id)) map.set(id, []);
                map.get(id).push(a);
            });

            // Construir lista de profesores asignados a partir de las asignaciones (garantiza mostrar todos los que aparecen en getAll)
            const assigned = [];
            map.forEach((assigns, tid) => {
                // teacher_name viene en las filas: "First Last"
                const firstRow = assigns[0] || {};
                const fullName = firstRow.teacher_name || '';
                const parts = fullName.split(' ');
                const teacherObj = {
                    user_id: tid,
                    first_name: parts[0] || fullName,
                    last_name: parts.slice(1).join(' ') || ''
                };
                assigned.push({ teacher: teacherObj, assignments: assigns });
            });

            // Se asume role_id === 2 corresponde a 'teacher' (mismo que en seed)
            const TEACHER_ROLE_ID = 2;
            const teachers = users.filter(u => Number(u.role_id) === TEACHER_ROLE_ID);

            // Profesores no asignados: los que están en users con rol teacher pero no en map
            const unassigned = teachers.filter(t => !map.has(Number(t.user_id)));

            // Renderizar
            leftList.innerHTML = '';
            if(unassigned.length === 0){
                leftList.innerHTML = '<p class="text-sm text-gray-500">No hay profesores sin asignar.</p>';
            } else {
                unassigned.forEach(t => {
                    const node = document.createElement('div');
                    node.className = 'group flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-150';
                        node.innerHTML = `
                        <div class="flex items-center space-x-4">
                            <div class="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-200 font-bold text-sm">${(t.first_name?t.first_name[0]:'')+(t.last_name?t.last_name[0]:'')}</div>
                            <div>
                                <p class="text-sm font-bold text-gray-900 dark:text-white">${t.first_name} ${t.last_name}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400 font-mono">ID: ${t.user_id}</p>
                            </div>
                        </div>
                        <a href="../access-control-I/register-teacher.html?userId=${t.user_id}" class="h-8 w-8 inline-flex rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 items-center justify-center text-gray-500 dark:text-gray-300 transition-colors">
                            <span class="material-icons text-lg">add</span>
                        </a>
                    `;
                    leftList.appendChild(node);
                });
            }

            rightList.innerHTML = '';
            if(assigned.length === 0){
                rightList.innerHTML = '<p class="text-sm text-gray-500">No hay profesores con asignaciones.</p>';
            } else {
                assigned.forEach(item => {
                    const card = createTeacherCard(item.teacher, item.assignments);
                    rightList.appendChild(card);
                });
            }

            if(leftFooter){
                leftFooter.textContent = `Mostrando ${unassigned.length} de ${teachers.length} profesores`;
            }

            // Render global subjects and sections into the aux containers if present
            try{
                const globalSubjects = document.getElementById('globalSubjects');
                const globalSections = document.getElementById('globalSections');
                if(globalSubjects){
                    globalSubjects.innerHTML = '';
                    (subjects || []).forEach(s => {
                        const el = document.createElement('div');
                        el.className = 'text-sm text-gray-700 dark:text-gray-200 p-1';
                        el.textContent = s.subject_name || `#${s.subject_id}`;
                        globalSubjects.appendChild(el);
                    });
                }
                if(globalSections){
                    globalSections.innerHTML = '';
                    (sections || []).forEach(sec => {
                        const el = document.createElement('div');
                        el.className = 'text-sm text-gray-700 dark:text-gray-200 p-1';
                        el.textContent = `${sec.section_name} — ${sec.grade_name || sec.anio || ''}`;
                        globalSections.appendChild(el);
                    });
                }
            }catch(e){ console.error(e); }

        } catch (err){
            leftList.innerHTML = '<p class="text-sm text-red-500">Error al obtener datos.</p>';
            rightList.innerHTML = '<p class="text-sm text-red-500">Error al obtener datos.</p>';
            console.error(err);
        }
    }

    function initTeachersToggle(){
        const btnTeachers = document.getElementById('btnTeachers');
        const btnStudents = document.getElementById('btnStudents');
        if(!btnTeachers) return;
        btnTeachers.addEventListener('click', function(){
            btnTeachers.classList.remove('text-gray-700');
            btnTeachers.classList.add('bg-white','text-gray-900');
            if(btnStudents) btnStudents.classList.remove('bg-white','text-gray-900');
            loadTeachersView();
        });
        if(btnStudents){
            btnStudents.addEventListener('click', function(){ location.reload(); });
        }
    }

    document.addEventListener('DOMContentLoaded', initTeachersToggle);

})();

// Lógica para el Profesor

// Navegación SPA
function showSection(sectionId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('onclick').includes(sectionId)) link.classList.add('active');
    });
}
// Exponer como global por si HTML usa onclick
window.showSection = showSection;

// Estado global para sesión de asistencia activa
window.activeSessionId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Mostrar nombre del profesor actual
    try{ const el = document.getElementById('prof-user-name'); if(el) el.textContent = (currentUserProfesor.name ? 'Prof. ' + currentUserProfesor.name : 'Profesor'); }catch(e){}

    // Check backend health before attempting to load many resources
    const healthy = await window.checkBackendHealth(2000);
    if(!healthy){
        window._backend_offline = true;
        window._showBackendOfflineBanner();
        const container = document.getElementById('dashboard-main') || document.body;
        const parts = container.querySelectorAll('.card');
        parts.forEach(p => p.innerHTML = '<p style="color:#666; padding:12px;">Servidor inaccesible. Revise la conexión.</p>');
        // Add retry control
        const retry = document.createElement('button'); retry.textContent = 'Reintentar conexión'; retry.className = 'btn';
        retry.addEventListener('click', async () => { retry.disabled = true; retry.textContent = 'Comprobando...'; if(await window.checkBackendHealth(3000)) location.reload(); else { retry.disabled=false; retry.textContent='Reintentar conexión'; window._showBackendOfflineBanner(); } });
        container.insertBefore(retry, container.firstChild);
        return;
    }

    // Normal loading
    cargarSelectCursos();
    cargarCursosDashboard();
    renderEntregas();
    setupAttendanceFormUI();
});

function setupAttendanceFormUI(){
    // Ensure frequency select exists and toggles week input visibility
    const form = document.getElementById('form-crear-asistencia');
    if(!form) return;
    const weekInput = document.getElementById('asistencia-week');
    if(!document.getElementById('asistencia-frequency')){
        const sel = document.createElement('select'); sel.id='asistencia-frequency'; sel.innerHTML = `<option value='weekly'>Semanal</option><option value='daily'>Diaria</option>`; sel.style.marginRight='8px';
        // insert before week input if present
        if(weekInput && weekInput.parentNode) weekInput.parentNode.insertBefore(sel, weekInput);
        sel.addEventListener('change', () => {
            if(sel.value === 'daily'){ if(weekInput) weekInput.style.display = 'none'; }
            else { if(weekInput) weekInput.style.display = 'inline-block'; }
        });
    }
}

// --- FUNCIONES DE CARGA DE DATOS ---
async function cargarSelectCursos() {
    const selects = ['tarea-curso-id', 'asistencia-curso-id', 'filtro-curso-alumnos'];
    try{
        // Usamos el endpoint de secciones asignadas al profesor para poblar el selector
        const secData = await apiFetch(`/alumnos/teacher/${String(currentUserProfesor.id)}/sections`);
            const secciones = secData.sections || [];
        // Guardamos globalmente para poder acceder a section_id por assignment_id
        window.profSecciones = secciones;
        selects.forEach(id => {
            const select = document.getElementById(id);
            if(!select) return;
            select.innerHTML = '<option value="">Seleccione...</option>';
            // Si el select es el de tareas y asistencia, usamos assignment_id como valor
            secciones.forEach(s => {
                const label = `${s.subject_name || 'Asignatura'} - Sec. ${s.section_name || ''}`;
                if(id === 'tarea-curso-id' || id === 'asistencia-curso-id'){
                    // Guardamos también data-section para facilitar acceso desde DOM si se necesita
                    select.innerHTML += `<option data-section="${s.section_id}" value="${s.assignment_id}">${label}</option>`;
                } else {
                    select.innerHTML += `<option value="${s.section_id}">${label}</option>`;
                }
            });
        });
    }catch(err){
        console.error('Error al cargar cursos:', err);
    }
}

async function cargarCursosDashboard() {
    const container = document.getElementById('lista-cursos-profesor');
    container.innerHTML = '';
    try{
        const data = await apiFetch(`/assignments/teacher/${String(currentUserProfesor.id)}`);
        const assignments = data.assignments || [];
        if(assignments.length === 0){
            container.innerHTML = '<div class="card"><p>No se encontraron cursos.</p></div>';
            return;
        }
        // Cards are clickable to open management view; remove direct action buttons from dashboard
        container.innerHTML = assignments.map(a => `
            <div class="card" onclick="openManageAssignment(${a.assignment_id})" style="cursor:pointer">
                <h4>${a.subject_name || 'Asignatura'}</h4>
                <p>Sección: ${a.section_name || ''}</p>
            </div>
        `).join('');
    }catch(err){
        if(window.__SHOW_DEV_UI__) console.error('Error al cargar cursos del dashboard:', err);
        container.innerHTML = '<div class="card"><p>No fue posible cargar los cursos. Intente nuevamente más tarde.</p></div>';
    }
}

// --- GESTIÓN DE ALUMNOS Y EXPORTACIÓN ---
let lastStudentsList = [];

async function cargarAlumnos() {
    const sectionId = document.getElementById('filtro-curso-alumnos').value;
    const q = document.getElementById('alumnos-search').value;
    const orderBy = document.getElementById('alumnos-orderby').value || 'nombre';
    const order = document.getElementById('alumnos-order').value || 'asc';

    const tbody = document.querySelector('#tabla-alumnos tbody');
    tbody.innerHTML = '';
    const btnExport = document.getElementById('btn-export-alumnos');
    if(!sectionId){ btnExport.style.display = 'none'; return; }
    btnExport.style.display = 'inline-block';

    try{
        // Reset page if section or query changed
        if(sectionId !== _lastSectionId || q !== _lastQ){ alumnosPage = 1; }
        _lastSectionId = sectionId; _lastQ = q;

        const offset = String((alumnosPage - 1) * alumnosLimit);
        const qs = new URLSearchParams({ teacherId: String(currentUserProfesor.id), q: q || '', orderBy, order, limit: String(alumnosLimit), offset });
        const data = await apiFetch(`/alumnos/sections/${sectionId}/students?${qs.toString()}`);
        const students = data.students || [];
        lastStudentsList = students;
        alumnosTotal = Number(data.total || students.length || 0);
        const totalPages = Math.max(1, Math.ceil(alumnosTotal / alumnosLimit));
        if(alumnosPage > totalPages && totalPages > 0){ alumnosPage = totalPages; return cargarAlumnos(); }

        if(students.length === 0){
            tbody.innerHTML = `<tr><td colspan="4">No hay estudiantes inscritos.</td></tr>`;
            updatePaginationControls();
            return;
        }
        students.forEach(alum => {
            tbody.innerHTML += `
                <tr>
                    <td>${alum.user_id}</td>
                    <td>${alum.nombre}</td>
                    <td>${document.getElementById('filtro-curso-alumnos').selectedOptions[0]?.text || ''}</td>
                    <td><button class="btn btn-primary btn-sm">Ver Perfil</button></td>
                </tr>
            `;
        });
        updatePaginationControls();
    }catch(err){
        if(window.__SHOW_DEV_UI__) console.error('Error al cargar alumnos:', err);
        tbody.innerHTML = `<tr><td colspan="4">No fue posible obtener la lista de alumnos. Intente más tarde.</td></tr>`;
        updatePaginationControls();
    }
}

// Debounced helper to avoid firing many requests while typing
let _debounceTimer = null;
function debouncedCargarAlumnos(){
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => cargarAlumnos(), 400);
}

// Pagination state for alumnos
let alumnosPage = 1;
let alumnosLimit = 10;
let alumnosTotal = 0;
let _lastSectionId = null;
let _lastQ = '';

function updatePaginationControls(){
    const pageInfo = document.getElementById('alumnos-page-info');
    const prevBtn = document.getElementById('alumnos-prev');
    const nextBtn = document.getElementById('alumnos-next');
    const pageSizeSelect = document.getElementById('alumnos-page-size');

    const totalPages = Math.max(1, Math.ceil(alumnosTotal / alumnosLimit));
    pageInfo.textContent = `Página ${alumnosPage} de ${totalPages} (${alumnosTotal} registros)`;
    prevBtn.disabled = alumnosPage <= 1;
    nextBtn.disabled = alumnosPage >= totalPages;
    // keep pageSize select value in sync
    if(pageSizeSelect) pageSizeSelect.value = String(alumnosLimit);
}

function alumnosPrev(){
    if(alumnosPage > 1){ alumnosPage--; cargarAlumnos(); }
}
function alumnosNext(){
    const totalPages = Math.max(1, Math.ceil(alumnosTotal / alumnosLimit));
    if(alumnosPage < totalPages){ alumnosPage++; cargarAlumnos(); }
}
function alumnosChangePageSize(){
    const pageSizeSelect = document.getElementById('alumnos-page-size');
    const raw = pageSizeSelect.value || '10';
    if(raw === 'all'){
        alumnosLimit = 1000000; // request a very large page to effectively fetch all students
    } else {
        const newSize = Number(raw) || 10;
        alumnosLimit = newSize;
    }
    alumnosPage = 1;
    cargarAlumnos();
}

// Función para Exportar Tabla Alumnos a XLSX
async function exportarAlumnosCSV() {
    const sectionId = document.getElementById('filtro-curso-alumnos').value;
    if(!sectionId){ showMessageModal('Atención','Seleccione una sección primero'); return; }
    const q = document.getElementById('alumnos-search').value;
    const orderBy = document.getElementById('alumnos-orderby').value || 'nombre';
    const order = document.getElementById('alumnos-order').value || 'asc';
    try{
        // Request XLSX from backend
        const qs = new URLSearchParams({ teacherId: String(currentUserProfesor.id), q: q || '', orderBy, order, format: 'xlsx' });
        const url = `${API_BASE}/alumnos/sections/${sectionId}/students/export?${qs.toString()}`;
        const res = await fetch(url);
        if(!res.ok){ const text = await res.text(); throw new Error(`HTTP ${res.status} - ${text}`); }
        const blob = await res.blob();
        const contentDisposition = res.headers.get('content-disposition') || '';
        let filename = `alumnos_section_${sectionId}.xlsx`;
        const m = contentDisposition.match(/filename="?([^";]+)"?/);
        if(m) filename = m[1];
        const urlObj = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = urlObj; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(urlObj);
    }catch(err){
        if(window.__SHOW_DEV_UI__) console.error('Error al exportar:', err);
        showMessageModal('Error','No fue posible exportar la lista. Intente nuevamente.');
    }
}

// --- GESTIÓN DE TAREAS ---
document.getElementById('form-crear-tarea').addEventListener('submit', async (e) => {
    e.preventDefault();
    const assignmentId = document.getElementById('tarea-curso-id').value;
    const title = document.getElementById('tarea-titulo').value;
    const desc = document.getElementById('tarea-desc').value;
    const fechaInicio = document.getElementById('tarea-inicio').value;
    const fechaFin = document.getElementById('tarea-fin').value;

    if(!assignmentId || !title || !fechaFin) { showMessageModal('Atención','Complete los campos obligatorios'); return; }

    try{
        const weightVal = Number(document.getElementById('tarea-weight').value || '20');
        if(isNaN(weightVal) || weightVal < 0 || weightVal > 100){ showMessageModal('Atención','Ponderación inválida. Debe estar entre 0 y 100.'); return; }
        const payload = {
            assignment_id: Number(assignmentId),
            title,
            description: desc,
            weight_percentage: Number(weightVal.toFixed(2)),
            due_date: fechaFin
        };
        const data = await apiFetch(`/assignments/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        await showMessageModal('Listo','Tarea creada exitosamente.');
        document.getElementById('form-crear-tarea').reset();
        renderEntregas();
    }catch(err){
        console.error('Error al crear tarea:', err);
        alert('Error al crear la tarea: ' + err.message);
    }
});

async function renderEntregas() {
    const tbody = document.getElementById('lista-entregas-profesor');
    tbody.innerHTML = '';
    try{
        // Obtener asignaciones del profesor
        const data = await apiFetch(`/assignments/teacher/${String(currentUserProfesor.id)}`);
        const assignments = data.assignments || [];
        if(assignments.length === 0){
            tbody.innerHTML = `<tr><td colspan="6">No hay asignaciones.</td></tr>`;
            return;
        }
        // Por cada asignación, buscar actividades y sus entregas
        for(const a of assignments){
            const actData = await apiFetch(`/assignments/assignment/${a.assignment_id}/activities`);
            const activities = actData.activities || [];
            for(const act of activities){
                const subData = await apiFetch(`/assignments/activity/${act.activity_id}/submissions`);
                const submissions = subData.submissions || [];
                // Obtener calificaciones para esta actividad y mapear por student_user_id
                let gradeMap = new Map();
                try{
                    const gradesData = await apiFetch(`/grades-log/activity/${act.activity_id}`);
                    const grades = gradesData.grades || [];
                    grades.forEach(g => { if(g.student_user_id) gradeMap.set(g.student_user_id, g); });
                }catch(e){ /* si falla, continuamos sin grades */ }

                for(const s of submissions){
                    const fileLink = s.file_path ? `<a href="${s.file_path}" target="_blank">Ver Archivo</a>` : '';
                    const gradeEntry = gradeMap.get(s.student_user_id);
                    let gradeDisplay = 'Sin nota';
                    if(gradeEntry && (gradeEntry.score !== null && gradeEntry.score !== undefined)){
                        gradeDisplay = String(gradeEntry.score);
                    } else if(s.is_late){
                        gradeDisplay = `<span style="color:#C52B3D; font-weight:bold;">Tardía</span>`;
                    }
                    const gradeId = gradeEntry ? (gradeEntry.grade_id || '') : '';
                    const score = gradeEntry ? gradeEntry.score : null;
                    tbody.innerHTML += `
                        <tr>
                            <td>${s.student_name || 'Estudiante'}</td>
                            <td>${act.title}</td>
                            <td>${fileLink}</td>
                            <td>${new Date(s.submission_date).toLocaleString()}</td>
                            <td>${gradeDisplay}</td>
                            <td style="display:flex; gap:6px;">
                                <button class="btn btn-primary" onclick="openGradeModal(${s.submission_id}, ${s.activity_id}, ${s.student_user_id}, ${gradeId ? gradeId : 'null'}, ${score !== null ? score : 'null'})">Calificar</button>
                            </td>
                        </tr>
                    `;
                }
            }
        }
    }catch(err){
        if(window.__SHOW_DEV_UI__) console.error('Error al renderizar entregas:', err);
        tbody.innerHTML = `<tr><td colspan="6">No fue posible cargar las entregas. Intente más tarde.</td></tr>`;
    }
}

async function openGradeModal(submissionId, activityId, studentId, gradeId = null, existingScore = null){
    // prefill existing score if any
    const placeholder = '0-20';
    const initVal = (existingScore !== null && existingScore !== 'null') ? String(existingScore) : '';
    const val = await showInputModal('Agregar calificación', 'Ingrese la calificación (0-20):', placeholder, (v) => {
        const n = Number(v);
        if(v === '') return 'Ingrese un valor';
        if(isNaN(n)) return 'Ingrese un número';
        if(n < 0 || n > 20) return 'La nota debe estar entre 0 y 20';
        return true;
    }, initVal);
    if(val === null) return; // cancel

    const value = Number(val);
    try{
        if(gradeId && gradeId !== 'null'){
            // update existing grade
            await apiFetch(`/grades-log/update/${gradeId}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: value })
            });
            await showMessageModal('Listo','Calificación actualizada.');
        } else {
            // create new
            await apiFetch(`/grades-log`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activity_id: activityId, student_user_id: studentId, score: value })
            });
            await showMessageModal('Listo','Calificación registrada.');
        }
        renderEntregas();
    }catch(e){
        console.error('Error in openGradeModal:', e);
        // fallback: if server reports existingGradeId, offer update flow
        let msg = e.message || '';
        try{ const i = msg.indexOf('{'); if(i !== -1){ const o = JSON.parse(msg.slice(i));
            if(o && o.existingGradeId){
                const confirmUpdate = await showInputModal('Ya existe la calificación', 'Ya existe una calificación para este estudiante en esta actividad. Escriba ACTUALIZAR para actualizarla:', 'ACTUALIZAR', (v)=> v === 'ACTUALIZAR' ? true : 'Escriba ACTUALIZAR para confirmar');
                if(confirmUpdate === 'ACTUALIZAR'){
                    await apiFetch(`/grades-log/update/${o.existingGradeId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: value }) });
                    await showMessageModal('Listo','Calificación actualizada.');
                    renderEntregas();
                    return;
                } else {
                    showMessageModal('Info','Operación cancelada.');
                    return;
                }
            } else {
                msg = o.error || JSON.stringify(o);
            }
        }}catch(pe){}
        if(window.__SHOW_DEV_UI__) console.error('Error al enviar la calificación (detalle):', e);
        showMessageModal('Error','No fue posible enviar la calificación. Intente más tarde.');
    }
}

async function calificarByData(activityId, studentId) {
    const val = await showInputModal('Agregar calificación', 'Ingrese la calificación (0-20):', '0-20', (v) => {
        const n = Number(v);
        if(v === '') return 'Ingrese un valor';
        if(isNaN(n)) return 'Ingrese un número';
        if(n < 0 || n > 20) return 'La nota debe estar entre 0 y 20';
        return true;
    });
    if(val === null) return;
    const value = Number(val);
    try{
        await apiFetch(`/grades-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activity_id: activityId, student_user_id: studentId, score: value })
        });
        await showMessageModal('Listo','Calificación registrada.');
        renderEntregas();
    }catch(err){
        if(window.__SHOW_DEV_UI__) console.error('Error al enviar la calificación', err);
        showMessageModal('Error','No fue posible enviar la calificación. Intente más tarde.');
    }
}

// --- GESTIÓN DE ASISTENCIA Y EXPORTACIÓN ---
document.getElementById('form-crear-asistencia').addEventListener('submit', async (e) => {
    e.preventDefault();
    const assignmentId = document.getElementById('asistencia-curso-id').value;
    const frequency = document.getElementById('asistencia-frequency') ? document.getElementById('asistencia-frequency').value : 'weekly';
    const week = Number(document.getElementById('asistencia-week').value || 0);
    const openDate = document.getElementById('asistencia-open').value;
    const closeDate = document.getElementById('asistencia-close').value;

    // validations
    if(!assignmentId || !openDate || !closeDate) { showMessageModal('Datos incompletos','Complete todos los campos de la sesión.'); return; }
    if(frequency === 'weekly' && (!week || isNaN(week) || week <= 0)) { showMessageModal('Datos incompletos','Ingrese el número de semana para la asistencia semanal.'); return; }
    if(new Date(openDate) > new Date(closeDate)) { showMessageModal('Fechas inválidas','La fecha de apertura debe ser anterior o igual a la fecha límite.'); return; }

    try{
        const payload = { assignment_id: Number(assignmentId), week_number: (frequency === 'weekly' ? week : null), open_date: openDate, close_date: closeDate, frequency, created_by: Number(currentUserProfesor.id) };
        const res = await apiFetch('/attendance/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if(res.error){ showMessageModal('Error', res.error); return; }
        // Mostrar controles de sesión
        window.activeSessionId = res.session.session_id;
        document.getElementById('session-controls').style.display = 'block';
        if(res.session.frequency === 'daily'){
            document.getElementById('session-info').textContent = `Asistencia Diaria — ${new Date(res.session.open_date).toLocaleString()} a ${new Date(res.session.close_date).toLocaleString()}`;
        }else{
            document.getElementById('session-info').textContent = `Asistencia Semana ${res.session.week_number} — ${new Date(res.session.open_date).toLocaleString()} a ${new Date(res.session.close_date).toLocaleString()}`;
        }
        document.getElementById('btn-export-session').style.display = 'inline-block';
        // Render records table
        loadSessionRecords(res.session.session_id);
        // Refrescar lista de sesiones para la sección
        cargarSesiones(assignmentId);
        showMessageModal('Listo','La asistencia fue creada correctamente.');
    }catch(err){
        if(window.__SHOW_DEV_UI__) console.error('Error al crear sesión de asistencia:', err);
        showMessageModal('Error','No fue posible crear la sesión de asistencia. Intente más tarde.');
    }
});

// Cargar y mostrar registros para una sesión
async function loadSessionRecords(sessionId){
    try{
        const res = await apiFetch(`/attendance/sessions/${sessionId}/records`);
        const tbody = document.querySelector('#tabla-reporte-asistencia tbody');
        tbody.innerHTML = '';
        const records = res.records || [];
        if(records.length === 0){ tbody.innerHTML = `<tr><td colspan="3">No hay registros para esta sesión.</td></tr>`; return; }
        records.forEach(r => {
            const state = r.status === 'present' ? 'Presente' : 'Ausente';
            const color = r.status === 'present' ? 'green' : 'red';
            tbody.innerHTML += `
                <tr id="record-${r.record_id}">
                    <td>${r.student_name || r.student_user_id}</td>
                    <td style="color:${color}; font-weight:bold;">${state}</td>
                    <td><button class="btn btn-primary" onclick="markPresent(${sessionId}, ${r.student_user_id})">Marcar Presente</button></td>
                </tr>
            `;
        });
    }catch(e){ if(window.__SHOW_DEV_UI__) console.error('Error cargando registros de sesión', e); showMessageModal('Error','No fue posible cargar los registros de la sesión. Intente más tarde.'); }
}

// Cargar sesiones de la sección asociada a una asignación
async function cargarSesiones(assignmentId){
    try{
        const section = (window.profSecciones || []).find(s => String(s.assignment_id) === String(assignmentId));
        if(!section){ document.getElementById('sesiones-list').innerHTML = '<div class="card"><p>No se encontró la sección.</p></div>'; return; }
        const sectionId = section.section_id;
        const res = await apiFetch(`/attendance/sections/${sectionId}/sessions`);
        const sessions = res.sessions || [];
        const container = document.getElementById('sesiones-list');
        if(sessions.length === 0){ container.innerHTML = '<div class="card"><p>Sin Asistencias Activas</p></div>'; return; }
        container.innerHTML = sessions.map(s => `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                <div>
                    <strong>${s.frequency === 'daily' ? 'Diaria' : 'Semana ' + s.week_number}</strong>
                    <div style="font-size:0.9rem; color:#666;">${new Date(s.open_date).toLocaleString()} → ${new Date(s.close_date).toLocaleString()}</div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-secondary" onclick="loadSessionRecords(${s.session_id})">Ver</button>
                    <button class="btn btn-success" onclick="exportSessionById(${s.session_id})">Exportar</button>
                </div>
            </div>
        `).join('');
    }catch(e){ console.error('Error cargando sesiones', e); document.getElementById('sesiones-list').innerHTML = '<div class="card"><p>Error cargando sesiones.</p></div>'; }
} 

// --- CRUD Helpers para asignaciones y actividades (UI) ---
async function openManageAssignment(assignmentId){
    try{
        const data = await apiFetch(`/assignments/assignment/${assignmentId}/activities`);
        const activities = data.activities || [];
        const content = document.createElement('div');
        content.style.maxHeight = '60vh'; content.style.overflowY = 'auto';
        content.innerHTML = `<h3>Actividades de la asignación ${assignmentId}</h3>` + (activities.length === 0 ? '<p>No hay actividades.</p>' : '');
        activities.forEach(a => {
            const div = document.createElement('div');
            div.style.padding = '8px 0'; div.style.borderBottom = '1px solid #eee';
            div.innerHTML = `<strong>${a.title}</strong> <div style="font-size:0.9rem; color:#666;">Vence: ${a.due_date ? new Date(a.due_date).toLocaleString() : 'Sin fecha'}</div>`;
            const btns = document.createElement('div'); btns.style.marginTop = '8px'; btns.style.display = 'flex'; btns.style.gap = '8px';
            const edit = document.createElement('button'); edit.className = 'btn'; edit.textContent = 'Editar'; edit.onclick = () => openEditActivityModal(a.activity_id);
            const del = document.createElement('button'); del.className = 'btn btn-danger'; del.textContent = 'Eliminar'; del.onclick = () => confirmDeleteActivity(a.activity_id);
            btns.appendChild(edit); btns.appendChild(del);
            div.appendChild(btns);
            content.appendChild(div);
        });
        // Button to manage resources for this assignment
        const manageResBtn = document.createElement('button'); manageResBtn.className = 'btn'; manageResBtn.style.marginTop = '10px'; manageResBtn.textContent = 'Gestionar recursos';
        manageResBtn.onclick = () => {
            // overlay for resources
            const ov = document.createElement('div'); ov.style.position='fixed'; ov.style.inset='0'; ov.style.background='rgba(0,0,0,0.35)'; ov.style.display='flex'; ov.style.alignItems='center'; ov.style.justifyContent='center'; ov.style.zIndex=10000;
            const box2 = document.createElement('div'); box2.style.background='white'; box2.style.padding='18px'; box2.style.borderRadius='10px'; box2.style.width='750px'; box2.style.maxWidth='95%';
            const title = document.createElement('h3'); title.textContent = 'Recursos - Asignación ' + assignmentId; box2.appendChild(title);
            const list = document.createElement('div'); list.style.maxHeight='55vh'; list.style.overflowY='auto'; list.style.marginBottom='8px'; box2.appendChild(list);
            const form = document.createElement('form'); form.enctype='multipart/form-data'; form.innerHTML = `<div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;"><input type='text' name='title' placeholder='Título' required style='flex:1;padding:6px;' /><select name='resource_type' style='padding:6px;'><option value='PDF'>PDF</option><option value='LINK'>Enlace</option><option value='OTHER'>Otro</option></select></div><div style='display:flex; gap:8px; align-items:center;'><input type='file' name='file' /><input type='text' name='url' placeholder='URL (opcional)' style='flex:1;padding:6px;' /><button type='submit' class='btn btn-primary'>Subir</button></div>`;
            form.addEventListener('submit', async (e) => { e.preventDefault(); try{ const fd = new FormData(form); fd.append('assignment_id', String(assignmentId)); const f = form.querySelector('input[type=file]'); if(f && f.files && f.files.length>0) fd.append('file', f.files[0]); const titleVal = form.querySelector('input[name=title]').value; if(!titleVal) return showMessageModal('Atención','Ingrese un título'); const r = await fetch(`${API_BASE}/course-resources/resources`, { method: 'POST', body: fd }); if(!r.ok){ const txt = await r.text(); throw new Error(txt || 'Error'); } await showMessageModal('Listo','Recurso subido'); form.reset(); await loadResourcesList(); }catch(err){ console.error('Error subiendo recurso', err); showMessageModal('Error','No fue posible subir recurso'); } });
            box2.appendChild(form);
            const closeBtn = document.createElement('button'); closeBtn.className='btn'; closeBtn.style.marginTop='10px'; closeBtn.textContent='Cerrar'; closeBtn.onclick = () => document.body.removeChild(ov);
            box2.appendChild(closeBtn);
            ov.appendChild(box2); document.body.appendChild(ov);

            async function loadResourcesList(){
                try{ list.innerHTML = '<p>Cargando recursos...</p>'; const res = await apiFetch(`/course-resources/resources/assignment/${assignmentId}`); const resources = res.resources || []; if(resources.length === 0){ list.innerHTML = '<p>No hay recursos.</p>'; return; } list.innerHTML = ''; resources.forEach(r => { const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.padding='8px 0'; row.style.borderBottom='1px solid #eee'; row.innerHTML = `<div><strong>${r.title}</strong><div style='font-size:0.9rem;color:#666;'>${r.resource_type} ${r.file_path_or_url ? '— <a href="'+r.file_path_or_url+'" target="_blank">Ver</a>' : ''}</div></div>`; const right = document.createElement('div'); right.style.display='flex'; right.style.gap='8px'; const vis = document.createElement('input'); vis.type='checkbox'; vis.checked = !!r.is_visible; vis.onchange = async () => { try{ const u = await apiFetch(`/course-resources/resources/${r.resource_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ is_visible: vis.checked }) }); if(u.error) throw new Error(u.error); await showMessageModal('Listo','Visibilidad actualizada'); await loadResourcesList(); }catch(e){ console.error('Error actualizando', e); showMessageModal('Error','No fue posible actualizar'); vis.checked = !vis.checked; } }; const del = document.createElement('button'); del.className='btn btn-danger'; del.textContent='Eliminar'; del.onclick = async () => { const c = await showInputModal('Confirmar eliminación','Escribe ELIMINAR para eliminar:', ''); if(c !== 'ELIMINAR') return; try{ const d = await apiFetch(`/course-resources/resources/${r.resource_id}`, { method: 'DELETE' }); if(d.error) throw new Error(d.error); await showMessageModal('Listo','Recurso eliminado'); await loadResourcesList(); }catch(e){ console.error('Error eliminando', e); showMessageModal('Error','No fue posible eliminar recurso'); } }; right.appendChild(vis); right.appendChild(del); row.appendChild(right); list.appendChild(row); }); }catch(e){ console.error('Error cargando recursos', e); list.innerHTML = '<p>Error cargando recursos.</p>'; } }
            loadResourcesList();
        };
        content.appendChild(manageResBtn);

        // Button to jump to create-tarea with this assignment preselected
        const createBtn = document.createElement('button'); createBtn.className = 'btn btn-primary'; createBtn.style.marginTop = '10px'; createBtn.textContent = 'Crear nueva actividad (preseleccionada)';
        createBtn.onclick = () => { showSection('crear-tarea'); document.getElementById('tarea-curso-id').value = String(assignmentId); document.getElementById('tarea-titulo').focus(); };
        content.appendChild(createBtn);
        // Show modal-like overlay
        const overlay = document.createElement('div'); overlay.style.position='fixed'; overlay.style.inset='0'; overlay.style.background='rgba(0,0,0,0.35)'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.zIndex=9999;
        const box = document.createElement('div'); box.style.background='white'; box.style.padding='18px'; box.style.borderRadius='10px'; box.style.width='700px'; box.style.maxWidth='95%'; box.appendChild(content);
        const close = document.createElement('button'); close.className='btn'; close.style.marginTop='12px'; close.textContent='Cerrar'; close.onclick = () => document.body.removeChild(overlay);
        box.appendChild(close);
        overlay.appendChild(box); document.body.appendChild(overlay);
    }catch(e){ console.error('Error abriendo gestión de asignación', e); showMessageModal('Error','No se pudieron cargar las actividades'); }
}

async function openEditActivityModal(activityId){
    try{
        const res = await apiFetch(`/assignments/activities/${activityId}`);
        const activity = res.activity;
        if(!activity) return showMessageModal('Error','Actividad no encontrada');
        const newTitle = await showInputModal('Editar Título', 'Nuevo título:', activity.title || '');
        if(newTitle === null) return; // cancel
        const newDesc = await showInputModal('Editar Descripción', 'Nueva descripción:', activity.description || '');
        if(newDesc === null) return;
        const newDue = await showInputModal('Editar Fecha Límite', 'Formato: YYYY-MM-DD o vacío para quitar:', activity.due_date ? activity.due_date.split('T')[0] : '');
        if(newDue === null) return;
        const newWeight = await showInputModal('Editar Ponderación', 'Ponderación (%) (0-100):', String(activity.weight_percentage || '20'), (v) => {
            if(v === '') return 'Ingrese un valor';
            const n = Number(v);
            if(isNaN(n)) return 'Ingrese un número';
            if(n < 0 || n > 100) return 'La ponderación debe estar entre 0 y 100';
            return true;
        });
        if(newWeight === null) return;
        const payload = { title: newTitle, description: newDesc, due_date: newDue || null, weight_percentage: Number(Number(newWeight).toFixed(2)) };
        await apiFetch(`/assignments/activities/${activityId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        await showMessageModal('Listo','Actividad actualizada.');
        renderEntregas();
    }catch(e){ console.error('Error editando actividad', e);
        let msg = e.message || 'No se pudo editar la actividad.';
        try{ const i = msg.indexOf('{'); if(i !== -1){ const o = JSON.parse(msg.slice(i)); msg = o.error || JSON.stringify(o); } }catch(pe){}
        showMessageModal('Error', msg);
    }
}

async function confirmDeleteActivity(activityId){
    const val = await showInputModal('Confirmar eliminación', 'Escribe ELIMINAR para confirmar:', '');
    if(val !== 'ELIMINAR') return;
    try{
        await apiFetch(`/assignments/activities/${activityId}`, { method: 'DELETE' });
        showMessageModal('Listo','Actividad eliminada.');
        renderEntregas();
    }catch(e){ console.error('Error eliminando actividad', e);
        let msg = e.message || 'No se pudo eliminar la actividad.';
        try{ const idx = msg.indexOf('{'); if(idx !== -1){ const obj = JSON.parse(msg.slice(idx)); msg = obj.error || JSON.stringify(obj); } }catch(pe){ /* ignore parse */ }
        showMessageModal('Error', msg);
    }
}

async function confirmDeleteAssignment(assignmentId){
    const val = await showInputModal('Confirmar eliminación', 'Escribe ELIMINAR para confirmar la eliminación de la asignación:', '');
    if(val !== 'ELIMINAR') return;
    try{
        await apiFetch(`/assignments/${assignmentId}`, { method: 'DELETE' });
        await showMessageModal('Listo','Asignación eliminada.');
        cargarCursosDashboard();
        renderEntregas();
    }catch(e){ console.error('Error eliminando asignación', e); showMessageModal('Error','No se pudo eliminar la asignación.'); }
}


async function markPresent(sessionId, studentId){
    try{
        const res = await apiFetch(`/attendance/sessions/${sessionId}/mark`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_user_id: Number(studentId) }) });
        if(res.error){ showMessageModal('Error', res.error); return; }
        // Refrescar la tabla para asegurar consistencia
        loadSessionRecords(sessionId);
    }catch(err){
        console.error('Error al marcar presente:', err);
        showMessageModal('Error','Error al marcar presente. ' + (err.message || ''));
    }
}

async function exportSessionCSV(){
    const sessionId = window.activeSessionId;
    if(!sessionId){ showMessageModal('Atención','No hay sesión activa para exportar'); return; }
    return exportSessionById(sessionId);
}

// Export a specific session by id
async function exportSessionById(sessionId){
    try{
        // Prefer backend XLSX export for sessions
        const url = `/attendance/sessions/${sessionId}/export?format=xlsx`;
        const res = await fetch(`${API_BASE}${url}`);
        if(res.ok){
            const blob = await res.blob();
            const contentDisposition = res.headers.get('content-disposition') || '';
            let filename = `attendance_session_${sessionId}.xlsx`;
            const m = contentDisposition.match(/filename="?([^";]+)"?/);
            if(m) filename = m[1];
            const urlObj = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = urlObj; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(urlObj);
            return;
        }
        // Fallback: build CSV client-side
        const r2 = await apiFetch(`/attendance/sessions/${sessionId}/records`);
        const records = r2.records || [];
        if(records.length === 0){ showMessageModal('Atención','No hay registros para esta sesión.'); return; }
        const headers = ['RecordID','Alumno ID','Alumno','Estado','Marcado En'];
        const rows = records.map(r => [String(r.record_id), String(r.student_user_id), r.student_name || '', (r.status === 'present' ? 'Presente' : 'Ausente'), r.marked_at ? new Date(r.marked_at).toLocaleString() : '']);
        downloadCSV(`attendance_session_${sessionId}.csv`, headers, rows);
    }catch(err){ console.error('Error export session', err); showMessageModal('Error','Error al exportar sesión.'); }
}

async function exportarAsistenciaCSV() {
    // Try backend XLSX export for the current section
    const sectionId = document.getElementById('filtro-curso-alumnos').value;
    if(!sectionId){ showMessageModal('Atención','Seleccione una sección primero'); return; }
    try{
        const url = `${API_BASE}/attendance/sections/${sectionId}/report/export?format=xlsx`;
        const res = await fetch(url);
        if(res.ok){
            const blob = await res.blob();
            const contentDisposition = res.headers.get('content-disposition') || '';
            let filename = `attendance_report_section_${sectionId}.xlsx`;
            const m = contentDisposition.match(/filename="?([^";]+)"?/);
            if(m) filename = m[1];
            const urlObj = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = urlObj; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(urlObj);
            return;
        }
    }catch(e){ console.warn('Backend export failed, falling back to CSV', e); }

    // Fallback: build CSV from table DOM
    const table = document.getElementById("tabla-reporte-asistencia");
    const bodyRows = table.querySelectorAll("tbody tr");
    if(bodyRows.length === 0) { showMessageModal('Atención','No hay datos para exportar'); return; }

    let csvContent = "data:text/csv;charset=utf-8,Alumno,Estado\n";
    bodyRows.forEach(row => {
        const cols = row.querySelectorAll("td");
        const nombre = cols[0].innerText.replace(/\n/g, ' ').replace(/,/g, '');
        const estado = cols[1].innerText.replace(/\n/g, ' ').replace(/,/g, '');
        csvContent += `${nombre},${estado}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", 'Reporte_Asistencia.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Helper: genera CSV con BOM y descarga (campos entrecomillados)
function downloadCSV(filename, headers, rows){
    const BOM = '\uFEFF';
    const escapeCell = (value) => '"' + String(value || '').replace(/"/g, '""') + '"';
    const csvRows = [];
    csvRows.push(headers.map(h => escapeCell(h)).join(','));
    rows.forEach(r => csvRows.push(r.map(c => escapeCell(c)).join(',')));
    const csvString = BOM + csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Exponer funciones que se usan desde atributos onclick en el HTML (evita ReferenceError cuando el script se carga como módulo)
Object.assign(window, {
    showSection,
    exportarAlumnosCSV,
    alumnosPrev,
    alumnosNext,
    alumnosChangePageSize,
    exportSessionCSV,
    exportSessionById,
    exportarAsistenciaCSV,
    openGradeModal,
    loadSessionRecords,
    markPresent,
    cargarSesiones,
    renderEntregas,
    openManageAssignment,
    openEditActivityModal,
    confirmDeleteActivity,
    confirmDeleteAssignment
});
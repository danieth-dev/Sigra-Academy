const API_URL = 'http://localhost:5200/api';

document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('sigra_user'));
    if (!user) {
        console.warn("Sin sesión activa.");
        return;
    }
    const activeId = user.user_id || user.id;
    // 1. Mostrar nombre en el Header
    const nameLabel = document.getElementById('prof-user-name');
    if (nameLabel) nameLabel.textContent = `${user.first_name} ${user.last_name}`;

    try {
        const res = await fetch(`${API_URL}/assignments/teacher/${user.id}/courses`);
        const data = await res.json();

        if (res.ok && data.courses && data.courses.length > 0) {
            const assignment = data.courses[0];
            sessionStorage.setItem('active_assignment', assignment.assignment_id);
            // 3. Ejecutar cargas iniciales
            cargarActividadesProf(assignment.assignment_id);
            cargarMaterialApoyo(assignment.assignment_id); 
        }
    } catch (error) {
        console.error("Error en la carga inicial:", error);
    }
    const formRecurso = document.getElementById('form-nuevo-recurso');
    if (formRecurso) {
        formRecurso.addEventListener('submit', manejarSubidaRecurso);
    }
});
// --- 1. FUNCIÓN: CARGAR ACTIVIDADES (TAREAS) ---
async function cargarActividadesProf(assignmentId) {
    try {
        const res = await fetch(`${API_URL}/assignments/assignment/${assignmentId}/activities`);
        const data = await res.json();
        const lista = document.getElementById('lista-tareas-prof');
        if (!lista) return;
        lista.innerHTML = '';
        if (data.activities && data.activities.length > 0) {
            data.activities.forEach(act => {
                lista.innerHTML += `<div class="tarea-item">
                    <h4>${act.title}</h4>
                    <p>Fecha: ${new Date(act.due_date).toLocaleDateString()}</p>
                </div>`;
            });
        } else {
            lista.innerHTML = '<p>No hay actividades creadas.</p>';
        }
    } catch (e) { console.error("Error actividades:", e); }
}
// --- 2. FUNCIÓN: CARGAR RECURSOS (REPOSITORIO) ---
async function cargarMaterialApoyo() {
    const assignmentId = sessionStorage.getItem('active_assignment');
    if (!assignmentId) return;
    try {
        const res = await fetch(`${API_URL}/resources/assignments/${assignmentId}/resources`);
        const data = await res.json();
        const contenedor = document.getElementById('lista-recursos'); 
        if (!contenedor) return;
        contenedor.innerHTML = '';
        if (data.resources && data.resources.length > 0) {
            contenedor.innerHTML = data.resources.map(r => `
                <div class="card" style="padding:15px; text-align:center; border:1px solid #eee; border-radius:12px; position:relative; min-height:180px;">
                    
                    <div style="position:absolute; top:10px; right:10px; display:flex; gap:8px;">
                        <button onclick="prepararEdicion(${r.resource_id}, '${r.title}', '${r.resource_type}')" 
                                style="background:none; border:none; color:#2ecc71; cursor:pointer; font-size:1.1rem;" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="eliminarRecurso(${r.resource_id})" 
                                style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:1.1rem;" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>

                    <i class="fas ${r.resource_type === 'PDF' ? 'fa-file-pdf' : 'fa-link'}" style="font-size: 2em; color: #123E6A; margin-top:10px;"></i>
                    <h4 style="margin:10px 0; font-size:1rem;">${r.title}</h4>
                    <p style="font-size:0.75em; color:#666; margin-bottom:10px;">Tipo: ${r.resource_type}</p>
                    
                    <a href="http://localhost:5200/uploads/resources/${r.file_path_or_url.split('\\').pop()}" target="_blank" 
                       class="btn-primario" style="text-decoration:none; display:inline-block; font-size:0.85rem; padding:5px 10px; background:#123E6A; color:white; border-radius:5px;">
                        <i class="fas fa-external-link-alt"></i> Ver Recurso
                    </a>
                </div>
            `).join('');
        } else {
            contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">No hay materiales subidos para esta materia.</p>';
        }
    } catch (e) { 
        console.error("Error cargando recursos:", e); 
    }
}
function abrirModalRecurso() {
    const modal = document.getElementById('modal-recurso');
    if (modal) {
        modal.style.display = 'flex';
    }
}
let editMode = false;
let currentResourceId = null;
function abrirModalRecurso() {
    const modal = document.getElementById('modal-recurso');
    if (modal) modal.style.display = 'flex';
}
function cerrarModalRecurso() {
    const modal = document.getElementById('modal-recurso');
    if (modal) {
        modal.style.display = 'none';
        resetFormularioRecurso();
    }
}
function resetFormularioRecurso() {
    editMode = false;
    currentResourceId = null;
    const form = document.getElementById('form-nuevo-recurso');
    if (form) form.reset();
    const tituloModal = document.querySelector('#modal-recurso h2');
    if (tituloModal) tituloModal.innerText = "Subir Nuevo Material";
}
function prepararEdicion(id, titulo, tipo) {
    editMode = true;
    currentResourceId = id;
    document.getElementById('res-title').value = titulo;
    document.getElementById('res-type').value = tipo;
    const tituloModal = document.querySelector('#modal-recurso h2');
    if (tituloModal) tituloModal.innerText = "Editar Recurso";
    abrirModalRecurso();
}
async function eliminarRecurso(id) {
    if (!confirm("¿Seguro que quieres eliminar este recurso permanentemente?")) return;
    try {
        const res = await fetch(`${API_URL}/resources/delete/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            alert("✅ Recurso eliminado correctamente");
            cargarMaterialApoyo();
        } else {
            const err = await res.json();
            alert("❌ Error: " + (err.error || "No se pudo eliminar"));
        }
    } catch (e) {
        console.error("Error al borrar:", e);
    }
}
function cerrarModalRecurso() {
    const modal = document.getElementById('modal-recurso');
    if (modal) {
        modal.style.display = 'none';
    }
}
window.abrirModalRecurso = abrirModalRecurso;
window.cerrarModalRecurso = cerrarModalRecurso;
// --- 3. FUNCIÓN: MANEJAR SUBIDA DE ARCHIVOS ---
async function manejarSubidaRecurso(e) {
    e.preventDefault();
    const assignmentId = sessionStorage.getItem('active_assignment');
    if (!assignmentId) return alert("Error: No hay asignatura activa.");
    const formData = new FormData();
    formData.append('title', document.getElementById('res-title').value);
    formData.append('resource_type', document.getElementById('res-type').value);
    if (!editMode) {
        formData.append('assignment_id', assignmentId);
    }
    const fileInput = document.getElementById('res-file');
    if (fileInput.files[0]) {
        formData.append('file_path_or_url', fileInput.files[0]);
    } else if (!editMode) {
        return alert("Por favor selecciona un archivo");
    }
    const url = editMode 
        ? `${API_URL}/resources/update/${currentResourceId}` 
        : `${API_URL}/resources/create`;
    const method = editMode ? 'PATCH' : 'POST';
    try {
        const res = await fetch(url, {
            method: method,
            body: formData
        });
        if (res.ok) {
            alert(editMode ? "✅ Recurso actualizado" : "✅ Recurso creado");
            cerrarModalRecurso();
            cargarMaterialApoyo();
        } else {
            const err = await res.json();
            alert("❌ Error: " + (err.error || "Fallo en la operación"));
        }
    } catch (err) {
        console.error("Error en petición:", err);
    }
}
async function cargarListaAlumnos() {
    const assignmentId = sessionStorage.getItem('active_assignment'); 
    if (!assignmentId) return;
    try {
        const res = await fetch(`${API_URL}/assignments/assignment/${assignmentId}/people`);
        const data = await res.json();
        const listaAlumnos = data.people?.students || []; 
        const tablaBody = document.getElementById('lista-alumnos-body');
        if (!tablaBody) return;
        tablaBody.innerHTML = ''; 
        if (listaAlumnos.length > 0) {
            listaAlumnos.forEach((alumno, index) => {
                tablaBody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${alumno.name}</td>
                        <td><span class="status-badge">Sección 1</span></td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="verPerfilAlumno(${alumno.user_id})">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            tablaBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay alumnos inscritos en esta sección.</td></tr>';
        }
    } catch (error) {
        console.error("Error al procesar la lista:", error);
    }
}
async function cargarTablaAsistencia() {
    const assignmentId = sessionStorage.getItem('active_assignment');
    const tablaBody = document.getElementById('lista-asistencia-body'); // Asegúrate de que este ID exista en el HTML
    if (!tablaBody) return;
    try {
        const res = await fetch(`${API_URL}/assistance/assignment/${assignmentId}`);
        const data = await res.json();
        console.log("Datos de asistencia recibidos:", data);
        tablaBody.innerHTML = ''; 
        // Según tu JSON, los datos vienen en data.assistances
        const registros = data.assistances || [];
        if (registros.length > 0) {
            registros.forEach(asist => {
                // Formateamos la fecha para que sea legible (Día/Mes/Año Hora:Min)
                const fecha = new Date(asist.access_timestamp);
                const fechaFormateada = fecha.toLocaleDateString() + ' ' + 
                                       fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                tablaBody.innerHTML += `
                    <tr>
                        <td>${asist.student_name}</td>
                        <td>${asist.subject_name}</td>
                        <td><span class="badge-time">${fechaFormateada}</span></td>
                        <td>
                            <span class="status-online">
                                <i class="fas fa-circle"></i> Registrado
                            </span>
                        </td>
                    </tr>
                `;
            });
        } else {
            tablaBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay registros de acceso hoy.</td></tr>';
        }
    } catch (error) {
        console.error("Error al cargar asistencia:", error);
    }
}
let editandoTareaId = null; 

async function cargarTareas() {
    const assignmentId = sessionStorage.getItem('active_assignment');
    const panel = document.getElementById('assignment-activities-panel');

    // Validación de espacio definido
    if (!panel) {
        console.error("Error: El espacio 'assignment-activities-panel' NO existe en el HTML.");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/activities/assignments/${assignmentId}/activities`);
        const data = await res.json();

        console.log("Respuesta del servidor para ID " + assignmentId + ":", data);
        panel.innerHTML = '<h3>Tareas Actuales</h3>';
        const lista = data.activities || (Array.isArray(data) ? data : []);

        if (lista.length > 0) {
            // Dentro de la función cargarTareas() en profesor.js
lista.forEach(t => {
    panel.innerHTML += `
        <div class="tarea-item" style="padding:15px; border:1px solid #eee; margin-bottom:12px; border-radius:10px; background:#f9f9f9; border-left:5px solid #123E6A;">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <strong style="color:#123E6A;">${t.title}</strong>
                <div>
                    <button onclick="prepararEdicionTarea('${t.activity_id}', '${t.title}', '${t.description}', '${t.weight_percentage}', '${t.due_date}')" class="btn-icon" style="color: #2980b9; border:none; background:none; cursor:pointer; margin-right:10px;"><i class="fas fa-edit"></i></button>
                    <button onclick="eliminarTarea('${t.activity_id}')" class="btn-icon" style="color: #c0392b; border:none; background:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <p style="font-size:0.9rem; margin:8px 0;">${t.description}</p>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#666;">
                <span><i class="fas fa-calendar"></i> ${new Date(t.due_date).toLocaleDateString()}</span>
                <strong>${t.weight_percentage}%</strong>
            </div>
        </div>`;
});
        } else {
            panel.innerHTML += '<p>No se encontraron tareas registradas para esta materia.</p>';
        }
    } catch (error) {
        console.error("Error cargando tareas:", error);
    }
}

// --- FUNCIÓN PARA ELIMINAR ---
async function eliminarTarea(id) {
    if (!confirm('¿Estás seguro de eliminar esta actividad?')) return;

    try {
        // Usando tu ruta específica: /api/activities/delete/{id}
        const res = await fetch(`${API_URL}/activities/delete/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert('Tarea eliminada correctamente');
            cargarTareas(); 
        } else {
            alert('No se pudo eliminar la tarea');
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
    }
}

// --- FUNCIÓN PARA PREPARAR LA EDICIÓN ---
function prepararEdicionTarea(id, titulo, desc, peso, fecha) {
    editandoTareaId = id;
    
    // Llenamos el formulario con los datos actuales
    document.getElementById('tarea-titulo').value = titulo;
    document.getElementById('tarea-desc').value = desc;
    document.getElementById('tarea-weight').value = peso;
    
    // Formatear fecha para el input (YYYY-MM-DD)
    const d = new Date(fecha);
    document.getElementById('tarea-fin').value = d.toISOString().split('T')[0];

    // Cambiamos el texto del botón
    const btn = document.querySelector('#form-crear-tarea button');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-sync"></i> Actualizar Actividad';
        btn.style.background = '#27ae60';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- MANEJADOR DEL FORMULARIO (CREAR Y ACTUALIZAR) ---
document.getElementById('form-crear-tarea')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const assignmentId = sessionStorage.getItem('active_assignment');
    
    const datosTarea = {
        assignment_id: parseInt(assignmentId),
        title: document.getElementById('tarea-titulo').value,
        description: document.getElementById('tarea-desc').value,
        weight_percentage: parseFloat(document.getElementById('tarea-weight').value),
        due_date: document.getElementById('tarea-fin').value
    };

    try {
        let url, metodo;

        if (editandoTareaId) {
            // RUTA PATCH según tu ejemplo: /api/activities/update/{id}
            url = `${API_URL}/activities/update/${editandoTareaId}`;
            metodo = 'PATCH';
        } else {
            // RUTA POST según tu ejemplo anterior: /api/activities/create
            url = `${API_URL}/activities/create`;
            metodo = 'POST';
        }

        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosTarea)
        });

        if (res.ok) {
            alert(editandoTareaId ? "Actividad actualizada" : "Actividad creada");
            
            // Limpiar formulario y estado
            e.target.reset();
            editandoTareaId = null;
            const btn = document.querySelector('#form-crear-tarea button');
            btn.innerHTML = '<i class="fas fa-save"></i> Publicar Actividad';
            btn.style.background = '#123E6A';
            
            cargarTareas(); 
        } else {
            const error = await res.json();
            alert("Error: " + (error.message || "Operación fallida"));
        }
    } catch (error) {
        console.error("Error de conexión:", error);
    }
});

// --- 5. NAVEGACIÓN Y UTILIDADES ---
function showSection(sectionId) {
    // Oculta todas las secciones
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    
    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = 'block';
        if (sectionId === 'mi-curso') cargarMaterialApoyo();{
        }if (sectionId === 'alumnos' || sectionId === 'asistencia') {
            cargarListaAlumnos();
        } else if (sectionId === 'crear-tarea') {
            cargarTareas(); 
        } else if (sectionId === 'tareas-recibidas') {
            cargarEntregasParaCalificar();
        }
        if (sectionId === 'asistencia') cargarTablaAsistencia();
    }
}
function cerrarSesion() {
    sessionStorage.clear();
    window.location.href = '../access-control-I/login.html';
}

// --- 6. FUNCION: CARGAR ENTREGAS PARA CALIFICAR ---
async function cargarEntregasParaCalificar(){
    const assignmentId = sessionStorage.getItem('active_assignment');
    const tablaBody = document.getElementById('submissions-body') || document.getElementById('lista-entregas-profesor');
    if(!tablaBody) return;
    if(!assignmentId) return tablaBody.innerHTML = '<tr><td colspan="6">No hay asignación activa.</td></tr>';
    tablaBody.innerHTML = '<tr><td colspan="6">Cargando entregas...</td></tr>';
    try{
        // Obtener actividades de la asignación
        const resAct = await fetch(`${API_URL}/assignments/assignment/${assignmentId}/activities`);
        const dataAct = await resAct.json();
        const activities = dataAct.activities || [];
        const rows = [];
        for(const a of activities){
            try{
                const r = await fetch(`${API_URL}/submissions/activities/${a.activity_id}/submissions`);
                const jd = await r.json();
                const subs = jd.submissions || jd.data || [];
                // intentar obtener calificaciones existentes para esta actividad
                let grades = [];
                try{
                    const rg = await fetch(`${API_URL}/grades-log/activity/${a.activity_id}`);
                    const jg = await rg.json();
                    grades = jg.grades || [];
                }catch(e){ /* ignore */ }

                subs.forEach(s => {
                    const studentName = s.student_name || s.student || s.submitter_name || '';
                    const fileName = s.file_path || s.file_path_or_url || '';
                    const fileUrl = fileName ? `${API_URL.replace('/api','')}/uploads/submissions/${fileName.split('\\').pop()}` : '';
                    const gradeObj = grades.find(g => String(g.student_user_id) === String(s.student_user_id));
                    const score = gradeObj ? (gradeObj.score ?? '-') : '-';
                    rows.push(`
                        <tr>
                            <td>${studentName}</td>
                            <td>${a.title || ''}</td>
                            <td>${fileUrl ? `<a href="${fileUrl}" target="_blank">Ver</a>` : '-'}</td>
                            <td>${s.submission_date ? new Date(s.submission_date).toLocaleString() : (s.created_at ? new Date(s.created_at).toLocaleString() : '-')}</td>
                            <td>${score}</td>
                            <td><button class="btn" onclick="window.openGradeCreate(${a.activity_id}, ${s.student_user_id})">Calificar</button></td>
                        </tr>
                    `);
                })
            }catch(e){
                console.warn('Error cargando entregas para actividad', a.activity_id, e);
            }
        }
        tablaBody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="6">No hay entregas para calificar.</td></tr>';
    }catch(e){
        console.error('Error cargando entregas:', e);
        tablaBody.innerHTML = '<tr><td colspan="6">Error al obtener entregas.</td></tr>';
    }
}


// Exponer funciones globales
// --- EXPOSICIÓN GLOBAL ---
Object.assign(window, {
    showSection,
    abrirModalRecurso,
    cerrarModalRecurso,
    prepararEdicion,
    eliminarRecurso,
    manejarSubidaRecurso,
    cerrarSesion,
    refreshSubmissions: cargarEntregasParaCalificar
});

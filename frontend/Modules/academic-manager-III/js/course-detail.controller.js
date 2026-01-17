const API_URL = 'http://localhost:3000/api/manager'; 

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const assignmentId = params.get('assignmentId');

    if (!assignmentId) {
        window.location.href = 'manager.view.html';
        return;
    }

    initTabs();
    loadCourseHeader(assignmentId);
    loadActivities(assignmentId);
    loadResources(assignmentId); 
});

function initTabs() {
    const buttons = document.querySelectorAll('.tab-button');
    const panels = document.querySelectorAll('.tab-panel');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            buttons.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });
}

// Función para obtener los SVGs profesionales
function getIcon(type) {
    const isPdf = type.toLowerCase().includes('pdf');
    
    if (isPdf) {
        return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
    } else {
        return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
    }
}

async function loadCourseHeader(assignmentId) {
    try {
        const response = await fetch(`${API_URL}/courses/${assignmentId}/detail`);
        const { data, success } = await response.json();
        if (success) {
            document.getElementById('course-name').textContent = data.subject_name;
            document.getElementById('course-code').textContent = data.academic_year || 'PERIODO ACADÉMICO';
            document.getElementById('course-teacher').innerHTML = `Profesor: <strong>${data.teacher_name}</strong>`;
            document.getElementById('course-section').textContent = `${data.grade_name} · Sección ${data.section_name}`;
        }
    } catch (error) { console.error(error); }
}

async function loadResources(assignmentId) {
    const container = document.getElementById('resources-container');
    try {
        const response = await fetch(`${API_URL}/courses/${assignmentId}/materials`);
        const { data, success } = await response.json();

        if (!success || data.length === 0) {
            container.innerHTML = '<div class="panel-placeholder"><h2>No hay materiales disponibles.</h2></div>';
            return;
        }

        container.innerHTML = data.map(res => {
            const isPdf = res.type.toLowerCase().includes('pdf') || res.url.endsWith('.pdf');
            
            return `
                <a href="${res.url}" target="_blank" class="resource-item">
                    <div class="resource-icon ${isPdf ? 'pdf' : 'link'}">
                        ${getIcon(res.type)}
                    </div>
                    <div class="resource-info">
                        <div class="resource-title">${res.title}</div>
                        <div class="resource-meta">${isPdf ? 'Documento PDF' : 'Enlace Externo'} • Material de apoyo</div>
                    </div>
                    <div class="action-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                    </div>
                </a>
            `;
        }).join('');
    } catch (error) { console.error(error); }
}

async function loadActivities(assignmentId) {
    const container = document.getElementById('classwork-container');
    try {
        const response = await fetch(`${API_URL}/courses/${assignmentId}/activities`);
        const { data, success } = await response.json();
        
        if (!success || data.length === 0) {
            container.innerHTML = '<div class="panel-placeholder"><h2>No hay actividades publicadas.</h2></div>';
            return;
        }

        container.innerHTML = data.map(activity => {
            const dueDate = new Date(activity.due_date);
            const isLate = dueDate < new Date();
            
            return `
                <article class="activity-card ${isLate ? 'status-late' : 'status-pending'}">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">${activity.title}</h3>
                            <span class="card-weight">${activity.weight_percentage}% Ponderación</span>
                        </div>
                        <span class="status-badge ${isLate ? 'late' : 'pending'}">${isLate ? 'RETRASADO' : 'PENDIENTE'}</span>
                    </div>
                    <div class="card-footer">
                        <div class="time-remaining">
                            <span style="display:block; font-size: 0.75rem;">Fecha límite: ${dueDate.toLocaleDateString()}</span>
                            <strong>${isLate ? 'Cerrado' : 'Vence pronto'}</strong>
                        </div>
                        <button class="ghost-btn">Entregar tarea</button>
                    </div>
                </article>
            `;
        }).join('');
    } catch (error) { console.error(error); }
}
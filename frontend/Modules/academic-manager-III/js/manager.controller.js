const API_URL = 'http://localhost:3000/api/manager';

const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
const STUDENT_ID = storedUser ? storedUser.user_id : 3;

const courseImages = {
  'Matemáticas I': '../../../Public/resources/Modulo-3/mateLogo.jpg',
  'Matemáticas III': '../../../Public/resources/Modulo-3/mateLogo.jpg',
  'Ciencias Naturales I': '../../../Public/resources/Modulo-3/biologiaLogo.jpg',
  'Historia y Geografía': '../../../Public/resources/Modulo-3/castellanoLogo.jpg',
  'Ciencias Sociales': '../../../Public/resources/Modulo-3/castellanoLogo.jpg',
  'Comunicación y Lenguaje': '../../../Public/resources/Modulo-3/castellanoLogo.jpg',
  'Física': '../../../Public/resources/Modulo-3/fisicaLogo.jpg',
  'Química': '../../../Public/resources/Modulo-3/quimicaLogo.jpg',
  'Biología': '../../../Public/resources/Modulo-3/biologiaLogo.jpg',
  'Default': '../../../Public/resources/Modulo-3/mateLogo.jpg'
};

async function loadCourses() {
  try {
    const response = await fetch(`${API_URL}/courses/${STUDENT_ID}`);
    const data = await response.json();
    
    if (data.success) {
      renderCourses(data.data);
    } else {
      console.error('Error al cargar cursos:', data.message);
      document.querySelector('.cursosDisponibles').innerHTML = `<p>Error: ${data.message}</p>`;
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    document.querySelector('.cursosDisponibles').innerHTML = `<p>No se pudo conectar con el servidor.</p>`;
  }
}

function renderCourses(courses) {
  const container = document.querySelector('.cursosDisponibles');
  container.innerHTML = ''; 

  if (!courses || courses.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6b7280;">No tienes cursos inscritos en este periodo.</p>';
    return;
  }

  courses.forEach(course => {
    const article = document.createElement('article');
    article.className = 'cartaDeCurso';
    const imageUrl = courseImages[course.subject_name] || courseImages['Default'];

    article.innerHTML = `
      <div class="ImagenDelCurso">
        <img src="${imageUrl}" alt="${course.subject_name}" loading="lazy">
        <div class="badge-seccion">${course.grade_name} · Secc. ${course.section_name}</div>
      </div>
      
      <div class="infoDeCurso">
        <h2 class="CursoNombre" title="${course.subject_name}">${course.subject_name}</h2>
        
        <div class="meta-info">
          <!-- Icono de Profesor -->
          <div class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span class="prof-name">${course.teacher_name || 'Sin docente asignado'}</span>
          </div>
          
          <!-- Icono de Calendario/Periodo -->
          <div class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Periodo: ${course.academic_year || '2024-2025'}</span>
          </div>
        </div>
      </div>

      <div class="card-footer">
        <span>Acceder al curso</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </div>
    `;
    article.addEventListener('click', () => {
        window.location.href = `course-detail.html?assignmentId=${course.assignment_id}`;
    });

    container.appendChild(article);
  });
}

document.addEventListener('DOMContentLoaded', loadCourses);

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    loadCourses().catch(err => console.warn('Recarga fallida al volver atrás', err));
  }
});
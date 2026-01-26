document.addEventListener('DOMContentLoaded', () => {
    const navHtml = `
<header class="main-header">
  <nav class="navbar">
    <a href="../../landing/index.html" class="brand">
      <img class="brand-logo" src="/frontend/Public/resources/Modulo-1/logo.png" alt="Logo SIGRA" onerror="this.style.display='none'"/>
      <span>SIGRA</span>
    </a>

    <div class="nav-links" id="nav-links-container">
      <a href="../../landing/index.html">Inicio</a>
      <a href="manager.view.html">Mis Cursos</a>
      <a href="schedule.html">Mi Horario</a>
      <a href="final-report.html">Boletín</a>
    </div>

    <div class="profile-menu">
      <button class="bell" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>
      <div class="profile-wrapper">
        <button class="profile-button" id="profile-button" type="button">
          <span id="profile-avatar">--</span>
        </button>
        <div class="profile-dropdown" id="profile-dropdown" style="display:none;">
          <div class="profile-summary">
            <div class="profile-name" id="profile-name">Cargando...</div>
            <div class="profile-email" id="profile-email">...</div>
          </div>
          <button class="profile-view-btn" id="profile-view-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Mi Perfil
          </button>
          <button class="logout-btn" id="logout-button-nav">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  </nav>
</header>
`;

    document.querySelectorAll('nav.navbar').forEach(n => n.outerHTML = navHtml);

    const API_AUTH = 'http://localhost:5200/api/auth';
    const profileBtn = document.getElementById('profile-button');
    const profileDropdown = document.getElementById('profile-dropdown');

    function highlightCurrentPage() {
        const currentFilename = window.location.pathname.split('/').pop();
        const links = document.querySelectorAll('.nav-links a');

        links.forEach(link => {
            link.classList.remove('active');
            
            // Obtiene el nombre del archivo del enlace (ej: "manager.view.html")
            const linkHref = link.getAttribute('href');
            const targetFilename = linkHref.split('/').pop();

            // Si el archivo de la URL coincide exactamente con el del href
            if (currentFilename === targetFilename) {
                link.classList.add('active');
            }
        });
    }

    function getStoredUser() {
        const raw = localStorage.getItem('sigra_user');
        if (!raw) return null;
        try {
            const user = JSON.parse(raw);
            // Si el login devolvió un array, tomamos el primer elemento
            return Array.isArray(user) ? user[0] : user;
        } catch (_) { return null; }
    }

    function setProfileUI() {
        const user = getStoredUser();
        if (!user) return;
        const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0,2);
        
        document.getElementById('profile-avatar').textContent = initials || '--';
        document.getElementById('profile-name').textContent = name || 'Usuario';
        document.getElementById('profile-email').textContent = user.email || '';
    }

    // Toggle Dropdown
    if(profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = profileDropdown.style.display === 'block';
            profileDropdown.style.display = isVisible ? 'none' : 'block';
        });
    }

    document.addEventListener('click', () => {
        if (profileDropdown) profileDropdown.style.display = 'none';
    });

    document.getElementById('logout-button-nav').addEventListener('click', async () => {
        const currentUser = getStoredUser();
        const userId = currentUser?.user_id || currentUser?.id; 
        
        try {
            if (userId) await fetch(`${API_AUTH}/logout/${userId}`, { method: 'POST' });
        } catch (e) {
            console.error("Error en logout API:", e);
        } finally {
            localStorage.clear();
            window.location.href = '../../access-control-I/login.html';
        }
    });

    if(document.getElementById('profile-view-button')) {
        document.getElementById('profile-view-button').addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }

    setProfileUI();
    highlightCurrentPage();
});
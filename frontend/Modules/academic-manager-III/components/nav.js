document.addEventListener('DOMContentLoaded', () => {
    const navHtml = `
<header class="main-header">
  <nav class="navbar" aria-label="Barra de navegación principal">
    <div class="brand">
      <img class="brand-logo" src="../../Public/resources/Modulo-1/logo.png" alt="Logo SIGRA" onerror="this.style.display='none'"/>
      <span>SIGRA</span>
    </div>

    <div class="nav-links">
      <a href="../../landing/index.html">Inicio</a>
      <a href="manager.view.html">Mis Cursos</a>
      <a href="schedule.html">Mi Horario</a>
    </div>

    <div class="profile-menu">
      <button class="bell" type="button" aria-label="Notificaciones">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>
      <button class="profile-button">LF</button>
    </div>
  </nav>
</header>
`;
    document.querySelectorAll('nav.navbar').forEach(nav => {
      nav.outerHTML = navHtml;
    });

    function resolveLogo(candidates, idx = 0) {
      const img = document.querySelector('.brand-logo');
      if (!img) return;
      if (idx >= candidates.length) { img.style.display = 'none'; return; }
      const testSrc = candidates[idx];
      const tester = new Image();
      tester.onload = () => { img.src = testSrc; };
      tester.onerror = () => resolveLogo(candidates, idx + 1);
      tester.src = testSrc;
    }

    resolveLogo('../../../Public/resources/Modulo-1/logo.png'.split(';'));

    // marcar pestaña activa (map alias course-detail → manager.view.html)
    const current = window.location.pathname.split('/').pop();
    const alias = { 'course-detail.html': 'manager.view.html' };
    const expected = alias[current] || current;
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href') || '';
        const page = href.split('/').pop();
        if (page === expected) link.classList.add('active');
    });
});
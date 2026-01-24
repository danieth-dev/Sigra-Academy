document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'http://localhost:5200/api/auth'
  const profileBtn = document.getElementById('profile-button')
  const profileDropdown = document.getElementById('profile-dropdown')
  const profileAvatar = document.getElementById('profile-avatar')
  const profileInfoName = document.getElementById('profile-info-name')

  function getAuthHeaders() {
    const token = localStorage.getItem('sigra_token') || ''
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  function getStoredUser() {
    const raw = localStorage.getItem('sigra_user')
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch (_) {
      return null
    }
  }

  function clearSessionStorage() {
    localStorage.removeItem('sigra_token')
    localStorage.removeItem('sigra_user')
    localStorage.removeItem('sigra_user_raw')
  }

  async function logoutUser() {
    const stored = getStoredUser()
    const userId = stored?.id || stored?.user_id
    try {
      if (userId) {
        const response = await fetch(`${API_BASE}/logout/${userId}`, {
          method: 'POST',
          headers: { ...getAuthHeaders() }
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          console.warn('No se pudo cerrar sesión en el backend:', err.error || response.statusText)
        }
      }
    } catch (error) {
      console.error('Error llamando a logout en backend:', error)
    } finally {
      clearSessionStorage()
      window.location.href = './login.html'
    }
  }

  function setProfileUI() {
    const user = getStoredUser()
    const name = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : ''
    const initials = name
      ? name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0].toUpperCase())
          .join('')
      : '--'

    if (profileAvatar) profileAvatar.textContent = initials || '--'
    if (profileInfoName) profileInfoName.textContent = name || 'Usuario'
  }

  function toggleProfileDropdown(forceState) {
    if (!profileDropdown || !profileBtn) return
    const isOpen = profileDropdown.classList.contains('open')
    const nextState = forceState !== undefined ? forceState : !isOpen
    profileDropdown.classList.toggle('open', nextState)
    profileBtn.setAttribute('aria-expanded', nextState ? 'true' : 'false')
  }

  async function handleProfileAction(action) {
    if (!action) return
    if (action === 'logout') {
      await logoutUser()
      return
    }

    if (action === 'create') {
      window.location.href = './registro.html'
      return
    }

    if (action === 'edit') {
      const stored = getStoredUser()
      if (stored) {
        // Si existe un modal global `openModal`, intentar abrirlo; si no, navegar a registro
        if (typeof window.openModal === 'function') {
          window.openModal(stored, 'edit')
        } else {
          window.location.href = './registro.html'
        }
      }
    }
  }

  if (profileBtn) {
    profileBtn.addEventListener('click', () => toggleProfileDropdown())
  }

  document.addEventListener('click', (evt) => {
    if (!profileDropdown || !profileBtn) return
    if (!profileDropdown.contains(evt.target) && !profileBtn.contains(evt.target)) {
      toggleProfileDropdown(false)
    }
  })

  if (profileDropdown) {
    profileDropdown.addEventListener('click', (evt) => {
      const item = evt.target.closest('[data-profile-action]')
      if (!item) return
      const action = item.dataset.profileAction
      handleProfileAction(action)
      toggleProfileDropdown(false)
    })
  }

  setProfileUI()
})

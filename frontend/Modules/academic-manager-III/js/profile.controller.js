const API_AUTH = 'http://localhost:5200/api/auth';
const TOKEN = localStorage.getItem('sigra_token');

document.addEventListener('DOMContentLoaded', async () => {
    let storedUser = JSON.parse(localStorage.getItem('sigra_user') || 'null');
    if (!storedUser) { window.location.href = '../../access-control-I/login.html'; return; }

    // Normalizar si es array u objeto
    let user = Array.isArray(storedUser) ? storedUser[0] : storedUser;
    const userId = user.user_id || user.id;
    
    try {
        const response = await fetch(`${API_AUTH}/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        
        if (response.ok && result.user) {
            user = Array.isArray(result.user) ? result.user[0] : result.user;
            localStorage.setItem('sigra_user', JSON.stringify(user));
        }
    } catch (error) {
        console.error("Error sincronizando perfil:", error);
    }

    fillFormData(user);
    setupEventListeners(userId);
});

function fillFormData(user) {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    document.getElementById('full-name-header').textContent = fullName;
    
    // Avatar
    const initials = ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase();
    document.getElementById('avatar-large').textContent = initials || '??';

    // Rellenar inputs
    document.getElementById('input-first-name').value = user.first_name || '';
    document.getElementById('input-last-name').value = user.last_name || '';
    document.getElementById('input-national-id').value = user.national_id || 'No disponible';

    document.getElementById('input-email').value = user.email || '';
    document.getElementById('input-phone').value = user.phone || '';
    
    document.getElementById('input-password').value = ""; 
}

function setupEventListeners(userId) {
    const form = document.getElementById('profile-form');
    const btnSave = document.getElementById('btn-save');
    const togglePass = document.getElementById('toggle-password');
    const inputPass = document.getElementById('input-password');

    togglePass.addEventListener('click', () => {
        const isPassword = inputPass.type === 'password';
        inputPass.type = isPassword ? 'text' : 'password';
        togglePass.style.color = isPassword ? '#2563eb' : '#64748b';
    });

    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const updatedData = {
            email: document.getElementById('input-email').value,
            phone: document.getElementById('input-phone').value,
        };

        // Solo enviamos la contraseña si el usuario escribió algo nuevo
        const newPass = inputPass.value.trim();
        if (newPass !== "") {
            updatedData.password_hash = newPass;
        }

        try {
            btnSave.disabled = true;
            btnSave.textContent = "Guardando...";

            const response = await fetch(`${API_AUTH}/update/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify(updatedData)
            });

            const result = await response.json();

            if (response.ok) {
                alert("¡Perfil actualizado con éxito!");
                
                // Actualizar el objeto local para que los cambios persistan
                const storedUser = JSON.parse(localStorage.getItem('sigra_user'));
                const user = Array.isArray(storedUser) ? storedUser[0] : storedUser;
                const updatedUserObj = { ...user, ...updatedData };
                
                localStorage.setItem('sigra_user', JSON.stringify(updatedUserObj));
                
                window.location.reload();
            } else {
                throw new Error(result.error || "Error al actualizar");
            }
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = "Guardar Cambios";
        }
    };
}
document.addEventListener('DOMContentLoaded', function() {
    // La referencia donde se van a inyectar los campos
    const contenedorDinamico = document.getElementById('dynamic-fields-container');

    if (!contenedorDinamico) return;

    // Solo se mostrará la selección de rol.
    // Nota: SVGs tomados de Heroicons (https://heroicons.com/)
    const htmlEstructura = `
        <div class="input-group">
            <label class="input-label" for="rolSelect">Rol Académico</label>
            <div class="input-control">
                <span class="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M20 21c0-3.5-3.5-6-8-6s-8 2.5-8 6" stroke-linecap="round"/></svg>
                </span>
                <select id="rolSelect" required style="width: 100%; border: none; outline: none; background: transparent; padding: 10px; color: #333;">
                    <option value="">-- Seleccionar --</option>
                    <option value="estudiante">Estudiante</option>
                    <option value="profesor">Profesor</option>
                </select>
            </div>
        </div>
        <div id="rol-extra-fields"></div>
    `;

    // Inyectar HTML
    contenedorDinamico.innerHTML = htmlEstructura;

    // Referencias al select y contenedor para campos dependientes del rol
    const rolSelect = document.getElementById('rolSelect');
    const rolExtraFields = document.getElementById('rol-extra-fields');

    const renderExtraFields = (rol) => {
        if (!rolExtraFields) return;

        if (rol === 'estudiante') {
            rolExtraFields.innerHTML = `
                <div class="input-group">
                    <label class="input-label" for="rep-id">Cédula del representante</label>
                    <div class="input-control">
                        <span class="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7l8 5 8-5" /><rect x="3" y="5" width="18" height="14" rx="2" /></svg>
                        </span>
                        <input id="rep-id" type="text" placeholder="Ej. 12345678" required />
                    </div>
                </div>
                <div class="input-group">
                    <label class="input-label" for="rep-names">Nombre del representante</label>
                    <div class="input-control">
                        <span class="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M20 21c0-3.5-3.5-6-8-6s-8 2.5-8 6" stroke-linecap="round"/></svg>
                        </span>
                        <input id="rep-names" type="text" placeholder="Ej. María José" required />
                    </div>
                </div>
                <div class="input-group">
                    <label class="input-label" for="rep-lastnames">Apellido del representante</label>
                    <div class="input-control">
                        <span class="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M20 21c0-3.5-3.5-6-8-6s-8 2.5-8 6" stroke-linecap="round"/></svg>
                        </span>
                        <input id="rep-lastnames" type="text" placeholder="Ej. Pérez Díaz" required />
                    </div>
                </div>
            `;
            return;
        }

        rolExtraFields.innerHTML = '';
    };

    // Render inicial (por si hay valor preseleccionado)
    renderExtraFields(rolSelect?.value);

    rolSelect?.addEventListener('change', (e) => {
        renderExtraFields(e.target.value);
    });

    // Mostrar/Ocultar mensaje de requisitos de contraseña
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        // Crear el mensaje y agregarlo al DOM
        const passwordGroup = passwordInput.closest('.input-group');
        if (passwordGroup) {
            const requirementsMsg = document.createElement('div');
            requirementsMsg.id = 'password-requirements-msg';
            requirementsMsg.style.display = 'none';
            requirementsMsg.style.background = '#f8d7da'; // color de fondo suave tipo alerta
            requirementsMsg.style.border = '1px solid #f5c2c7';
            requirementsMsg.style.borderRadius = '6px';
            requirementsMsg.style.padding = '10px 16px 10px 32px';
            requirementsMsg.style.marginBottom = '8px';
            requirementsMsg.style.color = '#842029';
            requirementsMsg.style.fontSize = '0.97em';
            requirementsMsg.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
            requirementsMsg.innerHTML = `
                <strong>La contraseña debe cumplir con:</strong>
                <ul style="margin: 6px 0 0 18px; padding: 0; list-style: disc; color: #842029;">
                  <li>Entre 8 y 20 caracteres</li>
                  <li>Al menos una letra mayúscula</li>
                  <li>Al menos una letra minúscula</li>
                  <li>Al menos un número</li>
                  <li>Al menos uno de estos caracteres: <b>- _ + * / ?</b></li>
                </ul>
            `;
            passwordGroup.insertBefore(requirementsMsg, passwordGroup.firstChild);

            passwordInput.addEventListener('focus', function() {
                requirementsMsg.style.display = 'block';
            });
            passwordInput.addEventListener('input', function() {
                if (passwordInput.value.length > 0) {
                    requirementsMsg.style.display = 'none';
                }
            });
            passwordInput.addEventListener('blur', function() {
                if (passwordInput.value.length === 0) {
                    requirementsMsg.style.display = 'none';
                }
            });
        }
    }

    // Handler para crear usuario al presionar "Aceptar"
    const btnAceptar = document.getElementById('btnAceptar');
    if (btnAceptar) {
        btnAceptar.addEventListener('click', async () => {
            const firstName = document.getElementById('names')?.value?.trim();
            const lastName = document.getElementById('lastnames')?.value?.trim();
            const email = document.getElementById('email')?.value?.trim();
            const phone = document.getElementById('phone')?.value?.trim();
            const nationalId = document.getElementById('national_id')?.value?.trim();
            const password = document.getElementById('password')?.value || '';
            const confirmPassword = document.getElementById('confirm-password')?.value || '';
            const rol = document.getElementById('rolSelect')?.value || '';

            const repFirstName = document.getElementById('rep-names')?.value?.trim();
            const repLastName = document.getElementById('rep-lastnames')?.value?.trim();
            const repNationalId = document.getElementById('rep-id')?.value?.trim();



            // Limpiar el teléfono y cédulas para dejar solo dígitos
            const digitsOnlyPhone = (phone || '').replace(/\D/g, '');
            const digitsOnlyNationalId = (nationalId || '').replace(/\D/g, '');
            const digitsOnlyRepNationalId = (repNationalId || '').replace(/\D/g, '');

            // Validación: todos los campos obligatorios (excepto los de representante si no es estudiante)
            if (!firstName || !lastName || !email || !phone || !nationalId || !password || !rol) {
                alert('Por favor completa todos los campos requeridos.');
                return;
            }

            // Validación: cédula del usuario (exactamente 8 dígitos)
            if (!/^[0-9]{8}$/.test(digitsOnlyNationalId)) {
                alert('La cédula del usuario debe tener exactamente 8 dígitos.');
                return;
            }

            // Validación: teléfono (exactamente 11 dígitos)
            if (!/^[0-9]{11}$/.test(digitsOnlyPhone)) {
                alert('El número de teléfono debe tener exactamente 11 dígitos.');
                return;
            }

            // Validar contraseñas: iguales, longitud mínima y complejidad
            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden.');
                return;
            }

            // Longitud mínima
            if ((password || '').length < 8 || (password || '').length > 20) {
                alert('La contraseña debe tener entre 8 y 20 caracteres.');
                return;
            }

            // Debe contener al menos una mayúscula, una minúscula, un número y un carácter especial permitido (- _ + * / ?)
            const pwdRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[-_+\*\/\?]).+$/;
            if (!pwdRegex.test(password)) {
                alert('La contraseña debe contener al menos: una letra mayúscula, una letra minúscula, un número y uno de los caracteres permitidos: - _ + * / ?');
                return;
            }


            // Validaciones de representante solo si es estudiante
            if (rol === 'estudiante') {
                if (!repFirstName || !repLastName || !repNationalId) {
                    alert('Completa todos los datos del representante.');
                    return;
                }
                // Validación: cédula del representante (exactamente 8 dígitos)
                if (!/^[0-9]{8}$/.test(digitsOnlyRepNationalId)) {
                    alert('La cédula del representante debe tener exactamente 8 dígitos.');
                    return;
                }
            }

            // Mapear rol a ID: profesor=2, estudiante=3
            const roleMap = { profesor: 2, estudiante: 3 };
            const role_id = roleMap[rol];
            if (!role_id) {
                alert('Selecciona un rol válido.');
                return;
            }

            const payload = {
                role_id,
                first_name: firstName,
                last_name: lastName,
                email,
                phone: digitsOnlyPhone,
                national_id: digitsOnlyNationalId,
                password_hash: password,
                parents_national_id: rol === 'estudiante' ? String(Number(digitsOnlyRepNationalId)) : "",
                parents_first_name: rol === 'estudiante' ? repFirstName : "",
                parents_last_name: rol === 'estudiante' ? repLastName : ""

            };

            const API_BASE = 'http://localhost:5200/api';
            try {
                const res = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!res.ok) {
                    // Mostrar detalles si la validación Zod falló
                    let msg = data?.error || 'Error al crear el usuario';
                    const issues = data?.details?.issues || data?.details?.error?.issues;
                    if (Array.isArray(issues) && issues.length) {
                        const detailsText = issues.map(i => `${(i.path||[]).join('.')}: ${i.message}`).join('\n');
                        msg += `\n\nDetalles:\n${detailsText}`;
                    }
                    alert(msg);
                    return;
                }

                alert('Usuario creado correctamente');
                console.log('Usuario creado:', data);
                // Redirigir a la tabla de usuarios
                window.location.href = 'user-table.html';
            } catch (err) {
                alert('Error de red: ' + (err?.message || 'intenta nuevamente'));
                console.log(payload);
            }
        });
    }
});
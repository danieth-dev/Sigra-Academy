// Script para mostrar campos de representante al editar/ver estudiante

document.addEventListener('DOMContentLoaded', function() {
  // Suponiendo que tienes un modal o formulario de edición con id 'edit-user-modal' y campos con ids
  // 'edit-role', 'edit-parents_national_id', 'edit-parents_first_name', 'edit-parents_last_name'

  // Función para mostrar/ocultar campos de representante
  function toggleRepresentativeFields(isStudent) {
    const repFields = document.getElementById('representative-fields');
    if (repFields) {
      repFields.style.display = isStudent ? 'block' : 'none';
    }
  }

  // Ejemplo: cuando abres el modal de edición
  window.showEditUserModal = function(user) {
    // user debe tener role_id, parents_national_id, parents_first_name, parents_last_name
    document.getElementById('edit-role').value = user.role_id;
    document.getElementById('edit-national_id').value = user.national_id;
    document.getElementById('edit-first_name').value = user.first_name;
    document.getElementById('edit-last_name').value = user.last_name;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-phone').value = user.phone;
    // ...otros campos

    // Mostrar campos de representante solo si es estudiante (role_id == 3)
    toggleRepresentativeFields(user.role_id == 3);
    if (user.role_id == 3) {
      document.getElementById('edit-parents_national_id').value = user.parents_national_id || '';
      document.getElementById('edit-parents_first_name').value = user.parents_first_name || '';
      document.getElementById('edit-parents_last_name').value = user.parents_last_name || '';
    }
  };

  // Si tienes un select de rol en el formulario de edición, puedes mostrar/ocultar dinámicamente:
  const editRoleSelect = document.getElementById('edit-role');
  if (editRoleSelect) {
    editRoleSelect.addEventListener('change', function() {
      toggleRepresentativeFields(this.value == 3);
    });
  }
});

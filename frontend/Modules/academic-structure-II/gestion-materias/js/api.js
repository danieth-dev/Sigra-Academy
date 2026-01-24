const BASE_URL = "http://localhost:5200/api";

console.log('[API] Módulo api.js cargado. BASE_URL:', BASE_URL);

async function request(path, options = {}) {
	const url = `${BASE_URL}${path}`;
	console.log('[API] Realizando petición a:', url);
	try {
		const res = await fetch(url, {
			headers: { "Content-Type": "application/json" },
			...options,
		});
		console.log('[API] Respuesta recibida:', res.status, res.statusText);
		const data = await res.json().catch(() => null);
		console.log('[API] Datos parseados:', data);
		if (!res.ok) {
			const mensaje = data?.mensaje || data?.message || `Error HTTP ${res.status}`;
			throw new Error(mensaje);
		}
		return data;
	} catch (error) {
		console.error('[API] Error en petición:', error);
		throw error;
	}
}

export async function apiObtenerGrados() {
	const response = await request(`/grades/all`, { method: "GET" });
	// Transformar la respuesta del backend al formato esperado por el frontend
	return {
		data: (response.data || response.grades || []).map(g => ({
			id: g.grade_id,
			nombre: g.grade_name
		}))
	};
}

export async function apiObtenerCatalogoMaterias() {
	const response = await request(`/subjects/all`, { method: "GET" });
	// Transformar la respuesta del backend al formato esperado por el frontend
	return {
		data: (response.subjects || []).map(m => ({
			id: m.subject_id,
			nombre: m.subject_name,
			codigo: m.code_subject,
			sigla: m.code_subject?.substring(0, 3) || "MAT",
			anioId: parseInt(m.anio?.replace(/[^0-9]/g, '')) || m.grade_id || null,
			area: m.area || "todas",
			tipo: m.is_active === 1 ? "troncal" : "complementaria"
		}))
	};
}

export async function apiObtenerMateriasAsignadasPorGrado(gradeId) {
	// Intentar obtener las materias asignadas a un grado específico
	// Por ahora, devuelve un array vacío ya que no hay endpoint específico
	try {
		const response = await request(`/subjects/all`, { method: "GET" });
		const allSubjects = response.subjects || [];
		// Filtrar por el grado (anio)
		const gradeName = `${gradeId}° año`;
		const assignedSubjects = allSubjects.filter(m => m.anio === gradeName);
		return {
			data: assignedSubjects.map(m => ({
				subject_id: m.subject_id,
				id: m.subject_id
			}))
		};
	} catch (error) {
		return { data: [] };
	}
}

export async function apiGuardarMateriasDeGrado(gradeId, subjectIds) {
	// Este endpoint no existe en el backend actual
	// Retornar éxito simulado por ahora
	console.warn('apiGuardarMateriasDeGrado: Endpoint no implementado en backend');
	return { success: true, message: 'Cambios guardados (simulado)' };
}

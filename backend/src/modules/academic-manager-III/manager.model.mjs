// Importar conexión a la base de datos
import { db } from '../../../database/db.database.mjs'

// Obtener cursos de un estudiante
export const getCoursesByStudentId = async (studentId) => {
  try {
    const [rows] = await db.query(
      `SELECT ta.assignment_id,
              s.subject_name,
              sec.section_name,
              g.grade_name,
              ay.name AS academic_year
       FROM enrollments e
       JOIN sections sec ON e.section_id = sec.section_id
       JOIN grades g ON sec.grade_id = g.grade_id
       JOIN academic_years ay ON sec.academic_year_id = ay.year_id
       JOIN teacher_assignments ta ON ta.section_id = sec.section_id
       JOIN subjects s ON ta.subject_id = s.subject_id
       WHERE e.student_user_id = ?`,
      [studentId]
    )
    return rows
  } catch (error) {
    throw new Error(`Error fetching courses: ${error.message}`)
  }
}

// Obtener detalle de un curso
export const getCourseById = async (assignmentId) => {
  try {
    const [rows] = await db.query(
      `SELECT ta.assignment_id,
              s.subject_name,
              sec.section_name,
              g.grade_name,
              ay.name AS academic_year,
              CONCAT(u.first_name, ' ', u.last_name) AS teacher_name
       FROM teacher_assignments ta
       JOIN subjects s ON ta.subject_id = s.subject_id
       JOIN sections sec ON ta.section_id = sec.section_id
       JOIN grades g ON sec.grade_id = g.grade_id
       JOIN academic_years ay ON sec.academic_year_id = ay.year_id
       JOIN users u ON ta.teacher_user_id = u.user_id
       WHERE ta.assignment_id = ?`,
      [assignmentId]
    )
    return rows[0]
  } catch (error) {
    throw new Error(`Error fetching course: ${error.message}`)
  }
}

// Crear un nuevo curso
export const createCourse = async (courseData) => {
  const { teacher_user_id, subject_id, section_id } = courseData
  try {
    const [result] = await db.query(
      'INSERT INTO teacher_assignments (teacher_user_id, subject_id, section_id) VALUES (?, ?, ?)',
      [teacher_user_id, subject_id, section_id]
    )
    return result
  } catch (error) {
    throw new Error(`Error creating course: ${error.message}`)
  }
}
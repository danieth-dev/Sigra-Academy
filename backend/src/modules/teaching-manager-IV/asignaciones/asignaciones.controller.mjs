import { validateCreateAssignment, validateUpdateAssignment, validateCreateActivity, validateUpdateActivity, validateCreateSubmission } from './asignaciones.schema.mjs';
import { notify } from '../../../api/notifications/notifications.service.mjs';

export class AssignmentsController {
    constructor({ModelAssignments, ModelActivities, ModelSubmissions}){
        this.assignments = ModelAssignments;
        this.activities = ModelActivities;
        this.submissions = ModelSubmissions;
    }

    // Assignments
    getAll = async (req,res) => {
        try{
            const result = await this.assignments.getAll();
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.getAll:', error);
            return res.status(500).json({error: 'Error del servidor al obtener las asignaciones.'});
        }
    }

    getByTeacher = async (req,res) => {
        const { teacherId } = req.params;
        try{
            const result = await this.assignments.getByTeacher(teacherId);
            if(result.error) return res.status(404).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.getByTeacher:', error);
            return res.status(500).json({error: 'Error del servidor al obtener las asignaciones por profesor.'});
        }
    }

    getById = async (req,res) => {
        const { assignmentId } = req.params;
        try{
            const result = await this.assignments.getById(assignmentId);
            if(result.error) return res.status(404).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.getById:', error);
            return res.status(500).json({error: 'Error del servidor al obtener la asignación.'});
        }
    }

    create = async (req,res) => {
        const validation = validateCreateAssignment(req.body);
        try{
            if(!validation.success) return res.status(400).json({error: 'Datos inválidos', details: validation.error});
            const result = await this.assignments.create(validation.data);
            if(result.error) return res.status(400).json({error: result.error});
            // Notificar a listeners (SSE) que se ha creado una asignación
            try{ notify('assignment_created', { assignment: result.assignment }); }catch(e){/* no bloquear por notificaciones */}
            return res.status(201).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.create:', error);
            return res.status(500).json({error: 'Error del servidor al crear la asignación.'});
        }
    }

    update = async (req,res) => {
        const { assignmentId } = req.params;
        const validation = validateUpdateAssignment(req.body);
        try{
            if(!validation.success) return res.status(400).json({error: 'Datos inválidos', details: validation.error});
            const result = await this.assignments.update(assignmentId, validation.data);
            if(result.error) return res.status(400).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.update:', error);
            return res.status(500).json({error: 'Error del servidor al actualizar la asignación.'});
        }
    }

    delete = async (req,res) => {
        const { assignmentId } = req.params;
        try{
            const result = await this.assignments.delete(assignmentId);
            if(result.error) return res.status(400).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.delete:', error);
            return res.status(500).json({error: 'Error del servidor al eliminar la asignación.'});
        }
    }

    // Activities
    getActivitiesByAssignment = async (req,res) => {
        const { assignmentId } = req.params;
        try{
            const result = await this.activities.getByAssignment(assignmentId);
            if(result.error) return res.status(404).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.getActivitiesByAssignment:', error);
            return res.status(500).json({error: 'Error al obtener las actividades.'});
        }
    }

    createActivity = async (req,res) => {
        const validation = validateCreateActivity(req.body);
        try{
            if(!validation.success) return res.status(400).json({error: 'Datos inválidos', details: validation.error});
            const result = await this.activities.create(validation.data);
            if(result.error) return res.status(400).json({error: result.error});
            try{ notify('activity_created', { activity: result.activity }); }catch(e){ /* non blocking */ }
            return res.status(201).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.createActivity:', error);
            return res.status(500).json({error: 'Error al crear actividad.'});
        }
    }

    // Get all activities (public)
    getAllActivities = async (req,res) => {
        try{
            const result = await this.activities.getAllActivities();
            if(result.error) return res.status(404).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.getAllActivities:', error);
            return res.status(500).json({error: 'Error al obtener actividades.'});
        }
    }

    // Obtener actividad por ID
    getActivityById = async (req,res) => {
        const { activityId } = req.params;
        try{
            const result = await this.activities.getById(activityId);
            if(result.error) return res.status(404).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.getActivityById:', error);
            return res.status(500).json({error: 'Error al obtener la actividad.'});
        }
    }

    updateActivity = async (req,res) => {
        const { activityId } = req.params;
        const validation = validateUpdateActivity(req.body);
        try{
            if(!validation.success) return res.status(400).json({error: 'Datos inválidos', details: validation.error});
            const result = await this.activities.update(activityId, validation.data);
            if(result.error) return res.status(400).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.updateActivity:', error);
            return res.status(500).json({error: 'Error al actualizar actividad.'});
        }
    }

    deleteActivity = async (req,res) => {
        const { activityId } = req.params;
        try{
            const result = await this.activities.delete(activityId);
            if(result.error) return res.status(400).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.deleteActivity:', error);
            return res.status(500).json({error: 'Error al eliminar actividad.'});
        }
    }

    // Submissions
    createSubmission = async (req,res) => {
        const body = req.body;
        const file = req.file;
        // Coerce numeric fields coming from multipart/form-data (strings) to numbers
        const normalized = {
            activity_id: Number(body.activity_id),
            student_user_id: Number(body.student_user_id),
            comments: body.comments
        };
        const validation = validateCreateSubmission(normalized);
        try{
            if(!validation.success) return res.status(400).json({error: 'Datos de envío inválidos', details: validation.error});
            if(!file) return res.status(400).json({error: 'Archivo de entrega faltante.'});
            const filePath = `${req.protocol}://${req.get('host')}/uploads/submissions/${file.filename}`;
            const result = await this.submissions.create({ activity_id: validation.data.activity_id, student_user_id: validation.data.student_user_id, file_path: filePath, comments: validation.data.comments });
            if(result.error) return res.status(400).json({error: result.error});
            return res.status(201).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.createSubmission:', error);
            return res.status(500).json({error: 'Error al guardar la entrega.'});
        }
    }

    getSubmissionsByActivity = async (req,res) => {
        const { activityId } = req.params;
        try{
            const result = await this.submissions.getByActivity(activityId);
            if(result.error) return res.status(404).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.getSubmissionsByActivity:', error);
            return res.status(500).json({error: 'Error al obtener entregas.'});
        }
    }

    getSubmissionsByStudent = async (req,res) => {
        const { studentId } = req.params;
        try{
            const result = await this.submissions.getByStudent(studentId);
            if(result.error) return res.status(404).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.getSubmissionsByStudent:', error);
            return res.status(500).json({error: 'Error al obtener entregas del estudiante.'});
        }
    }

    getSubmissionById = async (req,res) => {
        const { submissionId } = req.params;
        try{
            const result = await this.submissions.getById(submissionId);
            if(result.error) return res.status(404).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.getSubmissionById:', error);
            return res.status(500).json({error: 'Error al obtener la entrega.'});
        }
    }
    updateSubmission = async (req, res) => {
        const { submissionId } = req.params;
        const file = req.file;
        try{
            if(!file) return res.status(400).json({error: 'Archivo faltante para actualizar.'});
            const filePath = `${req.protocol}://${req.get('host')}/uploads/submissions/${file.filename}`;
            const result = await this.submissions.update(submissionId, filePath);
            if(result.error) return res.status(400).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.updateSubmission:', error);
            return res.status(500).json({error: 'Error al actualizar la entrega.'});
        }
    }
    deleteSubmission = async (req,res) => {
        const { submissionId } = req.params;
        try{
            const result = await this.submissions.delete(submissionId);
            if(result.error) return res.status(400).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.deleteSubmission:', error);
            return res.status(500).json({error: 'Error al eliminar la entrega.'});
        }
    }

    // STUDENT HELPERS
    getStudentsByAssignment = async (req, res) => {
        const { assignmentId } = req.params;
        try{
            const result = await this.assignments.getStudentsByAssignment(assignmentId);
            if(result.error) return res.status(404).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.getStudentsByAssignment:', error);
            return res.status(500).json({error: 'Error al obtener estudiantes.'});
        }
    }

    getAssignmentsByStudent = async (req, res) => {
        const { studentId } = req.params;
        try{
            const result = await this.assignments.getAssignmentsByStudent(studentId);
            if(result.error) return res.status(404).json({error: result.error});
            return res.status(200).json(result);
        }catch(error){
            console.error('Error en AssignmentsController.getAssignmentsByStudent:', error);
            return res.status(500).json({error: 'Error al obtener asignaciones del estudiante.'});
        }
    }
}

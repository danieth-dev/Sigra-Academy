import { CourseResourcesModel } from './course_resources.model.mjs';

export class CourseResourcesController {
    constructor({ModelResources}){ this.model = ModelResources; }

    create = async (req, res) => {
        const { assignment_id, title, resource_type, url } = req.body;
        try{
            let file_path_or_url = url || null;
            if(req.file){ file_path_or_url = `${req.protocol}://${req.get('host')}/uploads/resources/${req.file.filename}`; }
            const result = await this.model.create({ assignment_id: Number(assignment_id), title, resource_type: resource_type || 'PDF', file_path_or_url, is_visible: true });
            if(result.error) return res.status(400).json({ error: result.error });
            return res.status(201).json(result);
        }catch(e){ console.error('Error creating resource', e); return res.status(500).json({ error: 'Error al crear recurso.' }); }
    }

    update = async (req, res) => {
        const { resourceId } = req.params;
        try{
            const fields = req.body || {};
            if(req.file) fields.file_path_or_url = `${req.protocol}://${req.get('host')}/uploads/resources/${req.file.filename}`;
            const result = await this.model.update(resourceId, fields);
            if(result.error) return res.status(400).json({ error: result.error });
            return res.status(200).json(result);
        }catch(e){ console.error('Error updating resource', e); return res.status(500).json({ error: 'Error al actualizar recurso.' }); }
    }

    getByAssignment = async (req, res) => {
        const { assignmentId } = req.params;
        try{
            const result = await this.model.getByAssignment(assignmentId);
            if(result.error) return res.status(404).json({ error: result.error });
            return res.status(200).json(result);
        }catch(e){ console.error('Error getting resources', e); return res.status(500).json({ error: 'Error al obtener recursos.' }); }
    }

    getById = async (req, res) => {
        const { resourceId } = req.params;
        try{
            const result = await this.model.getById(resourceId);
            if(result.error) return res.status(404).json({ error: result.error });
            return res.status(200).json(result);
        }catch(e){ console.error('Error getting resource', e); return res.status(500).json({ error: 'Error al obtener recurso.' }); }
    }

    delete = async (req, res) => {
        const { resourceId } = req.params;
        try{
            const result = await this.model.delete(resourceId);
            if(result.error) return res.status(400).json({ error: result.error });
            return res.status(200).json(result);
        }catch(e){ console.error('Error deleting resource', e); return res.status(500).json({ error: 'Error al eliminar recurso.' }); }
    }
}
import EventEmitter from 'events';

export const NotificationCenter = new EventEmitter();
NotificationCenter.setMaxListeners(1000);

export function notify(event, payload){
    try{ NotificationCenter.emit(event, payload); }
    catch(e){ console.error('Error emitting notification', e); }
}

export function sseHandler(req, res){
    const userId = req.query.user_id || null; // optional
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write('\n');

    // listeners
    const onAssignment = (data) => {
        // Simple filtering: if assignment contains section_id / assignment intended for everybody, we push.
        if(!userId || !data) {
            res.write(`event: assignment_created\ndata: ${JSON.stringify(data)}\n\n`);
            return;
        }
        // If payload includes target students or sectionId it could be filtered here (not implemented)
        res.write(`event: assignment_created\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const onAttendance = (data) => {
        res.write(`event: attendance_created\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const onActivity = (data) => {
        res.write(`event: activity_created\ndata: ${JSON.stringify(data)}\n\n`);
    };

    NotificationCenter.on('assignment_created', onAssignment);
    NotificationCenter.on('attendance_created', onAttendance);
    NotificationCenter.on('activity_created', onActivity);

    req.on('close', () => {
        NotificationCenter.off('assignment_created', onAssignment);
        NotificationCenter.off('attendance_created', onAttendance);
        NotificationCenter.off('activity_created', onActivity);
    });
}

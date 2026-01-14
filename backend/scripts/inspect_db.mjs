import { db } from '../database/db.database.mjs';

(async ()=>{
    try{
        const [users] = await db.query("SELECT COUNT(*) as c FROM users");

        // Prefer the actual table name used by the app. Fall back to legacy `assignments` if needed.
        let assignmentsCount = null;
        try {
            const [assignments] = await db.query("SELECT COUNT(*) as c FROM teacher_assignments");
            assignmentsCount = assignments[0].c;
        } catch(e){
            console.warn('Could not query teacher_assignments:', e.message);
            try {
                const [assignments] = await db.query("SELECT COUNT(*) as c FROM assignments");
                assignmentsCount = assignments[0].c;
            } catch(e2){
                console.warn('Could not query assignments table either:', e2.message);
                assignmentsCount = null;
            }
        }

        const [attendanceSessions] = await db.query("SHOW COLUMNS FROM attendance_sessions");
        console.log('users_count:', users[0].c);
        console.log('assignments_count:', assignmentsCount);
        console.log('attendance_sessions_columns:', attendanceSessions.map(c => ({Field: c.Field, Type: c.Type, Null: c.Null}))); 
        // check if frequency column exists
        const freq = attendanceSessions.find(c => c.Field === 'frequency');
        console.log('attendance_sessions has frequency column:', !!freq);

        // Additional checks for frontend dependencies
        const [roles] = await db.query("SELECT role_id, role_name FROM roles");
        console.log('roles:', roles);

        const [sections] = await db.query("SELECT COUNT(*) as c FROM sections");
        console.log('sections_count:', sections[0].c);

        const [taSample] = await db.query("SELECT assignment_id, teacher_user_id, subject_id, section_id FROM teacher_assignments LIMIT 50");
        console.log('teacher_assignments sample (up to 50):', taSample.slice(0,10));

        const [orphanTA] = await db.query("SELECT ta.assignment_id FROM teacher_assignments ta LEFT JOIN users u ON ta.teacher_user_id = u.user_id WHERE u.user_id IS NULL LIMIT 10");
        console.log('teacher_assignments with missing teacher user (first 10):', orphanTA);

        const [enrolls] = await db.query("SELECT COUNT(*) as c FROM enrollments");
        console.log('enrollments_count:', enrolls[0].c);
        const [enrollSample] = await db.query("SELECT enrollment_id, student_user_id, section_id FROM enrollments LIMIT 20");
        console.log('enrollments_sample (first 20):', enrollSample);
        const [orphanEnroll] = await db.query("SELECT e.enrollment_id FROM enrollments e LEFT JOIN users u ON e.student_user_id = u.user_id WHERE u.user_id IS NULL LIMIT 10");
        console.log('enrollments with missing student user (first 10):', orphanEnroll);

        const [activities] = await db.query("SELECT COUNT(*) as c FROM activities");
        console.log('activities_count:', activities[0].c);

        const [orphanActivities] = await db.query("SELECT a.activity_id FROM activities a LEFT JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id WHERE ta.assignment_id IS NULL LIMIT 10");
        console.log('activities with missing assignment (first 10):', orphanActivities);

        const [attendanceCount] = await db.query("SELECT COUNT(*) as c FROM attendance_sessions");
        console.log('attendance_sessions_count:', attendanceCount[0].c);
        const [attendanceSampleRows] = await db.query("SELECT session_id, assignment_id, week_number, frequency, open_date FROM attendance_sessions ORDER BY created_at DESC LIMIT 10");
        console.log('attendance_sessions latest (up to 10):', attendanceSampleRows);

        process.exit(0);
    }catch(err){
        console.error('DB inspect error:', err);
        process.exit(2);
    }
})();
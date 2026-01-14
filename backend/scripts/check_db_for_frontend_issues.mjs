import { db } from '../database/db.database.mjs';

(async ()=>{
    try{
        console.log('Running DB checks...');

        const q = async (sql) => {
            const [rows] = await db.query(sql);
            return rows;
        };

        const users = await q("SELECT COUNT(*) AS c, GROUP_CONCAT(CONCAT(user_id,':',first_name,' ',last_name) SEPARATOR '; ') AS names FROM users");
        console.log('users_count:', users[0].c);
        console.log('users_sample:', users[0].names);

        const roles = await q("SELECT role_id, role_name FROM roles");
        console.log('roles:', roles);

        const taCount = await q("SELECT COUNT(*) AS c FROM teacher_assignments");
        console.log('teacher_assignments_count:', taCount[0].c);
        const taSample = await q("SELECT assignment_id, teacher_user_id, subject_id, section_id FROM teacher_assignments LIMIT 20");
        console.log('teacher_assignments_sample:', taSample);

        const orphanTA = await q("SELECT ta.assignment_id FROM teacher_assignments ta LEFT JOIN users u ON ta.teacher_user_id = u.user_id WHERE u.user_id IS NULL");
        console.log('teacher_assignments with missing teacher user (first 5):', orphanTA.slice(0,5));

        const sectionsCount = await q("SELECT COUNT(*) AS c FROM sections");
        console.log('sections_count:', sectionsCount[0].c);

        const enrollCount = await q("SELECT COUNT(*) AS c FROM enrollments");
        console.log('enrollments_count:', enrollCount[0].c);
        const enrollSample = await q("SELECT enrollment_id, student_user_id, section_id FROM enrollments LIMIT 20");
        console.log('enrollments_sample:', enrollSample);

        const orphanEnroll = await q("SELECT e.enrollment_id FROM enrollments e LEFT JOIN users u ON e.student_user_id = u.user_id WHERE u.user_id IS NULL");
        console.log('enrollments with missing student user (first 5):', orphanEnroll.slice(0,5));

        const activitiesCount = await q("SELECT COUNT(*) AS c FROM activities");
        console.log('activities_count:', activitiesCount[0].c);

        const submissionsCount = await q("SELECT COUNT(*) AS c FROM submissions");
        console.log('submissions_count:', submissionsCount[0].c);

        const attendanceSessions = await q("SELECT COUNT(*) AS c FROM attendance_sessions");
        console.log('attendance_sessions_count:', attendanceSessions[0].c);
        const attendanceSample = await q("SELECT session_id, assignment_id, week_number, frequency, open_date FROM attendance_sessions ORDER BY created_at DESC LIMIT 10");
        console.log('attendance_sessions_sample:', attendanceSample);

        // Check for orphaned foreign keys
        const orphanSections = await q("SELECT ta.assignment_id FROM teacher_assignments ta LEFT JOIN sections s ON ta.section_id = s.section_id WHERE s.section_id IS NULL");
        console.log('teacher_assignments with missing section (first 5):', orphanSections.slice(0,5));

        const orphanAssignmentsInActivities = await q("SELECT a.activity_id FROM activities a LEFT JOIN teacher_assignments ta ON a.assignment_id = ta.assignment_id WHERE ta.assignment_id IS NULL");
        console.log('activities with missing assignment (first 5):', orphanAssignmentsInActivities.slice(0,5));

        console.log('DB checks completed successfully.');
        process.exit(0);
    }catch(err){
        console.error('DB check error:', err);
        process.exit(2);
    }
})();
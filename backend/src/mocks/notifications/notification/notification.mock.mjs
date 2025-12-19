// Defino el mock para los datos de prueba para la tabla de notifications
export const notificationMock = [
    {
        notification_id: 1,
        user_id: 3,
        title: 'Nueva tarea asignada',
        message: 'Se ha asignado una nueva tarea en la materia Matemáticas.',
        type: 'Alerta',
        is_read: false,
        created_at: '2024-05-01'
    }
    ,
    {
        notification_id: 2,
        user_id: 1,
        title: 'Cambio de horario',
        message: 'El horario de la clase de Historia cambió a 09:00-10:30.',
        type: 'Info',
        is_read: false,
        created_at: '2024-04-28'
    },
    {
        notification_id: 3,
        user_id: 2,
        title: 'Recordatorio: entrega',
        message: 'Recuerda entregar el resumen antes del 15 de abril.',
        type: 'Alerta',
        is_read: true,
        created_at: '2024-04-10'
    },
    {
        notification_id: 4,
        user_id: 3,
        title: 'Mensaje del docente',
        message: 'Se publicó retroalimentación en la actividad Proyecto de Ciencias.',
        type: 'Academico',
        is_read: false,
        created_at: '2024-05-13'
    },
    {
        notification_id: 5,
        user_id: 4,
        title: 'Acceso permitido',
        message: 'Tu cuenta ha sido activada por el administrador.',
        type: 'Info',
        is_read: true,
        created_at: '2024-01-02'
    },
    {
        notification_id: 6,
        user_id: 2,
        title: 'Nueva publicación',
        message: 'Se agregó un nuevo recurso: Guía de estudio.',
        type: 'Academico',
        is_read: false,
        created_at: '2024-02-01'
    },
    {
        notification_id: 7,
        user_id: 1,
        title: 'Mantenimiento programado',
        message: 'El sistema estará en mantenimiento el sábado.',
        type: 'Info',
        is_read: false,
        created_at: '2024-03-15'
    },
    {
        notification_id: 8,
        user_id: 3,
        title: 'Calificación publicada',
        message: 'Tu nota para Actividad 1 ya está disponible.',
        type: 'Academico',
        is_read: false,
        created_at: '2024-05-20'
    },
    {
        notification_id: 9,
        user_id: 4,
        title: 'Recordatorio de reunión',
        message: 'Reunión de padres el próximo lunes a las 17:00.',
        type: 'Info',
        is_read: false,
        created_at: '2024-06-01'
    }
]
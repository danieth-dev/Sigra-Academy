const scheduleData = {
    times: ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'],
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    classes: {
        'Lunes': {
            '7:00 AM': { name: 'Matemáticas', room: 'Aula 4422', span: 2, color: 'matematicas' }
        },
        'Martes': {
            '8:00 AM': { name: 'Biología', room: 'Aula 4403', span: 1, color: 'biologia' },
            '10:00 AM': { name: 'Química', room: 'Aula 1243', span: 2, color: 'quimica' }
        },
        'Miércoles': {
            '7:00 AM': { name: 'Matemáticas', room: 'Aula 4422', span: 2, color: 'matematicas' },
            '11:00 AM': { name: 'Castellano', room: 'Aula 1456', span: 2, color: 'castellano' }
        },
        'Jueves': {
            '8:00 AM': { name: 'Física', room: 'Aula 1244', span: 2, color: 'fisica' }
        },
        'Viernes': {
            '9:00 AM': { name: 'Biología', room: 'Aula 4403', span: 1, color: 'biologia' },
            '11:00 AM': { name: 'Castellano', room: 'Aula 1456', span: 2, color: 'castellano' }
        }
    }
};

function createSchedule() {
    const container = document.getElementById('scheduleContainer');
    const grid = document.createElement('div');
    grid.className = 'schedule-grid';

    // HEADER
    const header = document.createElement('div');
    header.className = 'schedule-header';

    // CORNER
    const cornerCell = document.createElement('div');
    cornerCell.className = 'time-header';
    header.appendChild(cornerCell);

    // DAYS
    scheduleData.days.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        header.appendChild(dayHeader);
    });

    grid.appendChild(header);

    // OCCUPIED CELLS
    const occupiedCells = {};

    scheduleData.times.forEach((time, timeIndex) => {
        // TIME
        const timeCell = document.createElement('div');
        timeCell.className = 'time-cell';
        timeCell.textContent = time;
        grid.appendChild(timeCell);

        // DAY
        scheduleData.days.forEach((day, dayIndex) => {
            const cellKey = `${dayIndex}-${timeIndex}`;

            const classCell = document.createElement('div');
            classCell.className = 'class-cell';

            // CHECKING CLASS AT THIS TIME
            const classInfo = scheduleData.classes[day]?.[time];

            if (classInfo && !occupiedCells[cellKey]) {
                const classBlock = document.createElement('div');
                classBlock.className = `class-block ${classInfo.color}`;

                const className = document.createElement('div');
                className.className = 'class-name';
                className.textContent = classInfo.name;

                const classRoom = document.createElement('div');
                classRoom.className = 'class-room';
                classRoom.textContent = classInfo.room;

                classBlock.appendChild(className);
                classBlock.appendChild(classRoom);
                classCell.appendChild(classBlock);

                // MARK AS OCCUPIED FOR SPANNING
                if (classInfo.span > 1) {
                    classBlock.style.bottom = `calc(-100% * ${classInfo.span - 1} + ${(classInfo.span - 1) * 4}px)`;

                    for (let i = 1; i < classInfo.span; i++)
                        occupiedCells[`${dayIndex}-${timeIndex + i}`] = true;
                }
            }

            grid.appendChild(classCell);
        });
    });

    container.appendChild(grid);
}

// INIT WHEN DOM IS LOADED
document.addEventListener('DOMContentLoaded', createSchedule);
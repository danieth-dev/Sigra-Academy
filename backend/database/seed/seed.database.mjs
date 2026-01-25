import { db } from "../db.database.mjs";
import { 
    usersMock, 
    roleMock, 
    academicYearsMock,
    gradesMock,
    sectionsMock,
    subjectsMock,
} from "../../src/mocks/index.mjs";
import { getSeedFunctionByTable } from "../../src/core/utils/function.util.mjs";
// Función para insertar los datos de prueba en la base de datos
export const seedDatabase = async () => {
    try{
        await db.beginTransaction();
        // Se pasa primero la tabla roles por la dependencia con usuarios
        await getSeedFunctionByTable('roles', roleMock);
        console.log('Datos de roles insertados correctamente');
        await db.commit();
        // Luego se insertan los usuarios
        await getSeedFunctionByTable('users', usersMock);
        console.log('Datos de usuarios insertados correctamente');
        await db.commit();
        // Inserto el resto de los datos de prueba
        await getSeedFunctionByTable('academic_years', academicYearsMock);
        console.log('Datos de años académicos insertados correctamente');
        await db.commit();
        await getSeedFunctionByTable('grades', gradesMock);
        console.log('Datos de grados insertados correctamente');
        await db.commit();
        await getSeedFunctionByTable('sections', sectionsMock);
        console.log('Datos de secciones insertados correctamente');
        await db.commit();
        await getSeedFunctionByTable('subjects', subjectsMock);
        console.log('Datos de materias insertados correctamente');
        await db.commit();
        console.log("Semilla académica insertada correctamente");
        await db.end();
    } 
    catch (error) {
        console.error('Error al insertar los datos de prueba:', error);
        throw error;
    }
}

seedDatabase()
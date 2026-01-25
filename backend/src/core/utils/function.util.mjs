import { db } from "../../../database/db.database.mjs";
import { SETTINGS } from "../../../config/settings.config.mjs";
import jwt from "jsonwebtoken";

// Función para los seed para cargar los mocks dependiendo de la tabla
export async function getSeedFunctionByTable(tableName, mock){
    // Se verifica si hay datos duplicados
    const checkQuery = `SELECT COUNT(*) AS count FROM ${tableName}`;
    const [result] = await db.query(checkQuery);
    if(result[0].count > 0){
        console.log(`La tabla ${tableName} ya contiene datos. Se omite la inserción de datos de prueba.`);
        return;
    }
    for(const item of mock){
        const columns = Object.keys(item).join(', ');
        const values = Object.values(item);
        const placeholders = values.map(() => '?').join(', ');
        const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
        await db.query(insertQuery, values);
    }
}

// Función para cargar todas las rutas de todos los modulos
export function registerRoutes(app, routes) {
    Object.values(routes).forEach(moduleRoutes => {
        if(typeof moduleRoutes === 'object') {
            Object.values(moduleRoutes).forEach(route => {
                app.use(route);
            });
        }
    });
}

// Función para asignar el token al usuario en sesión
export async function assignTokenToSession(userId){
    try{
        const token = jwt.sign({userId}, SETTINGS.JWT_SECRET, {expiresIn: '2h'});
        return token;
    }
    catch(error){
        console.error('Error al asignar el token a la sesión:', error);
        return null;
    }
}
import {createConnection} from 'mysql2/promise.js'
import { SETTINGS } from '../config/settings.config.mjs'

// Wrapper para conexión: intentos en background sin romper la importación
let _conn = null;
let _connecting = false;
let _lastError = null;

async function _attemptConnect(){
    if(_connecting || _conn) return;
    _connecting = true;
    let attempts = 0;
    // Try indefinitely until connected; apply exponential backoff with lower/upper bounds
    while(!_conn){
        try{
            attempts++;
            _conn = await createConnection({
                host: SETTINGS.DB_HOST,
                user: SETTINGS.DB_USER,
                password: SETTINGS.DB_PASSWORD,
                database: SETTINGS.DB_NAME,
                port: SETTINGS.DB_PORT,
                decimalNumbers: true
            });
            console.log('Conexión a la base de datos establecida (intento', attempts + ')');
            _lastError = null;
            break;
        }catch(err){
            console.error('Error al conectar a la base de datos (intento', attempts, '):', err && err.message ? err.message : err);
            _lastError = err;
            // Si después de varios intentos sigue fallando, escribir un mensaje con pasos de diagnóstico
            if(attempts >= 6){
                console.error('Sugerencia: verifique que MySQL/MariaDB esté instalado y corriendo, que las credenciales en .env sean correctas y que la base de datos exista. Ejecute `mysql -u $DB_USER -p` e intente conectarse manualmente.');
            }
            // backoff entre intentos (exponencial, limitado entre 1s y 30s)
            const wait = Math.min(1000 * Math.pow(2, Math.min(attempts, 6)), 30000);
            await new Promise(r => setTimeout(r, wait));
        }
    }
    _connecting = false;
}

// Inicializar intento de conexión en background
_attemptConnect();

// Exportamos un objeto `db` que delega a la conexión real cuando exista
export const db = {
    async query(...args){
        if(!_conn) throw new Error('DB_NOT_CONNECTED');
        return _conn.query(...args);
    },
    async execute(...args){
        if(!_conn) throw new Error('DB_NOT_CONNECTED');
        return _conn.execute(...args);
    },
    async beginTransaction(){
        if(!_conn) throw new Error('DB_NOT_CONNECTED');
        return _conn.beginTransaction();
    },
    async commit(){
        if(!_conn) throw new Error('DB_NOT_CONNECTED');
        return _conn.commit();
    },
    async rollback(){
        if(!_conn) throw new Error('DB_NOT_CONNECTED');
        return _conn.rollback();
    },
    async end(){
        if(_conn){
            try{ await _conn.end(); }catch(e){}
            _conn = null;
        }
    },
    async isConnected(){
        return !!_conn;
    },
    lastError(){ return _lastError; },
    // allow forcing a reconnect for admin/maintenance
    async reconnect(){
        if(_conn){ try{ await _conn.end(); }catch(e){} _conn = null; }
        await _attemptConnect();
    }
};

export const verifyDBConnection = async () => {
    await _attemptConnect();
    return { connected: !!_conn, lastError: _lastError ? String(_lastError.message || _lastError) : null };
}
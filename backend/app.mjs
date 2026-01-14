import express,{json} from "express";
import cors from "cors";
import morgan from "morgan";
import { SETTINGS } from "./config/settings.config.mjs";

// Se inicializan el servidor express
const app = express();

// Capturar señales y errores para trazar la causa de cierres del proceso
process.on('uncaughtException', (err) => {
    console.error('uncaughtException:', err && err.stack ? err.stack : err);
    // Al registrar, hacemos exit con código 1 para facilitar debug externo
    process.exit(1);
});
process.on('unhandledRejection', (reason, p) => {
    console.error('unhandledRejection at:', p, 'reason:', reason);
    process.exit(1);
});
process.on('SIGINT', () => { console.log('SIGINT received, exiting.'); process.exit(0); });
process.on('SIGTERM', () => { console.log('SIGTERM received, exiting.'); process.exit(0); });
process.on('beforeExit', (code) => { console.log('Process beforeExit with code:', code); });
process.on('exit', (code) => { console.log('Process exit with code:', code); });

app.use(cors());
app.use(json());
app.use(morgan("dev"));

// Servir archivos subidos (entregas, recursos)
import path from 'path';
app.use('/uploads', express.static(path.resolve('uploads')));

// Servir archivos estáticos del frontend para páginas HTML, CSS y JS
// Las rutas deben apuntar a la carpeta 'frontend' en la raíz del repo (../frontend desde /backend)
app.use('/frontend', express.static(path.resolve('../frontend')));
// Exponer ruta corta '/Modules' para compatibilidad con enlaces que usan '/Modules/...'
app.use('/Modules', express.static(path.resolve('../frontend/Modules')));
// Exponer carpeta 'Public' si se usan recursos allí (ruta ../Public)
app.use('/Public', express.static(path.resolve('../Public')));

// Rutas básicas
app.get("/", (req, res) => {
	res.send("Servidor funcionando correctamente");
});

// Health check y atajo a vista profesor para facilitar pruebas manuales
app.get('/_health', (req, res) => res.status(200).send('ok'));
app.get('/profesor', (req, res) => res.sendFile(path.resolve('../frontend/Modules/teaching-manager-IV/profesor.html')));

// Diagnostic endpoint: returns process and DB status to help debugging local setups
app.get('/_status', async (req, res) => {
    try{
        const { db, verifyDBConnection } = await import('./database/db.database.mjs');
        try{
            const info = await verifyDBConnection();
            return res.json({ pid: process.pid, port: SETTINGS.PORT, db: info.connected ? 'ok' : 'error', dbError: info.lastError });
        }catch(e){
            return res.status(500).json({ pid: process.pid, port: SETTINGS.PORT, db: 'error', error: String(e.message) });
        }
    }catch(e){
        return res.status(500).json({ pid: process.pid, port: SETTINGS.PORT, error: String(e.message) });
    }
});

// Iniciar servidor y registrar rutas de forma resiliente (no bloquear si DB no está lista)
async function startServer(){
    // Start listening first so /_health responds even if route registration or DB has issues
    const server = app.listen(SETTINGS.PORT, '0.0.0.0', () => {
        console.log(`Servidor escuchando en el puerto http://0.0.0.0:${SETTINGS.PORT}`);
    });
    server.on('error', (err) => {
        console.error('Error en el servidor HTTP:', err && err.stack ? err.stack : err);
        process.exit(1);
    });

    // Attempt to register routes; if it fails, log but keep server running
    try{
        const { registerRoutes } = await import('./src/core/utils/function.util.mjs');
        const { ListRoutes } = await import('./src/api/routes/api.routes.mjs');
        registerRoutes(app, ListRoutes);
        console.log('Rutas registradas correctamente.');
    }catch(err){
        console.error('Advertencia: fallo al registrar rutas (el servidor seguirá corriendo, pero algunas APIs pueden estar indisponibles):', err && err.stack ? err.stack : err);
    }

    // Check DB connection once at startup and provide actionable hint if not connected
    try{
        const { verifyDBConnection } = await import('./database/db.database.mjs');
        const info = await verifyDBConnection();
        if(!info.connected){
            console.warn('Advertencia: No se pudo conectar a la base de datos al iniciar. Consulte /_status para más detalles. Si trabaja en local, asegúrese de que MySQL esté corriendo y que las credenciales en .env sean correctas.');
            if(info.lastError) console.warn('Último error de DB:', info.lastError);
        }
    }catch(e){
        console.warn('Advertencia: fallo al comprobar estado de DB en inicio:', e && e.message ? e.message : e);
    }
}

startServer();

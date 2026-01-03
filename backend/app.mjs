import express, {json} from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { SETTINGS } from './config/settings.config.mjs';
import apiRoutes from './src/api/routes/api.routes.mjs'

// Se inicializan el servidor express
const app = express();

app.use(cors({
    origin: '*',
    crendentials: true
}));
app.use(json());
app.use(morgan('dev'));

// Rutas
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente');
});

app.use('/api', apiRoutes)

// Montamos el servidor
app.listen(SETTINGS.PORT, () => {
    console.log(`Servidor escuchando en el puerto http://localhost:${SETTINGS.PORT}`);
})
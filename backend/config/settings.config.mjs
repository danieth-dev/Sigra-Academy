import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env relative to this config file to avoid issues when working directory differs
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuraciones generales
export const SETTINGS = {
    PORT: process.env.PORT || 3000,
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'sigra_academy',
    DB_PORT: process.env.DB_PORT || 3306,
    JWT_SECRET: process.env.JWT_SECRET || 'YOUR_SECRET_KEY',
    BASE_PATH: process.env.BASE_PATH || '/api'
}
import {z} from "zod";

// Esquema de valdiación para la creación de un usuario
const createdSchemaUser = z.object({
  role_id: z.number().int().positive(),
  national_id: z.string().regex(/^\d+$/,{ message: 'national_id debe contener solo números' }).min(6).max(20),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  email: z.string().email().max(100),
  phone: z.string().min(7).max(15),
  password_hash: z.string().min(6).max(100),
    parents_national_id: z.union([
      z.string().regex(/^\d+$/,{ message: 'parents_national_id debe contener solo números' }).min(6).max(20),
      z.literal(''),
      z.null()
    ]).optional(),
    parents_first_name: z.union([
      z.string().min(1).max(50),
      z.literal(''),
      z.null()
    ]).optional(),
    parents_last_name: z.union([
      z.string().min(1).max(50),
      z.literal(''),
      z.null()
    ]).optional()
});

// Esquema de validación para el inicio de sesión de un usuario
const loginSchemaUser = z.object({
  email: z.string().email().max(100),
  password_hash: z.string().min(6).max(100)
});

// Esquema de validación para la actualización de un usuario
const updateSchemaUser = z.object({
  role_id: z.number().int().positive().optional(),
  national_id: z.string().regex(/^\d+$/,{ message: 'national_id debe contener solo números' }).min(6).max(20).optional(),
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  email: z.string().email().max(100).optional(),
  phone: z.string().min(7).max(15).optional(),
  password_hash: z.string().min(6).max(100).optional(),
  password: z.string().min(6).max(100).optional(),
  is_active: z.boolean().optional(),
    parents_national_id: z.union([
      z.string().regex(/^\d+$/,{ message: 'parents_national_id debe contener solo números' }).min(6).max(20),
      z.literal(''),
      z.null()
    ]).optional(),
    parents_first_name: z.union([
      z.string().min(1).max(50),
      z.literal(''),
      z.null()
    ]).optional(),
    parents_last_name: z.union([
      z.string().min(1).max(50),
      z.literal(''),
      z.null()
    ]).optional()
});

// Función para validar los datos de creación de un usuario
export function validateCreateUser(data){
  return createdSchemaUser.safeParse(data);
}

// Función para validar los datos de inicio de sesión de un usuario
export function validateLoginUser(data){
  return loginSchemaUser.safeParse(data);
}

// Función para validar los datos de actualización de un usuario
export function validateUpdateUser(data){
  return updateSchemaUser.partial().safeParse(data);
}

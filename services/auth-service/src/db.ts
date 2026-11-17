import { Pool } from "pg";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function iniciarDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      uid            TEXT PRIMARY KEY,
      cedula         TEXT UNIQUE,
      nombre         TEXT NOT NULL,
      email          TEXT NOT NULL,
      cargo          TEXT,
      rol            TEXT NOT NULL DEFAULT 'empleado' CHECK (rol IN ('admin', 'empleado')),
      empresa_id     TEXT,
      nombre_empresa TEXT,
      avatar_color   TEXT,
      avatar         TEXT,
      estado         TEXT NOT NULL DEFAULT 'activo',
      creado_en      TIMESTAMPTZ DEFAULT now()
    )
  `);
}
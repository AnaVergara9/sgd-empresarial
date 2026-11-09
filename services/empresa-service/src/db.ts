import { Pool } from "pg";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function iniciarDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS empresas (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre        TEXT NOT NULL,
      nit           TEXT UNIQUE NOT NULL,
      codigo_acceso TEXT UNIQUE NOT NULL,
      creado_en     TIMESTAMPTZ DEFAULT now()
    )
  `);
}
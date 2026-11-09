import { Pool } from "pg";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function iniciarDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS canales (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      empresa_id TEXT NOT NULL,
      nombre     TEXT NOT NULL,
      creado_en  TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS subcanales (
      id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      canal_id  UUID NOT NULL REFERENCES canales(id) ON DELETE CASCADE,
      nombre    TEXT NOT NULL,
      creado_en TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS hilos (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subcanal_id UUID NOT NULL REFERENCES subcanales(id) ON DELETE CASCADE,
      nombre      TEXT NOT NULL,
      creado_en   TIMESTAMPTZ DEFAULT now()
    );
  `);
}
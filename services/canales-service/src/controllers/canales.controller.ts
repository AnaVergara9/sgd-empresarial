import { Request, Response } from "express";
import { pool } from "../db";

// Convierte los errores de la base de datos en respuestas claras.
function responderError(res: Response, error: any) {
  if (error.code === "22P02") {
    return res.status(400).json({ error: "Identificador no válido" });
  }
  if (error.code === "23503") {
    return res.status(404).json({ error: "El elemento padre no existe" });
  }
  console.error(error);
  res.status(500).json({ error: "Error en el servidor" });
}

const limpiarNombre = (valor: unknown) => String(valor || "").trim();

// ---------- CANALES ----------

export async function listarCanales(req: Request, res: Response) {
  const empresaId = String(req.query.empresaId || "");
  if (!empresaId) return res.status(400).json({ error: "Falta empresaId" });

  try {
    const r = await pool.query(
      "SELECT * FROM canales WHERE empresa_id = $1 ORDER BY creado_en ASC",
      [empresaId]
    );
    res.json(r.rows);
  } catch (error) {
    responderError(res, error);
  }
}

export async function crearCanal(req: Request, res: Response) {
  const empresaId = String(req.body.empresaId || "");
  const nombre = limpiarNombre(req.body.nombre);
  if (!empresaId || !nombre) {
    return res.status(400).json({ error: "Faltan empresaId o nombre" });
  }

  try {
    const r = await pool.query(
      "INSERT INTO canales (empresa_id, nombre) VALUES ($1, $2) RETURNING *",
      [empresaId, nombre]
    );
    res.status(201).json(r.rows[0]);
  } catch (error) {
    responderError(res, error);
  }
}

export async function eliminarCanal(req: Request, res: Response) {
  try {
    const r = await pool.query("DELETE FROM canales WHERE id = $1 RETURNING id", [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Canal no encontrado" });
    res.json({ eliminado: true });
  } catch (error) {
    responderError(res, error);
  }
}

// ---------- SUBCANALES ----------

export async function listarSubcanales(req: Request, res: Response) {
  try {
    const r = await pool.query(
      "SELECT * FROM subcanales WHERE canal_id = $1 ORDER BY creado_en ASC",
      [req.params.canalId]
    );
    res.json(r.rows);
  } catch (error) {
    responderError(res, error);
  }
}

export async function crearSubcanal(req: Request, res: Response) {
  const nombre = limpiarNombre(req.body.nombre);
  if (!nombre) return res.status(400).json({ error: "Falta el nombre" });

  try {
    const r = await pool.query(
      "INSERT INTO subcanales (canal_id, nombre) VALUES ($1, $2) RETURNING *",
      [req.params.canalId, nombre]
    );
    res.status(201).json(r.rows[0]);
  } catch (error) {
    responderError(res, error);
  }
}

export async function eliminarSubcanal(req: Request, res: Response) {
  try {
    const r = await pool.query("DELETE FROM subcanales WHERE id = $1 RETURNING id", [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Subcanal no encontrado" });
    res.json({ eliminado: true });
  } catch (error) {
    responderError(res, error);
  }
}

// ---------- HILOS ----------

export async function listarHilos(req: Request, res: Response) {
  try {
    const r = await pool.query(
      "SELECT * FROM hilos WHERE subcanal_id = $1 ORDER BY creado_en ASC",
      [req.params.subcanalId]
    );
    res.json(r.rows);
  } catch (error) {
    responderError(res, error);
  }
}

export async function crearHilo(req: Request, res: Response) {
  const nombre = limpiarNombre(req.body.nombre);
  if (!nombre) return res.status(400).json({ error: "Falta el nombre" });

  try {
    const r = await pool.query(
      "INSERT INTO hilos (subcanal_id, nombre) VALUES ($1, $2) RETURNING *",
      [req.params.subcanalId, nombre]
    );
    res.status(201).json(r.rows[0]);
  } catch (error) {
    responderError(res, error);
  }
}

export async function eliminarHilo(req: Request, res: Response) {
  try {
    const r = await pool.query("DELETE FROM hilos WHERE id = $1 RETURNING id", [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Hilo no encontrado" });
    res.json({ eliminado: true });
  } catch (error) {
    responderError(res, error);
  }
}
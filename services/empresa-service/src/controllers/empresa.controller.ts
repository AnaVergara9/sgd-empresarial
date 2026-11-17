import { Request, Response } from "express";
import { pool } from "../db";

// Registra una empresa y genera su código de acceso.
export async function crearEmpresa(req: Request, res: Response) {
  const nombre = String(req.body.nombre || "").trim();
  const nit = String(req.body.nit || "").trim();

  if (nombre.length < 3 || nit.length < 5) {
    return res.status(400).json({ error: "Completa correctamente los datos" });
  }

  // Código: 3 primeras letras del nombre + últimos 4 dígitos del NIT
  const codigo = `${nombre.substring(0, 3).toUpperCase()}-${nit.slice(-4)}`;

  try {
    const resultado = await pool.query(
      "INSERT INTO empresas (nombre, nit, codigo_acceso) VALUES ($1, $2, $3) RETURNING *",
      [nombre, nit, codigo]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error: any) {
    // 23505 = el NIT o el código ya existen
    if (error.code === "23505") {
      return res.status(409).json({ error: "Ya existe una empresa con ese NIT o ese código de acceso" });
    }
    console.error(error);
    res.status(500).json({ error: "Error al registrar la empresa" });
  }
}

// Busca una empresa por su código de acceso (lo usa el empleado para unirse).
export async function buscarPorCodigo(req: Request, res: Response) {
  const codigo = String(req.params.codigo).trim().toUpperCase();

  try {
    const resultado = await pool.query(
      "SELECT id, nombre FROM empresas WHERE codigo_acceso = $1",
      [codigo]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "Código de empresa no válido." });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al buscar la empresa" });
  }
}
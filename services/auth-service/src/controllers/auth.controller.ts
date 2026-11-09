import { Request, Response } from "express";
import { pool } from "../db";

// Cuando alguien entra: si ya existe lo devuelve, si no, lo crea.
export async function sesion(req: Request, res: Response) {
  const { uid, nombre, email } = req.body;

  if (!uid) {
    return res.status(400).json({ error: "Falta el uid" });
  }

  try {
    const existente = await pool.query("SELECT * FROM usuarios WHERE uid = $1", [uid]);
    if (existente.rows.length > 0) {
      return res.json(existente.rows[0]);
    }

    const nuevo = await pool.query(
      "INSERT INTO usuarios (uid, nombre, email) VALUES ($1, $2, $3) RETURNING *",
      [uid, nombre || "Usuario", email || ""]
    );
    res.status(201).json(nuevo.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
}

// Completa el perfil del usuario: cédula, cargo, rol y empresa.
export async function completarPerfil(req: Request, res: Response) {
  const { uid, cedula, cargo, rol, empresaId, nombreEmpresa } = req.body;

  if (!uid || !cedula) {
    return res.status(400).json({ error: "Faltan el uid o la cédula" });
  }
  if (rol !== "admin" && rol !== "empleado") {
    return res.status(400).json({ error: "El rol debe ser admin o empleado" });
  }

  try {
    const color = rol === "admin" ? "#5865F2" : "#43b581";

    const resultado = await pool.query(
      `UPDATE usuarios
       SET cedula = $2, cargo = $3, rol = $4, empresa_id = $5, nombre_empresa = $6, avatar_color = $7
       WHERE uid = $1
       RETURNING *`,
      [uid, cedula, cargo, rol, empresaId, nombreEmpresa, color]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(resultado.rows[0]);
  } catch (error: any) {
    // 23505 = la cédula ya la tiene otro usuario
    if (error.code === "23505") {
      return res.status(409).json({ error: "Esta cédula ya está registrada en el sistema." });
    }
    console.error(error);
    res.status(500).json({ error: "Error al guardar el perfil" });
  }
}
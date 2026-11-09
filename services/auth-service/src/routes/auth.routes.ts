import { Router } from "express";
import { sesion, completarPerfil } from "../controllers/auth.controller";

const router = Router();

router.post("/sesion", sesion);
router.put("/perfil", completarPerfil);

export default router;
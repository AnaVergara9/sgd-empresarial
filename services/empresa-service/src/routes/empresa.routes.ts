import { Router } from "express";
import { crearEmpresa, buscarPorCodigo } from "../controllers/empresa.controller";

const router = Router();

router.post("/", crearEmpresa);
router.get("/codigo/:codigo", buscarPorCodigo);

export default router;
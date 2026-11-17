import { Router } from "express";
import {
  listarCanales, crearCanal, eliminarCanal,
  listarSubcanales, crearSubcanal, eliminarSubcanal,
  listarHilos, crearHilo, eliminarHilo,
} from "../controllers/canales.controller";

const router = Router();

router.get("/canales", listarCanales);
router.post("/canales", crearCanal);
router.delete("/canales/:id", eliminarCanal);

router.get("/canales/:canalId/subcanales", listarSubcanales);
router.post("/canales/:canalId/subcanales", crearSubcanal);
router.delete("/subcanales/:id", eliminarSubcanal);

router.get("/subcanales/:subcanalId/hilos", listarHilos);
router.post("/subcanales/:subcanalId/hilos", crearHilo);
router.delete("/hilos/:id", eliminarHilo);

export default router;
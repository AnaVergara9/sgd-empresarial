import { Router } from "express";
import {
  listarMensajes, enviarMensaje, alternarReaccion, eliminarMensajesDeHilo,
} from "../controllers/mensajes.controller";

const router = Router();

router.get("/hilos/:hiloId/mensajes", listarMensajes);
router.post("/hilos/:hiloId/mensajes", enviarMensaje);
router.delete("/hilos/:hiloId/mensajes", eliminarMensajesDeHilo);
router.post("/mensajes/:id/reacciones", alternarReaccion);

export default router;
import { Schema, model } from "mongoose";

const mensajeSchema = new Schema(
  {
    hiloId: { type: String, required: true, index: true },
    texto: { type: String, default: "" },
    autorId: { type: String, required: true },
    autorNombre: { type: String, required: true },
    autorAvatar: { type: String, default: "" },
    autorAvatarColor: { type: String, default: "#5865f2" },
    fecha: { type: Date, default: Date.now },
    archivos: {
      type: [{ nombre: String, url: String, tipo: String, tamano: String }],
      default: [],
    },
    // Ejemplo: { "👍": ["uid1", "uid2"] }
    reacciones: { type: Schema.Types.Mixed, default: {} },
    respondidoA: {
      type: { autorNombre: String, texto: String },
      default: null,
    },
  },
  { minimize: false }
);

export const Mensaje = model("Mensaje", mensajeSchema);
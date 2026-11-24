import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  Camera,
  CameraOff,
  Check,
  LoaderCircle,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  UserRound,
} from "lucide-react";

const VIDEO_URL = import.meta.env.VITE_VIDEOLLAMADA_URL || "http://localhost:4006";
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

type EstadoLlamada = "idle" | "incoming" | "calling" | "connecting" | "active";
type Senal = {
  socketId: string;
  destinatarioId?: string;
  tipo: "oferta" | "respuesta" | "candidato";
  datos: RTCSessionDescriptionInit | RTCIceCandidateInit;
};

type ConexionPeer = { conexion: RTCPeerConnection; candidatosPendientes: RTCIceCandidateInit[] };
type EstadoMediosRemoto = { microfonoActivo: boolean; camaraActiva: boolean };
type MiembroHilo = { uid: string; nombre: string; cargo?: string; ocupado?: boolean };

interface Props {
  hiloId: string;
  usuarioUid: string;
  usuarioNombre: string;
  usuarioCargo?: string;
}

export default function VideoLlamada({ hiloId, usuarioUid, usuarioNombre, usuarioCargo }: Props) {
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Map<string, ConexionPeer>>(new Map());
  const streamLocalRef = useRef<MediaStream | null>(null);
  const candidatosPendientesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const videoLocalRef = useRef<HTMLVideoElement>(null);

  const [estado, setEstado] = useState<EstadoLlamada>("idle");
  const [streamLocal, setStreamLocal] = useState<MediaStream | null>(null);
  const [streamsRemotos, setStreamsRemotos] = useState<Record<string, MediaStream>>({});
  const [estadosRemotos, setEstadosRemotos] = useState<Record<string, EstadoMediosRemoto>>({});
  const [cantidadParticipantes, setCantidadParticipantes] = useState(1);
  const [modalInvitaciones, setModalInvitaciones] = useState(false);
  const [miembrosDisponibles, setMiembrosDisponibles] = useState<MiembroHilo[]>([]);
  const [invitadosSeleccionados, setInvitadosSeleccionados] = useState<string[]>([]);
  const [cargandoMiembros, setCargandoMiembros] = useState(false);
  const [nombreInvitante, setNombreInvitante] = useState("");
  const [avisoInvitados, setAvisoInvitados] = useState("");
  const [microfonoActivo, setMicrofonoActivo] = useState(true);
  const [camaraActiva, setCamaraActiva] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [duracion, setDuracion] = useState(0);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  useEffect(() => {
    if (videoLocalRef.current) videoLocalRef.current.srcObject = streamLocal;
  }, [streamLocal, estado]);

  useEffect(() => {
    if (estado !== "active") {
      setDuracion(0);
      return;
    }
    const inicio = Date.now();
    const reloj = window.setInterval(() => setDuracion(Math.floor((Date.now() - inicio) / 1000)), 1000);
    return () => window.clearInterval(reloj);
  }, [estado]);

  const cerrarRecursos = useCallback(() => {
    peersRef.current.forEach(({ conexion }) => conexion.close());
    peersRef.current.clear();
    candidatosPendientesRef.current.clear();
    streamLocalRef.current?.getTracks().forEach((pista) => pista.stop());
    streamLocalRef.current = null;
    setStreamLocal(null);
    setStreamsRemotos({});
    setEstadosRemotos({});
    setCantidadParticipantes(1);
    setMicrofonoActivo(true);
    setCamaraActiva(true);
  }, []);

  const finalizar = useCallback(
    (mensaje = "", avisarServidor = true) => {
      if (avisarServidor) socketRef.current?.emit("llamada:salir", hiloId);
      cerrarRecursos();
      setEstado("idle");
      setError("");
      setAviso(mensaje);
    },
    [cerrarRecursos, hiloId]
  );

  const obtenerCamaraYMicrofono = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Este navegador no permite usar cámara y micrófono aquí.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    streamLocalRef.current = stream;
    setStreamLocal(stream);
    return stream;
  }, []);

  const unirseALlamada = useCallback((socket: Socket) => {
    return new Promise<string[]>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("El servidor tardó en responder.")), 8000);
      socket.emit("llamada:unirse", hiloId, (resultado: { ok: boolean; participantes?: string[]; error?: string }) => {
        window.clearTimeout(timeout);
        if (!resultado?.ok) {
          reject(new Error(resultado?.error || "No se pudo entrar a la llamada."));
          return;
        }
        resolve(resultado.participantes || []);
      });
    });
  }, [hiloId]);

  const obtenerMiembros = useCallback((socket: Socket) => {
    return new Promise<MiembroHilo[]>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("El servidor tardó en cargar las personas.")), 8000);
      socket.emit("llamada:miembros", hiloId, (resultado: { ok: boolean; miembros?: MiembroHilo[]; error?: string }) => {
        window.clearTimeout(timeout);
        if (!resultado?.ok) {
          reject(new Error(resultado?.error || "No se pudieron cargar las personas del hilo."));
          return;
        }
        resolve(resultado.miembros || []);
      });
    });
  }, [hiloId]);

  const iniciarEnServidor = useCallback((socket: Socket, invitados: string[]) => {
    return new Promise<{ invitados: string[]; ocupados: MiembroHilo[] }>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("El servidor tardó en iniciar la llamada.")), 8000);
      socket.emit("llamada:iniciar", { hiloId, invitados }, (resultado: { ok: boolean; invitados?: string[]; ocupados?: MiembroHilo[]; error?: string }) => {
        window.clearTimeout(timeout);
        if (!resultado?.ok) {
          reject(new Error(resultado?.error || "No se pudo iniciar la videollamada."));
          return;
        }
        resolve({ invitados: resultado.invitados || [], ocupados: resultado.ocupados || [] });
      });
    });
  }, [hiloId]);

  const abrirSelectorInvitados = async () => {
    setError("");
    const socket = socketRef.current;
    if (!socket?.connected) {
      setError("La conexión con el servicio de videollamadas aún no está lista. Intenta otra vez.");
      return;
    }
    setCargandoMiembros(true);
    setInvitadosSeleccionados([]);
    setModalInvitaciones(true);
    try {
      setMiembrosDisponibles(await obtenerMiembros(socket));
    } catch (causa) {
      setModalInvitaciones(false);
      setError(causa instanceof Error ? causa.message : "No se pudieron cargar las personas del hilo.");
    } finally {
      setCargandoMiembros(false);
    }
  };

  const crearConexion = useCallback((peerId: string) => {
    const existente = peersRef.current.get(peerId);
    if (existente) return existente;

    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    streamLocalRef.current?.getTracks().forEach((pista) => peer.addTrack(pista, streamLocalRef.current!));
    peer.ontrack = (evento) => {
      const remoto = evento.streams[0] || new MediaStream([evento.track]);
      setStreamsRemotos((actuales) => ({ ...actuales, [peerId]: remoto }));
    };
    peer.onicecandidate = (evento) => {
      if (evento.candidate) {
        socketRef.current?.emit("llamada:senal", {
          hiloId,
          destinatarioId: peerId,
          tipo: "candidato",
          datos: evento.candidate.toJSON(),
        });
      }
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") {
        setEstado("active");
        setAviso("");
      } else if (peer.connectionState === "failed") {
        setError("No se pudo establecer la conexión. La red puede necesitar un servidor TURN.");
      }
    };

    const conexionPeer = { conexion: peer, candidatosPendientes: [] };
    peersRef.current.set(peerId, conexionPeer);
    setCantidadParticipantes(peersRef.current.size + 1);
    return conexionPeer;
  }, [hiloId]);

  const quitarPeer = useCallback((peerId: string) => {
    const peer = peersRef.current.get(peerId);
    if (!peer) return;
    peer.conexion.close();
    peersRef.current.delete(peerId);
    setStreamsRemotos((actuales) => {
      const siguientes = { ...actuales };
      delete siguientes[peerId];
      return siguientes;
    });
    setEstadosRemotos((actuales) => {
      const siguientes = { ...actuales };
      delete siguientes[peerId];
      return siguientes;
    });
    setCantidadParticipantes(peersRef.current.size + 1);
  }, []);

  const emitirSenal = useCallback((destinatarioId: string, tipo: Senal["tipo"], datos: Senal["datos"]) => {
    socketRef.current?.emit("llamada:senal", { hiloId, destinatarioId, tipo, datos });
  }, [hiloId]);

  useEffect(() => {
    if (!streamLocalRef.current || !socketRef.current?.connected || estado === "idle" || estado === "incoming") return;
    socketRef.current.emit("llamada:estado-medios", { hiloId, microfonoActivo, camaraActiva });
  }, [hiloId, estado, microfonoActivo, camaraActiva]);

  const manejarSenal = useCallback(async (senal: Senal) => {
    if (!senal || senal.socketId === socketRef.current?.id) return;

    try {
      if (senal.tipo === "oferta") {
        const peerId = senal.socketId;
        const peer = crearConexion(peerId);
        await peer.conexion.setRemoteDescription(new RTCSessionDescription(senal.datos as RTCSessionDescriptionInit));
        const pendientes = [...peer.candidatosPendientes, ...(candidatosPendientesRef.current.get(peerId) || [])];
        peer.candidatosPendientes = [];
        candidatosPendientesRef.current.delete(peerId);
        for (const candidato of pendientes) await peer.conexion.addIceCandidate(new RTCIceCandidate(candidato));
        const respuesta = await peer.conexion.createAnswer();
        await peer.conexion.setLocalDescription(respuesta);
        emitirSenal(peerId, "respuesta", peer.conexion.localDescription!.toJSON());
        setEstado("connecting");
      } else if (senal.tipo === "respuesta") {
        const peer = peersRef.current.get(senal.socketId);
        if (!peer) return;
        await peer.conexion.setRemoteDescription(new RTCSessionDescription(senal.datos as RTCSessionDescriptionInit));
        const pendientes = [...peer.candidatosPendientes, ...(candidatosPendientesRef.current.get(senal.socketId) || [])];
        peer.candidatosPendientes = [];
        candidatosPendientesRef.current.delete(senal.socketId);
        for (const candidato of pendientes) await peer.conexion.addIceCandidate(new RTCIceCandidate(candidato));
      } else if (senal.tipo === "candidato") {
        const candidato = senal.datos as RTCIceCandidateInit;
        const peer = peersRef.current.get(senal.socketId);
        if (peer?.conexion.remoteDescription) {
          await peer.conexion.addIceCandidate(new RTCIceCandidate(candidato));
        } else if (peer) {
          peer.candidatosPendientes.push(candidato);
        } else {
          candidatosPendientesRef.current.set(senal.socketId, [
            ...(candidatosPendientesRef.current.get(senal.socketId) || []),
            candidato,
          ]);
        }
      }
    } catch (causa) {
      console.error("Error al negociar la videollamada:", causa);
      setError("Falló la conexión de la llamada. Cuelga e inténtalo de nuevo.");
    }
  }, [crearConexion, emitirSenal]);

  const crearOferta = useCallback(async (peerId: string) => {
    try {
      const peer = crearConexion(peerId);
      const oferta = await peer.conexion.createOffer();
      await peer.conexion.setLocalDescription(oferta);
      emitirSenal(peerId, "oferta", peer.conexion.localDescription!.toJSON());
      setEstado("connecting");
    } catch (causa) {
      console.error("Error al iniciar la videollamada:", causa);
      setError("No se pudo iniciar la llamada.");
    }
  }, [crearConexion, emitirSenal]);

  useEffect(() => {
    const socket = io(VIDEO_URL, { transports: ["websocket"], reconnection: true });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("unirse-hilo", {
      hiloId,
      uid: usuarioUid,
      nombre: usuarioNombre,
      cargo: usuarioCargo || "",
    }));
    socket.on("llamada:entrante", (datos: { hiloId: string; nombre?: string }) => {
      if (datos?.hiloId === hiloId) {
        setError("");
        setNombreInvitante(datos.nombre || "");
        setEstado((actual) => actual === "idle" ? "incoming" : actual);
      }
    });
    socket.on("llamada:participante", (datos: { socketId: string }) => {
      if (datos?.socketId) void crearOferta(datos.socketId);
    });
    socket.on("llamada:senal", (senal: Senal) => void manejarSenal(senal));
    socket.on("llamada:estado-medios", (datos: EstadoMediosRemoto & { socketId: string }) => {
      if (!datos?.socketId || typeof datos.microfonoActivo !== "boolean" || typeof datos.camaraActiva !== "boolean") return;
      setEstadosRemotos((actuales) => ({
        ...actuales,
        [datos.socketId]: { microfonoActivo: datos.microfonoActivo, camaraActiva: datos.camaraActiva },
      }));
    });
    socket.on("llamada:participante-salio", (datos: { socketId: string }) => {
      if (datos?.socketId) quitarPeer(datos.socketId);
      setAviso("Una persona salió de la llamada.");
    });
    socket.on("llamada:cancelada", () => {
      if (estadoRef.current === "incoming") setEstado("idle");
    });

    return () => {
      socket.emit("salir-hilo", hiloId);
      socket.emit("llamada:salir", hiloId);
      socket.disconnect();
      socketRef.current = null;
      cerrarRecursos();
    };
  }, [hiloId, usuarioUid, usuarioNombre, usuarioCargo, crearOferta, manejarSenal, finalizar, cerrarRecursos, quitarPeer]);

  const iniciarLlamada = async (uidsInvitados: string[]) => {
    setError("");
    setAviso("");
    setAvisoInvitados("");
    try {
      await obtenerCamaraYMicrofono();
      const socket = socketRef.current;
      if (!socket?.connected) throw new Error("La conexión con el servidor aún no está lista. Intenta otra vez.");

      const resultado = await iniciarEnServidor(socket, uidsInvitados);
      setCantidadParticipantes(resultado.invitados.length + 1);
      if (resultado.ocupados.length > 0) {
        setAvisoInvitados(`No se invitó a ${resultado.ocupados.map((persona) => persona.nombre).join(", ")} porque ${resultado.ocupados.length === 1 ? "ya está" : "ya están"} en otra videollamada.`);
      }
      setModalInvitaciones(false);
      setEstado("calling");
    } catch (causa) {
      cerrarRecursos();
      setEstado("idle");
      setError(causa instanceof Error ? causa.message : "No se pudo iniciar la llamada.");
    }
  };

  const aceptarLlamada = async () => {
    setError("");
    try {
      await obtenerCamaraYMicrofono();
      const socket = socketRef.current;
      if (!socket?.connected) throw new Error("La conexión con el servidor se perdió. Intenta otra vez.");

      const participantes = await unirseALlamada(socket);
      if (participantes.length === 0) throw new Error("La llamada ya terminó. Pide que te llamen otra vez.");
      setCantidadParticipantes(participantes.length + 1);
      setEstado("connecting");
    } catch (causa) {
      socketRef.current?.emit("llamada:salir", hiloId);
      cerrarRecursos();
      setEstado("idle");
      setError(causa instanceof Error ? causa.message : "No se pudo entrar a la llamada.");
    }
  };

  const rechazarLlamada = () => {
    socketRef.current?.emit("llamada:rechazar", hiloId);
    setEstado("idle");
  };

  const colgar = () => finalizar();

  const tiempoFormateado = `${String(Math.floor(duracion / 60)).padStart(2, "0")}:${String(duracion % 60).padStart(2, "0")}`;

  const alternarMicrofono = () => {
    const siguiente = !microfonoActivo;
    streamLocalRef.current?.getAudioTracks().forEach((pista) => { pista.enabled = siguiente; });
    setMicrofonoActivo(siguiente);
  };

  const alternarCamara = () => {
    const siguiente = !camaraActiva;
    streamLocalRef.current?.getVideoTracks().forEach((pista) => { pista.enabled = siguiente; });
    setCamaraActiva(siguiente);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void abrirSelectorInvitados()}
        disabled={estado !== "idle"}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PhoneCall size={17} /> Videollamada
      </button>

      {aviso && estado === "idle" && <span role="status" className="text-xs text-zinc-400">{aviso}</span>}
      {error && estado === "idle" && <span role="alert" className="text-xs text-rose-400">{error}</span>}

      {modalInvitaciones && estado === "idle" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="titulo-invitados">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#171c27] shadow-2xl">
            <header className="border-b border-white/10 px-6 py-5">
              <h2 id="titulo-invitados" className="text-lg font-semibold text-white">Elige quién puede entrar</h2>
              <p className="mt-1 text-sm text-slate-400">Selecciona personas conectadas a este hilo. Solo las invitadas podrán unirse.</p>
            </header>
            <div className="max-h-[50vh] overflow-y-auto p-3">
                {error && <p role="alert" className="mx-3 mt-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
                {!cargandoMiembros && miembrosDisponibles.some((miembro) => miembro.ocupado) && (
                  <p role="status" className="mx-3 mb-3 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                    Algunas personas ya están en otra videollamada. Aparecen marcadas y no se pueden seleccionar.
                  </p>
                )}
                {cargandoMiembros ? (
                <div className="flex items-center justify-center gap-3 p-8 text-sm text-slate-300"><LoaderCircle className="animate-spin" size={20} /> Buscando personas conectadas…</div>
              ) : miembrosDisponibles.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-400">No hay otras personas conectadas a este hilo.</p>
              ) : (
                miembrosDisponibles.map((miembro) => {
                  const seleccionado = invitadosSeleccionados.includes(miembro.uid);
                  const deshabilitado = miembro.ocupado === true;
                  return (
                    <label key={miembro.uid} className={`mb-2 flex items-center gap-3 rounded-2xl border p-3 transition ${deshabilitado ? "cursor-not-allowed border-rose-400/10 bg-rose-400/[0.04] opacity-75" : `cursor-pointer ${seleccionado ? "border-violet-400/50 bg-violet-500/10" : "border-white/5 bg-white/[0.03] hover:bg-white/[0.07]"}`}`}>
                      <input
                        type="checkbox"
                        disabled={deshabilitado}
                        checked={seleccionado}
                        onChange={() => setInvitadosSeleccionados((actuales) => seleccionado ? actuales.filter((uid) => uid !== miembro.uid) : [...actuales, miembro.uid])}
                        className="h-4 w-4 accent-violet-500"
                      />
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 font-semibold text-violet-200">{miembro.nombre.slice(0, 1).toUpperCase()}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">{miembro.nombre}</span>
                        {miembro.cargo && <span className="block truncate text-xs text-slate-400">{miembro.cargo}</span>}
                      </span>
                      {deshabilitado && <span className="shrink-0 rounded-lg bg-rose-500/15 px-2.5 py-1.5 text-xs font-semibold text-rose-200">En otra llamada</span>}
                    </label>
                  );
                })
              )}
            </div>
            <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
              <span className="text-xs text-slate-400">{invitadosSeleccionados.length} seleccionada(s) · máximo 7 invitados</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalInvitaciones(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5">Cancelar</button>
                <button type="button" disabled={cargandoMiembros || invitadosSeleccionados.length === 0 || invitadosSeleccionados.length > 7} onClick={() => void iniciarLlamada(invitadosSeleccionados)} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40">Iniciar llamada</button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {estado !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#080b12]/90 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-label="Videollamada">
          <div className="w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#1c2230] to-[#10141d] shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
            <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                  <PhoneCall size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-white">Videollamada del hilo</h2>
                  <p className="text-sm text-slate-400">
                    {estado === "incoming" && `${nombreInvitante || "Una persona"} te invita a conversar`}
                    {estado === "calling" && "Esperando que alguien se una…"}
                    {estado === "connecting" && "Preparando audio y video…"}
                    {estado === "active" && `${cantidadParticipantes} participantes · ${tiempoFormateado}`}
                  </p>
                </div>
              </div>
              {estado === "active" && (
                <span className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200 sm:inline-flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> En vivo
                </span>
              )}
            </header>

            {avisoInvitados && (
              <p role="status" className="mx-4 mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100 sm:mx-7">
                {avisoInvitados}
              </p>
            )}

            {estado === "incoming" ? (
              <section className="mx-4 mb-4 flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/15 via-[#131824] to-[#10141d] px-6 py-10 text-center sm:mx-7 sm:mb-7">
                <div className="mb-6 flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-violet-500/15 text-violet-200 ring-1 ring-violet-300/30">
                  <PhoneCall size={36} />
                </div>
                <h3 className="text-2xl font-semibold text-white">Llamada entrante</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Acepta para compartir tu cámara y micrófono con el grupo.</p>
                {error && <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{error}</p>}
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={rechazarLlamada} className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">Rechazar</button>
                  <button type="button" onClick={() => void aceptarLlamada()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400"><Check size={17} /> Aceptar llamada</button>
                </div>
              </section>
            ) : (
              <>
                {error && <p role="alert" className="mx-4 mb-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 sm:mx-7">{error}</p>}
                <section className="mx-4 mb-2 max-h-[65vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#080a0f] p-3 sm:mx-7 sm:p-4">
                  {streamsRemotos && Object.keys(streamsRemotos).length === 0 && (
                    <div className="mb-3 flex min-h-32 flex-col items-center justify-center rounded-2xl bg-[#111722] px-5 text-center">
                      {estado === "calling" || estado === "connecting" ? <LoaderCircle className="mb-3 animate-spin text-violet-300" size={30} /> : <UserRound className="mb-3 text-slate-300" size={30} />}
                      <p className="font-medium text-white">{estado === "calling" ? "Invitando al grupo" : "Esperando al grupo"}</p>
                      <p className="mt-1 text-sm text-slate-400">Los videos aparecerán aquí cuando se conecten.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-2xl border border-violet-300/20 bg-[#202532]">
                      <video ref={videoLocalRef} autoPlay playsInline muted className={`h-full w-full object-cover ${camaraActiva ? "" : "opacity-0"}`} />
                      {!camaraActiva && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300"><CameraOff size={24} /><span className="text-sm">Cámara apagada</span></div>}
                      <span className="absolute bottom-2 left-2 rounded-lg bg-black/55 px-3 py-1.5 text-sm font-medium text-white">Tú</span>
                    </div>
                    {Object.entries(streamsRemotos).map(([peerId, stream], indice) => (
                      <div key={peerId} className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#202532]">
                        <video
                          ref={(elemento) => { if (elemento && elemento.srcObject !== stream) elemento.srcObject = stream; }}
                          autoPlay
                          playsInline
                          className="h-full w-full object-cover"
                        />
                        {estadosRemotos[peerId]?.camaraActiva === false && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#111722] text-slate-200">
                            <CameraOff size={28} />
                            <span className="text-sm">Cámara apagada</span>
                          </div>
                        )}
                        <span className="absolute bottom-2 left-2 rounded-lg bg-black/55 px-3 py-1.5 text-sm font-medium text-white">Participante {indice + 1}</span>
                        <div className="absolute right-2 top-2 flex gap-1.5">
                          {estadosRemotos[peerId]?.microfonoActivo === false && (
                            <span title="Micrófono apagado" aria-label="Micrófono apagado" className="rounded-lg bg-rose-600/90 p-2 text-white shadow"><MicOff size={16} /></span>
                          )}
                          {estadosRemotos[peerId]?.camaraActiva === false && (
                            <span title="Cámara apagada" aria-label="Cámara apagada" className="rounded-lg bg-rose-600/90 p-2 text-white shadow"><CameraOff size={16} /></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <footer className="flex flex-wrap items-center justify-center gap-3 px-4 py-5 sm:gap-4 sm:px-7 sm:py-6">
                  <button type="button" onClick={alternarMicrofono} aria-label={microfonoActivo ? "Apagar micrófono" : "Encender micrófono"} aria-pressed={!microfonoActivo} className={`flex min-w-[118px] flex-col items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-medium transition sm:min-w-[138px] ${microfonoActivo ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15"}`}>
                    <span className={`flex h-12 w-12 items-center justify-center rounded-full ${microfonoActivo ? "bg-white/10" : "bg-rose-500/20"}`}>{microfonoActivo ? <Mic size={20} /> : <MicOff size={20} />}</span>
                    <span>{microfonoActivo ? "Silenciar" : "Activar micrófono"}</span>
                    <span className={microfonoActivo ? "text-emerald-300" : "text-rose-300"}>{microfonoActivo ? "Micrófono encendido" : "Micrófono apagado"}</span>
                  </button>
                  <button type="button" onClick={alternarCamara} aria-label={camaraActiva ? "Apagar cámara" : "Encender cámara"} aria-pressed={!camaraActiva} className={`flex min-w-[118px] flex-col items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-medium transition sm:min-w-[138px] ${camaraActiva ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15"}`}>
                    <span className={`flex h-12 w-12 items-center justify-center rounded-full ${camaraActiva ? "bg-white/10" : "bg-rose-500/20"}`}>{camaraActiva ? <Camera size={20} /> : <CameraOff size={20} />}</span>
                    <span>{camaraActiva ? "Apagar cámara" : "Activar cámara"}</span>
                    <span className={camaraActiva ? "text-emerald-300" : "text-rose-300"}>{camaraActiva ? "Cámara encendida" : "Cámara apagada"}</span>
                  </button>
                  <button type="button" onClick={colgar} aria-label={estado === "calling" ? "Cancelar llamada" : "Colgar"} className="flex min-w-[118px] flex-col items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-400 sm:min-w-[138px]">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15"><PhoneOff size={20} /></span>
                    <span>{estado === "calling" ? "Cancelar" : "Colgar"}</span>
                    <span className="text-rose-100">Finalizar llamada</span>
                  </button>
                </footer>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

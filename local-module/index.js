const URL_GIS = "https://accounts.google.com/gsi/client";
const URL_DRIVE = "https://www.googleapis.com/drive/v3/files";

let cargaGoogle;

/** Carga una sola vez Google Identity Services para solicitar consentimiento OAuth. */
export function cargarGoogleIdentityServices() {
  if (globalThis.google?.accounts?.oauth2) return Promise.resolve();
  if (cargaGoogle) return cargaGoogle;

  cargaGoogle = new Promise((resolve, reject) => {
    const scriptExistente = document.querySelector(`script[src="${URL_GIS}"]`);
    const script = scriptExistente || document.createElement("script");

    script.onload = () => {
      if (globalThis.google?.accounts?.oauth2) resolve();
      else reject(new Error("Google Identity Services no quedó disponible."));
    };
    script.onerror = () => {
      cargaGoogle = undefined;
      reject(new Error("No se pudo cargar Google Identity Services."));
    };

    if (!scriptExistente) {
      script.src = URL_GIS;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return cargaGoogle;
}

/** Solicita al usuario un token temporal con permiso Drive de solo lectura. */
export function solicitarTokenDrive(clientId) {
  if (!clientId) return Promise.reject(new Error("Falta configurar VITE_GOOGLE_CLIENT_ID."));
  if (!globalThis.google?.accounts?.oauth2) {
    return Promise.reject(new Error("Google todavía se está cargando. Inténtalo de nuevo."));
  }

  return new Promise((resolve, reject) => {
    const cliente = globalThis.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      callback: (respuesta) => respuesta.access_token
        ? resolve(respuesta.access_token)
        : reject(new Error(respuesta.error || "Google Drive no autorizó el acceso.")),
    });

    // Se llama sincrónicamente desde la acción del usuario para que el navegador permita el popup.
    cliente.requestAccessToken();
  });
}

/** Lista los 50 archivos más recientes de la cuenta autorizada. */
export async function listarArchivosDrive(accessToken) {
  const params = new URLSearchParams({
    q: "trashed=false",
    orderBy: "modifiedTime desc",
    pageSize: "50",
    fields: "files(id,name,mimeType,webViewLink,size)",
  });
  const respuesta = await fetch(`${URL_DRIVE}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.error?.message || "No se pudieron listar los archivos de Drive.");
  }
  return datos.files || [];
}

/** Adapta un archivo de Drive al adjunto que el chat persiste en un mensaje. */
export function convertirArchivoDrive(archivo) {
  return {
    nombre: archivo.name,
    url: archivo.webViewLink || `https://drive.google.com/open?id=${encodeURIComponent(archivo.id)}`,
    tipo: archivo.mimeType,
    tamano: archivo.size ? `${Math.ceil(Number(archivo.size) / 1024)} KB` : "Google Drive",
  };
}

# Módulo local: uso sin conexión

Permite usar el chat **sin conexión**, como WhatsApp. Todo se guarda en el navegador (IndexedDB, base `sgd-modulo-local`), en dos partes:

1. **Cola de envíos** (almacén `pendientes`): los mensajes y archivos se guardan primero en el equipo y se mandan al servidor cuando hay conexión. Si se cierra el navegador, no se pierden.
2. **Caché de lectura** (almacén `cache`): la última copia de los mensajes de cada hilo (los últimos 50) y de las listas de canales, subcanales e hilos. Sin conexión se sigue viendo lo que ya se había cargado y se puede navegar.

## Caché de lectura

| Clave | Contenido | Quién la escribe |
|---|---|---|
| `mensajes:<hiloId>` | Últimos 50 mensajes del hilo, tal como los devuelve el servidor | `mf-chat` (`escucharMensajes`) |
| `lista:<ruta de la API>` | Canales, subcanales o hilos | `mf-navegacion` (`useListaApi`) |
| `perfil:<uid>` | Perfil del usuario (empresa, rol, cargo) | `shell` (`obtenerOCrearUsuario`) |

**Sesión sin conexión:** Firebase recuerda la sesión en el navegador, pero el shell también necesita el perfil que entrega `auth-service`. Si el backend no responde, el shell usa el último perfil guardado para esa misma cuenta (`uid`), así que recargar la página no te devuelve al login. Si el servidor responde con un rechazo (4xx), no se usa la copia.

- Al abrir un hilo o una lista se muestra al instante la copia local y luego se reemplaza por la respuesta del servidor.
- La copia solo se sobrescribe con datos que llegaron del servidor, nunca con datos incompletos.
- Si el servidor ya no devuelve un mensaje de la copia (por ejemplo, porque se borró), se quita.
- `guardarCache` y `leerCache` nunca lanzan errores: si el navegador no permite IndexedDB, la app funciona igual, solo que sin copia local.

## Cola de envíos

## Cómo funciona

```
Enviar ─► IndexedDB (cola) ─► ¿hay conexión? ─ sí ─► POST /archivos ─► POST /hilos/:id/mensajes ─► se borra de la cola
                                   │
                                   └─ no ─► queda "pendiente" ─► se reintenta al volver la red,
                                                                 al reconectar Socket.IO y cada 15 s
```

- **Pendiente:** no hubo red, el servidor no respondió o respondió con 5xx. Se reintenta solo.
- **Enviando:** se está enviando en este momento. Solo existe en memoria: si se cierra la pestaña a mitad del envío, el mensaje vuelve a quedar pendiente.
- **Error:** el servidor lo rechazó con 4xx (por ejemplo, un archivo de más de 10 MB). No se reintenta solo; la persona puede reintentarlo o descartarlo.

### Garantías

| Garantía | Cómo se logra |
|---|---|
| No se pierde nada | Se guarda en IndexedDB **antes** de intentar el envío. |
| Cada cuenta ve solo lo suyo | Los pendientes se guardan con el `uid` y solo se listan y sincronizan los de la cuenta que inició sesión. |
| Se respeta el orden | Se envía del más antiguo al más nuevo y se detiene en el primer error de conexión. |
| No se duplican mensajes | Cada pendiente tiene un UUID que se envía como `idCliente`; `chat-service` tiene un índice único sobre ese campo. |
| No se sube dos veces el archivo | Al subir el archivo se guarda su URL en el pendiente; un reintento solo vuelve a crear el mensaje. |
| Varias pestañas no envían lo mismo | `navigator.locks` permite una sola sincronización a la vez y `BroadcastChannel` avisa a las demás pestañas. |

## Uso

El módulo no depende de React ni del chat: quien lo usa le indica cómo se envía cada elemento.

```ts
import { crearColaOffline, ErrorPermanente } from "@local-module";

const cola = crearColaOffline<MisDatos>({
  async enviar(pendiente, { guardarDatos }) {
    // Lanzar ErrorPermanente si el servidor rechaza el envío (4xx).
    // Cualquier otro error se considera falta de conexión y se reintenta.
  },
});

await cola.encolar({ uid, grupo: hiloId, datos, archivo });
const detener = cola.iniciar(uid);              // reintentos automáticos
const dejar = cola.suscribir(() => refrescar());
await cola.listar(uid, hiloId);                 // para pintar los pendientes
```

`mf-chat` lo usa en `src/features/chat/chat.api.ts` (`colaMensajes`) y en `ChatArea.tsx`.

## Integración en el proyecto

- `shell`, `mf-chat` y `mf-navegacion` lo importan con el alias `@local-module`, definido en el `vite.config.ts` y el `tsconfig.app.json` de cada uno.
- En Docker, `docker-compose.yml` pasa esta carpeta como `additional_contexts` a los tres y cada `Dockerfile` la copia en `/local-module`.
- Para revisar los tipos solo de este módulo: `npx -p typescript tsc --noEmit -p local-module`.

## Cómo probarlo

**Ver mensajes sin conexión:**

1. Con todo encendido, abre uno o varios hilos para que queden guardados.
2. Ejecuta `docker compose stop gateway` y recarga la página.
3. Los canales, subcanales e hilos aparecen con el aviso "Sin conexión · mostrando lo guardado en este equipo". Al abrir un hilo se ven sus mensajes.

**Enviar sin conexión:**

1. Abre un hilo con la aplicación levantada.
2. En DevTools ve a **Network** y selecciona **Offline**. También puedes detener el gateway con `docker compose stop gateway`.
3. Envía un mensaje con un archivo. Aparece con el estado "⏳ Guardado en este equipo" y el archivo se puede abrir desde el navegador.
4. Recarga la página o cierra y vuelve a abrir el navegador. El mensaje sigue ahí; puedes verlo en DevTools → **Application** → **IndexedDB** → `sgd-modulo-local`.
5. Vuelve a conectar (selecciona **No throttling** o ejecuta `docker compose start gateway`). En unos segundos el mensaje se envía y las demás personas lo ven.

## Límites

- El primer inicio de sesión con Google necesita internet. Después, Firebase conserva la sesión en el navegador.
- La cola está en **este navegador y este equipo**. Nadie más ve un mensaje hasta que se sincroniza.
- La sincronización corre cuando la aplicación está abierta en un hilo (el chat está montado). No hay un Service Worker que envíe en segundo plano.
- Los archivos que ya están en Cloudinary no se pueden abrir sin internet. Solo los que siguen en la cola se ven desde el equipo. La caché guarda el texto de los mensajes y los enlaces, no los archivos.
- La página en sí (HTML y JS) la sirve Nginx en Docker. Si se detiene solo el gateway, la página carga y usa la caché. Si se corta toda la red (DevTools en "Sin conexión"), **recargar** la página no funciona porque no hay un Service Worker; sin recargar, todo sigue funcionando.
- La caché queda en el navegador después de cerrar sesión. Solo contiene datos de hilos a los que esa persona tenía acceso.

# Guía de demostración del proyecto

Esta guía ayuda a explicar qué hace SGD Empresarial, cómo está construido y qué pruebas mostrar en clase. El estado de despliegue y GitHub debe actualizarse el día de la presentación.

## Explicación de 30 segundos

SGD Empresarial es un espacio de colaboración para una empresa. Las personas inician sesión, entran a canales, subcanales e hilos, conversan en tiempo real y pueden compartir archivos o enlaces de Drive. En cada hilo se puede iniciar una videollamada grupal. El frontend está dividido en microfrontends y el backend en microservicios. Los mensajes se guardan en MongoDB; empresas, autenticación y canales usan bases PostgreSQL. Nginx distribuye el chat entre dos instancias y Redis comparte los eventos Socket.IO.

## Funcionalidades visibles

| Funcionalidad | Qué demostrar | Qué ocurre en el código |
|---|---|---|
| Inicio de sesión y empresa | Iniciar sesión y mostrar la empresa/rol. | `shell` conserva sesión Firebase y consulta al backend. |
| Canales y estructura | Abrir canal, subcanal e hilo. | El MFE de navegación consulta al gateway; `canales-service` persiste esta estructura en PostgreSQL. |
| Chat | Enviar un mensaje, responder y reaccionar desde otra ventana. | REST guarda en MongoDB; Socket.IO difunde `nuevo-mensaje` y `mensaje-actualizado`. |
| Drive | Abrir Drive, autorizar lectura, elegir un archivo y enviarlo. | El paquete `local-module` obtiene archivos y adjunta su `webViewLink`/metadatos. El archivo permanece en Drive. |
| Videollamada | Iniciar llamada, invitar personas, apagar cámara/micrófono y colgar. | El microservicio Socket.IO coordina señalización; WebRTC envía medios entre navegadores. |
| Balanceador | Mostrar `services/chat-load-balancer/nginx.conf` y los servicios `chat-service-1/2`. | Nginx usa `least_conn`; Redis comparte eventos entre instancias. |

## Cómo explicar cada tecnología del requisito

| Requisito académico | Componente usado | Explicación sencilla |
|---|---|---|
| Módulo local | `local-module` | Es un paquete de código que vive dentro del repositorio y que usa el chat para conectar con Drive. No es un servidor ni un microfrontend independiente. |
| Socket | Socket.IO en `chat-service` y `videollamada-service` | Permite avisar de mensajes, invitaciones y señales sin recargar la página. |
| Cámara/micrófono | `getUserMedia` y WebRTC en `mf-videollamada` | El navegador pide permiso y transmite audio/video directamente entre participantes. |
| Dos bases de datos | PostgreSQL y MongoDB | PostgreSQL guarda auth/empresas/canales. MongoDB guarda mensajes. Hay tres bases PostgreSQL separadas más MongoDB. |
| Balanceador | Nginx `least_conn` | Envía nuevas solicitudes/conexiones de chat a la instancia con menos conexiones activas. |
| Nube/hosting | Aún sin despliegue público verificado | Docker Compose local no equivale a una publicación en Internet. La plantilla CloudFront guardada no crea recursos hasta que se ejecute. |
| GitHub | Rama `videollamada` y ramas remotas | Los commits aparecen en GitHub; cambios no confirmados que estén solo en el árbol local no cuentan como subidos. |

## Qué sí está implementado ahora

- Shell React y microfrontends separados de navegación, chat y videollamada.
- Servicios backend con gateway y bases configuradas en Docker Compose.
- Módulo local `@sgd/google-drive-local`, integrado en `mf-chat` por un alias Vite/TypeScript.
- Chat Socket.IO y señalización de videollamada Socket.IO.
- Captura local de cámara y micrófono y transporte WebRTC.
- Nginx con estrategia `least_conn`, dos servicios de chat y Redis para distribuir eventos.

## Qué no se debe afirmar como terminado

- No afirmar que el backend está desplegado en la nube mientras solo se use `localhost` o Docker en el computador.
- No afirmar que hay una URL de hosting activa porque exista un archivo de plantilla CloudFormation.
- No afirmar que todo está en GitHub si hay archivos modificados o sin seguimiento en `git status`.
- No afirmar que cualquiera puede conectar Drive mientras OAuth esté en modo de prueba. Las cuentas de prueba deben añadirse en Google Auth Platform; el uso público puede requerir verificación de Google.

## Estado de los requisitos al 24 de noviembre de 2026

| Requisito | Estado de implementación | Estado de entrega/despliegue |
|---|---|---|
| Despliegue en la nube | Documentación y topología propuestas. | Pendiente: no hay backend desplegado. |
| Módulo local | Código en `local-module`, integrado en `mf-chat`. | Implementado en el código local; debe publicarse junto con el MFE de chat. |
| Socket | Chat y llamadas usan Socket.IO. | Funciona en la configuración local; producción requiere URL pública y HTTPS/WSS. |
| Cámara o micrófono | Videollamada usa ambos dispositivos. | Debe probarse en dominio HTTPS desplegado. |
| Dos bases de datos | Tres PostgreSQL + MongoDB en Compose. | Configuración local; migrar/administrar datos al desplegar. |
| 100% en GitHub | Los commits anteriores están en ramas remotas conocidas. | Cambios locales nuevos no comprometidos; no está 100% subido. |
| Balanceador | Nginx y dos instancias de chat en Compose. | Implementado localmente; falta desplegar o mapearlo en la infraestructura pública. |
| Hosting | Artefactos frontend se pueden compilar. | No hay hosting público activo confirmado. La captura de CrazyHost indica que el plan gratis no incluye Node.js. |

## Pasos para una demostración local

1. Copiar `.env.example` como `.env` y completar Firebase y Google OAuth según el equipo.
2. Asegurar que las cuentas que probarán Drive estén en la lista **Usuarios de prueba** si OAuth está en modo de prueba.
3. Ejecutar `docker compose up --build` desde la raíz y abrir `http://localhost:5173`.
4. Enviar mensajes en dos sesiones para ver la actualización Socket.IO.
5. Conectar Drive y enviar un enlace a un archivo que la otra cuenta tenga permitido abrir.
6. Desde dos usuarios conectados al mismo hilo, iniciar una llamada y revisar permisos, cámara, micrófono, estado de medios y salida.
7. Mostrar Nginx, el `least_conn`, las dos instancias y el adaptador Redis como evidencia del balanceador.
8. Mostrar las secciones de datos en `docker-compose.yml` para las bases PostgreSQL y MongoDB.

## Comandos útiles para revisar antes de exponer

```powershell
git status --short --branch
git branch -vv
docker compose ps
```

`git status` permite detectar cambios locales que todavía no se subieron. `git branch -vv` muestra qué rama remota sigue cada rama local. `docker compose ps` muestra qué servicios locales están activos; no demuestra que exista un despliegue público.

## Guion sugerido

1. Empezar por el problema: los equipos necesitan agrupar conversaciones de trabajo por canal e hilo.
2. Mostrar el flujo visible: navegar, chatear, elegir un archivo de Drive y llamar.
3. Explicar los bloques: shell/microfrontends en la pantalla; gateway/microservicios detrás; almacenamiento según el tipo de dato.
4. Explicar Socket.IO como avisos instantáneos; WebRTC como transporte de medios; Nginx como distribuidor de conexiones; Redis como puente de eventos entre réplicas.
5. Cerrar con el estado real de nube, hosting y GitHub. Distinguir claramente demo local de producción.

# SGD Empresarial

Plataforma de colaboración pensada para los equipos de trabajo de una empresa. Desde la interfaz puedes iniciar sesión, moverte entre canales, subcanales e hilos, enviar mensajes y archivos, compartir enlaces de Google Drive y hacer videollamadas grupales.

## Ejecución en local

1. Instala **Docker Desktop** y verifica que esté corriendo.
2. Crea un archivo `.env` a partir de `.env.example` y llena las variables requeridas. Para la integración con Google Drive, asigna a `VITE_GOOGLE_CLIENT_ID` el cliente OAuth de tipo **Aplicación web** creado en Google Cloud.
3. En **Google Auth Platform**, registra `http://localhost:5173` como origen autorizado. Si la aplicación sigue en modo de prueba, añade las cuentas de Google que van a usar Drive en **Público → Usuarios de prueba**.
4. Abre PowerShell en la raíz del repositorio y ejecuta:

   ```bash
   docker compose up --build
   ```

5. Entra a `http://localhost:5173`. Para apagar los servicios presiona `Ctrl+C`; si Docker Compose quedó corriendo en segundo plano, ejecuta `docker compose down` desde otra terminal.

> **Nota:** el microfrontend de chat depende del paquete local `local-module` al compilarse. Por esa razón, en Docker Compose el servicio `mf-chat` toma la raíz del repositorio como contexto de build.

## Funcionalidades

- Gestión de empresas, canales, subcanales e hilos.
- Chat con historial guardado en MongoDB, además de reacciones, respuestas y archivos adjuntos.
- Mensajería en tiempo real mediante Socket.IO.
- Selector de Google Drive con permiso de solo lectura: los mensajes almacenan el enlace y sus metadatos, sin copiar los archivos.
- Videollamadas de hasta ocho personas, con invitaciones, audio, video e indicadores de cámara y micrófono.
- Balanceo de carga del chat con Nginx entre dos instancias del servicio.

## Arquitectura

El frontend está construido con **React** y **Vite**, usando un shell que integra varios microfrontends independientes. Un **gateway** dirige las peticiones hacia los microservicios correspondientes. La persistencia se reparte así:

- **PostgreSQL** (tres bases): autenticación, empresas y canales.
- **MongoDB**: mensajes.
- **Redis**: sincronización de eventos entre las instancias de Socket.IO.

Para más detalle sobre diagramas, puertos, servicios, flujos, configuración y limitaciones, revisa [docs/arquitectura.md](https://github.com/AnaVergara9/sgd-empresarial/blob/main/docs/arquitectura.md).
Si necesitas presentar el proyecto, en [docs/guia-demostracion.md](https://github.com/AnaVergara9/sgd-empresarial/blob/main/docs/guia-demostracion.md) está la guía para mostrar cada requisito durante la exposición.

## Estado del despliegue

- Por ahora el repositorio solo incluye la configuración para desarrollo local; el backend **no** está desplegado públicamente.
- La carpeta `deploy/aws` trae una plantilla, aún sin ejecutar, para alojar un remoto en S3/CloudFront. No corresponde a un despliegue activo.
- La carpeta `local-module` contiene el código del paquete local de Google Drive y no se publica como un servicio aparte.

## Seguridad

⚠️ Nunca subas a GitHub el archivo `.env`, secretos de OAuth, contraseñas ni credenciales de bases de datos.

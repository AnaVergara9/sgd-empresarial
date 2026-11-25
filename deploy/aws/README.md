# Despliegue en AWS

Este directorio incluye una plantilla para crear el hosting del microfrontend de chat en S3 privado + CloudFront y un script para publicarlo. La plantilla no se ha ejecutado; eso requiere acceso a una cuenta AWS y aprobación de recursos que generan costo.

Para crear el hosting, ejecutar AWS CLI desde la raíz del repositorio (con región y perfil configurados):

```powershell
aws cloudformation deploy --template-file deploy/aws/hosting-mf-chat.yml --stack-name sgd-mf-chat-hosting --region us-east-1
aws cloudformation describe-stacks --stack-name sgd-mf-chat-hosting --region us-east-1 --query "Stacks[0].Outputs"
```

La salida incluye el nombre del bucket, el ID de CloudFront y la URL HTTPS del remoto. La URL debe configurarse como `VITE_MF_CHAT_URL` al compilar/publicar el shell. Esta plantilla no crea el backend.

## Microfrontend `mf-chat` en S3 + CloudFront

La app debe compilar con URLs públicas porque Vite incorpora esas variables al bundle. No uses `localhost` en producción.

En PowerShell, desde la raíz del repositorio:

```powershell
$env:VITE_API_URL = "https://api.tu-dominio.com"
$env:VITE_SOCKET_URL = "https://api.tu-dominio.com"
$env:VITE_GOOGLE_CLIENT_ID = "TU_CLIENT_ID.apps.googleusercontent.com"
./deploy/aws/publicar-mf-chat.ps1 -Bucket "NOMBRE_BUCKET" -DistributionId "ID_CLOUDFRONT"
```

El script compila `frontends/mf-chat`, sincroniza `dist` con S3 y solicita una invalidación de CloudFront. Se debe tener AWS CLI configurado con permisos sobre ese bucket y esa distribución. En CloudFront configura el bucket como origen privado con Origin Access Control, HTTPS obligatorio y una política de caché adecuada para `remoteEntry.js` (sin cachear una versión antigua después de una publicación).

En Google Cloud Console registra el dominio público del chat como origen OAuth autorizado. Configura el mismo `VITE_GOOGLE_CLIENT_ID` también en la compilación local.

## Backend

La app usa varios procesos con estado y persistencia (gateway, servicios, PostgreSQL, MongoDB, Redis), por lo que `docker compose up` local no equivale a publicar un único contenedor. La topología objetivo en AWS es:

- VPC con subredes públicas para un Application Load Balancer (HTTPS) y privadas para tareas ECS Fargate.
- ECS Services para gateway, auth, empresas, canales, dos réplicas de chat detrás de Nginx, archivos y videollamadas.
- PostgreSQL administrado (RDS) para auth/empresa/canales; MongoDB administrado compatible (DocumentDB, previa revisión de compatibilidad de Mongoose); Redis administrado (ElastiCache) para Socket.IO.
- ECR para imágenes; Secrets Manager para credenciales de base de datos, Firebase/Cloudinary si se usan; CloudWatch para logs y health checks.
- ALB enruta API y WebSocket a gateway; Socket.IO debe usar WebSocket y conservar los timeouts prolongados del balanceador. TURN es necesario para llamadas WebRTC entre redes que bloqueen conexiones directas.

El backend no está desplegado todavía: este repositorio no contiene una cuenta/región elegida, dominios, secretos, imágenes publicadas ni infraestructura AWS. Antes de crear recursos se deben acordar presupuesto y retención de datos. No subir `.env` ni secretos a Git.

## Operación y actualización

1. Construir y publicar cada imagen backend en ECR desde CI.
2. Desplegar las tareas ECS y verificar `/health` y `/health/servicios`.
3. Compilar y publicar `mf-chat` con las URLs del ALB y actualizar CloudFront.
4. Confirmar CORS para el dominio del shell y videollamada; configurar OAuth y Firebase para los dominios HTTPS.
5. Probar mensajes, reconexión Socket.IO, adjuntos Drive con permisos compartidos y videollamadas entre redes.

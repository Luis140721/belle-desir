# Belle Désir - Checklist de Variables de Entorno para Deploy

## Variables del Backend (Render)

### OBLIGATORIAS - El backend no arranca sin estas

| Variable | Para qué sirve | De dónde la saco | Valor específico |
|----------|----------------|------------------|------------------|
| `DATABASE_URL` | Conexión a PostgreSQL | Neon dashboard | `postgresql://neondb_owner:npg_JTt5cNFjKh4U@ep-autumn-flower-a43r15dj.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Clave maestra JWT | Generar tú mismo | Mínimo 32 caracteres únicos |
| `JWT_ACCESS_SECRET` | Clave para tokens de acceso | Generar tú mismo | Mínimo 32 caracteres únicos |
| `JWT_REFRESH_SECRET` | Clave para tokens de refresh | Generar tú mismo | Mínimo 32 caracteres únicos |
| `FRONTEND_URL` | CORS - URL tienda | Cloudflare Pages | `https://tu-tienda.pages.dev` |
| `ADMIN_URL` | CORS - URL admin | Cloudflare Pages | `https://tu-admin.pages.dev` |
| `CLOUDINARY_CLOUD_NAME` | Storage de imágenes | Cloudinary dashboard | `515977735966422` |
| `CLOUDINARY_API_KEY` | API key Cloudinary | Cloudinary dashboard | `5I_RJbSADOW5Agqcu3Fkp7iSd7M` |
| `CLOUDINARY_API_SECRET` | API secret Cloudinary | Cloudinary dashboard | Tu API secret real |
| `BOLD_API_KEY` | Pagos Bold Colombia | Bold dashboard (test) | `F5Qr6cY_pRw4MwaDyzxmvlU1RoRnF4oghFnNDSG18x0` |
| `BOLD_INTEGRITY_SECRET` | Webhook Bold Colombia | Bold dashboard (test) | `J_wadDN1A7VsCfBb5ZIaig` |

### OPCIONALES - El backend funciona sin estas

| Variable | Para qué sirve | De dónde la saco | Valor específico |
|----------|----------------|------------------|------------------|
| `RESEND_API_KEY` | Envío de emails | Resend dashboard | `re_cQR3UiJh_AMHUHZqhdS3Ci3WcVUUPkasu` |
| `FROM_EMAIL` | Email remitente | Configurar tú mismo | `noreply@belledesir.com` |

### CON VALORES POR DEFECTO - No es necesario configurar

| Variable | Valor por defecto | Notas |
|----------|-------------------|-------|
| `NODE_ENV` | `development` | Cambiar a `production` |
| `PORT` | `3001` | Render inyecta su propio puerto |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Tiempo de expiración access token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Tiempo de expiración refresh token |
| `STORAGE_PROVIDER` | `cloudinary` | No cambiar |

---

## Variables del Frontend/Admin (Cloudflare Pages)

### OBLIGATORIAS

| Variable | Para qué sirve | De dónde la saco | Valor específico |
|----------|----------------|------------------|------------------|
| `VITE_API_URL` | URL base del backend | Render dashboard | `https://tu-backend.onrender.com` |

---

## Pasos para Configurar

### 1. Neon (Base de datos)
1. Ir a https://neon.tech
2. Crear nuevo proyecto
3. Copiar `DATABASE_URL` del dashboard
4. Pegar en Render environment

### 2. Cloudinary (Imágenes)
1. Ir a https://cloudinary.com
2. Dashboard > Account Details
3. Copiar:
   - Cloud name: `515977735966422`
   - API key: `5I_RJbSADOW5Agqcu3Fkp7iSd7M`
   - API secret: tu secret real
4. Configurar en Render

### 3. Bold Colombia (Pagos)
1. Ir a https://bold.co
2. Panel > Integraciones > API
3. Modo test:
   - API key: `F5Qr6cY_pRw4MwaDyzxmvlU1RoRnF4oghFnNDSG18x0`
   - Integrity secret: `J_wadDN1A7VsCfBb5ZIaig`
4. Configurar webhook URL después de deploy

### 4. Resend (Emails - Opcional)
1. Ir a https://resend.com
2. API Keys > Create API Key
3. Copiar key: `re_cQR3UiJh_AMHUHZqhdS3Ci3WcVUUPkasu`
4. Configurar en Render

### 5. JWT Keys (Seguridad)
1. Generar claves únicas y seguras:
   ```bash
   # Ejemplo con openssl
   openssl rand -base64 32  # Para cada JWT key
   ```
2. Configurar las 3 claves en Render

### 6. Render (Backend)
1. Ir a Render dashboard
2. Environment > Add from .env
3. Subir archivo `.env.render.production.example`
4. Reemplazar placeholders con valores reales
5. Deploy

### 7. Cloudflare Pages (Frontend/Admin)
1. Crear proyectos para tienda y admin
2. Configurar `VITE_API_URL` con URL de Render
3. Deploy

---

## URLs a Configurar Post-Deploy

### Webhook Bold Colombia
```
https://tu-backend.onrender.com/api/payments/bold-webhook
```

### CORS URLs
```
FRONTEND_URL=https://tu-tienda.pages.dev
ADMIN_URL=https://tu-admin.pages.dev
```

---

## Checklist Final de Verificación

- [ ] Base de datos Neon conectada
- [ ] JWT keys generadas y únicas
- [ ] Cloudinary configurado con API keys reales
- [ ] Bold Colombia en modo test configurado
- [ ] CORS URLs apuntan a Cloudflare Pages
- [ ] Resend opcional configurado
- [ ] Backend responde en `/api/health`
- [ ] Frontend carga productos
- [ ] Admin panel funciona
- [ ] Subida de imágenes funciona
- [ ] Pagos Bold redirigen correctamente
- [ ] Emails de prueba se envían (si Resend configurado)

---

## Variables ELIMINADAS (No configurar)

- `STRIPE_SECRET_KEY` - Eliminado del proyecto
- `STRIPE_WEBHOOK_SECRET` - Eliminado del proyecto
- `WOMPI_PUBLIC_KEY` - Eliminado del proyecto
- `WOMPI_EVENTS_SECRET` - Eliminado del proyecto
- `JWT_EXPIRES_IN` - Reemplazado por variables específicas

# Belle Désir - Guía de Deploy Gratuito en Producción

## Arquitectura de Producción

```
                    Internet
                       |
        +------------------------------+
        |   Cloudflare Pages (Free)    |
        |  +-------------------------+  |
        |  |    Frontend Tienda      |  |
        |  |   (Vite + TypeScript)   |  |
        |  +-------------------------+  |
        |  |    Admin Panel          |  |
        |  |  (React + TailwindCSS)  |  |
        |  +-------------------------+  |
        +------------------------------+
                       |
                       | HTTPS API Calls
                       |
        +------------------------------+
        |       Render (Free Tier)     |
        |  +-------------------------+  |
        |  |   Backend API           |  |
        |  | (Node.js + Express)     |  |
        |  |   + Prisma ORM          |  |
        |  +-------------------------+  |
        +------------------------------+
                       |
                       | PostgreSQL Connection
                       |
        +------------------------------+
        |   Neon / Supabase (Free)     |
        |      PostgreSQL Database     |
        +------------------------------+

Integraciones Externas:
- Cloudinary: Storage de imágenes
- Bold Colombia: Procesamiento de pagos
- Resend: Envío de emails
```

## Servicios y Costos (Free Tier)

| Servicio | Plan | Costo | Límites |
|-----------|------|-------|---------|
| Render Web Service | Free | $0 | 750 horas/mes, sleep después de 15min inactividad |
| Neon PostgreSQL | Free | $0 | 3GB DB, 1GB backup |
| Cloudflare Pages | Free | $0 | 500 builds/més, 100,000 requests/mes |
| Cloudinary | Free | $0 | 25GB storage, 25GB bandwidth/mes |
| Bold Colombia | Test | $0 | Modo prueba sin costo |
| Resend | Free | $0 | 3,000 emails/día |

---

## Paso a Paso de Deploy

### 1. Base de Datos (Neon o Supabase)

#### Opción A: Neon
1. Crear cuenta en https://neon.tech
2. Crear nuevo proyecto PostgreSQL
3. Copiar `DATABASE_URL` del dashboard
4. Ejecutar migraciones:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

#### Opción B: Supabase
1. Crear cuenta en https://supabase.com
2. Crear nuevo proyecto
3. Ir a Settings > Database
4. Copiar `Connection string`
5. Ejecutar migraciones y seed

### 2. Backend (Render)

#### 2.1 Crear Web Service
1. Crear cuenta en https://render.com
2. Conectar repositorio GitHub
3. Crear "Web Service"
4. Configuración:
   - **Name**: `belle-desir-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node 18`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

#### 2.2 Variables de Entorno (Render Environment)
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT (generar claves de 32+ caracteres)
JWT_SECRET=tu_jwt_secret_minimo_32_caracteres_aleatorios
JWT_ACCESS_SECRET=tu_access_secret_32_caracteres
JWT_REFRESH_SECRET=tu_refresh_secret_32_caracteres
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
NODE_ENV=production
PORT=3001

# CORS URLs (reemplazar con tus URLs de Cloudflare)
FRONTEND_URL=https://tu-tienda.pages.dev
ADMIN_URL=https://tu-admin.pages.dev

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Bold Colombia (modo test)
BOLD_API_KEY=tu_bold_api_key_test
BOLD_INTEGRITY_SECRET=tu_bold_integrity_secret_test

# Resend Email
RESEND_API_KEY=re_tu_api_key
FROM_EMAIL=noreply@belledesir.com

# Storage
STORAGE_PROVIDER=cloudinary
```

#### 2.3 Deploy Inicial
1. Hacer commit de los cambios al repo
2. Render iniciará deploy automático
3. Esperar a que termine y obtener URL: `https://belle-desir-backend.onrender.com`

#### 2.4 Configurar Webhook de Bold
1. Ir al dashboard de Bold Colombia
2. Configurar webhook URL: `https://belle-desir-backend.onrender.com/api/payments/bold-webhook`
3. Guardar configuración

### 3. Frontend Tienda (Cloudflare Pages)

#### 3.1 Crear Proyecto
1. Crear cuenta en https://cloudflare.com
2. Ir a Pages > Create a project
3. Conectar repositorio GitHub
4. Configuración:
   - **Project name**: `belle-desir-tienda`
   - **Production branch**: `main`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

#### 3.2 Variables de Entorno (Cloudflare Pages)
```bash
VITE_API_URL=https://belle-desir-backend.onrender.com
```

#### 3.3 Deploy
1. Guardar configuración
2. Cloudflare Pages hará deploy automático
3. Obtener URL: `https://belle-desir-tienda.pages.dev`

### 4. Admin Panel (Cloudflare Pages)

#### 4.1 Crear Segundo Proyecto
1. Repetir paso 3 pero con:
   - **Project name**: `belle-desir-admin`
   - **Root directory**: `admin`

#### 4.2 Variables de Entorno (Admin)
```bash
VITE_API_URL=https://belle-desir-backend.onrender.com
```

#### 4.3 Deploy
1. Guardar y deploy
2. Obtener URL: `https://belle-desir-admin.pages.dev`

---

## Checklist de Pruebas Post-Deploy

### Backend Tests
- [ ] Health check: `GET https://backend.onrender.com/api/health`
- [ ] CORS configurado correctamente
- [ ] Conexión a base de datos funcionando
- [ ] Variables de entorno cargadas (ver logs de Render)

### Frontend Tests
- [ ] Tienda carga correctamente
- [ ] Listado de productos visible
- [ ] Login/Registro funcionando
- [ ] Carrito de compras operativo

### Admin Panel Tests
- [ ] Admin panel carga
- [ ] Login admin funciona
- [ ] Dashboard con estadísticas visible
- [ ] Gestión de productos funciona

### Integraciones Tests
- [ ] **Cloudinary**: Subir imagen desde admin
  ```bash
  1. Ir a admin panel
  2. Crear nuevo producto
  3. Subir imagen
  4. Verificar que la imagen se ve en la tienda
  ```

- [ ] **Bold Colombia**: Proceso de pago completo
  ```bash
  1. Añadir producto al carrito
  2. Checkout como usuario
  3. Redirigir a Bold (modo test)
  4. Completar pago de prueba
  5. Verificar que orden cambia a PAID
  6. Recibir email de confirmación
  ```

- [ ] **Resend**: Envío de emails
  ```bash
  1. Registrar nuevo usuario
  2. Verificar email de bienvenida
  3. Probar recuperación de contraseña
  ```

### Flujo Completo E2E
- [ ] Usuario se registra
- [ ] Recibe email de bienvenida
- [ ] Navega por productos
- [ ] Añade al carrito
- [ ] Completa compra con Bold
- [ ] Recibe email de confirmación
- [ ] Admin puede ver la orden en panel

---

## URLs de Webhooks (Configurar en Dashboards)

### Bold Colombia
```
https://belle-desir-backend.onrender.com/api/payments/bold-webhook
```

---

## Troubleshooting Común

### Backend no responde
- Verificar logs en Render dashboard
- Confirmar variables de entorno configuradas
- Revisar conexión a base de datos

### CORS Errors
- Verificar que `FRONTEND_URL` y `ADMIN_URL` coincidan con URLs de Cloudflare
- Confirmar que no haya trailing slashes

### Imágenes no cargan
- Verificar credenciales de Cloudinary
- Confirmar que `STORAGE_PROVIDER=cloudinary`
- Revisar logs de subida de imágenes

### Pagos Bold no funcionan
- Verificar API keys en modo test
- Confirmar URL de webhook configurada
- Revisar logs de webhook en Render

### Emails no llegan
- Verificar API key de Resend
- Confirmar que `FROM_EMAIL` esté configurado
- Revisar carpeta de spam

---

## Monitoreo y Mantenimiento

### Render
- Monitorizar logs regularmente
- Configurar alertas de errores
- Verificar uso de recursos (límites free tier)

### Cloudflare Pages
- Monitorizar analytics
- Verificar builds automáticos
- Configurar custom domain (opcional)

### Base de Datos
- Monitorizar tamaño y uso
- Backups automáticos (Neon/Supabase)
- Optimizar queries si es necesario

---

## Escalabilidad (Futuro)

Cuando el proyecto crezca, considerar:

1. **Render**: Upgrade a Starter plan ($7/mes) para evitar sleep
2. **Database**: Upgrade a plan con más recursos
3. **CDN**: Cloudflare para imágenes y assets estáticos
4. **Monitoring**: Integrar Sentry para errores
5. **Analytics**: Google Analytics o similar

---

## Contacto y Soporte

- **Backend Issues**: Ver logs en Render dashboard
- **Frontend Issues**: Ver builds en Cloudflare Pages
- **Database Issues**: Dashboard de Neon/Supabase
- **Pagos**: Soporte Bold Colombia
- **Emails**: Soporte Resend

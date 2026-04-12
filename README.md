# Belle Désir

E-commerce premium de productos de belleza con arquitectura full-stack moderna.

## Arquitectura

- **Backend** - API REST (Node.js + Express + TypeScript + Prisma + PostgreSQL)
- **Frontend** - Tienda y landing (Vite + TypeScript + CSS Vanilla)
- **Admin** - Panel de administración (React + TypeScript + TailwindCSS)

## Características

- **Autenticación** completa con JWT y recuperación de contraseña
- **Gestión de productos** con imágenes en Cloudinary
- **Carrito de compras** persistente con animaciones
- **Procesamiento de pagos** con Stripe y Bold Colombia
- **Sistema de órdenes** con seguimiento completo
- **Reviews y ratings** de productos
- **Panel admin** con estadísticas y gestión
- **Email service** con Resend
- **Upload de imágenes** a Cloudinary con transformaciones automáticas

## Requisitos Previos

- Node.js 18+
- PostgreSQL 14+
- npm 8+

## Configuración Inicial

### 1. Clonar el repositorio
```bash
git clone https://github.com/Luis140721/belle-desir.git
cd belle-desir
```

### 2. Configurar Base de Datos
```bash
# Crear base de datos PostgreSQL
createdb belle_desir

# Configurar variables de entorno (ver sección Variables de Entorno)
```

### 3. Instalar dependencias y configurar
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales

# Generar Prisma Client y correr migraciones
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Frontend
cd ../frontend
npm install

# Admin
cd ../admin
npm install
```

## Variables de Entorno

### Backend (.env)
```bash
# Base de datos PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/belle_desir

# JWT
JWT_SECRET=minimo_32_caracteres_aleatorios
JWT_EXPIRES_IN=7d
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Servidor
PORT=3001
NODE_ENV=development

# CORS - Orígenes permitidos
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174

# Bold Colombia - Pagos
BOLD_API_KEY=tu_api_key
BOLD_INTEGRITY_SECRET=tu_secret

# Email Service - Resend
RESEND_API_KEY=re_tu_api_key
FROM_EMAIL=noreply@belledesir.com

# Cloudinary - Storage de imágenes
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Stripe - Pagos
STRIPE_SECRET_KEY=sk_test_tu_secret_key
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret

# Storage
STORAGE_PROVIDER=cloudinary
```

## Levantar en Desarrollo

### Backend
```bash
cd backend
npm run dev
# Servidor corriendo en http://localhost:3001
```

### Frontend
```bash
cd frontend
npm run dev
# Frontend corriendo en http://localhost:5173
```

### Admin Panel
```bash
cd admin
npm run dev
# Admin corriendo en http://localhost:5174
```

## Scripts Disponibles

### Backend
```bash
npm run dev      # Servidor en modo desarrollo
npm run build    # Compilar TypeScript
npm run start    # Servidor en producción
npm run lint     # Linting con ESLint
npm run format   # Formato con Prettier
```

### Frontend
```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build para producción
npm run preview   # Preview del build
npm run typecheck # Verificación TypeScript
```

### Admin
```bash
npm run dev     # Servidor de desarrollo
npm run build   # Build para producción
npm run lint    # Linting
npm run preview # Preview del build
```

## Base de Datos

### Schema Principal
- **Users**: Autenticación y roles (USER/ADMIN)
- **Products**: Catálogo con imágenes, precios, stock
- **Categories**: Categorías de productos
- **Cart**: Carrito de compras persistente
- **Orders**: Gestión de órdenes con estados
- **Reviews**: Sistema de reseñas y ratings

### Migraciones
```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones pendientes
npx prisma migrate deploy

# Resetear base de datos
npx prisma migrate reset

# Verificar estado
npx prisma migrate status
```

### Seed Data
```bash
# Poblar base de datos con datos iniciales
npx prisma db seed
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/refresh` - Refrescar token
- `POST /api/auth/forgot-password` - Recuperar contraseña
- `POST /api/auth/reset-password` - Resetear contraseña

### Productos
- `GET /api/products` - Listar productos (paginado, filtros)
- `GET /api/products/:slug` - Detalle de producto
- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/:id` - Actualizar producto (admin)
- `DELETE /api/products/:id` - Eliminar producto (admin)
- `POST /api/products/:id/images` - Subir imágenes (admin)

### Carrito
- `GET /api/cart` - Obtener carrito
- `POST /api/cart/add` - Agregar al carrito
- `PUT /api/cart/update` - Actualizar cantidad
- `DELETE /api/cart/remove` - Eliminar del carrito

### Órdenes
- `GET /api/orders` - Listar órdenes del usuario
- `POST /api/orders` - Crear orden
- `GET /api/orders/:id` - Detalle de orden

## Arquitectura de Archivos

```bash
belle-desir/
backend/
  src/
    config/          # Configuración (database, cloudinary, multer)
    features/        # Módulos de negocio
      auth/         # Autenticación
      products/     # Gestión de productos
      cart/         # Carrito de compras
      orders/       # Gestión de órdenes
      payments/     # Procesamiento de pagos
    middleware/      # Middleware personalizados
    shared/         # Utilidades compartidas
    services/       # Servicios externos (email, etc.)
  prisma/
    schema.prisma   # Schema de base de datos
    migrations/     # Migraciones
    seed.ts         # Datos iniciales

frontend/
  src/
    components/     # Componentes reutilizables
    pages/         # Páginas de la aplicación
    services/      # Servicios API
    utils/         # Utilidades
    css/           # Estilos
    assets/        # Assets estáticos

admin/
  src/
    components/     # Componentes del admin
    pages/         # Páginas del panel
    api/           # Conexiones API
    contexts/      # Contextos React
    hooks/         # Hooks personalizados
```

## Deploy

### Backend (Producción)
```bash
# Build
cd backend
npm run build

# Variables de producción
NODE_ENV=production
PORT=3001

# Iniciar servidor
npm start
```

### Frontend (Producción)
```bash
# Build
cd frontend
npm run build

# Servir archivos estáticos
# Usar nginx, Apache, o Vercel/Netlify
```

## Servicios Externos Requeridos

### Cloudinary
- Cuenta en https://cloudinary.com
- Cloud Name, API Key, API Secret

### Resend
- Cuenta en https://resend.com
- API Key para envío de emails

### Stripe
- Cuenta en https://stripe.com
- Secret Key y Webhook Secret

### Bold Colombia (Opcional)
- Cuenta en https://bold.co
- API Key e Integrity Secret

## Troubleshooting

### Problemas Comunes

**Error de conexión a base de datos**
```bash
# Verificar PostgreSQL está corriendo
pg_isready

# Verificar conexión
psql postgresql://user:password@localhost:5432/belle_desir
```

**Error de CORS**
```bash
# Verificar variables FRONTEND_URL y ADMIN_URL en .env
# Asegurar que los puertos coincidan
```

**Error de Cloudinary**
```bash
# Verificar credenciales en .env
# Probar conexión manualmente
node -e "require('./src/config/cloudinary').default.api.ping()"
```

**Error de compilación TypeScript**
```bash
# Verificar tipos
npx tsc --noEmit

# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

## Contribución

1. Fork del repositorio
2. Crear feature branch: `git checkout -b feature/nueva-funcionalidad`
3. Commits descriptivos: `git commit -m "feat: agregar nueva funcionalidad"`
4. Push al fork: `git push origin feature/nueva-funcionalidad`
5. Pull Request con descripción detallada

## Licencia

Proyecto privado - Todos los derechos reservados.

## Contacto

- **Repository**: https://github.com/Luis140721/belle-desir
- **Issues**: Reportar en GitHub Issues
- **Email**: soporte@belledesir.com

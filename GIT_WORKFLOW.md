# Git Workflow — Belle Désir

## Mapa de branches

| Branch | Sale de | Se fusiona a | Propósito |
|--------|---------|--------------|-----------|
| main | — | — | Producción. Solo código que funciona en vivo. |
| develop | main | staging | Base de todo el desarrollo. |
| staging | develop | main | Pruebas finales antes de prod. |
| release/produccion | develop | main | Config final para el deploy. |
| feature/pagos-produccion | develop | develop | Keys Bold reales, webhook URL real. |
| feature/pagos-nequi-directo | develop | develop | Futuros métodos de pago. |
| feature/imagenes-productos | develop | develop | Subir imágenes reales de los 19 productos. |
| feature/imagenes-cloudinary | develop | develop | Mover imágenes a la nube para producción. |
| feature/deploy-backend | develop | release/produccion | Config Railway/Render. |
| feature/deploy-frontend | develop | release/produccion | Vercel + API URL producción. |
| feature/deploy-admin | develop | release/produccion | Admin en Vercel + API URL producción. |
| hotfix/pagos | main | main + develop | Emergencia en pagos en producción. |
| hotfix/general | main | main + develop | Cualquier bug crítico en producción. |

## Lo próximo a trabajar por branch

### feature/imagenes-productos
- Descargar imágenes de Drive
- Renombrar con SKU de cada producto
- Subirlas a backend/uploads/products/
- Actualizar campo images en DB via seed o admin

### feature/pagos-produccion
- Registrar cuenta Bold real (no de prueba)
- Reemplazar BOLD_API_KEY con la de producción
- Configurar webhook URL real del backend en Railway

### feature/imagenes-cloudinary
- Crear cuenta Cloudinary gratuita
- Instalar SDK en el backend
- Modificar uploadMiddleware.ts para subir a Cloudinary
- Guardar URL de Cloudinary en campo images del producto
- Eliminar dependencia de archivos locales en uploads/

### feature/deploy-backend
- Crear proyecto en Railway
- Configurar PostgreSQL en Railway
- Agregar todas las variables de entorno
- Configurar el comando de start
- Correr prisma migrate deploy en Railway

### feature/deploy-frontend
- Crear proyecto en Vercel
- Agregar variable VITE_API_URL=https://tu-backend.railway.app
- Conectar repo de GitHub a Vercel
- Verificar que el build funciona

### feature/deploy-admin
- Crear proyecto separado en Vercel para el admin
- Agregar variable VITE_API_URL=https://tu-backend.railway.app
- Conectar carpeta /admin del repo a Vercel

## Convención de commits

feat:     nueva funcionalidad
fix:      corrección de bug
chore:    mantenimiento (deps, config, env)
docs:     documentación
style:    formato sin cambio de lógica
refactor: refactorización
perf:     mejora de rendimiento
hotfix:   corrección urgente en producción

## Tags de versiones

v0.1.0 → Código completo funcionando en local ← ESTÁS AQUÍ
v0.2.0 → Imágenes reales subidas + pagos en prueba funcionando
v0.3.0 → Deploy completo en Railway + Vercel
v1.0.0 → Primera venta real confirmada en producción

## Flujo para trabajar en una feature

git checkout develop
git pull origin develop
git checkout feature/nombre-feature
# trabajar...
git add .
git commit -m "feat: descripcion del cambio"
git push origin feature/nombre-feature
# cuando está lista:
git checkout develop
git merge feature/nombre-feature
git push origin develop

## Flujo para un hotfix urgente en producción

git checkout main
git pull origin main
git checkout hotfix/general
# corregir el bug...
git commit -m "hotfix: descripcion del problema"
git checkout main
git merge hotfix/general
git push origin main
git tag -a v1.0.1 -m "Hotfix: descripcion"
# también mergearlo a develop para no perder el fix
git checkout develop
git merge hotfix/general
git push origin develop

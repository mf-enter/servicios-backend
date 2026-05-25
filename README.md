# Servicios Backend

Backend para plataforma de servicios construido con Node.js, Express y MySQL.

## Características

- Autenticación con JWT
- Control de acceso basado en roles (RBAC)
- Permisos granulares
- Gestión de usuarios, trabajadores y servicios
- Sistema de pagos
- Logs administrativos

## Requisitos

- Node.js v14+
- MySQL 5.7+
- npm o yarn

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno en `.env`

## Uso

Desarrollo:
```bash
npm run dev
```

Producción:
```bash
npm start
```

## Producción

El backend expone el WebSocket en la ruta canónica `/ws` y mantiene compatibilidad con `/` para clientes legados. Detrás de un proxy o balanceador, asegúrate de reenviar `Connection: upgrade` y `Upgrade: websocket`.

Si el sitio público usa HTTPS, el frontend debe conectar por `wss` y no por `ws`. La URL pública de API debe apuntar al dominio real del backend en producción, no a `localhost`.

Variables recomendadas:

- `VITE_API_URL=https://tu-dominio-backend`
- `VITE_WS_PATH=/ws`
- o `VITE_WS_URL=wss://tu-dominio-backend/ws`

## Estructura del Proyecto

```
src/
├─ config/          # Configuración de BD y variables de entorno
├─ controllers/     # Controladores de lógica de negocio
├─ middleware/      # Middlewares de autenticación y autorización
├─ models/          # Modelos de datos
├─ routes/          # Definición de rutas API
└─ utils/           # Utilidades y validadores
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/logout` - Logout

### Usuarios
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Trabajadores
- `GET /api/workers` - Obtener todos los trabajadores
- `GET /api/workers/:id` - Obtener trabajador por ID
- `POST /api/workers` - Crear trabajador
- `PUT /api/workers/:id` - Actualizar trabajador

### Servicios
- `GET /api/services` - Obtener todos los servicios
- `GET /api/services/:id` - Obtener servicio por ID
- `POST /api/services` - Crear servicio
- `PUT /api/services/:id` - Actualizar servicio

### Pagos
- `GET /api/payments` - Obtener todos los pagos
- `POST /api/payments` - Crear pago
- `GET /api/payments/:id` - Obtener pago por ID

### Admin
- `GET /api/admin/dashboard` - Dashboard administrativo
- `GET /api/admin/logs` - Obtener logs
- `GET /api/admin/statistics` - Obtener estadísticas

## Licencia

ISC

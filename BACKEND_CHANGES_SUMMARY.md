# Resumen de Cambios - Backend

## Problema Identificado
```
Error: Unknown column 's.amount' in 'field list'
```
La tabla `services` no tenía la columna `amount` ni `estimated_price`, pero el modelo Service.js intentaba seleccionarla en las queries.

## Cambios Realizados en Backend

### 1. **Archivo: `database/add_amount_to_services.sql`** (NUEVO)
```sql
ALTER TABLE `services`
  ADD COLUMN `estimated_price` DECIMAL(10, 2) NULL AFTER `description`;
```
- Agregó la columna `estimated_price` a la tabla de servicios
- Tipo de dato: DECIMAL(10,2) para precisión monetaria
- Posición: después de la columna `description`

### 2. **Archivo: `src/models/Service.js`**

#### Cambio 2.1 - Línea ~112: Query SELECT
**Antes:**
```javascript
s.amount AS estimated_price,
```

**Después:**
```javascript
s.estimated_price,
```

#### Cambio 2.2 - Método CREATE: Agregar soporte para estimated_price
**Agregado después de la línea ~218:**
```javascript
if (schemaCache.serviceColumns.has("estimated_price")) {
  pushValue("estimated_price", data.estimated_price ?? null);
}
```

#### Cambio 2.3 - Método UPDATE: Agregar soporte para estimated_price  
**Agregado después de la línea ~254:**
```javascript
if (schemaCache.serviceColumns.has("estimated_price") && Object.prototype.hasOwnProperty.call(data, "estimated_price")) {
  assignments.push("estimated_price=?");
  values.push(data.estimated_price);
}
```

## Archivos Modificados
- ✅ `src/models/Service.js` - Query y métodos actualizados
- ✅ `database/add_amount_to_services.sql` - Migración SQL aplicada

## Archivo Documentación Agregado
- ✅ `FRONTEND_CHANGES_REQUIRED.md` - Guía completa para el frontend

## Endpoints Ahora Funcionales
Todos los endpoints que obtienen servicios ahora funcionan sin error:
- GET /api/services
- GET /api/services/:id
- GET /api/users/me/history
- GET /api/users/me/services
- GET /api/users/profile
- GET /api/workers/me/history
- GET /api/workers/me/services
- GET /api/workers/profile

## Base de Datos
Se ejecutó la migración SQL automáticamente. La tabla `services` ahora contiene la columna `estimated_price`.

## Próximos Pasos - Frontend
El frontend debe:
1. Enviar `estimated_price` cuando crea servicios: `POST /api/services`
2. Actualizar `estimated_price` cuando edita servicios: `PUT /api/services/:id`
3. Mostrar `estimated_price` en las pantallas que listan servicios
4. Agregar un campo input para capturar el precio estimado en formularios

Ver `FRONTEND_CHANGES_REQUIRED.md` para detalles completos.

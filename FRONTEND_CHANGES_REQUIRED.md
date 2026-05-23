# Cambios Requeridos en el Frontend para Servicios

## Problema Resuelto
Se agregó la columna `estimated_price` (precio estimado) a la tabla `services` en la base de datos. El backend ahora puede devolver esta información correctamente.

## Cambios Necesarios en el Frontend

### 1. **Al Crear un Servicio (POST /api/services)**

Cuando envíes una solicitud POST para crear un servicio, ahora debes incluir el campo `estimated_price`:

```json
{
  "service_type_id": 1,
  "client_id": 4,
  "worker_id": null,
  "description": "Descripción del servicio",
  "estimated_price": 150.50,  // ← NUEVO: Precio estimado del servicio
  "status_id": 1
}
```

**Campo nuevo:**
- `estimated_price` (number): Precio estimado en formato decimal (ej: 150.50)

### 2. **Al Actualizar un Servicio (PUT /api/services/:id)**

Cuando actualices un servicio, también puedes incluir/modificar el `estimated_price`:

```json
{
  "service_type_id": 1,
  "description": "Descripción actualizada",
  "estimated_price": 200.00,  // ← Puedes actualizar el precio
  "status_id": 2
}
```

### 3. **Al Obtener Servicios**

El backend ahora devolverá el campo `estimated_price` en todas las respuestas GET:

```json
{
  "service_id": 1,
  "service_type_id": 1,
  "service_type_name": "Reparación",
  "client_id": 4,
  "client_name": "Juan",
  "client_lastname": "Pérez",
  "description": "Servicio de reparación",
  "estimated_price": 150.50,  // ← NUEVO: Ahora incluido
  "payment_amount": 150.50,   // Monto pagado (puede ser diferente)
  "status_id": 1,
  "status_name": "Pendiente",
  "created_at": "2026-05-22T...",
  ...
}
```

### 4. **Endpoints Afectados**

Los siguientes endpoints ahora funcionarán correctamente y devolverán `estimated_price`:

- ✅ `GET /api/services` - Lista de servicios
- ✅ `GET /api/services/:id` - Detalle de servicio
- ✅ `GET /api/users/me/history` - Historial del cliente
- ✅ `GET /api/users/me/services` - Servicios del cliente
- ✅ `GET /api/users/profile` - Perfil del usuario
- ✅ `GET /api/workers/me/history` - Historial del trabajador
- ✅ `GET /api/workers/me/services` - Servicios del trabajador
- ✅ `GET /api/workers/profile` - Perfil del trabajador

### 5. **Diferencia: estimated_price vs payment_amount**

- **`estimated_price`**: Precio que el cliente acuerda con el trabajador al crear/solicitar el servicio
- **`payment_amount`**: Monto real que se pagó (puede variar si hay ajustes)

### 6. **Cambios en Componentes UI**

Si tienes componentes que muestren servicios, actualiza para:

1. **Mostrar el precio estimado**:
   ```javascript
   // Antes: No aparecía
   // Ahora:
   <p>Precio Estimado: ${service.estimated_price || 'No especificado'}</p>
   ```

2. **En formularios de creación/edición de servicios**:
   ```jsx
   // Agregar campo para estimated_price
   <input 
     type="number" 
     name="estimated_price" 
     step="0.01"
     placeholder="Precio estimado"
     value={formData.estimated_price}
     onChange={(e) => setFormData({...formData, estimated_price: parseFloat(e.target.value)})}
   />
   ```

## Resumen de Cambios de Base de Datos

Se ejecutó la siguiente migración:
```sql
ALTER TABLE `services`
  ADD COLUMN `estimated_price` DECIMAL(10, 2) NULL AFTER `description`;
```

**Tipo de datos**: `DECIMAL(10, 2)` (números hasta 99,999,999.99 con 2 decimales)

## Validaciones Recomendadas en Frontend

```javascript
// Validar que estimated_price sea un número positivo
if (estimated_price !== null && estimated_price !== undefined) {
  if (typeof estimated_price !== 'number' || estimated_price < 0) {
    throw new Error('El precio estimado debe ser un número positivo');
  }
}
```

## Notas Importantes

- El campo `estimated_price` es **opcional** (puede ser NULL)
- Los servicios existentes tendrán `estimated_price: null` hasta que se actualicen
- No es obligatorio proporcionar un precio estimado, pero es recomendable para servicios nuevos

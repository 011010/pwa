# API de Equipment Output (Home Office) - Documentación

## Resumen

Se ha implementado un sistema completo de gestión de equipment outputs (home office) en la API REST del sistema RAIS. Esta implementación permite que sistemas externos consuman y gestionen las asignaciones de equipos que los empleados llevan a casa para trabajo remoto.

## Tabla de Base de Datos

### equipment_output

Esta tabla ya existía en el sistema legacy y ahora está disponible a través de la API.

#### Esquema de Tabla
```sql
id                          BIGINT (PK)
equipment_inventory_id      INTEGER (FK) -> equipment_inventories.id
employee_id                 INTEGER (FK) -> employees.id
output_comments             VARCHAR(350) NOT NULL
input_comments              VARCHAR(350) NULL
output_date                 TIMESTAMP NOT NULL
output_photo                VARCHAR(500) NULL      -- Foto al momento de salida
input_date                  TIMESTAMP NULL
input_photo                 VARCHAR(500) NULL      -- Foto al momento de devolución
input_signature             TEXT NULL              -- Firma del empleado al devolver
created_at                  TIMESTAMP
updated_at                  TIMESTAMP
```

**Conceptos clave:**
- `output_date` y `output_comments`: Cuando el equipo sale (empleado lo lleva a casa)
- `output_photo`: Foto del equipo al momento de la salida (base64)
- `input_date` e `input_comments`: Cuando el equipo regresa (empleado lo devuelve)
- `input_photo`: Foto del equipo al momento de la devolución (base64)
- `input_signature`: Firma digital del empleado al devolver el equipo (base64)
- Si `input_date` es NULL, el equipo está activo (no devuelto)
- Si `input_date` tiene valor, el equipo fue devuelto

## Modelo Eloquent

### EquipmentOutput Model

**Ubicación:** `app/Models/EquipmentOutput.php`

**Relaciones agregadas:**
```php
public function equipment() // belongsTo EquipmentInventory
public function employee() // belongsTo Employee
```

**Accessors:**
- `employee_name` - Nombre completo del empleado

## API Resource

### EquipmentOutputResource

**Ubicación:** `app/Http/Resources/EquipmentOutputResource.php`

Transforma los datos del modelo en un formato estructurado para la API, incluyendo:
- Información del equipment output
- Datos completos del equipo (serial, nombre, modelo, tipo, etc.)
- Datos completos del empleado (nombre, email, departamento, posición)
- Estado activo/devuelto
- Metadatos de auditoría

## API Endpoints

### Formato de Respuesta

Todos los endpoints siguen el formato estándar de la API RAIS:

**Respuesta Exitosa:**
```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": { ... }
}
```

**Respuesta de Error:**
```json
{
  "success": false,
  "message": "Mensaje de error",
  "errors": { ... }
}
```

### 1. Listar Equipment Outputs (con paginación y filtros)

```http
GET /api/v1/equipment-outputs
Authorization: Bearer {token}
```

**Query Parameters (Filtros opcionales):**
- `per_page` (integer, min: 1, max: 100) - Elementos por página (default: 15)
- `page` (integer, min: 1) - Número de página
- `employee_id` (integer) - Filtrar por ID de empleado
- `equipment_id` (integer) - Filtrar por ID de equipo
- `email` (string) - Filtrar por email de empleado
- `date_from` (date, Y-m-d) - Outputs desde esta fecha
- `date_to` (date, Y-m-d) - Outputs hasta esta fecha
- `is_active` (boolean) - true: solo activos, false: solo devueltos
- `search` (string, max: 255) - Búsqueda en nombre empleado, serial, modelo

**Ejemplo de Request:**
```http
GET /api/v1/equipment-outputs?employee_id=5&is_active=true&per_page=20
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Ejemplo de Response (200 OK):**
```json
{
  "success": true,
  "message": "Equipment outputs retrieved successfully",
  "data": [
    {
      "id": 1,
      "equipment_inventory_id": 123,
      "employee_id": 5,
      "employee_name": "Juan Pérez García",
      "output_date": "2025-11-01 09:00:00",
      "output_comments": "Equipo enviado para home office temporal",
      "input_date": null,
      "input_comments": null,
      "is_active": true,
      "equipment": {
        "id": 123,
        "serial_number": "SN12345ABC",
        "name": "Laptop Dell",
        "model": "Latitude 5520",
        "brand": "Dell",
        "type": "LAPTOP",
        "type_description": "Laptop/Notebook",
        "status": "ACTIV",
        "description": "Laptop corporativa"
      },
      "employee": {
        "id": 5,
        "name": "Juan",
        "lastnames": "Pérez García",
        "full_name": "Juan Pérez García",
        "email": "juan.perez@company.com",
        "department": "IT",
        "position": "Developer"
      },
      "metadata": {
        "created_at": "2025-11-01 08:55:00",
        "updated_at": "2025-11-01 08:55:00"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 3,
    "per_page": 15,
    "to": 15,
    "total": 42
  },
  "links": {
    "first": "http://localhost/api/v1/equipment-outputs?page=1",
    "last": "http://localhost/api/v1/equipment-outputs?page=3",
    "prev": null,
    "next": "http://localhost/api/v1/equipment-outputs?page=2"
  }
}
```

### 2. Obtener un Equipment Output específico

```http
GET /api/v1/equipment-outputs/{id}
Authorization: Bearer {token}
```

**Path Parameters:**
- `id` (integer, required) - ID del equipment output

**Ejemplo de Request:**
```http
GET /api/v1/equipment-outputs/1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Ejemplo de Response (200 OK):**
```json
{
  "success": true,
  "message": "Equipment output retrieved successfully",
  "data": {
    "id": 1,
    "equipment_inventory_id": 123,
    "employee_id": 5,
    "employee_name": "Juan Pérez García",
    "output_date": "2025-11-01 09:00:00",
    "output_comments": "Equipo enviado para home office temporal",
    "input_date": null,
    "input_comments": null,
    "is_active": true,
    "equipment": {
      "id": 123,
      "serial_number": "SN12345ABC",
      "name": "Laptop Dell",
      "model": "Latitude 5520",
      "brand": "Dell",
      "type": "LAPTOP",
      "type_description": "Laptop/Notebook",
      "status": "ACTIV",
      "description": "Laptop corporativa"
    },
    "employee": {
      "id": 5,
      "name": "Juan",
      "lastnames": "Pérez García",
      "full_name": "Juan Pérez García",
      "email": "juan.perez@company.com",
      "department": "IT",
      "position": "Developer"
    },
    "metadata": {
      "created_at": "2025-11-01 08:55:00",
      "updated_at": "2025-11-01 08:55:00"
    }
  }
}
```

**Errores posibles:**
- `404 Not Found` - Equipment output no encontrado

### 3. Crear un nuevo Equipment Output (Asignar equipo para home office)

```http
POST /api/v1/equipment-outputs
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "equipment_inventory_id": 123,
  "employee_id": 5,
  "output_comments": "Equipo enviado para home office temporal por COVID-19",
  "output_date": "2025-11-01 09:00:00",
  "output_photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

**Validaciones:**
- `equipment_inventory_id` - required, integer, debe existir en equipment_inventories
- `employee_id` - required, integer, debe existir en employees
- `output_comments` - required, string, max: 350 caracteres
- `output_date` - required, date válido
- `output_photo` - optional, string (base64 encoded image)

**Ejemplo de Response (201 Created):**
```json
{
  "success": true,
  "message": "Equipment output created successfully",
  "data": {
    "id": 15,
    "equipment_inventory_id": 123,
    "employee_id": 5,
    "employee_name": "Juan Pérez García",
    "output_date": "2025-11-01 09:00:00",
    "output_comments": "Equipo enviado para home office temporal por COVID-19",
    "input_date": null,
    "input_comments": null,
    "is_active": true,
    "equipment": { ... },
    "employee": { ... },
    "metadata": { ... }
  }
}
```

**Errores posibles:**
- `422 Unprocessable Entity` - Errores de validación

### 4. Actualizar Equipment Output (Marcar como devuelto)

```http
PUT /api/v1/equipment-outputs/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Parameters:**
- `id` (integer, required) - ID del equipment output a actualizar

**Request Body:**
```json
{
  "input_comments": "Equipo devuelto en buen estado, fin de home office",
  "input_date": "2025-11-15 14:30:00",
  "input_photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "input_signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
}
```

**Validaciones:**
- `input_comments` - required, string, max: 350 caracteres
- `input_date` - required, date válido
- `input_photo` - optional, string (base64 encoded image of equipment at return)
- `input_signature` - optional, string (base64 encoded signature image)

**Ejemplo de Response (200 OK):**
```json
{
  "success": true,
  "message": "Equipment output updated successfully (marked as returned)",
  "data": {
    "id": 15,
    "equipment_inventory_id": 123,
    "employee_id": 5,
    "employee_name": "Juan Pérez García",
    "output_date": "2025-11-01 09:00:00",
    "output_comments": "Equipo enviado para home office temporal",
    "input_date": "2025-11-15 14:30:00",
    "input_comments": "Equipo devuelto en buen estado, fin de home office",
    "is_active": false,
    "equipment": { ... },
    "employee": { ... },
    "metadata": { ... }
  }
}
```

**Errores posibles:**
- `404 Not Found` - Equipment output no encontrado
- `400 Bad Request` - El equipo ya fue devuelto
- `422 Unprocessable Entity` - Errores de validación

### 5. Obtener Equipment Outputs activos por empleado

```http
GET /api/v1/employees/{employeeId}/active-equipment-outputs
Authorization: Bearer {token}
```

**Path Parameters:**
- `employeeId` (integer, required) - ID del empleado

**Ejemplo de Request:**
```http
GET /api/v1/employees/5/active-equipment-outputs
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Ejemplo de Response (200 OK):**
```json
{
  "success": true,
  "message": "Active equipment outputs retrieved successfully",
  "data": [
    {
      "id": 1,
      "equipment_inventory_id": 123,
      "employee_id": 5,
      "employee_name": "Juan Pérez García",
      "output_date": "2025-11-01 09:00:00",
      "output_comments": "Laptop para home office",
      "input_date": null,
      "input_comments": null,
      "is_active": true,
      "equipment": { ... },
      "employee": { ... },
      "metadata": { ... }
    },
    {
      "id": 8,
      "equipment_inventory_id": 456,
      "employee_id": 5,
      "employee_name": "Juan Pérez García",
      "output_date": "2025-11-10 10:00:00",
      "output_comments": "Monitor adicional para casa",
      "input_date": null,
      "input_comments": null,
      "is_active": true,
      "equipment": { ... },
      "employee": { ... },
      "metadata": { ... }
    }
  ],
  "meta": {
    "total": 2,
    "employee_id": 5
  }
}
```

### 6. Obtener estadísticas de Equipment Outputs

```http
GET /api/v1/equipment-outputs-stats
Authorization: Bearer {token}
```

**Query Parameters (Filtros opcionales):**
- Los mismos filtros que el endpoint de listado (employee_id, equipment_id, email, date_from, date_to)

**Ejemplo de Request:**
```http
GET /api/v1/equipment-outputs-stats?employee_id=5
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Ejemplo de Response (200 OK):**
```json
{
  "success": true,
  "message": "Equipment output statistics retrieved successfully",
  "data": {
    "total_outputs": 25,
    "active_outputs": 8,
    "returned_outputs": 17
  }
}
```

## Casos de Uso

### Caso 1: Obtener todo el equipo activo en home office de un empleado

**Request:**
```http
GET /api/v1/employees/5/active-equipment-outputs
Authorization: Bearer {token}
```

O usando el endpoint de listado:
```http
GET /api/v1/equipment-outputs?employee_id=5&is_active=true
Authorization: Bearer {token}
```

### Caso 2: Registrar que un empleado se lleva un equipo a casa

**Request:**
```http
POST /api/v1/equipment-outputs
Authorization: Bearer {token}
Content-Type: application/json

{
  "equipment_inventory_id": 123,
  "employee_id": 5,
  "output_comments": "Home office autorizado por gerencia",
  "output_date": "2025-11-18"
}
```

### Caso 3: Marcar equipo como devuelto

**Request:**
```http
PUT /api/v1/equipment-outputs/15
Authorization: Bearer {token}
Content-Type: application/json

{
  "input_comments": "Equipo devuelto en perfecto estado",
  "input_date": "2025-11-20"
}
```

### Caso 4: Buscar equipos en home office por serial number

**Request:**
```http
GET /api/v1/equipment-outputs?search=SN12345&is_active=true
Authorization: Bearer {token}
```

### Caso 5: Obtener historial de home office de un equipo

**Request:**
```http
GET /api/v1/equipment-outputs?equipment_id=123
Authorization: Bearer {token}
```

### Caso 6: Ver estadísticas de home office por rango de fechas

**Request:**
```http
GET /api/v1/equipment-outputs-stats?date_from=2025-11-01&date_to=2025-11-30
Authorization: Bearer {token}
```

## Códigos de Respuesta HTTP

- `200 OK` - Operación exitosa (GET, PUT)
- `201 Created` - Recurso creado exitosamente (POST)
- `400 Bad Request` - Request inválido o regla de negocio violada
- `401 Unauthorized` - Token de autenticación inválido o ausente
- `404 Not Found` - Recurso no encontrado
- `422 Unprocessable Entity` - Errores de validación
- `500 Internal Server Error` - Error del servidor

## Autenticación

Todos los endpoints requieren autenticación mediante Laravel Sanctum. El token debe ser incluido en el header `Authorization`:

```http
Authorization: Bearer {token}
```

Para obtener un token, usar el endpoint de login:

```http
POST /api/v1/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

## Notas de Implementación

### Archivos Creados/Modificados

**Nuevos archivos:**
- `app/Http/Controllers/Api/EquipmentOutputController.php` - Controlador API
- `app/Http/Resources/EquipmentOutputResource.php` - Resource para transformación de datos
- `docs/API_EQUIPMENT_OUTPUT.md` - Esta documentación

**Archivos modificados:**
- `app/Models/EquipmentOutput.php` - Agregadas relaciones `equipment()` y `employee()`
- `routes/api.php` - Agregadas rutas de API

### Relaciones del Modelo

El modelo `EquipmentOutput` ahora incluye:
- `equipment()` - Relación con `EquipmentInventory` (con `latestName` y `type_desc`)
- `employee()` - Relación con `Employee`

Estas relaciones permiten eager loading para optimización de queries y prevenir problemas N+1.

### Consideraciones de Seguridad

- Todos los endpoints requieren autenticación con token Sanctum
- Validación de entrada en todos los POST/PUT
- Logs de errores para auditoría
- Los tokens deben ser almacenados de forma segura por el cliente

### Performance

- Uso de eager loading para prevenir queries N+1
- Paginación implementada en endpoint de listado
- Filtros optimizados con índices de base de datos existentes
- Límite de 100 elementos por página para prevenir sobrecarga

## Testing

Para probar los endpoints puedes usar:
- Postman (importar colecciones de `docs/api-collections/`)
- cURL
- Insomnia
- Thunder Client (VSCode extension)

**Ejemplo con cURL:**
```bash
# Login
curl -X POST http://localhost/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Listar equipment outputs
curl -X GET "http://localhost/api/v1/equipment-outputs?is_active=true" \
  -H "Authorization: Bearer {token}"

# Crear equipment output
curl -X POST http://localhost/api/v1/equipment-outputs \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "equipment_inventory_id": 123,
    "employee_id": 5,
    "output_comments": "Home office",
    "output_date": "2025-11-18"
  }'
```

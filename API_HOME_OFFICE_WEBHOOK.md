# API de Home Office Webhook - Documentación

## Resumen

Este documento describe los endpoints webhook para integrar el sistema RAIS con sistemas externos de HR que gestionan solicitudes de home office. Cuando HR aprueba o rechaza una solicitud de home office, el sistema externo puede notificar a RAIS para actualizar automáticamente el estado del empleado.

## Flujo de Integración

```
┌─────────────────┐     POST webhook      ┌─────────────────┐
│  Sistema HR     │ ──────────────────►   │     RAIS        │
│  (Externo)      │   status: Approved HR │                 │
└─────────────────┘                       └─────────────────┘
                                                  │
                                                  ▼
                                          employees.home_office = 1
```

## Base URL

```
http://your-domain.com/api/v1
```

## Autenticación

Todos los endpoints requieren autenticación mediante Laravel Sanctum:

```
Authorization: Bearer {token}
```

## Endpoints

### 1. Webhook de Estado de Home Office

Recibe notificaciones del sistema HR cuando cambia el estado de una solicitud de home office.

```http
POST /api/v1/webhooks/home-office-status
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| employee_id | integer | Condicional* | ID del empleado en RAIS |
| email | string | Condicional* | Email del empleado |
| status | string | Sí | Estado de la solicitud |
| request_id | integer | No | ID de la solicitud en sistema HR |
| approved_at | datetime | No | Fecha/hora de aprobación |
| approved_by | string | No | Nombre de quien aprobó |

*Se requiere `employee_id` O `email` (al menos uno)

**Valores válidos de status:**

| Status | Acción en RAIS |
|--------|----------------|
| `Pending` | Sin acción |
| `Approved Manager` | Sin acción |
| `Approved HR` | **Activa home_office = 1** |
| `Approved CEO` | **Activa home_office = 1** |
| `Declined Manager` | **Desactiva home_office = 0** |
| `Declined HR` | **Desactiva home_office = 0** |
| `Declined CEO` | **Desactiva home_office = 0** |
| `Cancelled` | **Desactiva home_office = 0** |

**Ejemplo de Request (Aprobación HR):**

```bash
curl -X POST "http://your-domain.com/api/v1/webhooks/home-office-status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 5,
    "status": "Approved HR",
    "request_id": 123,
    "approved_at": "2025-11-21 10:30:00",
    "approved_by": "Jane Smith (HR Manager)"
  }'
```

**Ejemplo de Request (por email):**

```bash
curl -X POST "http://your-domain.com/api/v1/webhooks/home-office-status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "status": "Approved HR"
  }'
```

**Response Exitosa (200 OK):**

```json
{
  "success": true,
  "message": "Home office status activated successfully",
  "data": {
    "employee_id": 5,
    "email": "john.doe@company.com",
    "home_office": 1,
    "previous_status": 0,
    "status_received": "Approved HR"
  }
}
```

**Response - Empleado No Encontrado (404):**

```json
{
  "success": false,
  "message": "Employee not found"
}
```

**Response - Error de Validación (422):**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "status": ["The status field is required."]
  }
}
```

---

### 2. Consultar Estado de Home Office

Permite consultar el estado actual de home office de un empleado.

```http
GET /api/v1/employees/home-office-status
Authorization: Bearer {token}
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| employee_id | integer | Condicional* | ID del empleado |
| email | string | Condicional* | Email del empleado |

*Se requiere `employee_id` O `email` (al menos uno)

**Ejemplo de Request:**

```bash
curl -X GET "http://your-domain.com/api/v1/employees/home-office-status?employee_id=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response Exitosa (200 OK):**

```json
{
  "success": true,
  "message": "Employee home office status retrieved successfully",
  "data": {
    "employee_id": 5,
    "name": "John Doe García",
    "email": "john.doe@company.com",
    "home_office": 1,
    "home_office_active": true
  }
}
```

---

## Casos de Uso

### Caso 1: HR aprueba solicitud de home office

1. Empleado solicita home office en sistema HR
2. Manager aprueba → Status: "Approved Manager"
3. HR aprueba → Status: "Approved HR"
4. Sistema HR envía webhook a RAIS:

```json
{
  "employee_id": 5,
  "status": "Approved HR",
  "request_id": 456,
  "approved_at": "2025-11-21 14:00:00",
  "approved_by": "HR Manager"
}
```

5. RAIS actualiza `employees.home_office = 1`

### Caso 2: Empleado cancela su solicitud

```json
{
  "email": "john.doe@company.com",
  "status": "Cancelled",
  "request_id": 456
}
```

RAIS actualiza `employees.home_office = 0`

### Caso 3: Verificar estado antes de asignar equipo

Antes de registrar una salida de equipo para home office, el sistema puede verificar si el empleado tiene home office activo:

```bash
GET /api/v1/employees/home-office-status?employee_id=5
```

---

## Integración con Equipment Output

Una vez que el empleado tiene `home_office = 1`, se puede registrar la salida de equipo:

```bash
POST /api/v1/equipment-outputs
{
  "equipment_inventory_id": 123,
  "employee_id": 5,
  "output_comments": "Laptop para home office autorizado por HR",
  "output_date": "2025-11-21",
  "output_photo": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

---

## Códigos de Respuesta HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Operación exitosa |
| 401 | No autenticado |
| 404 | Empleado no encontrado |
| 422 | Error de validación |
| 500 | Error del servidor |

---

## Logs

Todas las operaciones del webhook se registran en los logs de Laravel:

```
[INFO] Home office activated for employee {"employee_id":5,"email":"john@company.com","status":"Approved HR"}
[INFO] Home office deactivated for employee {"employee_id":5,"status":"Cancelled"}
```

---

## Seguridad

1. **Autenticación requerida**: Todos los endpoints requieren token Sanctum válido
2. **Validación de entrada**: Todos los parámetros son validados
3. **Logs de auditoría**: Todas las operaciones quedan registradas
4. **Rate limiting**: Se aplica rate limiting estándar de Laravel

---

## Archivos Relacionados

- **Controller:** `app/Http/Controllers/Api/HomeOfficeWebhookController.php`
- **Routes:** `routes/api.php`
- **Model:** `app/Models/Employee.php` (campo `home_office`)
- **Tests:** `tests/Feature/Api/HomeOfficeWebhookTest.php`

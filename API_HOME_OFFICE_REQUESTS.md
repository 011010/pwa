# API Home Office Requests - Estructura Propuesta

**Por favor revisar y actualizar con la documentación real**

## Endpoints

### 1. Obtener requests del empleado actual
```
GET /home-office/requests
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_id": 123,
      "employee_name": "Juan Pérez",
      "employee_email": "juan@example.com",
      "status": "approved", // pending, approved, rejected
      "start_date": "2025-11-25",
      "end_date": "2025-12-15",
      "reason": "Trabajo remoto por proyecto",
      "requested_at": "2025-11-20T10:00:00Z",
      "approved_at": "2025-11-21T14:30:00Z",
      "approved_by": "Admin Name",
      "equipment_selected": false, // true si ya seleccionó equipos
      "equipment_count": 0, // número de equipos seleccionados
      "created_at": "2025-11-20T10:00:00Z",
      "updated_at": "2025-11-21T14:30:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "current_page": 1,
    "per_page": 20
  }
}
```

### 2. Obtener request específico
```
GET /home-office/requests/:id
```

### 3. Crear nuevo request
```
POST /home-office/requests
```

**Body:**
```json
{
  "start_date": "2025-11-25",
  "end_date": "2025-12-15",
  "reason": "Trabajo remoto por proyecto"
}
```

### 4. Seleccionar equipos para request aprobado
```
POST /home-office/requests/:id/select-equipment
```

**Body:**
```json
{
  "equipment_ids": [1, 2, 3],
  "output_date": "2025-11-25",
  "comments": "Equipos para home office"
}
```

### 5. Subir foto de equipo
```
POST /home-office/requests/:id/equipment/:equipment_id/photos
```

**Body (multipart/form-data):**
```
photo: [file]
type: "output" | "input"
comments: "Estado del equipo"
```

## Estados de Request

- **pending**: Solicitud enviada, esperando aprobación
- **approved**: Solicitud aprobada, puede seleccionar equipos
- **rejected**: Solicitud rechazada
- **active**: Request con equipos seleccionados y en curso
- **completed**: Request finalizado, equipos devueltos

---

**IMPORTANTE:** Esta es una estructura propuesta.
Por favor actualiza este archivo con la documentación real de la API.

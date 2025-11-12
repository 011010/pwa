# API de Fotos y Firmas - Documentación

## Resumen

Se ha implementado un sistema completo de gestión de fotos y firmas para Assets y Equipment Assignments en la API REST del sistema RAIS. Esta implementación permite que sistemas externos consuman y gestionen fotos y firmas asociadas a activos y asignaciones de equipos.

## Estructura de Base de Datos

### Tablas Creadas

Se han creado 4 nuevas tablas mediante migraciones:

1. **asset_photos** - Fotos de assets (sistema Filament)
2. **asset_signatures** - Firmas de assets
3. **assignment_photos** - Fotos de asignaciones de equipos (sistema legacy)
4. **assignment_signatures** - Firmas de asignaciones de equipos

### Esquema de Tablas

#### asset_photos / assignment_photos
```sql
id                  BIGINT (PK)
asset_id            BIGINT (FK) / assignment_id BIGINT (FK)
url                 VARCHAR(500)
filename            VARCHAR
mime_type           VARCHAR(50)
file_size           INTEGER (bytes)
uploaded_at         TIMESTAMP
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

#### asset_signatures / assignment_signatures
```sql
id                  BIGINT (PK)
asset_id            BIGINT (FK) / assignment_id BIGINT (FK)
url                 VARCHAR(500)
filename            VARCHAR
signed_by           VARCHAR(255)
signed_at           TIMESTAMP
action              VARCHAR(50) - received, delivered, transferred, returned, maintenance, inspection
notes               TEXT
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

## Modelos Eloquent

### Modelos Creados
- `App\Models\AssetPhoto`
- `App\Models\AssetSignature`
- `App\Models\AssignmentPhoto`
- `App\Models\AssignmentSignature`

### Relaciones Agregadas

**Asset Model** (app/Models/Asset.php):
```php
public function photos() // hasMany AssetPhoto
public function signatures() // hasMany AssetSignature
```

**Assignment Model** (app/Models/Assignment.php):
```php
public function photos() // hasMany AssignmentPhoto
public function signatures() // hasMany AssignmentSignature
```

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
  "errors": { ... } // opcional
}
```

### Assets - Fotos

#### Obtener todas las fotos de un asset
```http
GET /api/v1/assets/{assetId}/photos
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Asset photos retrieved successfully",
  "data": [
    {
      "id": 1,
      "asset_id": 123,
      "url": "/storage/assets/photos/1699999999_photo.jpg",
      "filename": "1699999999_photo.jpg",
      "mime_type": "image/jpeg",
      "file_size": 245678,
      "uploaded_at": "2025-11-12T10:30:00Z",
      "created_at": "2025-11-12T10:30:00Z"
    }
  ]
}
```

#### Subir una foto
```http
POST /api/v1/assets/{assetId}/photos
Authorization: Bearer {token}
Content-Type: multipart/form-data

photo: [file] (required, image, max: 10MB, types: jpeg,jpg,png,gif)
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Photo uploaded successfully",
  "data": {
    "id": 1,
    "asset_id": 123,
    "url": "/storage/assets/photos/1699999999_photo.jpg",
    "filename": "1699999999_photo.jpg",
    "mime_type": "image/jpeg",
    "file_size": 245678,
    "uploaded_at": "2025-11-12T10:30:00Z",
    "created_at": "2025-11-12T10:30:00Z"
  }
}
```

#### Eliminar una foto
```http
DELETE /api/v1/assets/{assetId}/photos/{photoId}
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

### Assets - Firmas

#### Obtener todas las firmas de un asset
```http
GET /api/v1/assets/{assetId}/signatures
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Asset signatures retrieved successfully",
  "data": [
    {
      "id": 1,
      "asset_id": 123,
      "url": "/storage/assets/signatures/signature_1699999999_abc123.png",
      "filename": "signature_1699999999_abc123.png",
      "signed_by": "Juan Pérez",
      "signed_at": "2025-11-12T10:30:00Z",
      "action": "received",
      "notes": "Asset received in good condition",
      "created_at": "2025-11-12T10:30:00Z"
    }
  ]
}
```

#### Crear una firma
```http
POST /api/v1/assets/{assetId}/signatures
Authorization: Bearer {token}
Content-Type: application/json

{
  "signature": "data:image/png;base64,iVBORw0KG..." // Base64 encoded image OR file upload
  "signed_by": "Juan Pérez", // required, max: 255
  "signed_at": "2025-11-12T10:30:00Z", // required, date format
  "action": "received", // required, enum: received, delivered, transferred, returned, maintenance, inspection
  "notes": "Asset received in good condition" // optional, max: 1000
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Signature saved successfully",
  "data": {
    "id": 1,
    "asset_id": 123,
    "url": "/storage/assets/signatures/signature_1699999999_abc123.png",
    "filename": "signature_1699999999_abc123.png",
    "signed_by": "Juan Pérez",
    "signed_at": "2025-11-12T10:30:00Z",
    "action": "received",
    "notes": "Asset received in good condition",
    "created_at": "2025-11-12T10:30:00Z"
  }
}
```

#### Eliminar una firma
```http
DELETE /api/v1/assets/{assetId}/signatures/{signatureId}
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Signature deleted successfully"
}
```

### Equipment Assignments - Fotos

#### Obtener todas las fotos de una asignación
```http
GET /api/v1/equipment-assignments/{assignmentId}/photos
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Assignment photos retrieved successfully",
  "data": [
    {
      "id": 1,
      "assignment_id": 456,
      "url": "/storage/assignments/photos/1699999999_photo.jpg",
      "filename": "1699999999_photo.jpg",
      "mime_type": "image/jpeg",
      "file_size": 245678,
      "uploaded_at": "2025-11-12T10:30:00Z",
      "created_at": "2025-11-12T10:30:00Z"
    }
  ]
}
```

#### Subir una foto
```http
POST /api/v1/equipment-assignments/{assignmentId}/photos
Authorization: Bearer {token}
Content-Type: multipart/form-data

photo: [file] (required, image, max: 10MB, types: jpeg,jpg,png,gif)
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Photo uploaded successfully",
  "data": {
    "id": 1,
    "assignment_id": 456,
    "url": "/storage/assignments/photos/1699999999_photo.jpg",
    "filename": "1699999999_photo.jpg",
    "mime_type": "image/jpeg",
    "file_size": 245678,
    "uploaded_at": "2025-11-12T10:30:00Z",
    "created_at": "2025-11-12T10:30:00Z"
  }
}
```

#### Eliminar una foto
```http
DELETE /api/v1/equipment-assignments/{assignmentId}/photos/{photoId}
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

### Equipment Assignments - Firmas

#### Obtener todas las firmas de una asignación
```http
GET /api/v1/equipment-assignments/{assignmentId}/signatures
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Assignment signatures retrieved successfully",
  "data": [
    {
      "id": 1,
      "assignment_id": 456,
      "url": "/storage/assignments/signatures/signature_1699999999_abc123.png",
      "filename": "signature_1699999999_abc123.png",
      "signed_by": "María García",
      "signed_at": "2025-11-12T10:30:00Z",
      "action": "received",
      "notes": "Equipment received in good condition",
      "created_at": "2025-11-12T10:30:00Z"
    }
  ]
}
```

#### Crear una firma
```http
POST /api/v1/equipment-assignments/{assignmentId}/signatures
Authorization: Bearer {token}
Content-Type: application/json

{
  "signature": "data:image/png;base64,iVBORw0KG..." // Base64 encoded image OR file upload
  "signed_by": "María García", // required, max: 255
  "signed_at": "2025-11-12T10:30:00Z", // required, date format
  "action": "received", // required, enum: received, delivered, transferred, returned, maintenance, inspection
  "notes": "Equipment received in good condition" // optional, max: 1000
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Signature saved successfully",
  "data": {
    "id": 1,
    "assignment_id": 456,
    "url": "/storage/assignments/signatures/signature_1699999999_abc123.png",
    "filename": "signature_1699999999_abc123.png",
    "signed_by": "María García",
    "signed_at": "2025-11-12T10:30:00Z",
    "action": "received",
    "notes": "Equipment received in good condition",
    "created_at": "2025-11-12T10:30:00Z"
  }
}
```

#### Eliminar una firma
```http
DELETE /api/v1/equipment-assignments/{assignmentId}/signatures/{signatureId}
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Signature deleted successfully"
}
```

## Códigos de Estado HTTP

- **200 OK** - Operación exitosa (GET, DELETE)
- **201 Created** - Recurso creado exitosamente (POST)
- **404 Not Found** - Recurso no encontrado
- **422 Unprocessable Entity** - Error de validación
- **500 Internal Server Error** - Error del servidor

## Validaciones

### Fotos
- **Tipo:** Archivo de imagen
- **Formatos:** JPEG, JPG, PNG, GIF
- **Tamaño máximo:** 10MB (10240KB)

### Firmas
- **signature:** String (Base64) o archivo de imagen
- **signed_by:** String requerido, máximo 255 caracteres
- **signed_at:** Fecha requerida (formato ISO 8601)
- **action:** Enum requerido con valores: received, delivered, transferred, returned, maintenance, inspection
- **notes:** String opcional, máximo 1000 caracteres

## Almacenamiento de Archivos

### Directorios
- **Assets Photos:** `storage/app/public/assets/photos/`
- **Assets Signatures:** `storage/app/public/assets/signatures/`
- **Assignments Photos:** `storage/app/public/assignments/photos/`
- **Assignments Signatures:** `storage/app/public/assignments/signatures/`

### URLs Públicas
Las URLs se generan automáticamente usando `Storage::url()` y tienen el formato:
```
/storage/assets/photos/{filename}
/storage/assets/signatures/{filename}
/storage/assignments/photos/{filename}
/storage/assignments/signatures/{filename}
```

## Seguridad

- Todos los endpoints requieren autenticación mediante Laravel Sanctum (`auth:sanctum` middleware)
- Los archivos se eliminan automáticamente del storage cuando se elimina el registro de la base de datos
- Las relaciones de base de datos tienen `CASCADE ON DELETE` para mantener la integridad referencial

## Migraciones a Ejecutar

Para implementar esta funcionalidad en el entorno, ejecutar:

```bash
./vendor/bin/sail artisan migrate
```

Esto creará las 4 tablas necesarias:
1. `2025_11_12_000001_create_asset_photos_table`
2. `2025_11_12_000002_create_asset_signatures_table`
3. `2025_11_12_000003_create_assignment_photos_table`
4. `2025_11_12_000004_create_assignment_signatures_table`

## Archivos Creados/Modificados

### Migraciones (Nuevas)
- `database/migrations/2025_11_12_000001_create_asset_photos_table.php`
- `database/migrations/2025_11_12_000002_create_asset_signatures_table.php`
- `database/migrations/2025_11_12_000003_create_assignment_photos_table.php`
- `database/migrations/2025_11_12_000004_create_assignment_signatures_table.php`

### Modelos (Nuevos)
- `app/Models/AssetPhoto.php`
- `app/Models/AssetSignature.php`
- `app/Models/AssignmentPhoto.php`
- `app/Models/AssignmentSignature.php`

### Modelos (Modificados)
- `app/Models/Asset.php` - Agregadas relaciones `photos()` y `signatures()`
- `app/Models/Assignment.php` - Agregadas relaciones `photos()` y `signatures()`

### API Resources (Nuevos)
- `app/Http/Resources/AssetPhotoResource.php`
- `app/Http/Resources/AssetSignatureResource.php`
- `app/Http/Resources/AssignmentPhotoResource.php`
- `app/Http/Resources/AssignmentSignatureResource.php`

### Controladores (Nuevos)
- `app/Http/Controllers/Api/AssetPhotoController.php`
- `app/Http/Controllers/Api/AssetSignatureController.php`
- `app/Http/Controllers/Api/AssignmentPhotoController.php`
- `app/Http/Controllers/Api/AssignmentSignatureController.php`

### Rutas (Modificadas)
- `routes/api.php` - Agregadas 12 nuevas rutas para fotos y firmas

## Ejemplos de Uso con cURL

### Subir una foto a un asset
```bash
curl -X POST https://tuservidor.com/api/v1/assets/123/photos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@/path/to/photo.jpg"
```

### Crear una firma con Base64
```bash
curl -X POST https://tuservidor.com/api/v1/assets/123/signatures \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "signature": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "signed_by": "Juan Pérez",
    "signed_at": "2025-11-12T10:30:00Z",
    "action": "received",
    "notes": "Asset received in good condition"
  }'
```

### Obtener fotos de una asignación
```bash
curl -X GET https://tuservidor.com/api/v1/equipment-assignments/456/photos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Eliminar una firma
```bash
curl -X DELETE https://tuservidor.com/api/v1/assets/123/signatures/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notas Importantes

1. **Storage Link:** Asegurarse de que el symbolic link de storage esté creado:
   ```bash
   ./vendor/bin/sail artisan storage:link
   ```

2. **Permisos:** Los directorios de storage deben tener permisos de escritura apropiados.

3. **Formato de Firmas:** El campo `signature` acepta tanto:
   - Imágenes Base64 con el formato: `data:image/{type};base64,{data}`
   - Archivos de imagen mediante multipart/form-data

4. **Cascade Delete:** Al eliminar un Asset o Assignment, todas las fotos y firmas asociadas se eliminan automáticamente (tanto en BD como en storage).

5. **Logging:** Todos los errores se registran en los logs de Laravel para debugging.

## Próximos Pasos Recomendados

1. Crear tests unitarios y de integración para los nuevos endpoints
2. Agregar rate limiting específico para endpoints de upload
3. Implementar compresión automática de imágenes
4. Agregar thumbnails para las fotos
5. Implementar paginación para las listas de fotos/firmas si crecen mucho
6. Agregar endpoints de actualización (PUT/PATCH) si es necesario
7. Documentar en Postman Collection o similar para el equipo

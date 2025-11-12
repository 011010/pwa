# ITAM API Documentation

## Base URL
```
http://localhost/api/v1
```

## Authentication

The API uses Laravel Sanctum for authentication with Bearer tokens.

### Login

**Endpoint:** `POST /api/v1/login`

**Request Body:**
```json
{
  "email": "admin@filament.local",
  "password": "your_password",
  "device_name": "mobile-app" // optional
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@filament.local",
      "roles": ["super_admin"],
      "permissions": ["view_role", "create_role", ...]
    },
    "token": "1|abcdef123456...",
    "token_type": "Bearer"
  }
}
```

### Logout

**Endpoint:** `POST /api/v1/logout`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Logout All Devices

**Endpoint:** `POST /api/v1/logout-all`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "All tokens revoked successfully"
}
```

### Get Current User

**Endpoint:** `GET /api/v1/user`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@filament.local",
    "roles": ["super_admin"],
    "permissions": ["view_role", "create_role", ...],
    "created_at": "2025-10-23T19:00:00.000000Z"
  }
}
```

---

## Health Check

**Endpoint:** `GET /api/v1/health`

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T19:00:00+00:00",
  "service": "ITAM API"
}
```

---

## Assets API

### List All Assets

**Endpoint:** `GET /api/v1/assets`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number for pagination
- `per_page` (optional): Items per page (default: 15)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "current_page": 1,
    "total": 100
  }
}
```

### Get Single Asset

**Endpoint:** `GET /api/v1/assets/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

### Create Asset

**Endpoint:** `POST /api/v1/assets`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Laptop Dell XPS 15",
  "serial_number": "ABC123456",
  "category_id": 1,
  "status": "available"
}
```

### Update Asset

**Endpoint:** `PUT /api/v1/assets/{id}`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

### Delete Asset

**Endpoint:** `DELETE /api/v1/assets/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

---

## Inventory API

The Inventory API follows the same RESTful pattern as Assets:

- `GET /api/v1/inventory` - List all inventory items
- `GET /api/v1/inventory/{id}` - Get single inventory item
- `POST /api/v1/inventory` - Create inventory item
- `PUT /api/v1/inventory/{id}` - Update inventory item
- `DELETE /api/v1/inventory/{id}` - Delete inventory item

---

## Suppliers API

The Suppliers API follows the same RESTful pattern:

- `GET /api/v1/suppliers` - List all suppliers
- `GET /api/v1/suppliers/{id}` - Get single supplier
- `POST /api/v1/suppliers` - Create supplier
- `PUT /api/v1/suppliers/{id}` - Update supplier
- `DELETE /api/v1/suppliers/{id}` - Delete supplier

---

## Categories API

The Categories API follows the same RESTful pattern:

- `GET /api/v1/categories` - List all categories
- `GET /api/v1/categories/{id}` - Get single category
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/{id}` - Update category
- `DELETE /api/v1/categories/{id}` - Delete category

---

## Equipment Assignments API

The Equipment Assignments API provides access to legacy system equipment assignment data, showing which equipment is assigned to which employees.

### List All Equipment Assignments

**Endpoint:** `GET /api/v1/equipment-assignments`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `per_page` (optional): Items per page, max 100 (default: 15)
- `employee_id` (optional): Filter by specific employee ID
- `equipment_id` (optional): Filter by specific equipment inventory ID
- `date_from` (optional): Filter assignments received on or after this date (format: Y-m-d, e.g., 2025-01-01)
- `date_to` (optional): Filter assignments received on or before this date (format: Y-m-d, e.g., 2025-12-31)
- `status` (optional): Filter by equipment status (ACTIV, MANTC, BAJAS, LIBRE)
- `type` (optional): Filter by equipment type (equipment dictionary key)
- `search` (optional): Search in employee name, equipment serial number, or model
- `include_delivered` (optional): Include returned/delivered assignments (default: false, only shows active assignments)

**Example Request:**
```bash
curl -X GET "http://localhost/api/v1/equipment-assignments?per_page=20&date_from=2025-01-01&search=laptop" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Equipment assignments retrieved successfully",
  "data": [
    {
      "id": 1,
      "equipment": "Laptop - Dell XPS 15",
      "serial_number": "ABC123456",
      "name": "John Doe",
      "model": "XPS 15 9510",
      "received_date": "2025-10-15 10:30:00",
      "comments": "Equipment in good condition, all accessories included",
      "metadata": {
        "equipment_id": 42,
        "employee_id": 15,
        "delivery_date": null,
        "delivery_comments": "",
        "equipment_status": "ACTIV",
        "equipment_type": "LTOP01",
        "equipment_brand": "Dell",
        "employee_department": "IT Department",
        "employee_email": "john.doe@example.com",
        "created_at": "2025-10-15 10:30:00",
        "updated_at": "2025-10-15 10:30:00"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 15,
    "to": 15,
    "total": 73
  },
  "links": {
    "first": "http://localhost/api/v1/equipment-assignments?page=1",
    "last": "http://localhost/api/v1/equipment-assignments?page=5",
    "prev": null,
    "next": "http://localhost/api/v1/equipment-assignments?page=2"
  }
}
```

### Get Single Equipment Assignment

**Endpoint:** `GET /api/v1/equipment-assignments/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Example Request:**
```bash
curl -X GET "http://localhost/api/v1/equipment-assignments/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Equipment assignment retrieved successfully",
  "data": {
    "id": 1,
    "equipment": "Laptop - Dell XPS 15",
    "serial_number": "ABC123456",
    "name": "John Doe",
    "model": "XPS 15 9510",
    "received_date": "2025-10-15 10:30:00",
    "comments": "Equipment in good condition, all accessories included",
    "metadata": {
      "equipment_id": 42,
      "employee_id": 15,
      "delivery_date": null,
      "delivery_comments": "",
      "equipment_status": "ACTIV",
      "equipment_type": "LTOP01",
      "equipment_brand": "Dell",
      "employee_department": "IT Department",
      "employee_email": "john.doe@example.com",
      "created_at": "2025-10-15 10:30:00",
      "updated_at": "2025-10-15 10:30:00"
    }
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Equipment assignment not found"
}
```

### Get Assignment Statistics

**Endpoint:** `GET /api/v1/equipment-assignments-stats`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
Supports the same filter parameters as the list endpoint (employee_id, equipment_id, date_from, date_to, status, type, include_delivered)

**Example Request:**
```bash
curl -X GET "http://localhost/api/v1/equipment-assignments-stats?date_from=2025-01-01" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Assignment statistics retrieved successfully",
  "data": {
    "total_assignments": 150,
    "active_assignments": 120,
    "returned_assignments": 30
  }
}
```

### Field Descriptions

**Core Fields (Required by External Systems):**
- `equipment` - Full equipment name with type description
- `serial_number` - Equipment serial number
- `name` - Full employee name (first + last name)
- `model` - Equipment model
- `received_date` - Date and time when equipment was assigned
- `comments` - Assignment comments/observations (recived_comments field)

**Metadata Fields (Additional Information):**
- `equipment_id` - Equipment inventory ID
- `employee_id` - Employee ID
- `delivery_date` - Date when equipment was returned (null if still active)
- `delivery_comments` - Comments when equipment was returned
- `equipment_status` - Equipment status (ACTIV, MANTC, BAJAS, LIBRE)
- `equipment_type` - Equipment type code
- `equipment_brand` - Equipment manufacturer/brand
- `employee_department` - Employee's department
- `employee_email` - Employee's email address
- `created_at` - Assignment record creation timestamp
- `updated_at` - Assignment record last update timestamp

### Usage Examples

**Get all active laptop assignments:**
```bash
curl -X GET "http://localhost/api/v1/equipment-assignments?type=LTOP01&include_delivered=false" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get assignments for a specific employee:**
```bash
curl -X GET "http://localhost/api/v1/equipment-assignments?employee_id=15" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get assignments within a date range:**
```bash
curl -X GET "http://localhost/api/v1/equipment-assignments?date_from=2025-01-01&date_to=2025-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Search for specific equipment or employee:**
```bash
curl -X GET "http://localhost/api/v1/equipment-assignments?search=John" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get all assignments including returned equipment:**
```bash
curl -X GET "http://localhost/api/v1/equipment-assignments?include_delivered=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Photos and Signatures API

The system supports uploading, retrieving, and deleting photos and signatures for both regular assets and equipment assignments using RESTful endpoints.

### Upload Asset Photo

**Endpoint:** `POST /api/v1/assets/{assetId}/photos`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (form-data):**
- `photo` (required): Image file (max 10MB, formats: jpeg, jpg, png, gif)

**Example Request:**
```bash
curl -X POST "http://localhost/api/v1/assets/123/photos" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "photo=@photo.jpg"
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Photo uploaded successfully",
  "data": {
    "id": 45,
    "asset_id": 123,
    "url": "/storage/assets/photos/1699876543_photo.jpg",
    "filename": "1699876543_photo.jpg",
    "mime_type": "image/jpeg",
    "file_size": 245678,
    "uploaded_at": "2025-11-12T10:30:00Z",
    "created_at": "2025-11-12T10:30:00Z"
  }
}
```

### Upload Asset Signature

**Endpoint:** `POST /api/v1/assets/{assetId}/signatures`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body (JSON):**
```json
{
  "signature": "data:image/png;base64,iVBORw0KG...",
  "signed_by": "Juan Pérez",
  "signed_at": "2025-11-12T10:30:00Z",
  "action": "received",
  "notes": "Asset received in good condition"
}
```

**Action Values:** `received`, `delivered`, `transferred`, `returned`, `maintenance`, `inspection`

**Example Request:**
```bash
curl -X POST "http://localhost/api/v1/assets/123/signatures" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "signature": "data:image/png;base64,iVBORw0KG...",
    "signed_by": "Juan Pérez",
    "signed_at": "2025-11-12T10:30:00Z",
    "action": "received",
    "notes": "Asset received in good condition"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Signature saved successfully",
  "data": {
    "id": 89,
    "asset_id": 123,
    "url": "/storage/assets/signatures/signature_1699876543_abc123.png",
    "filename": "signature_1699876543_abc123.png",
    "signed_by": "Juan Pérez",
    "signed_at": "2025-11-12T10:30:00Z",
    "action": "received",
    "notes": "Asset received in good condition",
    "created_at": "2025-11-12T10:30:00Z"
  }
}
```

### Get Asset Photos

**Endpoint:** `GET /api/v1/assets/{id}/photos`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Asset photos retrieved successfully",
  "data": [
    {
      "id": 45,
      "asset_id": 123,
      "url": "/storage/assets/photos/1699876543_photo.jpg",
      "filename": "1699876543_photo.jpg",
      "mime_type": "image/jpeg",
      "file_size": 245678,
      "uploaded_at": "2025-11-12T10:30:00Z",
      "created_at": "2025-11-12T10:30:00Z"
    }
  ]
}
```

### Delete Asset Photo

**Endpoint:** `DELETE /api/v1/assets/{id}/photos/{photoId}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

### Get Asset Signatures

**Endpoint:** `GET /api/v1/assets/{id}/signatures`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Asset signatures retrieved successfully",
  "data": [
    {
      "id": 89,
      "asset_id": 123,
      "url": "/storage/assets/signatures/signature_1699876543_abc123.png",
      "filename": "signature_1699876543_abc123.png",
      "signed_by": "Juan Pérez",
      "signed_at": "2025-11-12T10:30:00Z",
      "action": "received",
      "notes": "Asset received in good condition",
      "created_at": "2025-11-12T10:30:00Z"
    }
  ]
}
```

### Delete Asset Signature

**Endpoint:** `DELETE /api/v1/assets/{id}/signatures/{signatureId}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Signature deleted successfully"
}
```

### Equipment Assignments - Photos and Signatures

Equipment assignments use the exact same RESTful structure as assets, just with different endpoints:

**Upload Photo:** `POST /api/v1/equipment-assignments/{assignmentId}/photos`
**Get Photos:** `GET /api/v1/equipment-assignments/{assignmentId}/photos`
**Delete Photo:** `DELETE /api/v1/equipment-assignments/{assignmentId}/photos/{photoId}`
**Upload Signature:** `POST /api/v1/equipment-assignments/{assignmentId}/signatures` (JSON body)
**Get Signatures:** `GET /api/v1/equipment-assignments/{assignmentId}/signatures`
**Delete Signature:** `DELETE /api/v1/equipment-assignments/{assignmentId}/signatures/{signatureId}`

**Response format:** Same as assets endpoints, but with `assignment_id` field instead of `asset_id`

### Database Schema (Actual Implementation)

**For Assets:**
```sql
CREATE TABLE asset_photos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    asset_id BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(50),
    file_size INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    INDEX idx_asset_id (asset_id)
);

CREATE TABLE asset_signatures (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    asset_id BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    signed_by VARCHAR(255) NOT NULL,
    signed_at TIMESTAMP NOT NULL,
    action VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    INDEX idx_asset_id (asset_id)
);
```

**For Equipment Assignments:**
```sql
CREATE TABLE assignment_photos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    assignment_id BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(50),
    file_size INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES equipment_assignments(id) ON DELETE CASCADE,
    INDEX idx_assignment_id (assignment_id)
);

CREATE TABLE assignment_signatures (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    assignment_id BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    signed_by VARCHAR(255) NOT NULL,
    signed_at TIMESTAMP NOT NULL,
    action VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES equipment_assignments(id) ON DELETE CASCADE,
    INDEX idx_assignment_id (assignment_id)
);
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden
```json
{
  "message": "This action is unauthorized."
}
```

### 404 Not Found
```json
{
  "message": "Resource not found."
}
```

### 422 Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

### 500 Internal Server Error
```json
{
  "message": "Server Error"
}
```

---

## Rate Limiting

API requests are rate-limited to:
- **60 requests per minute** for authenticated users
- **10 requests per minute** for unauthenticated users (login endpoint)

---

## Testing the API

### Using cURL

**Login:**
```bash
curl -X POST http://localhost/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@filament.local",
    "password": "your_password"
  }'
```

**Get User (with token):**
```bash
curl -X GET http://localhost/api/v1/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import the base URL: `http://localhost/api/v1`
2. Create a login request to get your token
3. Add the token to the Authorization header as "Bearer Token"
4. Test the protected endpoints

---

## Permissions

API access is controlled by the same Shield permissions used in the Filament panel:

- `view_any_*` - Required for listing resources
- `view_*` - Required for viewing single resource
- `create_*` - Required for creating resources
- `update_*` - Required for updating resources
- `delete_*` - Required for deleting resources

Users with the `super_admin` role have access to all endpoints.

---

## Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** on the client side
3. **Implement token refresh** for long-lived sessions
4. **Handle rate limiting** gracefully in your application
5. **Validate all input** on both client and server side
6. **Log API usage** for auditing purposes

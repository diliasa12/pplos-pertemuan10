# StreamVault

Platform streaming video berbasis microservices.

---

## Cara Menjalankan

### Prasyarat

- Node.js v18+
- MySQL 8.x
- RabbitMQ (Docker)

### 1. Jalankan RabbitMQ

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### 2. Setup setiap service

Setiap service memiliki file `.env` masing-masing:

**Auth Service (`/authService/.env`)**

```env
PORT=4178
DB_HOST=localhost
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=Moviestreaming
DB_PORT=3306
JWT_SECRET=your_jwt_secret
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

**Streaming Service (`/streaming/.env`)**

```env
PORT=4278
DB_HOST=localhost
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=Moviestreaming
DB_PORT=3306
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

**API Gateway (`/gateway/.env`)**

```env
PORT=4078
JWT_SECRET=your_jwt_secret
```

### 3. Install dan jalankan setiap service

```bash
# Auth Service
cd authService
npm install
node migrate.js
npm run dev

# Streaming Service
cd streaming
npm install
npm run dev

# API Gateway
cd gateway
npm install
npm run migrate
npm run dev
```

---

## Arsitektur Sistem

```
Client
  │
  ▼
API Gateway (port 4078)
  │  verify JWT → inject x-user-id, x-user-role, x-user-email
  │
  ├── /service1  →  Auth Service (port 4178)
  │
  └── /service2  →  Streaming Service (port 4278)
                     ├── Movies
                     └── Subscriptions

Auth Service ──publish──► RabbitMQ (queue: user.registered)
                                        │
                                        ▼
                           Streaming Service (consumer)
                           auto insert subscription status basic
```

---

## Daftar Endpoint

Semua request melalui **API Gateway port 4078**.

### Auth `/service1/api/auth`

#### POST /service1/api/auth/register

Request:

```json
{
  "nama": "Budi Santoso",
  "email": "budi@email.com",
  "password": "rahasia123"
}
```

Response:

```json
{
  "success": true,
  "message": "Registration success",
  "token": "eyJhbGci..."
}
```

---

#### POST /service1/api/auth/login

Request:

```json
{
  "email": "budi@email.com",
  "password": "rahasia123"
}
```

Response:

```json
{
  "success": true,
  "message": "Login success",
  "token": "eyJhbGci..."
}
```

---

### Movies `/service2/api/movies`

> Semua endpoint wajib menyertakan `Authorization: Bearer <token>`

#### GET /service2/api/movies

Response:

```json
{
  "success": true,
  "message": "Movies fetched successfully.",
  "data": [
    {
      "id": "uuid",
      "title": "Film Dokumenter",
      "type": "basic",
      "video_url": "https://youtube.com/...",
      "thumbnail_url": "https://img.youtube.com/...",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### GET /service2/api/movies/:id

Response:

```json
{
  "success": true,
  "message": "Video fetched successfully.",
  "data": {
    "id": "uuid",
    "title": "Film Dokumenter",
    "type": "basic",
    "video_url": "https://youtube.com/...",
    "thumbnail_url": "https://img.youtube.com/...",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

#### POST /service2/api/movies `Admin`

Request:

```json
{
  "title": "Film Dokumenter",
  "type": "basic",
  "video_url": "https://youtube.com/watch?v=xxx",
  "thumbnail_url": "https://img.youtube.com/vi/xxx/0.jpg"
}
```

Response:

```json
{
  "success": true,
  "message": "Video created successfully.",
  "data": {
    "id": "uuid",
    "title": "Film Dokumenter",
    "type": "basic",
    "video_url": "https://youtube.com/watch?v=xxx",
    "thumbnail_url": "https://img.youtube.com/vi/xxx/0.jpg",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

#### PUT /service2/api/movies/:id `Admin`

Request:

```json
{
  "title": "Film Dokumenter Updated",
  "type": "premium",
  "video_url": "https://youtube.com/watch?v=xxx",
  "thumbnail_url": "https://img.youtube.com/vi/xxx/0.jpg"
}
```

Response:

```json
{
  "success": true,
  "message": "Video updated successfully.",
  "data": {
    "id": "uuid",
    "title": "Film Dokumenter Updated",
    "type": "premium",
    "video_url": "https://youtube.com/watch?v=xxx",
    "thumbnail_url": "https://img.youtube.com/vi/xxx/0.jpg"
  }
}
```

---

#### DELETE /service2/api/movies/:id `Admin`

Response:

```json
{
  "success": true,
  "message": "Video deleted successfully."
}
```

---

### Subscriptions `/service2/api/subscriptions`

> Semua endpoint wajib menyertakan `Authorization: Bearer <token>`

#### GET /service2/api/subscriptions/my

Response:

```json
{
  "success": true,
  "message": "Subscription fetched successfully.",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "status": "basic"
  }
}
```

---

#### GET /service2/api/subscriptions `Admin`

Response:

```json
{
  "success": true,
  "message": "Subscriptions fetched successfully.",
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "status": "basic",
      "nama": "Budi Santoso",
      "email": "budi@email.com"
    }
  ]
}
```

---

#### PATCH /service2/api/subscriptions/upgrade

Response:

```json
{
  "success": true,
  "message": "Subscription upgraded to premium successfully.",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "status": "premium"
  }
}
```

---

#### PATCH /service2/api/subscriptions/downgrade

Response:

```json
{
  "success": true,
  "message": "Subscription downgraded to basic successfully.",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "status": "basic"
  }
}
```

---

#### PATCH /service2/api/subscriptions/:userId `Admin`

Request:

```json
{
  "status": "premium"
}
```

Response:

```json
{
  "success": true,
  "message": "Subscription updated to premium successfully.",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "status": "premium"
  }
}
```

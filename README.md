# Platform Creative (Full-Stack)

Plataforma educativa MERN con backend en Express + MongoDB y frontend en React + Vite + Tailwind.

## Estado Actual

- Backend estable con seguridad, auth por roles, gamificacion, notificaciones y realtime con Socket.io.
- Frontend con rediseno global Glassmorphism (landing, auth, dashboard, profile).
- Flujo full-stack de captura de leads activo en la landing (`POST /api/public/leads`).

## Stack

### Backend

- Node.js, Express, Mongoose
- JWT (access + refresh)
- Helmet, CORS, rate-limit, xss-clean, mongo-sanitize
- Socket.io
- Jest + Supertest + mongodb-memory-server

### Frontend

- React + Vite
- Tailwind CSS
- Framer Motion
- Axios
- React Router

## Arquitectura

Patron por capas:

Request -> Route -> Controller -> Service -> Repository -> MongoDB

- Route: declara endpoint + middlewares
- Controller: capa HTTP delgada
- Service: negocio
- Repository: acceso a datos
- Model: esquema de persistencia

## Estructura de Carpetas (resumen)

```text
platform-creative/
	app.js
	server.js
	routes/
	controllers/
	services/
	repositories/
	models/
	tests/
	docs/
	client/
		src/
			pages/
			components/
			context/
			api/
```

## Variables de Entorno

Backend (raiz, archivo `.env`):

- `MONGODB_URI` (obligatoria)
- `PORT` (opcional, default: `10000`)
- `JWT_SECRET` o `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET`
- `CORS_ORIGINS` (opcional, separados por coma)

Frontend (opcional, `client/.env`):

- `VITE_API_BASE_URL` (default: `http://localhost:10000/api`)

## Levantar Proyecto en Local

### 1) Backend

```bash
npm install
npm start
```

Backend disponible en:

- API base: `http://localhost:10000/api`
- Health: `http://localhost:10000/health`
- Swagger UI: `http://localhost:10000/api-docs`

### 2) Frontend

```bash
cd client
npm install
npm run dev
```

Frontend disponible en:

- `http://localhost:5173`

## Scripts

### Raiz (backend)

- `npm start`: inicia backend
- `npm run dev`: backend en watch
- `npm run seed`: siembra datos iniciales
- `npm test`: tests backend
- `npm run test:watch`: tests en watch
- `npm run test:coverage`: cobertura backend
- `npm run socket:test`: prueba manual de socket client

### Client (frontend)

- `npm run dev`: entorno local Vite
- `npm run lint`: lint frontend
- `npm run build`: build produccion frontend
- `npm run preview`: preview del build

## Endpoints Clave

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Student

- `GET /api/student/subjects`
- `GET /api/student/recommendations/review`

### Public (Landing)

- `POST /api/public/leads`
	- payload:
		- `email` (string, requerido)
		- `source` (string, opcional, default `landing`)
		- `metadata` (object, opcional)

## Captura de Leads (Landing)

Implementacion full-stack activa:

- Frontend: componente `LeadCapture` en landing (estado, validacion, loading, success/error).
- Backend: flujo Route -> Controller -> Service -> Repository -> Model (`Lead`).

Comportamiento:

- Primer registro de email: crea lead (`201`).
- Email repetido: responde exitoso con `alreadyRegistered: true`.

## Realtime (Socket.io)

Eventos principales:

- `NEW_NOTIFICATION`
- `NEW_FEEDBACK`

Flujo:

1. Cliente conecta con JWT.
2. Middleware valida token.
3. Socket queda vinculado a `userId`.
4. Servicios emiten eventos dirigidos.

## Testing

```bash
npm test
```

- Ejecuta suites unitarias e integracion del backend.
- Integracion usa `mongodb-memory-server`.

Cobertura:

```bash
npm run test:coverage
```

## CI

Workflow en `.github/workflows/node.js.yml` para `push` y `pull_request` sobre `main`.

## Notas Operativas

- Si el frontend cambia a otro puerto (por ejemplo 5174), incluye el origen en `CORS_ORIGINS` o usa la configuracion por defecto ya permitida.
- Si `:10000` esta ocupado, libera el proceso antes de reiniciar backend.
- La documentacion OpenAPI en `docs/openapi.yaml` es referencial y puede requerir sincronizacion de version/base path con endpoints actuales.

## Licencia

MIT.

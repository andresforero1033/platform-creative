# Platform Creative Backend

Backend API para la plataforma educativa Creative (MERN), con enfoque en seguridad, roles y calidad de ingeniería.

## Arquitectura del Sistema

La API sigue un patron N-Tier con Service-Repository Pattern para separar responsabilidades y facilitar escalabilidad.

Flujo principal:

Request -> Route -> Controller -> Service -> Repository -> MongoDB

- Route: define endpoint, middlewares de auth/validacion y delega al controlador.
- Controller: capa HTTP delgada, transforma request/response y delega en servicios.
- Service: reglas de negocio, casos de uso y orquestacion de seguridad.
- Repository: acceso a datos con Mongoose y consultas optimizadas.
- MongoDB: persistencia de entidades de dominio.

## Requisitos

- Node.js 18+
- npm 9+

## Scripts principales

- `npm start`: inicia el servidor en modo normal.
- `npm run dev`: inicia el servidor con watch.
- `npm run seed`: siembra materias iniciales.
- `npm test`: ejecuta tests con cobertura y umbral mínimo obligatorio.
- `npm run test:watch`: ejecuta tests en modo watch.
- `npm run test:coverage`: genera reporte de cobertura detallado.

## Testing

### Ejecutar tests

```bash
npm test
```

Este comando falla automáticamente si la cobertura global baja del 70%.

### Generar reporte de cobertura

```bash
npm run test:coverage
```

Se generan reportes en la carpeta `coverage/`:

- `coverage/lcov-report/index.html`: reporte HTML navegable.
- Resumen en consola (`text-summary`).

### Base de datos de prueba

Los tests de integración usan `mongodb-memory-server`, por lo que no ensucian tu MongoDB Atlas.

## Pipeline CI

El workflow de GitHub Actions está en `.github/workflows/node.js.yml` y ejecuta tests en cada `push` o `pull_request` a `main`.

# Puesta en marcha

## Requisitos

- Python 3.12 o superior
- Node.js 18 o superior
- PostgreSQL con una base de datos llamada `deporteca`

## Backend

```bash
cd deporteca_project
python -m venv .venv
# Windows (PowerShell): .venv\Scripts\Activate.ps1
# Linux / macOS:        source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # Windows: copy .env.example .env
```

Edita `.env` y rellena como mínimo `DJANGO_SECRET_KEY` y `POSTGRES_PASSWORD`. Para generar una clave:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Después:

```bash
python manage.py migrate
python manage.py seed_catalogos       # deportes, sexos, categorías de edad, tipos...
python manage.py createsuperuser      # usuario para /admin/
```

Para la ubicación, elige **una** de estas dos opciones:

```bash
# A) Datos reales: todas las comunidades autónomas y provincias (70 registros)
python manage.py loaddata provincias_y_ccaa.json

# B) Demo: 2 comunidades, 2 provincias y 3 lugares de ejemplo
python manage.py seed_demo_lugares
```

!!! warning "No combines A y B"
    `seed_demo_lugares` escribe "Cataluna" sin eñe y choca con las provincias de `provincias_y_ccaa.json` (ver [Problemas conocidos](problemas-conocidos.md)).

```bash
python manage.py runserver
```

- API: `http://127.0.0.1:8000/api/`
- Admin: `http://127.0.0.1:8000/admin/`

!!! note "Los lugares de ejemplo no salen en la búsqueda"
    `seed_demo_lugares` los crea como `pending`. Para verlos en la web, apruébalos en el admin y marca *suscripción activa* (ver [Ciclo de vida de una entidad](ciclo-de-vida-entidad.md)).

## Frontend

```bash
cd deporteca_frontend
npm ci
cp .env.example .env          # Windows: copy .env.example .env
```

Rellena en `.env` las claves de Firebase y Google Maps, y luego:

```bash
npm start
```

La app se abre en `http://localhost:3000`. Para generar la versión de producción: `npm run build`.

## Variables de entorno

Cada carpeta tiene un `.env.example` con todas las variables. Los archivos `.env` están en `.gitignore`: **nunca se suben al repositorio**.

### Backend (`deporteca_project/.env`)

| Variable | Obligatoria | Por defecto | Descripción |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | **Sí** | — | Clave secreta de Django. Sin ella el servidor no arranca |
| `DJANGO_DEBUG` | No | `false` | `true` solo en desarrollo |
| `DJANGO_ALLOWED_HOSTS` | No | `localhost,127.0.0.1` | Dominios desde los que se sirve la API, separados por comas |
| `DJANGO_CORS_ALLOWED_ORIGINS` | No | `http://localhost:3000` | Orígenes del frontend permitidos, separados por comas |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_HOST` / `POSTGRES_PORT` | No | `deporteca` / `postgres` / vacío / `localhost` / `5432` | Conexión a PostgreSQL |
| `DJANGO_EMAIL_BACKEND` | No | consola | Backend de email de Django |
| `DEFAULT_FROM_EMAIL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `EMAIL_USE_SSL` | No | — | SMTP para los avisos |
| `ENTITY_REQUEST_NOTIFICATION_EMAILS` | No | vacío | Quién recibe el aviso de nuevas solicitudes, separados por comas |

### Frontend (`deporteca_frontend/.env`)

| Variable | Descripción |
|---|---|
| `REACT_APP_BACKEND_API_BASE` | URL del backend. Por defecto `http://127.0.0.1:8000` |
| `REACT_APP_FIREBASE_API_KEY`, `…_AUTH_DOMAIN`, `…_PROJECT_ID`, `…_STORAGE_BUCKET`, `…_MESSAGING_SENDER_ID`, `…_APP_ID` | Configuración del proyecto Firebase |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Clave de Google Places para el autocompletado |

!!! warning "Las variables `REACT_APP_*` son públicas"
    Create React App las incrusta en el JavaScript que descarga el navegador. No pongas secretos ahí. Protege las claves de Google y Firebase con **restricciones de dominio (HTTP referrer) y de API** en Google Cloud Console.

## Comprobaciones

```bash
# Backend
python manage.py check
ruff check .                  # requiere: pip install ruff

# Frontend
npm run lint
npm run build
```

En Windows, `deporteca_project/scripts/verify.ps1` ejecuta las comprobaciones del backend.

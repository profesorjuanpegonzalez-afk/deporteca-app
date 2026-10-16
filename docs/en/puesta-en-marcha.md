!!! info "Translation"
    This page is a translation of the [Spanish version](../puesta-en-marcha/), which is the source of truth. If they differ, the Spanish version is correct.

# Getting started

## Requirements

- Python 3.12 or later
- Node.js 18 or later
- PostgreSQL with a database named `deporteca`

## Backend

```bash
cd deporteca_project
python -m venv .venv
# Windows (PowerShell): .venv\Scripts\Activate.ps1
# Linux / macOS:        source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # Windows: copy .env.example .env
```

Edit `.env` and fill in at least `DJANGO_SECRET_KEY` and `POSTGRES_PASSWORD`. To generate a key:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Then:

```bash
python manage.py migrate
python manage.py seed_catalogos       # sports, sexes, age categories, types...
python manage.py createsuperuser      # user for /admin/
```

For locations, pick **one** of these two options:

```bash
# A) Real data: every autonomous community and province (70 records)
python manage.py loaddata provincias_y_ccaa.json

# B) Demo: 2 communities, 2 provinces and 3 sample venues
python manage.py seed_demo_lugares
```

!!! warning "Don't combine A and B"
    `seed_demo_lugares` writes "Cataluna" without the ñ and collides with the provinces in `provincias_y_ccaa.json` (see [Known issues](problemas-conocidos.md)).

```bash
python manage.py runserver
```

- API: `http://127.0.0.1:8000/api/`
- Admin: `http://127.0.0.1:8000/admin/`

!!! note "The sample venues don't show up in the search"
    `seed_demo_lugares` creates them as `pending`. To see them on the site, approve them in the admin and tick *suscripción activa* (active subscription); see [Entity lifecycle](ciclo-de-vida-entidad.md).

## Frontend

```bash
cd deporteca_frontend
npm ci
cp .env.example .env          # Windows: copy .env.example .env
```

Fill in the Firebase and Google Maps keys in `.env`, then:

```bash
npm start
```

The app opens at `http://localhost:3000`. To produce the production build: `npm run build`.

## Environment variables

Each folder has a `.env.example` listing every variable. `.env` files are in `.gitignore`: **they are never committed**.

### Backend (`deporteca_project/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | **Yes** | — | Django secret key. The server won't start without it |
| `DJANGO_DEBUG` | No | `false` | `true` only in development |
| `DJANGO_ALLOWED_HOSTS` | No | `localhost,127.0.0.1` | Hostnames the API is served from, comma-separated |
| `DJANGO_CORS_ALLOWED_ORIGINS` | No | `http://localhost:3000` | Allowed frontend origins, comma-separated |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_HOST` / `POSTGRES_PORT` | No | `deporteca` / `postgres` / empty / `localhost` / `5432` | PostgreSQL connection |
| `DJANGO_EMAIL_BACKEND` | No | console | Django email backend |
| `DEFAULT_FROM_EMAIL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `EMAIL_USE_SSL` | No | — | SMTP for the notices |
| `ENTITY_REQUEST_NOTIFICATION_EMAILS` | No | empty | Who receives new-request notices, comma-separated |

### Frontend (`deporteca_frontend/.env`)

| Variable | Description |
|---|---|
| `REACT_APP_BACKEND_API_BASE` | Backend URL. Defaults to `http://127.0.0.1:8000` |
| `REACT_APP_FIREBASE_API_KEY`, `…_AUTH_DOMAIN`, `…_PROJECT_ID`, `…_STORAGE_BUCKET`, `…_MESSAGING_SENDER_ID`, `…_APP_ID` | Firebase project configuration |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Google Places key for address autocomplete |

!!! warning "`REACT_APP_*` variables are public"
    Create React App embeds them in the JavaScript the browser downloads. Don't put secrets there. Protect the Google and Firebase keys with **HTTP-referrer and API restrictions** in Google Cloud Console.

## Checks

```bash
# Backend
python manage.py check
ruff check .                  # requires: pip install ruff

# Frontend
npm run lint
npm run build
```

On Windows, `deporteca_project/scripts/verify.ps1` runs the backend checks.

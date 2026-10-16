!!! info "Translation"
    This page is a translation of the [Spanish version](../puesta-en-marcha/), which is the source of truth. If they differ, the Spanish version is correct.

# Getting started

This page explains how to set up the environment from scratch, how to start it again day to day, and how to move over from the previous version of the project (with configuration written in the code).

## Requirements

- Python 3.12 or later
- Node.js 18 or later
- PostgreSQL 15 or later: installed on the system **or** via Docker (see below)

## 1. Database

Pick **one** option.

=== "Docker"

    Create a container with the `deporteca` database (first time only):

    ```bash
    docker run -d --name deporteca-pg \
      -e POSTGRES_DB=deporteca \
      -e POSTGRES_PASSWORD=put-a-password-here \
      -p 127.0.0.1:5432:5432 \
      postgres:15
    ```

    Use the same password for `POSTGRES_PASSWORD` in the backend `.env` file. The data lives inside the container: `docker stop deporteca-pg` stops it without losing anything, and `docker start deporteca-pg` starts it again.

=== "Installed PostgreSQL"

    Create the database (first time only), with pgAdmin or from the terminal:

    ```bash
    createdb -U postgres deporteca
    ```

    In `.env`, set your installation's user and password (`POSTGRES_USER`, `POSTGRES_PASSWORD`).

## 2. Backend

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
- A 404 at `http://127.0.0.1:8000/` (the root) is normal: the backend only has `/api/` and `/admin/`.

!!! note "The sample venues don't show up in the search"
    `seed_demo_lugares` creates them as `pending`. To see them on the site, approve them in the admin, tick *suscripción activa* (active subscription) and check they have a CIF; see [Entity lifecycle](ciclo-de-vida-entidad.md).

## 3. Frontend

```bash
cd deporteca_frontend
npm ci
cp .env.example .env          # Windows: copy .env.example .env
```

Fill in the Firebase and Google Maps keys in `.env` (see [Environment variables](#environment-variables)), then:

```bash
npm start
```

The app opens at `http://localhost:3000`. To produce the production build: `npm run build`.

!!! warning "After changing `.env`, restart `npm start`"
    Create React App only reads `.env` at startup. If you change a `REACT_APP_*` variable while the server is running, the change doesn't apply until you stop it (Ctrl+C) and start it again.

## Starting the environment again

Once set up, day to day you start the three pieces **in this order**, each in its own terminal:

```bash
# 1. Database (Docker only; installed PostgreSQL usually starts on its own)
docker start deporteca-pg

# 2. Backend
cd deporteca_project
.venv\Scripts\Activate.ps1      # Linux / macOS: source .venv/bin/activate
python manage.py migrate        # in case there are new migrations
python manage.py runserver

# 3. Frontend
cd deporteca_frontend
npm ci                          # only if package-lock.json changed
npm start
```

To stop: Ctrl+C in the backend and frontend, and `docker stop deporteca-pg` if you use Docker.

## Moving over from the previous version

Until October 2026, keys and configuration were written directly in `settings.py` and `App.js`. They are now read from `.env` files. If you already had the project running:

1. **Copy your personal documents out of the project folder** and clone the repository again (or `git fetch && git reset --hard origin/main`). Don't `push` from the old folder: it would upload the old history and the deleted files again.
2. Create the new virtual environment in `deporteca_project/.venv` (the old `venv/` is no longer used) and install `requirements.txt`.
3. Create `deporteca_project/.env` from `.env.example`:
    - `POSTGRES_PASSWORD`: your local PostgreSQL password (it used to be in `settings.py`).
    - `DJANGO_SECRET_KEY`: generate a **new** one (the old one was published on GitHub).
    - `DJANGO_DEBUG=true` on your machine.
4. Your `deporteca` database stays the same: no need to reload data. Run `python manage.py migrate` just in case.
5. Create `deporteca_frontend/.env` from `.env.example`. The Firebase values are in the Firebase console → *Project settings* → *Your apps*. The Google Maps key is in Google Cloud Console → *APIs & Services* → *Credentials*.
6. Start everything as in [Starting the environment again](#starting-the-environment-again).

## Opening the app from another machine

By default everything works on `localhost`. If the project runs on another computer (a server, a virtual machine…) and you open it from your browser, keep in mind:

1. **Firebase only allows authorised domains.** If you open the app with a name or IP that isn't in Firebase → *Authentication* → *Settings* → *Authorized domains*, you'll see "Error de autenticación" (authentication error). `localhost` is authorised by default.
2. **The simplest way is an SSH tunnel**, which makes your browser use `localhost`:

    ```bash
    ssh -N -L 3000:localhost:3000 -L 8000:localhost:8000 user@server
    ```

    Then open `http://localhost:3000`. **Both** ports are needed: the browser downloads the app from 3000 and calls the API on 8000.

3. **`REACT_APP_BACKEND_API_BASE` is the API URL as seen from the browser**, not from the server. With the tunnel: `http://localhost:8000`. And the origin you open the app from must be in `DJANGO_CORS_ALLOWED_ORIGINS` (default `http://localhost:3000`).

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
| `REACT_APP_BACKEND_API_BASE` | Backend URL **as seen from the browser**. Defaults to `http://127.0.0.1:8000` |
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

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `ImproperlyConfigured: Falta DJANGO_SECRET_KEY` | `deporteca_project/.env` doesn't exist or the variable is missing |
| `connection to server at "localhost" … failed` | PostgreSQL isn't running (`docker start deporteca-pg`) or the password in `.env` doesn't match |
| 404 at `http://127.0.0.1:8000/` | Normal: use `/api/` or `/admin/` |
| "Error de autenticación" on the site | The domain you open the app with isn't authorised in Firebase (see [Opening the app from another machine](#opening-the-app-from-another-machine)) |
| "No se ha podido conectar con el backend de búsqueda" | The browser can't reach `REACT_APP_BACKEND_API_BASE`: backend stopped, port 8000 not tunnelled, or CORS. The message always says `127.0.0.1:8000`, even when the real URL is different |
| The map shows "API KEY REQUIRED" | CARTO tiles now need a key (see [Known issues](problemas-conocidos.md)) |
| The search returns nothing | No publishable venues: approved, with a CIF and an active subscription |
| I changed the frontend `.env` and nothing happens | Restart `npm start` |

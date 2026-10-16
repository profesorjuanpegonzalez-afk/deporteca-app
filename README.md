# Deporteca

Buscador de servicios deportivos (clubes, gimnasios, piscinas, centros deportivos) con mapa y filtros.

- `deporteca_project/` — backend Django + Django REST Framework + PostgreSQL
- `deporteca_frontend/` — frontend React (Create React App) + Tailwind + Leaflet + Firebase

## Requisitos

- Python 3.12+
- Node.js 18+
- PostgreSQL con una base de datos `deporteca`. Con Docker:
  `docker run -d --name deporteca-pg -e POSTGRES_DB=deporteca -e POSTGRES_PASSWORD=<contraseña> -p 127.0.0.1:5432:5432 postgres:15`

## Backend

```bash
cd deporteca_project
python -m venv .venv
# Windows: .venv\Scripts\activate    Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # y rellena DJANGO_SECRET_KEY y POSTGRES_PASSWORD
python manage.py migrate
python manage.py runserver
```

La API queda en `http://127.0.0.1:8000/api/`.

## Frontend

```bash
cd deporteca_frontend
npm ci
cp .env.example .env    # y rellena las claves de Firebase / Google Maps
npm start
```

La app queda en `http://localhost:3000`.

Para volver a arrancarlo otro día, pasar desde la versión anterior (configuración en el código) o abrir la app desde otra máquina, ver `docs/es/puesta-en-marcha.md`.

## Configuración

Toda la configuración sensible (claves, contraseñas, hosts) se lee de variables de entorno. Cada carpeta tiene un `.env.example` con la lista completa. Los archivos `.env` están en `.gitignore` y **nunca** deben subirse al repositorio.

## Documentación

La documentación técnica está en `docs/` (español en `docs/es/`, fuente de verdad; inglés en `docs/en/`). Para compilarla y verla en local, ver `docs/es/documentacion.md`.

Las reglas para asistentes de IA (GitHub Copilot, etc.) están en [`AGENTS.md`](AGENTS.md).

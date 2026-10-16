!!! info "Translation"
    This page is a translation of the [Spanish version](../), which is the source of truth. If they differ, the Spanish version is correct.

# Deporteca

Deporteca is a search engine for sports services in Spain: clubs, associations, gyms, pools and sports centres. The public searches by sport, location, sex, age category or competition type and sees the results on a map and in a list. Organisations register to appear in the search, and the administrators review and approve each one.

## Components

| Folder | What it is | Technology |
|---|---|---|
| `deporteca_frontend/` | Public web app and admin panel | React 18 (Create React App), Tailwind CSS, Leaflet, Firebase JS SDK |
| `deporteca_project/` | API and database | Django 5.2, Django REST Framework, django-filter, PostgreSQL |
| `docs/` | This documentation | Zensical |

## Project status

The project is in development and has no production deployment yet. It runs locally with the backend at `http://127.0.0.1:8000` and the frontend at `http://localhost:3000`.

Several important points must be solved before deploying (API authentication, choosing between Django and Firestore as the single backend, etc.). They are listed in [Known issues](problemas-conocidos.md).

## Where to start

- **I want to run the project on my machine** → [Getting started](puesta-en-marcha.md)
- **I want to understand how it works** → [Architecture](arquitectura.md)
- **I want to know what data is stored** → [Data model](modelo-de-datos.md)
- **I want to understand how an organisation gets listed** → [Entity lifecycle](ciclo-de-vida-entidad.md)
- **I want to call the API** → [API](api.md)

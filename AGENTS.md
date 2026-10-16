# AGENTS.md

Instructions for AI coding agents (GitHub Copilot and others) working in this repository. Read this file before making any change. Full project documentation lives in `docs/es/` (Spanish, source of truth) and `docs/en/` (English mirror).

## Communication

- Reply in the language the user writes in (usually Spanish).
- Code comments, UI text, docs and commit messages follow the language rules below, not the chat language.
- Before a non-trivial change (several files, new dependency, model change, anything touching auth or data), explain the plan and wait for confirmation.
- Never claim something works without running the relevant check (see [Commands](#commands)).

## Project overview

Deporteca is a sports-services finder for Spain (clubs, gyms, pools, sports centres) with a map, filters, organisation sign-up and admin approval.

| Path | What | Stack |
|---|---|---|
| `deporteca_project/` | Backend API + Django admin | Django 5.2, DRF, django-filter, PostgreSQL |
| `deporteca_project/lugares/` | The only Django app: models, views, serializers, filters, signals, admin | |
| `deporteca_frontend/` | Web app | React 18 (Create React App), Tailwind, Leaflet, Firebase SDK |
| `docs/` | Documentation site | Zensical (`docs/zensical.toml` = ES, `docs/zensical.en.toml` = EN) |

Key concepts (details in `docs/es/ciclo-de-vida-entidad.md`):

- `Lugar` is a venue. It only appears in public search when `puede_publicar_contenido` is true: approved + CIF + active subscription + no documentation required.
- `OfertaDeportiva` = sport × sex × age category × competition type × service type, per venue.
- `Contacto` is an organisation sign-up request, converted into a `Lugar` from the Django admin.
- **Django is the de facto source of truth.** Firestore is still used in parts of the frontend (see `docs/es/arquitectura.md`). The final Django-vs-Firestore decision is still open.

## Commands

Backend (from `deporteca_project/`, with `.venv` active):

```bash
pip install -r requirements.txt
python manage.py check
python manage.py makemigrations --check --dry-run
ruff check .
python manage.py runserver
```

Frontend (from `deporteca_frontend/`):

```bash
npm ci
npm run lint
npm run build
npm start
```

Docs (from `docs/`), always Spanish first:

```bash
zensical build && zensical build -f zensical.en.toml
```

Run the checks for every part you touched before saying a change is done.

## Hard rules

### Secrets and configuration

- **Never hardcode secrets, keys, passwords or hostnames.** Backend config comes from env vars read in `settings.py`. Frontend config comes from `REACT_APP_*` vars.
- When adding a config value, add it to the matching `.env.example` with a comment, and to the env-var table in `docs/es/puesta-en-marcha.md` (+ EN mirror).
- Never commit `.env`, `venv/`/`.venv/`, `node_modules/`, `__pycache__/`, `build/`, `docs/site/`, Firebase service-account JSON files or `.docx` working documents. They are in `.gitignore`; don't force-add them.
- `REACT_APP_*` values are public (bundled into the browser JS). Never put a real secret there.

### Backend

- Every new or changed view **must declare `permission_classes` explicitly**. Don't add new `AllowAny` write endpoints. Known gap: `LugarViewSet` writes are currently `AllowAny`; don't copy that pattern.
- Business rules belong in the model (`models.py`: `save()`, `clean()`, properties), not in views or the frontend.
- Changing a model requires a migration in the same change: `python manage.py makemigrations lugares`. Never edit an applied migration.
- Don't return raw exception text to clients in new code.
- Ruff config is in `deporteca_project/pyproject.toml`; code must pass `ruff check .`.

### Frontend

- The backend URL comes from `process.env.REACT_APP_BACKEND_API_BASE`. Don't hardcode `http://127.0.0.1:8000` in new code.
- **Don't add new Firestore reads or writes** while the backend decision is open. New features go through the Django API.
- Admin-only UI is not a security boundary. Anything sensitive must be enforced by the backend.
- `npm run build` must pass with `CI=true` (CI treats ESLint warnings as errors).

### Language and style

- Code identifiers, models, fields, comments and UI text are in **Spanish**, matching the existing code (`Lugar`, `ofertas_deportivas`, `puede_publicar_contenido`).
- Follow the style of the surrounding code; don't reformat files you aren't otherwise changing.

### Documentation

- **Spanish (`docs/es/`) is the source of truth.** Edit it first, then mirror the same change in `docs/en/` (same file name) **in the same change**. English pages keep their "Translation" notice at the top.
- New page → add it to `nav` in both `docs/zensical.toml` and `docs/zensical.en.toml`.
- When you fix something listed in `docs/es/problemas-conocidos.md`, remove it there (and in EN) in the same change.
- Update the relevant docs page whenever you change behaviour, the API, models or configuration.

### Git

- Small, focused commits with a prefix: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`. The message explains **why**, not only what.
- Work on a branch and open a pull request. Don't push directly to `main` and never force-push `main`.
- Never commit generated or local files (see the secrets section).

## Skills (planned)

Task-specific skills (for example "add an API endpoint", "add a docs page", "release") will be added as Agent Skills. Until then, this file is the single source of agent rules. When adding skills, keep the always-on rules here and put step-by-step procedures in the skill.

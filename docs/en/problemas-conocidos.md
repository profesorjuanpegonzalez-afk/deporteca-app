!!! info "Translation"
    This page is a translation of the [Spanish version](../problemas-conocidos/), which is the source of truth. If they differ, the Spanish version is correct.

# Known issues

Issues found during the code review (October 2026), ordered by priority. When one is fixed, remove it from here in the same change.

## 🔴 Before deploying

### The venues API doesn't require authentication

`LugarViewSet` uses `permission_classes = [AllowAny]`, so **anyone** can create, edit or delete venues with `POST/PUT/PATCH/DELETE /api/lugares/`. Only the admin actions (approve, reject, statistics…) require `IsAdminUser`.

On top of that, the frontend's admin panel is shown based on a role stored in **Firestore**, but it calls Django **without sending any Django credentials**. As a result, the `IsAdminUser` actions fail from the frontend, and the write actions work for everyone.

**Fix:** pick a single authentication system (Django session/token, or verify the Firebase token in Django), require it on writes, and stop relying on the client-side role check as the only barrier.

### `/api/lugares/` also lists non-publishable venues

The list and detail endpoints return every venue, including `pending`, `rejected` and `inactive` ones. Only `busqueda-avanzada` filters by publishable.

### The Google keys need restrictions

`REACT_APP_*` variables end up in the public JavaScript. The Google key (Firebase + Places) must be restricted by domain and by API in Google Cloud Console.

### Firestore security rules

The frontend writes to Firestore with anonymous login. The security rules aren't in the repository. They need to be reviewed in the Firebase console and saved in the repo (`firestore.rules`).

## 🟠 Architecture

### Two backends at once (Django and Firestore)

See the table in [Architecture](arquitectura.md#two-backends-django-and-firestore). Consequences:

- The admin content manager saves sports and other catalogues to Firestore, but the site reads them from Django: **changes never show**.
- `SuggestPlaceForm` saves full venues to Firestore that nobody reads back.
- The subscription to Firestore `lugares` loads data into `allLugares`, which is unused.

**Pending decision:** keep only Django (recommended: it already holds all the business logic) and use Firebase at most for auth and Storage, or the other way round.

### The app doesn't load if Firestore fails

On startup, `App.js` waits for Firebase's anonymous login **and** the first read of `lugares` from Firestore before showing anything, even though the search and the map use Django data. If Firebase fails (unauthorised domain, rules, offline), the whole page shows an error.

### `App.js` is too big

Over 1000 lines holding almost all the state and logic. The backend URL is defined in three files (`App.js`, `LugarForm.jsx`, `EntityRegistrationModal.jsx`).

## 🟡 Bugs and details

- **Activating a venue doesn't publish it.** The admin action "activar lugar vinculado" sets `approved` but not `suscripcion_activa`, so the venue stays hidden until the subscription is ticked by hand.
- **Pending migration.** `makemigrations --check` detects an uncreated migration for the proxy models (`ContactoPendiente`, `Lugar*`). It doesn't change any tables.
- **`lugares_django.json` can't be loaded.** It starts with a Windows BOM and uses an old schema (`tipo_competicion` as text instead of a foreign key).
- **`seed_demo_lugares` collides with `provincias_y_ccaa.json`.** It writes "Cataluna" without the ñ and creates a duplicate "Barcelona" province.
- **The map shows "API KEY REQUIRED".** `MapComponent.js` uses CARTO's free tiles (`basemaps.cartocdn.com`) without a key, and CARTO now returns a warning image to anyone without one. It happens with the original code too. Options: a free CARTO key, another keyed provider (MapTiler, Stadia) or OpenStreetMap tiles for development. Ideally the tile URL should come from an environment variable.
- **The search error message has a hardcoded URL.** "No se ha podido conectar con el backend de búsqueda" always says `http://127.0.0.1:8000`, even when `REACT_APP_BACKEND_API_BASE` is different.
- **Nominatim** is used for autocomplete and geocoding. Its usage policy forbids autocomplete and heavy use; production needs another provider or a self-hosted instance.
- **Internal errors exposed.** Several `except Exception` blocks return the error text to the client.
- **No tests.** `lugares/tests.py` is empty.
- **11 ESLint warnings** in the frontend. In CI, `CI=true` makes `npm run build` treat them as errors.
- **Old Firestore scripts.** `migrate_to_firestore.py`, `deporteca_frontend/populate_regions.py` and `addProvincias.js` date from the Firebase stage and need credentials that aren't in the repo.

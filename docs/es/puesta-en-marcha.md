# Puesta en marcha

Esta página explica cómo montar el entorno desde cero, cómo volver a arrancarlo cada día y cómo pasar desde la versión anterior del proyecto (con la configuración escrita en el código).

## Requisitos

- Python 3.12 o superior
- Node.js 18 o superior
- PostgreSQL 15 o superior: instalado en el sistema **o** con Docker (ver abajo)

## 1. Base de datos

Elige **una** opción.

=== "Docker"

    Crea un contenedor con la base de datos `deporteca` (solo la primera vez):

    ```bash
    docker run -d --name deporteca-pg \
      -e POSTGRES_DB=deporteca \
      -e POSTGRES_PASSWORD=pon-aqui-una-contraseña \
      -p 127.0.0.1:5432:5432 \
      postgres:15
    ```

    Usa la misma contraseña en `POSTGRES_PASSWORD` del archivo `.env` del backend. Los datos se guardan dentro del contenedor: `docker stop deporteca-pg` lo para sin perder nada y `docker start deporteca-pg` lo vuelve a arrancar.

=== "PostgreSQL instalado"

    Crea la base de datos (solo la primera vez), con pgAdmin o desde la terminal:

    ```bash
    createdb -U postgres deporteca
    ```

    En `.env` pon el usuario y la contraseña de tu instalación (`POSTGRES_USER`, `POSTGRES_PASSWORD`).

## 2. Backend

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
- En `http://127.0.0.1:8000/` (la raíz) es normal ver un error 404: el backend solo tiene `/api/` y `/admin/`.

!!! note "Los lugares de ejemplo no salen en la búsqueda"
    `seed_demo_lugares` los crea como `pending`. Para verlos en la web, apruébalos en el admin, marca *suscripción activa* y comprueba que tienen CIF (ver [Ciclo de vida de una entidad](ciclo-de-vida-entidad.md)).

## 3. Frontend

```bash
cd deporteca_frontend
npm ci
cp .env.example .env          # Windows: copy .env.example .env
```

Rellena en `.env` las claves de Firebase y Google Maps (ver [Variables de entorno](#variables-de-entorno)), y luego:

```bash
npm start
```

La app se abre en `http://localhost:3000`. Para generar la versión de producción: `npm run build`.

!!! warning "Después de cambiar `.env`, reinicia `npm start`"
    Create React App solo lee `.env` al arrancar. Si cambias una variable `REACT_APP_*` con el servidor en marcha, el cambio no se aplica hasta que lo paras (Ctrl+C) y lo vuelves a lanzar.

## Volver a arrancar el entorno

Una vez montado, el día a día es arrancar las tres piezas **en este orden**, cada una en su terminal:

```bash
# 1. Base de datos (solo con Docker; PostgreSQL instalado suele arrancar solo)
docker start deporteca-pg

# 2. Backend
cd deporteca_project
.venv\Scripts\Activate.ps1      # Linux / macOS: source .venv/bin/activate
python manage.py migrate        # por si hay migraciones nuevas
python manage.py runserver

# 3. Frontend
cd deporteca_frontend
npm ci                          # solo si package-lock.json ha cambiado
npm start
```

Para parar: Ctrl+C en el backend y en el frontend, y `docker stop deporteca-pg` si usas Docker.

## Pasar desde la versión anterior

Hasta octubre de 2026, las claves y la configuración estaban escritas directamente en `settings.py` y `App.js`. Ahora se leen de archivos `.env`. Si ya tenías el proyecto funcionando:

1. **Copia tus documentos personales fuera de la carpeta del proyecto** y vuelve a clonar el repositorio (o `git fetch && git reset --hard origin/main`). No hagas `push` desde la carpeta antigua: volvería a subir el historial y los archivos borrados.
2. Crea el entorno virtual nuevo en `deporteca_project/.venv` (el antiguo `venv/` ya no se usa) e instala `requirements.txt`.
3. Crea `deporteca_project/.env` a partir de `.env.example`:
    - `POSTGRES_PASSWORD`: la contraseña de tu PostgreSQL local (antes estaba en `settings.py`).
    - `DJANGO_SECRET_KEY`: genera una **nueva** (la anterior se publicó en GitHub).
    - `DJANGO_DEBUG=true` en tu máquina.
4. Tu base de datos `deporteca` sigue igual: no hace falta volver a cargar datos. Ejecuta `python manage.py migrate` por si acaso.
5. Crea `deporteca_frontend/.env` a partir de `.env.example`. Los valores de Firebase están en la consola de Firebase → *Configuración del proyecto* → *Tus apps*. La clave de Google Maps, en Google Cloud Console → *APIs y servicios* → *Credenciales*.
6. Arranca como en [Volver a arrancar el entorno](#volver-a-arrancar-el-entorno).

## Abrir la app desde otra máquina

Por defecto todo funciona en `localhost`. Si el proyecto corre en otro ordenador (un servidor, una máquina virtual…) y lo abres desde tu navegador, ten en cuenta:

1. **Firebase solo permite dominios autorizados.** Si abres la app con un nombre o IP que no está en Firebase → *Authentication* → *Settings* → *Authorized domains*, verás "Error de autenticación". `localhost` está autorizado por defecto.
2. **La forma más sencilla es un túnel SSH**, que hace que tu navegador use `localhost`:

    ```bash
    ssh -N -L 3000:localhost:3000 -L 8000:localhost:8000 usuario@servidor
    ```

    Después abre `http://localhost:3000`. Hacen falta **los dos** puertos: el navegador descarga la app del 3000 y llama a la API en el 8000.

3. **`REACT_APP_BACKEND_API_BASE` es la URL de la API vista desde el navegador**, no desde el servidor. Con el túnel: `http://localhost:8000`. Y el origen desde el que abres la app tiene que estar en `DJANGO_CORS_ALLOWED_ORIGINS` (por defecto `http://localhost:3000`).

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
| `REACT_APP_BACKEND_API_BASE` | URL del backend **vista desde el navegador**. Por defecto `http://127.0.0.1:8000` |
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

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| `ImproperlyConfigured: Falta DJANGO_SECRET_KEY` | No existe `deporteca_project/.env` o falta la variable |
| `connection to server at "localhost" … failed` | PostgreSQL no está en marcha (`docker start deporteca-pg`) o la contraseña de `.env` no coincide |
| 404 en `http://127.0.0.1:8000/` | Normal: usa `/api/` o `/admin/` |
| "Error de autenticación" en la web | El dominio con el que abres la app no está autorizado en Firebase (ver [Abrir la app desde otra máquina](#abrir-la-app-desde-otra-maquina)) |
| "No se ha podido conectar con el backend de búsqueda" | El navegador no llega a `REACT_APP_BACKEND_API_BASE`: backend parado, puerto 8000 sin túnel, o CORS. El mensaje siempre dice `127.0.0.1:8000`, aunque la URL real sea otra |
| El mapa muestra "API KEY REQUIRED" | Las teselas de CARTO ahora necesitan clave (ver [Problemas conocidos](problemas-conocidos.md)) |
| La búsqueda no devuelve nada | No hay lugares publicables: aprobados, con CIF y con suscripción activa |
| He cambiado `.env` del frontend y no pasa nada | Reinicia `npm start` |

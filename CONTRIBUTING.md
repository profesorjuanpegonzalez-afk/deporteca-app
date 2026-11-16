# Cómo contribuir

Guía para cualquiera que trabaje en Deporteca, con o sin un asistente de IA (GitHub Copilot u otro). Los asistentes leen además [`AGENTS.md`](AGENTS.md), que tiene las reglas técnicas.

## Dónde está el plan

Todo el trabajo está en **GitHub**, no en documentos sueltos:

- **[Issues](https://github.com/profesorjuanpegonzalez-afk/deporteca-app/issues)**: una tarea concreta cada uno, con su objetivo y una lista "Hecho cuando".
- **[Milestones](https://github.com/profesorjuanpegonzalez-afk/deporteca-app/milestones)**: las fases del piloto, con fecha límite. Objetivo: **piloto publicado el 15 de enero de 2027**.

| Milestone | Fecha | Contenido |
|---|---|---|
| M0 — Tareas del propietario | 30 nov | Cuentas, claves y accesos que solo puede hacer el propietario |
| Fase 1 — Base segura, mapa y menú | 30 nov | Seguridad de la API, Django como único backend, mapa, menú, contacto |
| Fase 2 — Alta y avisos | 15 dic | Alta de lugares en 3 pasos, moderación, avisos por correo |
| Fase 3 — Artículos y ranking | 31 dic | Artículos, búsqueda y filtros, estadísticas y ranking |
| Fase 4 — Pruebas y puesta en marcha | 15 ene | Pruebas, móvil, dominio, producción, copias de seguridad |
| Después del piloto | — | App instalable, eventos, suscripciones, valoraciones |

Las **etiquetas** dicen de qué tipo es cada issue: `frontend`, `backend`, `seguridad`, `docs`, `infra`, `bug`, `funcionalidad`. `buen-primer-issue` = tarea pequeña y acotada, buena para empezar. `tarea-propietario` = solo la puede hacer el propietario.

Si quieres algo que no está en ningún issue, **crea primero el issue** (o pídelo) y se decide en qué fase entra.

## Quién hace qué

| Quién | Qué |
|---|---|
| **Propietario** | Tareas de M0 y cuentas (dominio, hosting, correo); contenido (textos legales, lugares reales para el piloto, artículos); issues pequeños de frontend asignados a él; pruebas en el móvil y búsqueda de usuarios para el piloto |
| **Mantenedor** | Seguridad, backend, modelos de datos, alta y moderación, estadísticas; revisión de todos los PR |

Cada issue tiene **una persona asignada**. Trabaja solo en los que tengas asignados; si quieres coger otro, asígnatelo y avisa en el issue.

## Flujo de trabajo: un issue → una rama → un pull request

Ejemplo real: el [PR #61](https://github.com/profesorjuanpegonzalez-afk/deporteca-app/pull/61) (cambio de teselas del mapa, issue #41).

### 1. Partir de `main` actualizado

```bash
git checkout main
git pull
```

### 2. Crear una rama para el issue

Nombre: `tipo/numero-descripcion-corta`, por ejemplo `fix/41-mapa-teselas` o `feat/59-como-llegar`.

```bash
git checkout -b feat/59-como-llegar
```

Tipos: `feat` (funcionalidad nueva), `fix` (corrección), `docs` (documentación), `refactor`, `test`, `chore` (mantenimiento), `ci`.

### 3. Hacer el cambio

- Solo lo que pide el issue. Si ves otra cosa que arreglar, crea otro issue.
- Con Copilot: dile **"Trabaja en el issue #59"** y pega el texto del issue. Pídele que te explique el plan antes de tocar archivos.

### 4. Comprobar que funciona

Desde `deporteca_frontend/`:

```bash
npm run lint
npm run build
npm start
```

Desde `deporteca_project/` (con `.venv` activado):

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test lugares.tests
ruff check .
```

Con Docker, antepón `docker compose exec api` a cada comando (por ejemplo `docker compose exec api python manage.py check`).

Abre la app y prueba a mano lo que has cambiado. Si cambiaste la documentación, construye ES y luego EN (ver `AGENTS.md`).

### 5. Guardar y subir

```bash
git add <archivos que cambiaste>
git commit -m "feat: botón Cómo llegar con Google Maps"
git push -u origin feat/59-como-llegar
```

El mensaje empieza por el tipo (`feat:`, `fix:`…) y explica **por qué** se hace el cambio.

### 6. Abrir el pull request

En GitHub aparece el botón **"Compare & pull request"**. La plantilla del PR te pide:

- **Qué cambia**, en pocas frases.
- **Cómo probarlo**, paso a paso.
- **Comprobaciones** que has hecho.
- `Closes #59`: al aceptar el PR, el issue se cierra solo.

### 7. Revisión

La otra persona revisa el PR. **Nadie acepta (merge) su propio PR sin revisión.** Si hay comentarios, haz los cambios en la misma rama y vuelve a subir (`git push`): el PR se actualiza solo.

## Reglas que no se saltan

- **Nunca subir directamente a `main`** ni hacer `git push --force` a `main`.
- **Nunca subir `.env`**, contraseñas, claves ni archivos `.docx` de trabajo. Las claves van en `.env` (que no se sube) y se documentan en `.env.example`.
- Un PR = un issue. PRs pequeños se revisan rápido; PRs grandes se atascan.
- Los cambios en seguridad, permisos, modelos de datos, migraciones o configuración del servidor los revisa siempre el mantenedor antes de aceptarlos.

## Informar de un error

Crea un issue con:

- qué hiciste (pasos),
- qué esperabas que pasara,
- qué pasó (captura de pantalla si se puede),
- en qué dispositivo y navegador.

Etiqueta `bug`. No hace falta saber la causa.

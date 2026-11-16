!!! info "Translation"
    This page is a translation of the [Spanish version](../api/), which is the source of truth. If they differ, the Spanish version is correct.

# API

The REST API is built with Django REST Framework and lives under `/api/`. Routes are defined in `deporteca_project/lugares/urls.py` and views in `lugares/views.py`.

In development, open `http://127.0.0.1:8000/api/` in a browser to use DRF's **browsable API**.

!!! note "Permissions"
    The API is **closed by default**: only staff (`is_staff`) with a Django session can use it, except for routes marked *Public*. The API **doesn't create, edit or delete venues**: that happens in the Django admin (`/admin/`).

## Venues (`lugares`)

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/api/lugares/` | Public | List with filters (`LugarFilter`). Returns **all** venues, including non-publishable ones |
| GET | `/api/lugares/{id}/` | Public | Venue detail |
| GET | `/api/lugares/busqueda-avanzada/` | Public | **Main search** (see below) |
| GET | `/api/lugares/tipos-lugar/` | Public | Possible `tipo` values |
| GET | `/api/lugares/{id}/estado-publicacion/` | Admin | Whether the venue is publishable and what it's missing |
| GET | `/api/lugares/panel-estado/` | Admin | Publication status of every venue |
| GET | `/api/lugares/pendientes-aprobacion/` | Admin | Venues in `pending` |
| POST | `/api/lugares/{id}/aprobar/` | Admin | → `approved` |
| POST | `/api/lugares/{id}/rechazar/` | Admin | → `rejected` |
| POST | `/api/lugares/{id}/inactivar/` | Admin | → `inactive` |
| GET | `/api/lugares/estadisticas-busqueda/` | Admin | `SearchLog` statistics |

### `busqueda-avanzada`

Returns **publishable** venues only. Paginated response:

```json
{ "count": 3, "page": 1, "page_size": 20, "results": [ { "id": 1, "nombre": "…", "ofertas_deportivas": [ … ] } ] }
```

| Parameter | Type | Effect |
|---|---|---|
| `q` | text | Searches name, description and address. Sorted by relevance |
| `provincia_id`, `comunidad_autonoma_id` | id | Location |
| `tipo_lugar` | text | `gimnasio`, `piscina`, `centro`, `club_asociacion`, `otro` |
| `deporte_id`, `sexo_id`, `categoria_edad_id`, `tipo_competicion_id`, `tipo_servicio_oferta_id` | id | Sports-offer filters |
| `tipo_evento_id`, `con_eventos`, `sin_eventos` | id / `true` | Event filters |
| `latitud`, `longitud`, `radio_km` | number | Only venues inside the radius |
| `page`, `page_size` | number | Pagination (`page_size` max. 100, default 20) |
| `include_not_publishable` | `true` | Include non-publishable venues (only takes effect for admins) |

## Catalogues (read-only)

| Path | Content |
|---|---|
| `/api/deportes/` | Sports with icon |
| `/api/sexos/` | Sex options |
| `/api/categorias-edad/` | Age categories |
| `/api/tipos-competicion/` | Competition types |
| `/api/tipos-servicio-oferta/` | Service types |
| `/api/comunidades-autonomas/` | Autonomous communities |
| `/api/provincias/` | Provinces |
| `/api/tipos-evento/` | Event types |
| `/api/eventos/` | Events |
| `/api/servicios/` | Services. Public read; write is Admin only |

## Public forms (`POST` only)

| Path | Creates |
|---|---|
| `/api/contactos/` | An organisation request (`Contacto`) and sends an email notice |
| `/api/sugerencias/` | A place `Sugerencia` (suggestion) |

## Utilities

| Path | Description |
|---|---|
| `GET /api/address-suggestions/search/?query=…` | Up to 5 addresses with coordinates from Nominatim |

# API

La API REST está hecha con Django REST Framework y vive bajo `/api/`. Las rutas se definen en `deporteca_project/lugares/urls.py` y las vistas en `lugares/views.py`.

En desarrollo, abre `http://127.0.0.1:8000/api/` en el navegador para usar la **API navegable** de DRF.

!!! warning "Permisos"
    Los endpoints de escritura de `lugares` **no exigen autenticación** todavía (ver [Problemas conocidos](problemas-conocidos.md)). Los marcados como *Admin* exigen un usuario `is_staff` con sesión de Django.

## Lugares

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/lugares/` | Público | Listado con filtros (`LugarFilter`). Devuelve **todos** los lugares, también los no publicables |
| GET | `/api/lugares/{id}/` | Público | Detalle de un lugar |
| POST | `/api/lugares/` | Público ⚠️ | Crear lugar (`nombre` obligatorio) con sus `ofertas` |
| PUT / PATCH | `/api/lugares/{id}/` | Público ⚠️ | Editar lugar. Si se envía `ofertas`, se **reemplazan** todas |
| DELETE | `/api/lugares/{id}/` | Público ⚠️ | Borrar lugar |
| GET | `/api/lugares/busqueda-avanzada/` | Público | **Búsqueda principal** (ver abajo) |
| GET | `/api/lugares/tipos-lugar/` | Público | Valores posibles de `tipo` |
| GET | `/api/lugares/{id}/estado-publicacion/` | Público | Si el lugar es publicable y qué le falta |
| GET | `/api/lugares/panel-estado/` | Admin | Estado de publicación de todos los lugares |
| GET | `/api/lugares/pendientes-aprobacion/` | Admin | Lugares en `pending` |
| POST | `/api/lugares/{id}/aprobar/` | Admin | → `approved` |
| POST | `/api/lugares/{id}/rechazar/` | Admin | → `rejected` |
| POST | `/api/lugares/{id}/inactivar/` | Admin | → `inactive` |
| GET | `/api/lugares/estadisticas-busqueda/` | Admin | Estadísticas de `SearchLog` |

### `busqueda-avanzada`

Solo devuelve lugares **publicables**. Respuesta paginada:

```json
{ "count": 3, "page": 1, "page_size": 20, "results": [ { "id": 1, "nombre": "…", "ofertas_deportivas": [ … ] } ] }
```

| Parámetro | Tipo | Efecto |
|---|---|---|
| `q` | texto | Busca en nombre, descripción y dirección. Ordena por relevancia |
| `provincia_id`, `comunidad_autonoma_id` | id | Ubicación |
| `tipo_lugar` | texto | `gimnasio`, `piscina`, `centro`, `club_asociacion`, `otro` |
| `deporte_id`, `sexo_id`, `categoria_edad_id`, `tipo_competicion_id`, `tipo_servicio_oferta_id` | id | Filtros de oferta deportiva |
| `tipo_evento_id`, `con_eventos`, `sin_eventos` | id / `true` | Filtros de eventos |
| `latitud`, `longitud`, `radio_km` | número | Solo lugares dentro del radio |
| `page`, `page_size` | número | Paginación (`page_size` máx. 100, por defecto 20) |
| `include_not_publishable` | `true` | Incluir no publicables (solo tiene efecto para admin) |

### Formato de `ofertas` al crear o editar

```json
{
  "nombre": "Club Deportivo Norte",
  "tipo": "club_asociacion",
  "provincia_id": 1,
  "direccion": "Calle Mayor 1, Madrid",
  "ofertas": [
    { "deporte": "3", "tipo_servicio": "1", "tipo_competicion": "2", "sexos": ["1", "2"], "edades": ["4"] }
  ]
}
```

Cada combinación de `sexos` × `edades` se guarda como una `OfertaDeportiva` distinta.

## Catálogos (solo lectura)

| Ruta | Contenido |
|---|---|
| `/api/deportes/` | Deportes con icono |
| `/api/sexos/` | Opciones de sexo |
| `/api/categorias-edad/` | Categorías de edad |
| `/api/tipos-competicion/` | Tipos de competición |
| `/api/tipos-servicio-oferta/` | Tipos de servicio |
| `/api/comunidades-autonomas/` | Comunidades autónomas |
| `/api/provincias/` | Provincias |
| `/api/tipos-evento/` | Tipos de evento |
| `/api/eventos/` | Eventos |
| `/api/servicios/` | Servicios. Lectura pública; escritura solo Admin |

## Formularios públicos (solo `POST`)

| Ruta | Crea |
|---|---|
| `/api/contactos/` | Una solicitud de entidad (`Contacto`) y avisa por email |
| `/api/sugerencias/` | Una `Sugerencia` de lugar |

## Utilidades

| Ruta | Descripción |
|---|---|
| `GET /api/address-suggestions/search/?query=…` | Hasta 5 direcciones con coordenadas desde Nominatim |

# Problemas conocidos

Lista de problemas detectados en la revisión del código (octubre 2026), ordenados por prioridad. Cuando se resuelva uno, bórralo de aquí en el mismo cambio.

## 🔴 Antes de desplegar

### La API de lugares no exige autenticación

`LugarViewSet` usa `permission_classes = [AllowAny]`, así que **cualquiera** puede crear, editar o borrar lugares con `POST/PUT/PATCH/DELETE /api/lugares/`. Solo las acciones de administración (aprobar, rechazar, estadísticas…) exigen `IsAdminUser`.

Además, el panel de administración del frontend se muestra según un rol guardado en **Firestore**, pero llama a Django **sin enviar credenciales de Django**. Resultado: las acciones `IsAdminUser` fallan desde el frontend, y las de escritura funcionan para todo el mundo.

**Solución:** elegir un sistema de autenticación único (sesión/token de Django, o verificar el token de Firebase en Django), exigirlo en las escrituras y quitar la comprobación de rol en el cliente como única barrera.

### `/api/lugares/` lista también los no publicables

El listado y el detalle devuelven todos los lugares, incluidos `pending`, `rejected` e `inactive`. Solo `busqueda-avanzada` filtra por publicables.

### Las claves de Google necesitan restricciones

Las variables `REACT_APP_*` acaban en el JavaScript público. La clave de Google (Firebase + Places) tiene que estar restringida por dominio y por API en Google Cloud Console.

### Reglas de seguridad de Firestore

El frontend escribe en Firestore con login anónimo. Las reglas de seguridad no están en el repositorio. Hay que revisarlas en la consola de Firebase y guardarlas en el repo (`firestore.rules`).

## 🟠 Arquitectura

### Dos backends a la vez (Django y Firestore)

Ver la tabla en [Arquitectura](arquitectura.md#dos-backends-django-y-firestore). Consecuencias:

- El gestor de contenido del admin guarda deportes y otros catálogos en Firestore, pero la web los lee de Django: **los cambios no se ven**.
- `SuggestPlaceForm` guarda lugares completos en Firestore que nadie vuelve a leer.
- La suscripción a `lugares` de Firestore carga datos en `allLugares`, que no se usa.

**Decisión pendiente:** quedarse solo con Django (recomendado: ya contiene toda la lógica de negocio) y usar Firebase como mucho para auth y Storage, o al revés.

### `App.js` demasiado grande

Más de 1000 líneas con casi todo el estado y la lógica. La URL del backend se define en tres archivos (`App.js`, `LugarForm.jsx`, `EntityRegistrationModal.jsx`).

## 🟡 Errores y detalles

- **Activar un lugar no lo publica.** La acción "activar lugar vinculado" del admin pone `approved` pero no `suscripcion_activa`, así que el lugar sigue oculto hasta marcar la suscripción a mano.
- **Migración pendiente.** `makemigrations --check` detecta una migración sin crear para los modelos proxy (`ContactoPendiente`, `Lugar*`). No cambia tablas.
- **`lugares_django.json` no se puede cargar.** Tiene BOM de Windows al principio y usa un esquema antiguo (`tipo_competicion` como texto en vez de clave foránea).
- **`seed_demo_lugares` choca con `provincias_y_ccaa.json`.** Escribe "Cataluna" sin eñe y crea una provincia "Barcelona" duplicada.
- **Nominatim** se usa para autocompletado y geocodificación. Su política de uso no permite autocompletado ni uso intensivo; en producción hace falta otro proveedor o una instancia propia.
- **Errores internos expuestos.** Varios `except Exception` devuelven el texto del error al cliente.
- **Sin tests.** `lugares/tests.py` está vacío.
- **11 avisos de ESLint** en el frontend. En CI, `CI=true` hace que `npm run build` los trate como errores.
- **Scripts antiguos de Firestore.** `migrate_to_firestore.py`, `deporteca_frontend/populate_regions.py` y `addProvincias.js` son de la etapa Firebase y necesitan credenciales que no están en el repo.

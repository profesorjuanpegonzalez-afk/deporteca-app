# Deporteca

Deporteca es un buscador de servicios deportivos en España: clubes, asociaciones, gimnasios, piscinas y centros deportivos. El público busca por deporte, ubicación, sexo, categoría de edad o tipo de competición y ve los resultados en un mapa y en un listado. Las entidades se registran para aparecer en el buscador, y la administración revisa y aprueba cada alta.

## Componentes

| Carpeta | Qué es | Tecnología |
|---|---|---|
| `deporteca_frontend/` | Aplicación web pública y panel de administración | React 18 (Create React App), Tailwind CSS, Leaflet, Firebase JS SDK |
| `deporteca_project/` | API y base de datos | Django 5.2, Django REST Framework, django-filter, PostgreSQL |
| `docs/` | Esta documentación | Zensical |

## Estado del proyecto

El proyecto está en desarrollo y todavía no tiene despliegue en producción. Funciona en local con el backend en `http://127.0.0.1:8000` y el frontend en `http://localhost:3000`.

Antes de desplegarlo hay que resolver varios puntos importantes (autenticación de la API, decidir entre Django y Firestore como backend único, etc.). Están recogidos en [Problemas conocidos](problemas-conocidos.md).

## Por dónde empezar

- **Quiero arrancar el proyecto en mi máquina** → [Puesta en marcha](puesta-en-marcha.md)
- **Quiero entender cómo funciona** → [Arquitectura](arquitectura.md)
- **Quiero saber qué datos se guardan** → [Modelo de datos](modelo-de-datos.md)
- **Quiero entender cómo se da de alta una entidad** → [Ciclo de vida de una entidad](ciclo-de-vida-entidad.md)
- **Quiero llamar a la API** → [API](api.md)

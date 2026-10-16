# Sobre esta documentación

La documentación se genera con [Zensical](https://zensical.org/) y existe en dos idiomas:

| Contenido | Configuración | Idioma | Papel |
|---|---|---|---|
| `docs/es/` | `docs/zensical.toml` | Español | **Fuente de verdad** |
| `docs/en/` | `docs/zensical.en.toml` | Inglés | Espejo de la versión española |

## Regla de mantenimiento

1. **Siempre se edita primero el español** (`docs/es/`).
2. En el **mismo cambio**, se replica en inglés (`docs/en/`) el mismo contenido, en el archivo con el **mismo nombre**.
3. Si las dos versiones no coinciden, la española es la correcta.
4. Cada página en inglés empieza con un aviso que indica que es una traducción.

Los nombres de archivo son iguales en los dos idiomas (en español) para que sea fácil ver qué página corresponde a cuál.

## Compilar y previsualizar

Todos los comandos se ejecutan desde la carpeta `docs/`:

```bash
pip install zensical          # o: pipx install zensical
cd docs

# Previsualización con recarga automática
# (puerto 8001 para no chocar con Django en el 8000)
zensical serve -a localhost:8001
zensical serve -f zensical.en.toml -a localhost:8002

# Compilación completa: SIEMPRE primero español y después inglés
zensical build
zensical build -f zensical.en.toml
```

El resultado queda en `docs/site/` (español en la raíz, inglés en `docs/site/en/`). Esa carpeta está en `.gitignore`.

!!! warning "El orden importa"
    La compilación en español vacía `docs/site/`, incluida la carpeta `en/`. Si compilas el español después del inglés, la versión inglesa desaparece.

## Añadir una página

1. Crea `docs/es/mi-pagina.md` y añádela a `nav` en `docs/zensical.toml`.
2. Crea `docs/en/mi-pagina.md` con la traducción y el aviso de traducción, y añádela a `nav` en `docs/zensical.en.toml`.

Los diagramas se escriben en [Mermaid](https://mermaid.js.org/) dentro de bloques ` ```mermaid `.

## Tema

El tema es oscuro por defecto, con un botón (arriba a la derecha) para cambiar a claro. La elección se guarda en el navegador y se comparte entre los dos idiomas. Los archivos `stylesheets/theme-toggle.css` y `javascripts/theme-toggle.js` están **duplicados** en `es/` y `en/` (cada sitio solo ve su carpeta): si cambias uno, cambia también el otro. Solo difieren en los textos del botón.

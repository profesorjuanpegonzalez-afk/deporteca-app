!!! info "Translation"
    This page is a translation of the [Spanish version](../documentacion/), which is the source of truth. If they differ, the Spanish version is correct.

# About these docs

The documentation is generated with [Zensical](https://zensical.org/) and exists in two languages:

| Content | Config | Language | Role |
|---|---|---|---|
| `docs/es/` | `docs/zensical.toml` | Spanish | **Source of truth** |
| `docs/en/` | `docs/zensical.en.toml` | English | Mirror of the Spanish version |

## Maintenance rule

1. **Always edit the Spanish version first** (`docs/es/`).
2. In the **same change**, mirror the same content in English (`docs/en/`), in the file with the **same name**.
3. If the two versions disagree, the Spanish one is correct.
4. Every English page starts with a notice saying it is a translation.

File names are the same in both languages (in Spanish) so it's easy to see which page matches which.

## Build and preview

Run every command from the `docs/` folder:

```bash
pip install zensical          # or: pipx install zensical
cd docs

# Live-reloading preview
# (port 8001 so it doesn't clash with Django on 8000)
zensical serve -a localhost:8001
zensical serve -f zensical.en.toml -a localhost:8002

# Full build: ALWAYS Spanish first, then English
zensical build
zensical build -f zensical.en.toml
```

The output goes to `docs/site/` (Spanish at the root, English in `docs/site/en/`). That folder is in `.gitignore`.

!!! warning "Order matters"
    The Spanish build empties `docs/site/`, including the `en/` folder. If you build Spanish after English, the English version disappears.

## Adding a page

1. Create `docs/es/my-page.md` and add it to `nav` in `docs/zensical.toml`.
2. Create `docs/en/my-page.md` with the translation and the translation notice, and add it to `nav` in `docs/zensical.en.toml`.

Diagrams are written in [Mermaid](https://mermaid.js.org/) inside ` ```mermaid ` blocks.

## Theme

The theme is dark by default, with a button (top right) to switch to light. The choice is stored in the browser and shared between both languages. `stylesheets/theme-toggle.css` and `javascripts/theme-toggle.js` are **duplicated** in `es/` and `en/` (each site only sees its own folder): if you change one, change the other too. They only differ in the button labels.

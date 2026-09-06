# deporteca_project/deporteca_project/urls.py
from django.contrib import admin # type: ignore
from django.urls import path, include # type: ignore
from django.conf import settings # type: ignore # Importar settings para servir archivos de media
from django.conf.urls.static import static # type: ignore # Importar static para servir archivos de media

# --- ELIMINADO: DefaultRouter y router.register() de aquí ---
# Estas configuraciones deben estar en lugares/urls.py

urlpatterns = [
    path('admin/', admin.site.urls),
    # --- CAMBIO CLAVE AQUÍ: Incluir las URLs de la app 'lugares' bajo el prefijo 'api/' ---
    # Esto asume que 'lugares/urls.py' ya no tiene el prefijo 'api/' y solo define las rutas del router.
    path('api/', include('lugares.urls')),
]

# Servir archivos de medios durante el desarrollo (esto sí va en el urls.py principal)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

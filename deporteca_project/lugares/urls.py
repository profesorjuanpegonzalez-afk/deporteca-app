# deporteca_project/lugares/urls.py
from django.urls import path, include # pyright: ignore[reportMissingModuleSource]
from rest_framework.routers import DefaultRouter # pyright: ignore[reportMissingImports]
from lugares.views import (
    LugarViewSet, DeporteViewSet, SexoViewSet, CategoriaEdadViewSet,
    ComunidadAutonomaViewSet, ProvinciaViewSet, AddressSuggestionView,
    TipoEventoViewSet, EventoViewSet,
    # ¡Nuevos ViewSets importados!
    ServicioViewSet, ContactoViewSet, SugerenciaViewSet,
    TipoCompeticionViewSet, TipoServicioOfertaViewSet
)

router = DefaultRouter()
router.register(r'lugares', LugarViewSet)
router.register(r'deportes', DeporteViewSet)
router.register(r'sexos', SexoViewSet)
router.register(r'categorias-edad', CategoriaEdadViewSet)
router.register(r'tipos-competicion', TipoCompeticionViewSet)
router.register(r'tipos-servicio-oferta', TipoServicioOfertaViewSet)
router.register(r'comunidades-autonomas', ComunidadAutonomaViewSet)
router.register(r'provincias', ProvinciaViewSet)
router.register(r'address-suggestions', AddressSuggestionView, basename='address-suggestions')
router.register(r'tipos-evento', TipoEventoViewSet)
router.register(r'eventos', EventoViewSet)

# ¡Registrando los nuevos ViewSets!
router.register(r'servicios', ServicioViewSet)
router.register(r'contactos', ContactoViewSet)
router.register(r'sugerencias', SugerenciaViewSet)


# Las URLs de esta aplicación se incluirán bajo un prefijo en el urls.py principal
urlpatterns = [
    path('', include(router.urls)), # Aquí no hay prefijo 'api/', se añade en el urls.py principal
]

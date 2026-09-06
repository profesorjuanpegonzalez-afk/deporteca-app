import django_filters
from django.db.models import Q
from geopy.distance import geodesic
from geopy.point import Point
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

from .models import Lugar, OfertaDeportiva, Deporte, Sexo, CategoriaEdad, Provincia, ComunidadAutonoma, TipoEvento, Evento # Importar Evento y TipoEvento

class LugarFilter(django_filters.FilterSet):
    # Filtros de búsqueda directa (sin cambios)
    provincia = django_filters.CharFilter(
        field_name='provincia__nombre',
        lookup_expr='icontains',
        help_text="Filtra lugares por el nombre de la provincia. Ej: /api/lugares/?provincia=madrid"
    )
    provincia_id = django_filters.NumberFilter(
        field_name='provincia__id',
        help_text="Filtra lugares por el ID de la provincia. Ej: /api/lugares/?provincia_id=28"
    )
    comunidad_autonoma = django_filters.CharFilter(
        field_name='comunidad_autonoma__nombre',
        lookup_expr='icontains',
        help_text="Filtra lugares por el nombre de la comunidad autónoma. Ej: /api/lugares/?comunidad_autonoma=andalucia"
    )
    comunidad_autonoma_id = django_filters.NumberFilter(
        field_name='comunidad_autonoma__id',
        help_text="Filtra lugares por el ID de la comunidad autónoma. Ej: /api/lugares/?comunidad_autonoma_id=13"
    )
    nombre = django_filters.CharFilter(
        field_name='nombre',
        lookup_expr='icontains',
        help_text="Filtra lugares por el nombre del lugar (búsqueda parcial). Ej: /api/lugares/?nombre=polideportivo"
    )

    # Filtros para oferta deportiva (sin cambios)
    deporte_id = django_filters.NumberFilter(
        field_name='ofertas_deportivas__deporte__id',
        distinct=True,
        help_text="Filtra lugares por el ID del deporte ofrecido. Ej: /api/lugares/?deporte_id=1 (Baloncesto)"
    )
    sexo_id = django_filters.NumberFilter(
        field_name='ofertas_deportivas__sexo_permitido__id',
        distinct=True,
        help_text="Filtra lugares por el ID del sexo permitido en la oferta. Ej: /api/lugares/?sexo_id=1 (Masculino)"
    )
    categoria_edad_id = django_filters.NumberFilter(
        field_name='ofertas_deportivas__categoria_edad__id',
        distinct=True,
        help_text="Filtra lugares por el ID de la categoría de edad en la oferta. Ej: /api/lugares/?categoria_edad_id=11 (Sénior)"
    )
    tipo_competicion_id = django_filters.NumberFilter(
        field_name='ofertas_deportivas__tipo_competicion__id',
        distinct=True,
        help_text="Filtra lugares por el ID del tipo de competición. Ej: /api/lugares/?tipo_competicion_id=1"
    )
    tipo_servicio_oferta_id = django_filters.NumberFilter(
        field_name='ofertas_deportivas__tipo_servicio__id',
        distinct=True,
        help_text="Filtra lugares por el ID del tipo de servicio deportivo. Ej: /api/lugares/?tipo_servicio_oferta_id=1"
    )

    # Filtros para la ubicación (sin cambios)
    latitud = django_filters.NumberFilter(
        method='filter_by_radius',
        help_text="Latitud del punto central para el filtro de radio."
    )
    longitud = django_filters.NumberFilter(
        method='filter_by_radius',
        help_text="Longitud del punto central para el filtro de radio."
    )
    radio_km = django_filters.NumberFilter(
        method='filter_by_radius',
        help_text="Radio en kilómetros para el filtro de proximidad."
    )
    address_query = django_filters.CharFilter(
        method='filter_by_radius',
        help_text="Dirección de texto para geocodificar y usar como punto central del filtro de radio."
    )

    # --- NUEVO FILTRO PARA TIPO DE EVENTO ---
    tipo_evento_id = django_filters.NumberFilter(
        field_name='eventos__tipo_evento__id',
        distinct=True,
        help_text="Filtra lugares por el ID del tipo de evento asociado. Ej: /api/lugares/?tipo_evento_id=1"
    )
    # --- FIN NUEVO FILTRO ---

    class Meta:
        model = Lugar
        fields = [
            'nombre', 'provincia', 'provincia_id', 'comunidad_autonoma', 'comunidad_autonoma_id',
            'deporte_id', 'sexo_id', 'categoria_edad_id', 'tipo_competicion_id', 'tipo_servicio_oferta_id',
            'latitud', 'longitud', 'radio_km', 'address_query',
            'tipo_evento_id', # Añadir el nuevo filtro aquí
        ]

    def filter_by_radius(self, queryset, name, value):
        user_lat = self.data.get('latitud')
        user_lon = self.data.get('longitud')
        radius_km = self.data.get('radio_km')
        address_query = self.data.get('address_query')

        user_point = None
        current_radius_km = None

        if address_query and radius_km:
            try:
                geolocator = Nominatim(user_agent="deporteca-app")
                location = geolocator.geocode(address_query, timeout=5)
                if location:
                    user_point = Point(location.latitude, location.longitude)
                    current_radius_km = float(radius_km)
                else:
                    print(f"Advertencia: Dirección '{address_query}' no encontrada. No se aplicará filtro de radio.")
                    return queryset
            except (GeocoderTimedOut, GeocoderServiceError, ValueError, TypeError) as e:
                print(f"Error geocodificando la dirección '{address_query}': {e}. No se aplicará filtro de radio.")
                return queryset
        elif user_lat and user_lon and radius_km:
            try:
                user_point = Point(float(user_lat), float(user_lon))
                current_radius_km = float(radius_km)
            except (ValueError, TypeError):
                print("Advertencia: Latitud/Longitud/Radio no son números válidos. No se aplicará filtro de radio.")
                return queryset
        else:
            return queryset

        filtered_lugares_ids = []
        for lugar in queryset: 
            if lugar.latitud is not None and lugar.longitud is not None:
                lugar_point = Point(lugar.latitud, lugar.longitud)
                distance = geodesic(user_point, lugar_point).km
                if distance <= current_radius_km:
                    filtered_lugares_ids.append(lugar.id)
        
        return queryset.filter(id__in=filtered_lugares_ids).distinct()
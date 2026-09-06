# your_app/serializers.py (ej. deporteca_api/serializers.py)

from rest_framework import serializers # type: ignore
from geopy.distance import geodesic # type: ignore
from geopy.point import Point # type: ignore
from geopy.geocoders import Nominatim # type: ignore
from geopy.exc import GeocoderTimedOut, GeocoderServiceError # type: ignore

from .models import (
    Lugar, Deporte, Sexo, CategoriaEdad,
    ComunidadAutonoma, Provincia, OfertaDeportiva,
    TipoEvento, Evento, # Modelos de eventos
    Servicio, Contacto, Sugerencia,
    TipoCompeticion, TipoServicioOferta
)

# Serializadores para los modelos de apoyo
class DeporteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deporte
        fields = ['id', 'nombre', 'icon_image', 'icon_url']

class SexoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sexo
        fields = ['id', 'opcion']

class CategoriaEdadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaEdad
        fields = ['id', 'nombre']

class TipoCompeticionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoCompeticion
        fields = ['id', 'nombre']

class TipoServicioOfertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoServicioOferta
        fields = ['id', 'nombre']

class ComunidadAutonomaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComunidadAutonoma
        fields = ['id', 'nombre']

class ProvinciaSerializer(serializers.ModelSerializer):
    comunidad_autonoma = ComunidadAutonomaSerializer(read_only=True)
    class Meta:
        model = Provincia
        fields = ['id', 'nombre', 'comunidad_autonoma']

class OfertaDeportivaSerializer(serializers.ModelSerializer):
    deporte = DeporteSerializer(read_only=True)
    categoria_edad = CategoriaEdadSerializer(read_only=True)
    sexo_permitido = SexoSerializer(read_only=True)
    tipo_competicion = TipoCompeticionSerializer(read_only=True)
    tipo_servicio = TipoServicioOfertaSerializer(read_only=True)

    class Meta:
        model = OfertaDeportiva
        fields = [
            'id', 'deporte', 'categoria_edad', 'sexo_permitido',
            'tipo_competicion', 'tipo_servicio', 'activa'
        ]

# --- SERIALIZADORES PARA EVENTOS ---
class TipoEventoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoEvento
        fields = ['id', 'nombre']

class EventoSerializer(serializers.ModelSerializer):
    tipo_evento = TipoEventoSerializer(read_only=True) # Incluir los detalles del tipo de evento

    class Meta:
        model = Evento
        fields = [
            'id', 'titulo', 'link_noticia', 'descripcion',
            'fecha_inicio', 'fecha_fin', 'tipo_evento', 'precio', 'es_gratuito'
        ]
# --- FIN SERIALIZADORES DE EVENTOS ---


# --- ¡NUEVOS SERIALIZADORES PARA LA APLICACIÓN REACT! ---

class ServicioSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Servicio.
    """
    class Meta:
        model = Servicio
        fields = ['id', 'nombre', 'descripcion']

class ContactoSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Contacto.
    """
    class Meta:
        model = Contacto
        fields = [
            'id',
            'name',
            'email',
            'entidad',
            'cif',
            'telefono',
            'web',
            'instagram_link',
            'x_link',
            'tipo_lugar',
            'comunidad_autonoma',
            'provincia',
            'direccion',
            'latitud',
            'longitud',
            'presentacion',
            'subject',
            'message',
            'estado_solicitud',
            'lugar_vinculado',
            'created_at',
        ]
        read_only_fields = ['created_at', 'estado_solicitud', 'lugar_vinculado']

class SugerenciaSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Sugerencia.
    """
    class Meta:
        model = Sugerencia
        fields = ['id', 'name', 'address', 'description', 'created_at']
        read_only_fields = ['created_at'] # El campo created_at se genera automáticamente

# --- FIN NUEVOS SERIALIZADORES ---


# Serializador principal para Lugar (MODIFICADO para incluir eventos y servicios)
class LugarSerializer(serializers.ModelSerializer):
    comunidad_autonoma = ComunidadAutonomaSerializer(read_only=True)
    provincia = ProvinciaSerializer(read_only=True)
    ofertas_deportivas = serializers.SerializerMethodField()
    distance_from_query_point = serializers.SerializerMethodField()

    # Incluir eventos relacionados
    eventos = serializers.SerializerMethodField()

    # ¡NUEVO CAMPO! Incluir servicios relacionados
    # Usamos ServicioSerializer para mostrar los detalles completos de cada servicio
    servicios = ServicioSerializer(many=True, read_only=True)
    puede_publicar_contenido = serializers.SerializerMethodField()
    avisos_publicacion = serializers.SerializerMethodField()

    class Meta:
        model = Lugar
        fields = [
            'id', 'nombre', 'cif', 'estado_aprobacion', 'descripcion', 'direccion',
            'comunidad_autonoma', 'provincia',
            'latitud', 'longitud',
            'telefono', 'web', 'instagram_link', 'x_link',
            'email',
            'logo',
            'logo_url',
            'ofertas_deportivas',
            'distance_from_query_point',
            'eventos',
            'servicios', # Añadir el nuevo campo aquí
            'tipo',       # Añadir el campo 'tipo'
            'accesible',   # Añadir el campo 'accesible'
            'suscripcion_activa',
            'requiere_documentacion',
            'motivo_documentacion',
            'puede_publicar_contenido',
            'avisos_publicacion',
        ]

    def get_puede_publicar_contenido(self, obj):
        return obj.puede_publicar_contenido

    def get_avisos_publicacion(self, obj):
        return obj.avisos_publicacion

    def get_ofertas_deportivas(self, obj):
        if not obj.puede_publicar_contenido:
            return []
        queryset = obj.ofertas_deportivas.filter(activa=True)
        return OfertaDeportivaSerializer(queryset, many=True, context=self.context).data

    def get_eventos(self, obj):
        if not obj.puede_publicar_contenido:
            return []
        queryset = obj.eventos.all()
        return EventoSerializer(queryset, many=True, context=self.context).data

    def get_distance_from_query_point(self, obj):
        request = self.context.get('request')
        if not request:
            return None

        user_lat_param = request.query_params.get('latitud')
        user_lon_param = request.query_params.get('longitud')
        address_query_param = request.query_params.get('address_query')

        user_point = None

        if address_query_param:
            try:
                geolocator = Nominatim(user_agent="deporteca-app")
                location = geolocator.geocode(address_query_param, timeout=5)
                if location:
                    user_point = Point(location.latitude, location.longitude)
                else:
                    return None
            except (GeocoderTimedOut, GeocoderServiceError, ValueError, TypeError):
                return None
        elif user_lat_param and user_lon_param:
            try:
                user_point = Point(float(user_lat_param), float(user_lon_param))
            except (ValueError, TypeError):
                return None

        if user_point and obj.latitud is not None and obj.longitud is not None:
            lugar_point = Point(obj.latitud, obj.longitud)
            distance = geodesic(user_point, lugar_point).km
            return round(distance, 2)

        return None
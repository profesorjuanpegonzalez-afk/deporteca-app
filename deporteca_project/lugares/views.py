from rest_framework import viewsets, status # pyright: ignore[reportMissingImports]
from rest_framework.response import Response # pyright: ignore[reportMissingImports]
from rest_framework.decorators import action # pyright: ignore[reportMissingImports]
from rest_framework.permissions import AllowAny, IsAdminUser
from django.db.models import Q
from django.db.models import Case, When, Value, IntegerField, Count
from django.db.models.functions import TruncDate
from geopy.geocoders import Nominatim # pyright: ignore[reportMissingImports]
from geopy.exc import GeocoderTimedOut, GeocoderServiceError # pyright: ignore[reportMissingImports]
from geopy.distance import geodesic # pyright: ignore[reportMissingImports]

from .models import (
    Lugar, Deporte, Sexo, CategoriaEdad,
    ComunidadAutonoma, Provincia,
    TipoEvento, Evento,
    Servicio, Contacto, Sugerencia,
    TipoCompeticion, TipoServicioOferta, SearchLog
)
from .serializers import (
    LugarSerializer, DeporteSerializer, SexoSerializer, CategoriaEdadSerializer,
    ComunidadAutonomaSerializer, ProvinciaSerializer,
    TipoEventoSerializer, EventoSerializer,
    ServicioSerializer, ContactoSerializer, SugerenciaSerializer,
    TipoCompeticionSerializer, TipoServicioOfertaSerializer
)
from .filters import LugarFilter

class LugarViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Lugares: lectura pública, acciones de administración solo para el personal.
    La API no crea, edita ni borra lugares: eso se hace en el admin de Django (/admin/).
    """
    queryset = Lugar.objects.all()
    serializer_class = LugarSerializer
    filterset_class = LugarFilter
    permission_classes = [AllowAny]

    @action(detail=True, methods=['get'], url_path='estado-publicacion', permission_classes=[IsAdminUser])
    def estado_publicacion(self, request, pk=None):
        lugar = self.get_object()
        return Response({
            'id': lugar.id,
            'nombre': lugar.nombre,
            'estado_aprobacion': lugar.estado_aprobacion,
            'cif': lugar.cif,
            'suscripcion_activa': lugar.suscripcion_activa,
            'requiere_documentacion': lugar.requiere_documentacion,
            'motivo_documentacion': lugar.motivo_documentacion,
            'puede_publicar_contenido': lugar.puede_publicar_contenido,
            'avisos_publicacion': lugar.avisos_publicacion,
        })

    @action(detail=False, methods=['get'], url_path='panel-estado', permission_classes=[IsAdminUser])
    def panel_estado(self, request):
        data = []
        for lugar in Lugar.objects.all().order_by('nombre'):
            data.append({
                'id': lugar.id,
                'nombre': lugar.nombre,
                'estado_aprobacion': lugar.estado_aprobacion,
                'cif': lugar.cif,
                'suscripcion_activa': lugar.suscripcion_activa,
                'requiere_documentacion': lugar.requiere_documentacion,
                'motivo_documentacion': lugar.motivo_documentacion,
                'puede_publicar_contenido': lugar.puede_publicar_contenido,
                'avisos_publicacion': lugar.avisos_publicacion,
            })
        return Response(data)

    @action(detail=False, methods=['get'], url_path='pendientes-aprobacion', permission_classes=[IsAdminUser])
    def pendientes_aprobacion(self, request):
        qs = Lugar.objects.filter(estado_aprobacion='pending').order_by('nombre')
        return Response(LugarSerializer(qs, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='aprobar', permission_classes=[IsAdminUser])
    def aprobar(self, request, pk=None):
        lugar = self.get_object()
        lugar.estado_aprobacion = 'approved'
        lugar.save(update_fields=['estado_aprobacion'])
        return Response({'ok': True, 'estado_aprobacion': lugar.estado_aprobacion})

    @action(detail=True, methods=['post'], url_path='rechazar', permission_classes=[IsAdminUser])
    def rechazar(self, request, pk=None):
        lugar = self.get_object()
        lugar.estado_aprobacion = 'rejected'
        lugar.save(update_fields=['estado_aprobacion'])
        return Response({'ok': True, 'estado_aprobacion': lugar.estado_aprobacion})

    @action(detail=True, methods=['post'], url_path='inactivar', permission_classes=[IsAdminUser])
    def inactivar(self, request, pk=None):
        lugar = self.get_object()
        lugar.estado_aprobacion = 'inactive'
        lugar.save(update_fields=['estado_aprobacion'])
        return Response({'ok': True, 'estado_aprobacion': lugar.estado_aprobacion})

    @action(detail=False, methods=['get'], url_path='busqueda-avanzada')
    def busqueda_avanzada(self, request):
        """
        Endpoint principal de busqueda para frontend.
        Combina q (nombre) con filtros exactos de oferta deportiva y ubicacion.
        """
        qs = Lugar.objects.all()

        def parse_int(value):
            try:
                return int(value) if value not in (None, '') else None
            except (TypeError, ValueError):
                return None

        q = request.query_params.get('q')
        provincia_id = parse_int(request.query_params.get('provincia_id'))
        comunidad_autonoma_id = parse_int(request.query_params.get('comunidad_autonoma_id'))
        deporte_id = parse_int(request.query_params.get('deporte_id'))
        sexo_id = parse_int(request.query_params.get('sexo_id'))
        categoria_edad_id = parse_int(request.query_params.get('categoria_edad_id'))
        tipo_evento_id = parse_int(request.query_params.get('tipo_evento_id'))
        tipo_competicion_id = parse_int(request.query_params.get('tipo_competicion_id'))
        tipo_servicio_oferta_id = parse_int(request.query_params.get('tipo_servicio_oferta_id'))
        con_eventos = request.query_params.get('con_eventos', 'false').lower() == 'true'
        sin_eventos = request.query_params.get('sin_eventos', 'false').lower() == 'true'
        tipo_lugar = request.query_params.get('tipo_lugar')
        latitud = request.query_params.get('latitud')
        longitud = request.query_params.get('longitud')
        radio_km = request.query_params.get('radio_km')

        page = max(parse_int(request.query_params.get('page')) or 1, 1)
        page_size = parse_int(request.query_params.get('page_size')) or 20
        page_size = max(min(page_size, 100), 1)

        include_not_publishable = request.query_params.get('include_not_publishable', 'false').lower() == 'true'

        if q:
            qs = qs.annotate(
                relevance=Case(
                    When(nombre__istartswith=q, then=Value(3)),
                    When(nombre__icontains=q, then=Value(2)),
                    When(descripcion__icontains=q, then=Value(1)),
                    When(direccion__icontains=q, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            ).filter(Q(nombre__icontains=q) | Q(descripcion__icontains=q) | Q(direccion__icontains=q))

        if provincia_id:
            qs = qs.filter(provincia_id=provincia_id)

        if comunidad_autonoma_id:
            qs = qs.filter(comunidad_autonoma_id=comunidad_autonoma_id)

        if tipo_lugar:
            qs = qs.filter(tipo=tipo_lugar)

        # Filtros exactos de oferta deportiva (interseccion estricta)
        if deporte_id:
            qs = qs.filter(ofertas_deportivas__deporte_id=deporte_id)
        if sexo_id:
            qs = qs.filter(ofertas_deportivas__sexo_permitido_id=sexo_id)
        if categoria_edad_id:
            qs = qs.filter(ofertas_deportivas__categoria_edad_id=categoria_edad_id)
        if tipo_evento_id:
            qs = qs.filter(eventos__tipo_evento_id=tipo_evento_id)
        if con_eventos:
            qs = qs.filter(eventos__isnull=False)
        if sin_eventos and not con_eventos:
            qs = qs.filter(eventos__isnull=True)
        if tipo_competicion_id:
            qs = qs.filter(ofertas_deportivas__tipo_competicion_id=tipo_competicion_id)
        if tipo_servicio_oferta_id:
            qs = qs.filter(ofertas_deportivas__tipo_servicio_id=tipo_servicio_oferta_id)

        qs = qs.distinct().order_by('-relevance', 'nombre') if q else qs.distinct().order_by('nombre')

        if latitud and longitud and radio_km:
            try:
                origin = (float(latitud), float(longitud))
                max_km = float(radio_km)
                qs = [
                    l for l in qs
                    if l.latitud is not None and l.longitud is not None
                    and geodesic(origin, (float(l.latitud), float(l.longitud))).km <= max_km
                ]
            except (TypeError, ValueError):
                pass

        if not include_not_publishable:
            qs = [l for l in qs if l.puede_publicar_contenido]
        elif include_not_publishable and not (request.user and request.user.is_staff):
            # Seguridad: solo admin puede incluir no publicables.
            qs = [l for l in qs if l.puede_publicar_contenido]

        total_count = len(qs)
        start = (page - 1) * page_size
        end = start + page_size
        paged_qs = qs[start:end]

        SearchLog.objects.create(
            user=request.user if request.user and request.user.is_authenticated else None,
            query=q,
            provincia_id=provincia_id,
            comunidad_autonoma_id=comunidad_autonoma_id,
            deporte_id=deporte_id,
            sexo_id=sexo_id,
            categoria_edad_id=categoria_edad_id,
            tipo_competicion_id=tipo_competicion_id,
            tipo_servicio_oferta_id=tipo_servicio_oferta_id,
            result_count=total_count,
        )

        serializer = LugarSerializer(paged_qs, many=True, context={'request': request})
        return Response({
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'results': serializer.data,
        })

    @action(detail=False, methods=['get'], url_path='estadisticas-busqueda', permission_classes=[IsAdminUser])
    def estadisticas_busqueda(self, request):
        if not (request.user and request.user.is_authenticated and request.user.is_staff):
            return Response({'detail': 'No tienes permisos para ver estas estadisticas.'}, status=status.HTTP_403_FORBIDDEN)

        top_provincias = list(
            SearchLog.objects.exclude(provincia=None)
            .values('provincia__id', 'provincia__nombre')
            .annotate(total=Count('id'))
            .order_by('-total')[:10]
        )
        top_deportes = list(
            SearchLog.objects.exclude(deporte=None)
            .values('deporte__id', 'deporte__nombre')
            .annotate(total=Count('id'))
            .order_by('-total')[:10]
        )
        top_tipos_servicio = list(
            SearchLog.objects.exclude(tipo_servicio_oferta=None)
            .values('tipo_servicio_oferta__id', 'tipo_servicio_oferta__nombre')
            .annotate(total=Count('id'))
            .order_by('-total')[:10]
        )
        top_categorias = list(
            SearchLog.objects.exclude(categoria_edad=None)
            .values('categoria_edad__id', 'categoria_edad__nombre')
            .annotate(total=Count('id'))
            .order_by('-total')[:10]
        )
        top_sexos = list(
            SearchLog.objects.exclude(sexo=None)
            .values('sexo__id', 'sexo__opcion')
            .annotate(total=Count('id'))
            .order_by('-total')[:10]
        )
        top_queries = list(
            SearchLog.objects.exclude(query__isnull=True)
            .exclude(query__exact='')
            .values('query')
            .annotate(total=Count('id'))
            .order_by('-total')[:10]
        )
        busquedas_por_dia = list(
            SearchLog.objects.annotate(dia=TruncDate('created_at'))
            .values('dia')
            .annotate(total=Count('id'))
            .order_by('dia')
        )

        serie_diaria = [
            {'dia': item['dia'].isoformat() if item['dia'] else None, 'total': item['total']}
            for item in busquedas_por_dia
        ]

        return Response({
            'total_busquedas': SearchLog.objects.count(),
            'top_provincias': top_provincias,
            'top_deportes': top_deportes,
            'top_tipos_servicio': top_tipos_servicio,
            'top_categorias_edad': top_categorias,
            'top_sexos': top_sexos,
            'top_queries': top_queries,
            'serie_diaria': serie_diaria,
        })

    @action(detail=False, methods=['get'], url_path='tipos-lugar')
    def tipos_lugar(self, request):
        tipos = [{'id': value, 'nombre': label} for value, label in Lugar.TIPO_CHOICES]
        return Response(tipos)

class DeporteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar y recuperar detalles de Deportes.
    """
    queryset = Deporte.objects.all()
    serializer_class = DeporteSerializer
    permission_classes = [AllowAny]

class SexoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar y recuperar detalles de opciones de Sexo.
    """
    queryset = Sexo.objects.all()
    serializer_class = SexoSerializer
    permission_classes = [AllowAny]

class CategoriaEdadViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar y recuperar detalles de Categorías de Edad.
    """
    queryset = CategoriaEdad.objects.all()
    serializer_class = CategoriaEdadSerializer
    permission_classes = [AllowAny]

class TipoCompeticionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TipoCompeticion.objects.all()
    serializer_class = TipoCompeticionSerializer
    permission_classes = [AllowAny]

class TipoServicioOfertaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TipoServicioOferta.objects.all()
    serializer_class = TipoServicioOfertaSerializer
    permission_classes = [AllowAny]

class ComunidadAutonomaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar y recuperar detalles de Comunidades Autónomas.
    """
    queryset = ComunidadAutonoma.objects.all()
    serializer_class = ComunidadAutonomaSerializer
    permission_classes = [AllowAny]

class ProvinciaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar y recuperar detalles de Provincias.
    """
    queryset = Provincia.objects.all()
    serializer_class = ProvinciaSerializer
    permission_classes = [AllowAny]

class AddressSuggestionView(viewsets.ViewSet):
    """
    Vista para obtener sugerencias de dirección utilizando Nominatim.
    """
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('query', '')
        if not query:
            return Response({"error": "Parámetro 'query' es requerido."}, status=status.HTTP_400_BAD_REQUEST)

        geolocator = Nominatim(user_agent="deporteca-app")
        try:
            # Limitar a 5 resultados para eficiencia y relevancia
            locations = geolocator.geocode(query, exactly_one=False, limit=5, timeout=5)

            if locations:
                suggestions = []
                for loc in locations:
                    suggestions.append({
                        "address": loc.address,
                        "latitude": loc.latitude,
                        "longitude": loc.longitude
                    })
                return Response(suggestions)
            else:
                return Response([]) # Devolver una lista vacía si no hay resultados
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            return Response(
                {"error": f"Error en el servicio de geocodificación: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {"error": f"Error inesperado: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TipoEventoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar y recuperar detalles de Tipos de Evento.
    """
    queryset = TipoEvento.objects.all()
    serializer_class = TipoEventoSerializer
    permission_classes = [AllowAny]

class EventoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar y recuperar detalles de Eventos.
    """
    queryset = Evento.objects.all()
    serializer_class = EventoSerializer
    permission_classes = [AllowAny]

class ServicioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para listar y recuperar detalles de Servicios.
    """
    queryset = Servicio.objects.all()
    serializer_class = ServicioSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]

class ContactoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para crear y gestionar entradas de Contacto.
    Permite crear (POST), listar (GET), recuperar (GET por ID),
    actualizar (PUT/PATCH) y eliminar (DELETE) contactos.
    """
    queryset = Contacto.objects.all()
    serializer_class = ContactoSerializer
    http_method_names = ['post']
    permission_classes = [AllowAny]  # formulario público

    def list(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


class SugerenciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para crear y gestionar entradas de Sugerencia.
    Permite crear (POST), listar (GET), recuperar (GET por ID),
    actualizar (PUT/PATCH) y eliminar (DELETE) sugerencias.
    """
    queryset = Sugerencia.objects.all()
    serializer_class = SugerenciaSerializer
    http_method_names = ['post']
    permission_classes = [AllowAny]  # formulario público

    def list(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

from unittest import mock

from django.contrib.auth import get_user_model
from rest_framework import status
from geopy.exc import GeocoderServiceError
from rest_framework.test import APITestCase

from .filters import LugarFilter
from .models import Lugar


class LugarApiSoloLecturaTests(APITestCase):
    """La API de lugares es de solo lectura; se gestionan en el admin de Django (#9)."""

    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.staff = User.objects.create_user('personal', password='x', is_staff=True)
        cls.usuario = User.objects.create_user('usuario', password='x')
        cls.lugar = Lugar.objects.create(nombre='Club de prueba')

    def _escrituras(self):
        lista = '/api/lugares/'
        detalle = f'/api/lugares/{self.lugar.id}/'
        return [
            ('post', lista),
            ('put', detalle),
            ('patch', detalle),
            ('delete', detalle),
        ]

    def _comprobar_sin_escritura(self, esperado):
        for metodo, url in self._escrituras():
            with self.subTest(metodo=metodo):
                respuesta = getattr(self.client, metodo)(url, {'nombre': 'Cambiado'}, format='json')
                self.assertEqual(respuesta.status_code, esperado)
        self.assertTrue(Lugar.objects.filter(pk=self.lugar.pk, nombre='Club de prueba').exists())
        self.assertEqual(Lugar.objects.count(), 1)

    def test_anonimo_no_puede_escribir(self):
        self._comprobar_sin_escritura(status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_usuario_normal_no_puede_escribir(self):
        self.client.force_authenticate(self.usuario)
        self._comprobar_sin_escritura(status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_personal_tampoco_escribe_por_la_api(self):
        self.client.force_authenticate(self.staff)
        self._comprobar_sin_escritura(status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_lectura_publica(self):
        for url in [
            '/api/lugares/',
            f'/api/lugares/{self.lugar.id}/',
            '/api/lugares/busqueda-avanzada/',
            '/api/lugares/tipos-lugar/',
            '/api/deportes/',
            '/api/provincias/',
        ]:
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)


class AccionesAdminTests(APITestCase):
    """Las acciones de administración siguen funcionando solo para el personal."""

    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.staff = User.objects.create_user('personal', password='x', is_staff=True)
        cls.usuario = User.objects.create_user('usuario', password='x')
        cls.lugar = Lugar.objects.create(nombre='Club pendiente', estado_aprobacion='pending')

    def _urls_admin(self):
        detalle = f'/api/lugares/{self.lugar.id}'
        return [
            ('get', '/api/lugares/panel-estado/'),
            ('get', '/api/lugares/pendientes-aprobacion/'),
            ('get', '/api/lugares/estadisticas-busqueda/'),
            ('get', f'{detalle}/estado-publicacion/'),
            ('post', f'{detalle}/aprobar/'),
        ]

    def test_anonimo_recibe_403(self):
        for metodo, url in self._urls_admin():
            with self.subTest(url=url):
                self.assertEqual(getattr(self.client, metodo)(url).status_code, status.HTTP_403_FORBIDDEN)

    def test_usuario_normal_recibe_403(self):
        self.client.force_authenticate(self.usuario)
        for metodo, url in self._urls_admin():
            with self.subTest(url=url):
                self.assertEqual(getattr(self.client, metodo)(url).status_code, status.HTTP_403_FORBIDDEN)

    def test_personal_puede(self):
        self.client.force_authenticate(self.staff)
        for metodo, url in self._urls_admin():
            with self.subTest(url=url):
                self.assertEqual(getattr(self.client, metodo)(url).status_code, status.HTTP_200_OK)
        self.lugar.refresh_from_db()
        self.assertEqual(self.lugar.estado_aprobacion, 'approved')


class FormulariosPublicosTests(APITestCase):
    """Contacto y sugerencias siguen abiertos al público, solo para enviar."""

    def test_enviar_contacto(self):
        datos = {'name': 'Ana', 'email': 'ana@example.com', 'subject': 'Hola', 'message': 'Prueba'}
        self.assertEqual(self.client.post('/api/contactos/', datos, format='json').status_code,
                         status.HTTP_201_CREATED)

    def test_enviar_sugerencia(self):
        datos = {'name': 'Piscina', 'address': 'Calle Mayor 1'}
        self.assertEqual(self.client.post('/api/sugerencias/', datos, format='json').status_code,
                         status.HTTP_201_CREATED)

    def test_no_se_pueden_leer(self):
        for url in ['/api/contactos/', '/api/sugerencias/']:
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class CerradoPorDefectoTests(APITestCase):
    """Una ruta sin permiso declarado queda cerrada: la API usa IsAdminUser por defecto."""

    def test_servicios_escritura_cerrada(self):
        self.assertEqual(self.client.post('/api/servicios/', {'nombre': 'X'}, format='json').status_code,
                         status.HTTP_403_FORBIDDEN)


class FiltroRadioLogTests(APITestCase):
    """Los avisos del filtro por radio van al log, sin la dirección buscada (#83)."""

    DIRECCION = 'Calle Inventada 123, Madrid'

    def _filtrar(self, datos):
        with self.assertLogs('lugares.filters', level='WARNING') as logs:
            LugarFilter(datos, queryset=Lugar.objects.all()).qs.count()
        salida = '\n'.join(logs.output)
        self.assertNotIn(self.DIRECCION, salida)
        return salida

    def test_error_de_geocodificacion(self):
        with mock.patch('lugares.filters.Nominatim') as nominatim:
            nominatim.return_value.geocode.side_effect = GeocoderServiceError(f'fallo con {self.DIRECCION}')
            salida = self._filtrar({'address_query': self.DIRECCION, 'radio_km': '5'})
        self.assertIn('GeocoderServiceError', salida)

    def test_direccion_no_encontrada(self):
        with mock.patch('lugares.filters.Nominatim') as nominatim:
            nominatim.return_value.geocode.return_value = None
            self._filtrar({'address_query': self.DIRECCION, 'radio_km': '5'})

    def test_coordenadas_no_validas(self):
        self._filtrar({'latitud': 'x', 'longitud': 'y', 'radio_km': '5'})

from django.db import models # pyright: ignore[reportMissingModuleSource]
from django.core.exceptions import ValidationError
from django.conf import settings
from geopy.geocoders import Nominatim # pyright: ignore[reportMissingImports]
from geopy.exc import GeocoderTimedOut, GeocoderServiceError # pyright: ignore[reportMissingImports]

TIPO_LUGAR_CHOICES = [
    ('gimnasio', 'Gimnasio'),
    ('piscina', 'Piscina'),
    ('centro', 'Centro Deportivo'),
    ('club_asociacion', 'Club/Asociacion'),
    ('otro', 'Otro'),
]

class ComunidadAutonoma(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    def __str__(self): return self.nombre
    class Meta:
        verbose_name = "Comunidad Autónoma"
        verbose_name_plural = "Comunidades Autónomas"
        ordering = ['nombre']

class Provincia(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    comunidad_autonoma = models.ForeignKey(ComunidadAutonoma, on_delete=models.CASCADE, related_name='provincias')
    def __str__(self): return self.nombre
    class Meta:
        verbose_name = "Provincia"
        verbose_name_plural = "Provincias"
        ordering = ['nombre']
        unique_together = ('nombre', 'comunidad_autonoma')

class Deporte(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    icon_image = models.ImageField(
        upload_to='images/sport_icons/',
        blank=True,
        null=True,
        verbose_name="Icono (archivo)",
        help_text="Sube un archivo de imagen para el icono del deporte."
    )
    icon_url = models.URLField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Icono (URL externa)",
        help_text="Opcional: URL de una imagen externa para el icono del deporte."
    )
    def __str__(self): return self.nombre
    class Meta:
        verbose_name = "Deporte"
        verbose_name_plural = "Deportes"
        ordering = ['nombre']

class Sexo(models.Model):
    opcion = models.CharField(max_length=50, unique=True)
    def __str__(self): return self.opcion
    class Meta:
        verbose_name = "Sexo permitido"
        verbose_name_plural = "Sexos permitidos"
        ordering = ['opcion']

class CategoriaEdad(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    def __str__(self): return self.nombre
    class Meta:
        verbose_name = "Categoría de Edad"
        verbose_name_plural = "Categorías de Edad"
        ordering = ['nombre']

class TipoCompeticion(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Tipo de Competición"
        verbose_name_plural = "Tipos de Competición"
        ordering = ['nombre']

class TipoServicioOferta(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Tipo de Servicio Deportivo"
        verbose_name_plural = "Tipos de Servicio Deportivo"
        ordering = ['nombre']

class OfertaDeportiva(models.Model):
    lugar = models.ForeignKey('Lugar', on_delete=models.CASCADE, related_name='ofertas_deportivas')
    deporte = models.ForeignKey(Deporte, on_delete=models.CASCADE, related_name='ofertas_asociadas')
    sexo_permitido = models.ForeignKey(Sexo, on_delete=models.PROTECT, related_name='ofertas_por_sexo', null=True, blank=True)
    categoria_edad = models.ForeignKey(CategoriaEdad, on_delete=models.PROTECT, related_name='ofertas_por_categoria', null=True, blank=True)
    tipo_competicion = models.ForeignKey(TipoCompeticion, on_delete=models.PROTECT, related_name='ofertas', null=True, blank=True)
    tipo_servicio = models.ForeignKey(TipoServicioOferta, on_delete=models.PROTECT, related_name='ofertas', null=True, blank=True)
    activa = models.BooleanField(default=True)

    def __str__(self):
        sexo = self.sexo_permitido.opcion if self.sexo_permitido else "Sin sexo"
        categoria = self.categoria_edad.nombre if self.categoria_edad else "Sin categoria"
        competicion = self.tipo_competicion.nombre if self.tipo_competicion else "Sin competicion"
        servicio = self.tipo_servicio.nombre if self.tipo_servicio else "Sin servicio"
        return f"{self.lugar.nombre} - {self.deporte.nombre} - {sexo} - {categoria} - {competicion} - {servicio}"

    def clean(self):
        if self.lugar_id and not self.lugar.puede_publicar_contenido:
            raise ValidationError(
                "Este lugar no puede publicar ofertas deportivas: falta CIF o requiere verificacion documental."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Oferta Deportiva"
        verbose_name_plural = "Ofertas Deportivas"
        unique_together = (
            'lugar',
            'deporte',
            'sexo_permitido',
            'categoria_edad',
            'tipo_competicion',
            'tipo_servicio',
        )

class TipoEvento(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Tipo de Evento"
        verbose_name_plural = "Tipos de Evento"
        ordering = ['nombre']

class Evento(models.Model):
    lugar = models.ForeignKey('Lugar', on_delete=models.CASCADE, related_name='eventos')
    tipo_evento = models.ForeignKey(TipoEvento, on_delete=models.SET_NULL, null=True, blank=True, related_name='eventos_por_tipo')
    titulo = models.CharField(max_length=200)
    link_noticia = models.URLField(max_length=200, blank=True, null=True, verbose_name="Enlace a la Noticia")
    descripcion = models.TextField(max_length=140, blank=True, null=True, help_text="Máximo 140 caracteres.")

    # Campos de fecha y hora para los eventos
    fecha_inicio = models.DateTimeField(blank=True, null=True)
    fecha_fin = models.DateTimeField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    es_gratuito = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.titulo} ({self.lugar.nombre})"

    def clean(self):
        if self.lugar_id and not self.lugar.puede_publicar_contenido:
            raise ValidationError(
                "Este lugar no puede publicar eventos: falta CIF o requiere verificacion documental."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Evento"
        verbose_name_plural = "Eventos"
        ordering = ['-fecha_inicio', 'titulo']

class Servicio(models.Model):
    """
    Representa un servicio que puede ofrecer un lugar deportivo (ej. 'Vestuarios', 'Parking').
    """
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Servicio"
        verbose_name_plural = "Servicios"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

class Contacto(models.Model):
    """
    Modelo para almacenar mensajes del formulario de contacto.
    """
    ESTADO_SOLICITUD_CHOICES = [
        ('pending', 'Pendiente'),
        ('converted', 'Convertida en lugar pendiente'),
        ('activated', 'Lugar activado'),
        ('rejected', 'Rechazada'),
    ]

    name = models.CharField(max_length=100)
    email = models.EmailField()
    entidad = models.CharField(max_length=200, blank=True, null=True)
    cif = models.CharField(max_length=20, blank=True, null=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    web = models.URLField(max_length=200, blank=True, null=True)
    instagram_link = models.URLField(max_length=200, blank=True, null=True)
    x_link = models.URLField(max_length=200, blank=True, null=True)
    tipo_lugar = models.CharField(max_length=50, choices=TIPO_LUGAR_CHOICES, default='otro')
    comunidad_autonoma = models.ForeignKey(ComunidadAutonoma, on_delete=models.SET_NULL, null=True, blank=True)
    provincia = models.ForeignKey(Provincia, on_delete=models.SET_NULL, null=True, blank=True)
    direccion = models.CharField(max_length=300, blank=True, null=True)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    presentacion = models.CharField(max_length=200, blank=True, null=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    estado_solicitud = models.CharField(max_length=20, choices=ESTADO_SOLICITUD_CHOICES, default='pending')
    lugar_vinculado = models.ForeignKey('Lugar', on_delete=models.SET_NULL, null=True, blank=True, related_name='solicitudes_contacto')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Mensaje de Contacto"
        verbose_name_plural = "Mensajes de Contacto"
        ordering = ['-created_at']

    def __str__(self):
        return f"Mensaje de {self.name} - {self.subject}"

class Sugerencia(models.Model):
    """
    Modelo para almacenar sugerencias de nuevos lugares deportivos.
    """
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=300)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Sugerencia de Lugar"
        verbose_name_plural = "Sugerencias de Lugares"
        ordering = ['-created_at']

    def __str__(self):
        return f"Sugerencia: {self.name} ({self.address})"

class Lugar(models.Model):
    ESTADO_APROBACION_CHOICES = [
        ('pending', 'Pendiente de revision'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
        ('inactive', 'Inactivo'),
    ]

    nombre = models.CharField(max_length=200)
    # Se mantiene nullable para no romper datos históricos; el flujo de alta lo exige obligatoriamente.
    cif = models.CharField(max_length=20, blank=True, null=True, db_index=True)
    estado_aprobacion = models.CharField(max_length=20, choices=ESTADO_APROBACION_CHOICES, default='pending')
    suscripcion_activa = models.BooleanField(default=False)
    requiere_documentacion = models.BooleanField(default=False)
    motivo_documentacion = models.CharField(max_length=255, blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)

    comunidad_autonoma = models.ForeignKey(
        ComunidadAutonoma,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lugares_por_comunidad'
    )
    provincia = models.ForeignKey(
        Provincia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lugares_por_provincia'
    )
    latitud = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    telefono = models.CharField(max_length=20, blank=True, null=True)
    web = models.URLField(max_length=200, blank=True, null=True)
    instagram_link = models.URLField(max_length=200, blank=True, null=True, verbose_name="Enlace a Instagram")
    x_link = models.URLField(max_length=200, blank=True, null=True, verbose_name="Enlace a X (Twitter)")

    email = models.EmailField(blank=True, null=True)
    logo = models.ImageField(upload_to='images/logos/', blank=True, null=True)
    logo_url = models.URLField(max_length=200, blank=True, null=True, verbose_name="URL del Logo (externa)")

    servicios = models.ManyToManyField(Servicio, related_name='lugares', blank=True)

    TIPO_CHOICES = TIPO_LUGAR_CHOICES
    tipo = models.CharField(max_length=50, choices=TIPO_LUGAR_CHOICES, default='otro')
    accesible = models.BooleanField(default=False)

    @property
    def puede_publicar_contenido(self):
        return (
            self.estado_aprobacion == 'approved'
            and bool(self.cif)
            and not self.requiere_documentacion
            and self.suscripcion_activa
        )

    @property
    def avisos_publicacion(self):
        avisos = []
        if self.estado_aprobacion == 'pending':
            avisos.append("Tu entidad esta pendiente de revision por administracion.")
        elif self.estado_aprobacion == 'rejected':
            avisos.append("Tu entidad ha sido rechazada. Contacta con administracion para regularizarla.")
        elif self.estado_aprobacion == 'inactive':
            avisos.append("Tu entidad esta inactiva y no puede publicar contenido.")
        if not self.cif:
            avisos.append("Debes completar el CIF para poder publicar ofertas y eventos.")
        if not self.suscripcion_activa:
            avisos.append("Debes activar la cuota para publicar ofertas y eventos.")
        if self.requiere_documentacion:
            avisos.append(self.motivo_documentacion or "Se requiere verificacion documental por concurrencia.")
        return avisos

    def _calcular_motivos_documentacion(self):
        motivos = []
        if self.nombre and Lugar.objects.filter(nombre__iexact=self.nombre).exclude(pk=self.pk).exists():
            motivos.append("Existe otra entidad con el mismo nombre. Se requiere documento acreditativo.")
        if self.cif and Lugar.objects.filter(cif__iexact=self.cif).exclude(pk=self.pk).exists():
            motivos.append("Existe otra entidad con el mismo CIF. Se requiere documento acreditativo.")
        return motivos

    def save(self, *args, **kwargs):
        if self.direccion and (self.latitud is None or self.longitud is None):
            geolocator = Nominatim(user_agent="deporteca-app")
            try:
                location = geolocator.geocode(self.direccion, timeout=5)
                if location:
                    self.latitud = round(location.latitude, 6)
                    self.longitud = round(location.longitude, 6)
            except (GeocoderTimedOut, GeocoderServiceError, ValueError, TypeError):
                # Si falla la geocodificación no se bloquea el guardado.
                pass

        motivos = self._calcular_motivos_documentacion()
        self.requiere_documentacion = bool(motivos)
        self.motivo_documentacion = " | ".join(motivos) if motivos else ""
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Lugar Deportivo"
        verbose_name_plural = "Lugares Deportivos"
        ordering = ['nombre']


class SearchLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    query = models.CharField(max_length=255, blank=True, null=True)
    provincia = models.ForeignKey(Provincia, on_delete=models.SET_NULL, null=True, blank=True)
    comunidad_autonoma = models.ForeignKey(ComunidadAutonoma, on_delete=models.SET_NULL, null=True, blank=True)
    deporte = models.ForeignKey(Deporte, on_delete=models.SET_NULL, null=True, blank=True)
    sexo = models.ForeignKey(Sexo, on_delete=models.SET_NULL, null=True, blank=True)
    categoria_edad = models.ForeignKey(CategoriaEdad, on_delete=models.SET_NULL, null=True, blank=True)
    tipo_competicion = models.ForeignKey(TipoCompeticion, on_delete=models.SET_NULL, null=True, blank=True)
    tipo_servicio_oferta = models.ForeignKey(TipoServicioOferta, on_delete=models.SET_NULL, null=True, blank=True)
    result_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Registro de Busqueda"
        verbose_name_plural = "Registros de Busqueda"
        ordering = ['-created_at']

    def __str__(self):
        return f"Busqueda '{self.query or ''}' ({self.created_at:%Y-%m-%d %H:%M})"


class LugarClubAsociacion(Lugar):
    class Meta:
        proxy = True
        verbose_name = "Lugar - Club/Asociacion"
        verbose_name_plural = "Lugares - Clubes/Asociaciones"


class LugarGimnasio(Lugar):
    class Meta:
        proxy = True
        verbose_name = "Lugar - Gimnasio"
        verbose_name_plural = "Lugares - Gimnasios"


class LugarPiscina(Lugar):
    class Meta:
        proxy = True
        verbose_name = "Lugar - Piscina"
        verbose_name_plural = "Lugares - Piscinas"


class LugarCentroDeportivo(Lugar):
    class Meta:
        proxy = True
        verbose_name = "Lugar - Centro Deportivo"
        verbose_name_plural = "Lugares - Centros Deportivos"


class LugarOtro(Lugar):
    class Meta:
        proxy = True
        verbose_name = "Lugar - Otro"
        verbose_name_plural = "Lugares - Otros"


class ContactoPendiente(Contacto):
    class Meta:
        proxy = True
        verbose_name = "Solicitud pendiente"
        verbose_name_plural = "Solicitudes pendientes"

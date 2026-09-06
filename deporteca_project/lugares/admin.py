from django.contrib import admin
from django.contrib import messages
from django import forms 
from .models import (
    ComunidadAutonoma, Provincia, Deporte, Sexo, CategoriaEdad, Lugar, OfertaDeportiva,
    TipoEvento, Evento, TipoCompeticion, TipoServicioOferta, SearchLog, Contacto, Sugerencia,
    LugarClubAsociacion, LugarGimnasio, LugarPiscina, LugarCentroDeportivo, LugarOtro, ContactoPendiente,
    Servicio
)

# Inline para OfertaDeportiva en LugarAdmin (sin cambios)
class OfertaDeportivaInline(admin.TabularInline):
    model = OfertaDeportiva
    fields = ['deporte', 'sexo_permitido', 'categoria_edad', 'tipo_competicion', 'tipo_servicio', 'activa']
    extra = 1

# --- NUEVO INLINE PARA EVENTOS ---
class EventoInline(admin.TabularInline):
    model = Evento
    fields = ['titulo', 'tipo_evento', 'fecha_inicio', 'fecha_fin', 'precio', 'es_gratuito', 'link_noticia', 'descripcion']
    extra = 1 # Número de formularios vacíos para añadir eventos
    max_num = 5 # Opcional: limitar el número de eventos que se pueden añadir directamente aquí
# --- FIN NUEVO INLINE ---

# Formulario personalizado para el LugarAdmin (sin cambios)
class LugarAdminForm(forms.ModelForm):
    class Meta:
        model = Lugar
        fields = '__all__'

    def clean(self):
        cleaned_data = super().clean()
        logo = cleaned_data.get('logo')
        logo_url = cleaned_data.get('logo_url')

        if logo and logo_url:
            raise forms.ValidationError(
                "Por favor, elige solo una opción para el logo: subir un archivo o proporcionar una URL, no ambas."
            )
        return cleaned_data

@admin.register(Lugar)
class LugarAdmin(admin.ModelAdmin):
    form = LugarAdminForm
    list_display = (
        'nombre', 'tipo', 'estado_aprobacion', 'cif', 'suscripcion_activa', 'puede_publicar_display', 'requiere_documentacion', 'comunidad_autonoma', 'provincia', 'telefono', 'email', 
        'web_link', 'instagram_link_display', 'x_link_display', 
        'display_logo_source'
    )
    list_filter = (
        'tipo',
        'estado_aprobacion',
        'comunidad_autonoma', 
        'provincia', 
        'suscripcion_activa',
        'requiere_documentacion',
        'ofertas_deportivas__deporte', 
        'ofertas_deportivas__categoria_edad', 
        'ofertas_deportivas__sexo_permitido',
        'ofertas_deportivas__tipo_competicion',
        'ofertas_deportivas__tipo_servicio',
        'eventos__tipo_evento', # --- NUEVO FILTRO POR TIPO DE EVENTO ---
    )
    search_fields = ('nombre', 'descripcion', 'direccion')
    inlines = [OfertaDeportivaInline, EventoInline] # --- AÑADIR EventoInline AQUÍ ---
    
    fieldsets = (
        (None, {
            'fields': ('nombre', 'tipo', 'accesible', 'estado_aprobacion', 'cif', 'suscripcion_activa', 'requiere_documentacion', 'motivo_documentacion', 'descripcion', 'direccion', 'latitud', 'longitud')
        }),
        ('Ubicación', {
            'fields': ('comunidad_autonoma', 'provincia'),
            'classes': ('collapse',) 
        }),
        ('Información de Contacto', {
            'fields': ('email', 'telefono', 'web', 'instagram_link', 'x_link')
        }),
        ('Logo', {
            'fields': ('logo', 'logo_url'), 
            'description': 'Puedes subir un archivo de logo O proporcionar una URL externa, pero no ambas.'
        }),
    )

    def web_link(self, obj):
        return obj.web if obj.web else "-"
    web_link.short_description = "Web"

    def instagram_link_display(self, obj):
        return obj.instagram_link if obj.instagram_link else "-"
    instagram_link_display.short_description = "Instagram"

    def x_link_display(self, obj):
        return obj.x_link if obj.x_link else "-"
    x_link_display.short_description = "X (Twitter)"

    def display_logo_source(self, obj):
        if obj.logo:
            return "Archivo Subido"
        elif obj.logo_url:
            return "URL Externa"
        return "No hay logo"
    display_logo_source.short_description = "Origen del Logo"

    def puede_publicar_display(self, obj):
        return "Si" if obj.puede_publicar_contenido else "No"
    puede_publicar_display.short_description = "Puede publicar"

# Formulario personalizado para DeporteAdmin (sin cambios)
class DeporteAdminForm(forms.ModelForm):
    class Meta:
        model = Deporte
        fields = '__all__'

    def clean(self):
        cleaned_data = super().clean()
        icon_image = cleaned_data.get('icon_image')
        icon_url = cleaned_data.get('icon_url')

        if not icon_image and not icon_url:
            raise forms.ValidationError(
                "Debes proporcionar un Icono (subir archivo) o una URL de Icono para el deporte."
            )
        if icon_image and icon_url:
            raise forms.ValidationError(
                "Por favor, elige solo una opción para el icono del deporte: subir un archivo o proporcionar una URL, no ambas."
            )
        return cleaned_data

@admin.register(Deporte)
class DeporteAdmin(admin.ModelAdmin):
    form = DeporteAdminForm 
    list_display = ('nombre', 'display_icon_source',) 
    search_fields = ('nombre',)
    fields = ('nombre', 'icon_image', 'icon_url',) 

    def display_icon_source(self, obj):
        if obj.icon_image:
            return "Archivo Subido"
        elif obj.icon_url:
            return "URL Externa"
        return "No hay icono"
    display_icon_source.short_description = "Origen del Icono"


# Registra los demás modelos con sus administradores usando @admin.register() (sin cambios)
@admin.register(CategoriaEdad)
class CategoriaEdadAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)

@admin.register(Sexo) 
class SexoAdmin(admin.ModelAdmin):
    list_display = ('opcion',)
    search_fields = ('opcion',)

@admin.register(ComunidadAutonoma)
class ComunidadAutonomaAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)

@admin.register(Provincia)
class ProvinciaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'comunidad_autonoma')
    list_filter = ('comunidad_autonoma',)
    search_fields = ('nombre',)

# --- NUEVO: Registrar TipoEvento y Evento (si quieres gestionarlos por separado también) ---
@admin.register(TipoEvento)
class TipoEventoAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)

@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'lugar', 'tipo_evento', 'fecha_inicio', 'fecha_fin', 'precio', 'es_gratuito')
    list_filter = ('tipo_evento', 'lugar', 'fecha_inicio', 'fecha_fin')
    search_fields = ('titulo', 'descripcion', 'lugar__nombre')
    date_hierarchy = 'fecha_inicio' # Permite navegar por fechas

@admin.register(TipoCompeticion)
class TipoCompeticionAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)

@admin.register(TipoServicioOferta)
class TipoServicioOfertaAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)


@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre', 'descripcion')


@admin.register(SearchLog)
class SearchLogAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'query',
        'provincia',
        'deporte',
        'sexo',
        'categoria_edad',
        'tipo_competicion',
        'tipo_servicio_oferta',
        'result_count',
    )
    list_filter = ('created_at', 'provincia', 'deporte', 'sexo', 'categoria_edad', 'tipo_competicion', 'tipo_servicio_oferta')
    search_fields = ('query',)


@admin.register(Contacto)
class ContactoAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'entidad',
        'name',
        'email',
        'tipo_lugar',
        'estado_solicitud',
        'lugar_vinculado',
        'presentacion_resumen',
    )
    list_filter = ('created_at', 'tipo_lugar', 'estado_solicitud', 'comunidad_autonoma', 'provincia')
    search_fields = ('entidad', 'name', 'email', 'presentacion', 'subject', 'message', 'direccion', 'cif')
    readonly_fields = ('created_at', 'lugar_vinculado', 'estado_solicitud')
    actions = ('crear_lugar_pendiente', 'activar_lugar_vinculado')

    fieldsets = (
        ('Solicitud', {
            'fields': (
                'created_at',
                'estado_solicitud',
                'lugar_vinculado',
                'entidad',
                'name',
                'email',
                'cif',
                'telefono',
                'presentacion',
                'message',
            )
        }),
        ('Datos de ubicacion y tipo', {
            'fields': (
                'tipo_lugar',
                'comunidad_autonoma',
                'provincia',
                'direccion',
                'latitud',
                'longitud',
            )
        }),
        ('Links', {
            'fields': ('web', 'instagram_link', 'x_link', 'subject')
        }),
    )

    def presentacion_resumen(self, obj):
        if not obj.presentacion:
            return '-'
        return obj.presentacion[:80] + ('...' if len(obj.presentacion) > 80 else '')

    presentacion_resumen.short_description = 'Presentacion'

    @admin.action(description='Crear lugar pendiente desde solicitudes seleccionadas')
    def crear_lugar_pendiente(self, request, queryset):
        creados = 0
        omitidos = 0

        for contacto in queryset:
            if contacto.lugar_vinculado_id:
                omitidos += 1
                continue

            nombre_lugar = (contacto.entidad or '').strip() or f"Entidad {contacto.name}"
            lugar = Lugar.objects.create(
                nombre=nombre_lugar,
                cif=contacto.cif,
                estado_aprobacion='pending',
                suscripcion_activa=False,
                descripcion=contacto.presentacion or contacto.message,
                direccion=contacto.direccion,
                comunidad_autonoma=contacto.comunidad_autonoma,
                provincia=contacto.provincia,
                latitud=contacto.latitud,
                longitud=contacto.longitud,
                telefono=contacto.telefono,
                email=contacto.email,
                web=contacto.web,
                instagram_link=contacto.instagram_link,
                x_link=contacto.x_link,
                tipo=contacto.tipo_lugar or 'otro',
            )

            contacto.lugar_vinculado = lugar
            contacto.estado_solicitud = 'converted'
            contacto.save(update_fields=['lugar_vinculado', 'estado_solicitud'])
            creados += 1

        if creados:
            self.message_user(request, f"{creados} solicitud(es) convertidas en lugar pendiente.", level=messages.SUCCESS)
        if omitidos:
            self.message_user(request, f"{omitidos} solicitud(es) ya estaban vinculadas a un lugar.", level=messages.WARNING)

    @admin.action(description='Activar lugares vinculados de las solicitudes seleccionadas')
    def activar_lugar_vinculado(self, request, queryset):
        activados = 0
        sin_lugar = 0

        for contacto in queryset:
            if not contacto.lugar_vinculado_id:
                sin_lugar += 1
                continue

            lugar = contacto.lugar_vinculado
            lugar.estado_aprobacion = 'approved'
            lugar.save(update_fields=['estado_aprobacion'])
            contacto.estado_solicitud = 'activated'
            contacto.save(update_fields=['estado_solicitud'])
            activados += 1

        if activados:
            self.message_user(request, f"{activados} lugar(es) vinculados activados.", level=messages.SUCCESS)
        if sin_lugar:
            self.message_user(request, f"{sin_lugar} solicitud(es) no tienen lugar vinculado todavia.", level=messages.WARNING)


@admin.register(Sugerencia)
class SugerenciaAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'name', 'address')
    list_filter = ('created_at',)
    search_fields = ('name', 'address', 'description')


class LugarTipoAdmin(LugarAdmin):
    tipo_fijo = None

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if self.tipo_fijo:
            qs = qs.filter(tipo=self.tipo_fijo)
        return qs

    def save_model(self, request, obj, form, change):
        if self.tipo_fijo:
            obj.tipo = self.tipo_fijo
        super().save_model(request, obj, form, change)


@admin.register(LugarClubAsociacion)
class LugarClubAsociacionAdmin(LugarTipoAdmin):
    tipo_fijo = 'club_asociacion'


@admin.register(LugarGimnasio)
class LugarGimnasioAdmin(LugarTipoAdmin):
    tipo_fijo = 'gimnasio'


@admin.register(LugarPiscina)
class LugarPiscinaAdmin(LugarTipoAdmin):
    tipo_fijo = 'piscina'


@admin.register(LugarCentroDeportivo)
class LugarCentroDeportivoAdmin(LugarTipoAdmin):
    tipo_fijo = 'centro'


@admin.register(LugarOtro)
class LugarOtroAdmin(LugarTipoAdmin):
    tipo_fijo = 'otro'


@admin.register(ContactoPendiente)
class ContactoPendienteAdmin(ContactoAdmin):
    def get_queryset(self, request):
        return super().get_queryset(request).filter(estado_solicitud='pending')

    def changelist_view(self, request, extra_context=None):
        total = self.get_queryset(request).count()
        if total:
            self.message_user(request, f"Tienes {total} solicitud(es) pendiente(s) de revisar.", level=messages.WARNING)
        return super().changelist_view(request, extra_context=extra_context)


_original_each_context = admin.site.each_context


def _each_context_with_pending_counter(request):
    context = _original_each_context(request)
    context['pending_contact_requests_count'] = Contacto.objects.filter(estado_solicitud='pending').count()
    return context


admin.site.each_context = _each_context_with_pending_counter
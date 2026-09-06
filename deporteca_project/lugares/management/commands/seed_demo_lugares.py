from django.core.management.base import BaseCommand

from lugares.models import (
    CategoriaEdad,
    ComunidadAutonoma,
    Deporte,
    Lugar,
    OfertaDeportiva,
    Provincia,
    Sexo,
    TipoCompeticion,
    TipoServicioOferta,
)


class Command(BaseCommand):
    help = "Carga datos demo de comunidades, provincias, lugares y ofertas deportivas"

    def handle(self, *args, **options):
        comunidad_mad, _ = ComunidadAutonoma.objects.get_or_create(nombre="Comunidad de Madrid")
        comunidad_cat, _ = ComunidadAutonoma.objects.get_or_create(nombre="Cataluna")

        provincia_mad, _ = Provincia.objects.get_or_create(
            nombre="Madrid", comunidad_autonoma=comunidad_mad
        )
        provincia_bcn, _ = Provincia.objects.get_or_create(
            nombre="Barcelona", comunidad_autonoma=comunidad_cat
        )

        club_rugby, _ = Lugar.objects.get_or_create(
            nombre="Club Deportivo Norte",
            defaults={
                "cif": "B12345678",
                "descripcion": "Club con equipos por categorias y competicion.",
                "direccion": "Avenida del Deporte 10",
                "latitud": 40.416775,
                "longitud": -3.703790,
                "comunidad_autonoma": comunidad_mad,
                "provincia": provincia_mad,
                "telefono": "910000001",
                "email": "contacto@clubnorte.es",
                "web": "https://clubnorte.es",
                "tipo": "club_asociacion",
            },
        )

        gimnasio, _ = Lugar.objects.get_or_create(
            nombre="Gimnasio Central Madrid",
            defaults={
                "cif": "B87654321",
                "descripcion": "Entrenamiento funcional y tecnificacion.",
                "direccion": "Calle Energia 25",
                "latitud": 40.438131,
                "longitud": -3.697451,
                "comunidad_autonoma": comunidad_mad,
                "provincia": provincia_mad,
                "telefono": "910000002",
                "email": "hola@gimnasiocentral.es",
                "web": "https://gimnasiocentral.es",
                "tipo": "gimnasio",
            },
        )

        _entidad_sin_cif, _ = Lugar.objects.get_or_create(
            nombre="Asociacion Deportiva Barrio Sur",
            defaults={
                "cif": None,
                "descripcion": "Entidad pendiente de completar CIF.",
                "direccion": "Calle Barrio Sur 8",
                "latitud": 41.385100,
                "longitud": 2.173400,
                "comunidad_autonoma": comunidad_cat,
                "provincia": provincia_bcn,
                "telefono": "930000003",
                "email": "info@barriosur.org",
                "tipo": "centro",
            },
        )

        # Actualiza coordenadas demo aunque el registro ya existiese previamente.
        if club_rugby.latitud is None or club_rugby.longitud is None:
            club_rugby.latitud = 40.416775
            club_rugby.longitud = -3.703790
            club_rugby.save(update_fields=['latitud', 'longitud'])
        if gimnasio.latitud is None or gimnasio.longitud is None:
            gimnasio.latitud = 40.438131
            gimnasio.longitud = -3.697451
            gimnasio.save(update_fields=['latitud', 'longitud'])
        if club_rugby.tipo in ('campo', 'pista'):
            club_rugby.tipo = 'club_asociacion'
            club_rugby.save(update_fields=['tipo'])

        rugby = Deporte.objects.filter(nombre__iexact="Rugby").first() or Deporte.objects.first()
        baloncesto = Deporte.objects.filter(nombre__icontains="Baloncesto 5x5").first() or Deporte.objects.first()

        femenino = Sexo.objects.filter(opcion__iexact="Femenino").first() or Sexo.objects.first()
        mixto = Sexo.objects.filter(opcion__iexact="Mixto").first() or Sexo.objects.first()

        alevin = CategoriaEdad.objects.filter(nombre__iexact="Alevin").first() or CategoriaEdad.objects.first()
        infantil = CategoriaEdad.objects.filter(nombre__iexact="Infantil").first() or CategoriaEdad.objects.first()

        federada = TipoCompeticion.objects.filter(nombre__iexact="Federada").first() or TipoCompeticion.objects.first()
        municipal = TipoCompeticion.objects.filter(nombre__iexact="Municipal").first() or TipoCompeticion.objects.first()

        entreno_comp = TipoServicioOferta.objects.filter(nombre__icontains="Entrenamiento y competicion").first() or TipoServicioOferta.objects.first()
        entreno = TipoServicioOferta.objects.filter(nombre__icontains="Entrenamiento").first() or TipoServicioOferta.objects.first()

        # Solo se crean ofertas sobre entidades que pueden publicar (con CIF y sin concurrencia).
        if club_rugby.puede_publicar_contenido:
            OfertaDeportiva.objects.get_or_create(
                lugar=club_rugby,
                deporte=rugby,
                sexo_permitido=femenino,
                categoria_edad=alevin,
                tipo_competicion=federada,
                tipo_servicio=entreno_comp,
                defaults={"activa": True},
            )
            OfertaDeportiva.objects.get_or_create(
                lugar=club_rugby,
                deporte=rugby,
                sexo_permitido=mixto,
                categoria_edad=infantil,
                tipo_competicion=municipal,
                tipo_servicio=entreno,
                defaults={"activa": True},
            )

        if gimnasio.puede_publicar_contenido:
            OfertaDeportiva.objects.get_or_create(
                lugar=gimnasio,
                deporte=baloncesto,
                sexo_permitido=mixto,
                categoria_edad=infantil,
                tipo_competicion=municipal,
                tipo_servicio=entreno,
                defaults={"activa": True},
            )

        self.stdout.write(self.style.SUCCESS("Datos demo de lugares cargados."))

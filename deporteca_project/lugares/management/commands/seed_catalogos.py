from django.core.management.base import BaseCommand

from lugares.models import (
    CategoriaEdad,
    Deporte,
    Sexo,
    TipoCompeticion,
    TipoServicioOferta,
)


class Command(BaseCommand):
    help = "Carga catálogos iniciales de la plataforma Deporteca"

    def handle(self, *args, **options):
        deportes = [
            "Baloncesto 5x5",
            "Baloncesto 3x3",
            "Futbol 7",
            "Futbol Sala",
            "Voley",
            "Waterpolo",
            "Balonmano",
            "Escalada",
            "Natacion",
            "Padel",
            "Tenis",
            "Rugby",
            "Atletismo",
            "Esgrima",
            "Hockey Hierba",
            "Gimnasia Deportiva",
        ]

        tipos_servicio = [
            "Entrenamiento",
            "Entrenamiento y competicion",
            "Tecnificacion",
            "Campus Navidad",
            "Campus Verano",
        ]

        tipos_competicion = [
            "Federada",
            "Municipal",
            "Escolar",
            "Torneos no oficiales",
        ]

        categorias_edad = [
            "Prebenjamin",
            "Benjamin",
            "Alevin",
            "Infantil",
            "Cadete",
            "Junior",
            "Juvenil",
            "U20",
            "U22",
            "Senior",
            "Profesional",
        ]

        sexos = ["Masculino", "Femenino", "Mixto"]

        self._seed(Deporte, "nombre", deportes, "deportes")
        self._seed(TipoServicioOferta, "nombre", tipos_servicio, "tipos de servicio de oferta")
        self._seed(TipoCompeticion, "nombre", tipos_competicion, "tipos de competicion")
        self._seed(CategoriaEdad, "nombre", categorias_edad, "categorias de edad")
        self._seed(Sexo, "opcion", sexos, "sexos")

        self.stdout.write(self.style.SUCCESS("Catalogos iniciales cargados correctamente."))

    def _seed(self, model, field_name, values, label):
        created = 0
        for value in values:
            kwargs = {field_name: value}
            _, was_created = model.objects.get_or_create(**kwargs)
            if was_created:
                created += 1
        self.stdout.write(f"{label}: +{created} nuevos")

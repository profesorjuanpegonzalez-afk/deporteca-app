from django.db import migrations, models


def migrate_tipo_values(apps, schema_editor):
    Lugar = apps.get_model('lugares', 'Lugar')
    Lugar.objects.filter(tipo='campo').update(tipo='club_asociacion')
    Lugar.objects.filter(tipo='pista').update(tipo='club_asociacion')


class Migration(migrations.Migration):

    dependencies = [
        ('lugares', '0020_searchlog'),
    ]

    operations = [
        migrations.RunPython(migrate_tipo_values, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='lugar',
            name='tipo',
            field=models.CharField(
                choices=[
                    ('gimnasio', 'Gimnasio'),
                    ('piscina', 'Piscina'),
                    ('centro', 'Centro Deportivo'),
                    ('club_asociacion', 'Club/Asociacion'),
                    ('otro', 'Otro'),
                ],
                default='otro',
                max_length=50,
            ),
        ),
    ]

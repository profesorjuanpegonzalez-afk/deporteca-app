from django.apps import AppConfig


class LugaresConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'lugares'

    def ready(self):
        from . import signals  # noqa: F401

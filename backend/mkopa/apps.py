from django.apps import AppConfig

class MkopaConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "mkopa"

    def ready(self):
        from . import signals  # noqa: F401

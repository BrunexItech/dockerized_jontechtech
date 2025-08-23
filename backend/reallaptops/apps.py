from django.apps import AppConfig

class ReallaptopsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "reallaptops"

    def ready(self):
        from . import signals  # noqa: F401

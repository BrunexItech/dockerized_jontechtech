from django.apps import AppConfig

class TelevisionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "televisions"

    def ready(self):
        from . import signals  # noqa: F401

from django.apps import AppConfig

class StoragesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "storages"

    def ready(self):
        from . import signals  # noqa: F401

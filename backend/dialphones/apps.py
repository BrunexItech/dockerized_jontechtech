# dialphones/apps.py
from django.apps import AppConfig

class DialphonesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "dialphones"

    def ready(self):
        from . import signals  # noqa: F401

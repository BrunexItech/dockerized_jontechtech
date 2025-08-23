# tablets/apps.py
from django.apps import AppConfig

class TabletsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tablets"

    def ready(self):
        # Import signals so Django registers them when the app is ready
        from . import signals  # noqa: F401

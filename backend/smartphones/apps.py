# smartphones/apps.py
from django.apps import AppConfig

class SmartphonesConfig(AppConfig):
    name = "smartphones"
    verbose_name = "Smartphones"

    def ready(self):
        # Import signals on app ready
        from . import signals  # noqa

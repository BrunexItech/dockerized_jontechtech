from django.apps import AppConfig

class NewIphonesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "newiphones"

    def ready(self):
        # Import signals so they are registered
        from . import signals  # noqa: F401

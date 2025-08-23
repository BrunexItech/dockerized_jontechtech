from django.apps import AppConfig

class BudgetSmartphonesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "budgetsmartphones"

    def ready(self):
        from . import signals  # noqa: F401

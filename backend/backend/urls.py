# backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

# Health check
def health(_request): 
    return JsonResponse({"ok": True})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("authapp.urls")),
    path("api/", include("products.urls")),
    path("api/", include("tablets.urls")),
    path("api/", include("smartphones.urls")),
    path("api/", include("storages.urls")),
    path("api/", include("audio.urls")),
    path("api/", include("accessories.urls")),
    path("api/", include("televisions.urls")),
    path("api/", include("mkopa.urls")),
    path("api/", include("reallaptops.urls")),
    path("api/", include("offers.urls")),
    path("api/", include("budgetsmartphones.urls")),
    path("api/", include("dialphones.urls")),
    path("api/", include("newiphones.urls")),
    path("api/", include("heroes.urls")),
    path("api/health/", health),
]

# For image/media uploads in DEBUG
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from . import api

admin.site.site_title = "RK ENTERPRICES DELHI"
admin.site.site_header = "RK ENTERPRICES DELHI"
admin.site.index_title = "Automotive Wholesale Management"

urlpatterns = [
    path(settings.ADMIN_URL, admin.site.urls),
    path("api/v1/", include(api.urlpatterns)),
]

# Development only: Django serves uploaded media. In production the web server
# or object storage must serve MEDIA_ROOT (see README).
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

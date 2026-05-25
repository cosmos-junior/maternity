from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import CustomLoginView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth
    path('api/auth/login/', CustomLoginView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Apps
    path('api/patients/', include('patients.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/postnatal/', include('postnatal.urls')),
    path('api/reminders/', include('reminders.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/users/', include('users.urls')),
    path('api/alerts/', include('alerts.urls')),
    path('api/core/', include('core.urls')),
    path('api/clinical/', include('clinical.urls')),
    path('api/nutrition/', include('nutrition.urls')),
    path('api/procedures/', include('procedures.urls')),
]

# Serve uploaded media in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

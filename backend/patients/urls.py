from django.urls import path
from .views import (
    PatientListCreateView, PatientDetailView, PatientStatsView,
    PartographListCreateView, PartographEntryDetailView,
)
from .pdf_views import PartographPDFView

urlpatterns = [
    path('', PatientListCreateView.as_view(), name='patient_list_create'),
    path('<int:pk>/', PatientDetailView.as_view(), name='patient_detail'),
    path('<int:pk>/stats/', PatientStatsView.as_view(), name='patient_stats'),
    # Partograph
    path('<int:patient_id>/partograph/', PartographListCreateView.as_view(), name='partograph_list_create'),
    path('<int:patient_id>/partograph/<int:pk>/', PartographEntryDetailView.as_view(), name='partograph_detail'),
    # PDF export
    path('<int:pk>/partograph/pdf/', PartographPDFView.as_view(), name='partograph_pdf'),
]


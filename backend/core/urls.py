from django.urls import path
from .views import AuditLogView
from .fhir_views import FHIRPatientExportView, FHIRBundleExportView

urlpatterns = [
    path('audit/<str:model_name>/<int:pk>/', AuditLogView.as_view(), name='audit-log'),
    # FHIR R4 interoperability endpoints
    path('fhir/patient/<int:pk>/', FHIRPatientExportView.as_view(), name='fhir-patient'),
    path('fhir/patients/', FHIRBundleExportView.as_view(), name='fhir-bundle'),
]

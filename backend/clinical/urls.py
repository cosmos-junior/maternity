from django.urls import path
from .views import (
    ClinicalNoteListCreateView, ClinicalNoteDetailView,
    PatientDocumentListCreateView, PatientDocumentDetailView,
)

urlpatterns = [
    path('notes/', ClinicalNoteListCreateView.as_view(), name='clinical_note_list'),
    path('notes/<int:pk>/', ClinicalNoteDetailView.as_view(), name='clinical_note_detail'),
    path('documents/', PatientDocumentListCreateView.as_view(), name='document_list'),
    path('documents/<int:pk>/', PatientDocumentDetailView.as_view(), name='document_detail'),
]

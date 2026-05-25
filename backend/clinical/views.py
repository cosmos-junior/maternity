from rest_framework import generics, permissions, filters, parsers
from .models import ClinicalNote, PatientDocument
from .serializers import ClinicalNoteSerializer, PatientDocumentSerializer


class ClinicalNoteListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/clinical/notes/?patient=<id>&category=LAB_ORDER
    POST /api/clinical/notes/
    """
    serializer_class = ClinicalNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'lab_test_name', 'medication_name']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = ClinicalNote.objects.select_related('patient', 'created_by').all()
        patient_id = self.request.query_params.get('patient')
        category = self.request.query_params.get('category')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if category:
            qs = qs.filter(category=category)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ClinicalNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PATCH/DELETE /api/clinical/notes/<pk>/
    """
    queryset = ClinicalNote.objects.select_related('patient', 'created_by')
    serializer_class = ClinicalNoteSerializer
    permission_classes = [permissions.IsAuthenticated]


class PatientDocumentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/clinical/documents/?patient=<id>
    POST /api/clinical/documents/  (multipart file upload)
    """
    serializer_class = PatientDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    ordering = ['-created_at']

    def get_queryset(self):
        qs = PatientDocument.objects.select_related('patient', 'uploaded_by').all()
        patient_id = self.request.query_params.get('patient')
        doc_type = self.request.query_params.get('type')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if doc_type:
            qs = qs.filter(document_type=doc_type)
        return qs

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('file')
        mime = uploaded_file.content_type if uploaded_file else ''
        serializer.save(uploaded_by=self.request.user, mime_type=mime)


class PatientDocumentDetailView(generics.RetrieveDestroyAPIView):
    """
    GET/DELETE /api/clinical/documents/<pk>/
    """
    queryset = PatientDocument.objects.select_related('patient', 'uploaded_by')
    serializer_class = PatientDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

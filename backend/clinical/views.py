from rest_framework import generics, permissions, filters, parsers
from rest_framework.exceptions import ValidationError
from .models import ClinicalNote, PatientDocument, ANCVisit
from .serializers import ClinicalNoteSerializer, PatientDocumentSerializer, ANCVisitSerializer

ALLOWED_MIME_TYPES = {
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'}


def validate_upload(file):
    """Raise ValidationError if the uploaded file type is not permitted."""
    import os
    if not file:
        return
    ext = os.path.splitext(file.name)[1].lower()
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise ValidationError(
            f'File type "{file.content_type}" is not allowed. '
            f'Permitted types: PDF, JPEG, PNG, GIF, DOC, DOCX.'
        )
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f'File extension "{ext}" is not allowed.'
        )


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
        validate_upload(uploaded_file)
        mime = uploaded_file.content_type if uploaded_file else ''
        serializer.save(uploaded_by=self.request.user, mime_type=mime)


class PatientDocumentDetailView(generics.RetrieveDestroyAPIView):
    """
    GET/DELETE /api/clinical/documents/<pk>/
    """
    queryset = PatientDocument.objects.select_related('patient', 'uploaded_by')
    serializer_class = PatientDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]


class ANCVisitListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/clinical/anc-visits/?patient=<id>
    POST /api/clinical/anc-visits/
    """
    serializer_class = ANCVisitSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['-visit_date', '-created_at']

    def get_queryset(self):
        qs = ANCVisit.objects.select_related('patient', 'attending_staff').all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(attending_staff=self.request.user)


class ANCVisitDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ANCVisit.objects.select_related('patient', 'attending_staff')
    serializer_class = ANCVisitSerializer
    permission_classes = [permissions.IsAuthenticated]

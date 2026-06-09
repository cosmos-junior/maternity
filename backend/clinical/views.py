from rest_framework import generics, permissions, filters, parsers, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.http import HttpResponse
from django.template.loader import render_to_string
from .models import ClinicalNote, PatientDocument, ANCVisit
from .serializers import ClinicalNoteSerializer, PatientDocumentSerializer, ANCVisitSerializer, ANCVisitSummarySerializer
from patients.serializers import PatientSerializer

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
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['-visit_date', '-created_at']

    def get_serializer_class(self):
        # Use full serializer for staff, summary for mother portal
        if hasattr(self.request.user, 'patient') and self.request.user.patient:
            return ANCVisitSummarySerializer
        return ANCVisitSerializer

    def get_queryset(self):
        qs = ANCVisit.objects.select_related('patient', 'attending_staff').all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(attending_staff=self.request.user)


class ANCVisitDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/clinical/anc-visits/<pk>/
    PATCH /api/clinical/anc-visits/<pk>/
    DELETE /api/clinical/anc-visits/<pk>/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        # Use full serializer for staff, summary for mother portal
        if hasattr(self.request.user, 'patient') and self.request.user.patient:
            return ANCVisitSummarySerializer
        return ANCVisitSerializer

    def get_queryset(self):
        return ANCVisit.objects.select_related('patient', 'attending_staff').all()


class ANCVisitPDFView(APIView):
    """
    GET /api/clinical/anc-visits/<pk>/pdf/
    Generate and return a PDF report of the ANC visit.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            visit = ANCVisit.objects.select_related('patient', 'attending_staff').get(pk=pk)
        except ANCVisit.DoesNotExist:
            return Response({'error': 'ANC visit not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions - only allow access to own patient or staff
        if not request.user.is_staff and not (hasattr(request.user, 'patient') and request.user.patient == visit.patient):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Generate HTML content for PDF
        context = {
            'visit': visit,
            'patient': visit.patient,
            'attending_staff': visit.attending_staff,
        }

        # Try to render PDF using weasyprint if available, otherwise return HTML
        try:
            from weasyprint import HTML
            html_string = render_to_string('clinical/anc_visit_report.html', context)
            pdf = HTML(string=html_string).write_pdf()
            
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="ANC_Visit_{visit.visit_number}_{visit.patient.patient_number}.pdf"'
            return response
        except ImportError:
            # If weasyprint is not installed, return HTML that can be printed
            html_string = render_to_string('clinical/anc_visit_report.html', context)
            response = HttpResponse(html_string, content_type='text/html')
            return response


class MotherANCVisitsView(APIView):
    """
    GET /api/patients/mother/anc-visits/
    List all ANC visits for the logged-in mother (patient portal).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Check if user is a mother
        if not hasattr(request.user, 'patient') or not request.user.patient:
            return Response({'error': 'This endpoint is for patients only'}, status=status.HTTP_403_FORBIDDEN)
        
        patient = request.user.patient
        visits = ANCVisit.objects.filter(patient=patient).order_by('-visit_number')
        serializer = ANCVisitSummarySerializer(visits, many=True)
        return Response(serializer.data)


class MotherANCVisitDetailView(APIView):
    """
    GET /api/patients/mother/anc-visits/<pk>/
    Get details of a specific ANC visit for the logged-in mother.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        # Check if user is a mother
        if not hasattr(request.user, 'patient') or not request.user.patient:
            return Response({'error': 'This endpoint is for patients only'}, status=status.HTTP_403_FORBIDDEN)
        
        patient = request.user.patient
        try:
            visit = ANCVisit.objects.get(pk=pk, patient=patient)
        except ANCVisit.DoesNotExist:
            return Response({'error': 'ANC visit not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ANCVisitSummarySerializer(visit)
        return Response(serializer.data)
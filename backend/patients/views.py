from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Patient, PartographEntry
from .serializers import PatientSerializer, PatientListSerializer, PartographEntrySerializer
from core.permissions import CanEditOwnPartograph

try:
    from django_filters.rest_framework import DjangoFilterBackend
    _django_filter = True
except ImportError:
    _django_filter = False


class PatientListCreateView(generics.ListCreateAPIView):
    """
    GET  — any authenticated user can list patients.
    POST — any authenticated staff can register a new patient.

    Search:   ?search=Jane
    Filters:  ?stage=ANC2&risk=HIGH&edd_from=2026-01-01&edd_to=2026-06-01
    Ordering: ?ordering=-edd  (edd, created_at, full_name, clinic_stage)
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ] + ([DjangoFilterBackend] if _django_filter else [])
    search_fields = ['full_name', 'patient_number', 'phone_number', 'address']
    ordering_fields = ['full_name', 'edd', 'created_at', 'clinic_stage', 'risk_level']
    ordering = ['-created_at']
    filterset_fields = {
        'clinic_stage': ['exact'],
        'risk_level':   ['exact'],
        'edd':          ['gte', 'lte'],
    } if _django_filter else {}

    def get_queryset(self):
        qs = Patient.objects.filter(is_active=True).select_related('registered_by')
        # Manual fallback filters if django-filter not installed
        if not _django_filter:
            stage = self.request.query_params.get('stage')
            risk  = self.request.query_params.get('risk')
            if stage:
                qs = qs.filter(clinic_stage=stage)
            if risk:
                qs = qs.filter(risk_level=risk)
        # Additional convenience filters
        edd_from = self.request.query_params.get('edd_from')
        edd_to   = self.request.query_params.get('edd_to')
        if edd_from and not _django_filter:
            qs = qs.filter(edd__gte=edd_from)
        if edd_to and not _django_filter:
            qs = qs.filter(edd__lte=edd_to)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return PatientListSerializer
        return PatientSerializer

    def perform_create(self, serializer):
        serializer.save(registered_by=self.request.user)


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET / PATCH — any authenticated staff.
    DELETE      — ADMIN only (soft-delete, sets is_active=False).
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        if getattr(request.user, 'role', None) != 'ADMIN':
            return Response(
                {'error': 'Only administrators can deactivate patient records.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        patient = self.get_object()
        patient.is_active = False
        patient.save()
        return Response({'message': 'Patient deactivated successfully.'})


class PatientStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        from appointments.models import Appointment
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)

        appointments = Appointment.objects.filter(patient=patient)
        partograph_count = PartographEntry.objects.filter(patient=patient).count()
        return Response({
            'total_appointments':  appointments.count(),
            'attended':            appointments.filter(status='ATTENDED').count(),
            'missed':              appointments.filter(status='MISSED').count(),
            'upcoming':            appointments.filter(status='UPCOMING').count(),
            'partograph_entries':  partograph_count,
        })


# ─── Partograph API ────────────────────────────────────────────────────────────

class PartographListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/patients/{patient_id}/partograph/  → all entries for that patient
    POST /api/patients/{patient_id}/partograph/  → add a new observation
    """
    serializer_class = PartographEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PartographEntry.objects.filter(
            patient_id=self.kwargs['patient_id']
        ).select_related('recorded_by').order_by('hours_in_labour')

    def perform_create(self, serializer):
        patient = Patient.objects.get(pk=self.kwargs['patient_id'])
        serializer.save(patient=patient, recorded_by=self.request.user)


class PartographEntryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    — any authenticated user.
    PATCH  — nurse who recorded it, or ADMIN.
    DELETE — nurse who recorded it, or ADMIN.
    """
    serializer_class = PartographEntrySerializer
    permission_classes = [permissions.IsAuthenticated, CanEditOwnPartograph]

    def get_queryset(self):
        return PartographEntry.objects.filter(
            patient_id=self.kwargs['patient_id']
        ).select_related('recorded_by')

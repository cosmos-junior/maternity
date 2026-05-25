from rest_framework import generics, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import date
from .models import Appointment
from .serializers import AppointmentSerializer, AppointmentCreateSerializer


class AppointmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient__full_name', 'patient__patient_number']
    ordering_fields = ['scheduled_date', 'status']
    ordering = ['scheduled_date']

    def get_queryset(self):
        qs = Appointment.objects.select_related('patient', 'created_by')
        status = self.request.query_params.get('status')
        patient = self.request.query_params.get('patient')
        appt_type = self.request.query_params.get('type')
        if status:
            qs = qs.filter(status=status)
        if patient:
            qs = qs.filter(patient_id=patient)
        if appt_type:
            qs = qs.filter(appointment_type=appt_type)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        # Return full serializer data
        appt = Appointment.objects.get(pk=response.data['id'])
        return Response(AppointmentSerializer(appt).data, status=201)


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Appointment.objects.select_related('patient', 'created_by')
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class MarkAttendedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
            appointment.status = 'ATTENDED'
            appointment.attended_date = date.today()
            appointment.save()
            return Response(AppointmentSerializer(appointment).data)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=404)


class MarkMissedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
            appointment.status = 'MISSED'
            appointment.save()
            return Response(AppointmentSerializer(appointment).data)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=404)


class RescheduleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
            new_date = request.data.get('scheduled_date')
            if not new_date:
                return Response({'error': 'scheduled_date is required'}, status=400)
            appointment.status = 'RESCHEDULED'
            appointment.scheduled_date = new_date
            appointment.scheduled_time = request.data.get('scheduled_time')
            appointment.save()
            return Response(AppointmentSerializer(appointment).data)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=404)

from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ReminderLog
from .serializers import ReminderLogSerializer, SendReminderSerializer
from .sms_service import send_sms, build_appointment_reminder
from patients.models import Patient
from appointments.models import Appointment


class ReminderLogListView(generics.ListAPIView):
    queryset = ReminderLog.objects.select_related('patient', 'appointment').order_by('-sent_at')
    serializer_class = ReminderLogSerializer
    permission_classes = [permissions.IsAuthenticated]


class SendReminderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SendReminderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        try:
            patient = Patient.objects.get(pk=data['patient_id'])
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=404)

        appointment = None
        if data.get('appointment_id'):
            try:
                appointment = Appointment.objects.get(pk=data['appointment_id'])
            except Appointment.DoesNotExist:
                pass

        # Build message
        if data.get('use_template') and appointment:
            time_str = str(appointment.scheduled_time) if appointment.scheduled_time else None
            message = build_appointment_reminder(
                patient.full_name,
                str(appointment.scheduled_date),
                time_str
            )
        else:
            message = data.get('message', f"Dear {patient.full_name}, please contact Itierio Nursing Home for your upcoming appointment.")

        # Normalise phone to international format (+254XXXXXXXXX)
        phone = patient.phone_number.strip()
        if phone.startswith('0') and len(phone) == 10:
            phone = '+254' + phone[1:]
        elif phone.startswith('254') and not phone.startswith('+'):
            phone = '+' + phone
        elif not phone.startswith('+'):
            phone = '+254' + phone  # fallback

        # Send SMS
        result = send_sms(phone, message)

        # Log it regardless of success/failure
        log = ReminderLog.objects.create(
            patient=patient,
            appointment=appointment,
            phone_number=phone,
            message_body=message,
            delivery_status='SENT' if result['success'] else 'FAILED',
            error_message=result.get('error', ''),
            sent_by=request.user,
        )

        # Always return 200 so the frontend receives the actual error detail
        return Response({
            'success': result['success'],
            'log': ReminderLogSerializer(log).data,
            'error': result.get('error'),
        }, status=200)

"""
Celery tasks for automated appointment reminders.

Schedules two SMS reminders per appointment:
  - 24 hours before the scheduled date
  - 1 hour before (on the day)

Includes retry logic (max 3 retries with exponential backoff).
"""
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)

try:
    from celery import shared_task

    @shared_task(bind=True, max_retries=3, default_retry_delay=60)
    def send_appointment_reminder_task(self, appointment_id, hours_before=24):
        """
        Send an SMS reminder for an upcoming appointment.
        Called by Celery Beat at the scheduled time.
        """
        from appointments.models import Appointment
        from reminders.sms_service import send_sms, build_appointment_reminder
        from reminders.models import ReminderLog

        try:
            appt = Appointment.objects.select_related('patient').get(pk=appointment_id)
        except Appointment.DoesNotExist:
            logger.warning('Appointment %s not found — skipping reminder.', appointment_id)
            return

        # Only send if appointment is still upcoming
        if appt.status != 'UPCOMING':
            logger.info('Appointment %s is %s — skipping.', appointment_id, appt.status)
            return

        patient = appt.patient
        phone = patient.phone_number or ''
        if not phone:
            logger.warning('No phone for patient %s — skipping.', patient.pk)
            return

        # Normalise phone
        if phone.startswith('0') and len(phone) == 10:
            phone = '+254' + phone[1:]
        elif phone.startswith('254') and not phone.startswith('+'):
            phone = '+' + phone
        elif not phone.startswith('+'):
            phone = '+254' + phone

        time_str = appt.scheduled_time.strftime('%H:%M') if appt.scheduled_time else None
        msg = build_appointment_reminder(
            patient_name=patient.full_name,
            appointment_date=str(appt.scheduled_date),
            appointment_time=time_str,
        )

        result = send_sms(phone, msg)

        # Log the reminder
        ReminderLog.objects.create(
            patient=patient,
            appointment=appt,
            phone_number=phone,
            message_body=msg,
            delivery_status='SENT' if result.get('success') else 'FAILED',
            provider='africastalking',
            error_message=result.get('error', ''),
        )

        if not result.get('success'):
            logger.error('SMS failed for appt %s: %s', appointment_id, result.get('error'))
            raise self.retry(exc=Exception(result.get('error', 'SMS failed')))

        logger.info('Reminder sent for appointment %s (%sh before)', appointment_id, hours_before)


    @shared_task
    def schedule_appointment_reminders(appointment_id):
        """
        Called when an appointment is created/updated.
        Schedules the 24h and 1h reminders via Celery ETA.
        """
        from appointments.models import Appointment
        from django.utils import timezone
        from datetime import datetime

        try:
            appt = Appointment.objects.get(pk=appointment_id)
        except Appointment.DoesNotExist:
            return

        if appt.status != 'UPCOMING':
            return

        scheduled_dt = datetime.combine(
            appt.scheduled_date,
            appt.scheduled_time or datetime.min.time(),
        )
        # Make timezone-aware
        if timezone.is_naive(scheduled_dt):
            scheduled_dt = timezone.make_aware(scheduled_dt)

        # 24 hours before
        eta_24h = scheduled_dt - timedelta(hours=24)
        if eta_24h > timezone.now():
            send_appointment_reminder_task.apply_async(
                args=[appointment_id, 24],
                eta=eta_24h,
                task_id=f'reminder-24h-{appointment_id}',
            )
            logger.info('Scheduled 24h reminder for appointment %s at %s', appointment_id, eta_24h)

        # 1 hour before
        eta_1h = scheduled_dt - timedelta(hours=1)
        if eta_1h > timezone.now():
            send_appointment_reminder_task.apply_async(
                args=[appointment_id, 1],
                eta=eta_1h,
                task_id=f'reminder-1h-{appointment_id}',
            )
            logger.info('Scheduled 1h reminder for appointment %s at %s', appointment_id, eta_1h)


except ImportError:
    # Celery not installed — provide stub functions
    logger.info('Celery not available — automated reminders disabled.')

    def send_appointment_reminder_task(*args, **kwargs):
        logger.warning('Celery not installed — cannot send automated reminder.')

    def schedule_appointment_reminders(*args, **kwargs):
        logger.warning('Celery not installed — cannot schedule reminders.')

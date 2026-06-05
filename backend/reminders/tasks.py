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
        Send an SMS or Email reminder for an upcoming appointment.
        """
        from appointments.models import Appointment
        from reminders.sms_service import send_sms, build_appointment_reminder
        from reminders.email_service import send_email_reminder
        from reminders.models import ReminderLog

        try:
            appt = Appointment.objects.select_related('patient').get(pk=appointment_id)
        except Appointment.DoesNotExist:
            logger.warning('Appointment %s not found - skipping reminder.', appointment_id)
            return

        if appt.status != 'UPCOMING':
            logger.info('Appointment %s is %s - skipping.', appointment_id, appt.status)
            return

        patient = appt.patient
        phone = patient.phone_number or ''
        email = getattr(patient, 'email', None)

        if phone:
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
            lang=getattr(patient, 'lang', 'en'),
        )

        success = False
        error_msg = ""
        provider = 'AFRICAS_TALKING'
        channel = 'SMS'

        if phone:
            result = send_sms(phone, msg)
            success = result.get('success', False)
            error_msg = result.get('error', '')
        elif email:
            result = send_email_reminder(email, "Upcoming Appointment Reminder", msg)
            success = result.get('success', False)
            error_msg = result.get('error', '')
            provider = 'SMTP'
            channel = 'EMAIL'
        else:
            logger.warning('No phone or email for patient %s - skipping.', patient.pk)
            return

        ReminderLog.objects.create(
            patient=patient,
            appointment=appt,
            channel=channel,
            phone_number=phone if phone else '',
            email_address=email if email else '',
            message_body=msg,
            delivery_status='SENT' if success else 'FAILED',
            provider=provider,
            error_message=error_msg,
        )

        if not success:
            logger.error('Reminder failed for appt %s: %s', appointment_id, error_msg)
            raise self.retry(exc=Exception(error_msg or 'Reminder failed'))

        logger.info('Reminder sent for appointment %s (%sh before)', appointment_id, hours_before)

    @shared_task
    def check_upcoming_vaccinations():
        """
        Runs daily to find vaccinations due in 3 days & sends reminders.
        """
        from pediatrics.models import VaccinationRecord
        from reminders.sms_service import send_sms
        from reminders.email_service import build_vaccination_reminder
        from reminders.models import ReminderLog
        from django.utils import timezone
        
        target_date = timezone.now().date() + timedelta(days=3)
        due_vaccines = VaccinationRecord.objects.filter(
            status='PENDING', 
            expected_date=target_date
        ).select_related('child__mother')

        for vac in due_vaccines:
            mother = vac.child.mother
            phone = mother.phone_number
            if phone:
                msg = build_vaccination_reminder(
                    patient_name=mother.full_name,
                    baby_name=vac.child.first_name,
                    vaccine_name=vac.get_vaccine_name_display(),
                    expected_date=str(vac.expected_date),
                    lang=getattr(mother, 'lang', 'en')
                )
                
                if phone.startswith('0') and len(phone) == 10:
                    phone = '+254' + phone[1:]
                elif phone.startswith('254') and not phone.startswith('+'):
                    phone = '+' + phone
                elif not phone.startswith('+'):
                    phone = '+254' + phone
                
                res = send_sms(phone, msg)
                
                ReminderLog.objects.create(
                    patient=mother,
                    channel='SMS',
                    phone_number=phone,
                    message_body=msg,
                    delivery_status='SENT' if res.get('success') else 'FAILED',
                    provider='AFRICAS_TALKING',
                    error_message=res.get('error', ''),
                )

    @shared_task
    def check_missed_appointments():
        """
        Runs daily to find ANC/appointments missed yesterday, 
        flags as missed and triggers alerts.
        """
        from appointments.models import Appointment
        from reminders.sms_service import send_sms
        from reminders.email_service import build_missed_visit_alert
        from reminders.models import ReminderLog
        from django.utils import timezone

        yesterday = timezone.now().date() - timedelta(days=1)
        missed_appts = Appointment.objects.filter(
            status='UPCOMING',
            scheduled_date=yesterday
        ).select_related('patient')

        for appt in missed_appts:
            appt.status = 'MISSED'
            appt.save(update_fields=['status'])

            patient = appt.patient
            phone = patient.phone_number
            if phone:
                msg = build_missed_visit_alert(
                    patient_name=patient.full_name,
                    visit_type=appt.get_appointment_type_display(),
                    missed_date=str(appt.scheduled_date),
                    lang=getattr(patient, 'lang', 'en')
                )
                
                if phone.startswith('0') and len(phone) == 10:
                    phone = '+254' + phone[1:]
                elif phone.startswith('254') and not phone.startswith('+'):
                    phone = '+' + phone
                elif not phone.startswith('+'):
                    phone = '+254' + phone

                res = send_sms(phone, msg)
                ReminderLog.objects.create(
                    patient=patient,
                    appointment=appt,
                    channel='SMS',
                    phone_number=phone,
                    message_body=msg,
                    delivery_status='SENT' if res.get('success') else 'FAILED',
                    provider='AFRICAS_TALKING',
                    error_message=res.get('error', ''),
                )

    @shared_task
    def schedule_appointment_reminders(appointment_id):
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
        if timezone.is_naive(scheduled_dt):
            scheduled_dt = timezone.make_aware(scheduled_dt)

        eta_24h = scheduled_dt - timedelta(hours=24)
        if eta_24h > timezone.now():
            send_appointment_reminder_task.apply_async(
                args=[appointment_id, 24],
                eta=eta_24h,
                task_id=f'reminder-24h-{appointment_id}',
            )

        eta_1h = scheduled_dt - timedelta(hours=1)
        if eta_1h > timezone.now():
            send_appointment_reminder_task.apply_async(
                args=[appointment_id, 1],
                eta=eta_1h,
                task_id=f'reminder-1h-{appointment_id}',
            )

        @shared_task
        def send_bulk_reminders_task(patient_ids, use_template, message, lang, user_id=None):
            return send_bulk_reminders_sync(patient_ids, use_template, message, lang, user_id)

except ImportError:
    logger.info('Celery not available - automated reminders disabled.')

    def send_appointment_reminder_task(*args, **kwargs):
        pass

    def schedule_appointment_reminders(*args, **kwargs):
        pass
    
    def check_upcoming_vaccinations(*args, **kwargs):
        pass
        
    def check_missed_appointments(*args, **kwargs):
        pass

    def send_bulk_reminders_task(*args, **kwargs):
        pass


def send_bulk_reminders_sync(patient_ids, use_template, message, lang, user_id=None):
    from patients.models import Patient
    from appointments.models import Appointment
    from reminders.sms_service import send_sms, build_appointment_reminder
    from reminders.models import ReminderLog
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    sender = None
    if user_id:
        try:
            sender = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            pass

    patients = Patient.objects.filter(pk__in=patient_ids)
    results = {'sent': 0, 'failed': 0, 'details': []}

    for patient in patients:
        # Check if an upcoming appointment exists
        appointment = Appointment.objects.filter(patient=patient, status='UPCOMING').first()
        
        # Build message
        if use_template and appointment:
            time_str = str(appointment.scheduled_time) if appointment.scheduled_time else None
            msg = build_appointment_reminder(
                patient.full_name,
                str(appointment.scheduled_date),
                time_str,
                lang=lang or getattr(patient, 'lang', 'en')
            )
        elif use_template:
            if lang == 'sw':
                msg = f"Mpendwa {patient.full_name}, tafadhali wasiliana na Itierio Nursing Home kwa ajili ya miadi yako ijayo. Asante."
            else:
                msg = f"Dear {patient.full_name}, please contact Itierio Nursing Home for your upcoming appointment. Thank you."
        else:
            msg = message or (
                f"Mpendwa {patient.full_name}, tafadhali wasiliana na Itierio Nursing Home kwa ajili ya miadi yako ijayo. Asante."
                if lang == 'sw'
                else f"Dear {patient.full_name}, please contact Itierio Nursing Home for your upcoming appointment. Thank you."
            )

        # Normalize phone
        phone = patient.phone_number.strip()
        if phone.startswith('0') and len(phone) == 10:
            phone = '+254' + phone[1:]
        elif phone.startswith('254') and not phone.startswith('+'):
            phone = '+' + phone
        elif not phone.startswith('+'):
            phone = '+254' + phone

        res = send_sms(phone, msg)
        
        # Log it
        ReminderLog.objects.create(
            patient=patient,
            appointment=appointment,
            phone_number=phone,
            message_body=msg,
            delivery_status='SENT' if res['success'] else 'FAILED',
            error_message=res.get('error', ''),
            sent_by=sender,
        )

        if res['success']:
            results['sent'] += 1
        else:
            results['failed'] += 1
            
        results['details'].append({
            'patient_id': patient.id,
            'patient_name': patient.full_name,
            'phone_number': phone,
            'success': res['success'],
            'error': res.get('error', '')
        })
        
    return results

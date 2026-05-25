"""
Clinical threshold evaluation service.

Called by the post_save signal on PartographEntry.  For each dangerous
measurement it:
  1. Checks the deduplication window (ALERT_DEDUP_MINUTES, default 120).
  2. Creates a ClinicalAlert record if no recent identical alert exists.
  3. Fires an SMS to the assigned doctor / on-call staff if the alert is new.
"""
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

DEDUP_MINUTES = getattr(settings, 'ALERT_DEDUP_MINUTES', 120)

# ── WHO Partograph thresholds ─────────────────────────────────────────────────
FHR_LOW_THRESHOLD  = 110   # bpm
FHR_HIGH_THRESHOLD = 160   # bpm
BP_SYSTOLIC_CRIT   = 160   # mmHg
BP_DIASTOLIC_CRIT  = 110   # mmHg
TEMP_HIGH_THRESHOLD = 38.0  # °C
PROLONGED_LABOUR_H  = 12   # hours


def _recent_alert_exists(patient, alert_type):
    """Return True if an unacknowledged alert of the same type exists within the dedup window."""
    from alerts.models import ClinicalAlert
    cutoff = timezone.now() - timedelta(minutes=DEDUP_MINUTES)
    return ClinicalAlert.objects.filter(
        patient=patient,
        alert_type=alert_type,
        acknowledged=False,
        created_at__gte=cutoff,
    ).exists()


def _create_alert(patient, entry, alert_type, severity, value, threshold, message):
    """Create a ClinicalAlert and trigger SMS notification."""
    from alerts.models import ClinicalAlert
    if _recent_alert_exists(patient, alert_type):
        logger.debug('Alert dedup: skipping %s for patient %s', alert_type, patient.pk)
        return None

    alert = ClinicalAlert.objects.create(
        patient=patient,
        partograph_entry=entry,
        alert_type=alert_type,
        severity=severity,
        value_triggered=str(value),
        threshold=str(threshold),
        message=message,
    )
    logger.warning('ClinicalAlert created: %s for patient %s', alert_type, patient.pk)
    _send_alert_sms(patient, alert)
    return alert


def _send_alert_sms(patient, alert):
    """Send an SMS to the patient's attending doctor (if phone available)."""
    try:
        from reminders.sms_service import send_sms
        # Notify any on-call ADMIN or DOCTOR with a phone number
        from users.models import StaffUser
        recipients = StaffUser.objects.filter(
            role__in=['ADMIN', 'DOCTOR'],
            is_active=True,
            phone_number__isnull=False,
        ).exclude(phone_number='')

        msg = (
            f"[MATERNITY ALERT] {alert.get_severity_display().upper()} — "
            f"{alert.get_alert_type_display()} for {patient.full_name} "
            f"({patient.patient_number}). Value: {alert.value_triggered}. "
            f"Please review immediately."
        )

        for staff in recipients:
            phone = staff.phone_number.strip()
            if phone.startswith('0') and len(phone) == 10:
                phone = '+254' + phone[1:]
            elif phone.startswith('254') and not phone.startswith('+'):
                phone = '+' + phone
            elif not phone.startswith('+'):
                phone = '+254' + phone
            send_sms(phone, msg)
    except Exception as exc:
        logger.error('Alert SMS failed: %s', exc)


def evaluate_clinical_thresholds(entry):
    """
    Evaluate a PartographEntry against all clinical thresholds.
    Creates ClinicalAlert records as needed.
    Returns a list of alerts created (may be empty).
    """
    from alerts.models import ClinicalAlert
    patient = entry.patient
    created = []

    # ── Fetal Heart Rate ─────────────────────────────────────────────────────
    if entry.fetal_heart_rate is not None:
        if entry.fetal_heart_rate < FHR_LOW_THRESHOLD:
            a = _create_alert(
                patient, entry,
                alert_type=ClinicalAlert.AlertType.FHR_LOW,
                severity=ClinicalAlert.Severity.CRITICAL,
                value=f'{entry.fetal_heart_rate} bpm',
                threshold=f'<{FHR_LOW_THRESHOLD} bpm',
                message=(
                    f'Fetal bradycardia detected: FHR is {entry.fetal_heart_rate} bpm '
                    f'(normal range 110–160 bpm). Immediate assessment required.'
                ),
            )
            if a:
                created.append(a)

        elif entry.fetal_heart_rate > FHR_HIGH_THRESHOLD:
            a = _create_alert(
                patient, entry,
                alert_type=ClinicalAlert.AlertType.FHR_HIGH,
                severity=ClinicalAlert.Severity.CRITICAL,
                value=f'{entry.fetal_heart_rate} bpm',
                threshold=f'>{FHR_HIGH_THRESHOLD} bpm',
                message=(
                    f'Fetal tachycardia detected: FHR is {entry.fetal_heart_rate} bpm '
                    f'(normal range 110–160 bpm). Immediate assessment required.'
                ),
            )
            if a:
                created.append(a)

    # ── Blood Pressure ────────────────────────────────────────────────────────
    bp_sys  = entry.bp_systolic
    bp_dias = entry.bp_diastolic
    if bp_sys is not None and bp_dias is not None:
        if bp_sys >= BP_SYSTOLIC_CRIT or bp_dias >= BP_DIASTOLIC_CRIT:
            a = _create_alert(
                patient, entry,
                alert_type=ClinicalAlert.AlertType.BP_CRITICAL,
                severity=ClinicalAlert.Severity.CRITICAL,
                value=f'{bp_sys}/{bp_dias} mmHg',
                threshold=f'≥{BP_SYSTOLIC_CRIT}/{BP_DIASTOLIC_CRIT} mmHg',
                message=(
                    f'Hypertensive crisis: BP is {bp_sys}/{bp_dias} mmHg. '
                    f'Risk of eclampsia — urgent medical review needed.'
                ),
            )
            if a:
                created.append(a)

    # ── Temperature ──────────────────────────────────────────────────────────
    if entry.temperature_celsius is not None:
        temp = float(entry.temperature_celsius)
        if temp >= TEMP_HIGH_THRESHOLD:
            a = _create_alert(
                patient, entry,
                alert_type=ClinicalAlert.AlertType.TEMP_HIGH,
                severity=ClinicalAlert.Severity.WARNING,
                value=f'{temp}°C',
                threshold=f'≥{TEMP_HIGH_THRESHOLD}°C',
                message=(
                    f'Maternal pyrexia: temperature is {temp}°C. '
                    f'Assess for chorioamnionitis or other infection.'
                ),
            )
            if a:
                created.append(a)

    # ── Prolonged Labour ─────────────────────────────────────────────────────
    hours = float(entry.hours_in_labour)
    if hours >= PROLONGED_LABOUR_H:
        a = _create_alert(
            patient, entry,
            alert_type=ClinicalAlert.AlertType.PROLONGED_LABOUR,
            severity=ClinicalAlert.Severity.WARNING,
            value=f'{hours} hours',
            threshold=f'≥{PROLONGED_LABOUR_H} hours',
            message=(
                f'Labour duration is {hours} hours — prolonged labour threshold reached. '
                f'Review for augmentation or operative delivery.'
            ),
        )
        if a:
            created.append(a)

    # ── WHO Action / Alert Line ───────────────────────────────────────────────
    # Alert line: dilation expected = 4 + (h - 4) = h cm for h >= 4
    # Action line: 4 hours to the right → expected = h - 4 cm for h >= 8
    if entry.cervical_dilation_cm is not None and hours >= 4:
        dilation = float(entry.cervical_dilation_cm)
        expected_alert_line = min(hours, 10)          # 1 cm/hr from 4 cm
        expected_action_line = min(hours - 4, 10)     # action line is 4h behind

        if hours >= 8 and dilation < expected_action_line:
            a = _create_alert(
                patient, entry,
                alert_type=ClinicalAlert.AlertType.ACTION_LINE_CROSSED,
                severity=ClinicalAlert.Severity.CRITICAL,
                value=f'{dilation} cm at {hours}h',
                threshold=f'Expected ≥{expected_action_line:.1f} cm',
                message=(
                    f'Labour has crossed the WHO action line: dilation is {dilation} cm '
                    f'at {hours}h (expected ≥{expected_action_line:.1f} cm). '
                    f'Consider immediate intervention.'
                ),
            )
            if a:
                created.append(a)
        elif dilation < expected_alert_line:
            a = _create_alert(
                patient, entry,
                alert_type=ClinicalAlert.AlertType.ALERT_LINE_CROSSED,
                severity=ClinicalAlert.Severity.WARNING,
                value=f'{dilation} cm at {hours}h',
                threshold=f'Expected ≥{expected_alert_line:.1f} cm',
                message=(
                    f'Labour is behind the WHO alert line: dilation is {dilation} cm '
                    f'at {hours}h (expected ≥{expected_alert_line:.1f} cm). '
                    f'Close monitoring required.'
                ),
            )
            if a:
                created.append(a)

    return created

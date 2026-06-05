from django.db import models, transaction
from datetime import date, timedelta
from core.fields import EncryptedCharField
import hashlib
try:
    from simple_history.models import HistoricalRecords
    _history_available = True
except ImportError:
    _history_available = False
    HistoricalRecords = None


def generate_patient_number():
    """Atomically generate a unique patient number in format MAT-001."""
    with transaction.atomic():
        last = Patient.objects.select_for_update().order_by('-id').first()
        if last and last.patient_number:
            try:
                num = int(last.patient_number.split('-')[1]) + 1
            except (IndexError, ValueError):
                num = 1
        else:
            num = 1
        return f'MAT-{num:03d}'


class Patient(models.Model):
    CLINIC_STAGE_CHOICES = [
        ('ANC1', 'ANC Visit 1'),
        ('ANC2', 'ANC Visit 2'),
        ('ANC3', 'ANC Visit 3'),
        ('ANC4', 'ANC Visit 4'),
        ('DELIVERED', 'Delivered'),
        ('POSTNATAL', 'Postnatal'),
    ]
    RISK_CHOICES = [
        ('LOW', 'Low Risk'),
        ('MEDIUM', 'Medium Risk'),
        ('HIGH', 'High Risk'),
    ]
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    ]

    patient_number = models.CharField(max_length=20, unique=True, blank=True)
    full_name = models.CharField(max_length=200)
    national_id = EncryptedCharField(blank=True, null=True, verbose_name="National ID")
    nhif_number = EncryptedCharField(blank=True, null=True, verbose_name="NHIF Number")
    phone_number = EncryptedCharField()
    next_of_kin_name = models.CharField(max_length=200, blank=True)
    next_of_kin_phone = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    lmp = models.DateField(verbose_name='Last Menstrual Period')
    edd = models.DateField(verbose_name='Expected Delivery Date', blank=True)
    clinic_stage = models.CharField(max_length=20, choices=CLINIC_STAGE_CHOICES, default='ANC1')
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES, default='LOW')
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, default='O+')
    LANG_CHOICES = [
        ('en', 'English'),
        ('sw', 'Swahili'),
    ]
    lang = models.CharField(max_length=2, choices=LANG_CHOICES, default='en', verbose_name='Preferred Language')
    medical_history = models.TextField(blank=True)
    surgical_history = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    family_history = models.TextField(blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    registered_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='registered_patients'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    national_id_hash = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    nhif_number_hash = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    phone_number_hash = models.CharField(max_length=64, blank=True, null=True, db_index=True)

    # Audit trail
    history = HistoricalRecords() if _history_available else None

    class Meta:
        db_table = 'patients'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['edd'],          name='patients_edd_idx'),
            models.Index(fields=['risk_level'],    name='patients_risk_idx'),
            models.Index(fields=['clinic_stage'],  name='patients_stage_idx'),
            models.Index(fields=['is_active'],     name='patients_active_idx'),
            models.Index(fields=['national_id_hash'], name='patients_nat_hash_idx'),
            models.Index(fields=['nhif_number_hash'], name='patients_nhif_hash_idx'),
            models.Index(fields=['phone_number_hash'], name='patients_ph_hash_idx'),
        ]

    def save(self, *args, **kwargs):
        if not self.patient_number:
            self.patient_number = generate_patient_number()
        if self.lmp and not self.edd:
            self.edd = self.lmp + timedelta(days=280)

        # Calculate SHA-256 hashes for searching
        if self.national_id:
            normalized = str(self.national_id).strip()
            self.national_id_hash = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
        else:
            self.national_id_hash = None

        if self.nhif_number:
            normalized = str(self.nhif_number).strip()
            self.nhif_number_hash = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
        else:
            self.nhif_number_hash = None

        if self.phone_number:
            normalized = str(self.phone_number).strip()
            self.phone_number_hash = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
        else:
            self.phone_number_hash = None

        super().save(*args, **kwargs)

    @property
    def age(self):
        if self.date_of_birth:
            today = date.today()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None

    @property
    def weeks_pregnant(self):
        if self.lmp:
            days = (date.today() - self.lmp).days
            return max(0, days // 7)
        return None

    @property
    def days_to_edd(self):
        if self.edd:
            return (self.edd - date.today()).days
        return None

    @property
    def is_overdue(self):
        return self.days_to_edd is not None and self.days_to_edd < 0

    @property
    def is_due_soon(self):
        d = self.days_to_edd
        return d is not None and 0 <= d <= 7

    def __str__(self):
        return f"{self.patient_number} — {self.full_name}"


# ─── Partograph ────────────────────────────────────────────────────────────────

class PartographEntry(models.Model):
    """
    A single time-point observation recorded during active labour.
    Multiple entries per patient build the partograph chart over time.
    """
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='partograph_entries'
    )
    recorded_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='partograph_records'
    )

    # Time axis — hours since labour onset (0–24)
    hours_in_labour = models.DecimalField(
        max_digits=4, decimal_places=1,
        help_text='Hours elapsed since active labour onset (0–24)'
    )
    recorded_at = models.DateTimeField(auto_now_add=True)

    # ── Cervimetry ──────────────────────────────────────────────────────────────
    cervical_dilation_cm = models.DecimalField(
        max_digits=3, decimal_places=1, null=True, blank=True,
        help_text='Cervical dilation in cm (0–10)'
    )
    descent_station = models.IntegerField(
        null=True, blank=True,
        help_text='Station of presenting part (-5 to +5)'
    )

    # ── Fetal parameters ────────────────────────────────────────────────────────
    fetal_heart_rate = models.IntegerField(
        null=True, blank=True,
        help_text='Fetal heart rate in bpm (60–200)'
    )
    MOULDING_CHOICES = [('0', 'None'), ('1', '+'), ('2', '++'), ('3', '+++')]
    moulding = models.CharField(
        max_length=1, choices=MOULDING_CHOICES, blank=True, default='0'
    )
    LIQUOR_CHOICES = [('I', 'Intact'), ('C', 'Clear'), ('M', 'Meconium'), ('B', 'Blood'), ('A', 'Absent')]
    liquor = models.CharField(max_length=1, choices=LIQUOR_CHOICES, blank=True, default='I')

    # ── Contractions (per 10 minutes) ───────────────────────────────────────────
    contractions_per_10min = models.IntegerField(
        null=True, blank=True,
        help_text='Number of contractions per 10 minutes (0–5)'
    )
    CONTRACTION_DURATION_CHOICES = [
        ('<20', '< 20 sec'), ('20-40', '20–40 sec'), ('>40', '> 40 sec')
    ]
    contraction_duration = models.CharField(
        max_length=5, choices=CONTRACTION_DURATION_CHOICES, blank=True
    )

    # ── Maternal vitals ─────────────────────────────────────────────────────────
    bp_systolic = models.IntegerField(null=True, blank=True, help_text='Systolic BP mmHg')
    bp_diastolic = models.IntegerField(null=True, blank=True, help_text='Diastolic BP mmHg')
    pulse_rate = models.IntegerField(null=True, blank=True, help_text='Maternal pulse bpm')
    temperature_celsius = models.DecimalField(
        max_digits=4, decimal_places=1, null=True, blank=True
    )
    urine_volume_ml = models.IntegerField(null=True, blank=True)
    URINE_PROTEIN_CHOICES = [('NIL', 'Nil'), ('+', '+'), ('++', '++'), ('+++', '+++')]
    urine_protein = models.CharField(max_length=3, choices=URINE_PROTEIN_CHOICES, blank=True, default='NIL')

    # ── Drugs & fluids ──────────────────────────────────────────────────────────
    oxytocin_units = models.IntegerField(null=True, blank=True, help_text='Oxytocin units/L')
    iv_fluids_ml = models.IntegerField(null=True, blank=True)
    drugs_given = models.TextField(blank=True)

    notes = models.TextField(blank=True)

    # Audit trail
    history = HistoricalRecords() if _history_available else None

    class Meta:
        db_table = 'partograph_entries'
        ordering = ['hours_in_labour']
        verbose_name = 'Partograph Entry'

    def __str__(self):
        return f"{self.patient} — {self.hours_in_labour}h"

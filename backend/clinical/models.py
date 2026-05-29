from django.db import models

try:
    from simple_history.models import HistoricalRecords
    _history_available = True
except ImportError:
    _history_available = False
    HistoricalRecords = None


class ClinicalNote(models.Model):
    """
    Doctor/nurse clinical notes attached to a patient visit.
    Supports categorization (Consultation, Lab, Referral, etc.)
    """
    CATEGORY_CHOICES = [
        ('CONSULTATION', 'Consultation'),
        ('LAB_ORDER', 'Lab Order'),
        ('LAB_RESULT', 'Lab Result'),
        ('PRESCRIPTION', 'Prescription'),
        ('REFERRAL', 'Referral'),
        ('OBSERVATION', 'Observation'),
        ('DISCHARGE', 'Discharge Summary'),
    ]
    PRIORITY_CHOICES = [
        ('ROUTINE', 'Routine'),
        ('URGENT', 'Urgent'),
        ('STAT', 'STAT'),
    ]

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='clinical_notes'
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='CONSULTATION')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='ROUTINE')
    title = models.CharField(max_length=200)
    content = models.TextField()
    diagnosis_codes = models.CharField(
        max_length=200, blank=True,
        help_text='Comma-separated ICD-10 codes (e.g. O14.1, O24.4)'
    )

    # Lab-specific fields
    lab_test_name = models.CharField(max_length=200, blank=True)
    lab_result_value = models.CharField(max_length=200, blank=True)
    lab_result_unit = models.CharField(max_length=50, blank=True)
    lab_reference_range = models.CharField(max_length=100, blank=True)
    lab_is_abnormal = models.BooleanField(default=False)

    # Prescription-specific fields
    medication_name = models.CharField(max_length=200, blank=True)
    dosage = models.CharField(max_length=100, blank=True)
    frequency = models.CharField(max_length=100, blank=True)
    duration = models.CharField(max_length=100, blank=True)

    created_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL,
        null=True, related_name='authored_notes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clinical_notes'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.category}] {self.patient.full_name} — {self.title}"


class PatientDocument(models.Model):
    """
    File uploads (scans, lab PDFs, ultrasound images) for a patient.
    """
    DOCUMENT_TYPE_CHOICES = [
        ('LAB_REPORT', 'Lab Report'),
        ('ULTRASOUND', 'Ultrasound'),
        ('SCAN', 'Scan / X-Ray'),
        ('PRESCRIPTION', 'Prescription'),
        ('REFERRAL', 'Referral Letter'),
        ('CONSENT', 'Consent Form'),
        ('ID_DOCUMENT', 'ID Document'),
        ('OTHER', 'Other'),
    ]

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='documents'
    )
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES, default='OTHER')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='patient_documents/%Y/%m/')
    file_size_bytes = models.PositiveIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True)

    uploaded_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL,
        null=True, related_name='uploaded_documents'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'patient_documents'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.file:
            self.file_size_bytes = self.file.size
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.document_type}] {self.patient.full_name} — {self.title}"

class ANCVisit(models.Model):
    """
    Structured Antenatal Care (ANC) visit data tracking.
    """
    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='anc_visits'
    )
    visit_number = models.PositiveIntegerField(help_text="e.g. 1 for ANC1, 2 for ANC2")
    visit_date = models.DateField(auto_now_add=True)
    
    # Vitals & Measurements
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    bp_systolic = models.IntegerField(null=True, blank=True)
    bp_diastolic = models.IntegerField(null=True, blank=True)
    hemoglobin_gdl = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    
    # Pregnancy Specifics
    fundal_height_cm = models.IntegerField(null=True, blank=True)
    fetal_heart_rate = models.IntegerField(null=True, blank=True)
    PRESENTATION_CHOICES = [
        ('CEPHALIC', 'Cephalic'),
        ('BREECH', 'BREECH'),
        ('TRANSVERSE', 'Transverse')
    ]
    fetal_presentation = models.CharField(max_length=15, choices=PRESENTATION_CHOICES, blank=True)
    
    # Clinical info
    ultrasound_results = models.TextField(blank=True)
    lab_tests_summary = models.TextField(blank=True)
    complications_noted = models.TextField(blank=True, help_text="Notes on any high-risk complications")
    medication_prescribed = models.TextField(blank=True)
    general_notes = models.TextField(blank=True)

    next_appointment_date = models.DateField(null=True, blank=True)

    attending_staff = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL, null=True, related_name='anc_consultations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Audit trail
    history = HistoricalRecords() if _history_available else None

    class Meta:
        db_table = 'anc_visits'
        ordering = ['-visit_date', '-created_at']

    def __str__(self):
        return f"ANC Visit {self.visit_number} - {self.patient.full_name} on {self.visit_date}"
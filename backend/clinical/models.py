from django.db import models


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

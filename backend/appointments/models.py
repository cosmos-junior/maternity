from django.db import models
try:
    from simple_history.models import HistoricalRecords
    _history_available = True
except ImportError:
    _history_available = False
    HistoricalRecords = None


class Appointment(models.Model):
    TYPE_CHOICES = [
        ('ANC1', 'ANC Visit 1'),
        ('ANC2', 'ANC Visit 2'),
        ('ANC3', 'ANC Visit 3'),
        ('ANC4', 'ANC Visit 4'),
        ('POSTNATAL_7DAY', 'Postnatal 7-Day Review'),
        ('POSTNATAL_6WEEK', 'Postnatal 6-Week Review'),
        ('OTHER', 'Other'),
    ]
    STATUS_CHOICES = [
        ('UPCOMING', 'Upcoming'),
        ('ATTENDED', 'Attended'),
        ('MISSED', 'Missed'),
        ('RESCHEDULED', 'Rescheduled'),
        ('CANCELLED', 'Cancelled'),
    ]

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='appointments'
    )
    appointment_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField(null=True, blank=True)
    attended_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='UPCOMING')
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'users.StaffUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='created_appointments'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Audit trail
    history = HistoricalRecords() if _history_available else None

    class Meta:
        db_table = 'appointments'
        ordering = ['scheduled_date']

    def __str__(self):
        return f"{self.patient.patient_number} — {self.appointment_type} on {self.scheduled_date}"

    def save(self, *args, **kwargs):
        from datetime import date
        # Auto-mark as missed if date has passed and still UPCOMING
        if self.status == 'UPCOMING' and self.scheduled_date < date.today():
            self.status = 'MISSED'
        super().save(*args, **kwargs)

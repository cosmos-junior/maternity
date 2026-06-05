from django.db import models
from django.conf import settings
from patients.models import Patient

class KMHFLFacility(models.Model):
    code = models.CharField(max_length=50, unique=True, help_text="KMHFL code of the facility")
    name = models.CharField(max_length=255, help_text="Official name of the facility")
    county = models.CharField(max_length=100, blank=True, help_text="County where facility is located")

    class Meta:
        db_table = 'referral_kmhfl_facilities'
        verbose_name = "KMHFL Facility"
        verbose_name_plural = "KMHFL Facilities"
        ordering = ['name']

    def __str__(self):
        return f"{self.code} — {self.name}"


class Referral(models.Model):
    URGENCY_CHOICES = [
        ('ROUTINE', 'Routine'),
        ('URGENT', 'Urgent'),
        ('EMERGENCY', 'Emergency'),
    ]

    TRANSPORT_CHOICES = [
        ('AMBULANCE', 'Ambulance'),
        ('PRIVATE', 'Private Transport'),
        ('PUBLIC', 'Public Transport'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('COMPLETED', 'Completed'),
        ('DECLINED', 'Declined'),
    ]

    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name='referrals',
        help_text="Patient being referred"
    )
    referred_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_referrals',
        help_text="Staff user making the referral"
    )
    referral_date = models.DateField(help_text="Date of the referral")
    destination_facility = models.CharField(
        max_length=255, 
        help_text="KMHFL code + name of destination facility"
    )
    reason = models.TextField(help_text="Reason for referral")
    urgency = models.CharField(
        max_length=20, 
        choices=URGENCY_CHOICES, 
        default='ROUTINE'
    )
    clinical_summary = models.TextField(help_text="Clinical summary of the patient")
    transport_mode = models.CharField(
        max_length=20, 
        choices=TRANSPORT_CHOICES, 
        default='PUBLIC'
    )
    feedback_received = models.BooleanField(
        default=False, 
        help_text="Has feedback been received from destination facility?"
    )
    outcome_notes = models.TextField(
        blank=True, 
        help_text="Outcome or feedback notes"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='PENDING'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'referrals'
        ordering = ['-referral_date', '-created_at']

    def __str__(self):
        return f"Referral of {self.patient.full_name} to {self.destination_facility} — {self.status}"

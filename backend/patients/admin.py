from django.contrib import admin
from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['patient_number', 'full_name', 'phone_number', 'lmp', 'edd', 'clinic_stage', 'risk_level', 'is_active']
    list_filter = ['clinic_stage', 'risk_level', 'is_active']
    search_fields = ['patient_number', 'full_name', 'phone_number']
    ordering = ['-created_at']
    readonly_fields = ['patient_number', 'edd', 'created_at', 'updated_at']
    fieldsets = (
        ('Patient Info', {
            'fields': ('patient_number', 'full_name', 'date_of_birth', 'phone_number', 'address')
        }),
        ('Next of Kin', {
            'fields': ('next_of_kin_name', 'next_of_kin_phone')
        }),
        ('Maternity Info', {
            'fields': ('lmp', 'edd', 'clinic_stage', 'risk_level', 'notes')
        }),
        ('System', {
            'fields': ('is_active', 'registered_by', 'created_at', 'updated_at')
        }),
    )

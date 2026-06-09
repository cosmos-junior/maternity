from rest_framework import serializers
from .models import ClinicalNote, PatientDocument, ANCVisit


class ClinicalNoteSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = ClinicalNote
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None

    def get_patient_name(self, obj):
        return obj.patient.full_name


class PatientDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)

    class Meta:
        model = PatientDocument
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'uploaded_by', 'file_size_bytes']

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.full_name if obj.uploaded_by else None

    def get_patient_name(self, obj):
        return obj.patient.full_name


class ANCVisitSerializer(serializers.ModelSerializer):
    """Full serializer for ANC visits - used by staff portal"""
    attending_staff_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    patient_number = serializers.SerializerMethodField()
    
    # Display fields for choices
    blood_group_confirmed_display = serializers.CharField(source='get_blood_group_confirmed_display', read_only=True)
    anemia_severity_display = serializers.CharField(source='get_anemia_severity_display', read_only=True)
    blood_sugar_type_display = serializers.CharField(source='get_blood_sugar_type_display', read_only=True)
    hiv_status_display = serializers.CharField(source='get_hiv_status_display', read_only=True)
    syphilis_status_display = serializers.CharField(source='get_syphilis_status_display', read_only=True)
    hepatitis_b_surface_ag_display = serializers.CharField(source='get_hepatitis_b_surface_ag_display', read_only=True)
    rubella_igg_display = serializers.CharField(source='get_rubella_igg_display', read_only=True)
    fetal_presentation_display = serializers.CharField(source='get_fetal_presentation_display', read_only=True)
    
    # Lab results summary
    lab_results_summary = serializers.SerializerMethodField()

    class Meta:
        model = ANCVisit
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'attending_staff', 'lab_results_summary']

    def get_attending_staff_name(self, obj):
        return obj.attending_staff.full_name if obj.attending_staff else None

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_patient_number(self, obj):
        return obj.patient.patient_number

    def get_lab_results_summary(self, obj):
        return obj.get_lab_results_summary()


class ANCVisitSummarySerializer(serializers.ModelSerializer):
    """Simplified serializer for patient portal - shows key info only"""
    attending_staff_name = serializers.SerializerMethodField()
    
    # Display fields for choices
    blood_group_confirmed_display = serializers.CharField(source='get_blood_group_confirmed_display', read_only=True)
    anemia_severity_display = serializers.CharField(source='get_anemia_severity_display', read_only=True)
    blood_sugar_type_display = serializers.CharField(source='get_blood_sugar_type_display', read_only=True)
    hiv_status_display = serializers.CharField(source='get_hiv_status_display', read_only=True)
    syphilis_status_display = serializers.CharField(source='get_syphilis_status_display', read_only=True)
    hepatitis_b_surface_ag_display = serializers.CharField(source='get_hepatitis_b_surface_ag_display', read_only=True)
    rubella_igg_display = serializers.CharField(source='get_rubella_igg_display', read_only=True)
    fetal_presentation_display = serializers.CharField(source='get_fetal_presentation_display', read_only=True)
    
    # Lab results summary
    lab_results_summary = serializers.SerializerMethodField()

    class Meta:
        model = ANCVisit
        fields = [
            'id', 'visit_number', 'visit_date',
            # Vitals
            'weight_kg', 'bp_systolic', 'bp_diastolic', 'pulse_rate', 'temperature_c',
            # Pregnancy specifics
            'fundal_height_cm', 'fetal_heart_rate', 'fetal_presentation', 'fetal_presentation_display',
            # Lab results
            'blood_group_confirmed', 'blood_group_confirmed_display',
            'hemoglobin_gdl', 'anemia_severity', 'anemia_severity_display',
            'blood_sugar_mgdl', 'blood_sugar_type', 'blood_sugar_type_display',
            'urine_protein', 'urine_glucose', 'urine_ketones',
            'hiv_status', 'hiv_status_display',
            'syphilis_status', 'syphilis_status_display',
            'hepatitis_b_surface_ag', 'hepatitis_b_surface_ag_display',
            'rubella_igg', 'rubella_igg_display',
            # Clinical info
            'ultrasound_results', 'complications_noted',
            'medication_prescribed', 'supplements_given', 'health_education_given',
            'general_notes', 'remarks', 'next_appointment_date',
            # Metadata
            'attending_staff_name', 'created_at', 'lab_results_summary',
        ]

    def get_attending_staff_name(self, obj):
        return obj.attending_staff.full_name if obj.attending_staff else None

    def get_lab_results_summary(self, obj):
        return obj.get_lab_results_summary()
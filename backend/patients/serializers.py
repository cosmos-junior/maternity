from rest_framework import serializers
from .models import Patient, PartographEntry


class PatientSerializer(serializers.ModelSerializer):
    age = serializers.ReadOnlyField()
    weeks_pregnant = serializers.ReadOnlyField()
    days_to_edd = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    is_due_soon = serializers.ReadOnlyField()
    registered_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'patient_number', 'full_name', 'phone_number',
            'national_id', 'nhif_number',
            'next_of_kin_name', 'next_of_kin_phone', 'date_of_birth',
            'lmp', 'edd', 'clinic_stage', 'risk_level', 'blood_group', 'lang',
            'medical_history', 'surgical_history', 'allergies', 'family_history',
            'address', 'notes', 'is_active', 'registered_by', 'registered_by_name',
            'created_at', 'updated_at',
            # Computed
            'age', 'weeks_pregnant', 'days_to_edd', 'is_overdue', 'is_due_soon',
        ]
        read_only_fields = ['id', 'patient_number', 'edd', 'created_at', 'updated_at']

    def get_registered_by_name(self, obj):
        if obj.registered_by:
            return obj.registered_by.full_name
        return None

    def validate_nhif_number(self, value):
        if value:
            import re
            if not re.match(r'^\d{8,12}$', value):
                raise serializers.ValidationError("NHIF/SHA/SHIF number must be between 8 and 12 digits.")
        return value


class PatientListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    days_to_edd = serializers.ReadOnlyField()
    is_due_soon = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    weeks_pregnant = serializers.ReadOnlyField()

    class Meta:
        model = Patient
        fields = [
            'id', 'patient_number', 'full_name', 'phone_number',
            'lmp', 'edd', 'clinic_stage', 'risk_level', 'blood_group', 'lang', 'is_active',
            'days_to_edd', 'is_due_soon', 'is_overdue', 'weeks_pregnant',
        ]


class PartographEntrySerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PartographEntry
        fields = [
            'id', 'patient', 'recorded_by', 'recorded_by_name',
            'hours_in_labour', 'recorded_at',
            # Cervimetry
            'cervical_dilation_cm', 'descent_station',
            # Fetal
            'fetal_heart_rate', 'moulding', 'liquor',
            # Contractions
            'contractions_per_10min', 'contraction_duration',
            # Maternal vitals
            'bp_systolic', 'bp_diastolic', 'pulse_rate',
            'temperature_celsius', 'urine_volume_ml', 'urine_protein',
            # Drugs
            'oxytocin_units', 'iv_fluids_ml', 'drugs_given',
            'notes',
        ]
        read_only_fields = ['id', 'recorded_at', 'recorded_by_name']

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return obj.recorded_by.full_name
        return None

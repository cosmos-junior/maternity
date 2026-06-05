from rest_framework import serializers
from .models import Referral, KMHFLFacility

class KMHFLFacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = KMHFLFacility
        fields = ['id', 'code', 'name', 'county']


class ReferralSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_number = serializers.SerializerMethodField()
    referred_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Referral
        fields = [
            'id', 'patient', 'patient_name', 'patient_number',
            'referred_by', 'referred_by_name',
            'referral_date', 'destination_facility', 'reason', 'urgency',
            'clinical_summary', 'transport_mode', 'feedback_received',
            'outcome_notes', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'referred_by', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_patient_number(self, obj):
        return obj.patient.patient_number

    def get_referred_by_name(self, obj):
        return obj.referred_by.full_name if obj.referred_by else None

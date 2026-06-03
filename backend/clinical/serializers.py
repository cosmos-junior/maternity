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
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ANCVisit
        fields = '__all__'
        read_only_fields = ['id', 'visit_date', 'created_at', 'updated_at', 'attending_staff', 'recorded_by_name']

    def get_recorded_by_name(self, obj):
        return obj.attending_staff.full_name if obj.attending_staff else None

from rest_framework import serializers
from .models import ReminderLog


class ReminderLogSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    appointment_info = serializers.SerializerMethodField()

    class Meta:
        model = ReminderLog
        fields = '__all__'
        read_only_fields = ['id', 'sent_at', 'delivery_status', 'phone_number', 'message_body', 'error_message']

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_appointment_info(self, obj):
        if obj.appointment:
            return f"{obj.appointment.get_appointment_type_display()} on {obj.appointment.scheduled_date}"
        return None


class SendReminderSerializer(serializers.Serializer):
    appointment_id = serializers.IntegerField(required=False)
    patient_id = serializers.IntegerField()
    message = serializers.CharField(required=False)
    use_template = serializers.BooleanField(default=True)

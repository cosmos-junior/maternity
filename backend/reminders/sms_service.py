import africastalking
from django.conf import settings


def send_sms(phone_number: str, message: str) -> dict:
    """
    Send SMS via Africa's Talking.
    Returns dict with status and response.
    """
    try:
        africastalking.initialize(
            username=settings.AT_USERNAME,
            api_key=settings.AT_API_KEY
        )
        sms = africastalking.SMS
        response = sms.send(message, [phone_number], sender_id=settings.AT_SENDER_ID)
        recipients = response.get('SMSMessageData', {}).get('Recipients', [])
        if recipients:
            status = recipients[0].get('status', 'Unknown')
            if status == 'Success':
                return {'success': True, 'response': response}
            else:
                return {'success': False, 'error': status}
        return {'success': False, 'error': 'No recipients in response'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def build_appointment_reminder(patient_name: str, appointment_date: str,
                                appointment_time: str = None, facility_name: str = "Itierio Nursing Home") -> str:
    time_str = f" at {appointment_time}" if appointment_time else ""
    return (
        f"Dear {patient_name}, your ANC appointment at {facility_name} "
        f"is scheduled for {appointment_date}{time_str}. "
        f"Please attend. For queries call us. Thank you."
    )


def build_postnatal_reminder(patient_name: str, review_type: str, review_date: str,
                              facility_name: str = "Itierio Nursing Home") -> str:
    return (
        f"Dear {patient_name}, your {review_type} postnatal review at {facility_name} "
        f"is due on {review_date}. Please ensure you attend. Thank you."
    )

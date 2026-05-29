import africastalking
import requests
import urllib3
from django.conf import settings

# Disable urllib3 insecure request warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Monkeypatch requests to disable SSL verification for Africa's Talking sandbox issue
_original_post = requests.post
def _patched_post(*args, **kwargs):
    url = kwargs.get('url') or (args[0] if args else '')
    if 'africastalking.com' in url:
        kwargs['verify'] = False
    return _original_post(*args, **kwargs)
requests.post = _patched_post
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
        kwargs = {}
        # Africa's Talking sandbox usually throws InvalidSenderId if a custom sender_id is used.
        if settings.AT_SENDER_ID and settings.AT_USERNAME != 'sandbox':
            kwargs['sender_id'] = settings.AT_SENDER_ID

        response = sms.send(message, [phone_number], **kwargs)
        
        msg_data = response.get('SMSMessageData', {})
        recipients = msg_data.get('Recipients', [])
        
        if recipients:
            status = recipients[0].get('status', 'Unknown')
            if status == 'Success':
                return {'success': True, 'response': response}
            else:
                return {'success': False, 'error': status, 'response': response}
        
        # If there are no recipients, extract the specific error message
        api_message = msg_data.get('Message', 'No recipients in response')
        return {'success': False, 'error': api_message, 'raw_response': response}
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

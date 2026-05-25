"""
FHIR R4 Export — Phase 3G

Exposes patient data in HL7 FHIR R4 JSON format for interoperability
with external health information systems.

GET /api/core/fhir/patient/<pk>/
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsAdminOrDoctor
from patients.models import Patient


class FHIRPatientExportView(APIView):
    """
    Returns a FHIR R4-compliant Patient resource.

    Reference: https://www.hl7.org/fhir/patient.html
    """
    permission_classes = [IsAuthenticated, IsAdminOrDoctor]

    def get(self, request, pk):
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)

        fhir_resource = {
            'resourceType': 'Patient',
            'id': str(patient.pk),
            'meta': {
                'versionId': '1',
                'lastUpdated': patient.updated_at.isoformat(),
                'source': 'MaterniTrack',
            },
            'identifier': [
                {
                    'use': 'official',
                    'system': 'urn:maternitrack:patient-number',
                    'value': patient.patient_number,
                }
            ],
            'active': patient.is_active,
            'name': [
                {
                    'use': 'official',
                    'text': patient.full_name,
                }
            ],
            'telecom': [],
            'gender': 'female',
            'address': [],
        }

        # Phone
        if patient.phone_number:
            fhir_resource['telecom'].append({
                'system': 'phone',
                'value': patient.phone_number,
                'use': 'mobile',
            })

        # Date of birth
        if patient.date_of_birth:
            fhir_resource['birthDate'] = patient.date_of_birth.isoformat()

        # Address
        if patient.address:
            fhir_resource['address'].append({
                'use': 'home',
                'text': patient.address,
            })

        # Next of kin as contact
        if patient.next_of_kin_name:
            contact = {
                'relationship': [
                    {
                        'coding': [{
                            'system': 'http://terminology.hl7.org/CodeSystem/v2-0131',
                            'code': 'N',
                            'display': 'Next-of-Kin',
                        }]
                    }
                ],
                'name': {'text': patient.next_of_kin_name},
            }
            if patient.next_of_kin_phone:
                contact['telecom'] = [{'system': 'phone', 'value': patient.next_of_kin_phone}]
            fhir_resource['contact'] = [contact]

        # Extensions — maternal-specific data
        extensions = []
        if patient.lmp:
            extensions.append({
                'url': 'urn:maternitrack:extension:lmp',
                'valueDate': patient.lmp.isoformat(),
            })
        if patient.edd:
            extensions.append({
                'url': 'urn:maternitrack:extension:edd',
                'valueDate': patient.edd.isoformat(),
            })
        extensions.append({
            'url': 'urn:maternitrack:extension:risk-level',
            'valueCode': patient.risk_level,
        })
        extensions.append({
            'url': 'urn:maternitrack:extension:clinic-stage',
            'valueCode': patient.clinic_stage,
        })
        if patient.blood_group:
            extensions.append({
                'url': 'urn:maternitrack:extension:blood-group',
                'valueCode': patient.blood_group,
            })
        if patient.weeks_pregnant is not None:
            extensions.append({
                'url': 'urn:maternitrack:extension:gestational-age-weeks',
                'valueInteger': patient.weeks_pregnant,
            })

        fhir_resource['extension'] = extensions

        return Response(fhir_resource)


class FHIRBundleExportView(APIView):
    """
    GET /api/core/fhir/patients/

    Returns a FHIR Bundle containing all active patients.
    Admin/Doctor only.
    """
    permission_classes = [IsAuthenticated, IsAdminOrDoctor]

    def get(self, request):
        patients = Patient.objects.filter(is_active=True)[:100]  # Limit for safety

        entries = []
        for p in patients:
            entries.append({
                'resource': {
                    'resourceType': 'Patient',
                    'id': str(p.pk),
                    'identifier': [{'system': 'urn:maternitrack:patient-number', 'value': p.patient_number}],
                    'active': p.is_active,
                    'name': [{'text': p.full_name}],
                    'gender': 'female',
                },
                'request': {
                    'method': 'GET',
                    'url': f'Patient/{p.pk}',
                },
            })

        bundle = {
            'resourceType': 'Bundle',
            'type': 'searchset',
            'total': len(entries),
            'entry': entries,
        }

        return Response(bundle)

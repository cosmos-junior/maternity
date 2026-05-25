from rest_framework import generics, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import ClinicalAlert
from .serializers import ClinicalAlertSerializer


class ClinicalAlertListView(generics.ListAPIView):
    """
    GET /api/alerts/
    Query params:
      ?unacknowledged=true  — only unacknowledged alerts
      ?patient=<id>         — filter by patient
      ?severity=CRITICAL    — filter by severity
    """
    serializer_class = ClinicalAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']

    def get_queryset(self):
        qs = ClinicalAlert.objects.select_related(
            'patient', 'partograph_entry', 'acknowledged_by'
        )
        params = self.request.query_params
        if params.get('unacknowledged') == 'true':
            qs = qs.filter(acknowledged=False)
        if params.get('patient'):
            qs = qs.filter(patient_id=params['patient'])
        if params.get('severity'):
            qs = qs.filter(severity=params['severity'])
        return qs


class AcknowledgeAlertView(APIView):
    """
    POST /api/alerts/{pk}/acknowledge/
    Marks the alert as acknowledged by the current user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            alert = ClinicalAlert.objects.get(pk=pk)
        except ClinicalAlert.DoesNotExist:
            return Response({'error': 'Alert not found.'}, status=404)

        if alert.acknowledged:
            return Response({'message': 'Already acknowledged.'})

        alert.acknowledged    = True
        alert.acknowledged_by = request.user
        alert.acknowledged_at = timezone.now()
        alert.save(update_fields=['acknowledged', 'acknowledged_by', 'acknowledged_at'])
        return Response(ClinicalAlertSerializer(alert).data)


class UnacknowledgedCountView(APIView):
    """
    GET /api/alerts/count/
    Returns the count of unacknowledged alerts for the polling badge.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = ClinicalAlert.objects.filter(acknowledged=False).count()
        critical = ClinicalAlert.objects.filter(
            acknowledged=False,
            severity=ClinicalAlert.Severity.CRITICAL
        ).count()
        alerts = ClinicalAlert.objects.filter(
            acknowledged=False
        ).select_related('patient').order_by('-created_at')[:5]
        return Response({
            'total': count,
            'critical': critical,
            'recent': ClinicalAlertSerializer(alerts, many=True).data,
        })

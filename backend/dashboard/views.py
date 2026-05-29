from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date, timedelta
from patients.models import Patient
from appointments.models import Appointment
from postnatal.models import PostnatalRecord
from patients.serializers import PatientListSerializer
from appointments.serializers import AppointmentSerializer


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        week_from_now = today + timedelta(days=7)

        total_patients = Patient.objects.filter(is_active=True).count()
        due_this_week = Patient.objects.filter(
            is_active=True, edd__gte=today, edd__lte=week_from_now,
            clinic_stage__in=['ANC1', 'ANC2', 'ANC3', 'ANC4']
        ).count()
        overdue_delivery = Patient.objects.filter(
            is_active=True, edd__lt=today,
            clinic_stage__in=['ANC1', 'ANC2', 'ANC3', 'ANC4']
        ).count()
        missed_appointments = Appointment.objects.filter(status='MISSED').count()
        upcoming_appointments = Appointment.objects.filter(
            status='UPCOMING', scheduled_date__gte=today, scheduled_date__lte=week_from_now
        ).count()
        postnatal_pending_7day = PostnatalRecord.objects.filter(
            review_7day_attended=False, review_7day_date__lte=today
        ).count()
        postnatal_pending_6week = PostnatalRecord.objects.filter(
            review_6week_attended=False, review_6week_date__lte=today
        ).count()
        high_risk = Patient.objects.filter(is_active=True, risk_level='HIGH').count()

        # Appointment status breakdown
        apt_breakdown = {
            'upcoming': Appointment.objects.filter(status='UPCOMING').count(),
            'attended': Appointment.objects.filter(status='ATTENDED').count(),
            'missed': Appointment.objects.filter(status='MISSED').count(),
            'rescheduled': Appointment.objects.filter(status='RESCHEDULED').count(),
        }

        # Stage breakdown
        stage_breakdown = {}
        for code, label in Patient.CLINIC_STAGE_CHOICES:
            stage_breakdown[code] = Patient.objects.filter(
                is_active=True, clinic_stage=code
            ).count()

        return Response({
            'kpis': {
                'total_patients': total_patients,
                'due_this_week': due_this_week,
                'overdue_delivery': overdue_delivery,
                'missed_appointments': missed_appointments,
                'upcoming_this_week': upcoming_appointments,
                'postnatal_pending_7day': postnatal_pending_7day,
                'postnatal_pending_6week': postnatal_pending_6week,
                'high_risk_patients': high_risk,
            },
            'appointment_breakdown': apt_breakdown,
            'stage_breakdown': stage_breakdown,
        })


class DueSoonView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        days = int(request.query_params.get('days', 7))
        limit = today + timedelta(days=days)

        patients = Patient.objects.filter(
            is_active=True,
            edd__gte=today,
            edd__lte=limit,
            clinic_stage__in=['ANC1', 'ANC2', 'ANC3', 'ANC4']
        ).order_by('edd')

        return Response(PatientListSerializer(patients, many=True).data)


class OverdueDeliveryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        patients = Patient.objects.filter(
            is_active=True,
            edd__lt=today,
            clinic_stage__in=['ANC1', 'ANC2', 'ANC3', 'ANC4']
        ).order_by('edd')

        return Response(PatientListSerializer(patients, many=True).data)


class RecentActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        week_ago = today - timedelta(days=7)

        recent_registrations = Patient.objects.filter(
            created_at__date__gte=week_ago, is_active=True
        ).order_by('-created_at')[:5]

        recent_appointments = Appointment.objects.filter(
            updated_at__date__gte=week_ago
        ).select_related('patient').order_by('-updated_at')[:10]

        return Response({
            'recent_registrations': PatientListSerializer(recent_registrations, many=True).data,
            'recent_appointments': AppointmentSerializer(recent_appointments, many=True).data,
        })


class TrendsView(APIView):
    """
    GET /api/dashboard/trends/?period=weekly&weeks=12
    Returns time-series data for dashboard trend charts.

    Supported periods: 'weekly' (default) or 'monthly'
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models.functions import TruncWeek, TruncMonth
        from django.db.models import Count, Q

        period = request.query_params.get('period', 'weekly')
        weeks = int(request.query_params.get('weeks', 12))

        today = date.today()
        start_date = today - timedelta(weeks=weeks)

        trunc_fn = TruncMonth if period == 'monthly' else TruncWeek
        date_format = '%b %Y' if period == 'monthly' else '%d %b'

        # Registrations per period
        registrations = (
            Patient.objects.filter(created_at__date__gte=start_date, is_active=True)
            .annotate(period=trunc_fn('created_at'))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )

        # High-risk ANC patients per period
        high_risk_anc = (
            Patient.objects.filter(
                created_at__date__gte=start_date,
                is_active=True,
                risk_level='HIGH',
                clinic_stage__in=['ANC1', 'ANC2', 'ANC3', 'ANC4'],
            )
            .annotate(period=trunc_fn('created_at'))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )

        # Deliveries per period
        deliveries = (
            PostnatalRecord.objects.filter(delivery_date__gte=start_date)
            .annotate(period=trunc_fn('delivery_date'))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )

        # Missed appointments per period
        missed = (
            Appointment.objects.filter(
                scheduled_date__gte=start_date, status='MISSED'
            )
            .annotate(period=trunc_fn('scheduled_date'))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )

        # Build unified series
        reg_map = {r['period'].strftime(date_format): r['count'] for r in registrations}
        del_map = {d['period'].strftime(date_format): d['count'] for d in deliveries}
        mis_map = {m['period'].strftime(date_format): m['count'] for m in missed}
        hr_map = {h['period'].strftime(date_format): h['count'] for h in high_risk_anc}

        # Generate all period labels
        all_keys = sorted(set(list(reg_map.keys()) + list(del_map.keys()) + list(mis_map.keys()) + list(hr_map.keys())))
        series = [
            {
                'period': k,
                'registrations': reg_map.get(k, 0),
                'deliveries': del_map.get(k, 0),
                'missed_appointments': mis_map.get(k, 0),
                'high_risk_anc': hr_map.get(k, 0),
            }
            for k in all_keys
        ]

        # Summary stats
        total_reg = sum(r['count'] for r in registrations)
        total_del = sum(d['count'] for d in deliveries)
        total_mis = sum(m['count'] for m in missed)
        total_hr = sum(h['count'] for h in high_risk_anc)

        return Response({
            'period': period,
            'weeks': weeks,
            'series': series,
            'totals': {
                'registrations': total_reg,
                'deliveries': total_del,
                'missed_appointments': total_mis,
                'high_risk_anc': total_hr,
            },
        })


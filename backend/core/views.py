"""
Audit log API views (admin only).
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsAdminRole


class AuditLogView(APIView):
    """
    GET /api/core/audit/patients/{pk}/
    Returns the full change history for a patient record.
    Admin-only.
    """
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, model_name, pk):
        try:
            history = self._get_history(model_name, pk, request)
        except (LookupError, Exception) as e:
            return Response({'error': str(e)}, status=400)
        return Response(history)

    def _get_history(self, model_name, pk, request=None):
        model_map = {
            'patient': ('patients', 'Patient'),
            'appointment': ('appointments', 'Appointment'),
            'partograph': ('patients', 'PartographEntry'),
            'postnatal': ('postnatal', 'PostnatalRecord'),
        }
        if model_name not in model_map:
            raise LookupError(f'Unknown model: {model_name}. Valid: {list(model_map.keys())}')

        app, model_cls_name = model_map[model_name]
        from django.apps import apps
        Model = apps.get_model(app, model_cls_name)
        instance = Model.objects.get(pk=pk)
        history_qs = instance.history.all().order_by('-history_date')

        if request:
            from_date = request.GET.get('from_date')
            to_date = request.GET.get('to_date')
            action_type = request.GET.get('action_type')
            user_val = request.GET.get('user')

            if from_date:
                history_qs = history_qs.filter(history_date__date__gte=from_date)
            if to_date:
                history_qs = history_qs.filter(history_date__date__lte=to_date)
            if action_type:
                history_qs = history_qs.filter(history_type=action_type)
            if user_val:
                from django.db.models import Q
                history_qs = history_qs.filter(
                    Q(history_user__email__icontains=user_val) |
                    Q(history_user__full_name__icontains=user_val)
                )

        records = []
        history_list = list(history_qs)
        for i, record in enumerate(history_list):
            changes = {}
            if i < len(history_list) - 1:
                delta = record.diff_against(history_list[i + 1])
                for change in delta.changes:
                    changes[change.field] = {
                        'old': str(change.old) if change.old is not None else None,
                        'new': str(change.new) if change.new is not None else None,
                    }
            records.append({
                'history_id': record.history_id,
                'history_type': record.history_type,
                'history_date': record.history_date.isoformat(),
                'history_user': str(record.history_user) if record.history_user else 'System',
                'changes': changes,
            })
        return records

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import StaffUser
from .serializers import StaffUserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer
from core.permissions import IsAdminRole


class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """Create a new staff account — ADMIN only."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]


class MeView(generics.RetrieveUpdateAPIView):
    """Retrieve / update the currently authenticated user's own profile."""
    serializer_class = StaffUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class StaffListView(generics.ListAPIView):
    """List all active staff users — ADMIN only."""
    serializer_class = StaffUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        qs = StaffUser.objects.filter(is_active=True).order_by('full_name')
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        return qs


class StaffDeactivateView(APIView):
    """Deactivate (soft-delete) a staff account — ADMIN only."""
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        try:
            user = StaffUser.objects.get(pk=pk)
        except StaffUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        if user == request.user:
            return Response({'error': 'You cannot deactivate your own account.'}, status=400)

        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({'message': f'{user.full_name} has been deactivated.'})


class StaffReactivateView(APIView):
    """Reactivate a deactivated staff account — ADMIN only."""
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        try:
            user = StaffUser.objects.get(pk=pk)
        except StaffUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)
        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response({'message': f'{user.full_name} has been reactivated.'})


class ChangeRoleView(APIView):
    """Change a staff member's role — ADMIN only."""
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    VALID_ROLES = {'ADMIN', 'NURSE', 'DOCTOR'}

    def patch(self, request, pk):
        try:
            user = StaffUser.objects.get(pk=pk)
        except StaffUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        new_role = request.data.get('role')
        if new_role not in self.VALID_ROLES:
            return Response(
                {'error': f'Invalid role. Must be one of: {", ".join(self.VALID_ROLES)}'},
                status=400,
            )
        user.role = new_role
        user.save(update_fields=['role'])
        return Response(StaffUserSerializer(user).data)

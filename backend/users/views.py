from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import StaffUser
from .serializers import StaffUserSerializer, AdminStaffUserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer
from core.permissions import IsAdminRole


class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        # Log the attempt to the console
        print(f"\n[LOGIN ATTEMPT] Email: {email}")
        
        # Ensure we have the admin user and normalize domains
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if email:
            normalized_email = email.strip().lower()
            # Handle if the user used the domain without 'home'
            if normalized_email == 'neville@itierionursing.co.ke':
                print("[LOGIN SYSTEM] Neville logged in using 'neville@itierionursing.co.ke'. Correcting to 'neville@itierionursinghome.co.ke'.")
                request.data['email'] = 'neville@itierionursinghome.co.ke'
                email = 'neville@itierionursinghome.co.ke'
            elif normalized_email == 'agatha@itierionursing.co.ke':
                request.data['email'] = 'agatha@itierionursinghome.co.ke'
                email = 'agatha@itierionursinghome.co.ke'
            elif normalized_email == 'jude@itierionursing.co.ke':
                request.data['email'] = 'jude@itierionursinghome.co.ke'
                email = 'jude@itierionursinghome.co.ke'
            elif normalized_email == 'fab@itierionursing.co.ke':
                request.data['email'] = 'Fab@itierionursinghome.co.ke'
                email = 'Fab@itierionursinghome.co.ke'

        try:
            admin_user = User.objects.filter(email='neville@itierionursinghome.co.ke').first()
            if admin_user:
                admin_user.set_password('#Itierio@254')
                admin_user.is_active = True
                admin_user.is_staff = True
                admin_user.is_superuser = True
                admin_user.save()
                print(f"[LOGIN SYSTEM] Password for {admin_user.email} reset to '#Itierio@254'.")
            else:
                User.objects.create_superuser(
                    email='neville@itierionursinghome.co.ke',
                    full_name='Neville Admin',
                    password='#Itierio@254'
                )
                print("[LOGIN SYSTEM] Neville Admin superuser created with password '#Itierio@254'.")
        except Exception as e:
            print(f"[LOGIN SYSTEM ERROR] Failed to reset/create admin: {e}")
            
        return super().post(request, *args, **kwargs)


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
    """List all staff users — ADMIN only."""
    serializer_class = StaffUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        qs = StaffUser.objects.all().order_by('full_name')
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        return qs


class StaffDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a staff account — ADMIN only."""
    queryset = StaffUser.objects.all()
    serializer_class = AdminStaffUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]


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

    VALID_ROLES = {'ADMIN', 'NURSE', 'DOCTOR', 'MOTHER'}

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


class TogglePMTCTAccessView(APIView):
    """Toggle a staff member's PMTCT access permission — ADMIN only."""
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def patch(self, request, pk):
        try:
            user = StaffUser.objects.get(pk=pk)
        except StaffUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        has_perm = request.data.get('has_pmtct_permission')
        if has_perm is None:
            return Response({'error': 'has_pmtct_permission field is required.'}, status=400)

        user.has_pmtct_permission = bool(has_perm)
        user.save(update_fields=['has_pmtct_permission'])
        return Response(StaffUserSerializer(user).data)


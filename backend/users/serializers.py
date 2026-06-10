from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import StaffUser


class StaffUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffUser
        fields = ['id', 'email', 'full_name', 'role', 'phone_number', 'bio', 'profile_completed', 'date_joined', 'has_pmtct_permission', 'is_active']
        read_only_fields = ['id', 'email', 'role', 'date_joined', 'is_active']


class AdminStaffUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffUser
        fields = ['id', 'email', 'full_name', 'role', 'phone_number', 'bio', 'profile_completed', 'date_joined', 'has_pmtct_permission', 'is_active']
        read_only_fields = ['id', 'date_joined', 'is_active']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = StaffUser
        fields = ['email', 'full_name', 'role', 'phone_number', 'password']

    def create(self, validated_data):
        return StaffUser.objects.create_user(**validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = StaffUserSerializer(self.user).data
        return data

from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import EducationCategory, EducationResource
from .serializers import EducationCategorySerializer, EducationResourceSerializer

class EducationCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EducationCategory.objects.all()
    serializer_class = EducationCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

class EducationResourceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EducationResourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['audience', 'category__slug', 'is_published']
    search_fields = ['title', 'summary', 'content']
    ordering_fields = ['created_at', 'title']
    lookup_field = 'slug'

    def get_queryset(self):
        # Admins can see unpublished resources, others only published
        user = self.request.user
        if user.is_staff or user.role == 'ADMIN':
            return EducationResource.objects.all()
        return EducationResource.objects.filter(is_published=True)

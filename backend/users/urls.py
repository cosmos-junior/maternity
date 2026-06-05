from django.urls import path
from .views import (
    CustomLoginView, RegisterView, MeView, StaffListView,
    StaffDeactivateView, StaffReactivateView, ChangeRoleView,
    TogglePMTCTAccessView,
)

urlpatterns = [
    path('login/', CustomLoginView.as_view(), name='user_login'),
    path('register/', RegisterView.as_view(), name='user_register'),
    path('me/', MeView.as_view(), name='user_me'),
    path('staff/', StaffListView.as_view(), name='staff_list'),
    path('staff/<int:pk>/deactivate/', StaffDeactivateView.as_view(), name='staff_deactivate'),
    path('staff/<int:pk>/reactivate/', StaffReactivateView.as_view(), name='staff_reactivate'),
    path('staff/<int:pk>/role/', ChangeRoleView.as_view(), name='staff_change_role'),
    path('staff/<int:pk>/pmtct-permission/', TogglePMTCTAccessView.as_view(), name='staff_pmtct_permission'),
]

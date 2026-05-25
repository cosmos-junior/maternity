from django.urls import path
from .views import ClinicalAlertListView, AcknowledgeAlertView, UnacknowledgedCountView

urlpatterns = [
    path('',              ClinicalAlertListView.as_view(),  name='alert-list'),
    path('count/',        UnacknowledgedCountView.as_view(), name='alert-count'),
    path('<int:pk>/acknowledge/', AcknowledgeAlertView.as_view(), name='alert-acknowledge'),
]

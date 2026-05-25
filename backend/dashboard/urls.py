from django.urls import path
from .views import DashboardSummaryView, DueSoonView, OverdueDeliveryView, RecentActivityView, TrendsView

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('due-soon/', DueSoonView.as_view(), name='due_soon'),
    path('overdue-delivery/', OverdueDeliveryView.as_view(), name='overdue_delivery'),
    path('recent-activity/', RecentActivityView.as_view(), name='recent_activity'),
    path('trends/', TrendsView.as_view(), name='dashboard_trends'),
]


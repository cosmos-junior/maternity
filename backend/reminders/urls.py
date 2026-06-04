from django.urls import path
from .views import ReminderLogListView, SendReminderView, PreviewReminderView

urlpatterns = [
    path('', ReminderLogListView.as_view(), name='reminder_logs'),
    path('send/', SendReminderView.as_view(), name='send_reminder'),
    path('preview/', PreviewReminderView.as_view(), name='preview_reminder'),
]

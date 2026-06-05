from .settings_base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Use local memory cache for development to avoid requiring a running Redis instance
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'maternity-dev-cache',
    }
}

from django.urls import path
from .views import home, GenreViewSet, MovieViewSet, upload_poster, upload_video, delete_file, stream_video
from rest_framework.routers import DefaultRouter

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'genres', GenreViewSet, basename='genre')
router.register(r'movies', MovieViewSet, basename='movie')

# Get URL patterns from the router and add other URL patterns
urlpatterns = router.urls + [
    path('', home, name='home'),
    path('upload/poster/', upload_poster, name='upload_poster'),
    path('upload/video/', upload_video, name='upload_video'),
    path('upload/delete/', delete_file, name='delete_file'),
    path('stream/<path:path>', stream_video, name='stream_video'),
]
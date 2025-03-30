from django.shortcuts import render
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.http import JsonResponse
from django.views import View
from .models import Movie, Genre
from .serializers import MovieSerializer, GenreSerializer
import os
import uuid
import logging
import json
from urllib.parse import unquote

logger = logging.getLogger(__name__)

POSTER_DIR = os.path.join(settings.MEDIA_ROOT, 'movie_posters')
VIDEO_DIR = os.path.join(settings.MEDIA_ROOT, 'movie_videos')

os.makedirs(POSTER_DIR, exist_ok=True)
os.makedirs(VIDEO_DIR, exist_ok=True)

def home(request):
    """Simple home view that returns API info"""
    return JsonResponse({
        'status': 'online',
        'message': 'Welcome to MovieFlix API',
        'endpoints': {
            'movies': '/api/movies/',
            'genres': '/api/genres/',
            'top_rated': '/api/movies/top_rated/'
        }
    })

class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer

    def get_queryset(self):
        # For testing purposes, we can uncomment the following line to slow down the response
        # import time
        # time.sleep(2)
        queryset = super().get_queryset()
        return queryset
    
    @method_decorator(cache_page(60 * 15, key_prefix='genre_list'))  # Cache for 15 minutes
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(60 * 10, key_prefix='genre_detail'))  # Cache for 10 minutes
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all().prefetch_related('genres').order_by('id')
    serializer_class = MovieSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']  # Allow search by title & description
    ordering_fields = ['rating', 'release_date']  # Allow sorting by rating & release date
    
    def get_queryset(self):
        # For testing purposes, we can uncomment the following line to slow down the response
        # import time
        # time.sleep(2)
        queryset = super().get_queryset()
        genre = self.request.query_params.get('genre')
        min_rating = self.request.query_params.get('min_rating')
        if genre:
            queryset = queryset.filter(genres__name__icontains=genre)
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        return queryset
    
    @method_decorator(cache_page(60 * 5, key_prefix='movie_list'))  # Cache for 5 minutes
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(60 * 10, key_prefix='movie_detail'))  # Cache for 10 minutes
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    @method_decorator(cache_page(60 * 30, key_prefix='top_rated'))  # Cache for 30 minutes
    def top_rated(self, request):
        """Get the top 5 highest rated movies"""
        top_movies = Movie.objects.order_by('-rating')[:5]
        serializer = self.get_serializer(top_movies, many=True)
        return Response(serializer.data)

# File Upload Views

@method_decorator(csrf_exempt, name='dispatch')
class FileUploadView(View):
    """
    Handle file uploads for movie posters and videos
    """
    def post(self, request, file_type):
        try:
            if file_type not in ['poster', 'video']:
                return JsonResponse({'error': 'Invalid file type'}, status=400)

            if 'file' not in request.FILES:
                return JsonResponse({'error': 'No file provided'}, status=400)
            
            file = request.FILES['file']
            
            if file_type == 'poster' and not file.content_type.startswith('image/'):
                return JsonResponse({'error': 'File must be an image'}, status=400)
            
            if file_type == 'video' and not file.content_type.startswith('video/'):
                return JsonResponse({'error': 'File must be a video'}, status=400)
            
            if file_type == 'poster' and file.size > 10 * 1024 * 1024:  # 10MB
                return JsonResponse({'error': 'Poster file size must be less than 10MB'}, status=400)
            
            if file_type == 'video' and file.size > 1024 * 1024 * 1024:  # 1GB
                return JsonResponse({'error': 'Video file size must be less than 1GB'}, status=400)
            
            custom_filename = request.POST.get('filename')
            
            if custom_filename:
                filename = custom_filename
            else:
                original_name = file.name
                file_extension = os.path.splitext(original_name)[1]
                name_without_ext = os.path.splitext(original_name)[0]
                
                processed_name = name_without_ext.replace(' ', '_')
                
                unique_id = str(uuid.uuid4())[:8]
                
                filename = f"{unique_id}_{processed_name}{file_extension}"
            
            target_dir = POSTER_DIR if file_type == 'poster' else VIDEO_DIR
            file_path = os.path.join(target_dir, filename)
            
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            directory_name = 'movie_posters' if file_type == 'poster' else 'movie_videos'
            relative_path = os.path.join(directory_name, filename)
            url = request.build_absolute_uri(settings.MEDIA_URL + relative_path)
            
            return JsonResponse({'url': url, 'filename': filename})
        
        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class FileDeleteView(View):
    """
    Handle file deletions for movie posters and videos
    """
    def delete(self, request):
        try:
            try:
                data = json.loads(request.body.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                data = request.POST

            if 'url' not in data:
                return JsonResponse({'error': 'No URL provided'}, status=400)

            file_url = data['url']
            logger.info(f"Deleting file with URL: {file_url}")

            # Check if this is a relative path or full URL
            if file_url.startswith('http'):
                media_url = settings.MEDIA_URL.rstrip('/')
                
                if media_url not in file_url:
                    return JsonResponse({'error': 'Invalid file URL'}, status=400)

                url_parts = file_url.split(media_url)
                if len(url_parts) != 2:
                    return JsonResponse({'error': 'Unable to parse file URL'}, status=400)

                relative_path = unquote(url_parts[1])
            else:
                # Handle relative path directly
                relative_path = unquote(file_url)

            if relative_path.startswith('/'):
                relative_path = relative_path[1:]

            relative_path = relative_path.replace('\\', '/').replace('//', '/')

            file_path = os.path.join(settings.MEDIA_ROOT, *relative_path.split('/'))

            logger.info(f"Attempting to delete file at path: {file_path}")

            if not os.path.exists(file_path):
                return JsonResponse({'error': f'File not found at path: {file_path}'}, status=404)

            poster_dir_norm = os.path.normpath(POSTER_DIR)
            video_dir_norm = os.path.normpath(VIDEO_DIR)
            file_path_norm = os.path.normpath(file_path)

            if not (file_path_norm.startswith(poster_dir_norm) or file_path_norm.startswith(video_dir_norm)):
                return JsonResponse({'error': 'File is not in an allowed directory'}, status=403)

            os.remove(file_path)

            return JsonResponse({'success': True, 'message': 'File deleted successfully'})

        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
@csrf_exempt
@require_http_methods(["POST"])
def upload_poster(request):
    """Upload a poster image"""
    return FileUploadView.as_view()(request, file_type='poster')

@csrf_exempt
@require_http_methods(["POST"])
def upload_video(request):
    """Upload a video file"""
    return FileUploadView.as_view()(request, file_type='video')

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_file(request):
    """Delete an uploaded file"""
    return FileDeleteView.as_view()(request)

from django.shortcuts import render
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.conf import settings
from django.http import JsonResponse
from .models import Movie, Genre
from .serializers import MovieSerializer, GenreSerializer

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

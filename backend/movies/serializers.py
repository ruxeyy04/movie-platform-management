from rest_framework import serializers
from .models import Movie, Genre

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name']

class MovieSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    genre_ids = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(),
        write_only=True,
        many=True,
        source='genres',
        required=False
    )
    poster_url = serializers.URLField(required=False, allow_null=True)
    video = serializers.FileField(required=False, allow_null=True)
    video_url = serializers.URLField(required=False, allow_null=True)
    
    class Meta:
        model = Movie
        fields = [
            'id', 'title', 'description', 'release_date', 
            'duration', 'rating', 'poster', 'poster_url', 'video', 'video_url',
            'genres', 'genre_ids', 'created_at', 'updated_at'
        ]
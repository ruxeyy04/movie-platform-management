from rest_framework import serializers
from .models import Movie, Genre

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name']

class MovieSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    genre = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True
    )

    posterUploadFile_url = serializers.CharField(required=False, allow_null=True)
    videoUploadFile_url = serializers.CharField(required=False, allow_null=True)

    posterUrl = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    videoUrl = serializers.URLField(required=False, allow_null=True, allow_blank=True)

    def create(self, validated_data):
        genre_names = validated_data.pop('genre', [])
        poster_path = validated_data.pop('posterUploadFile_url', None)
        video_path = validated_data.pop('videoUploadFile_url', None)

        # ✅ Use the URL if it's a string, otherwise expect a file upload
        if isinstance(poster_path, str):
            validated_data['posterUploadFile_url'] = poster_path

        if isinstance(video_path, str):
            validated_data['videoUploadFile_url'] = video_path

        movie = Movie.objects.create(**validated_data)

        # ✅ Link or create genres
        for name in genre_names:
            genre_obj, _ = Genre.objects.get_or_create(name=name)
            movie.genres.add(genre_obj)

        return movie
    def update(self, instance, validated_data):
        # Handle genre data
        genre_names = validated_data.pop('genre', None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Update genres if provided
        if genre_names is not None:
            # Clear existing genres and add new ones
            instance.genres.clear()
            for name in genre_names:
                genre_obj, _ = Genre.objects.get_or_create(name=name)
                instance.genres.add(genre_obj)
        
        return instance
    class Meta:
        model = Movie
        fields = [
            'id', 'title', 'description', 'releaseYear', 'releaseDate', 'director',
            'duration', 'rating', 'posterUploadFile_url', 'posterUrl', 'videoUploadFile_url', 'videoUrl',
            'genres', 'genre', 'created_at', 'updated_at'
        ]
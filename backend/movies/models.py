from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from decimal import Decimal

class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Movie(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    releaseYear = models.PositiveIntegerField(help_text="Release year", default=2000)
    releaseDate = models.DateField(null=True, blank=True)
    director = models.CharField(max_length=255, null=True, blank=True) 
    duration = models.PositiveIntegerField(help_text="Duration in minutes")
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=1,
        validators=[MinValueValidator(Decimal('0.0')), MaxValueValidator(Decimal('10.0'))]
    )
    posterUploadFile_url = models.ImageField(
        upload_to='movie_posters/', 
        null=True, 
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'hevc', 'avif'])]
    )
    posterUrl = models.URLField(null=True, blank=True)
    videoUploadFile_url = models.FileField(
        upload_to='movie_videos/', 
        null=True, 
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['mp4', 'avi', 'mov', 'mkv', 'ts', 'm3u8'])]
    )
    videoUrl = models.URLField(null=True, blank=True)
    genres = models.ManyToManyField(Genre, related_name='movies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title

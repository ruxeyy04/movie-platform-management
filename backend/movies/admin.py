from django.contrib import admin
from django.utils.html import format_html
from .models import Movie, Genre

@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('title', 'release_date', 'rating', 'duration', 'poster_preview', 'video_available')
    list_filter = ('genres', 'release_date', 'rating')
    search_fields = ('title', 'description')
    filter_horizontal = ('genres',)
    
    def poster_preview(self, obj):
        if obj.poster:
            return format_html(f'<img src="{obj.poster.url}" width="50" height="50" style="border-radius:5px;"/>')
        elif obj.poster_url:
            return format_html(f'<img src="{obj.poster_url}" width="50" height="50" style="border-radius:5px;"/>')
        return "No Image"
    
    def video_available(self, obj):
        return bool(obj.video or obj.video_url)
    
    video_available.boolean = True  # Displays a checkmark for True/False values
import os
from django.db.models.signals import post_delete, post_save, pre_delete
from django.dispatch import receiver
from .models import Movie, Genre
from django.core.cache import cache

@receiver(post_delete, sender=Movie)
def auto_delete_files_on_delete(sender, instance, **kwargs):
    try: 
        if instance.posterUploadFile_url:
            poster_path = instance.posterUploadFile_url.path if instance.posterUploadFile_url else None
            if poster_path and os.path.isfile(poster_path):
                os.remove(poster_path)
                # print(f"Deleted poster file for movie {instance.title} (ID: {instance.id})")
            else:
                print(f"Poster file for movie {instance.title} not found at {poster_path}")
        
        if instance.videoUploadFile_url:
            video_path = instance.videoUploadFile_url.path if instance.videoUploadFile_url else None
            if video_path and os.path.isfile(video_path):
                os.remove(video_path)
                # print(f"Deleted video file for movie {instance.title} (ID: {instance.id})")
            else:
                print(f"Video file for movie {instance.title} not found at {video_path}")
    except Exception as e:
        print(f"Error deleting files for movie {instance.title}: {str(e)}")

@receiver([post_save, post_delete, pre_delete], sender=Movie)
def invalidate_movie_cache(sender, instance, **kwargs):
    try:
        keys_to_delete = [
            'movie_list',
            'top_rated',
            f'movie_detail:{instance.id}'
        ]
        
        for key in keys_to_delete:
            cache.delete(key)
            # print(f"Deleted cache key: {key}")
        
        # Also invalidate genre-related cache since movies are linked to genres
        cache.delete('genre_list')
            
        # Try pattern-based deletion if supported by the cache backend
        try:
            if hasattr(cache, 'delete_pattern'):
                cache.delete_pattern('*movie_*')
                # print("Deleted all movie-related cache patterns")
        except Exception as e:
            print(f"Cache pattern deletion not supported: {str(e)}")
            
    except Exception as e:
        print(f"Error invalidating cache for movie {instance.title}: {str(e)}")

# Signal handlers for the Genre model
@receiver([post_save, post_delete, pre_delete], sender=Genre)
def invalidate_genre_cache(sender, instance, **kwargs):
    try:
        print(f"Cache invalidation triggered for Genre ID: {instance.id} (Method: {kwargs.get('created', 'Updated')})")

        cache.delete('genre_list')
        if instance.id:
            cache.delete(f'genre_detail:{instance.id}')
        
        cache.delete('movie_list')

        try:
            if hasattr(cache, 'delete_pattern'):
                cache.delete_pattern('*genre*')
                cache.delete_pattern('*movie_list*')
                print(f"Cache cleared for genre id={getattr(instance, 'id', 'new')}")
            else:
                # If pattern deletion isn't supported, delete individual keys
                all_keys = cache._cache.keys() if hasattr(cache, '_cache') else []
                for key in all_keys:
                    if 'genre' in str(key) or 'movie_list' in str(key):
                        cache.delete(key)
                        print(f"Deleted cache key: {key}")
        except Exception as e:
            print(f"Error in cache pattern deletion: {str(e)}")
            
    except Exception as e:
        print(f"Error invalidating cache for genre {getattr(instance, 'name', 'unknown')}: {str(e)}")

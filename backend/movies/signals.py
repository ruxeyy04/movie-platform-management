import os
from django.db.models.signals import post_delete, post_save, pre_delete
from django.dispatch import receiver
from .models import Movie
from django.core.cache import cache

@receiver(post_delete, sender=Movie)
def auto_delete_files_on_delete(sender, instance, **kwargs):
    try: 
        if instance.poster:
            if os.path.isfile(instance.poster.path):
                os.remove(instance.poster.path)
                # print(f"Deleted poster file for movie {instance.title} (ID: {instance.id})")
            else:
                print(f"Poster file for movie {instance.title} not found at {instance.poster.path}")
        
        if instance.video:
            if os.path.isfile(instance.video.path):
                os.remove(instance.video.path)
                # print(f"Deleted video file for movie {instance.title} (ID: {instance.id})")
            else:
                print(f"Video file for movie {instance.title} not found at {instance.video.path}")
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
            
        # Try pattern-based deletion if supported by the cache backend
        try:
            if hasattr(cache, 'delete_pattern'):
                cache.delete_pattern('*movie_*')
                # print("Deleted all movie-related cache patterns")
        except Exception as e:
            print(f"Cache pattern deletion not supported: {str(e)}")
            
    except Exception as e:
        print(f"Error invalidating cache for movie {instance.title}: {str(e)}")

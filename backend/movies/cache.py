from django.core.cache import cache
from django.conf import settings
import json

def get_cached_data(key, timeout=None):
    """Get data from cache by key"""
    return cache.get(key)

def set_cached_data(key, data, timeout=None):
    """Set data in cache with optional timeout"""
    timeout = timeout or 60 * 15  # Default: 15 minutes
    cache.set(key, data, timeout)

def invalidate_cache(key_prefix):
    """Invalidate all cache keys with the given prefix"""
    if hasattr(cache, 'delete_pattern'):
        cache.delete_pattern(f"{key_prefix}*")  # For backends that support pattern deletion
    
def cache_key_for_movie(movie_id):
    """Generate a cache key for a specific movie"""
    return f"movie:{movie_id}"
    
def cache_key_for_movie_list(params=None):
    """Generate a cache key for movie list with optional query params"""
    if params:
        param_str = json.dumps(dict(sorted(params.items())), sort_keys=True)
        return f"movie:list:{param_str}"
    return "movie:list"
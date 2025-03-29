from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from datetime import date
from .models import Movie, Genre

class ModelTestCase(TestCase):
    def setUp(self):
        self.genre = Genre.objects.create(name="Action")
        self.movie = Movie.objects.create(
            title="Test Movie",
            description="This is a test movie",
            release_date=date(2023, 1, 1),
            duration=120,
            rating=8.5
        )
        self.movie.genres.add(self.genre)

    def test_genre_model(self):
        self.assertEqual(str(self.genre), "Action")

    def test_movie_model(self):
        self.assertEqual(str(self.movie), "Test Movie")
        self.assertEqual(self.movie.genres.count(), 1)
        self.assertEqual(self.movie.genres.first().name, "Action")


class MovieAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        
        self.client.force_authenticate(user=self.user)
        
        self.genre = Genre.objects.create(name="Action")
        self.movie = Movie.objects.create(
            title="Test Movie",
            description="This is a test movie",
            release_date=date(2023, 1, 1),
            duration=120,
            rating=8.5
        )
        self.movie.genres.add(self.genre)

    def test_get_movies(self):
        url = reverse('movie-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['title'], "Test Movie")

    def test_get_top_rated(self):
        url = reverse('movie-top-rated')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_movie(self):
        url = reverse('movie-list')
        data = {
            "title": "New Movie",
            "description": "A new test movie",
            "release_date": "2025-01-01",
            "duration": 100,
            "rating": 9.0,
            "genre_ids": [self.genre.id]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Movie.objects.count(), 2)

    def test_update_movie(self):
        url = reverse('movie-detail', args=[self.movie.id])
        data = {"title": "Updated Movie"}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.movie.refresh_from_db()
        self.assertEqual(self.movie.title, "Updated Movie")

    def test_filter_movies_by_genre(self):
        url = reverse('movie-list') + f"?genres={self.genre.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

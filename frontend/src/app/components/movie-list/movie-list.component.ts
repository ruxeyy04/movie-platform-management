import { Component, OnInit } from '@angular/core';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';

@Component({
  selector: 'app-movie-list',
  templateUrl: './movie-list.component.html',
  styleUrls: ['./movie-list.component.css']
})
export class MovieListComponent implements OnInit {
  movies: Movie[] = [];
  loading = true;
  error = false;
  showDeleteModal = false;
  movieToDelete: Movie | null = null;
  deleteInProgress = false;

  constructor(private movieService: MovieService) { }

  ngOnInit(): void {
    this.loadMovies();
  }

  loadMovies(): void {
    this.loading = true;
    this.movieService.getMovies()
      .subscribe({
        next: (movies) => {
          this.movies = movies;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching movies', err);
          this.error = true;
          this.loading = false;
        }
      });
  }

  confirmDelete(movie: Movie): void {
    this.movieToDelete = movie;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.movieToDelete = null;
    this.showDeleteModal = false;
  }

  deleteMovie(): void {
    if (!this.movieToDelete || !this.movieToDelete.id) return;

    this.deleteInProgress = true;
    const movieId = this.movieToDelete.id;

    this.movieService.deleteMovie(movieId).subscribe({
      next: () => {
        this.movies = this.movies.filter(movie => movie.id !== movieId);
        this.deleteInProgress = false;
        this.showDeleteModal = false;
        this.movieToDelete = null;
      },
      error: (err) => {
        console.error('Error deleting movie', err);
        this.deleteInProgress = false;
        alert('Failed to delete the movie. Please try again.');
      }
    });
  }
}
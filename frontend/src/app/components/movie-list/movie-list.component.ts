import { Component, OnInit, OnDestroy } from '@angular/core';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal.component';
import { NotificationService } from '../../services/notification.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-movie-list',
  templateUrl: './movie-list.component.html',
  styleUrls: ['./movie-list.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmationModalComponent]
})
export class MovieListComponent implements OnInit, OnDestroy {
  movies: Movie[] = [];
  loading = true;
  error = false;
  showDeleteModal = false;
  movieToDelete: Movie | null = null;
  deleteInProgress = false;

  // Hero banner properties
  featuredMovies: Movie[] = [];
  currentFeaturedIndex = 0;
  private rotationInterval: Subscription | null = null;
  slidingDirection = 'left'; // For animation direction
  animating = false;

  // Add a map to track which movies have their actions visible
  expandedMovies = new Map<any, boolean>();

  constructor(
    private movieService: MovieService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadMovies();
  }

  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    if (this.rotationInterval) {
      this.rotationInterval.unsubscribe();
    }
  }

  loadMovies(): void {
    this.loading = true;
    this.movieService.getMovies()
      .subscribe({
        next: (movies) => {
          this.movies = movies;
          this.loading = false;

          // Setup featured movies
          this.setupFeaturedMovies();
        },
        error: (err) => {
          console.error('Error fetching movies', err);
          this.error = true;
          this.loading = false;
        }
      });
  }

  setupFeaturedMovies(): void {
    if (this.movies.length > 0) {
      // Shuffle the movies for initial selection
      this.featuredMovies = this.shuffleMovies([...this.movies]).slice(0, Math.min(5, this.movies.length));

      // Start the rotation
      this.startBannerRotation();
    }
  }

  shuffleMovies(movies: Movie[]): Movie[] {
    for (let i = movies.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [movies[i], movies[j]] = [movies[j], movies[i]];
    }
    return movies;
  }

  startBannerRotation(): void {
    if (this.rotationInterval) {
      this.rotationInterval.unsubscribe();
    }

    // Rotate every 5 seconds
    this.rotationInterval = interval(5000).subscribe(() => {
      this.rotateFeaturedMovie();
    });
  }

  rotateFeaturedMovie(): void {
    if (this.animating || this.featuredMovies.length <= 1) return;

    this.animating = true;

    // Randomly determine the sliding direction
    this.slidingDirection = Math.random() > 0.5 ? 'left' : 'right';

    // Choose next index
    const nextIndex = this.getNextRandomIndex();
    this.currentFeaturedIndex = nextIndex;

    // Reset animation flag after animation completes
    setTimeout(() => {
      this.animating = false;
    }, 1000); // Match this with CSS transition duration
  }

  getNextRandomIndex(): number {
    if (this.featuredMovies.length <= 1) return 0;

    // Get a random index that's different from the current one
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * this.featuredMovies.length);
    } while (nextIndex === this.currentFeaturedIndex);

    return nextIndex;
  }

  getCurrentFeaturedMovie(): Movie {
    return this.featuredMovies[this.currentFeaturedIndex];
  }

  // Existing methods for delete functionality
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
    const movieTitle = this.movieToDelete.title;

    this.movieService.deleteMovie(movieId).subscribe({
      next: () => {
        this.movies = this.movies.filter(movie => movie.id !== movieId);
        this.featuredMovies = this.featuredMovies.filter(movie => movie.id !== movieId);

        if (this.currentFeaturedIndex >= this.featuredMovies.length) {
          this.currentFeaturedIndex = 0;
        }

        this.deleteInProgress = false;
        this.showDeleteModal = false;
        this.movieToDelete = null;
        this.notificationService.success(`"${movieTitle}" has been deleted successfully.`);
      },
      error: (err) => {
        console.error('Error deleting movie', err);
        this.deleteInProgress = false;
        this.notificationService.error('Failed to delete the movie. Please try again.');
      }
    });
  }

  // Add Math to the component class
  Math = Math;

  // Toggle movie actions visibility when clicking expand button
  toggleMovieActions(movie: any): void {
    console.log('Toggle actions for movie:', movie.id);
    const currentValue = this.expandedMovies.get(movie.id) || false;
    this.expandedMovies.set(movie.id, !currentValue);
    console.log('Expanded state is now:', this.expandedMovies.get(movie.id));
  }
}
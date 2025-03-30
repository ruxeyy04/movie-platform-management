import { Component, OnInit, OnDestroy } from '@angular/core';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal.component';
import { NotificationService } from '../../services/notification.service';
import { interval, Subscription } from 'rxjs';
import { PaginatedResponse } from '../../services/genre.service';

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

  // Pagination
  currentPage = 1;
  totalItems = 0;
  nextPage: string | null = null;
  previousPage: string | null = null;

  // Hero banner properties
  featuredMovies: Movie[] = [];
  currentFeaturedIndex = 0;
  private rotationInterval: Subscription | null = null;
  slidingDirection = 'left'; // For animation direction
  animating = false;

  // Add a map to track which movies have their actions visible
  expandedMovies = new Map<any, boolean>();

  // Track subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private movieService: MovieService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadMovies(1);

    this.subscriptions.push(
      this.movieService.listLoading$.subscribe(status => this.loading = status)
    );
  }

  ngOnDestroy(): void {
    if (this.rotationInterval) {
      this.rotationInterval.unsubscribe();
    }

    // Clean up other subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadMovies(page: number = 1): void {
    this.movieService.getMovies(page)
      .subscribe({
        next: (response: PaginatedResponse<Movie>) => {
          this.movies = response.results;
          this.totalItems = response.count;
          this.nextPage = response.next;
          this.previousPage = response.previous;
          this.currentPage = page;

          this.setupFeaturedMovies();
        },
        error: (err) => {
          console.error('Error fetching movies', err);
          this.error = true;
        }
      });
  }

  goToNextPage(): void {
    if (this.nextPage) {
      const nextPageNumber = this.movieService.getPageFromUrl(this.nextPage);
      this.loadMovies(nextPageNumber);
    }
  }

  goToPreviousPage(): void {
    if (this.previousPage) {
      const prevPageNumber = this.movieService.getPageFromUrl(this.previousPage);
      this.loadMovies(prevPageNumber);
    }
  }

  setupFeaturedMovies(): void {
    if (this.movies.length > 0) {
      // Shuffle the movies for initial selection
      this.featuredMovies = this.shuffleMovies([...this.movies]).slice(0, Math.min(5, this.movies.length));

      // Start the rotation
      this.startBannerRotation();
    } else {
      // Clear featured movies and stop rotation when no movies exist
      this.featuredMovies = [];
      if (this.rotationInterval) {
        this.rotationInterval.unsubscribe();
        this.rotationInterval = null;
      }
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

    // Rotate every 7 seconds (giving more time to view each movie)
    this.rotationInterval = interval(7000).subscribe(() => {
      this.rotateFeaturedMovie();
    });
  }

  rotateFeaturedMovie(): void {
    if (this.animating || this.featuredMovies.length <= 1) return;

    this.animating = true;

    // Determine the sliding direction
    this.slidingDirection = Math.random() > 0.5 ? 'left' : 'right';

    // Prepare the next index before animation completes
    const nextIndex = this.getNextRandomIndex();

    // Use setTimeout to match our animation timing
    setTimeout(() => {
      // Update the index after the "out" phase of the animation
      this.currentFeaturedIndex = nextIndex;

      // Reset animation flag after animation completes
      setTimeout(() => {
        this.animating = false;
      }, 400); // Second half of animation duration
    }, 400); // First half of animation duration
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
        // Check if we need to go to previous page
        if (this.movies.length === 1 && this.currentPage > 1) {
          this.loadMovies(this.currentPage - 1);
        } else {
          // Just reload current page
          this.loadMovies(this.currentPage);
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

  Math = Math;

  toggleMovieActions(movie: any): void {
    console.log('Toggle actions for movie:', movie.id);
    const currentValue = this.expandedMovies.get(movie.id) || false;
    this.expandedMovies.set(movie.id, !currentValue);
    console.log('Expanded state is now:', this.expandedMovies.get(movie.id));
  }
}
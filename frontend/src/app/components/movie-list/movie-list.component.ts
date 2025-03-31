import { Component, OnInit, OnDestroy } from '@angular/core';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal.component';
import { NotificationService } from '../../services/notification.service';
import { interval, Subscription } from 'rxjs';
import { PaginatedResponse } from '../../services/genre.service';
import { Genre } from '../../models/genre.model';
import { GenreService } from '../../services/genre.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-movie-list',
  templateUrl: './movie-list.component.html',
  styleUrls: ['./movie-list.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmationModalComponent, FormsModule]
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

  // Genre filtering
  genres: Genre[] = [];
  selectedGenre: string = '';
  loadingGenres = false;
  filteredMovies: Movie[] = [];
  allMovies: Movie[] = [];
  isFiltering: boolean = false;
  animationDuration: number = 400; // milliseconds

  // Track subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private movieService: MovieService,
    private notificationService: NotificationService,
    private genreService: GenreService
  ) { }

  ngOnInit(): void {
    this.loadMovies(1);
    this.loadGenres();

    this.subscriptions.push(
      this.movieService.listLoading$.subscribe(status => this.loading = status)
    );
  }

  ngOnDestroy(): void {
    // Clean up rotation interval
    if (this.rotationInterval) {
      this.rotationInterval.unsubscribe();
      this.rotationInterval = null;
    }

    // Clean up other subscriptions
    this.subscriptions.forEach(sub => {
      if (sub) sub.unsubscribe();
    });
  }

  loadGenres(): void {
    this.loadingGenres = true;
    this.genreService.getAllGenres().subscribe({
      next: (genres) => {
        this.genres = genres;
        this.loadingGenres = false;
      },
      error: (err) => {
        console.error('Error loading genres', err);
        this.loadingGenres = false;
      }
    });
  }

  loadMovies(page: number = 1): void {
    this.movieService.getMovies(page)
      .subscribe({
        next: (response: PaginatedResponse<Movie>) => {
          this.movies = response.results;
          this.allMovies = [...response.results]; // Save a copy of all movies
          this.filteredMovies = [...response.results]; // Initialize filtered movies
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

  filterByGenre(): void {
    // Set the filtering flag to enable animations
    this.isFiltering = true;

    setTimeout(() => {
      try {
        if (!this.selectedGenre || this.selectedGenre.trim() === '') {
          // If no genre is selected, show all movies
          this.movies = [...this.allMovies];
        } else {
          // Filter movies by the selected genre with case-insensitive matching
          this.movies = this.allMovies.filter(movie =>
            movie.genre &&
            Array.isArray(movie.genre) &&
            movie.genre.some(g => g && g.toLowerCase() === this.selectedGenre.toLowerCase())
          );
        }

        // Reset featured movies based on new filter
        this.setupFeaturedMovies();
      } catch (error) {
        console.error('Error during filtering:', error);
        // Fallback to showing all movies on error
        this.movies = [...this.allMovies];
      }

      // Allow animations to complete before resetting the flag
      setTimeout(() => {
        this.isFiltering = false;
      }, this.animationDuration);
    }, 50); // Small delay to ensure CSS transitions have time to start
  }

  clearGenreFilter(): void {
    this.selectedGenre = '';
    this.filterByGenre();
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
      this.currentFeaturedIndex = 0; // Reset index to avoid out-of-bounds errors

      // Start the rotation
      this.startBannerRotation();
    } else {
      // Clear featured movies and stop rotation when no movies exist
      this.featuredMovies = [];
      this.currentFeaturedIndex = 0;
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
    // Stop any existing rotation first
    if (this.rotationInterval) {
      this.rotationInterval.unsubscribe();
      this.rotationInterval = null;
    }

    // Only start rotation if we have more than one featured movie
    if (this.featuredMovies.length > 1) {
      // Rotate every 7 seconds (giving more time to view each movie)
      this.rotationInterval = interval(7000).subscribe(() => {
        this.rotateFeaturedMovie();
      });
    }
  }

  rotateFeaturedMovie(): void {
    // Don't rotate if already animating or if we have 1 or fewer movies
    if (this.animating || !this.featuredMovies || this.featuredMovies.length <= 1) return;

    this.animating = true;

    // Determine the sliding direction randomly
    this.slidingDirection = Math.random() > 0.5 ? 'left' : 'right';

    try {
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
    } catch (error) {
      console.error('Error during featured movie rotation:', error);
      this.animating = false; // Reset animation flag on error
    }
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
    // Safety check to prevent errors
    if (!this.featuredMovies || this.featuredMovies.length === 0) {
      return {} as Movie; // Return empty movie object if no featured movies
    }

    // Ensure index is valid
    if (this.currentFeaturedIndex >= this.featuredMovies.length) {
      this.currentFeaturedIndex = 0;
    }

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
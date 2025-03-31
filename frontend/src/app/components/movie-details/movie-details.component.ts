import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal.component';
import { NotificationService } from '../../services/notification.service';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-movie-details',
  templateUrl: './movie-details.component.html',
  styleUrls: ['./movie-details.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmationModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MovieDetailsComponent implements OnInit, OnDestroy {
  movie: Movie | null = null;
  loading = true;
  error = false;
  showDeleteModal = false;
  deleteInProgress = false;

  // Similar movies
  similarMovies: Movie[] = [];
  loadingSimilar = false;

  // Subscription management
  private routeSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private location: Location,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // Subscribe to route parameter changes
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      // Reset component state
      this.movie = null;
      this.loading = true;
      this.error = false;
      this.similarMovies = [];

      // Get movie ID from route parameters
      const id = Number(params.get('id'));
      if (isNaN(id)) {
        this.error = true;
        this.loading = false;
        return;
      }

      // Load movie details with the new ID
      this.loadMovie(id);
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  loadMovie(id: number): void {
    this.movieService.getMovie(id)
      .subscribe({
        next: (movie) => {
          this.movie = movie;
          this.loading = false;
          this.getSimilarMovies(movie);

          window.scrollTo(0, 0);
        },
        error: (err) => {
          console.error('Error fetching movie details', err);
          this.error = true;
          this.loading = false;
        }
      });
  }

  getSimilarMovies(movie: Movie): void {
    this.loadingSimilar = true;
    this.similarMovies = []; // Clear any previous recommendations

    this.movieService.getSimilarMovies(movie)
      .pipe(
        finalize(() => this.loadingSimilar = false)
      )
      .subscribe({
        next: (movies) => {
          this.similarMovies = movies;
        },
        error: (err) => {
          console.error('Error fetching similar movies', err);
          // Don't set error flag, as this is a non-critical feature
        }
      });
  }

  goBack(): void {
    this.location.back();
  }

  confirmDelete(): void {
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
  }

  deleteMovie(): void {
    if (!this.movie?.id) return;

    this.deleteInProgress = true;
    const movieTitle = this.movie.title;

    this.movieService.deleteMovie(this.movie.id).subscribe({
      next: () => {
        this.deleteInProgress = false;
        this.showDeleteModal = false;
        this.notificationService.success(`"${movieTitle}" has been deleted successfully.`);
        this.router.navigate(['/movies']);
      },
      error: (err) => {
        console.error('Error deleting movie', err);
        this.deleteInProgress = false;
        this.showDeleteModal = false;
        this.notificationService.error('Failed to delete the movie. Please try again.');
      }
    });
  }

  formatDate(dateString: string | Date | null): string {
    if (!dateString) {
      return 'Coming Soon';
    }

    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
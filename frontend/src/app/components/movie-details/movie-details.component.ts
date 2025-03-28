import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-movie-details',
  templateUrl: './movie-details.component.html',
  styleUrls: ['./movie-details.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmationModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MovieDetailsComponent implements OnInit {
  movie: Movie | null = null;
  loading = true;
  error = false;
  showDeleteModal = false;
  deleteInProgress = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private location: Location,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.getMovie();
  }

  getMovie(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      this.error = true;
      this.loading = false;
      return;
    }

    this.movieService.getMovie(id)
      .subscribe({
        next: (movie) => {
          this.movie = movie;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching movie details', err);
          this.error = true;
          this.loading = false;
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
}
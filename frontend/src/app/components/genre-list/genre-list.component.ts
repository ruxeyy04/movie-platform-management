import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Genre } from '../../models/genre.model';
import { GenreService, PaginatedResponse } from '../../services/genre.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-genre-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmationModalComponent],
  templateUrl: './genre-list.component.html',
  styleUrls: ['./genre-list.component.css']
})
export class GenreListComponent implements OnInit, OnDestroy {
  genres: Genre[] = [];
  loading = true;
  deleting = false;
  error = '';
  showDeleteModal = false;
  genreToDelete: number | null = null;
  private subscriptions: Subscription[] = [];

  // Pagination
  currentPage = 1;
  totalItems = 0;
  nextPage: string | null = null;
  previousPage: string | null = null;

  constructor(
    private genreService: GenreService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadGenres(1);

    // Subscribe to loading states
    this.subscriptions.push(
      this.genreService.listLoading$.subscribe(status => this.loading = status),
      this.genreService.deleteLoading$.subscribe(status => this.deleting = status)
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadGenres(page: number = 1): void {
    this.genreService.getGenres(page).subscribe({
      next: (response: PaginatedResponse<Genre>) => {
        this.genres = response.results;
        this.totalItems = response.count;
        this.nextPage = response.next;
        this.previousPage = response.previous;
        this.currentPage = page;
      },
      error: (err) => {
        this.error = err.message;
        this.notificationService.error('Failed to load genres: ' + err.message);
      }
    });
  }

  goToNextPage(): void {
    if (this.nextPage) {
      const nextPageNumber = this.genreService.getPageFromUrl(this.nextPage);
      this.loadGenres(nextPageNumber);
    }
  }

  goToPreviousPage(): void {
    if (this.previousPage) {
      const prevPageNumber = this.genreService.getPageFromUrl(this.previousPage);
      this.loadGenres(prevPageNumber);
    }
  }

  deleteGenre(id: number): void {
    this.genreToDelete = id;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.genreToDelete) {
      this.genreService.deleteGenre(this.genreToDelete).subscribe({
        next: () => {
          this.genres = this.genres.filter(genre => genre.id !== this.genreToDelete);
          this.showDeleteModal = false;
          this.genreToDelete = null;
          this.notificationService.success('Genre deleted successfully');

          // If we deleted the last item on a page, go to previous page
          if (this.genres.length === 0 && this.currentPage > 1) {
            this.loadGenres(this.currentPage - 1);
          } else {
            // Reload current page to get updated count
            this.loadGenres(this.currentPage);
          }
        },
        error: (err) => {
          this.error = err.message || 'Failed to delete genre';
          this.showDeleteModal = false;
          this.genreToDelete = null;
          this.notificationService.error(this.error);
        }
      });
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.genreToDelete = null;
  }
}

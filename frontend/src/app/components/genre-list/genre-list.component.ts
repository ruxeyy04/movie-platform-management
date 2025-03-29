import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Genre } from '../../models/genre.model';
import { GenreService } from '../../services/genre.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-genre-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmationModalComponent],
  templateUrl: './genre-list.component.html',
  styleUrls: ['./genre-list.component.css']
})
export class GenreListComponent implements OnInit {
  genres: Genre[] = [];
  loading = true;
  error = '';
  showDeleteModal = false;
  genreToDelete: number | null = null;

  constructor(
    private genreService: GenreService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadGenres();
  }

  loadGenres(): void {
    this.loading = true;
    this.genreService.getGenres().subscribe({
      next: (genres) => {
        this.genres = genres;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
        this.notificationService.error('Failed to load genres: ' + err.message);
      }
    });
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
        },
        error: (err) => {
          this.error = err.message || 'Failed to delete genre';
          this.showDeleteModal = false;
        }
      });
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.genreToDelete = null;
  }
}

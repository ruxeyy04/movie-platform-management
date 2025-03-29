import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Genre } from '../../models/genre.model';
import { GenreService } from '../../services/genre.service';
import { NotificationService } from '../../services/notification.service';
import { Location } from '@angular/common';
@Component({
  selector: 'app-genre-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './genre-form.component.html',
  styleUrls: ['./genre-form.component.css']
})
export class GenreFormComponent implements OnInit {
  genreForm!: FormGroup;
  isEditMode = false;
  genreId?: number;
  loading = false;
  submitting = false;
  title = 'Add New Genre';
  error: string | null = null;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private genreService: GenreService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkForEditMode();
  }

  private initForm(): void {
    this.genreForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    });
  }

  private checkForEditMode(): void {
    this.genreId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.genreId) {
      this.isEditMode = true;
      this.title = 'Edit Genre';
      this.loadGenre(this.genreId);
    }
  }

  private loadGenre(id: number): void {
    this.loading = true;
    this.genreService.getGenre(id).subscribe({
      next: (genre) => {
        this.genreForm.patchValue({
          name: genre.name
        });
        this.loading = false;
      },
      error: (err) => {
        this.notificationService.error('Failed to load genre: ' + err.message);
        this.loading = false;
        this.router.navigate(['/genres']);
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.genreForm.invalid) {
      this.genreForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const genreData: Genre = this.genreForm.value;

    if (this.isEditMode && this.genreId) {
      this.genreService.updateGenre(this.genreId, genreData).subscribe({
        next: () => {
          this.notificationService.success('Genre updated successfully');
          this.submitting = false;
          this.router.navigate(['/genres']);
        },
        error: (err) => {
          this.notificationService.error('Failed to update genre: ' + err.message);
          this.submitting = false;
        }
      });
    } else {
      this.genreService.addGenre(genreData).subscribe({
        next: () => {
          this.notificationService.success('Genre created successfully');
          this.submitting = false;
          this.router.navigate(['/genres']);
        },
        error: (err) => {
          this.notificationService.error('Failed to create genre: ' + err.message);
          this.submitting = false;
        }
      });
    }
  }

  // Helper method for form validation
  get f() {
    return this.genreForm.controls;
  }
  goBack(): void {
    this.location.back();
  }
}
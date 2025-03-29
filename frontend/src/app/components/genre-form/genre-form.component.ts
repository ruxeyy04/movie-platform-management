import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Genre } from '../../models/genre.model';
import { GenreService } from '../../services/genre.service';
import { NotificationService } from '../../services/notification.service';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-genre-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './genre-form.component.html',
  styleUrls: ['./genre-form.component.css']
})
export class GenreFormComponent implements OnInit, OnDestroy {
  genreForm!: FormGroup;
  isEditMode = false;
  genreId?: number;
  loading = false;
  submitting = false;
  title = 'Add New Genre';
  error: string | null = null;
  submitted = false;
  fieldErrors: { [key: string]: string[] } = {};
  private subscriptions: Subscription[] = [];

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

    this.subscriptions.push(
      this.genreService.listLoading$.subscribe(status => this.loading = status),
      this.genreService.createLoading$.subscribe(status => this.submitting = status),
      this.genreService.updateLoading$.subscribe(status => this.submitting = status)
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
    this.genreService.getGenre(id).subscribe({
      next: (genre) => {
        this.genreForm.patchValue({
          name: genre.name
        });
      },
      error: (err) => {
        this.handleError(err);
        this.router.navigate(['/genres']);
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.fieldErrors = {};

    if (this.genreForm.invalid) {
      this.genreForm.markAllAsTouched();
      return;
    }

    const genreData: Genre = this.genreForm.value;

    if (this.isEditMode && this.genreId) {
      this.genreService.updateGenre(this.genreId, genreData).subscribe({
        next: () => {
          this.notificationService.success('Genre updated successfully');
          this.router.navigate(['/genres']);
        },
        error: (err) => {
          this.handleError(err);
        }
      });
    } else {
      this.genreService.addGenre(genreData).subscribe({
        next: () => {
          this.notificationService.success('Genre created successfully');
          this.router.navigate(['/genres']);
        },
        error: (err) => {
          this.handleError(err);
        }
      });
    }
  }

  private handleError(err: any): void {
    if (err.fieldErrors) {
      this.fieldErrors = err.fieldErrors;

      Object.keys(this.fieldErrors).forEach(key => {
        const control = this.genreForm.get(key);
        if (control) {
          const capitalizedErrors = this.fieldErrors[key].map(error => this.capitalizeFirstLetter(error));
          const serverErrors = { serverError: capitalizedErrors.join(', ') };
          control.setErrors({ ...control.errors, ...serverErrors });
          control.markAsTouched();
        }
      });
      this.error = this.capitalizeFirstLetter(err.message);
    } else {
      this.error = this.capitalizeFirstLetter(err.message);
    }

    const errorMessage = this.isEditMode ? 'Failed to update genre' : 'Failed to create genre';
    this.notificationService.error(`${errorMessage}: ${this.capitalizeFirstLetter(err.message)}`);
  }

  private capitalizeFirstLetter(message: string): string {
    return message.charAt(0).toUpperCase() + message.slice(1);
  }

  get f() {
    return this.genreForm.controls;
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName]?.join(', ') || '';
  }

  goBack(): void {
    this.location.back();
  }
}
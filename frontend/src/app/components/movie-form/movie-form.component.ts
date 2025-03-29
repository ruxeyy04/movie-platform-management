import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MovieService } from '../../services/movie.service';
import { FileUploadService, UploadProgress } from '../../services/file-upload.service';
import { Movie } from '../../models/movie.model';
import { Location } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

// Custom date formats to match Netflix style
export const NETFLIX_DATE_FORMATS = {
  parse: {
    dateInput: 'MM/DD/YYYY',
  },
  display: {
    dateInput: 'MM/DD/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-movie-form',
  templateUrl: './movie-form.component.html',
  styleUrls: ['./movie-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressBarModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: NETFLIX_DATE_FORMATS }
  ]
})
export class MovieFormComponent implements OnInit, OnDestroy {
  movieForm!: FormGroup;
  isEditMode = false;
  movieId: number | null = null;
  loading = false;
  submitting = false;
  posterPreview: string | null = null;
  isComingSoon = false;
  maxDate: Date = new Date(new Date().getFullYear() + 5, 11, 31); // Max date 5 years from now

  // File upload states
  usePosterUrl = true;
  useVideoUrl = true;
  posterFile: File | null = null;
  videoFile: File | null = null;
  posterFilePreview: SafeUrl | null = null;
  videoFileName: string | null = null;

  // File upload error states
  posterSizeError = false;
  videoSizeError = false;

  // Upload progress tracking
  posterUploadId: string | null = null;
  videoUploadId: string | null = null;
  posterUploadProgress: UploadProgress = { state: 'PENDING', progress: 0 };
  videoUploadProgress: UploadProgress = { state: 'PENDING', progress: 0 };
  uploadedPosterUrl: string | null = null;
  uploadedVideoUrl: string | null = null;

  // Subscriptions for uploads
  private subscriptions: Subscription[] = [];

  // Predefined list of common movie genres
  genreOptions: string[] = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror',
    'Music', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Sport',
    'Thriller', 'War', 'Western'
  ];

  // Set file size limits (in bytes)
  readonly MAX_POSTER_SIZE = 10 * 1024 * 1024; // 10MB
  readonly MAX_VIDEO_SIZE = 1024 * 1024 * 1024; // 1GB

  // File size formatting helper
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private uploadService: FileUploadService,
    private location: Location,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.initForm();

    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.movieId = Number(id);
      this.loadMovie(this.movieId);
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Cancel any in-progress uploads
    this.cancelPosterUpload();
    this.cancelVideoUpload();
  }

  initForm(): void {
    this.movieForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      releaseYear: ['', [Validators.required, Validators.min(1888), Validators.max(this.getCurrentYear() + 5)]],
      releaseDate: [null, [Validators.required]], // Date field
      director: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      genre: this.fb.array([], [Validators.required, Validators.minLength(1)]),
      duration: ['', [Validators.required, Validators.min(1), Validators.max(600)]],
      rating: ['', [Validators.required, Validators.min(0), Validators.max(10)]],
      posterUrl: [''],
      videoUrl: ['']
    });

    // Set validators based on URL/file choice
    this.updatePosterValidators();
    this.updateVideoValidators();

    // Update poster preview when URL changes
    this.movieForm.get('posterUrl')?.valueChanges.subscribe(url => {
      if (this.usePosterUrl && url && this.isValidUrl(url)) {
        this.posterPreview = url;
      } else if (this.usePosterUrl) {
        this.posterPreview = null;
      }
    });
  }

  updatePosterValidators(): void {
    const posterUrlControl = this.movieForm.get('posterUrl');

    if (this.usePosterUrl) {
      posterUrlControl?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
    } else {
      posterUrlControl?.clearValidators();
      if (this.uploadedPosterUrl) {
        posterUrlControl?.setValue(this.uploadedPosterUrl);
      }
    }

    posterUrlControl?.updateValueAndValidity();
  }

  updateVideoValidators(): void {
    const videoUrlControl = this.movieForm.get('videoUrl');

    if (this.useVideoUrl) {
      videoUrlControl?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
    } else {
      videoUrlControl?.clearValidators();
      if (this.uploadedVideoUrl) {
        videoUrlControl?.setValue(this.uploadedVideoUrl);
      }
    }

    videoUrlControl?.updateValueAndValidity();
  }

  onPosterInputTypeChange(useUrl: boolean): void {
    this.usePosterUrl = useUrl;
    this.updatePosterValidators();
    this.posterSizeError = false; // Reset error state when switching input types

    // Clear opposite input
    if (useUrl) {
      this.posterFile = null;
      this.posterFilePreview = null;
      this.cancelPosterUpload();
    } else {
      if (!this.uploadedPosterUrl) {
        this.movieForm.get('posterUrl')?.setValue('');
      }
      this.posterPreview = null;
    }
  }

  onVideoInputTypeChange(useUrl: boolean): void {
    this.useVideoUrl = useUrl;
    this.updateVideoValidators();
    this.videoSizeError = false; // Reset error state when switching input types

    // Clear opposite input
    if (useUrl) {
      this.videoFile = null;
      this.videoFileName = null;
      this.cancelVideoUpload();
    } else {
      if (!this.uploadedVideoUrl) {
        this.movieForm.get('videoUrl')?.setValue('');
      }
    }
  }

  onPosterFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.posterSizeError = false; // Reset error state

      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Please select an image file for the poster');
        return;
      }

      // Check file size
      if (file.size > this.MAX_POSTER_SIZE) {
        this.posterSizeError = true; // Set error state
        this.notificationService.error(`File size exceeds the limit of ${this.formatFileSize(this.MAX_POSTER_SIZE)}. Your file is ${this.formatFileSize(file.size)}.`);
        // Reset the file input
        fileInput.value = '';
        return;
      }

      this.posterFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.posterFilePreview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
        this.posterPreview = reader.result as string;
      };
      reader.readAsDataURL(file);

      // Start uploading
      this.uploadPosterFile(file);
    }
  }

  onVideoFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.videoSizeError = false; // Reset error state

      // Check if file is a video
      if (!file.type.startsWith('video/')) {
        this.notificationService.error('Please select a video file');
        return;
      }

      // Check file size
      if (file.size > this.MAX_VIDEO_SIZE) {
        this.videoSizeError = true; // Set error state
        this.notificationService.error(`File size exceeds the limit of ${this.formatFileSize(this.MAX_VIDEO_SIZE)}. Your file is ${this.formatFileSize(file.size)}.`);
        // Reset the file input
        fileInput.value = '';
        return;
      }

      this.videoFile = file;
      this.videoFileName = file.name;

      // Start uploading
      this.uploadVideoFile(file);
    }
  }

  uploadPosterFile(file: File): void {
    // Cancel any previous upload
    this.cancelPosterUpload();

    // Start new upload
    this.posterUploadId = 'poster_' + Date.now();
    const progress$ = this.uploadService.uploadFile(file, 'poster');

    const sub = progress$.subscribe(progress => {
      this.posterUploadProgress = progress;

      if (progress.state === 'DONE' && progress.uploadedUrl) {
        this.uploadedPosterUrl = progress.uploadedUrl;
        this.movieForm.get('posterUrl')?.setValue(progress.uploadedUrl);
        this.notificationService.success('Poster uploaded successfully');
      } else if (progress.state === 'ERROR') {
        this.notificationService.info(progress.error || 'Unknown error');
      }
    });

    this.subscriptions.push(sub);
  }

  uploadVideoFile(file: File): void {
    this.cancelVideoUpload();

    this.videoUploadId = 'video_' + Date.now();
    const progress$ = this.uploadService.uploadFile(file, 'video');

    const sub = progress$.subscribe(progress => {
      this.videoUploadProgress = progress;

      if (progress.state === 'DONE' && progress.uploadedUrl) {
        this.uploadedVideoUrl = progress.uploadedUrl;
        this.movieForm.get('videoUrl')?.setValue(progress.uploadedUrl);
        this.notificationService.success('Video uploaded successfully');
      } else if (progress.state === 'ERROR') {
        this.notificationService.info(progress.error || 'Unknown error');
      }
    });

    this.subscriptions.push(sub);
  }

  cancelPosterUpload(): void {
    if (this.posterUploadId) {
      this.uploadService.cancelUpload(this.posterUploadId);
      this.posterUploadId = null;
      this.posterUploadProgress = { state: 'PENDING', progress: 0 };
    }
  }

  cancelVideoUpload(): void {
    if (this.videoUploadId) {
      this.uploadService.cancelUpload(this.videoUploadId);
      this.videoUploadId = null;
      this.videoUploadProgress = { state: 'PENDING', progress: 0 };
    }
  }

  removePosterFile(): void {
    if (this.uploadedPosterUrl) {
      this.uploadService.deleteFile(this.uploadedPosterUrl).subscribe({
        next: (response) => {
          // this.notificationService.success('Poster file deleted from server');
        },
        error: (error) => {
          this.notificationService.error('Failed to delete poster from server: ' + error.message);
        }
      });
    }

    this.posterFile = null;
    this.posterFilePreview = null;
    this.posterPreview = null;
    this.cancelPosterUpload();
    this.uploadedPosterUrl = null;

    // Reset file input
    const fileInput = document.getElementById('posterFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  removeVideoFile(): void {
    if (this.uploadedVideoUrl) {
      // Delete the file from server
      this.uploadService.deleteFile(this.uploadedVideoUrl).subscribe({
        next: (response) => {
          // this.notificationService.success('Video file deleted from server');
        },
        error: (error) => {
          this.notificationService.error('Failed to delete video from server: ' + error.message);
        }
      });
    }

    this.videoFile = null;
    this.videoFileName = null;
    this.cancelVideoUpload();
    this.uploadedVideoUrl = null;

    // Reset file input
    const fileInput = document.getElementById('videoFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  loadMovie(id: number): void {
    this.loading = true;
    this.movieService.getMovie(id).subscribe({
      next: (movie) => {
        this.updateForm(movie);
        this.loading = false;
      },
      error: (err) => {
        this.notificationService.error('Failed to load movie: ' + err.message);
        this.loading = false;
        this.router.navigate(['/movies']);
      }
    });
  }

  updateForm(movie: Movie): void {
    // Set poster & video URLs
    if (movie.posterUrl) {
      this.usePosterUrl = true;
      this.posterPreview = movie.posterUrl;
    }

    if (movie.videoUrl) {
      this.useVideoUrl = true;
    }

    this.isComingSoon = !movie.releaseDate;

    this.movieForm.patchValue({
      title: movie.title,
      description: movie.description,
      director: movie.director,
      releaseYear: movie.releaseYear,
      releaseDate: movie.releaseDate ? new Date(movie.releaseDate) : null,
      duration: movie.duration,
      rating: movie.rating,
      posterUrl: movie.posterUrl,
      videoUrl: movie.videoUrl
    });

    // Clear and set genres
    const genreArray = this.movieForm.get('genre') as FormArray;
    genreArray.clear();

    if (movie.genre && Array.isArray(movie.genre)) {
      movie.genre.forEach(genre => {
        genreArray.push(this.fb.control(genre));
      });
    }

    // Update validators based on URL/file choice
    this.updatePosterValidators();
    this.updateVideoValidators();
  }

  get genreArray(): FormArray {
    return this.movieForm.get('genre') as FormArray;
  }

  addGenre(genre: string): void {
    if (!this.isGenreSelected(genre)) {
      this.genreArray.push(this.fb.control(genre));
    }
  }

  removeGenre(index: number): void {
    this.genreArray.removeAt(index);
  }

  isValidUrl(url: string): boolean {
    try {
      // Basic URL validation
      const validUrl = new URL(url);
      return validUrl.protocol === 'http:' || validUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  onSubmit(): void {
    if (this.posterUploadProgress.state === 'IN_PROGRESS' || this.videoUploadProgress.state === 'IN_PROGRESS') {
      this.notificationService.error('Please wait for uploads to complete before submitting the form');
      return;
    }

    this.submitted = true;

    if (this.movieForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.movieForm.controls).forEach(key => {
        const control = this.movieForm.get(key);
        control?.markAsTouched();
      });
      this.notificationService.error('Please fix the errors in the form before submitting.');
      return;
    }

    const movieData: Movie = this.prepareMovieData();
    this.submitMovie(movieData);
  }

  prepareMovieData(): Movie {
    // Get form values
    const formModel = this.movieForm.value;

    // Transform data if needed
    let releaseDate = null;
    if (!this.isComingSoon && formModel.releaseDate) {
      // Format date to ISO string
      releaseDate = new Date(formModel.releaseDate).toISOString().split('T')[0];
    }

    // Create the movie object
    const movie: Movie = {
      title: formModel.title,
      description: formModel.description,
      director: formModel.director,
      releaseYear: formModel.releaseYear,
      releaseDate: releaseDate,
      duration: formModel.duration,
      rating: formModel.rating,
      genre: formModel.genre,
      posterUrl: formModel.posterUrl,
      videoUrl: formModel.videoUrl
    };

    // Add ID if in edit mode
    if (this.isEditMode && this.movieId) {
      movie.id = this.movieId;
    }

    return movie;
  }

  submitMovie(movie: Movie): void {
    this.submitting = true;

    if (this.isEditMode && this.movieId) {
      // Update existing movie
      this.movieService.updateMovie(this.movieId, movie).subscribe({
        next: () => {
          this.notificationService.success('Movie updated successfully');
          this.submitting = false;
          this.router.navigate(['/movies']);
        },
        error: (err) => {
          this.notificationService.error('Failed to update movie: ' + err.message);
          this.submitting = false;
        }
      });
    } else {
      // Create new movie
      this.movieService.addMovie(movie).subscribe({
        next: () => {
          this.notificationService.success('Movie created successfully');
          this.submitting = false;
          this.router.navigate(['/movies']);
        },
        error: (err) => {
          this.notificationService.error('Failed to create movie: ' + err.message);
          this.submitting = false;
        }
      });
    }
  }

  goBack(): void {
    this.location.back();
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  isGenreSelected(genre: string): boolean {
    return this.genreArray.value.includes(genre);
  }

  toggleComingSoon(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.isComingSoon = checkbox.checked;

    const releaseDateControl = this.movieForm.get('releaseDate');

    if (this.isComingSoon) {
      // If "Coming Soon" is checked, clear and disable releaseDate
      releaseDateControl?.setValue(null);
      releaseDateControl?.clearValidators();
    } else {
      // If "Coming Soon" is unchecked, add required validator
      releaseDateControl?.setValidators([Validators.required]);
    }

    // Update the control
    releaseDateControl?.updateValueAndValidity();
  }

  getRatingDescription(rating: number): string {
    if (rating >= 9) return 'Masterpiece';
    if (rating >= 8) return 'Excellent';
    if (rating >= 7) return 'Very Good';
    if (rating >= 6) return 'Good';
    if (rating >= 5) return 'Average';
    if (rating >= 4) return 'Below Average';
    if (rating >= 3) return 'Poor';
    if (rating >= 2) return 'Very Poor';
    if (rating >= 1) return 'Terrible';
    return 'Not Rated';
  }

  // Added for template use
  submitted = false;
}
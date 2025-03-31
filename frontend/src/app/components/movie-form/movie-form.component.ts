import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MovieService } from '../../services/movie.service';
import { GenreService } from '../../services/genre.service';
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
  genreOptions: string[] = [];

  // Loading indicator for genres
  loadingGenres = false;

  // Set file size limits (in bytes)
  readonly MAX_POSTER_SIZE = 10 * 1024 * 1024; // 10MB
  readonly MAX_VIDEO_SIZE = 4096 * 1024 * 1024; // 1GB

  // File size formatting helper
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  // Track filenames returned from server
  posterFileName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private genreService: GenreService,
    private uploadService: FileUploadService,
    private location: Location,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadGenres();

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
      releaseDate: [null],
      director: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      genre: this.fb.array([], [Validators.required, Validators.minLength(1)]),
      duration: ['', [Validators.required, Validators.min(1), Validators.max(600)]],
      rating: ['', [Validators.required, Validators.min(0), Validators.max(10)]],
      posterUrl: [''],
      videoUrl: [''],
      posterUploadFile_url: [''],
      videoUploadFile_url: ['']
    });

    // Set validators based on URL/file choice
    this.updatePosterValidators();
    this.updateVideoValidators();

    // Set release date validators based on coming soon status
    this.updateReleaseDateValidators();

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
    }

    posterUrlControl?.updateValueAndValidity();
  }

  updateVideoValidators(): void {
    const videoUrlControl = this.movieForm.get('videoUrl');

    if (this.useVideoUrl) {
      videoUrlControl?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
    } else {
      videoUrlControl?.clearValidators();
    }

    videoUrlControl?.updateValueAndValidity();
  }

  updateReleaseDateValidators(): void {
    const releaseDateControl = this.movieForm.get('releaseDate');

    if (this.isComingSoon) {
      // If "Coming Soon" is checked, clear validators
      releaseDateControl?.clearValidators();
    } else {
      // If not coming soon, release date is required
      releaseDateControl?.setValidators([Validators.required]);
    }

    releaseDateControl?.updateValueAndValidity();
  }

  onPosterInputTypeChange(useUrl: boolean): void {
    this.usePosterUrl = useUrl;
    this.updatePosterValidators();
    this.posterSizeError = false; // Reset error state when switching input types

    // Clear opposite input
    if (useUrl) {
      // Switching to URL input
      // Don't clear file preview if we've uploaded something
      if (this.posterUploadProgress.state !== 'DONE') {
        this.posterFile = null;
        this.posterFilePreview = null;
      }
      this.cancelPosterUpload();
    } else {
      // Switching to File Upload input
      if (!this.uploadedPosterUrl) {
        this.movieForm.get('posterUrl')?.setValue('');
      }

      // Don't clear the poster preview if we're switching back to Upload
      // and we already have an uploaded file
      if (this.posterUploadProgress.state !== 'DONE') {
        this.posterPreview = null;
      }
    }
  }

  onVideoInputTypeChange(useUrl: boolean): void {
    this.useVideoUrl = useUrl;
    this.updateVideoValidators();
    this.videoSizeError = false;

    // Clear opposite input
    if (useUrl) {
      // Switching to URL input
      if (this.videoUploadProgress.state !== 'DONE') {
        this.videoFile = null;
        this.videoFileName = null;
      }
      this.cancelVideoUpload();
    } else {
      // Switching to File Upload input
      if (!this.uploadedVideoUrl) {
        this.movieForm.get('videoUrl')?.setValue('');
      }
    }
  }

  onPosterFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.posterSizeError = false;

      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Please select an image file for the poster');
        return;
      }

      if (file.size > this.MAX_POSTER_SIZE) {
        this.posterSizeError = true;
        this.notificationService.error(`File size exceeds the limit of ${this.formatFileSize(this.MAX_POSTER_SIZE)}. Your file is ${this.formatFileSize(file.size)}.`);

        fileInput.value = '';
        return;
      }

      this.posterFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.posterFilePreview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
        this.posterPreview = reader.result as string;
      };
      reader.readAsDataURL(file);

      this.uploadPosterFile(file);
    }
  }

  onVideoFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.videoSizeError = false;

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

      if (progress.state === 'DONE' && progress.filePath) {
        this.uploadedPosterUrl = progress.filePath;
        this.movieForm.get('posterUrl')?.setValue(null);
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

      if (progress.state === 'DONE' && progress.filePath) {
        this.uploadedVideoUrl = progress.filePath;
        this.movieForm.get('videoUrl')?.setValue(null);
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
          this.notificationService.success('Poster removed successfully');
        },
        error: (error) => {
          this.notificationService.error('Failed to delete poster from server: ' + error.message);
        },
        complete: () => {
          // Reset all poster-related states
          this.resetPosterState();
        }
      });
    } else {
      this.resetPosterState();
      this.notificationService.success('Poster removed');
    }
  }

  resetPosterState(): void {
    // Clear form values
    this.movieForm.get('posterUrl')?.setValue('');
    this.movieForm.get('posterUploadFile_url')?.setValue('');

    // Reset all state variables
    this.posterFile = null;
    this.posterFilePreview = null;
    this.posterPreview = null;
    this.posterFileName = null;
    this.cancelPosterUpload();
    this.uploadedPosterUrl = null;

    // Reset upload progress
    this.posterUploadProgress = { state: 'PENDING', progress: 0 };

    // Reset file input
    const fileInput = document.getElementById('posterFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  removeVideoFile(): void {
    if (this.uploadedVideoUrl) {
      // Delete the file from server
      this.uploadService.deleteFile(this.uploadedVideoUrl).subscribe({
        next: (response) => {
          this.notificationService.success('Video removed successfully');
          this.movieForm.get('videoUploadFile_url')?.setValue('');
          this.movieForm.get('videoUrl')?.setValue('');

        },
        error: (error) => {
          this.notificationService.error('Failed to delete video from server: ' + error.message);
          this.movieForm.get('videoUploadFile_url')?.setValue('');
          this.movieForm.get('videoUrl')?.setValue('');
        },
        complete: () => {
          // Reset all video-related states
          this.resetVideoState();
        }
      });
    } else {
      this.resetVideoState();
      this.notificationService.success('Video removed');
    }
  }

  resetVideoState(): void {
    // Clear form values
    this.movieForm.get('videoUrl')?.setValue('');
    this.movieForm.get('videoUploadFile_url')?.setValue('');

    // Reset all state variables
    this.videoFile = null;
    this.videoFileName = null;
    this.cancelVideoUpload();
    this.uploadedVideoUrl = null;

    // Reset upload progress
    this.videoUploadProgress = { state: 'PENDING', progress: 0 };

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
    this.isComingSoon = !movie.releaseDate;

    // Set poster & video URLs
    if (movie.posterUploadFile_url) {
      this.usePosterUrl = false;
      this.uploadedPosterUrl = movie.posterUrl;

      // Extract filename from path
      const posterPath = movie.posterUploadFile_url || '';
      this.posterFileName = posterPath.split('/').pop() || 'Uploaded poster';

      this.posterFilePreview = this.sanitizer.bypassSecurityTrustUrl(movie.posterUrl);
      this.posterPreview = movie.posterUrl;

      this.posterUploadProgress = {
        state: 'DONE',
        progress: 100,
        uploadedUrl: movie.posterUrl,
        filename: this.posterFileName
      };
    } else if (movie.posterUrl) {
      this.usePosterUrl = true;
      this.posterPreview = movie.posterUrl;
    }

    if (movie.videoUploadFile_url) {
      this.useVideoUrl = false;
      this.uploadedVideoUrl = movie.videoUrl;

      const videoPath = movie.videoUploadFile_url || '';
      this.videoFileName = videoPath.split('/').pop() || 'Uploaded video';

      this.videoUploadProgress = {
        state: 'DONE',
        progress: 100,
        uploadedUrl: movie.videoUrl,
        filename: this.videoFileName
      };
    } else if (movie.videoUrl) {
      this.useVideoUrl = true;
    }

    this.movieForm.patchValue({
      title: movie.title,
      description: movie.description,
      director: movie.director,
      releaseYear: movie.releaseYear,
      releaseDate: movie.releaseDate ? new Date(movie.releaseDate) : null,
      duration: movie.duration,
      rating: movie.rating,
      posterUrl: this.usePosterUrl ? movie.posterUrl : '',
      videoUrl: this.useVideoUrl ? movie.videoUrl : '',
      posterUploadFile_url: '',
      videoUploadFile_url: ''
    });

    this.updateReleaseDateValidators();

    const genreArray = this.movieForm.get('genre') as FormArray;
    genreArray.clear();

    if (movie.genre && Array.isArray(movie.genre)) {
      movie.genre.forEach(genre => {
        genreArray.push(this.fb.control(genre));
      });
    } else if (movie.genres && Array.isArray(movie.genres)) {
      movie.genres.forEach(genreObj => {
        genreArray.push(this.fb.control(genreObj.name));
      });
    }

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

    if ((this.usePosterUrl && (!this.movieForm.get('posterUrl')?.value || this.movieForm.get('posterUrl')?.value.trim() === '')) ||
      (!this.usePosterUrl && !this.uploadedPosterUrl)) {
      this.notificationService.info('A movie poster is required. Please provide a poster image by URL or upload.');
      return;
    }

    this.submitted = true;
    if (this.movieForm.invalid) {
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
    const formModel = this.movieForm.value;

    let releaseDate = null;
    if (!this.isComingSoon && formModel.releaseDate) {
      releaseDate = new Date(formModel.releaseDate).toISOString().split('T')[0];
    }
    let posterUploadPath: string | null = null;
    let videoUploadPath: string | null = null;

    if (this.uploadedPosterUrl) {
      const match = this.uploadedPosterUrl.match(/\/media\/(.+)/);
      posterUploadPath = match ? match[1] : this.uploadedPosterUrl;
    }

    if (this.uploadedVideoUrl) {
      const match = this.uploadedVideoUrl.match(/\/media\/(.+)/);
      videoUploadPath = match ? match[1] : this.uploadedVideoUrl;
    }

    const movie: Partial<Movie> = {
      title: formModel.title,
      description: formModel.description,
      director: formModel.director,
      releaseYear: formModel.releaseYear,
      releaseDate: releaseDate,
      duration: formModel.duration,
      rating: formModel.rating,
      genre: formModel.genre,
    };

    if (this.usePosterUrl) {
      movie.posterUrl = formModel.posterUrl;
      movie.posterUploadFile_url = null;
    } else {
      movie.posterUrl = '';

      movie.posterUploadFile_url = posterUploadPath;
    }

    if (this.useVideoUrl) {
      movie.videoUrl = formModel.videoUrl;
      movie.videoUploadFile_url = null;
    } else {
      movie.videoUrl = '';

      movie.videoUploadFile_url = videoUploadPath;
    }

    if (this.isEditMode && this.movieId) {
      movie.id = this.movieId;
    }

    return movie as Movie;
  }

  submitMovie(movie: Movie): void {
    this.submitting = true;

    if (this.isEditMode && this.movieId) {
      console.log("edit movide data", movie)
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

      console.log("add movide data", movie)
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

    this.updateReleaseDateValidators();
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

  submitted = false;

  loadGenres(): void {
    this.loadingGenres = true;

    const genreSub = this.genreService.getAllGenres().subscribe({
      next: (genres) => {
        this.genreOptions = genres.map(genre => genre.name);
        this.loadingGenres = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to load genres: ' + error.message);
        this.loadingGenres = false;

        this.genreOptions = [
          'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
          'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror',
          'Music', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Sport',
          'Thriller', 'War', 'Western'
        ];
      }
    });

    this.subscriptions.push(genreSub);
  }
}